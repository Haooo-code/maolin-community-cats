import {cats,loadState,storageKey,uid,safeImage} from './data.js';

const emptyState=()=>({version:1,nickname:'一位社区邻居',follows:[],posts:[],records:[],cats:[],opportunities:[],teams:[]});
const seedCatalog=()=>cats.map(cat=>({...cat,isDemo:true}));
export function normalizeCatalog(value){
 if(!Array.isArray(value)||value.length>1000)throw new Error('猫咪档案格式不完整，请刷新后重试。');
 const ids=new Set();
 return value.map(cat=>{
  if(!cat||typeof cat.id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(cat.id)||ids.has(cat.id)||typeof cat.name!=='string'||!cat.name.trim()||!safeImage(cat.photo))throw new Error('猫咪档案格式不完整，请刷新后重试。');
  ids.add(cat.id);const result={id:cat.id,photo:cat.photo,isDemo:cat.isDemo===true};
  for(const field of ['name','color','description','character','area','sex','age','neutered']){if(cat[field]!==undefined&&typeof cat[field]!=='string')throw new Error('猫咪档案格式不完整，请刷新后重试。');result[field]=cat[field]||'暂未填写';}
  return result;
 });
}
export function normalizeHub(value,kind){
 if(value===undefined)return [];
 if(!Array.isArray(value)||value.length>1000)throw new Error('照护信息格式不完整，请刷新后重试。');
 return value.map(item=>{
  const title=kind==='teams'?'name':'title';
  if(!item||typeof item.id!=='string'||typeof item[title]!=='string'||!item[title].trim()||typeof item.description!=='string'||typeof item.contact!=='string')throw new Error('照护信息格式不完整，请刷新后重试。');
  const fields=kind==='teams'?['id','name','kind','description','services','needs','contact','author']:['id','title','kind','description','contact','when','area','catId','status','author'];
  const result={};for(const field of fields){if(item[field]!==undefined&&typeof item[field]!=='string')throw new Error('照护信息格式不完整，请刷新后重试。');result[field]=item[field]||'';}
  Object.assign(result,{time:Number(item.time)||0,updatedAt:Number(item.updatedAt)||0,mine:item.mine===true});
  if(kind==='teams'){if(!Array.isArray(item.catIds)||item.catIds.some(id=>typeof id!=='string'))throw new Error('照护团队关联信息不正确。');result.catIds=[...item.catIds];result.active=item.active!==false;}
  return result;
 });
}
const clone=value=>JSON.parse(JSON.stringify(value));

/** Shared commands never send a client-owned copy of the community state. */
export function createCommunityStore({fetcher=(...args)=>fetch(...args),storage,location=globalThis.location,onChange=()=>{},timeout=20000}={}){
 const state=emptyState();
 const runtime={status:'loading',shared:false,recognitionEnabled:true,registrationAllowed:false,authRequiredForWrites:false,error:'',sessionExpired:false,account:{authenticated:false,username:'',canClaimGuest:false,guestPostCount:0,guestRecordCount:0},recoveryCode:'',accountNotice:''};
 let authPending=false;
 let readGeneration=0,initializing;
 const pending=new Set();
 const replace=data=>{for(const key of Object.keys(state))delete state[key];Object.assign(state,data);};
 const notify=()=>onChange();
 async function request(path,body){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{
   const response=await fetcher(path,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});
   const data=await response.json().catch(()=>null);
   if(!response.ok){const error=new Error(response.status===401&&!data?.accountRequired&&!path.startsWith('/api/auth/')?'试用访问已过期，请重新输入分享口令。':typeof data?.error==='string'?data.error:'共享服务暂不可用，请稍后重试。');error.status=response.status;error.accountRequired=data?.accountRequired===true;error.uncertain=body!==undefined&&(data?.uncertain===true||response.status>=500);throw error;}
   if(!data||typeof data!=='object')throw new Error('共享服务返回了无法读取的数据，请重试。');
   return data;
  }catch(error){
   if(body!==undefined&&(!error.status||error.uncertain))error.uncertain=true;
   if(error.name==='AbortError'){const timeoutError=new Error('连接等待超时，请重试。');timeoutError.uncertain=error.uncertain;throw timeoutError;}
   throw error;
  }
  finally{clearTimeout(timer);}
 }
 function failed(error){runtime.error=error.message||'共享服务连接失败，请检查网络后重试。';runtime.sessionExpired=error.status===401&&!error.accountRequired;if(error.accountRequired){Object.assign(runtime.account,{authenticated:false,username:''});runtime.recoveryCode='';replace(emptyState());}}
 async function refresh({silent=false}={}){
  if(!runtime.shared||runtime.status==='loading')return;
  const generation=++readGeneration;
  try{
   const account=runtime.authRequiredForWrites?await request('/api/auth/session'):null;
   if(account&&generation===readGeneration&&(account.username!==runtime.account.username||account.authenticated!==runtime.account.authenticated)){runtime.recoveryCode='';replace(emptyState());Object.assign(runtime.account,account);}
   const data=await request('/api/community/state');
   if(data.mode!=='shared'||typeof data.nickname!=='string'||!Array.isArray(data.follows)||!Array.isArray(data.posts)||!Array.isArray(data.records)||!Array.isArray(data.cats))throw new Error('共享数据格式不完整，请重试。');
   if(generation===readGeneration){if(account)Object.assign(runtime.account,account);replace({version:1,nickname:data.nickname,follows:data.follows,posts:data.posts,records:data.records,cats:normalizeCatalog(data.cats),opportunities:normalizeHub(data.opportunities,'opportunities'),teams:normalizeHub(data.teams,'teams')});runtime.status='ready';runtime.error='';runtime.sessionExpired=false;if(!silent)notify();}
  }catch(error){if(generation===readGeneration){failed(error);if(runtime.status!=='ready')runtime.status='error';if(!silent)notify();}throw error;}
 }
 async function initialize(){
  if(initializing)return initializing;
  initializing=(async()=>{
   runtime.status='loading';runtime.error='';notify();
   try{
    let config;
    if(true)config={shared:false,registrationAllowed:false,recognitionEnabled:false}; // Standalone showcase: no backend calls
    else{
     try{config=await request('/api/runtime');}
     catch(error){if(error.status===404&&['127.0.0.1','localhost'].includes(location.hostname)&&location.port==='4317')config={shared:false,registrationAllowed:true};else throw error;}
    }
    if(typeof config.shared!=='boolean')throw new Error('无法确认社区运行模式，请重试。');
    runtime.shared=config.shared;runtime.recognitionEnabled=config.recognitionEnabled!==false;runtime.authRequiredForWrites=config.authRequiredForWrites===true;runtime.registrationAllowed=config.registrationAllowed===true||(!config.shared&&config.registrationAllowed!==false);
    if(config.shared){replace(emptyState());runtime.status='connecting';await refresh();}
    else{const saved=loadState();replace({...saved,cats:normalizeCatalog(saved.cats||seedCatalog()),opportunities:normalizeHub(saved.opportunities,'opportunities'),teams:normalizeHub(saved.teams,'teams')});runtime.status='ready';notify();}
   }catch(error){runtime.status='error';failed(error);notify();}
   finally{initializing=null;}
  })();
  return initializing;
 }
 function localHub(kind,payload){
  const collection=state[kind],existing=payload.id?collection.find(item=>item.id===payload.id):null;
  if(payload.id&&(!existing||!existing.mine))throw new Error('只能修改自己发布的内容。');
  const merged={...existing,...payload},team=kind==='teams',limits=team?{name:60,description:2000,contact:300,services:600,needs:600}:{title:80,description:2000,contact:300,when:120,area:120,catId:80};
  const result={};for(const [field,max] of Object.entries(limits)){const value=merged[field]??'';if(typeof value!=='string'||value.length>max)throw new Error('请检查填写内容的长度和格式。');result[field]=value.trim();}
  if(!result[team?'name':'title']||!result.description||!result.contact)throw new Error('请填写名称、具体介绍和联系方法。');
  result.kind=merged.kind||(team?'individual':'help');if(!(team?['individual','community','rescue']:['help','activity']).includes(result.kind))throw new Error('类型不正确。');
  if(team){if(merged.active!==undefined&&typeof merged.active!=='boolean')throw new Error('展示状态不正确。');result.active=merged.active!==false;const ids=merged.catIds||[];if(!Array.isArray(ids)||ids.length>1000||ids.some(id=>!state.cats.some(cat=>cat.id===id)))throw new Error('请选择已有档案中的猫咪。');result.catIds=[...new Set(ids)];}
  else{result.status=merged.status||'open';if(!['open','closed'].includes(result.status))throw new Error('状态不正确。');if(result.catId&&!state.cats.some(cat=>cat.id===result.catId))throw new Error('请选择已有档案中的猫咪。');}
  Object.assign(result,{id:existing?.id||uid(),author:existing?.author||state.nickname,mine:true,time:existing?.time||Date.now(),updatedAt:Date.now()});
  if(existing)collection.splice(collection.indexOf(existing),1,result);else collection.unshift(result);return {id:result.id};
 }
 function applyLocal(kind,payload){
  if(['opportunities','teams'].includes(kind))return localHub(kind,payload);
  if(kind==='cats'){
   const name=typeof payload.name==='string'?payload.name.trim():'';if(!name||name.length>40||!safeImage(payload.image)||!payload.image.startsWith('data:image/'))throw new Error('请填写猫咪名字并选择照片。');
   const cat={id:uid(),name,photo:payload.image,isDemo:false};
   for(const field of ['color','description','character','area','sex','age','neutered'])cat[field]=typeof payload[field]==='string'&&payload[field].trim()?payload[field].trim():'暂未填写';
   state.cats.unshift(cat);return {catId:cat.id};
  }
  if(kind==='posts')state.posts.unshift({id:uid(),author:state.nickname,avatar:'#dde4bc',...payload,time:Date.now(),likes:0,liked:false,mine:true,comments:[]});
  else if(kind==='records')state.records.unshift({id:uid(),...payload,actor:state.nickname,mine:true});
  else if(kind==='profile')Object.assign(state,payload);
  else{
   const post=state.posts.find(item=>item.id===payload.postId);if(!post)throw new Error('这条动态已不可用，请刷新后重试。');
   if(kind==='comments')post.comments.push({id:uid(),author:state.nickname,text:payload.text,time:Date.now(),mine:true});
   if(kind==='likes'){post.likes=Math.max(0,(Number(post.likes)||0)+(payload.liked===Boolean(post.liked)?0:payload.liked?1:-1));post.liked=payload.liked;}
  }
 }
 async function command(kind,payload){
  if(!['cats','posts','records','comments','likes','profile','opportunities','teams'].includes(kind))throw new Error('不支持这项操作。');
  if(runtime.status!=='ready')throw new Error('社区尚未连接，请连接成功后再提交。');
  if(runtime.shared&&runtime.authRequiredForWrites&&!runtime.account.authenticated){const error=new Error('登录后即可保存关注、发布动态和记录照护。请到“我的”登录或注册。');error.accountRequired=true;throw error;}
  const key=kind+':'+(payload.postId||payload.id||'');
  if(pending.has(key))throw new Error('正在保存，请勿重复提交。');
  pending.add(key);
  try{
   let result;
   if(runtime.shared){
    result=await request('/api/community/'+kind,payload);
    try{await refresh({silent:true});}catch(error){error.committed=true;error.message='提交已完成，但刷新失败。请刷新社区核对，勿重复提交。'+(error.status===401?'请重新登录。':'');throw error;}
   }else{
    const before=clone(state);
    try{result=applyLocal(kind,payload);(storage||globalThis.localStorage).setItem(storageKey,JSON.stringify(state));}
    catch(error){replace(before);throw new Error(error.message==='这条动态已不可用，请刷新后重试。'?error.message:'浏览器存储空间不足或不可用，未能保存。请减少照片大小或先导出记录。');}
   }
   return result;
  }catch(error){
   if(runtime.shared){
    if(error.uncertain&&['cats','posts','records','comments','opportunities','teams'].includes(kind)){error.committed=true;error.message='可能已保存，请先刷新核对，勿重复提交。';}
    failed(error);
   }
   throw error;
  }
  finally{pending.delete(key);}
 }
 async function accountCommand(action,payload={}){
  if(!runtime.shared||!runtime.authRequiredForWrites)throw new Error('当前模式不使用云端账号。');
  if(!['signup','login','recover','logout','claim','recovery-code'].includes(action))throw new Error('不支持这项账号操作。');
  if(authPending)throw new Error('账号操作正在处理，请稍候。');
  authPending=true;runtime.accountNotice='';
  try{
   const result=await request('/api/auth/'+action,payload);
   // Never keep a previous identity's personal flags after an account transition.
   ++readGeneration;replace(emptyState());
   if(action==='logout'){runtime.recoveryCode='';Object.assign(runtime.account,{authenticated:false,username:''});}
   else if(result.account){if(action!=='claim')runtime.recoveryCode='';Object.assign(runtime.account,result.account);}
   if(typeof result.recoveryCode==='string')runtime.recoveryCode=result.recoveryCode;
   runtime.accountNotice=result.claimWarning||'';
   try{await refresh({silent:true});}
   catch{runtime.accountNotice+=' 账号操作已完成，但记录刷新失败。请点击“刷新共享记录”核对。';}
   notify();return result;
  }catch(error){
   if(error.uncertain){
    // A lost auth response might have changed the cookie; reconcile identity,
    // never automatically repeat signup, recovery or a guest-data transfer.
    ++readGeneration;replace(emptyState());runtime.recoveryCode='';Object.assign(runtime.account,{authenticated:false,username:''});
    try{await refresh({silent:true});}catch{}
    error.message='未能确认账号操作结果。请先尝试登录或刷新核对；恢复码未显示时，可在登录后重新生成。';runtime.accountNotice=error.message;
    notify();
   }
   throw error;
  }finally{authPending=false;}
 }
 return {state,runtime,initialize,refresh,command,accountCommand};
}

/** Keep the mounted draft and block duplicate submits through the whole request. */
export async function submitDraft(form,errorElement,save,onSuccess){
 if(form.dataset.pending==='true'||form.dataset.committed==='true')return false;
 form.dataset.pending='true';form.setAttribute('aria-busy','true');
 const controls=[...form.querySelectorAll('button,input,textarea,select')],disabled=controls.map(control=>control.disabled);
 controls.forEach(control=>control.disabled=true);errorElement.textContent='';
 try{await save();await onSuccess();return true;}
 catch(error){errorElement.textContent=error.message||'未能保存，请稍后重试。';if(error.committed)form.dataset.committed='true';return false;}
 finally{form.dataset.pending='false';form.setAttribute('aria-busy','false');controls.forEach((control,index)=>control.disabled=disabled[index]||(form.dataset.committed==='true'&&control.type==='submit'));}
}
