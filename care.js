import {exactTime,safeImage} from './data.js';
import {renderRecognition} from './recognition.js';

let careFilter='follow',recognitionOpen=false;
export function careNavigation(view){
 return `<nav class="care-nav" aria-label="一起照护导航">${[['care','猫咪照护'],['opportunities','活动与求助'],['volunteers','志愿者与团队']].map(([route,label])=>`<a href="#${route}" ${view===route?'aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
}
export function careCats(state,filter='follow'){
 return (state.cats||[]).filter(cat=>filter==='all'||state.follows.includes(cat.id)).map(cat=>({cat,last:state.records.filter(record=>record.catId===cat.id&&record.type==='feeding').sort((a,b)=>b.time-a.time)[0]}));
}
export function renderCare(main,ctx,{recognize=false}={}){
 const {escape:esc,icon,state}=ctx,manual=ctx.runtime.recognitionEnabled===false;if(recognize)recognitionOpen=true;
 if(recognize){
  main.innerHTML=`${careNavigation('care')}<section class="page-intro recognize-intro"><div><h1 class="display">拍照识别与喂养助手</h1><p>按照片特征查找猫咪档案，人工确认后查看最近的喂养记录。当前离线版不执行 AI 个体识别。</p></div><a class="text-button" href="#care">查看整体照护 ${icon('arrow',16)}</a></section><section id="care-recognition-content" class="recognize-page"></section>`;
  renderRecognition(main.querySelector('#care-recognition-content'),ctx);
  return;
 }
 main.innerHTML=`${careNavigation('care')}<section class="page-intro"><div><h1 class="display">猫咪照护</h1><p>看看牵挂的猫咪，了解邻居最近留下的照护记录。</p></div><button type="button" class="button secondary" data-open-recognition>${icon(manual?'search':'camera',19)} ${manual?'查找猫咪':'拍照认猫'}</button></section><section class="care-overview" aria-labelledby="care-list-title"><div class="section-heading"><div><h2 id="care-list-title" class="display">最近吃得怎么样？</h2><p class="muted">没有记录，不代表没有人喂过；到现场再看一看。</p></div><div class="tabs care-filters"><button type="button" data-care-filter="follow" aria-pressed="${careFilter==='follow'}" class="${careFilter==='follow'?'active':''}">我关注的</button><button type="button" data-care-filter="all" aria-pressed="${careFilter==='all'}" class="${careFilter==='all'?'active':''}">全部猫咪</button></div></div><div class="care-cat-list">${careCats(state,careFilter).map(({cat,last})=>`<article class="care-cat-row"><button type="button" class="care-cat-photo" data-care-cat="${esc(cat.id)}" aria-label="查看${esc(cat.name)}的档案">${safeImage(cat.photo)?`<img src="${esc(cat.photo)}" alt="${esc(cat.name)}" loading="lazy">`:''}</button><div class="care-cat-info"><button type="button" class="text-button cat-name" data-care-cat="${esc(cat.id)}">${esc(cat.name)}</button><p>${last?`最近一次喂养记录：<time>${esc(exactTime(last.time))}</time>`:'暂无喂养记录'}</p>${last?`<p class="small muted">${esc(last.amount||last.detail)} · ${esc(last.actor||'社区邻居')}${ctx.runtime.shared?' 分享':' 记录'}</p>`:`<p class="small muted">可以先查看档案或咨询照护者。</p>`}</div><div class="care-cat-actions"><button type="button" class="text-button" data-care-cat="${esc(cat.id)}">查看档案 ${icon('arrow',16)}</button><button type="button" class="button secondary small" data-care-record="${esc(cat.id)}">记录喂养</button></div></article>`).join('')||`<div class="empty-state"><h3>${careFilter==='follow'?'还没有关注的猫咪':'社区还没有猫咪档案'}</h3><p>${careFilter==='follow'?'在猫咪档案中点一下关注，下次就能在这里看到它的近况。':'先认识社区里的猫咪，再一起照护。'}</p><a class="button secondary small" href="#cats">去看看猫</a>${careFilter==='follow'?'<button type="button" class="text-button" data-care-filter="all">查看全部猫咪</button>':''}</div>`}</div></section><details class="care-recognition" ${recognitionOpen?'open':''}><summary>${icon(manual?'search':'camera',22)}<span>${manual?'选择猫咪，查看喂养记录':'遇到不认识的猫咪？'}<small>${manual?'核对照片与名字，手动查找猫咪档案。':'拍照查找档案，再确认最近的喂养记录。'}</small></span>${icon('plus',20)}</summary><div id="care-recognition-content"></div></details>`;
 main.querySelectorAll('[data-care-filter]').forEach(button=>button.onclick=()=>{careFilter=button.dataset.careFilter;renderCare(main,ctx);});
 main.querySelectorAll('[data-care-cat]').forEach(button=>button.onclick=()=>ctx.openCat(button.dataset.careCat));
 main.querySelectorAll('[data-care-record]').forEach(button=>button.onclick=()=>ctx.openRecord('feeding',button.dataset.careRecord));
 const details=main.querySelector('.care-recognition');let mounted=false;
 const mount=()=>{if(!mounted){renderRecognition(main.querySelector('#care-recognition-content'),ctx);mounted=true;}};
 if(recognitionOpen)mount();
 details.addEventListener('toggle',()=>{recognitionOpen=details.open;if(details.open)mount();});
 main.querySelector('[data-open-recognition]').onclick=()=>{details.open=true;recognitionOpen=true;mount();details.scrollIntoView({behavior:'smooth',block:'start'});};
}
