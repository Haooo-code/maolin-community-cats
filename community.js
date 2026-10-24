let activeFilter = 'all';
const expandedComments = new Set();
const commentDrafts = new Map();
const labels = { daily: '日常相遇', feeding: '喂养记录', rescue: '救助记录' };

// Photos stay local to this demo; arbitrary remote URLs and SVG data are excluded.
function safePhoto(value) {
  return typeof value === 'string' && (/^(?:\.\/|\/)?assets\/[\w.-]+\.(?:png|jpe?g|webp)$/i.test(value) || /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value));
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `comment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Render the local neighborhood feed. All user-authored strings are escaped. */
export function renderCommunity(root, ctx) {
  const { state, cats, escape: esc, icon } = ctx;
  const posts = Array.isArray(state.posts) ? state.posts : [];
  const visible = posts.filter(post => activeFilter === 'all' || post.type === activeFilter)
    .sort((a, b) => Number(b.time) - Number(a.time));
  const catFor = id => cats.find(cat => cat.id === id);

  const renderPost = (post, index) => {
    const cat = catFor(post.catId);
    const comments = Array.isArray(post.comments) ? post.comments : [];
    const expanded = expandedComments.has(post.id);
    const author = post.author || '一位社区邻居';
    const avatarColor = /^#[0-9a-f]{3,8}$/i.test(post.avatar || '') ? post.avatar : '#d8dfbb';
    const commentId = `post-comments-${index}`;
    return `<article class="post" data-post="${esc(post.id)}">
      <div class="post-meta"><span class="avatar" style="background:${avatarColor}" aria-hidden="true">${esc(Array.from(author)[0] || '邻')}</span><div><strong>${esc(author)}</strong><div class="muted">${esc(ctx.time(post.time))} · ${esc(labels[post.type] || '日常相遇')}${post.mine ? ' · 我发布的' : ''}</div></div></div>
      <p class="post-text">${esc(post.text || '').replace(/\n/g, '<br>')}</p>
      ${safePhoto(post.image) ? `<div class="post-images"><img src="${esc(post.image)}" alt="${esc(cat ? `${cat.name}的社区近况` : '邻居分享的猫咪照片')}" loading="lazy"></div>` : ''}
      ${cat ? `<button type="button" class="chip post-cat" data-cat="${esc(cat.id)}">关于 ${esc(cat.name)} ${icon('arrow', 14)}</button>` : ''}
      <div class="post-actions"><button type="button" class="icon-button ${post.liked ? 'is-liked' : ''}" data-like aria-pressed="${Boolean(post.liked)}" aria-label="${post.liked ? '取消喜欢' : '喜欢这条动态'}">${icon('heart', 18)}<span>${Math.max(0, Number(post.likes) || 0)}</span></button><button type="button" class="icon-button" data-comments aria-expanded="${expanded}" aria-controls="${commentId}">${icon('message', 18)}<span>${comments.length ? `${comments.length} 条留言` : '留言'}</span></button></div>
      <section id="${commentId}" class="post-comments" aria-label="动态留言" ${expanded ? '' : 'hidden'}>
        ${comments.length ? comments.map(comment => `<div class="comment"><p><strong>${esc(comment.author || '一位社区邻居')}</strong> <span class="muted">${esc(ctx.time(comment.time))}</span></p><p>${esc(comment.text || '').replace(/\n/g, '<br>')}</p></div>`).join('') : '<p class="muted">留下一句温柔的回应。</p>'}
        <form data-comment-form><label class="form-field"><span class="sr-only">给这条动态留言</span><input name="comment" maxlength="300" required autocomplete="off" placeholder="写下你的留言…" value="${esc(commentDrafts.get(post.id) || '')}"></label><button type="submit" class="button small">留言</button></form>
      </section>
    </article>`;
  };

  root.innerHTML = `<section class="page-intro"><div><h1 class="display">邻里动态</h1><p>一次相遇，一张照片。把牵挂，留在日常里。</p></div><div class="button-row"><a class="text-button" href="#modules">${icon('arrow', 16)} 返回功能中心</a><button type="button" class="button" data-compose>${icon('plus', 18)} 发布动态</button></div></section>
    <div class="feed-layout"><section class="feed-main" aria-label="社区动态"><div class="tabs" role="group" aria-label="筛选动态">${[['all', '全部动态'], ...Object.entries(labels)].map(([value, label]) => `<button type="button" data-filter="${value}" class="${value === activeFilter ? 'active' : ''}" aria-pressed="${value === activeFilter}">${label}</button>`).join('')}</div>
      ${visible.length ? visible.map(renderPost).join('') : `<div class="empty-state">${icon('camera', 30)}<h2>这里还没有${activeFilter === 'all' ? '动态' : labels[activeFilter]}</h2><p>从一张照片、一段近况开始记录。</p><button type="button" class="button secondary" data-compose>分享一次相遇</button></div>`}
    </section><aside class="feed-side"><section class="panel"><h2 class="section-title">一起照顾它们</h2><p class="muted">先看看猫咪的近况，再留下你的照护记录。</p>${cats.slice(0, 3).map(cat => `<button type="button" class="cat-mini" data-cat="${esc(cat.id)}">${safePhoto(cat.photo) ? `<img src="${esc(cat.photo)}" alt="" loading="lazy">` : ''}<span><strong>${esc(cat.name)}</strong><small>${esc(cat.area || cat.color || '')}</small></span>${icon('arrow', 17)}</button>`).join('')}</section><section class="panel"><h2 class="section-title">给邻里的小约定</h2><p>分享真实近况，尊重邻居和猫咪的空间。喂养后收好食具，也带走散落的食物。</p><p class="muted">本机演示 · 记录保存在当前浏览器。示例邻居的动态用于展示，不代表实时社区信息。</p></section></aside></div>`;

  root.querySelectorAll('[data-compose]').forEach(button => button.addEventListener('click', () => ctx.openCompose()));
  root.querySelectorAll('[data-cat]').forEach(button => button.addEventListener('click', () => ctx.openCat(button.dataset.cat)));
  root.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    renderCommunity(root, ctx);
  }));
  root.querySelectorAll('[data-post]').forEach(article => {
    const post = posts.find(item => String(item.id) === article.dataset.post);
    if (!post) return;
    article.querySelector('[data-like]').addEventListener('click', () => {
      const previous = { liked: post.liked, likes: post.likes };
      post.liked = !post.liked;
      post.likes = Math.max(0, (Number(post.likes) || 0) + (post.liked ? 1 : -1));
      if (ctx.persist() === false) Object.assign(post, previous);
      renderCommunity(root, ctx);
    });
    article.querySelector('[data-comments]').addEventListener('click', () => {
      if (expandedComments.has(post.id)) expandedComments.delete(post.id);
      else expandedComments.add(post.id);
      renderCommunity(root, ctx);
    });
    const form = article.querySelector('[data-comment-form]');
    const input = form.elements.comment;
    input.addEventListener('input', () => commentDrafts.set(post.id, input.value));
    form.addEventListener('submit', event => {
      event.preventDefault();
      const text = input.value.trim().slice(0, 300);
      if (!text) { input.setCustomValidity('请写下留言后再提交。'); input.reportValidity(); return; }
      input.setCustomValidity('');
      if (!Array.isArray(post.comments)) post.comments = [];
      post.comments.push({ id: makeId(), author: state.nickname || '一位社区邻居', text, time: Date.now(), mine: true });
      const saved = ctx.persist();
      if (saved === false) { post.comments.pop(); return; }
      commentDrafts.delete(post.id);
      renderCommunity(root, ctx);
      if (saved !== false) ctx.toast('留言已保存在本机');
    });
    input.addEventListener('input', () => input.setCustomValidity(''));
  });
}
