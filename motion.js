const canHover = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let revealObserver = null;
let counterObserver = null;
let initialized = false;
let scrollFrame = 0;

function addScrollProgress() {
  if (document.querySelector('.scroll-progress')) return;
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<span></span>';
  document.body.append(progress);
}

function updateScrollState() {
  scrollFrame = 0;
  const root = document.documentElement;
  const max = Math.max(1, root.scrollHeight - innerHeight);
  const progress = Math.min(1, Math.max(0, scrollY / max));
  root.style.setProperty('--page-progress', progress.toFixed(4));
  document.body.classList.toggle('is-scrolled', scrollY > 24);
}

function scheduleScrollState() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(updateScrollState);
}

function bindRipples() {
  document.addEventListener('pointerdown', event => {
    if (reducedMotion() || !(event.target instanceof Element)) return;
    const host = event.target.closest('button, .button, .text-button, .chip, summary, .icon-button');
    if (!host || host.disabled || host.dataset.noRipple === 'true') return;
    const rect = host.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.7;
    const ripple = document.createElement('span');
    ripple.className = 'button-ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    host.classList.add('has-ripple-host');
    host.append(ripple);
    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }, { passive: true });
}

function prepareHero(main) {
  const hero = main.querySelector('.home-hero, .page-intro, .profile-header, .scan-intro');
  if (!hero) return null;
  hero.classList.add('motion-hero');
  hero.querySelectorAll('h1').forEach(title => title.classList.add('hero-heading-motion'));
  hero.querySelectorAll('.hero-copy > p, .page-intro p, .scan-method, .profile-header p').forEach((node, index) => {
    node.classList.add('hero-part-motion');
    node.style.setProperty('--motion-delay', `${220 + index * 70}ms`);
  });
  hero.querySelectorAll('.button-row, .hero-copy > .button, .hero-copy > .handwritten, .page-intro > .button, .page-intro > .text-button').forEach((node, index) => {
    node.classList.add('hero-action-motion');
    node.style.setProperty('--motion-delay', `${330 + index * 70}ms`);
  });
  hero.querySelectorAll('.hero-photo-frame, .profile-avatar').forEach(node => node.classList.add('hero-media-motion'));
  return hero;
}

function getRevealTargets(main, view) {
  const sections = [
    ...main.querySelectorAll('.care-story, .neighbors, .feed-layout, .care-overview, .scan-layout, .profile-content, .support-list, .rescue-layout, .neighbor-note, .catalog-editor, .account-section')
  ];
  const cards = [
    ...main.querySelectorAll('.cat-card, .post, .care-cat-row, .support-item, .follow-card, .rescue-card, .scan-result, .upload-zone, .panel')
  ];
  return { sections: [...new Set(sections)], cards: [...new Set(cards)], view };
}

function revealVisible(elements) {
  elements.forEach(element => {
    const rect = element.getBoundingClientRect();
    if (rect.top < innerHeight * 0.94 && rect.bottom > 0) element.classList.add('is-in');
  });
}

function bindHeroParallax(main) {
  const photo = main.querySelector('.hero-photo');
  if (!photo || !canHover() || reducedMotion()) return;
  photo.addEventListener('pointermove', event => {
    const rect = photo.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    photo.style.setProperty('--hero-x', `${(x * 10).toFixed(2)}px`);
    photo.style.setProperty('--hero-y', `${(y * 8).toFixed(2)}px`);
  });
  photo.addEventListener('pointerleave', () => {
    photo.style.setProperty('--hero-x', '0px');
    photo.style.setProperty('--hero-y', '0px');
  });
}

function bindDepthCards(main) {
  if (!canHover() || reducedMotion()) return;
  main.querySelectorAll('.care-story-card, .cat-card, .support-item, .rescue-card, .care-cat-row, .follow-card').forEach(card => {
    if (card.dataset.depthBound === 'true') return;
    card.dataset.depthBound = 'true';
    card.classList.add('depth-card');
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty('--tilt-x', `${((0.5 - y) * 2.2).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${((x - 0.5) * 2.8).toFixed(2)}deg`);
      card.style.setProperty('--pointer-x', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--pointer-y', `${(y * 100).toFixed(1)}%`);
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    }, { passive: true });
  });
}

function animateCounter(element) {
  if (element.dataset.counted === 'true') return;
  const finalValue = Number.parseInt(element.textContent.trim(), 10);
  if (!Number.isFinite(finalValue)) return;
  element.dataset.counted = 'true';
  if (reducedMotion()) return;
  const start = performance.now();
  const duration = 720;
  const tick = now => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = String(Math.round(finalValue * eased));
    if (progress < 1) requestAnimationFrame(tick);
  };
  element.textContent = '0';
  requestAnimationFrame(tick);
}

function bindCounters(main) {
  const counters = [...main.querySelectorAll('.metric-strip strong')];
  if (!counters.length) return;
  if (!('IntersectionObserver' in window)) {
    counters.forEach(animateCounter);
    return;
  }
  counterObserver?.disconnect();
  counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  counters.forEach(counter => counterObserver.observe(counter));
}

export function initGlobalMotion() {
  if (initialized) return;
  initialized = true;
  addScrollProgress();
  bindRipples();
  updateScrollState();
  addEventListener('scroll', scheduleScrollState, { passive: true });
  addEventListener('resize', scheduleScrollState, { passive: true });
  document.querySelector('#main')?.style.setProperty('view-transition-name', 'cat-page');
}

export function enhancePage(main, { view = 'cats' } = {}) {
  prepareHero(main);
  bindHeroParallax(main);
  bindDepthCards(main);
  bindCounters(main);

  revealObserver?.disconnect();
  const { sections, cards } = getRevealTargets(main, view);
  sections.forEach((section, index) => {
    section.classList.add('section-reveal');
    section.style.setProperty('--motion-index', String(index % 3));
  });
  cards.forEach((card, index) => {
    card.classList.add('card-reveal');
    card.style.setProperty('--motion-index', String(index % 6));
  });

  const targets = [...sections, ...cards];
  if (!targets.length) return;
  main.classList.add('motion-ready');

  if (!('IntersectionObserver' in window) || reducedMotion()) {
    targets.forEach(target => target.classList.add('is-in'));
    return;
  }

  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -9% 0px', threshold: 0.06 });

  targets.forEach(target => revealObserver.observe(target));
  revealVisible(targets);
}

export function transitionPage(update, after) {
  const runAfter = () => requestAnimationFrame(() => after?.());
  if (!document.startViewTransition || reducedMotion()) {
    update();
    runAfter();
    return;
  }
  document.documentElement.classList.add('is-transitioning');
  try {
    const transition = document.startViewTransition(() => update());
    transition.finished.finally(() => {
      document.documentElement.classList.remove('is-transitioning');
      runAfter();
    });
  } catch {
    document.documentElement.classList.remove('is-transitioning');
    update();
    runAfter();
  }
}
