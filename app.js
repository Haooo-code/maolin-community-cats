import {escape,time,exactTime,readPhoto,safeImage} from './data.js';
import {createCommunityStore,submitDraft} from './cloud.js';
import {icon,openModal,closeModal} from './ui.js';
import {renderCommunity} from './community.js';
import {renderProfile} from './profile.js';
import {renderCare} from './care.js';
import {renderSupport,teamLinks} from './support.js';
import {catalogEditorMarkup,bindCatalogEditor} from './catalog.js';
const main=document.querySelector('#main');let toastTimer,filter='all',search='',currentView='home';
const store=createCommunityStore({onChange:()=>render()}),{state,runtime}=store;
let cats=[];
const catPhoto=cat=>safeImage(cat.photo)?cat.photo:'';
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4200);}
const ctx={state,get cats(){return state.cats||[];},runtime,escape,time,icon,toast,openCat,openRecord,openCompose,render,command:communityCommand,accountCommand:store.accountCommand,requireAccount,refresh:()=>store.refresh(),submitDraft,onCatAdded:catId=>{filter='all';search='';render();if(catId)openCat(catId);else main.querySelector('#neighbors')?.scrollIntoView();}};
function requireAccount(){if(!runtime.shared||!runtime.authRequiredForWrites||runtime.account.authenticated)return true;closeModal();location.hash='me';render();main.querySelector('[name="username"]')?.focus();toast('登录后即可发布、关注和记录照护；浏览社区无需登录。');return false;}
async function communityCommand(kind,payload){if(!requireAccount()){const error=new Error('请先登录或注册账号。');error.accountRequired=true;throw error;}return store.command(kind,payload);}
async function toggleFollow(id,button){if(!requireAccount())return false;if(button?.disabled)return false;if(button)button.disabled=true;try{await store.command('profile',{nickname:state.nickname,follows:state.follows.includes(id)?state.follows.filter(x=>x!==id):[...state.follows,id]});return true;}catch(error){toast(error.message);return false;}finally{if(button)button.disabled=false;}}
function feeding(catId){return state.records.filter(r=>r.catId===catId&&r.type==='feeding').sort((a,b)=>b.time-a.time);}
const modules=[
 {route:'cats',title:'猫咪档案',description:'查看社区猫咪的身份、近况与照护记录，也可以为刚遇见的猫咪补充档案。',tags:['身份档案','社区猫咪','照护记录'],image:'./assets/cat-orange.jpg'},
 {route:'community',title:'社区猫咪与论坛',description:'分享一次遇见，浏览邻居动态，在评论和交流中留下及时近况。',tags:['照片墙','社区动态','评论交流'],image:'./assets/tuxedo.png'},
 {route:'recognize',title:'拍照识别与喂养助手',description:'按照片特征查找猫咪档案，人工确认后再查看最近的喂养记录。',tags:['照片核对','人工确认','喂养记录'],image:'./assets/cat-basket.jpg'},
 {route:'opportunities',title:'救助与社区协作',description:'发布活动或临时求助，也能找到志愿者与照护团队，把事情交给合适的邻居。',tags:['活动求助','任务交接','志愿者团队'],image:'./assets/cat-green.jpg'},
 {route:'me',title:'个人中心',description:'汇总关注、照护记录与发布内容，随时整理自己的社区参与和贡献。',tags:['我的关注','我的记录','贡献整理'],image:'./assets/cat-tabby.jpg'}
];
let revealObserver=null;
function mountEntrances(){
 if(revealObserver)revealObserver.disconnect();
 const items=[...main.querySelectorAll('[data-reveal]')];
 if(!items.length)return;
 main.classList.add('motion-ready');
 if(!('IntersectionObserver' in window)){items.forEach(item=>item.classList.add('is-in'));return;}
 revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   if(entry.isIntersecting){entry.target.classList.add('is-in');revealObserver.unobserve(entry.target);}
  });
 },{rootMargin:'0px 0px -10% 0px',threshold:.08});
 items.forEach(item=>revealObserver.observe(item));
}
function renderHome(){
 main.innerHTML=`<section class="home-entry" aria-labelledby="home-title">
  <div class="home-entry-copy">
   <h1 id="home-title" class="display">让每一份关爱，<br><em>都有迹可循。</em></h1>
   <p class="home-lead">面向校园流浪猫的档案、交流、照护与救助协作网页，让零散善意能够被看见，也能被下一个邻居接住。</p>
   <a class="home-portal" href="#modules">
    <span class="portal-copy"><strong>进入猫邻关爱与协作中心</strong><span class="portal-meta">猫咪档案 · 社区交流 · 照护助手 · 救助协作 · 个人记录</span></span>
    <span class="portal-action"><span>5 个功能模块</span><span class="portal-icon">${icon('arrow',22)}</span></span>
   </a>
   <div class="home-quicklinks"><a href="#cats">先看看猫 ${icon('arrow',16)}</a><a href="#community">读一条邻里动态 ${icon('arrow',16)}</a></div>
  </div>
  <figure class="home-portrait" aria-label="社区猫咪示例影像">
   <img class="hero-slide hero-slide-a" src="./assets/cat-tabby.jpg" alt="一只狸花猫坐在社区石阶上" fetchpriority="high">
   <img class="hero-slide hero-slide-b" src="./assets/cat-orange.jpg" alt="" loading="lazy">
   <img class="hero-slide hero-slide-c" src="./assets/cat-green.jpg" alt="" loading="lazy">
   <figcaption><span>校园猫咪 · 示例影像</span><span>${icon('paw',18)}</span></figcaption>
  </figure>
 </section>
 <section class="home-principles" data-reveal aria-label="猫邻协作原则">
  <article><span>${icon('bookmark',22)}</span><strong>身份可以继续</strong><p>每一只猫的档案、近况和照护记录都能被后面的邻居接续。</p></article>
  <article><span>${icon('clock',22)}</span><strong>照护可以交接</strong><p>喂养、巡查和救助不只留在个人记忆里，而能留下清楚记录。</p></article>
  <article><span>${icon('rescue',22)}</span><strong>行动有边界</strong><p>公开位置保持模糊，照片匹配由人确认，不替代专业健康判断。</p></article>
 </section>
 <section class="home-moments" aria-labelledby="moments-title" data-reveal>
  <header><h2 id="moments-title" class="display">从一次遇见开始</h2><p>认一只猫，留一条近况，或者把一次求助交给合适的邻居。</p></header>
  <div class="moments-grid">
   <a href="#cats"><img src="./assets/cat-orange.jpg" alt="社区猫咪档案示例照片" loading="lazy"><span><strong>认识社区里的猫</strong><small>查看档案与近况</small></span></a>
   <a href="#community"><img src="./assets/cat-basket.jpg" alt="社区猫咪动态示例照片" loading="lazy"><span><strong>分享一次遇见</strong><small>发布照片与留言</small></span></a>
   <a href="#opportunities"><img src="./assets/cat-green.jpg" alt="社区照护接力示例照片" loading="lazy"><span><strong>接住一次求助</strong><small>联系志愿者与团队</small></span></a>
  </div>
 </section>
 <section class="home-close" data-reveal><p>先认识一只猫<br>再完成一件小事</p><a class="button" href="#modules">打开五个功能入口 ${icon('arrow',18)}</a></section>`;
 mountEntrances();
}
function renderModules(){
 main.innerHTML=`<section class="modules-head" aria-labelledby="modules-title" data-reveal>
  <div><h1 id="modules-title" class="display">五个入口，<br><em>一起接住照护。</em></h1><p>从猫咪档案开始，连接社区交流、照片核对、救助协作和个人记录。</p></div>
  <a class="text-button module-home-link" href="#home">${icon('arrow',16)} 返回首页</a>
 </section>
 <section class="module-grid-v2" aria-label="五个功能模块">
  ${modules.map((item,index)=>`<article class="module-card-v2" data-reveal style="--i:${index}">
   <a class="module-cover-v2" href="#${item.route}" aria-label="进入${item.title}"><img src="${item.image}" alt="${item.title}模块封面" loading="lazy"></a>
   <div class="module-body-v2"><h2>${item.title}</h2><p>${item.description}</p><div class="module-tags-v2">${item.tags.map(tag=>`<span>${tag}</span>`).join('')}</div><a class="module-view-v2" href="#${item.route}">查看 ${icon('arrow',16)}</a></div>
  </article>`).join('')}
 </section>
 <p class="modules-note" data-reveal>${icon('paw',16)} 当前为离线前端演示，新增内容只保存在当前浏览器，不会同步给其他人。</p>`;
 mountEntrances();
}
function renderCats(){
 main.innerHTML=`<section class="home-hero"><div class="hero-copy"><h1 class="display">认识一只猫，<br><em>也认识一群邻居。</em></h1><p>看看社区里的小身影，分享一次遇见，<br class="desktop-only">让关心慢慢发生。</p><div class="button-row"><a href="#neighbors" class="button">看看猫咪 ${icon('arrow',18)}</a><a href="#recognize" class="button secondary">${icon(runtime.recognitionEnabled===false?'search':'camera',19)} ${runtime.recognitionEnabled===false?'查找猫咪':'拍照认一认'}</a><button type="button" class="text-button" data-add-cat>${icon('plus',18)} 添加猫咪</button></div><span class="handwritten">hello, neighbor.</span></div><figure class="hero-photo"><img src="./assets/tabby.png" alt="示例猫咪小花在花园石阶上休息" fetchpriority="high"><figcaption>小花 · 社区里的老朋友 <span>${icon('paw',16)}</span></figcaption></figure></section>
 ${catalogEditorMarkup(ctx)}<section id="neighbors" class="neighbors"><div class="section-heading"><div><h2 class="display">社区里的小邻居</h2><p class="muted">每一张面孔，都有自己的小故事。</p></div><div class="catalog-actions"><button type="button" class="button secondary small" data-add-cat>${icon('plus',17)} 添加猫咪</button><label class="search-box">${icon('search',18)}<input id="cat-search" type="search" placeholder="搜索名字或花色" aria-label="搜索名字或花色" value="${escape(search)}"></label></div></div><div class="tabs cat-filters" aria-label="猫咪筛选"><button data-filter="all" aria-pressed="${filter==='all'}" class="${filter==='all'?'active':''}">全部</button><button data-filter="follow" aria-pressed="${filter==='follow'}" class="${filter==='follow'?'active':''}">我关注的</button><button data-filter="feeding" aria-pressed="${filter==='feeding'}" class="${filter==='feeding'?'active':''}">有喂养记录</button></div><div id="cat-grid" class="cat-grid"></div></section>
 <section class="neighbor-note"><span class="handwritten">a little care goes a long way.</span><p>一次遇见、一张照片、一份小小的照护，<br>让邻居之间，多了一点联系。</p><a href="#community" class="text-button">去看看大家的分享 ${icon('arrow',18)}</a></section>`;
 const update=()=>{const shown=cats.filter(c=>(filter!=='follow'||state.follows.includes(c.id))&&(filter!=='feeding'||feeding(c.id).length)&&(!search||`${c.name}${c.color}${c.description}`.includes(search)));
  const grid=main.querySelector('#cat-grid');grid.innerHTML=shown.length?shown.map(c=>{const last=state.records.filter(r=>r.catId===c.id).sort((a,b)=>b.time-a.time)[0];return `<article class="cat-card"><button class="cat-photo-button" data-open="${escape(c.id)}" aria-label="查看${escape(c.name)}的档案"><img src="${escape(catPhoto(c))}" alt="${escape(c.color)}猫咪${escape(c.name)}" loading="lazy"></button><div class="cat-card-content"><div class="cat-card-title"><button class="text-button cat-name" data-open="${escape(c.id)}">${escape(c.name)}</button><button class="icon-button follow-button ${state.follows.includes(c.id)?'is-followed':''}" data-follow="${escape(c.id)}" aria-label="${state.follows.includes(c.id)?'取消关注':'关注'}${escape(c.name)}" aria-pressed="${state.follows.includes(c.id)}">${icon('heart',20)}</button></div><p>${escape(c.color)} · ${escape(c.character)}</p><div class="cat-card-bottom"><span>${last?'最近记录 '+time(last.time):'暂无照护记录'}</span><button class="text-button" data-open="${escape(c.id)}" aria-label="打开${escape(c.name)}档案">${icon('arrow',19)}</button></div></div></article>`;}).join(''):`<div class="empty-state full-width"><h3>${filter==='follow'?'还没有关注的小邻居':'没有找到对应的猫咪'}</h3><p>${filter==='follow'?'点击猫咪卡片上的爱心，留住你的牵挂。':'试试其他名字或花色。'}</p><button id="reset-filter" class="button secondary small">查看全部猫咪</button></div>`;
  grid.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openCat(b.dataset.open));grid.querySelectorAll('[data-follow]').forEach(b=>b.onclick=async()=>{if(await toggleFollow(b.dataset.follow,b))update();});grid.querySelector('#reset-filter')?.addEventListener('click',()=>{filter='all';search='';renderCats();});};
 main.querySelector('#cat-search').oninput=e=>{search=e.target.value.trim();update();};main.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;main.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});update();});update();bindCatalogEditor(main,ctx);
}
function openCat(id){
 const cat=cats.find(c=>c.id===id);if(!cat)return;
 const records=state.records.filter(r=>r.catId===id).sort((a,b)=>b.time-a.time);const latest=feeding(id)[0];
 const posts=state.posts.filter(p=>p.catId===id).sort((a,b)=>b.time-a.time);
 const {element}=openModal(`${escape(cat.name)}的档案`,`<div class="cat-detail"><div class="cat-detail-photo"><img src="${escape(catPhoto(cat))}" alt="${escape(cat.name)}"><p class="small muted">${cat.isDemo===true?'示例猫咪 · 非真实社区档案':'邻居建立的猫咪档案 · 信息由分享者提供'}</p></div><div class="cat-detail-info"><div class="cat-detail-heading"><h3 class="display">${escape(cat.name)}</h3><button class="button secondary small" id="detail-follow">${icon('heart',17)} ${state.follows.includes(id)?'已关注':'关注它'}</button></div><p>${escape(cat.description)}</p><dl class="cat-facts"><div><dt>花色</dt><dd>${escape(cat.color)}</dd></div><div><dt>性别</dt><dd>${escape(cat.sex)}</dd></div><div><dt>年龄</dt><dd>${escape(cat.age)}</dd></div><div><dt>绝育情况</dt><dd>${escape(cat.neutered)}</dd></div><div><dt>活动范围</dt><dd>${escape(cat.area)}（模糊区域）</dd></div></dl><div class="feeding-summary">${icon('bowl',24)}<div><strong>${latest?'最近喂养记录：'+escape(time(latest.time)):'暂未有喂养记录'}</strong><p>${latest?escape(latest.amount||latest.detail)+' · '+escape(latest.actor):'无记录不代表它未被喂养。'}</p></div></div><div class="button-row"><button class="button small" id="detail-record">${icon('bowl',18)} 记录一次喂养</button><button class="button secondary small" id="detail-share">${icon('camera',18)} 分享近况</button></div></div></div><div class="detail-records"><h3>最近的照护记录</h3>${records.length?`<div class="timeline">${records.map(r=>`<article class="timeline-item"><time>${escape(exactTime(r.time))}</time><h4>${r.type==='feeding'?'日常喂养':'救助记录'} · ${escape(r.actor)}</h4><p>${escape(r.detail)}</p><span class="small muted">${runtime.shared?(r.mine?'我记录的 · 云端共享':'邻居共享记录'):(r.mine?'本机个人记录':'示例记录')}</span></article>`).join('')}</div>`:'<p class="muted">还没有记录。你可以补充实际发生的照护。</p>'}${teamLinks(id,ctx)}<h3>邻居分享的近况</h3>${posts.length?posts.slice(0,3).map(p=>`<div class="related-post"><span>${escape(p.author)} · ${escape(time(p.time))}</span><p>${escape(p.text)}</p></div>`).join(''):'<p class="muted">还没有近况，分享一次遇见吧。</p>'}<p class="small muted">记录来自分享者，不等于当前状态或专业健康判断。</p></div>`,{wide:true});
 element.querySelector('#detail-follow').onclick=async e=>{if(await toggleFollow(id,e.currentTarget)){render();openCat(id);}};element.querySelector('#detail-record').onclick=()=>openRecord('feeding',id);element.querySelector('#detail-share').onclick=()=>openCompose(id);
}
function openCompose(catId=''){
 if(!requireAccount())return;
 let photo='';const {element,close}=openModal('分享一次遇见',`<form id="compose-form"><p class="muted">一张照片，或一句近况，都值得分享。</p><label class="form-field">想说的话<textarea id="post-text" maxlength="1000" rows="4" placeholder="今天遇见了谁？发生了什么？"></textarea></label><div class="two-col"><label class="form-field">关联猫咪<select id="post-cat"><option value="">暂不关联</option>${cats.map(c=>`<option value="${escape(c.id)}" ${catId===c.id?'selected':''}>${escape(c.name)}</option>`).join('')}</select></label><label class="form-field">动态类型<select id="post-type"><option value="daily">日常遇见</option><option value="feeding">喂养分享</option><option value="rescue">救助分享</option></select></label></div><label class="photo-upload-label" for="post-image">${icon('image',23)} 添加一张照片（可选）<input id="post-image" type="file" accept="image/jpeg,image/png,image/webp"></label><div id="post-photo-preview"></div><p class="small muted">分享不自动生成照护记录。请保护邻居隐私，不公开精确位置。</p><p class="form-error" id="post-error" role="alert"></p><button type="submit" class="button full-width">${runtime.shared?'发布到共享社区':'发布到本机社区动态'} ${icon('arrow',18)}</button><p class="small muted">${runtime.shared?'社区试用 · 照片与动态将上传云端，供持有分享码的邻居查看。':'初版体验：仅当前浏览器可见，尚未连接多人社区。'}</p></form>`);
 element.querySelector('#post-image').onchange=async e=>{const err=element.querySelector('#post-error');if(!e.target.files[0])return;try{photo=await readPhoto(e.target.files[0]);element.querySelector('#post-photo-preview').innerHTML=`<div class="attachment"><img src="${photo}" alt="准备发布的照片"><button type="button" class="icon-button" aria-label="移除照片">${icon('close')}</button></div>`;element.querySelector('.attachment button').onclick=()=>{photo='';element.querySelector('#post-photo-preview').innerHTML='';e.target.value='';};err.textContent='';}catch(x){err.textContent=x.message;e.target.value='';}};
 element.querySelector('#compose-form').onsubmit=async e=>{e.preventDefault();const text=element.querySelector('#post-text').value.trim();if(!text&&!photo){element.querySelector('#post-error').textContent='写一句近况，或添加一张照片后再发布。';return;}
  const form=e.currentTarget;await submitDraft(form,element.querySelector('#post-error'),()=>store.command('posts',{text,image:photo,catId:element.querySelector('#post-cat').value,type:element.querySelector('#post-type').value}),()=>{close();location.hash='community';render();toast(runtime.shared?'分享已保存到共享社区。':'分享已保存，感谢你留下这次遇见。');});};
}
function openRecord(type='feeding',catId=''){
 if(!requireAccount())return;
 const rescue=type==='rescue';const current=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
 const recent=catId?feeding(catId)[0]:null;
 const {element,close}=openModal(rescue?'记录一次救助':'记录一次喂养',`<form id="record-form"><p class="muted">记录你实际做过的事，不用写成一份报告。</p>${recent&&!rescue?`<p class="record-reminder">这只猫已有 ${escape(time(recent.time))} 的喂养记录。请核对后记录本次实际发生的照护。</p>`:''}<label class="form-field">是哪位小邻居<select id="record-cat" required><option value="">请选择猫咪</option>${cats.map(c=>`<option value="${escape(c.id)}" ${c.id===catId?'selected':''}>${escape(c.name)}</option>`).join('')}</select></label><label class="form-field">发生时间<input id="record-time" type="datetime-local" value="${current}" max="${current}" required></label>${rescue?'':`<label class="form-field">食物或补给（可选）<input id="record-amount" maxlength="80" placeholder="例如：少量干粮、补水"></label>`}<label class="form-field">${rescue?'你提供了什么帮助':'本次照护情况'}<textarea id="record-detail" rows="3" maxlength="500" required placeholder="${rescue?'例如：协助联系照护者、提供运输帮助，并注明当前进展':'例如：补充清水，离开前收拾了现场'}"></textarea></label><p class="small muted">猫咪档案和“我的”会共用这条记录，无需重复填写。</p><p id="record-error" class="form-error" role="alert"></p><button type="submit" class="button full-width">保存${rescue?'救助':'喂养'}记录 ${icon('check',18)}</button></form>`);
 element.querySelector('#record-form').onsubmit=async e=>{e.preventDefault();const stamp=new Date(element.querySelector('#record-time').value).getTime();const detail=element.querySelector('#record-detail').value.trim();const chosen=element.querySelector('#record-cat').value;const error=element.querySelector('#record-error');if(!chosen||!detail||!Number.isFinite(stamp)||stamp>Date.now()+60000){error.textContent='请选择猫咪、填写实际照护情况，并确认时间不晚于现在。';return;}
  await submitDraft(e.currentTarget,error,()=>store.command('records',{catId:chosen,type:rescue?'rescue':'feeding',detail,amount:element.querySelector('#record-amount')?.value.trim()||'',time:stamp}),()=>{close();render();toast(runtime.shared?'照护记录已保存到共享社区。':'记录已保存，猫咪档案和“我的”已同步。');});};
}
function render(){
 cats=state.cats||[];
 if(runtime.status!=='ready'){
  const loading=runtime.status==='loading'||runtime.status==='connecting';
  main.innerHTML=`<section class="empty-state" role="status"><h1>${loading?'正在连接社区…':'共享社区暂不可用'}</h1><p>${loading?'正在确认运行模式和读取记录。':escape(runtime.error)}</p>${loading?'':`<button type="button" class="button secondary" id="retry-community">重新连接</button>${runtime.sessionExpired?'<p><a class="text-button" href="/login">重新登录</a></p>':''}`}</section>`;
  main.querySelector('#retry-community')?.addEventListener('click',()=>store.initialize());
  document.querySelector('#header-compose').disabled=true;return;
 }
 document.querySelector('#header-compose').disabled=false;
 const route=location.hash.slice(1).split('?')[0];const view=route==='main'?currentView:['home','modules','cats','community','care','recognize','opportunities','volunteers','me'].includes(route)?route:'home';currentView=view;const landing=view==='home'||view==='modules';document.body.classList.toggle('landing-mode',landing);const navView=['recognize','opportunities','volunteers'].includes(view)?'care':view;document.querySelectorAll('[data-route]').forEach(a=>{const active=a.dataset.route===navView;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});document.title=({home:'让每一份关爱都有迹可循',modules:'功能中心',cats:'猫咪档案',community:'社区动态',care:'猫咪照护',recognize:runtime.recognitionEnabled===false?'拍照查找':'拍照识别',opportunities:'救助与社区协作',volunteers:'志愿者与团队',me:'个人中心'})[view]+' · 猫邻 maolin';if(view==='home')renderHome();else if(view==='modules')renderModules();else if(view==='community')renderCommunity(main,ctx);else if(view==='care'||view==='recognize')renderCare(main,ctx,{recognize:view==='recognize'});else if(view==='opportunities'||view==='volunteers')renderSupport(main,ctx,view==='volunteers'?'teams':'opportunities');else if(view==='me')renderProfile(main,ctx);else renderCats();
 const notice=document.createElement('div');notice.className='small muted';notice.setAttribute('role','status');notice.innerHTML=`${runtime.shared?`<button type="button" class="text-button" data-refresh>刷新共享记录</button>${runtime.error?`<p class="form-error">${escape(runtime.error)}${runtime.sessionExpired?' <a href="/login">重新登录</a>':''}</p>`:''}`:''}`;
 if(runtime.shared)main.prepend(notice);notice.querySelector('[data-refresh]')?.addEventListener('click',async e=>{const button=e.currentTarget;button.disabled=true;try{await store.refresh();}catch{}finally{button.disabled=false;}});
 if(!landing)main.insertAdjacentHTML('afterbegin',`<a class="module-return" href="#modules">${icon('arrow',16)} 返回功能中心</a>`);
 main.querySelectorAll(':scope > section').forEach((section,index)=>{section.dataset.reveal='';section.style.setProperty('--i',index);});
 mountEntrances();
}
document.querySelector('#header-compose').onclick=()=>{if(runtime.status==='ready')openCompose();};window.addEventListener('hashchange',()=>{if(location.hash==='#main'){main.focus();return;}if(location.hash==='#neighbors'&&currentView==='cats'){document.querySelector('#neighbors')?.scrollIntoView();return;}closeModal();render();if(runtime.shared&&runtime.status==='ready')store.refresh().catch(()=>{});main.focus({preventScroll:true});if(location.hash!=='#neighbors'&&!/^#volunteers\?team=[A-Za-z0-9_-]+$/.test(location.hash))window.scrollTo({top:0,behavior:'instant'});});store.initialize();

