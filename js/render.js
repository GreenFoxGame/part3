// ============================================
// ОТРИСОВКА (Особняк вампиров)
// ============================================

let fieldInitialized = false;
let cardMap = {};
let clickSlots = [];
let cardWidth = 0;
let cardHeight = 0;
let gapSize = 6;
let paddingSize = 0;

const ICON_PATHS = {
  fox_idle: 'assets/characters/fox_idle.png',
  gag_lollipop: 'assets/characters/gag_lollipop.png',
  fox_gag: 'assets/characters/fox_gag_lollipop.png',
  // Лисёнок с кляпом + оружие в руках
  fox_gag_whip: 'assets/characters/fox_gag_whip.png',
  fox_gag_glass: 'assets/characters/fox_gag_glass.png',
  fox_gag_nipple_clamps: 'assets/characters/fox_gag_nipple_clamps.png',
  fox_gag_fur_handcuffs: 'assets/characters/fox_gag_fur_handcuffs.png',
  fox_whip: 'assets/characters/fox_whip.png',
  fox_glass: 'assets/characters/fox_glass.png',
  fox_nipple_clamps: 'assets/characters/fox_nipple_clamps.png',
  fox_fur_handcuffs: 'assets/characters/fox_fur_handcuffs.png',

  fox_corkscrew: 'assets/characters/fox_corkscrew.png',
  fox_frak: 'assets/characters/fox_butler_apron.png',
  fox_cooper_hammer: 'assets/characters/fox_cooper_hammer.png',
  fox_broken_glass: 'assets/characters/fox_broken_glass.png',
  fox_barrel_key: 'assets/characters/fox_barrel_key.png',

  count: 'assets/characters/count.png',
  count_cuffed: 'assets/characters/count_cuffed.png',
  lady: 'assets/characters/lady.png',
  submissive: 'assets/characters/submissive.png',
  latex_maid: 'assets/characters/latex_maid.png',

  drunkard: 'assets/characters/drunkard.png',
  sommelier: 'assets/characters/sommelier.png',
  winemaker: 'assets/characters/winemaker.png',
  tavernkeeper: 'assets/characters/tavernkeeper.png',

  whip: 'assets/characters/whip.png',
  glass: 'assets/characters/glass.png',
  nipple_clamps: 'assets/characters/nipple_clamps.png',
  garlic: 'assets/characters/garlic.png',
  fur_handcuffs: 'assets/characters/fur_handcuffs.png',

  lubricant: 'assets/characters/lubricant.png',

  corkscrew: 'assets/characters/corkscrew.png',
  frak: 'assets/characters/butler_apron.png',
  cooper_hammer: 'assets/characters/cooper_hammer.png',
  broken_glass: 'assets/characters/broken_glass.png',
  barrel_key: 'assets/characters/barrel_key.png',

  wine_virgin: 'assets/characters/wine_virgin.png',
  wine_virgin_fake: 'assets/characters/wine_virgin_fake.png',
  wine_sacrifice: 'assets/characters/wine_sacrifice.png',

  book_bite: 'assets/characters/book_bite.png',
  book_50_red: 'assets/characters/book_bite.png',
  book_succubus: 'assets/characters/book_succubus.png',
  book_klyki: 'assets/characters/book_klyki.png',
  book_markrovita: 'assets/characters/book_klyki.png',
  book_three: 'assets/characters/book_three.png',
  book_krovoegin: 'assets/characters/book_krovoegin.png',
  book_grimoire: 'assets/characters/book_three.png',

  book_diary: 'assets/characters/book_krovoegin.png',
  book_moonshine: 'assets/characters/book_krovoegin.png',
  book_victim_psych: 'assets/characters/book_succubus.png',

  drug_cocaine: 'assets/characters/drug_cocaine.png',
  drug_heroin: 'assets/characters/drug_heroin.png',
  drug_weed: 'assets/characters/drug_weed.png',
  drug_ecstasy: 'assets/characters/drug_ecstasy.png',
  drug_lsd: 'assets/characters/drug_lsd.png',
  drug_snus: 'assets/characters/drug_snus.png',
  drug_mushrooms: 'assets/characters/drug_mushrooms.png',

  flask: 'assets/characters/flask.png',
  dephlegmator: 'assets/characters/dephlegmator.png',
  distill_column: 'assets/characters/distill_column.png',
  evaporator: 'assets/characters/evaporator.png',
  filter_baskets: 'assets/characters/filter_baskets.png',

  spikes_safe:   'assets/characters/spikes_safe.png',
  spikes_deadly: 'assets/characters/spikes_deadly.png',
  slick: 'assets/characters/slick.png',
  fireCannon_up:    'assets/characters/fire_cannon_up.png',
  fireCannon_right: 'assets/characters/fire_cannon_right.png',
  fireCannon_down:  'assets/characters/fire_cannon_down.png',
  fireCannon_left:  'assets/characters/fire_cannon_left.png',

  skin_3: 'assets/characters/skin_3.png',

  // Скин + оружие в руках
  skin_3_whip:           'assets/characters/skin_3_whip.png',
  skin_3_glass:          'assets/characters/skin_3_glass.png',
  skin_3_nipple_clamps:  'assets/characters/skin_3_nipple_clamps.png',
  skin_3_fur_handcuffs:  'assets/characters/skin_3_fur_handcuffs.png',

  skin_3_gag:                  'assets/characters/skin_3_gag.png',
  skin_3_gag_whip:             'assets/characters/skin_3_gag_whip.png',
  skin_3_gag_glass:            'assets/characters/skin_3_gag_glass.png',
  skin_3_gag_nipple_clamps:    'assets/characters/skin_3_gag_nipple_clamps.png',
  skin_3_gag_fur_handcuffs:    'assets/characters/skin_3_gag_fur_handcuffs.png',

  skin_3_corkscrew:      'assets/characters/skin_3_corkscrew.png',
  skin_3_frak:           'assets/characters/skin_3_frak.png',
  skin_3_cooper_hammer:  'assets/characters/skin_3_cooper_hammer.png',
  skin_3_broken_glass:   'assets/characters/skin_3_broken_glass.png',
  skin_3_barrel_key:     'assets/characters/skin_3_barrel_key.png',

  door: 'assets/characters/door.png',
  entrance: 'assets/characters/entrance.png',
  butler: 'assets/characters/butler.png',
  librarian: 'assets/characters/librarian.png',
  alchemist: 'assets/characters/alchemist.png',
  tea_cookies: 'assets/characters/tea_cookies.png',
  bat: 'assets/characters/bat.png',
  vomit: 'assets/characters/vomit.png',
  hallucination: 'assets/characters/hallucination.png',
  panic: 'assets/characters/panic.png'
};

function getIconHTML(iconKey, emoji) {
  const path = ICON_PATHS[iconKey];
  const fallback = emoji || '';
  if (path) {
    const safe = String(fallback).replace(/'/g, "\\'");
    return `<img src="${path}" alt="" class="card-img"
                 onerror="this.style.display='none'; this.insertAdjacentHTML('afterend','${safe}')">`;
  }
  return fallback;
}

function getPlayerSkinKey() {
  // 1) Базовый скин без суффикса _idle
  let base = 'fox';
  if (typeof playerId !== 'undefined' && playerId) {
    const mapped = CONFIG.PLAYER_SKINS && CONFIG.PLAYER_SKINS[String(playerId)];
    if (mapped && ICON_PATHS[mapped]) {
      base = mapped.replace(/_idle$/, '');   // 'fox_idle' → 'fox', 'skin_3' → 'skin_3'
    }
  }

  // 2) Кляп — только для пыточного оружия
  if (player.gagTurns > 0) {
    const tortureWeapons = ['whip', 'glass', 'nipple_clamps', 'fur_handcuffs'];
    if (player.hand && tortureWeapons.includes(player.hand.itemType)) {
      const k = base + '_gag_' + player.hand.itemType;
      if (ICON_PATHS[k]) return k;
    }
    const k = base + '_gag';
    if (ICON_PATHS[k]) return k;
  }

  // 3) Фрак надет — <base>_frak для любого скина
  if (player.apronTurns > 0) {
    const k = base + '_frak';
    if (ICON_PATHS[k]) return k;
  }

  // 4) С оружием — пробуем <base>_<itemType>
  if (player.hand && player.hand.itemType) {
    const k = base + '_' + player.hand.itemType;
    if (ICON_PATHS[k]) return k;
  }

  // 5) Базовый скин
  if (ICON_PATHS[base]) return base;
  if (base === 'fox' && ICON_PATHS['fox_idle']) return 'fox_idle';

  return 'fox_idle';
}


function measureField() {
  const fieldEl = document.getElementById('field');
  const style = getComputedStyle(fieldEl);
  const padding = parseFloat(style.paddingLeft) || 0;
  const innerW = fieldEl.clientWidth - padding * 2;
  const innerH = fieldEl.clientHeight - padding * 2;
  const gap = 6;
  cardWidth = (innerW - gap * (FIELD_W - 1)) / FIELD_W;
  cardHeight = (innerH - gap * (FIELD_H - 1)) / FIELD_H;
  gapSize = gap;
  paddingSize = padding;
}

function cellToPx(x, y) {
  return {
    left: paddingSize + x * (cardWidth + gapSize),
    top: paddingSize + y * (cardHeight + gapSize)
  };
}

function initFieldDOM() {
  const field = document.getElementById('field');
  field.innerHTML = '';
  cardMap = {};
  clickSlots = [];
  measureField();

  for (let y = 0; y < FIELD_H; y++) {
    clickSlots[y] = [];
    for (let x = 0; x < FIELD_W; x++) {
      const slot = document.createElement('div');
      slot.className = 'click-slot';
      slot.style.width = cardWidth + 'px';
      slot.style.height = cardHeight + 'px';
      const pos = cellToPx(x, y);
      slot.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
      field.appendChild(slot);
      clickSlots[y][x] = slot;
    }
  }

  fieldInitialized = true;
  if (typeof attachLongPressHandlers === 'function') setTimeout(attachLongPressHandlers, 50);
}

function getOrCreateCard(id) {
  if (cardMap[id]) return cardMap[id];
  const field = document.getElementById('field');
  const card = document.createElement('div');
  card.className = 'card empty';
  card.style.width = cardWidth + 'px';
  card.style.height = cardHeight + 'px';
  card.dataset.entityId = id;
  field.appendChild(card);
  cardMap[id] = { el: card, x: -1, y: -1, isNew: true };
  return cardMap[id];
}

function removeCard(id) {
  if (!cardMap[id]) return;
  cardMap[id].el.remove();
  delete cardMap[id];
}
function render() {
  if (!fieldInitialized) initFieldDOM();
  measureField();

  for (let y = 0; y < FIELD_H; y++)
    for (let x = 0; x < FIELD_W; x++) {
      const slot = clickSlots[y][x];
      if (!slot) continue;
      slot.style.width = cardWidth + 'px';
      slot.style.height = cardHeight + 'px';
      const pos = cellToPx(x, y);
      slot.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
    }

  const activeIds = new Set(['player']);
  for (let y = 0; y < FIELD_H; y++)
    for (let x = 0; x < FIELD_W; x++) {
      const e = FIELD[y][x].entity;
      if (e && e.id) activeIds.add(e.id);
    }

  // Завеса галлюцинаций
  const hallucinationIds = new Set();
  if (typeof hallucinationTurns !== 'undefined' && hallucinationTurns > 0) {
    for (let y = 0; y < FIELD_H; y++)
      for (let x = 0; x < FIELD_W; x++) {
        if (player.x === x && player.y === y) continue;
        hallucinationIds.add('hallucination_' + x + '_' + y);
      }
  }

  // Завеса паники
  const panicIds = new Set();
  if (typeof panicTurns !== 'undefined' && panicTurns > 0) {
    for (let y = 0; y < FIELD_H; y++)
      for (let x = 0; x < FIELD_W; x++) {
        if (player.x === x && player.y === y) continue;
        if (Math.abs(player.x - x) + Math.abs(player.y - y) <= 1) continue;
        panicIds.add('panic_' + x + '_' + y);
      }
  }

  for (const id of hallucinationIds) activeIds.add(id);
  for (const id of panicIds) activeIds.add(id);

  for (const id of Object.keys(cardMap))
    if (!activeIds.has(id)) removeCard(id);

  // Игрок
  {
    const card = getOrCreateCard('player');
    card.el.style.width = cardWidth + 'px';
    card.el.style.height = cardHeight + 'px';
    updateCardContent(card.el, 'player', null);
    positionCard(card, player.x, player.y);
  }

  // Сущности поля
  for (let y = 0; y < FIELD_H; y++)
    for (let x = 0; x < FIELD_W; x++) {
      const e = FIELD[y][x].entity;
      if (!e || !e.id) continue;
      const isNew = !cardMap[e.id];
      const card = getOrCreateCard(e.id);
      card.el.style.width = cardWidth + 'px';
      card.el.style.height = cardHeight + 'px';
      updateCardContent(card.el, e.kind, e);
      if (isNew) {
        card.x = x; card.y = y; card.isNew = false;
        const pos = cellToPx(x, y);
        card.el.style.transition = 'none';
        card.el.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
      } else positionCard(card, x, y);
    }

  // Завесы поверх
  for (const id of hallucinationIds) {
    const parts = id.split('_');
    const x = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    const card = getOrCreateCard(id);
    card.el.style.width = cardWidth + 'px';
    card.el.style.height = cardHeight + 'px';
    card.el.className = 'card trap hallucination-overlay';
    card.el.innerHTML = `<div class="icon">${getIconHTML('hallucination', '🌀')}</div><div class="name">Галлюцинация</div>`;
    card.x = x; card.y = y;
    const pos = cellToPx(x, y);
    card.el.style.transition = 'none';
    card.el.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
  }

  for (const id of panicIds) {
    const parts = id.split('_');
    const x = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    const card = getOrCreateCard(id);
    card.el.style.width = cardWidth + 'px';
    card.el.style.height = cardHeight + 'px';
    card.el.className = 'card trap panic-overlay';
    card.el.innerHTML = `<div class="icon">${getIconHTML('panic', '😱')}</div><div class="name">Паника</div>`;
    card.x = x; card.y = y;
    const pos = cellToPx(x, y);
    card.el.style.transition = 'none';
    card.el.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
  }

  updateHUD();
}

function positionCard(cardEntry, x, y) {
  const pos = cellToPx(x, y);
  const card = cardEntry.el;
  if (cardEntry.x === x && cardEntry.y === y) return;

  const wasFirst = (cardEntry.x === -1);
  const oldRect = card.getBoundingClientRect();
  card.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
  cardEntry.x = x; cardEntry.y = y;

  if (wasFirst) return;

  const newRect = card.getBoundingClientRect();
  const dx = oldRect.left - newRect.left;
  const dy = oldRect.top - newRect.top;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

  card.style.transition = 'none';
  card.style.transform = `translate(${pos.left + dx}px, ${pos.top + dy}px)`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    card.style.transition = 'transform 0.3s ease-out';
    card.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
    setTimeout(() => { card.style.transition = ''; }, 310);
  }));
}

function updateCardContent(cardEl, kind, entity) {
  const keepPulse = cardEl.classList.contains('pulse');
  const keepPulsePlayer = cardEl.classList.contains('pulse-player');

  let html = '';
  let className = 'card';
  if (keepPulse) className += ' pulse';
  if (keepPulsePlayer) className += ' pulse-player';

  if (kind === 'player') {
    className += ' player';
    const skinKey = getPlayerSkinKey();
    html = `
      <div class="hp hp-player">${player.hp}</div>
      ${player.hand ? `<div class="hp hp-weapon">${player.hand.hp || ''}</div>` : ''}
      <div class="icon">${getIconHTML(skinKey, '🦊')}</div>
      <div class="name">Лисёнок</div>
    `;
  } else if (!entity) {
    className += ' empty';
  } else {
    switch (entity.kind) {
      case 'enemy':
        className += ' enemy';
        if (entity.immobilized || entity.clamped || entity.flustered) {
          className += ' affected';
        }
        html = renderEnemy(entity);
        break;
      case 'item': className += ' item'; html = renderItem(entity); break;
      case 'book': className += ' book'; html = renderBook(entity); break;
      case 'drug': className += ' drug'; html = renderDrug(entity); break;
      case 'wine': className += ' wine'; html = renderWine(entity); break;
      case 'trap': className += ' trap'; html = renderTrap(entity); break;
      case 'device': className += ' device'; html = renderDevice(entity); break;
      case 'door':
        className += ' door';
        html = `<div class="icon">${getIconHTML('door', '🚪')}</div><div class="name">Дверь</div>`;
        break;
      case 'entrance':
        className += ' door';
        html = `<div class="icon">${getIconHTML('entrance', '🚪')}</div><div class="name">Вход</div>`;
        break;
      case 'butler':
        className += ' npc';
        html = `<div class="icon">${getIconHTML('butler', '🤵')}</div><div class="name">Дворецкий</div>`;
        break;
      case 'librarian':
        className += ' npc';
        html = `<div class="icon">${getIconHTML('librarian', '📚')}</div><div class="name">Библиотекарша</div>`;
        break;
      case 'alchemist':
        className += ' npc';
        html = `<div class="icon">${getIconHTML('alchemist', '🧪')}</div><div class="name">Алхимик</div>`;
        break;
      case 'bat':
        className += ' bat';
        html = `<div class="icon">${getIconHTML('bat', '🦇')}</div><div class="name">Мышь</div>`;
        break;
      case 'vomit':
        className += ' trap';
        html = `<div class="icon">${getIconHTML('vomit', '🤢')}</div><div class="name">Рвота</div>`;
        break;
      case 'hallucination':
        className += ' trap';
        html = `<div class="icon">${getIconHTML('hallucination', '🌀')}</div><div class="name">Галлюц.</div>`;
        break;
      case 'panic':
        className += ' trap';
        html = `<div class="icon">${getIconHTML('panic', '😱')}</div><div class="name">Паника</div>`;
        break;
      default: className += ' empty';
    }
  }

  if (cardEl._lastHTML !== html || cardEl._lastClass !== className) {
    cardEl._lastHTML = html;
    cardEl._lastClass = className;
    cardEl.className = className;
    cardEl.innerHTML = html;
  }

  fitCardName(cardEl);
}

function renderEnemy(e) {
  const cfg = CONFIG.ENEMIES[e.type];
  if (!cfg) return '';

  let iconKey = e.type;
  if (e.type === 'count' && e.roleSwapped) iconKey = 'count_cuffed';

  return `
    <div class="hp">${e.hp}</div>
    <div class="icon">${getIconHTML(iconKey, cfg.icon)}</div>
    <div class="name">${cfg.name}</div>
  `;
}

function renderItem(e) {
  const def = e.def;
  if (!def) return '';
  const hpBadge = ((def.kind === 'weapon' || def.kind === 'usable') && e.hp)
    ? `<div class="hp hp-weapon">${e.hp}</div>` : '';
  return `
    ${hpBadge}
    <div class="icon">${getIconHTML(e.itemType, '❓')}</div>
    <div class="name">${def.name}</div>
  `;
}

function renderBook(e) {
  return `
    <div class="icon">${getIconHTML(e.bookType, '📕')}</div>
    <div class="name">Книга</div>
  `;
}

function renderDrug(e) {
  return `
    <div class="icon">${getIconHTML(e.drugType, e.def.icon)}</div>
    <div class="name">${e.def.name}</div>
  `;
}

function renderWine(e) {
  return `
    <div class="icon">${getIconHTML(e.wineType, e.def.icon)}</div>
    <div class="name">${e.def.name}</div>
  `;
}

function renderTrap(e) {
  const hpBadge = `<div class="hp hp-weapon">${e.hp || 0}</div>`;
  if (e.trapType === 'spikes') {
    const key = e.state === 'deadly' ? 'spikes_deadly' : 'spikes_safe';
    const fallback = e.state === 'deadly' ? '☠️' : '🔺';
    return `${hpBadge}<div class="icon">${getIconHTML(key, fallback)}</div><div class="name">Шипы${e.state === 'deadly' ? '!' : ''}</div>`;
  }
  if (e.trapType === 'slick')
    return `${hpBadge}<div class="icon">${getIconHTML('slick', '💧')}</div><div class="name">Скользко</div>`;
  if (e.trapType === 'fireCannon') {
    const dirKeys = ['fireCannon_up', 'fireCannon_right', 'fireCannon_down', 'fireCannon_left'];
    const dirArrows = ['', '', '', ''];
    const key = dirKeys[e.direction] || 'fireCannon';
    return `${hpBadge}<div class="icon">${getIconHTML(key, '🔥')}</div><div class="name">Пушка ${dirArrows[e.direction] || ''}</div>`;
  }
}

function renderDevice(e) {
  return `<div class="icon">${getIconHTML(e.deviceType, e.def.icon)}</div><div class="name">${e.def.name}</div>`;
}

function fitCardName(cardEl) {
  const nameEl = cardEl.querySelector('.name');
  if (!nameEl) return;
  const text = (nameEl.textContent || '').trim();
  if (!text) return;

  nameEl.style.fontSize = '';
  nameEl.style.lineHeight = '';
  nameEl.style.whiteSpace = '';
  nameEl.style.overflow = '';

  const cardRect = cardEl.getBoundingClientRect();
  const maxW = Math.max(0, cardRect.width - 8);
  const maxH = Math.max(0, cardRect.height * 0.4);
  if (maxW <= 0 || maxH <= 0) return;

  const cs = getComputedStyle(nameEl);
  const fontFamily = cs.fontFamily;
  const baseSize = parseFloat(cs.fontSize) || 12;
  const words = text.split(/\s+/);
  const maxLines = words.length >= 2 ? 2 : 1;

  let size = baseSize;
  while (size > 5) {
    const widest = widestWordWidth(text, size, fontFamily);
    if (widest > maxW) { size -= 1; continue; }
    const lines = measureLines(text, size, fontFamily, maxW);
    const totalH = lines * size * 1.15;
    if (lines <= maxLines && totalH <= maxH) break;
    size -= 1;
  }

  nameEl.style.fontSize = size + 'px';
  nameEl.style.lineHeight = '1.15';
  nameEl.style.whiteSpace = 'normal';
  nameEl.style.overflow = 'visible';
}

function measureLines(text, size, fontFamily, maxWidth) {
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.left = '-9999px';
  probe.style.top = '-9999px';
  probe.style.width = maxWidth + 'px';
  probe.style.fontFamily = fontFamily;
  probe.style.fontSize = size + 'px';
  probe.style.lineHeight = '1.15';
  probe.style.whiteSpace = 'normal';
  probe.style.wordBreak = 'keep-all';
  probe.style.overflowWrap = 'normal';
  probe.style.textAlign = 'center';
  probe.textContent = text;
  document.body.appendChild(probe);
  const lh = size * 1.15;
  const lines = Math.max(1, Math.round(probe.scrollHeight / lh));
  document.body.removeChild(probe);
  return lines;
}

function widestWordWidth(text, size, fontFamily) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${size}px ${fontFamily}`;
  let max = 0;
  for (const w of text.split(/\s+/)) {
    const width = ctx.measureText(w).width;
    if (width > max) max = width;
  }
  return max;
}

function updateHUD() {
  const el = document.getElementById('score');
  if (!el) return;
  const room = getRoomConfig(currentRoomId);
  const name = room ? room.name : '';
  el.textContent = `🍷 ${player.wineCount}  |  ${name}  |  🎯 ${gameTurn}`;
}

function animateHitById(id, type) {
  const entry = cardMap[id];
  if (!entry) return;
  const cls = type === 'player' ? 'pulse-player' : 'pulse';
  entry.el.classList.add(cls);
  setTimeout(() => entry.el.classList.remove(cls), 500);
}

function log(msg) {
  const logEl = document.getElementById('log');
  if (!logEl) return;
  const line = document.createElement('div');
  line.textContent = msg;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
  while (logEl.children.length > 30) logEl.removeChild(logEl.firstChild);
  console.log(msg);
}

function handleResize() {
  if (!fieldInitialized) return;
  for (const id in cardMap) { cardMap[id].x = -1; cardMap[id].y = -1; }
  initFieldDOM();
  render();
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => setTimeout(handleResize, 150));