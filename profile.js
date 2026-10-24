let activeTab = 'records';
let editingNickname = false;

function safePhoto(value) {
  return typeof value === 'string' && (/^(?:\.\/|\/)?assets\/[\w.-]+\.(?:png|jpe?g|webp)$/i.test(value) || /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value));
}

/** Render only the current browser's personal activity, without seeded achievements. */
export function renderProfile(root, ctx) {
  const { state, cats, escape: esc, icon } = ctx;
  const records = (Array.isArray(state.records) ? state.records : []).filter(record => record.mine === true).sort((a, b) => Number(b.time) - Number(a.time));
  const posts = (Array.isArray(state.posts) ? state.posts : []).filter(post => post.mine === true).sort((a, b) => Number(b.time) - Number(a.time));
  const follows = Array.isArray(state.follows) ? state.follows : [];
  const followedCats = cats.filter(cat => follows.includes(cat.id));
  const nickname = state.nickname || '一位社区邻居';
  const catFor = id => cats.find(cat => cat.id === id);
  const recordLabel = type => type === 'rescue' ? '救助记录' : '喂养记录';
  const empty = (title, detail, action = '') => `<div class="empty-state">${icon(activeTab === 'follows' ? 'bookmark' : activeTab === 'posts' ? 'camera' : 'bowl', 30)}<h2>${title}</h2><p>${detail}</p>${action}</div>`;

  let content;
  if (activeTab === 'follows') {
    content = followedCats.length ? `<div class="follow-list">${followedCats.map(cat => `<article class="cat-mini">${safePhoto(cat.photo) ? `<img src="${esc(cat.photo)}" alt="${esc(cat.name)}" loading="lazy">` : ''}<div><button type="button" class="text-button" data-cat="${esc(cat.id)}"><strong>${esc(cat.name)}</strong></button><p class="muted">${esc(cat.area || cat.color || '')}</p></div><button type="button" class="button secondary small" data-unfollow="${esc(cat.id)}">取消关注</button></article>`).join('')}</div>` : empty('还没有关注的猫咪', '在猫咪档案里点击关注，方便下次查看它的近况。');
  } else if (activeTab === 'posts') {
    content = posts.length ? posts.map(post => {
      const cat = catFor(post.catId);
      return `<article class="post"><div class="post-meta"><span class="avatar" aria-hidden="true">${esc(Array.from(nickname)[0] || '邻')}</span><div><strong>${esc(post.author || nickname)}</strong><div class="muted">${esc(ctx.time(post.time))} · ${post.type === 'feeding' ? '喂养记录' : post.type === 'rescue' ? '救助记录' : '日常相遇'}</div></div></div><p class="post-text">${esc(post.text || '').replace(/\n/g, '<br>')}</p>${safePhoto(post.image) ? `<div class="post-images"><img src="${esc(post.image)}" alt="${esc(cat ? `${cat.name}的近况` : '我分享的猫咪照片')}" loading="lazy"></div>` : ''}${cat ? `<button type="button" class="chip" data-cat="${esc(cat.id)}">关于 ${esc(cat.name)} ${icon('arrow', 14)}</button>` : ''}</article>`;
    }).join('') : empty('还没有发布动态', '把今天的相遇记录下来，给牵挂它的邻居留一份近况。', '<button type="button" class="button secondary" data-compose>发布第一条动态</button>');
  } else {
    content = records.length ? `<div class="timeline">${records.map(record => {
      const cat = catFor(record.catId);
      return `<article class="timeline-item"><div class="timeline-icon">${icon(record.type === 'rescue' ? 'rescue' : 'bowl', 21)}</div><div><div class="post-meta"><strong>${recordLabel(record.type)}</strong><span class="muted">${esc(ctx.time(record.time))}</span></div>${cat ? `<button type="button" class="text-button" data-cat="${esc(cat.id)}">${esc(cat.name)} ${icon('arrow', 14)}</button>` : '<span class="muted">猫咪档案暂不可用</span>'}<p>${esc(record.detail || '未填写补充说明').replace(/\n/g, '<br>')}</p>${record.amount ? `<small class="muted">${esc(record.amount)}</small>` : ''}</div></article>`;
    }).join('')}</div>` : empty('每一份照顾，都值得记下', '你还没有自己的喂养或救助记录。从一次小小的照顾开始。', `<button type="button" class="button secondary" data-record="feeding">${icon('plus', 16)} 添加喂养记录</button>`);
  }

  root.innerHTML = `<section class="page-intro"><div><h1 class="display">我的小小足迹</h1><p>把每一份照顾，留成有迹可循的日常。</p></div><div class="button-row"><a class="text-button" href="#modules">${icon('arrow', 16)} 返回功能中心</a><button type="button" class="button secondary" data-export ${records.length ? '' : 'disabled'}>${icon('download', 18)} 导出我的记录</button></div></section>
    <section class="profile-header panel"><div class="profile-identity"><span class="avatar profile-avatar" aria-hidden="true">${esc(Array.from(nickname)[0] || '邻')}</span><div>${editingNickname ? `<form data-nickname-form><label class="form-field"><span>我的昵称</span><input name="nickname" value="${esc(nickname)}" required minlength="1" maxlength="24" autocomplete="nickname"></label><div class="form-actions"><button type="submit" class="button small">保存</button><button type="button" class="button secondary small" data-cancel-name>取消</button></div></form>` : `<h2>${esc(nickname)} <button type="button" class="icon-button" data-edit-name aria-label="修改昵称">${icon('edit', 17)}</button></h2><p class="muted">本机演示 · 记录保存在当前浏览器</p>`}</div></div><div class="profile-record-actions"><button type="button" class="button" data-record="feeding">${icon('bowl', 18)} 记录喂养</button><button type="button" class="button secondary" data-record="rescue">${icon('rescue', 18)} 记录救助</button></div></section>
    <section class="metric-strip" aria-label="我的照护统计"><div><strong>${records.filter(record => record.type === 'feeding').length}</strong><span>次喂养记录</span></div><div><strong>${records.filter(record => record.type === 'rescue').length}</strong><span>次救助记录</span></div><div><strong>${followedCats.length}</strong><span>只关注的猫咪</span></div><div><strong>${posts.length}</strong><span>条我的动态</span></div></section>
    <section class="profile-content"><div class="tabs" role="group" aria-label="查看我的活动">${[['records', '照护记录', records.length], ['follows', '关注的猫咪', followedCats.length], ['posts', '我的动态', posts.length]].map(([value, label, count]) => `<button type="button" data-tab="${value}" class="${activeTab === value ? 'active' : ''}" aria-pressed="${activeTab === value}">${label}<span class="tab-count">${count}</span></button>`).join('')}</div>${content}</section>`;

  root.querySelectorAll('[data-cat]').forEach(button => button.addEventListener('click', () => ctx.openCat(button.dataset.cat)));
  root.querySelectorAll('[data-record]').forEach(button => button.addEventListener('click', () => ctx.openRecord(button.dataset.record)));
  root.querySelectorAll('[data-compose]').forEach(button => button.addEventListener('click', () => ctx.openCompose()));
  root.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
    activeTab = button.dataset.tab;
    renderProfile(root, ctx);
  }));
  root.querySelectorAll('[data-unfollow]').forEach(button => button.addEventListener('click', () => {
    const cat = catFor(button.dataset.unfollow);
    state.follows = follows.filter(id => id !== button.dataset.unfollow);
    const saved = ctx.persist();
    if (saved === false) state.follows = follows;
    renderProfile(root, ctx);
    if (saved !== false) ctx.toast(`已取消关注${cat?.name || '这只猫咪'}`);
  }));
  root.querySelector('[data-edit-name]')?.addEventListener('click', () => {
    editingNickname = true;
    renderProfile(root, ctx);
    const input = root.querySelector('[name="nickname"]');
    input?.focus(); input?.select();
  });
  root.querySelector('[data-cancel-name]')?.addEventListener('click', () => {
    editingNickname = false;
    renderProfile(root, ctx);
  });
  const nameForm = root.querySelector('[data-nickname-form]');
  if (nameForm) {
    nameForm.elements.nickname.addEventListener('input', () => nameForm.elements.nickname.setCustomValidity(''));
    nameForm.addEventListener('submit', event => {
      event.preventDefault();
      const input = nameForm.elements.nickname;
      const value = input.value.trim().slice(0, 24);
      if (!value) { input.setCustomValidity('请输入一个昵称。'); input.reportValidity(); return; }
      const previous = state.nickname;
      state.nickname = value;
      const saved = ctx.persist();
      if (saved === false) { state.nickname = previous; return; }
      editingNickname = false;
      renderProfile(root, ctx);
      if (saved !== false) ctx.toast('昵称已保存在本机');
    });
  }
  root.querySelector('[data-export]').addEventListener('click', () => {
    if (!records.length) return;
    const payload = { exportedAt: new Date().toISOString(), nickname: state.nickname || '一位社区邻居', records };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    const now = new Date();
    link.download = `猫邻-我的照护记录-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.json`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    ctx.toast('已导出我的照护记录');
  });
}
