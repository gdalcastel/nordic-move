const BASE_PRICE = 32000;
const selections = {
  paint: 'Cobre',
  size: '2×3 m',
  shape: 'Clásica',
  equipment: ['Encimera de trabajo'],
  pdv: [],
  sockets: 'Estándar local, a validar',
};
const prices = { paint: 0, size: 0, shape: 0, sockets: 0, equipment: 0, pdv: 0 };

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
const hero = document.querySelector('.hero');
const heroImage = document.querySelector('#hero-image');
const waitlistDialog = document.querySelector('#waitlist-dialog');
const waitlistForm = document.querySelector('#waitlist-form');
const waitlistStatus = document.querySelector('#waitlist-status');
const waitlistJoin = document.querySelector('#waitlist-join');
const waitlistSpot = document.querySelector('#waitlist-spot');
const waitlistSkip = document.querySelector('#waitlist-skip');
const skipForm = document.querySelector('#skip-form');
const skipAmount = document.querySelector('#skip-amount');
const skipPreview = document.querySelector('#skip-preview');
const skipStatus = document.querySelector('#skip-status');
const skipSubmit = document.querySelector('#skip-submit');
const SKIP_PRESETS = [100, 250, 500, 1000];
const QUEUE_KEY = 'nordic-waitlist-v1';
// URL do app da web em scripts/lista-de-espera.gs. Vazio até a planilha ser publicada.
const LEAD_SHEET_URL = '';
let slideTimer;
let activeSlide = 0;
let queueMove = '';

const heroSlides = [
  {
    image: 'assets/hero-heladeria.avif',
    category: 'Heladería',
    alt: 'Unidad móvil de heladería con vitrina de gelato, conos y clientes',
  },
  {
    image: 'assets/hero-cafeteria.avif',
    category: 'Cafetería',
    alt: 'Unidad móvil plateada de cafetería con máquina de espresso y mostrador de servicio',
  },
  {
    image: 'assets/hero-bar.avif',
    category: 'Bar',
    alt: 'Unidad móvil de bar iluminada al atardecer con barra de servicio y clientes',
  },
];

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  nav.classList.toggle('is-open', !isOpen);
});

nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  });
});

function formatUSD(value) {
  return `US$ ${new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(value)}`;
}

function updatePricing() {
  const items = [];
  const categories = [
    ['size', 'Tamaño'],
    ['paint', 'Pintura personalizada'],
    ['shape', 'Forma de la estructura'],
    ['sockets', 'Enchufes y tomas'],
  ];
  categories.forEach(([key, label]) => {
    if (prices[key] > 0) items.push({ label, amount: prices[key] });
  });
  document.querySelectorAll('.equipment-group .equipment-grid input:checked, .pdv-grid input:checked').forEach((input) => {
    const amount = Number(input.dataset.price || 0);
    if (amount > 0) items.push({ label: input.value, amount });
  });

  const addonList = document.querySelector('#addon-list');
  const reviewPrice = document.querySelector('#review-price');
  addonList.replaceChildren();
  reviewPrice.hidden = items.length === 0;
  items.forEach(({ label, amount }) => {
    const item = document.createElement('li');
    const name = document.createElement('span');
    const price = document.createElement('strong');
    name.textContent = label;
    price.textContent = `+ ${formatUSD(amount)}`;
    item.append(name, price);
    addonList.append(item);
  });
  const extras = items.reduce((sum, item) => sum + item.amount, 0);
  const total = formatUSD(BASE_PRICE + extras);
  document.querySelector('#estimated-total').textContent = total;
  document.querySelector('#mobile-estimated-total').textContent = total;
  document.querySelector('#waitlist-total').textContent = total;
}

function updateSummary() {
  const equipmentCount = selections.equipment.length;
  const values = [
    selections.size,
    selections.paint,
    selections.shape,
    equipmentCount ? `${equipmentCount} elemento${equipmentCount === 1 ? '' : 's'}` : 'Por definir',
    selections.pdv.length ? selections.pdv.join(' · ') : 'Sin PDV',
    selections.sockets,
  ];
  document.querySelectorAll('#summary-list li strong').forEach((item, index) => {
    item.textContent = values[index];
  });
  document.querySelector('.config-preview').dataset.paint = [...document.querySelectorAll('[data-paint]')]
    .find((button) => button.dataset.value === selections.paint)?.dataset.paint || 'personalizada';
  document.querySelector('#preview-image').alt = `Vista previa conceptual de la unidad móvil en color ${selections.paint.toLowerCase()}`;
  updatePricing();
}

const groupMap = {
  pintura: 'paint',
  porte: 'size',
  formato: 'shape',
  tomadas: 'sockets',
};

document.querySelectorAll('.choice[data-value]').forEach((button) => {
  button.addEventListener('click', () => {
    const group = button.dataset.group || button.closest('.choice-group')?.dataset.group;
    const selectionKey = groupMap[group];
    if (!selectionKey) return;
    selections[selectionKey] = button.dataset.value;
    prices[selectionKey] = Number(button.dataset.price || 0);
    button.closest('.choice-row').querySelectorAll('.choice[data-value]').forEach((choice) => {
      const isSelected = choice === button;
      choice.classList.toggle('is-selected', isSelected);
      choice.setAttribute('aria-pressed', String(isSelected));
    });
    updateSummary();
  });
});

document.querySelectorAll('.equipment-group .equipment-grid input').forEach((input) => {
  input.addEventListener('change', () => {
    const selected = [...document.querySelectorAll('.equipment-group .equipment-grid input:checked')];
    selections.equipment = selected.map((item) => item.value);
    prices.equipment = selected.reduce((sum, item) => sum + Number(item.dataset.price || 0), 0);
    updateSummary();
  });
});

function syncPdv() {
  const selected = [...document.querySelectorAll('.pdv-grid input:checked')];
  selections.pdv = selected.map((item) => item.value);
  prices.pdv = selected.reduce((sum, item) => sum + Number(item.dataset.price || 0), 0);
}

document.querySelectorAll('.pdv-grid input').forEach((input) => {
  input.addEventListener('change', () => {
    if (input.checked && input.dataset.exclusive) {
      document.querySelectorAll(`.pdv-grid input[data-exclusive="${input.dataset.exclusive}"]`).forEach((other) => {
        if (other !== input) other.checked = false;
      });
    }
    syncPdv();
    updateSummary();
  });
});

function currentConfiguration() {
  const extraTotal = Object.values(prices).reduce((sum, value) => sum + value, 0);
  return {
    brand: 'Nordic',
    model: 'Nordic Tape',
    paint: selections.paint,
    size: selections.size,
    shape: selections.shape,
    equipment: selections.equipment,
    pdv: selections.pdv,
    sockets: selections.sockets,
    basePrice: BASE_PRICE,
    estimatedTotal: BASE_PRICE + extraTotal,
  };
}

function seedQueue() {
  const tiers = [
    [2000, 2],
    [1000, 3],
    [500, 6],
    [250, 10],
    [100, 16],
    [0, 80],
  ];
  const start = Date.parse('2026-08-01T12:00:00Z');
  const entries = [];
  let count = 0;
  tiers.forEach(([paid, size]) => {
    for (let index = 0; index < size; index += 1) {
      count += 1;
      entries.push({
        id: `seed-${count}`,
        paid,
        createdAt: new Date(start + count * 3600000).toISOString(),
        seed: true,
      });
    }
  });
  return entries;
}

function readQueue() {
  try {
    const stored = JSON.parse(localStorage.getItem(QUEUE_KEY) || '');
    if (stored && Array.isArray(stored.entries) && stored.entries.length) return stored;
  } catch {
    /* A missing or broken list starts again from the seeded queue. */
  }
  return { entries: seedQueue(), meId: null };
}

function writeQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function rankedEntries(entries) {
  return [...entries].sort((a, b) => b.paid - a.paid || a.createdAt.localeCompare(b.createdAt));
}

function placeFor(entries, id, paid) {
  const next = entries.map((entry) => (entry.id === id ? { ...entry, paid } : entry));
  return rankedEntries(next).findIndex((entry) => entry.id === id) + 1;
}

function myEntry(queue) {
  return queue.entries.find((entry) => entry.id === queue.meId) || null;
}

function buttonLabel(button, label) {
  button.replaceChildren(document.createTextNode(`${label} `));
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '↗';
  button.append(icon);
}

function paintJoinButtons() {
  const queue = readQueue();
  const mine = myEntry(queue);
  const label = mine
    ? `Mi lugar #${placeFor(queue.entries, mine.id, mine.paid)}`
    : 'Unirme a la lista';
  buttonLabel(document.querySelector('#join-waitlist'), label);
  buttonLabel(document.querySelector('#mobile-join-waitlist'), label);
}

function showWaitlistStep(step) {
  waitlistJoin.hidden = step !== 'join';
  waitlistSpot.hidden = step !== 'spot';
  waitlistSkip.hidden = step !== 'skip';
  const titleId = { join: 'waitlist-title', spot: 'spot-title', skip: 'skip-title' }[step];
  waitlistDialog.setAttribute('aria-labelledby', titleId);
  waitlistDialog.scrollTop = 0;
  if (step === 'join') {
    waitlistDialog.querySelector('input[name="name"]').focus();
    return;
  }
  waitlistDialog.querySelector(`#${titleId}`).focus();
}

function renderSpot() {
  const queue = readQueue();
  const mine = myEntry(queue);
  if (!mine) {
    showWaitlistStep('join');
    return;
  }
  const place = placeFor(queue.entries, mine.id, mine.paid);
  const ahead = place - 1;
  document.querySelector('#queue-position').textContent = `#${place}`;
  document.querySelector('#queue-meta').textContent = ahead === 0
    ? `Lugar 1 de ${queue.entries.length}. Nadie está delante de ti.`
    : `Lugar ${place} de ${queue.entries.length}. Hay ${ahead} ${ahead === 1 ? 'persona' : 'personas'} delante de ti.`;
  const paid = document.querySelector('#queue-paid');
  paid.hidden = mine.paid <= 0;
  paid.textContent = mine.paid > 0 ? `Adelanto pagado: ${formatUSD(mine.paid)}. Se descuenta del precio del proyecto.` : '';
  const move = document.querySelector('#queue-move');
  move.hidden = !queueMove;
  move.textContent = queueMove;
  const isFirst = place === 1;
  document.querySelector('#open-skip').hidden = isFirst;
  document.querySelector('#queue-first').hidden = !isFirst;
  showWaitlistStep('spot');
  paintJoinButtons();
}

function renderSkip() {
  const queue = readQueue();
  const mine = myEntry(queue);
  if (!mine) {
    showWaitlistStep('join');
    return;
  }
  const amounts = document.querySelector('#skip-amounts');
  amounts.replaceChildren();
  SKIP_PRESETS.forEach((amount) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'skip-chip';
    chip.dataset.amount = String(amount);
    const name = document.createElement('strong');
    const detail = document.createElement('small');
    name.textContent = formatUSD(amount);
    const nextPlace = placeFor(queue.entries, mine.id, amount);
    detail.textContent = amount <= mine.paid ? 'No adelanta' : `Lugar #${nextPlace}`;
    chip.disabled = amount <= mine.paid;
    chip.append(name, detail);
    chip.addEventListener('click', () => {
      skipAmount.value = String(amount);
      updateSkipPreview();
    });
    amounts.append(chip);
  });
  const firstUseful = SKIP_PRESETS.find((amount) => amount > mine.paid) || mine.paid + 100;
  skipAmount.value = String(firstUseful);
  skipStatus.textContent = '';
  skipStatus.classList.remove('is-error');
  updateSkipPreview();
  showWaitlistStep('skip');
  skipAmount.focus();
}

function updateSkipPreview() {
  const queue = readQueue();
  const mine = myEntry(queue);
  const amount = Math.round(Number(skipAmount.value));
  document.querySelectorAll('.skip-chip').forEach((chip) => {
    chip.classList.toggle('is-selected', Number(chip.dataset.amount) === amount);
  });
  if (!mine || !Number.isFinite(amount) || amount < 1) {
    skipPreview.textContent = 'Indica un monto para ver tu nuevo lugar.';
    skipSubmit.disabled = true;
    buttonLabel(skipSubmit, 'Pagar');
    return;
  }
  const current = placeFor(queue.entries, mine.id, mine.paid);
  const next = placeFor(queue.entries, mine.id, amount);
  if (amount <= mine.paid || next >= current) {
    skipPreview.textContent = 'Este monto no adelanta tu lugar. Elige uno mayor.';
    skipSubmit.disabled = true;
    buttonLabel(skipSubmit, 'Pagar');
    return;
  }
  const charge = amount - mine.paid;
  skipPreview.textContent = mine.paid > 0
    ? `Pagas ${formatUSD(charge)} más y tu adelanto pasa a ${formatUSD(amount)}. Tu lugar pasa de #${current} a #${next}.`
    : `Con ${formatUSD(amount)} pasas del lugar #${current} al #${next}.`;
  skipSubmit.disabled = false;
  buttonLabel(skipSubmit, `Pagar ${formatUSD(charge)}`);
}

function openWaitlist() {
  document.querySelector('#waitlist-total').textContent = document.querySelector('#estimated-total').textContent;
  queueMove = '';
  if (!waitlistDialog.open) waitlistDialog.showModal();
  const queue = readQueue();
  const mine = myEntry(queue);
  if (mine) {
    mine.configuration = currentConfiguration();
    writeQueue(queue);
    renderSpot();
  } else {
    showWaitlistStep('join');
  }
}

document.querySelector('#join-waitlist').addEventListener('click', openWaitlist);
document.querySelector('#mobile-join-waitlist').addEventListener('click', openWaitlist);
document.querySelector('.waitlist-close').addEventListener('click', () => waitlistDialog.close());
waitlistDialog.addEventListener('click', (event) => {
  if (event.target === waitlistDialog) waitlistDialog.close();
});
waitlistDialog.addEventListener('close', () => {
  queueMove = '';
  waitlistStatus.textContent = '';
  waitlistStatus.classList.remove('is-error');
  skipStatus.textContent = '';
  skipStatus.classList.remove('is-error');
});
document.querySelector('#open-skip').addEventListener('click', renderSkip);
document.querySelector('#skip-back').addEventListener('click', () => {
  queueMove = '';
  renderSpot();
});
skipAmount.addEventListener('input', updateSkipPreview);

function leadPayload(contact, configuration) {
  return {
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    country: contact.country,
    size: configuration.size,
    paint: configuration.paint,
    shape: configuration.shape,
    equipment: configuration.equipment.join(', '),
    pdv: configuration.pdv.join(', '),
    sockets: configuration.sockets,
    estimatedTotal: configuration.estimatedTotal,
  };
}

async function saveLead(contact, configuration) {
  if (!LEAD_SHEET_URL) return;
  await fetch(LEAD_SHEET_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(leadPayload(contact, configuration)),
  });
}

waitlistForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(waitlistForm);
  const contact = {
    name: formData.get('name').trim(),
    email: formData.get('email').trim().toLowerCase(),
    phone: formData.get('phone').trim(),
    country: formData.get('country'),
  };
  const submitButton = document.querySelector('#waitlist-submit');
  submitButton.disabled = true;
  waitlistStatus.classList.remove('is-error');
  waitlistStatus.textContent = LEAD_SHEET_URL ? 'Guardando…' : '';
  try {
    await saveLead(contact, currentConfiguration());
  } catch {
    waitlistStatus.textContent = 'No pudimos guardar tus datos. Inténtalo de nuevo.';
    waitlistStatus.classList.add('is-error');
    submitButton.disabled = false;
    return;
  }
  submitButton.disabled = false;
  waitlistStatus.textContent = '';
  const queue = readQueue();
  let mine = queue.entries.find((entry) => !entry.seed && entry.email === contact.email);
  if (!mine) {
    mine = {
      id: `me-${Date.now()}`,
      paid: 0,
      createdAt: new Date().toISOString(),
      seed: false,
    };
    queue.entries.push(mine);
  }
  Object.assign(mine, contact, { configuration: currentConfiguration() });
  queue.meId = mine.id;
  writeQueue(queue);
  queueMove = '';
  renderSpot();
});

skipForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const queue = readQueue();
  const mine = myEntry(queue);
  const amount = Math.round(Number(skipAmount.value));
  if (!mine || !Number.isFinite(amount)) return;
  const current = placeFor(queue.entries, mine.id, mine.paid);
  const next = placeFor(queue.entries, mine.id, amount);
  const charge = amount - mine.paid;
  if (charge <= 0 || next >= current) {
    skipStatus.textContent = 'Este monto no adelanta tu lugar.';
    skipStatus.classList.add('is-error');
    return;
  }
  skipSubmit.disabled = true;
  skipSubmit.textContent = 'Cobrando…';
  window.setTimeout(() => {
    mine.paid = amount;
    writeQueue(queue);
    queueMove = `Cobramos ${formatUSD(charge)}. Pasaste del lugar #${current} al #${next}.`;
    if (waitlistDialog.open) renderSpot();
    else paintJoinButtons();
  }, 700);
});

function setHeroSlide(index) {
  activeSlide = (index + heroSlides.length) % heroSlides.length;
  const slide = heroSlides[activeSlide];
  heroImage.classList.add('is-changing');
  heroImage.src = slide.image;
  heroImage.alt = slide.alt;
  document.querySelectorAll('.slide-choice').forEach((button, buttonIndex) => {
    const isActive = buttonIndex === activeSlide;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  window.setTimeout(() => heroImage.classList.remove('is-changing'), 280);
}

function stopCarousel() {
  window.clearInterval(slideTimer);
}

function startCarousel() {
  stopCarousel();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  slideTimer = window.setInterval(() => {
    if (!document.hidden) setHeroSlide(activeSlide + 1);
  }, 7000);
}

document.querySelectorAll('.slide-choice').forEach((button) => {
  button.addEventListener('click', () => {
    setHeroSlide(Number(button.dataset.slide));
    startCarousel();
  });
});

const introSlides = [...document.querySelectorAll('.intro-slide')];
const introButtons = [...document.querySelectorAll('[data-intro-slide]')];
const introStage = document.querySelector('.intro-stage');
const introCaption = document.querySelector('.intro-caption');
let introIndex = 0;
let introTimer;

function setIntroSlide(index) {
  if (!introSlides.length) return;
  introIndex = (index + introSlides.length) % introSlides.length;
  introSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle('is-active', slideIndex === introIndex);
  });
  introButtons.forEach((button) => {
    const isActive = Number(button.dataset.introSlide) === introIndex;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  if (introCaption) {
    introCaption.textContent = introSlides[introIndex].dataset.caption || '';
  }
}

function stopIntroSlides() {
  window.clearInterval(introTimer);
}

function startIntroSlides() {
  stopIntroSlides();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  introTimer = window.setInterval(() => {
    if (!document.hidden) setIntroSlide(introIndex + 1);
  }, 4200);
}

introButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setIntroSlide(Number(button.dataset.introSlide));
    startIntroSlides();
  });
});

if (introStage) {
  introStage.addEventListener('mouseenter', stopIntroSlides);
  introStage.addEventListener('mouseleave', startIntroSlides);
  introStage.addEventListener('focusin', stopIntroSlides);
  introStage.addEventListener('focusout', (event) => {
    if (!introStage.contains(event.relatedTarget)) startIntroSlides();
  });
  startIntroSlides();
}

const mobilePriceBar = document.querySelector('#mobile-price-bar');
if ('IntersectionObserver' in window && mobilePriceBar) {
  const barVisibility = { configurator: false, summary: false };
  const priceBarObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.target.classList.contains('configurator')) barVisibility.configurator = entry.isIntersecting;
      if (entry.target.classList.contains('build-summary')) barVisibility.summary = entry.intersectionRatio > 0.4;
    });
    mobilePriceBar.classList.toggle('is-visible', barVisibility.configurator && !barVisibility.summary);
  }, { threshold: [0, 0.4] });
  priceBarObserver.observe(document.querySelector('.configurator'));
  priceBarObserver.observe(document.querySelector('.build-summary'));
}

hero.addEventListener('mouseenter', stopCarousel);
hero.addEventListener('mouseleave', startCarousel);
hero.addEventListener('focusin', stopCarousel);
hero.addEventListener('focusout', (event) => {
  if (!hero.contains(event.relatedTarget)) startCarousel();
});

function wheelPixels(event) {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

const sectionStepDesktop = window.matchMedia('(min-width: 1024px)');
const sectionStepReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const sectionStepDistance = 56;
const edgeReleaseDistance = 168;
const edgeReleaseStep = 56;
const edgeGestureGap = 240;
const edgeResistMs = 880;
let sectionStepLock = false;
let sectionStepToken = 0;
let sectionStepCarry = 0;
let sectionStepCarryTimer = 0;
let edgeLatchUntil = 0;
let edgeLatchDirection = 0;
let edgeResistStarted = 0;
let innerScrollAt = 0;
let innerScrollDirection = 0;

function scrollerCanMove(scroller, delta) {
  const maxScroll = scroller.scrollHeight - scroller.clientHeight;
  if (maxScroll <= 1) return false;
  if (delta > 0) return scroller.scrollTop < maxScroll - 1;
  return scroller.scrollTop > 0;
}

function pinnedScroller(target, delta) {
  let node = target instanceof Element ? target : null;
  while (node && node !== document.documentElement && node !== document.body) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') {
      const maxScroll = node.scrollHeight - node.clientHeight;
      const atEdge = delta > 0 ? node.scrollTop >= maxScroll - 1 : node.scrollTop <= 1;
      if (maxScroll > 1 && atEdge) return node;
    }
    node = node.parentElement;
  }
  return null;
}

function scrollableAncestor(target, delta) {
  let node = target instanceof Element ? target : null;
  while (node && node !== document.documentElement && node !== document.body) {
    const overflowY = getComputedStyle(node).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && scrollerCanMove(node, delta)) return node;
    node = node.parentElement;
  }
  return null;
}

function sectionStops() {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const stops = [...document.querySelectorAll('main > section, .site-footer')].map((section) => (
    Math.min(maxScroll, Math.max(0, Math.round(section.getBoundingClientRect().top + window.scrollY)))
  ));
  return [...new Set(stops)].sort((a, b) => a - b);
}

function nextSectionStop(direction) {
  const stops = sectionStops();
  const y = window.scrollY;
  if (direction > 0) return stops.find((stop) => stop > y + 12);
  return [...stops].reverse().find((stop) => stop < y - 12);
}

function moveToSection(top) {
  const token = ++sectionStepToken;
  sectionStepLock = true;
  const start = window.scrollY;
  const distance = top - start;
  const duration = 480;
  const started = performance.now();
  document.documentElement.style.scrollBehavior = 'auto';
  const tick = (now) => {
    if (token !== sectionStepToken) return;
    const progress = Math.min(1, (now - started) / duration);
    const eased = 1 - (1 - progress) ** 3;
    window.scrollTo(0, Math.round(start + distance * eased));
    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }
    document.documentElement.style.scrollBehavior = '';
    const releaseIn = Math.max(240, 920 - (performance.now() - started));
    window.setTimeout(() => {
      if (token === sectionStepToken) sectionStepLock = false;
    }, releaseIn);
  };
  requestAnimationFrame(tick);
}

window.addEventListener('wheel', (event) => {
  if (!sectionStepDesktop.matches || sectionStepReduceMotion.matches) return;
  if (document.querySelector('#waitlist-dialog')?.open) return;
  const delta = wheelPixels(event);
  if (!delta) return;

  const now = performance.now();
  const direction = Math.sign(delta);
  const moving = scrollableAncestor(event.target, delta);
  if (moving) {
    if (moving.closest('#configurar')) {
      innerScrollAt = now;
      innerScrollDirection = direction;
    }
    return;
  }

  const pinned = pinnedScroller(event.target, delta);
  const atConfiguratorEdge = Boolean(pinned?.closest('#configurar'));
  if (atConfiguratorEdge) {
    const sameArrival = direction === innerScrollDirection && now - innerScrollAt < edgeGestureGap;
    const holdingEdge = now < edgeLatchUntil && direction === edgeLatchDirection;
    if (sameArrival && !holdingEdge) edgeResistStarted = now;
    const withinResist = edgeResistStarted > 0 && now - edgeResistStarted < edgeResistMs;
    if ((sameArrival || holdingEdge) && withinResist) {
      event.preventDefault();
      edgeLatchUntil = now + edgeGestureGap;
      edgeLatchDirection = direction;
      sectionStepCarry = 0;
      window.clearTimeout(sectionStepCarryTimer);
      return;
    }
  }

  event.preventDefault();
  if (sectionStepLock) return;

  const needed = atConfiguratorEdge ? edgeReleaseDistance : sectionStepDistance;
  const step = atConfiguratorEdge
    ? direction * Math.min(Math.abs(delta), edgeReleaseStep)
    : delta;
  if (Math.sign(sectionStepCarry) !== direction) sectionStepCarry = 0;
  sectionStepCarry += step;
  window.clearTimeout(sectionStepCarryTimer);
  sectionStepCarryTimer = window.setTimeout(() => {
    sectionStepCarry = 0;
  }, atConfiguratorEdge ? 480 : 160);
  if (Math.abs(sectionStepCarry) < needed) return;

  const target = nextSectionStop(direction);
  sectionStepCarry = 0;
  if (target == null) return;
  moveToSection(target);
}, { passive: false, capture: true });

document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelectorAll('.choice[data-value]').forEach((button) => {
  button.setAttribute('aria-pressed', String(button.classList.contains('is-selected')));
});

const checkedEquipment = [...document.querySelectorAll('.equipment-group .equipment-grid input:checked')];
selections.equipment = checkedEquipment.map((item) => item.value);
prices.equipment = checkedEquipment.reduce((sum, item) => sum + Number(item.dataset.price || 0), 0);
syncPdv();
setHeroSlide(0);
updateSummary();
paintJoinButtons();
startCarousel();
