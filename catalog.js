import {readPhoto,safeImage} from './data.js';

const emptyDraft=()=>({name:'',color:'',area:'',description:'',image:''});
let draft=emptyDraft(),expanded=false,committed=false,pending=false,photoPending=false,message='';
let identity='',identityEpoch=0;
function syncIdentity(ctx){
 const next=ctx.runtime?.shared?(ctx.runtime.account?.authenticated?'account:'+ctx.runtime.account.username:'guest'):'local';
 if(next===identity)return;identity=next;identityEpoch++;draft=emptyDraft();expanded=false;committed=false;pending=false;photoPending=false;message='';
}

/** The draft survives navigation, refresh and a rejected request in this tab. */
export function catalogEditorMarkup(ctx){
 syncIdentity(ctx);
 if(!expanded)return '';
 const esc=ctx.escape;
 const similar=ctx.cats.filter(cat=>draft.name.trim()&&cat.name.trim()===draft.name.trim());
 return `<section class="catalog-editor" id="cat-editor" aria-labelledby="cat-editor-title"><div class="catalog-editor-heading"><div><h2 id="cat-editor-title">添加一位猫咪邻居</h2><p class="muted">先看看已有档案，确认没有同一只猫咪，再留下照片和辨认特征。</p></div><button type="button" class="text-button" data-close-cat-editor>收起，保留草稿</button></div><form data-cat-form ${pending?'aria-busy="true"':''}><label class="form-field">猫咪名字<input name="name" value="${esc(draft.name)}" required maxlength="40" autocomplete="off" placeholder="可以先取一个方便辨认的名字"></label><div data-similar-cats>${similar.length?`<p class="record-reminder">已有同名档案：${similar.map(cat=>`<button type="button" class="text-button" data-existing-cat="${esc(cat.id)}">${esc(cat.name)}</button>`).join('、')}。请先核对照片，避免重复建档。</p>`:''}</div><label class="photo-upload-label">${ctx.icon('image',22)} 猫咪照片（必填）<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" ${draft.image?'':'required'}></label><div data-cat-photo-preview>${safeImage(draft.image)?`<div class="attachment"><img src="${esc(draft.image)}" alt="准备添加的猫咪照片"><button type="button" class="icon-button" data-remove-cat-photo aria-label="移除猫咪照片">${ctx.icon('close')}</button></div>`:''}</div><p class="small muted">JPG、PNG、WebP，每张不超过 10MB。请使用你有权分享的照片，避开人物和门牌。</p><div class="two-col"><label class="form-field">花色（可选）<input name="color" value="${esc(draft.color)}" maxlength="60" placeholder="例如：狸花、白胸口"></label><label class="form-field">大致活动区域（可选）<input name="area" value="${esc(draft.area)}" maxlength="80" placeholder="例如：社区花园一带"></label></div><label class="form-field">辨认特征（可选）<textarea name="description" maxlength="500" rows="3" placeholder="例如：左耳有缺口，尾巴末端是白色">${esc(draft.description)}</textarea></label><p class="small muted">不确定的信息可以留空。请勿填写具体住址、门牌、联系电话或固定投喂时间。</p><p class="record-reminder">${ctx.runtime.shared?'照片和档案会保存到社区，持有分享口令的邻居可以查看。':'档案仅保存在当前浏览器，不会同步给其他邻居。'}建立档案后可手动选择猫咪记录照护；档案照片不会自动成为 AI 识别参考照。</p><p class="form-error" data-cat-error role="alert">${esc(committed?'保存结果尚未确认，请先刷新猫咪列表核对，勿重复添加。':message)}</p><div class="button-row"><button class="button" type="submit" ${pending||committed||photoPending?'disabled':''}>保存猫咪档案 ${ctx.icon('check',18)}</button>${committed?'<button type="button" class="button secondary" data-refresh-catalog>刷新猫咪列表</button>':''}<button class="text-button" type="button" data-discard-cat-draft>放弃这份草稿</button></div></form></section>`;
}

export function bindCatalogEditor(root,ctx){
 syncIdentity(ctx);
 root.querySelectorAll('[data-add-cat]').forEach(button=>button.addEventListener('click',()=>{
  if(ctx.requireAccount&&!ctx.requireAccount())return;
  expanded=true;ctx.render();root.querySelector('[data-cat-form] [name="name"]')?.focus();
 }));
 root.querySelector('[data-close-cat-editor]')?.addEventListener('click',()=>{expanded=false;ctx.render();root.querySelector('[data-add-cat]')?.focus();});
 const form=root.querySelector('[data-cat-form]');if(!form)return;
 const error=form.querySelector('[data-cat-error]');
 const freeze=()=>{form.setAttribute('aria-busy',String(pending||photoPending));for(const control of form.querySelectorAll('button,input,textarea,select'))control.disabled=pending||photoPending||(committed&&control.type==='submit');};
 freeze();
 for(const field of ['name','color','area','description'])form.elements[field].addEventListener('input',()=>{draft[field]=form.elements[field].value;});
 form.elements.name.addEventListener('input',()=>{const matches=ctx.cats.filter(cat=>draft.name.trim()&&cat.name.trim()===draft.name.trim());const target=form.querySelector('[data-similar-cats]');target.innerHTML=matches.length?`<p class="record-reminder">已有同名档案，请先核对照片，避免重复建档：${matches.map(cat=>ctx.escape(cat.name)).join('、')}。</p>`:'';});
 const removePhoto=()=>{draft.image='';form.elements.photo.value='';form.elements.photo.required=true;form.querySelector('[data-cat-photo-preview]').innerHTML='';};
 form.querySelector('[data-remove-cat-photo]')?.addEventListener('click',removePhoto);
 root.querySelectorAll('[data-existing-cat]').forEach(button=>button.addEventListener('click',()=>ctx.openCat(button.dataset.existingCat)));
 form.elements.photo.addEventListener('change',async()=>{
  const file=form.elements.photo.files[0];if(!file)return;const epoch=identityEpoch;photoPending=true;freeze();message='正在处理猫咪照片…';error.textContent=message;
  try{
   const image=await (ctx.readPhoto||readPhoto)(file);syncIdentity(ctx);if(epoch!==identityEpoch)return;draft.image=image;form.elements.photo.required=false;
   form.querySelector('[data-cat-photo-preview]').innerHTML=`<div class="attachment"><img src="${ctx.escape(draft.image)}" alt="准备添加的猫咪照片"><button type="button" class="icon-button" data-remove-cat-photo aria-label="移除猫咪照片">${ctx.icon('close')}</button></div>`;
   form.querySelector('[data-remove-cat-photo]')?.addEventListener('click',removePhoto);message='';error.textContent='';
  }catch(cause){syncIdentity(ctx);if(epoch!==identityEpoch)return;message=cause.message||'照片未能读取，请重新选择。';error.textContent=message;form.elements.photo.value='';}
  finally{if(epoch===identityEpoch){photoPending=false;ctx.render();}}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(pending||photoPending||committed)return;
  for(const field of ['name','color','area','description'])draft[field]=form.elements[field].value;
  const payload={...draft,name:draft.name.trim(),color:draft.color.trim(),area:draft.area.trim(),description:draft.description.trim()};
  if(!payload.name||!safeImage(payload.image)){message='请填写猫咪名字，并选择一张照片。';error.textContent=message;return;}
  const epoch=identityEpoch;pending=true;freeze();message='';error.textContent='';
  try{
   const saved=await ctx.command('cats',payload);syncIdentity(ctx);if(epoch!==identityEpoch)return;draft=emptyDraft();expanded=false;committed=false;message='';
   if(ctx.onCatAdded)ctx.onCatAdded(saved?.catId);else ctx.render();ctx.toast('猫咪档案已保存，可以在列表里查看。');
  }catch(cause){syncIdentity(ctx);if(epoch!==identityEpoch)return;committed=cause.committed===true;message=cause.message||'档案未能保存，请检查网络后重试。';error.textContent=message;}
  finally{if(epoch===identityEpoch){pending=false;freeze();if(expanded)ctx.render();}}
 });
 form.querySelector('[data-refresh-catalog]')?.addEventListener('click',async event=>{event.currentTarget.disabled=true;try{await ctx.refresh();}catch(cause){error.textContent=cause.message;}finally{event.currentTarget.disabled=false;}});
 form.querySelector('[data-discard-cat-draft]')?.addEventListener('click',()=>{draft=emptyDraft();expanded=false;committed=false;message='';ctx.render();root.querySelector('[data-add-cat]')?.focus();});
}
