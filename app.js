import {cats,loadState,storageKey,escape,time,exactTime,uid,readPhoto,safeImage} from './data.js';
import {icon,openModal,closeModal} from './ui.js';
import {renderCommunity} from './community.js';
import {renderProfile} from './profile.js';
import {renderRecognition} from './recognition.js';
import {renderRescue} from './rescue.js';
const state=loadState(),main=document.querySelector('#main');let toastTimer,filter='all',search='';
const modules=[
 {route:'cats',title:'猫咪档案',description:'查看每只社区猫的数字档案、近况、关注状态与照护记录。',tags:['身份档案','健康近况','照护记录'],image:'./assets/cat-orange.jpg'},
 {route:'community',title:'社区猫咪与论坛',description:'浏览照片墙和邻居分享，在讨论中交流喂养、健康与救助经验。',tags:['照片墙','话题讨论','经验分享'],image:'./assets/tuxedo.png'},
 {route:'recognize',title:'AI 拍照识别与喂养助手',description:'上传照片获取外观特征初步分析，并查看分阶段喂养建议。',tags:['照片识别','喂养指南','人工确认'],image:'./assets/cat-basket.jpg'},
 {route:'rescue',title:'救助与社区协作',description:'发布紧急求助、认领照护任务，让喂养、清洁和交接持续接力。',tags:['求助发布','任务认领','志愿者交接'],image:'./assets/cat-green.jpg'},
 {route:'me',title:'个人中心',description:'汇总个人资料、参与任务与照护记录，查看完成的公益贡献。',tags:['我的任务','照护日志','贡献记录'],image:'./assets/cat-tabby.jpg'}
];
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4200);}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(state));return true;}catch{toast('浏览器存储空间不足或不可用，未能保存。请减少照片大小或先导出记录。');return false;}}
const ctx={state,cats,escape,time,icon,persist,toast,openCat,openRecord,openCompose,render};
function toggleFollow(id){const previous=[...state.follows];state.follows=state.follows.includes(id)?state.follows.filter(x=>x!==id):[...state.follows,id];if(!persist()){state.follows=previous;return false;}return true;}
function feeding(catId){return state.records.filter(r=>r.catId===catId&&r.type==='feeding').sort((a,b)=>b.time-a.time);}
function renderHome(){
 main.innerHTML=`<section class="home-hero home-landing">
  <div class="hero-copy home-landing-copy">
   <h1 class="display">让每一份关爱，<br><em>都有迹可循。</em></h1>
   <p>连接猫咪档案、社区互助、拍照识别与真实救助，让零散的善意变成可以持续的行动。</p>
   <a class="home-portal" href="#modules">
    <span class="portal-kicker">从这里开始</span>
    <strong>进入猫邻关爱与协作中心</strong>
    <span class="portal-meta">猫咪档案 · 社区论坛 · 智能识别 · 救助协作 · 个人贡献</span>
    <span class="portal-action"><span>5 个功能模块</span><span class="portal-icon">${icon('arrow',22)}</span></span>
   </a>
   <span class="handwritten">hello, neighbor.</span>
  </div>
  <figure class="hero-photo"><img src="./assets/tabby.png" alt="示例猫咪小花在花园石阶上休息" fetchpriority="high"><figcaption>小花 · 社区里的老朋友 <span>${icon('paw',16)}</span></figcaption></figure>
 </section>
 <section class="home-principles">
  <div><span>${icon('bookmark',20)}</span><strong>身份可追踪</strong><p>每只猫都有可更新的社区档案。</p></div>
  <div><span>${icon('clock',20)}</span><strong>照护可交接</strong><p>喂养、巡查和救助记录能继续传递。</p></div>
  <div><span>${icon('rescue',20)}</span><strong>行动有边界</strong><p>模糊位置、人工确认，不替代专业判断。</p></div>
 </section>
 <section class="home-moments" aria-label="社区近况">
  <a href="#cats"><img src="./assets/cat-orange.jpg" alt="社区猫咪档案示意照片" loading="lazy"><span>查看猫咪档案</span></a>
  <a href="#community"><img src="./assets/cat-basket.jpg" alt="社区猫咪动态示意照片" loading="lazy"><span>看看邻里动态</span></a>
  <a href="#rescue"><img src="./assets/cat-green.jpg" alt="社区照护接力示意照片" loading="lazy"><span>接住一次照护</span></a>
 </section>
 <section class="neighbor-note"><span class="handwritten">a little care goes a long way.</span><p>一次遇见、一张照片、一份小小的照护，<br>让邻居之间，多了一点联系。</p><a href="#modules" class="text-button">选择一个功能入口 ${icon('arrow',18)}</a></section>`;
}
function renderModules(){
 main.innerHTML=`<section class="page-intro modules-intro">
  <div><h1 class="display">五个入口，<br><em>继续一次照护。</em></h1><p>从认识一只猫开始，连接社区交流、智能识别、真实救助与个人贡献。</p></div>
  <a class="text-button" href="#home">${icon('arrow',16)} 返回首页</a>
 </section>
 <section class="module-grid" aria-label="五个功能模块">
  ${modules.map((item,index)=>`<article class="module-card" style="--i:${index}">
   <a class="module-cover" href="#${item.route}" aria-label="进入${item.title}"><img src="${item.image}" alt="${item.title}模块封面" loading="lazy"></a>
   <div class="module-card-body"><h2>${item.title}</h2><p class="module-description">${item.description}</p><div class="module-tags">${item.tags.map(tag=>`<span>${tag}</span>`).join('')}</div><a class="module-view" href="#${item.route}">查看 ${icon('arrow',16)}</a></div>
  </article>`).join('')}
 </section>
 <p class="module-note">${icon('paw',16)} 五个模块均为前端交互原型，公开信息需要审核并模糊处理精确位置。</p>`;
}
function renderCats(){
 main.innerHTML=`<section class="page-intro archive-intro"><div><h1 class="display">猫咪档案</h1><p>查看每只社区猫的身份、近况、关注状态与照护记录。</p></div><a class="text-button" href="#modules">${icon('arrow',16)} 返回功能中心</a></section>
 <section id="neighbors" class="neighbors"><div class="section-heading"><div><h2 class="display">社区里的小邻居</h2><p class="muted">每一张面孔，都有自己的小故事。</p></div><label class="search-box">${icon('search',18)}<input id="cat-search" type="search" placeholder="搜索名字或花色" aria-label="搜索名字或花色" value="${escape(search)}"></label></div><div class="tabs cat-filters" aria-label="猫咪筛选"><button data-filter="all" class="${filter==='all'?'active':''}">全部</button><button data-filter="follow" class="${filter==='follow'?'active':''}">我关注的</button><button data-filter="feeding" class="${filter==='feeding'?'active':''}">有喂养记录</button></div><div id="cat-grid" class="cat-grid"></div></section>
 <section class="neighbor-note"><span class="handwritten">a little care goes a long way.</span><p>一次遇见、一张照片、一份小小的照护，<br>让邻居之间，多了一点联系。</p><a href="#community" class="text-button">去看看大家的分享 ${icon('arrow',18)}</a></section>`;
 const update=()=>{const shown=cats.filter(c=>(filter!=='follow'||state.follows.includes(c.id))&&(filter!=='feeding'||feeding(c.id).length)&&(!search||`${c.name}${c.color}${c.description}`.includes(search)));
  const grid=main.querySelector('#cat-grid');grid.innerHTML=shown.length?shown.map(c=>{const last=state.records.filter(r=>r.catId===c.id).sort((a,b)=>b.time-a.time)[0];return `<article class="cat-card"><button class="cat-photo-button" data-open="${c.id}" aria-label="查看${c.name}的档案"><img src="${c.photo}" alt="${c.color}猫咪${c.name}" loading="lazy"></button><div class="cat-card-content"><div class="cat-card-title"><button class="text-button cat-name" data-open="${c.id}">${c.name}</button><button class="icon-button follow-button ${state.follows.includes(c.id)?'is-followed':''}" data-follow="${c.id}" aria-label="${state.follows.includes(c.id)?'取消关注':'关注'}${c.name}" aria-pressed="${state.follows.includes(c.id)}">${icon('heart',20)}</button></div><p>${c.color} · ${c.character}</p><div class="cat-card-bottom"><span>${last?'最近记录 '+time(last.time):'暂无照护记录'}</span><button class="text-button" data-open="${c.id}" aria-label="打开${c.name}档案">${icon('arrow',19)}</button></div></div></article>`;}).join(''):`<div class="empty-state full-width"><h3>${filter==='follow'?'还没有关注的小邻居':'没有找到对应的猫咪'}</h3><p>${filter==='follow'?'点击猫咪卡片上的爱心，留住你的牵挂。':'试试其他名字或花色。'}</p><button id="reset-filter" class="button secondary small">查看全部猫咪</button></div>`;
  grid.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openCat(b.dataset.open));grid.querySelectorAll('[data-follow]').forEach(b=>b.onclick=()=>{if(toggleFollow(b.dataset.follow))update();});grid.querySelector('#reset-filter')?.addEventListener('click',()=>{filter='all';search='';renderCats();});};
 main.querySelector('#cat-search').oninput=e=>{search=e.target.value.trim();update();};main.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;main.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));update();});update();
}
function openCat(id){
 const cat=cats.find(c=>c.id===id);if(!cat)return;
 const records=state.records.filter(r=>r.catId===id).sort((a,b)=>b.time-a.time);const latest=feeding(id)[0];
 const posts=state.posts.filter(p=>p.catId===id).sort((a,b)=>b.time-a.time);
 const {element}=openModal(`${escape(cat.name)}的档案`,`<div class="cat-detail"><div class="cat-detail-photo"><img src="${cat.photo}" alt="${cat.name}"><p class="small muted">示例猫咪 · 非真实社区档案</p></div><div class="cat-detail-info"><div class="cat-detail-heading"><h3 class="display">${cat.name}</h3><button class="button secondary small" id="detail-follow">${icon('heart',17)} ${state.follows.includes(id)?'已关注':'关注它'}</button></div><p>${cat.description}</p><dl class="cat-facts"><div><dt>花色</dt><dd>${cat.color}</dd></div><div><dt>性别</dt><dd>${cat.sex}</dd></div><div><dt>年龄</dt><dd>${cat.age}</dd></div><div><dt>绝育情况</dt><dd>${cat.neutered}</dd></div><div><dt>活动范围</dt><dd>${cat.area}（模糊区域）</dd></div></dl><div class="feeding-summary">${icon('bowl',24)}<div><strong>${latest?'最近喂养记录：'+escape(time(latest.time)):'暂未有喂养记录'}</strong><p>${latest?escape(latest.amount||latest.detail)+' · '+escape(latest.actor):'无记录不代表它未被喂养。'}</p></div></div><div class="button-row"><button class="button small" id="detail-record">${icon('bowl',18)} 记录一次喂养</button><button class="button secondary small" id="detail-share">${icon('camera',18)} 分享近况</button></div></div></div><div class="detail-records"><h3>最近的照护记录</h3>${records.length?`<div class="timeline">${records.map(r=>`<article class="timeline-item"><time>${escape(exactTime(r.time))}</time><h4>${r.type==='feeding'?'日常喂养':'救助记录'} · ${escape(r.actor)}</h4><p>${escape(r.detail)}</p><span class="small muted">${r.mine?'本机个人记录':'示例记录'}</span></article>`).join('')}</div>`:'<p class="muted">还没有记录。你可以补充实际发生的照护。</p>'}<h3>邻居分享的近况</h3>${posts.length?posts.slice(0,3).map(p=>`<div class="related-post"><span>${escape(p.author)} · ${escape(time(p.time))}</span><p>${escape(p.text)}</p></div>`).join(''):'<p class="muted">还没有近况，分享一次遇见吧。</p>'}<p class="small muted">记录来自分享者，不等于当前状态或专业健康判断。</p></div>`,{wide:true});
 element.querySelector('#detail-follow').onclick=()=>{if(toggleFollow(id)){render();openCat(id);}};element.querySelector('#detail-record').onclick=()=>openRecord('feeding',id);element.querySelector('#detail-share').onclick=()=>openCompose(id);
}
function openCompose(catId='',initialType='daily'){
 let photo='';const {element,close}=openModal('分享一次遇见',`<form id="compose-form"><p class="muted">一张照片，或一句近况，都值得分享。</p><label class="form-field">想说的话<textarea id="post-text" maxlength="1000" rows="4" placeholder="今天遇见了谁？发生了什么？"></textarea></label><div class="two-col"><label class="form-field">关联猫咪<select id="post-cat"><option value="">暂不关联</option>${cats.map(c=>`<option value="${c.id}" ${catId===c.id?'selected':''}>${c.name}</option>`).join('')}</select></label><label class="form-field">动态类型<select id="post-type"><option value="daily" ${initialType==='daily'?'selected':''}>日常遇见</option><option value="feeding" ${initialType==='feeding'?'selected':''}>喂养分享</option><option value="rescue" ${initialType==='rescue'?'selected':''}>救助分享</option></select></label></div><label class="photo-upload-label" for="post-image">${icon('image',23)} 添加一张照片（可选）<input id="post-image" type="file" accept="image/jpeg,image/png,image/webp"></label><div id="post-photo-preview"></div><p class="small muted">分享不自动生成照护记录。请保护邻居隐私，不公开精确位置。</p><p class="form-error" id="post-error" role="alert"></p><button type="submit" class="button full-width">发布到本机社区动态 ${icon('arrow',18)}</button><p class="small muted">初版体验：仅当前浏览器可见，尚未连接多人社区。</p></form>`);
 element.querySelector('#post-image').onchange=async e=>{const err=element.querySelector('#post-error');if(!e.target.files[0])return;try{photo=await readPhoto(e.target.files[0]);element.querySelector('#post-photo-preview').innerHTML=`<div class="attachment"><img src="${photo}" alt="准备发布的照片"><button type="button" class="icon-button" aria-label="移除照片">${icon('close')}</button></div>`;element.querySelector('.attachment button').onclick=()=>{photo='';element.querySelector('#post-photo-preview').innerHTML='';e.target.value='';};err.textContent='';}catch(x){err.textContent=x.message;e.target.value='';}};
 element.querySelector('#compose-form').onsubmit=e=>{e.preventDefault();const text=element.querySelector('#post-text').value.trim();if(!text&&!photo){element.querySelector('#post-error').textContent='写一句近况，或添加一张照片后再发布。';return;}
  const post={id:uid(),author:state.nickname,avatar:'#dde4bc',text,image:photo,catId:element.querySelector('#post-cat').value,type:element.querySelector('#post-type').value,time:Date.now(),likes:0,liked:false,mine:true,comments:[]};state.posts.unshift(post);if(!persist()){state.posts.shift();return;}close();location.hash='community';render();toast('分享已保存，感谢你留下这次遇见。');};
}
function openRecord(type='feeding',catId=''){
 const rescue=type==='rescue';const current=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);
 const recent=catId?feeding(catId)[0]:null;
 const {element,close}=openModal(rescue?'记录一次救助':'记录一次喂养',`<form id="record-form"><p class="muted">记录你实际做过的事，不用写成一份报告。</p>${recent&&!rescue?`<p class="record-reminder">这只猫已有 ${escape(time(recent.time))} 的喂养记录。请核对后记录本次实际发生的照护。</p>`:''}<label class="form-field">是哪位小邻居<select id="record-cat" required><option value="">请选择猫咪</option>${cats.map(c=>`<option value="${c.id}" ${c.id===catId?'selected':''}>${c.name}</option>`).join('')}</select></label><label class="form-field">发生时间<input id="record-time" type="datetime-local" value="${current}" max="${current}" required></label>${rescue?'':`<label class="form-field">食物或补给（可选）<input id="record-amount" maxlength="80" placeholder="例如：少量干粮、补水"></label>`}<label class="form-field">${rescue?'你提供了什么帮助':'本次照护情况'}<textarea id="record-detail" rows="3" maxlength="500" required placeholder="${rescue?'例如：协助联系照护者、提供运输帮助，并注明当前进展':'例如：补充清水，离开前收拾了现场'}"></textarea></label><p class="small muted">猫咪档案和“我的”会共用这条记录，无需重复填写。</p><p id="record-error" class="form-error" role="alert"></p><button type="submit" class="button full-width">保存${rescue?'救助':'喂养'}记录 ${icon('check',18)}</button></form>`);
 element.querySelector('#record-form').onsubmit=e=>{e.preventDefault();const stamp=new Date(element.querySelector('#record-time').value).getTime();const detail=element.querySelector('#record-detail').value.trim();const chosen=element.querySelector('#record-cat').value;const error=element.querySelector('#record-error');if(!chosen||!detail||!Number.isFinite(stamp)||stamp>Date.now()+60000){error.textContent='请选择猫咪、填写实际照护情况，并确认时间不晚于现在。';return;}
  const r={id:uid(),catId:chosen,type:rescue?'rescue':'feeding',detail,amount:element.querySelector('#record-amount')?.value.trim()||'',time:stamp,actor:state.nickname,mine:true};state.records.unshift(r);if(!persist()){state.records.shift();return;}close();render();toast('记录已保存，猫咪档案和“我的”已同步。');};
}
function render(){const route=location.hash.slice(1).split('?')[0];const view=['home','modules','cats','community','recognize','rescue','me'].includes(route)?route:'home';document.querySelectorAll('[data-route]').forEach(a=>{const active=a.dataset.route===view||view==='cats'&&a.dataset.route==='modules';a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});document.title=({home:'让每一份关爱都有迹可循',modules:'功能中心',cats:'猫咪档案',community:'社区动态',recognize:'拍照识猫',rescue:'救助与社区协作',me:'我的'})[view]+' · 猫邻 maolin';if(view==='modules')renderModules();else if(view==='cats')renderCats();else if(view==='community')renderCommunity(main,ctx);else if(view==='recognize')renderRecognition(main,ctx);else if(view==='rescue')renderRescue(main,ctx);else if(view==='me')renderProfile(main,ctx);else renderHome();}
document.querySelector('#header-compose').onclick=()=>openCompose();window.addEventListener('hashchange',()=>{closeModal();render();if(location.hash!=='#neighbors')window.scrollTo({top:0,behavior:'instant'});});render();
