import {readPhoto,exactTime,safeImage} from './data.js';
const signatures=new Map();
async function signature(src){
 if(signatures.has(src))return signatures.get(src);
 const img=new Image();img.src=src;await img.decode();
 const c=document.createElement('canvas');c.width=9;c.height=8;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,9,8);const d=g.getImageData(0,0,9,8).data;
 const hash=[],rgb=[0,0,0];let n=0;
 for(let y=0;y<8;y++)for(let x=0;x<9;x++){const a=(y*9+x)*4;for(let k=0;k<3;k++)rgb[k]+=d[a+k];n++;if(x<8){const b=a+4;hash.push(d[a]*.299+d[a+1]*.587+d[a+2]*.114>d[b]*.299+d[b+1]*.587+d[b+2]*.114);}}
 const result={hash,rgb:rgb.map(v=>v/n)};if(!src.startsWith('data:'))signatures.set(src,result);return result;
}
export async function findCandidate(src,cats){
 const input=await signature(src);const scored=await Promise.all(cats.map(async cat=>{const s=await signature(cat.photo);const h=s.hash.reduce((v,b,i)=>v+(b!==input.hash[i]),0);const color=Math.sqrt(s.rgb.reduce((v,b,i)=>v+(b-input.rgb[i])**2,0));return {cat,h,color,score:h+color/8};}));
 scored.sort((a,b)=>a.score-b.score);const best=scored[0];return best.h<=10&&best.color<=45?best.cat:null;
}
export function renderRecognition(root,ctx){
 root.innerHTML=`<section class="page-intro scan-intro"><div><h1 class="display">先认一认，<br><em>再决定要不要喂。</em></h1><p>上传照片，查找猫咪档案和最近喂养记录。</p></div><div class="scan-intro-side"><p class="scan-method">${ctx.icon('camera',22)} 本地图片相似度试验<br><span>不是 AI 个体识别，匹配后仍需人工确认。</span></p><a class="text-button" href="#modules">返回功能中心 ${ctx.icon('arrow',16)}</a></div></section>
 <div class="scan-layout"><section class="upload-zone"><div id="scan-preview" class="scan-preview"><div class="scan-corners">${ctx.icon('camera',54)}</div><h2>拍照或上传猫咪照片</h2><p>看看眼前这位，是哪位小邻居。</p></div><div class="scan-buttons"><label class="button upload-button" tabindex="0" role="button">${ctx.icon('image')} 选择照片<input id="scan-file" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden></label><button class="button secondary" id="sample-scan">使用示例照片</button></div><p class="small muted">支持 JPG、PNG、WebP，最大 10MB。照片仅在当前浏览器处理。</p><p id="scan-status" role="status" class="small"></p></section>
 <section id="scan-result" class="scan-result"><div class="empty-state"><span class="empty-icon">${ctx.icon('paw',42)}</span><h2>从一次认出开始</h2><p>确认猫咪后，查看邻居留下的喂养记录。<br>没有可靠匹配时，你也可以手动查找。</p><button id="manual-start" class="button secondary small">手动选择猫咪 ${ctx.icon('arrow',16)}</button></div></section></div>
 <aside class="scan-footnote">${ctx.icon('clock',20)} <p>照片不能告诉我们猫咪是否吃过。这里展示的是有来源和时间的记录；有记录不等于当前饱腹，无记录也不代表未被喂养。</p></aside>`;
 const result=root.querySelector('#scan-result'),status=root.querySelector('#scan-status'),input=root.querySelector('#scan-file');let busy=false;
 const manual=()=>{result.innerHTML=`<h2>选择你认识的猫咪</h2><p class="muted small">请先核对照片与辨认特征，再查看记录。</p><div class="manual-cats">${ctx.cats.map(c=>`<button class="cat-mini" data-pick="${c.id}"><img src="${c.photo}" alt="${c.name}"><span>${c.name}<small>${c.color}</small></span>${ctx.icon('arrow',16)}</button>`).join('')}</div>`;result.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>showRecords(ctx.cats.find(c=>c.id===b.dataset.pick)));};
 const showRecords=cat=>{
  const records=ctx.state.records.filter(r=>r.catId===cat.id&&r.type==='feeding').sort((a,b)=>b.time-a.time);
  result.innerHTML=`<div class="scan-cat"><img src="${cat.photo}" alt="${cat.name}"><div><span class="small muted">已由你确认的猫咪</span><h2>${cat.name}</h2><button class="text-button" id="scan-cat-profile">查看完整档案 ${ctx.icon('arrow',15)}</button></div></div><div class="section-title"><h3>最近喂养记录</h3><button class="text-button" id="change-cat">重新选择</button></div><div class="timeline">${records.length?records.slice(0,5).map(r=>`<article class="timeline-item"><span class="timeline-dot"></span><time>${ctx.escape(exactTime(r.time))}</time><h4>${ctx.escape(r.amount||r.detail)}</h4><p>${ctx.escape(r.actor)}${r.mine?' · 我记录的':' · 示例记录'}</p><p class="small">${ctx.escape(r.detail)}</p></article>`).join(''):`<div class="empty-state compact"><p>还没有可查询的喂养记录。</p><p class="small">这不代表它没有被喂过，可先联系熟悉它的照护者。</p></div>`}</div><button class="button" id="scan-record">${ctx.icon('bowl')} 我刚刚喂过，记一下</button><p class="small muted">仅记录实际发生的照护，不会因为查看或识别而自动增加记录。</p>`;
  result.querySelector('#scan-cat-profile').onclick=()=>ctx.openCat(cat.id);result.querySelector('#change-cat').onclick=manual;result.querySelector('#scan-record').onclick=()=>ctx.openRecord('feeding',cat.id);
 };
 const scan=async src=>{
  if(busy)return;busy=true;root.querySelector('#sample-scan').disabled=true;input.disabled=true;status.textContent='正在比较照片，请稍候…';
  root.querySelector('#scan-preview').innerHTML=`<img class="uploaded-cat" src="${ctx.escape(src)}" alt="本次选择的猫咪照片">`;
  try{const cat=await findCandidate(src,ctx.cats);status.textContent='照片比较完成。';
   if(!cat){result.innerHTML=`<div class="empty-state"><span class="empty-icon">${ctx.icon('search',42)}</span><h2>暂未找到可靠的相似照片</h2><p>本地匹配只比较图片特征，<br>换个角度拍摄可能无法匹配同一只猫。</p><button class="button secondary" id="manual-fallback">手动查找猫咪</button></div>`;result.querySelector('#manual-fallback').onclick=manual;}
   else{result.innerHTML=`<p class="small muted">相似图片候选 · 请先人工确认</p><div class="candidate-photo"><img src="${cat.photo}" alt="候选猫咪${cat.name}"></div><h2>可能是${cat.name}</h2><p>${ctx.escape(cat.description)}</p><div class="button-row"><button class="button" id="confirm-cat">确认是${cat.name} ${ctx.icon('check',18)}</button><button class="button secondary" id="wrong-cat">不是，重新选择</button></div>`;result.querySelector('#confirm-cat').onclick=()=>showRecords(cat);result.querySelector('#wrong-cat').onclick=manual;}
  }catch{status.textContent='照片未能读取，请重新选择，或使用手动查找。';manual();}finally{busy=false;root.querySelector('#sample-scan').disabled=false;input.disabled=false;}
 };
 input.onchange=async()=>{if(!input.files[0])return;try{const src=await readPhoto(input.files[0]);await scan(src);}catch(e){status.textContent=e.message;}finally{input.value='';}};
 root.querySelector('#sample-scan').onclick=()=>scan(ctx.cats[0].photo);root.querySelector('#manual-start').onclick=manual;
 root.querySelector('.upload-button').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click();}};
}
