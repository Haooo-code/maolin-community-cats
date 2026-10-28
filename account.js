// Credentials and recovery codes stay in memory; they are never persisted locally.
let mode='login',renderedIdentity=null;
const drafts={login:{},signup:{},recover:{},reissue:{}};
const labels={login:'登录账号',signup:'注册账号',recover:'找回账号'};

export function accountMarkup(ctx){
 const {runtime,escape:esc}=ctx;
 if(!runtime?.shared||!runtime.authRequiredForWrites)return '';
 const account=runtime.account||{};
 const identity=account.authenticated?account.username:'guest';
 if(renderedIdentity!==null&&renderedIdentity!==identity)for(const draft of Object.values(drafts))for(const key of Object.keys(draft))delete draft[key];
 renderedIdentity=identity;
 const code=runtime.recoveryCode;
 const recovery=code?`<section class="account-recovery" aria-labelledby="recovery-heading"><h3 id="recovery-heading">请保存你的恢复码</h3><p>忘记密码时，使用用户名和这段恢复码找回账号。恢复码只在本次页面中显示，请保存在你自己的安全位置，不要发到群里。</p><label class="form-field">账号恢复码<input data-recovery-code value="${esc(code)}" readonly spellcheck="false" autocomplete="off"></label><div class="button-row"><button class="button secondary small" type="button" data-copy-recovery>复制恢复码</button><button class="button secondary small" type="button" data-download-recovery>下载保存</button><button class="text-button" type="button" data-dismiss-recovery>我已保存，隐藏恢复码</button></div><p class="small" data-recovery-status role="status"></p></section>`:'';
 const note=runtime.accountNotice?`<p class="record-reminder" role="status">${esc(runtime.accountNotice)}</p>`:'';
 if(account.authenticated)return `<section class="account-section" aria-labelledby="account-heading"><div class="account-heading"><div><h2 id="account-heading">我的账号</h2><p class="muted">用户名：${esc(account.username)} · 换设备后登录同一账号，即可查看自己的记录。</p></div><button class="button secondary small" type="button" data-account-logout>退出登录</button></div>${note}${recovery}${account.canClaimGuest?`<form data-claim-form class="account-claim"><h3>保留这台浏览器的旧记录</h3><p class="small muted">发现 ${Number(account.guestPostCount)||0} 条旧动态、${Number(account.guestRecordCount)||0} 条旧照护记录，以及可能存在的关注、留言和喜欢。</p><label class="check-field"><input type="checkbox" name="confirm" required>我确认这些旧记录属于我，将它们关联到当前账号。关联完成后，其他账号不能再次领取。</label><p class="form-error" data-account-error role="alert"></p><button class="button secondary small" type="submit">关联旧记录到当前账号</button></form>`:''}<details class="account-claim"><summary>重新生成恢复码</summary><p class="small muted">如果没有保存恢复码，可以验证当前密码后重新生成。生成成功后，旧恢复码会失效，请保存新码。</p><form class="account-form" data-reissue-form><label class="form-field">当前密码<input name="password" type="password" required autocomplete="current-password"></label><p class="form-error" data-account-error role="alert"></p><button class="button secondary small" type="submit">重新生成恢复码</button></form></details><p class="form-error" data-logout-error role="alert"></p></section>`;
 const claim=account.canClaimGuest&&mode!=='recover'?`<label class="check-field"><input type="checkbox" name="claimGuest">同时将这台浏览器的旧记录关联到我的账号（${Number(account.guestPostCount)||0} 条动态、${Number(account.guestRecordCount)||0} 条照护记录及已有互动）。仅在确认属于自己时勾选；也可以登录后再关联。</label>`:'';
 return `<section class="account-section" aria-labelledby="account-heading"><div class="account-heading"><div><h2 id="account-heading">让照顾，跟着你的账号走</h2><p class="muted">可以先看看猫和邻里动态。登录后再发布、关注或记录照护，换设备也能继续。</p></div></div>${note}${recovery}<div class="tabs account-tabs" role="group" aria-label="账号操作">${Object.entries(labels).map(([key,label])=>`<button type="button" data-account-mode="${key}" aria-pressed="${key===mode}" class="${key===mode?'active':''}">${label}</button>`).join('')}</div><form class="account-form" data-account-form><label class="form-field">用户名<input name="username" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_]{3,24}" autocomplete="username" autocapitalize="none" spellcheck="false" aria-describedby="username-help"></label><p class="small muted" id="username-help">3–24 位英文字母、数字或下划线，不区分大小写。</p>${mode==='signup'?'<label class="form-field">显示昵称<input name="nickname" required maxlength="24" autocomplete="nickname" placeholder="邻居们怎么称呼你"></label>':''}${mode==='recover'?'<label class="form-field">账号恢复码<input name="recoveryCode" required autocomplete="off" autocapitalize="none" spellcheck="false"></label><p class="small muted">找回成功后，旧密码和所有设备的登录状态将失效，并生成新的恢复码。</p>':''}<label class="form-field">${mode==='recover'?'新密码':'密码'}<input name="password" type="password" required minlength="8" maxlength="72" autocomplete="${mode==='login'?'current-password':'new-password'}" aria-describedby="password-help"></label><p class="small muted" id="password-help">${mode==='login'?'使用注册时设置的密码。':'至少 8 位，最多 72 个 UTF-8 字节；建议使用密码管理器保存。注册不需要邮箱或短信。'}</p>${claim}<p class="form-error" data-account-error role="alert"></p><button type="submit" class="button">${labels[mode]}</button></form></section>`;
}

export function bindAccount(root,ctx){
 if(!ctx.runtime?.authRequiredForWrites)return;
 const rerender=()=>{ctx.render();root.querySelector('[name="username"]')?.focus();};
 root.querySelectorAll('[data-account-mode]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.accountMode;rerender();}));
 const form=root.querySelector('[data-account-form]');
 if(form){
  const draft=drafts[mode];
  for(const [key,value] of Object.entries(draft)){const input=form.elements[key];if(input){if(input.type==='checkbox')input.checked=value;else input.value=value;}}
  form.addEventListener('input',event=>{const input=event.target;if(input.name)draft[input.name]=input.type==='checkbox'?input.checked:input.value;});
  form.addEventListener('submit',async event=>{
   event.preventDefault();const action=mode;
   const payload={username:form.elements.username.value.trim(),password:form.elements.password.value};
   if(action==='signup')payload.nickname=form.elements.nickname.value.trim();
   if(action==='recover')payload.recoveryCode=form.elements.recoveryCode.value.trim();
   else payload.claimGuest=form.elements.claimGuest?.checked===true;
   await ctx.submitDraft(form,form.querySelector('[data-account-error]'),()=>ctx.accountCommand(action,payload),()=>{
    for(const saved of Object.values(drafts))for(const key of Object.keys(saved))delete saved[key];
    mode='login';ctx.render();ctx.toast(action==='recover'?'密码已更新，请保存新的恢复码。':action==='signup'?'账号已创建，请保存恢复码。':'已登录，你的记录已同步。');
   });
  });
 }
 root.querySelector('[data-account-logout]')?.addEventListener('click',async event=>{
  const button=event.currentTarget;button.disabled=true;
  try{await ctx.accountCommand('logout');for(const saved of Object.values(drafts))for(const key of Object.keys(saved))delete saved[key];ctx.render();ctx.toast('已退出账号，可以继续浏览社区。');}
  catch(error){const target=root.querySelector('[data-logout-error]');if(target)target.textContent=error.message;}
  finally{button.disabled=false;}
 });
 const reissue=root.querySelector('[data-reissue-form]');
 if(reissue){
  reissue.elements.password.value=drafts.reissue.password||'';
  reissue.elements.password.addEventListener('input',()=>{drafts.reissue.password=reissue.elements.password.value;});
  reissue.addEventListener('submit',async event=>{
   event.preventDefault();const password=reissue.elements.password.value;
   await ctx.submitDraft(reissue,reissue.querySelector('[data-account-error]'),()=>ctx.accountCommand('recovery-code',{password}),()=>{delete drafts.reissue.password;ctx.render();ctx.toast('新的恢复码已生成，请保存。');});
  });
 }
 const claim=root.querySelector('[data-claim-form]');
 claim?.addEventListener('submit',async event=>{event.preventDefault();if(!claim.elements.confirm.checked)return;await ctx.submitDraft(claim,claim.querySelector('[data-account-error]'),()=>ctx.accountCommand('claim',{confirm:true}),()=>{ctx.render();ctx.toast('旧记录已关联到当前账号。');});});
 root.querySelector('[data-copy-recovery]')?.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(ctx.runtime.recoveryCode);root.querySelector('[data-recovery-status]').textContent='恢复码已复制，请保存到安全位置。';}
  catch{const input=root.querySelector('[data-recovery-code]');input.focus();input.select();root.querySelector('[data-recovery-status]').textContent='未能自动复制，已选中恢复码，请手动复制保存。';}
 });
 root.querySelector('[data-download-recovery]')?.addEventListener('click',()=>{
  const text=`猫邻账号恢复码\n用户名：${ctx.runtime.account.username}\n恢复码：${ctx.runtime.recoveryCode}\n请妥善保管，不要分享。密码找回成功后会生成新恢复码。\n`;
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='猫邻-账号恢复码.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);root.querySelector('[data-recovery-status]').textContent='已发起下载，请确认文件保存成功后再隐藏恢复码。';
 });
 root.querySelector('[data-dismiss-recovery]')?.addEventListener('click',()=>{ctx.runtime.recoveryCode='';ctx.render();});
}
