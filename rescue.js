const tasks = [
  {
    id: 'water-xiaohei',
    catId: 'xiaohei',
    title: '小黑 · 饮水点巡查',
    text: '社区绿地饮水点水量偏低，需要补充清水并清理周边。',
    time: '今天 18:30',
    tag: '日常照护',
    image: './assets/cat-orange.jpg',
    urgent: false
  },
  {
    id: 'xiaohua-check',
    catId: 'xiaohua',
    title: '小花 · 皮肤状况复查',
    text: '近期动态提到耳后疑似发红，需要熟悉它的邻居一起确认。',
    time: '今天 20:00',
    tag: '需要关注',
    image: './assets/cat-tabby.jpg',
    urgent: true
  },
  {
    id: 'shared-cleanup',
    catId: '',
    title: '共享喂食点 · 清洁交接',
    text: '收好食具、清理散落食物，完成后留下一次简短交接记录。',
    time: '明天 08:00',
    tag: '环境协作',
    image: './assets/cat-green.jpg',
    urgent: false
  }
];

export function renderRescue(root, ctx) {
  const { state, cats, escape: esc, icon } = ctx;
  state.rescueClaims = Array.isArray(state.rescueClaims) ? state.rescueClaims : [];
  const catFor = id => cats.find(cat => cat.id === id);

  const taskCards = tasks.map(task => {
    const cat = catFor(task.catId);
    const claimed = state.rescueClaims.includes(task.id);
    return `<article class="rescue-card ${task.urgent ? 'is-urgent' : ''}">
      <div class="rescue-card-main">
        <img class="rescue-card-photo" src="${task.image}" alt="示例猫咪照护任务配图">
        <div>
          <div class="rescue-card-head">
            <span class="chip">${esc(task.tag)}</span>
            <span class="small muted">${esc(task.time)}</span>
          </div>
          <h3>${esc(task.title)}</h3>
          <p>${esc(task.text)}</p>
        </div>
      </div>
      <div class="rescue-card-foot">
        ${cat ? `<button type="button" class="text-button" data-open-cat="${esc(cat.id)}">查看 ${esc(cat.name)} 档案 ${icon('arrow', 15)}</button>` : '<span class="small muted">公共区域协作</span>'}
        <button type="button" class="button small ${claimed ? 'secondary' : ''}" data-claim="${esc(task.id)}" ${claimed ? 'disabled' : ''}>
          ${claimed ? `${icon('check', 15)} 已接棒` : `${icon('rescue', 15)} 我来接棒`}
        </button>
      </div>
    </article>`;
  }).join('');

  root.innerHTML = `<section class="page-intro rescue-intro">
    <div>
      <h1 class="display">一起接住<br><em>下一次求助。</em></h1>
      <p>把实际需要的照护写清楚，让发现、认领和交接都能继续。</p>
    </div>
    <div class="button-row">
      <a class="text-button" href="#modules">${icon('arrow', 16)} 返回功能中心</a>
      <button type="button" class="button" data-rescue-record>${icon('rescue', 18)} 记录一次救助</button>
      <button type="button" class="button secondary" data-rescue-post>${icon('plus', 18)} 发布社区求助</button>
    </div>
  </section>
  <div class="rescue-layout">
    <section class="rescue-board" aria-label="待协作照护任务">
      <div class="section-title">
        <div><h2>待接力的照护</h2><p class="muted">先确认现场情况，再选择自己能够完成的任务。</p></div>
        <span class="chip">${tasks.filter(task => !state.rescueClaims.includes(task.id)).length} 项待处理</span>
      </div>
      <div class="rescue-list">${taskCards}</div>
      <p class="small muted">以上为交互示例，不代表真实社区排班。紧急医疗情况应联系专业兽医或救助机构。</p>
    </section>
    <aside class="rescue-side">
      <section class="panel">
        <h2>照护交接</h2>
        <ol class="rescue-steps">
          <li><strong>确认需求</strong><span>明确猫咪、地点和需要完成的事。</span></li>
          <li><strong>认领任务</strong><span>只接自己能在时间内完成的照护。</span></li>
          <li><strong>留下记录</strong><span>记录实际发生的时间、结果和下一班。</span></li>
        </ol>
        <div class="rescue-rule-divider" aria-hidden="true"></div>
      </section>
      <section class="panel">
        <h2>安全边界</h2>
        <img class="rescue-side-photo" src="./assets/cat-basket.jpg" alt="社区猫咪照护示意照片">
        <p class="small">公开页面只展示模糊区域；不公开精确位置，不擅自处理疑似疾病，也不鼓励无管理投喂。</p>
      </section>
    </aside>
  </div>`;

  root.querySelector('[data-rescue-record]')?.addEventListener('click', () => ctx.openRecord('rescue'));
  root.querySelector('[data-rescue-post]')?.addEventListener('click', () => ctx.openCompose('', 'rescue'));
  root.querySelectorAll('[data-open-cat]').forEach(button => {
    button.addEventListener('click', () => ctx.openCat(button.dataset.openCat));
  });
  root.querySelectorAll('[data-claim]').forEach(button => {
    button.addEventListener('click', () => {
      const taskId = button.dataset.claim;
      if (state.rescueClaims.includes(taskId)) return;
      state.rescueClaims.push(taskId);
      if (!ctx.persist()) {
        state.rescueClaims = state.rescueClaims.filter(id => id !== taskId);
        return;
      }
      renderRescue(root, ctx);
      ctx.toast('你已接棒，完成后请补充一条照护记录。');
    });
  });
}
