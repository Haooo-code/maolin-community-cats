import {readPhoto,exactTime,safeImage} from './data.js';

const signatures=new Map();
async function signature(src){
 if(signatures.has(src))return signatures.get(src);
 const img=new Image();img.src=src;await img.decode();
 const c=document.createElement('canvas');c.width=9;c.height=8;
 const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,9,8);
 const d=g.getImageData(0,0,9,8).data,hash=[],rgb=[0,0,0];let n=0;
 for(let y=0;y<8;y++)for(let x=0;x<9;x++){
  const a=(y*9+x)*4;for(let k=0;k<3;k++)rgb[k]+=d[a+k];n++;
  if(x<8){const b=a+4;hash.push(d[a]*.299+d[a+1]*.587+d[a+2]*.114>d[b]*.299+d[b+1]*.587+d[b+2]*.114);}
 }
 const result={hash,rgb:rgb.map(v=>v/n)};
 if(!src.startsWith('data:'))signatures.set(src,result);
 return result;
}
export async function findCandidate(src,cats){
 const input=await signature(src);
 const scored=await Promise.all(cats.map(async cat=>{
  const s=await signature(cat.photo),h=s.hash.reduce((v,b,i)=>v+(b!==input.hash[i]),0);
  const color=Math.sqrt(s.rgb.reduce((v,b,i)=>v+(b-input.rgb[i])**2,0));
  return {cat,h,color,score:h+color/8};
 }));
 scored.sort((a,b)=>a.score-b.score);
 const best=scored[0];return best&&best.h<=10&&best.color<=45?best.cat:null;
}
function apiBase(){
 if(location.protocol==='file:')return null;
 return location.origin+'/api/recognition';
}
async function request(base,path,body){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),body?30000:3500);
 try{
  const response=await fetch(base+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:controller.signal,cache:'no-store',credentials:'same-origin'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const error=new Error('识别请求未完成');error.status=response.status;throw error;}
  return data;
 }finally{clearTimeout(timer);}
}
export function renderRecognition(root,ctx){
 if(ctx.runtime?.recognitionEnabled===false)return renderManualRecognition(root,ctx);
 const base=apiBase(),offline=!base,registrationAllowed=ctx.runtime?.registrationAllowed!==false;
 root.innerHTML=`<section class="page-intro scan-intro"><div><h1 class="display">先认一认，<br><em>再决定要不要喂。</em></h1><p>上传照片，查找猫咪档案和最近喂养记录。</p></div><div class="scan-method" role="status"><div class="engine-label">${ctx.icon('camera',20)} <strong id="scan-engine">${offline?'免安装版 · 图片相似度演示':'正在连接 MeowID…'}</strong></div><p id="scan-engine-detail">${offline?'本地双击版不会运行 AI 模型。':'模型只提供身份候选，仍需你确认。'}</p><button type="button" class="text-button" id="retry-service" ${offline?'hidden':''}>重新连接识别服务 ${ctx.icon('arrow',16)}</button></div></section>
 <div class="scan-layout"><section class="upload-zone"><div id="scan-preview" class="scan-preview"><div class="scan-corners">${ctx.icon('camera',54)}</div><h2>拍照或上传猫咪照片</h2><p>看看眼前这位，是哪位小邻居。</p></div><div class="scan-buttons"><button class="button upload-button" type="button" id="choose-photo">${ctx.icon('image')} 选择猫咪照片</button><input id="scan-file" type="file" accept="image/jpeg,image/png,image/webp" hidden><button class="button secondary" type="button" id="sample-scan">使用示例照片</button><button class="text-button" type="button" id="retry-scan" hidden>重试这张照片 ${ctx.icon('arrow',16)}</button></div><p class="small muted scan-upload-note">JPG、PNG、WebP · 每张不超过 10MB<br>${offline?'照片在当前浏览器内处理。':'照片由本机识别服务处理，不保存上传原图。'}</p><p id="scan-status" role="status" class="small"></p></section>
 <section id="scan-result" class="scan-result"><div class="empty-state"><span class="empty-icon">${ctx.icon('paw',42)}</span><h2>从一次认出开始</h2><p>确认猫咪后，查看邻居留下的喂养记录。<br>没有可靠匹配时，也可以手动查找。</p><button id="manual-start" class="button secondary small">手动选择猫咪 ${ctx.icon('arrow',16)}</button></div></section></div>
 <details class="scan-enroll" id="scan-enroll" ${offline||!registrationAllowed?'hidden':''}><summary><span>补充识别用的参考照片<small>适合认识这些猫咪的照护者</small></span>${ctx.icon('plus',20)}</summary><div class="enroll-content"><div><h2>让它下次更容易被认出</h2><p class="small muted">先核实身份，再添加同一只猫不同角度的照片。当前演示图库包含生成示例图。新增档案不会自动登记为识别参考照。</p><p id="scan-gallery" class="small muted">正在读取参考图库…</p><p class="small muted">登记会向本机参考库追加特征。本页暂不支持撤回，请在提交前核对；上传原图不会保存。</p></div><form id="scan-enroll-form"><fieldset class="choice-field"><legend>照片属于哪只猫咪？</legend>${ctx.cats.map(c=>`<label class="cat-choice"><input type="radio" name="enroll-cat" value="${ctx.escape(c.id)}" required><img src="${ctx.escape(safeImage(c.photo)?c.photo:'')}" alt=""><span>${ctx.escape(c.name)}</span></label>`).join('')}</fieldset><label class="form-field">选择 1–5 张参考照片<input id="enroll-files" type="file" accept="image/jpeg,image/png,image/webp" multiple required></label><p id="enroll-selection" class="small muted" aria-live="polite">还未选择照片</p><label class="check-field"><input id="enroll-check" type="checkbox" required><span>我已核对：照片都属于所选猫咪</span></label><button class="button secondary" type="submit" id="enroll-submit">登记参考照片</button><p id="enroll-status" class="small" role="status"></p></form></div></details>
 <aside class="scan-footnote">${ctx.icon('clock',20)} <p>照片不能告诉我们猫咪是否吃过。这里展示的是有来源和时间的记录；有记录不等于当前饱腹，无记录也不代表未被喂养。${ctx.runtime?.shared?'当前显示云端共享喂养记录，可使用页面顶部的刷新按钮更新。':'当前喂养记录仍保存在各自浏览器，未实现邻居之间实时同步。'}</p></aside>`;
 const result=root.querySelector('#scan-result'),status=root.querySelector('#scan-status'),input=root.querySelector('#scan-file');
 const engine=root.querySelector('#scan-engine'),detail=root.querySelector('#scan-engine-detail');
 const enroll=root.querySelector('#scan-enroll'),galleryText=root.querySelector('#scan-gallery');
 const choose=root.querySelector('#choose-photo'),retry=root.querySelector('#retry-scan'),retryService=root.querySelector('#retry-service');
 let busy=false,aiReady=false,enrolling=false,lastPhoto=null,healthChecks=0,healthTimer;
 const live=()=>root.querySelector('#scan-status')===status;
 const focusResult=()=>{const heading=result.querySelector('h2');if(heading){heading.tabIndex=-1;heading.focus();}};
 const controls=()=>{input.disabled=busy||enrolling||(!offline&&!aiReady);choose.disabled=input.disabled;root.querySelector('#sample-scan').disabled=input.disabled;retry.disabled=input.disabled;root.querySelector('#enroll-submit').disabled=busy||enrolling||!aiReady||!registrationAllowed;root.querySelector('#scan-enroll-form').setAttribute('aria-busy',String(enrolling));root.querySelector('#enroll-files').disabled=busy||enrolling;root.querySelector('#enroll-check').disabled=busy||enrolling;root.querySelectorAll('[name="enroll-cat"]').forEach(radio=>radio.disabled=busy||enrolling);};
 const manual=()=>{
  result.innerHTML=`<h2>选择你认识的猫咪</h2><p class="muted small">请核对照片与辨认特征，再查看记录。新档案未登记识别参考照时，请在这里手动选择。</p><div class="manual-cats">${ctx.cats.map(c=>`<button class="cat-mini" data-pick="${ctx.escape(c.id)}"><img src="${ctx.escape(safeImage(c.photo)?c.photo:'')}" alt="${ctx.escape(c.name)}"><span>${ctx.escape(c.name)}<small>${ctx.escape(c.color)}</small></span>${ctx.icon('arrow',16)}</button>`).join('')}</div>`;
  result.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>showRecords(ctx.cats.find(c=>c.id===b.dataset.pick)));
  focusResult();
 };
 const showRecords=cat=>{
  if(!cat)return manual();
  const records=ctx.state.records.filter(r=>r.catId===cat.id&&r.type==='feeding').sort((a,b)=>b.time-a.time);
  result.innerHTML=`<div class="scan-cat"><img src="${ctx.escape(safeImage(cat.photo)?cat.photo:'')}" alt="${ctx.escape(cat.name)}"><div><span class="small muted">已由你确认的猫咪</span><h2>${ctx.escape(cat.name)}</h2><button class="text-button" id="scan-cat-profile">查看完整档案 ${ctx.icon('arrow',15)}</button></div></div><div class="section-title"><h3>最近喂养记录</h3><button class="text-button" id="change-cat">重新选择</button></div><div class="timeline">${records.length?records.slice(0,5).map(r=>`<article class="timeline-item"><span class="timeline-dot"></span><time>${ctx.escape(exactTime(r.time))}</time><h4>${ctx.escape(r.amount||r.detail)}</h4><p>${ctx.escape(r.actor)}${r.mine?' · 我记录的':ctx.runtime?.shared?' · 邻居共享记录':' · 示例记录'}</p><p class="small">${ctx.escape(r.detail)}</p></article>`).join(''):`<div class="empty-state compact"><p>还没有可查询的喂养记录。</p><p class="small">这不代表它没有被喂过，可先联系熟悉它的照护者。</p></div>`}</div><button class="button" id="scan-record">${ctx.icon('bowl')} 我刚刚喂过，记一下</button><p class="small muted">${ctx.runtime?.shared?'云端共享记录来自邻居提交；查看或识别不会自动增加记录。':'本机体验记录不与其他居民同步；查看或识别不会自动增加记录。'}</p>`;
  result.querySelector('#scan-cat-profile').onclick=()=>ctx.openCat(cat.id);
  result.querySelector('#change-cat').onclick=manual;
  result.querySelector('#scan-record').onclick=()=>ctx.openRecord('feeding',cat.id);
  focusResult();
 };
 const showCandidates=(matches,source)=>{
  const candidates=matches.filter(m=>m&&ctx.cats.some(c=>c.id===m.catId)&&Number.isFinite(Number(m.score))).slice(0,3);
  if(!candidates.length){
   result.innerHTML=`<div class="empty-state"><h2>暂时无法确定是哪只猫</h2><p>可能还没有登记足够的参考照片。请人工核对，或稍后补充参考照片。</p><button class="button secondary" id="manual-fallback">手动查找猫咪</button></div>`;
   result.querySelector('#manual-fallback').onclick=manual;focusResult();return;
  }
  result.innerHTML=`<h2>是你遇见的那只吗？</h2><p class="small muted">${source==='ai'?'MeowID 给出的相似候选':'图片外观比较候选'} · 排名不等于确认</p><div class="candidate-list">${candidates.map(m=>{const cat=ctx.cats.find(c=>c.id===m.catId);return `<article class="candidate-row"><img src="${ctx.escape(safeImage(cat.photo)?cat.photo:'')}" alt="${ctx.escape(cat.name)}"><div><h3>${ctx.escape(cat.name)}</h3><p class="small muted">${ctx.escape(cat.color)} · ${source==='ai'?(m.route==='face'?'面部线索':'全身线索'):'离线演示'}</p></div><button class="button secondary small" data-confirm="${ctx.escape(cat.id)}">确认是${ctx.escape(cat.name)}</button></article>`;}).join('')}</div><p class="small muted">候选可能认错，尤其是相似花色、角度变化或尚未登记的猫。请自己核对。</p><button class="text-button" id="wrong-cat">都不是，手动查找 ${ctx.icon('arrow',15)}</button>`;
  result.querySelectorAll('[data-confirm]').forEach(b=>b.onclick=()=>showRecords(ctx.cats.find(c=>c.id===b.dataset.confirm)));
  result.querySelector('#wrong-cat').onclick=manual;
  focusResult();
 };
 const refreshHealth=async()=>{
  if(!base||!live())return;clearTimeout(healthTimer);retryService.disabled=true;
  try{
   const health=await request(base,'/health');if(!live())return;
   aiReady=health.state==='ready';
   engine.textContent=aiReady?'MeowID · 本机 AI 识别':health.state==='loading'?'MeowID 模型加载中':'MeowID 暂不可用';
   detail.textContent=aiReady?'提供身份候选，需由你确认。':health.state==='loading'?'稍等片刻再拍照识别。':'当前可手动选猫，或试用图片比较演示。';
   enroll.hidden=!aiReady||!registrationAllowed;
   if(aiReady){
    const entries=Array.isArray(health.gallery)?health.gallery:[];
    galleryText.textContent=entries.length?'已登记：'+entries.map(item=>`${ctx.cats.find(c=>c.id===item.catId)?.name||item.catId} ${item.referenceCount||0} 张${item.source==='demo_generated'?'（含演示生成图）':''}`).join('、'):'图库还没有照片，请先登记参考照片。';
   }else if(health.state==='loading'){
    if(++healthChecks<12)healthTimer=setTimeout(refreshHealth,1700);
    else detail.textContent='模型加载比预期慢。可以重新连接，或先手动选择猫咪。';
   }
   retryService.hidden=aiReady;
  }catch{if(!live())return;aiReady=false;engine.textContent='AI 识别服务未连接';detail.textContent='请启动本机 AI 网站后重连，也可以先手动选择猫咪。';enroll.hidden=true;retryService.hidden=false;}
  finally{if(live()){retryService.disabled=false;controls();}}
 };
 const scan=async src=>{
  if(busy||enrolling)return;
  if(!offline&&!aiReady){status.textContent='AI 服务尚未连接，请先重新连接或手动选择猫咪。';return;}
  busy=true;lastPhoto=src;retry.hidden=true;controls();result.setAttribute('aria-busy','true');result.inert=true;
  const usingAi=aiReady&&base;status.textContent=usingAi?'MeowID 正在识别，请稍候…':'正在进行图片相似度演示…';
  root.querySelector('#scan-preview').innerHTML=`<img class="uploaded-cat" src="${ctx.escape(src)}" alt="本次选择的猫咪照片">`;
  try{
   if(usingAi){const response=await request(base,'/search',{image:src});if(!live())return;
    status.textContent=response.status==='empty_gallery'?'参考图库为空。':'模型已返回候选，请人工核对。';
    result.inert=false;showCandidates(Array.isArray(response.matches)?response.matches:[],'ai');
   }else{const cat=await findCandidate(src,ctx.cats);if(!live())return;
    status.textContent='图片相似度演示完成；这不是 AI 个体识别。';
    result.inert=false;showCandidates(cat?[{catId:cat.id,score:1,route:'body'}]:[],'offline');
   }
  }catch(error){if(!live())return;status.textContent=error.name==='AbortError'?'这次识别等待超时，照片已保留。可重试这张照片，或手动选择。':error.status===503?'识别服务正忙，照片已保留。稍后可重试，或手动选择。':'这张照片暂未完成识别，照片已保留。请重试或手动选择。';retry.hidden=false;result.inert=false;manual();}
  finally{busy=false;if(live()){controls();result.inert=false;result.setAttribute('aria-busy','false');}}
 };
 input.onchange=async()=>{if(!input.files[0])return;try{await scan(await readPhoto(input.files[0]));}catch(e){status.textContent=e.message;}finally{input.value='';}};
 root.querySelector('#sample-scan').onclick=async()=>{
  try{
   const photo=ctx.cats[0].photo;
   if(aiReady&&base){const response=await fetch(photo);if(!response.ok)throw new Error('示例照片加载失败');await scan(await readPhoto(await response.blob()));}
   else await scan(photo);
  }catch(error){if(live())status.textContent=error.message;}
 };
 root.querySelector('#manual-start').onclick=manual;
 choose.onclick=()=>input.click();retry.onclick=()=>lastPhoto&&scan(lastPhoto);
 retryService.onclick=()=>{healthChecks=0;refreshHealth();};
 root.querySelector('#enroll-files').onchange=()=>{const files=[...root.querySelector('#enroll-files').files];root.querySelector('#enroll-selection').textContent=files.length?'已选择 '+files.length+' 张：'+files.map(f=>f.name).join('、'):'还未选择照片';root.querySelector('#enroll-check').checked=false;};
 root.querySelectorAll('[name="enroll-cat"]').forEach(radio=>radio.onchange=()=>{root.querySelector('#enroll-check').checked=false;});
 root.querySelector('#scan-enroll-form').onsubmit=async e=>{
  e.preventDefault();const files=[...root.querySelector('#enroll-files').files],message=root.querySelector('#enroll-status');
  if(!registrationAllowed||!aiReady||busy||enrolling){message.textContent='识别服务还在处理照片，请稍后再登记。';return;}
  if(files.length<1||files.length>5){message.textContent='一次请选择 1–5 张照片。';return;}
  const catId=root.querySelector('input[name="enroll-cat"]:checked')?.value;
  if(!catId||!root.querySelector('#enroll-check').checked){message.textContent='请先选择猫咪，并核对这些照片确实属于它。';return;}
  enrolling=true;controls();message.textContent='正在为'+ctx.cats.find(c=>c.id===catId).name+'登记参考照片，请稍候…';
  try{
   const images=[];for(const file of files)images.push(await readPhoto(file));
   await request(base,'/register',{catId,images});if(!live())return;
   message.textContent='已为'+ctx.cats.find(c=>c.id===catId).name+'登记 '+images.length+' 张参考照片。请用另外拍摄的照片试识别。';root.querySelector('#enroll-files').value='';root.querySelector('#enroll-selection').textContent='还未选择照片';root.querySelector('#enroll-check').checked=false;await refreshHealth();
  }catch(error){if(live())message.textContent=error.name==='AbortError'?'登记请求已超时，可能已完成。请先重新连接并查看图库数量，避免重复登记。':'参考照片暂未完成登记，选择已保留。请检查文件格式或服务连接后重试。';}
  finally{enrolling=false;if(live())controls();}
 };
 controls();refreshHealth();
}

// The free cloud service intentionally runs without a photo recognition model.
// Keep this path separate from failed AI requests and the offline demo algorithm.
let manualCatId='';
function renderManualRecognition(root,ctx){
 const esc=ctx.escape;
 const cat=ctx.cats.find(item=>item.id===manualCatId);
 if(!cat)manualCatId='';
 const records=cat?ctx.state.records.filter(record=>record.catId===cat.id&&record.type==='feeding').sort((a,b)=>b.time-a.time).slice(0,5):[];
 const photo=item=>safeImage(item.photo)?`<img src="${esc(item.photo)}" alt="${esc(item.name)}" loading="lazy">`:'';
 root.innerHTML=`<section class="manual-recognition" aria-label="手动查找猫咪"><div class="section-heading"><div><h2 class="display">选择猫咪，查看喂养记录</h2><p class="muted small">核对照片、名字和外观特征，再选择你认识的猫咪。当前使用手动查找，暂不提供拍照识别。</p></div></div>${cat?`<div class="manual-records"><div class="scan-cat">${photo(cat)}<div><span class="small muted">你选择的猫咪</span><h2>${esc(cat.name)}</h2><button type="button" class="text-button" data-manual-profile>查看完整档案 ${ctx.icon('arrow',15)}</button></div></div><div class="section-title"><h3>最近喂养记录</h3><button type="button" class="text-button" data-manual-change>重新选择</button></div><div class="timeline">${records.length?records.map(record=>`<article class="timeline-item"><time>${esc(exactTime(record.time))}</time><h4>${esc(record.amount||record.detail||'喂养记录')}</h4><p>${esc(record.actor||'社区邻居')}${record.mine?' · 我记录的':' · 邻居共享记录'}</p>${record.detail?`<p class="small">${esc(record.detail)}</p>`:''}</article>`).join(''):'<div class="empty-state compact"><p>还没有可查询的喂养记录。</p><p class="small">这不代表它没有被喂过，可先联系熟悉它的照护者。</p></div>'}</div><button type="button" class="button" data-manual-record>${ctx.icon('bowl')} 我刚刚喂过，记一下</button></div>`:`<div class="manual-cats">${ctx.cats.map(item=>`<button type="button" class="cat-mini" data-manual-cat="${esc(item.id)}">${photo(item)}<span>${esc(item.name)}<small>${esc(item.color||'外观信息待补充')}</small></span>${ctx.icon('arrow',16)}</button>`).join('')||'<div class="empty-state"><h3>社区还没有猫咪档案</h3><p>先建立档案，再查询照护记录。</p><a class="button secondary small" href="#cats">去看看猫</a></div>'}</div>`}<aside class="scan-footnote">${ctx.icon('clock',20)}<p>这里展示的是邻居提交的记录。有记录不等于当前饱腹，无记录也不代表未被喂养；查看不会自动增加喂养记录。</p></aside></section>`;
 const focus=()=>{const heading=root.querySelector('h2');if(heading){heading.tabIndex=-1;heading.focus();}};
 root.querySelectorAll('[data-manual-cat]').forEach(button=>button.onclick=()=>{manualCatId=button.dataset.manualCat;renderManualRecognition(root,ctx);focus();});
 if(cat){
  root.querySelector('[data-manual-profile]').onclick=()=>ctx.openCat(cat.id);
  root.querySelector('[data-manual-record]').onclick=()=>ctx.openRecord('feeding',cat.id);
  root.querySelector('[data-manual-change]').onclick=()=>{manualCatId='';renderManualRecognition(root,ctx);focus();};
 }
}
