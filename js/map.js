// ============================================
// ПОЛЕ И ЛОКАЦИИ (Особняк вампиров)
// ============================================

let roomDoorAppeared = false;
let roomCardsPassed = 0;
let hallucinationTurns = 0;
let panicTurns = 0;
let lastPlayerFrom = null;
let FIELD = [];
let FIELD_W = 3;
let FIELD_H = 4;
let gameTurn = 0;
let globalTurn = 0;
let nextEntityId = 1;
let currentRoomId = 'hall';
let roomVisited = {};
let doorsSpawned = false;
let lastShiftDirection = null;
let skipNextSpawnAnimation = false;

function newEntityId() { return 'e_' + (nextEntityId++); }

// ============================================
// ИНИЦИАЛИЗАЦИЯ ПОЛЯ ПОД КОМНАТУ
// ============================================
function initField(roomId) {
  roomDoorAppeared = false;
  roomCardsPassed = 0;
  hallucinationTurns = 0;
  panicTurns = 0;
  lastPlayerFrom = null;

  const room = getRoomConfig(roomId);
  if (!room) { console.error('initField: неизвестная комната', roomId); return; }

  currentRoomId = roomId;
  FIELD_W = room.width;
  FIELD_H = room.height;
  gameTurn = 0;
  doorsSpawned = false;
  nextEntityId = 1;
  lastShiftDirection = null;

  FIELD = [];
  for (let y = 0; y < FIELD_H; y++) {
    FIELD[y] = [];
    for (let x = 0; x < FIELD_W; x++) {
      FIELD[y][x] = { x, y, entity: null, type: 'empty' };
    }
  }

  if (room.fixed && room.fixed.length) {
    for (const f of room.fixed) {
      const cell = getCell(f.x, f.y);
      if (!cell) continue;
      cell.entity = createFixedEntity(f);
      if (cell.entity) cell.type = cell.entity.kind;
    }
  }

  fillRoomContent(room);
  fillEmptyCells();

  // Лаборатория: дверь фикс. → флаг сразу
  if (room.id === 'lab') {
    roomDoorAppeared = true;
  }
}

// ============================================
// ФИКС. СУЩНОСТИ
// ============================================
function createFixedEntity(f) {
  switch (f.kind) {
    case 'door':     return { id: newEntityId(), kind: 'door', locked: false };
    case 'butler':   return { id: newEntityId(), kind: 'butler', greeted: false, essential: true };
    case 'entrance': return { id: newEntityId(), kind: 'entrance', examined: false, essential: true };
    case 'librarian':return { id: newEntityId(), kind: 'librarian', annoyed: false, essential: true };
    case 'alchemist':return { id: newEntityId(), kind: 'alchemist', high: true, essential: true };
    case 'device': {
      const def = CONFIG.DEVICES[f.deviceType];
      if (!def) return null;
      return { id: newEntityId(), kind: 'device', deviceType: f.deviceType, def, essential: true };
    }
    case 'trap': {
      const def = CONFIG.TRAPS[f.trapType];
      if (!def) return null;
      const base = { id: newEntityId(), kind: 'trap', trapType: f.trapType, hp: def.hp || 0 };
      if (f.trapType === 'spikes') {
        base.state = f.state || 'safe';
        base.timer = 0;
      } else if (f.trapType === 'fireCannon') {
        base.direction = f.direction || 0;
      }
      return base;
    }
    default:
      console.warn('createFixedEntity: неизвестный kind', f.kind);
      return null;
  }
}

// ============================================
// ЗАПОЛНЕНИЕ КОМНАТЫ
// ============================================
function fillRoomContent(room) {
  const occupied = new Set();
  for (let y = 0; y < FIELD_H; y++)
    for (let x = 0; x < FIELD_W; x++)
      if (FIELD[y][x].entity) occupied.add(x + ',' + y);

  const ps = room.playerStart;
  if (ps) occupied.add(ps.x + ',' + ps.y);

  function freeCells() {
    const list = [];
    for (let y = 0; y < FIELD_H; y++)
      for (let x = 0; x < FIELD_W; x++)
        if (!occupied.has(x + ',' + y)) list.push({ x, y });
    return list;
  }

  function placeAtRandom(factory) {
    const list = freeCells();
    if (!list.length) return false;
    const idx = Math.floor(Math.random() * list.length);
    const { x, y } = list[idx];
    const e = factory();
    if (!e) return false;
    FIELD[y][x].entity = e;
    FIELD[y][x].type = e.kind;
    occupied.add(x + ',' + y);
    return true;
  }

  if (room.trapFill) {
    const types = Object.keys(room.trapFill);
    const weights = room.trapFill;
    const list = freeCells();
    for (const pos of list) {
      const r = Math.random();
      let acc = 0;
      let chosen = types[0];
      for (const t of types) {
        acc += weights[t];
        if (r <= acc) { chosen = t; break; }
      }
      const e = createTrap(chosen);
      if (!e) continue;
      FIELD[pos.y][pos.x].entity = e;
      FIELD[pos.y][pos.x].type = 'trap';
      occupied.add(pos.x + ',' + pos.y);
    }
  }

  if (room.itemSpawn) {
    for (const itemType of room.itemSpawn) {
      placeAtRandom(() => {
        if (itemType === 'tea_cookies') {
          return { id: newEntityId(), kind: 'item', itemType: 'tea_cookies', def: { ...CONFIG.TEA, kind: 'food' } };
        }
        return createTortureItem(itemType);
      });
    }
  }

  if (room.enemySpawn) {
    for (const enemyType of room.enemySpawn)
      placeAtRandom(() => createEnemy(enemyType));
  }

  if (room.bookSpawn) {
    for (const bookType of room.bookSpawn)
      placeAtRandom(() => createBook(bookType));
  }

  if (room.batSpawn) {
    for (let i = 0; i < room.batSpawn; i++)
      placeAtRandom(() => ({ id: newEntityId(), kind: 'bat', asleep: true }));
  }

  if (room.deviceSpawn) {
    for (const devType of room.deviceSpawn)
      placeAtRandom(() => createDevice(devType));
  }

  if (room.drugSpawn) {
    for (const drugType of room.drugSpawn)
      placeAtRandom(() => createDrug(drugType));
  }

  if (room.wineSpawn) {
    for (const wineType of room.wineSpawn)
      placeAtRandom(() => createWine(wineType));
  }

  if (room.weaponSpawn) {
    for (const wType of room.weaponSpawn)
      placeAtRandom(() => createCellarWeapon(wType));
  }
}

// ============================================
// ФАБРИКИ СУЩНОСТЕЙ
// ============================================
function createTrap(trapType) {
  const def = CONFIG.TRAPS[trapType];
  if (!def) return null;
  const base = { id: newEntityId(), kind: 'trap', trapType, hp: def.hp || 0 };
  if (trapType === 'spikes') { base.state = 'safe'; base.timer = 0; }
  else if (trapType === 'fireCannon') { base.direction = Math.floor(Math.random() * 4); }
  return base;
}

function createTortureItem(itemType) {
  const def = CONFIG.TORTURE_ITEMS[itemType];
  if (!def) return null;
  const e = { id: newEntityId(), kind: 'item', itemType, def };
  if (def.kind === 'weapon') e.hp = getWeaponHp(def);
  else if (def.kind === 'usable' && def.hp) e.hp = def.hp;
  return e;
}

function createCellarWeapon(wType) {
  const def = CONFIG.CELLAR_WEAPONS[wType];
  if (!def) return null;
  const e = { id: newEntityId(), kind: 'item', itemType: wType, def };
  if (def.kind === 'weapon') e.hp = getWeaponHp(def);
  else if (def.kind === 'usable' && def.hp) e.hp = def.hp;
  return e;
}

function createEnemy(enemyType) {
  const cfg = CONFIG.ENEMIES[enemyType];
  if (!cfg) return null;
  const hp = getEnemyHp(enemyType);
  const enemy = { id: newEntityId(), kind: 'enemy', type: enemyType, hp, maxHp: hp, behavior: cfg.behavior };
  if (enemyType === 'sommelier') enemy.cooldown = 0;
  if (enemyType === 'count') enemy.roleSwapOffered = false;
  return enemy;
}

function createBook(bookType) {
  const def = CONFIG.BOOKS[bookType];
  if (!def) return null;
  return { id: newEntityId(), kind: 'book', bookType, def, read: false };
}

function createDevice(devType) {
  const def = CONFIG.DEVICES[devType];
  if (!def) return null;
  return { id: newEntityId(), kind: 'device', deviceType: devType, def };
}

function createDrug(drugType) {
  const def = CONFIG.DRUGS[drugType];
  if (!def) return null;
  return { id: newEntityId(), kind: 'drug', drugType, def };
}

function createWine(wineType) {
  const def = CONFIG.WINES[wineType];
  if (!def) return null;
  return { id: newEntityId(), kind: 'wine', wineType, def };
}

// ============================================
// ДОСТУП К КЛЕТКАМ
// ============================================
function getCell(x, y) {
  if (x < 0 || y < 0 || x >= FIELD_W || y >= FIELD_H) return null;
  return FIELD[y][x];
}

function fillEmptyCells() { /* пустые остаются пустыми */ }

// ============================================
// СЛУЧАЙНАЯ СУЩНОСТЬ (с прогрессом сложности)
// ============================================
function createRandomEntity() {
  const room = getRoomConfig(currentRoomId);
  if (!room) return null;

  const weights = { ...(room.spawnWeights || {}) };
  if (Object.keys(weights).length === 0) return null;

  const enemyKeys = ['count', 'lady', 'submissive', 'latex_maid',
                     'drunkard', 'sommelier', 'winemaker', 'tavernkeeper'];
  const resourceKeys = ['whip', 'glass', 'nipple_clamps', 'fur_handcuffs',
                        'lubricant', 'wine', 'cellar_weapon', 'book',
                        'drug', 'device', 'bat', 'tea_cookies'];

  const turn = (typeof gameTurn !== 'undefined') ? gameTurn : 0;
  const enemyMult = Math.min(
    1 + turn * CONFIG.ENEMY_GROWTH_PER_TURN,
    CONFIG.ENEMY_MAX_MULTIPLIER
  );
  const resourceMult = Math.max(
    1 - turn * CONFIG.RESOURCE_DECAY_PER_TURN,
    CONFIG.RESOURCE_MIN_MULTIPLIER
  );

  for (const k of enemyKeys) {
    if (weights[k] !== undefined) weights[k] *= enemyMult;
  }
  for (const k of resourceKeys) {
    if (weights[k] !== undefined) weights[k] *= resourceMult;
  }

  const type = weightedRandom(weights);
  if (!type || type === 'empty') return null;

  return createEntityByType(type);
}

// ============================================
// СОЗДАТЬ СУЩНОСТЬ ПО ТИПУ
// ============================================
function createEntityByType(type) {
  if (!type) return null;

  if (CONFIG.TRAPS[type]) return createTrap(type);

  if (CONFIG.TORTURE_ITEMS[type]) {
    const def = CONFIG.TORTURE_ITEMS[type];
    const e = { id: newEntityId(), kind: 'item', itemType: type, def };
    if (def.kind === 'weapon') e.hp = getWeaponHp(def);
    return e;
  }

  if (type === 'cellar_weapon') {
    const keys = Object.keys(CONFIG.CELLAR_WEAPONS);
    const k = keys[Math.floor(Math.random() * keys.length)];
    const def = CONFIG.CELLAR_WEAPONS[k];
    const e = { id: newEntityId(), kind: 'item', itemType: k, def };
    if (def.kind === 'weapon') e.hp = getWeaponHp(def);
    return e;
  }

  if (CONFIG.CELLAR_WEAPONS[type]) {
    const def = CONFIG.CELLAR_WEAPONS[type];
    const e = { id: newEntityId(), kind: 'item', itemType: type, def };
    if (def.kind === 'weapon') e.hp = getWeaponHp(def);
    return e;
  }

  if (CONFIG.ENEMIES[type]) {
    const cfg = CONFIG.ENEMIES[type];
    const hp = getEnemyHp(type);
    const enemy = { id: newEntityId(), kind: 'enemy', type, hp, maxHp: hp, behavior: cfg.behavior };
    if (type === 'sommelier') enemy.cooldown = 0;
    if (type === 'count') enemy.roleSwapOffered = false;
    return enemy;
  }

  if (CONFIG.DRUGS[type]) {
    return { id: newEntityId(), kind: 'drug', drugType: type, def: CONFIG.DRUGS[type] };
  }

  if (CONFIG.DEVICES[type]) {
    return { id: newEntityId(), kind: 'device', deviceType: type, def: CONFIG.DEVICES[type], essential: true };
  }

  if (type === 'wine') {
    const keys = Object.keys(CONFIG.WINES);
    const k = keys[Math.floor(Math.random() * keys.length)];
    return { id: newEntityId(), kind: 'wine', wineType: k, def: CONFIG.WINES[k] };
  }

  if (CONFIG.WINES[type]) {
    return { id: newEntityId(), kind: 'wine', wineType: type, def: CONFIG.WINES[type] };
  }

  if (type === 'book') {
    const keys = Object.keys(CONFIG.BOOKS);
    const k = keys[Math.floor(Math.random() * keys.length)];
    return { id: newEntityId(), kind: 'book', bookType: k, def: CONFIG.BOOKS[k], read: false };
  }

  if (type === 'bat') return { id: newEntityId(), kind: 'bat', asleep: true };

  if (type === 'tea_cookies') {
    return { id: newEntityId(), kind: 'item', itemType: 'tea_cookies',
             def: { ...CONFIG.TEA, kind: 'food' } };
  }

  return null;
}

// ============================================
// ПРЕДЗАПОЛНЕНИЕ КОМНАТЫ
// ============================================
function prefillRoom(roomId) {
  const room = getRoomConfig(roomId);
  if (!room) return;

  if (roomId === 'traps') return;

  // Собираем свободные клетки
  const free = [];
  for (let y = 0; y < FIELD_H; y++)
    for (let x = 0; x < FIELD_W; x++) {
      const cell = FIELD[y][x];
      if (player && player.x === x && player.y === y) continue;
      if (cell.entity) continue;
      free.push(cell);
    }

  if (free.length === 0) return;

  // ============================================
  // ПЫТОЧНАЯ: гарантированно по одному каждого врага + наручники,
  // остальное — по весам. Госпожи не ставятся рядом друг с другом.
  // ============================================
  if (roomId === 'torture') {
    free.sort(() => Math.random() - 0.5);

    const weights = { ...room.spawnWeights };
    const placedLadies = [];

    // --- 1. Гарантированный спавн всех типов врагов пыточной ---
    const guaranteedEnemies = ['count', 'lady', 'submissive', 'latex_maid'];
    for (const enemyType of guaranteedEnemies) {
      if (!CONFIG.ENEMIES[enemyType]) continue;

      // Для Госпожи — не рядом с другой Госпожой
      const available = free.filter(c => {
        if (c.entity) return false;
        if (enemyType === 'lady') {
          return !placedLadies.some(l => Math.abs(c.x - l.x) <= 1 && Math.abs(c.y - l.y) <= 1);
        }
        return true;
      });
      if (available.length === 0) continue;

      const cell = available[Math.floor(Math.random() * available.length)];
      cell.entity = createEnemy(enemyType);
      cell.type = 'enemy';
      if (enemyType === 'lady') placedLadies.push({ x: cell.x, y: cell.y });
    }

    // --- 2. Гарантированные наручники (один раз) ---
    const handcuffDef = CONFIG.TORTURE_ITEMS.fur_handcuffs;
    if (handcuffDef) {
      const freeForCuffs = free.filter(c => !c.entity);
      if (freeForCuffs.length > 0) {
        const cell = freeForCuffs[Math.floor(Math.random() * freeForCuffs.length)];
        cell.entity = { id: newEntityId(), kind: 'item', itemType: 'fur_handcuffs', def: handcuffDef };
        cell.type = 'item';
      }
    }

    // --- 3. Остальные клетки — по весам ---
    const nonLadyWeights = { ...weights };
    delete nonLadyWeights.lady;
    // Убираем гарантированных, чтобы не спавнить их повторно с тем же весом
    delete nonLadyWeights.count;
    delete nonLadyWeights.submissive;
    delete nonLadyWeights.latex_maid;
    delete nonLadyWeights.fur_handcuffs;

    // Госпожи по весам — отдельно, с проверкой соседства
    const ladyWeight = weights.lady || 0;
    const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);
    const ladyCount = Math.max(0, Math.round((ladyWeight / totalWeight) * free.length) - 1);
    // -1, потому что одну Госпожу уже поставили гарантированно

    let placedExtra = 0;
    for (let attempt = 0; attempt < 100 && placedExtra < ladyCount; attempt++) {
      const available = free.filter(c =>
        !c.entity &&
        !placedLadies.some(l => Math.abs(c.x - l.x) <= 1 && Math.abs(c.y - l.y) <= 1)
      );
      if (available.length === 0) break;
      const cell = available[Math.floor(Math.random() * available.length)];
      cell.entity = createEnemy('lady');
      cell.type = 'enemy';
      placedLadies.push({ x: cell.x, y: cell.y });
      placedExtra++;
    }

    // Остальные — по весам
    for (const cell of free) {
      if (cell.entity) continue;
      const type = weightedRandom(nonLadyWeights);
      if (!type || type === 'empty') continue;
      const entity = createEntityByType(type);
      if (!entity) continue;
      cell.entity = entity;
      cell.type = entity.kind;
    }

    return;
  }

  // ============================================
  // БИБЛИОТЕКА: все книги по одному разу, остальное по весам
  // ============================================
  if (roomId === 'library') {
    free.sort(() => Math.random() - 0.5);
    const bookTypes = Object.keys(CONFIG.BOOKS);
    let idx = 0;
    for (const bookType of bookTypes) {
      if (idx >= free.length) break;
      const cell = free[idx++];
      cell.entity = { id: newEntityId(), kind: 'book', bookType, def: CONFIG.BOOKS[bookType], read: false };
      cell.type = 'book';
    }
    // Гарантированный чай
    if (idx < free.length) {
      const cell = free[idx++];
      cell.entity = { id: newEntityId(), kind: 'item', itemType: 'tea_cookies',
                      def: { ...CONFIG.TEA, kind: 'food' } };
      cell.type = 'item';
    }
    // Остальное по весам
    const weights = { ...room.spawnWeights };
    delete weights.book;
    delete weights.tea_cookies;
    for (; idx < free.length; idx++) {
      const type = weightedRandom(weights);
      if (!type || type === 'empty') continue;
      const entity = createEntityByType(type);
      if (!entity) continue;
      free[idx].entity = entity;
      free[idx].type = entity.kind;
    }
    return;
  }

  // ============================================
  // ЛАБОРАТОРИЯ: 7 наркотиков по одному разу + добить случайным
  // ============================================
  if (roomId === 'lab') {
    free.sort(() => Math.random() - 0.5);
    const drugTypes = Object.keys(CONFIG.DRUGS);
    let idx = 0;
    for (const drugType of drugTypes) {
      if (idx >= free.length) break;
      const cell = free[idx++];
      cell.entity = { id: newEntityId(), kind: 'drug', drugType, def: CONFIG.DRUGS[drugType] };
      cell.type = 'drug';
    }
    for (; idx < free.length; idx++) {
      const drugType = drugTypes[Math.floor(Math.random() * drugTypes.length)];
      const cell = free[idx];
      cell.entity = { id: newEntityId(), kind: 'drug', drugType, def: CONFIG.DRUGS[drugType] };
      cell.type = 'drug';
    }
    return;
  }

  // ============================================
  // ОСТАЛЬНЫЕ КОМНАТЫ — сортировка оружие/враги
  // ============================================
  free.sort((a, b) => {
    const da = Math.abs(a.x - player.x) + Math.abs(a.y - player.y);
    const db = Math.abs(b.x - player.x) + Math.abs(b.y - player.y);
    return da - db;
  });

  const half = Math.floor(free.length / 2);
  const nearCells = free.slice(0, half);
  const farCells = free.slice(half);

  for (let i = 0; i < free.length; i++) {
    const weights = room.spawnWeights || {};
    const type = weightedRandom(weights);
    if (!type || type === 'empty') continue;
    const entity = createEntityByType(type);
    if (!entity) continue;

    const isEnemy = !!CONFIG.ENEMIES[type];
    let targetCell = null;
    if (isEnemy) {
      targetCell = farCells.find(c => !c.entity) || nearCells.find(c => !c.entity);
    } else {
      targetCell = nearCells.find(c => !c.entity) || farCells.find(c => !c.entity);
    }
    if (!targetCell) continue;
    targetCell.entity = entity;
    targetCell.type = entity.kind;
  }
}

// ============================================
// СТАТИЧНЫЕ СУЩНОСТИ
// ============================================
function isStaticEntity(e) {
  if (!e) return false;
  if (e.kind === 'door') return true;
  if (e.kind === 'device') return true;
  if (e.essential) return true;
  return false;
}

// ============================================
// СДВИГ ЛИНИИ
// ============================================
function shiftLine(direction, oldX, oldY) {
  if (currentRoomId === 'traps') return;

  lastShiftDirection = direction;

  // Есть ли в линии статичные сущности?
  if (direction === 'right' || direction === 'left') {
    const y = oldY;
    for (let x = 0; x < FIELD_W; x++) {
      if (isStaticEntity(FIELD[y][x].entity)) return;
    }
  } else {
    const x = oldX;
    for (let y = 0; y < FIELD_H; y++) {
      if (isStaticEntity(FIELD[y][x].entity)) return;
    }
  }

  if (direction === 'right') {
    const y = oldY;
    for (let x = oldX; x > 0; x--) {
      FIELD[y][x].entity = FIELD[y][x - 1].entity;
      FIELD[y][x].type = FIELD[y][x - 1].type;
    }
    FIELD[y][0].entity = createRandomEntity();
    FIELD[y][0].type = FIELD[y][0].entity ? FIELD[y][0].entity.kind : 'empty';
    ensureHandcuffsIfCountPresent();

  } else if (direction === 'left') {
    const y = oldY;
    for (let x = oldX; x < FIELD_W - 1; x++) {
      FIELD[y][x].entity = FIELD[y][x + 1].entity;
      FIELD[y][x].type = FIELD[y][x + 1].type;
    }
    FIELD[y][FIELD_W - 1].entity = createRandomEntity();
    FIELD[y][FIELD_W - 1].type = FIELD[y][FIELD_W - 1].entity ? FIELD[y][FIELD_W - 1].entity.kind : 'empty';
    ensureHandcuffsIfCountPresent();

  } else if (direction === 'up') {
    const x = oldX;
    for (let y = oldY; y < FIELD_H - 1; y++) {
      FIELD[y][x].entity = FIELD[y + 1][x].entity;
      FIELD[y][x].type = FIELD[y + 1][x].type;
    }
    FIELD[FIELD_H - 1][x].entity = createRandomEntity();
    FIELD[FIELD_H - 1][x].type = FIELD[FIELD_H - 1][x].entity ? FIELD[FIELD_H - 1][x].entity.kind : 'empty';
    ensureHandcuffsIfCountPresent();

  } else if (direction === 'down') {
    const x = oldX;
    for (let y = oldY; y > 0; y--) {
      FIELD[y][x].entity = FIELD[y - 1][x].entity;
      FIELD[y][x].type = FIELD[y - 1][x].type;
    }
    FIELD[0][x].entity = createRandomEntity();
    FIELD[0][x].type = FIELD[0][x].entity ? FIELD[0][x].entity.kind : 'empty';
    ensureHandcuffsIfCountPresent();
  }

  skipNextSpawnAnimation = true;
}

// ============================================
// ДВЕРИ
// ============================================
function spawnDoors(count) {
  if (doorsSpawned) return false;
  const room = getRoomConfig(currentRoomId);
  if (!room || room.isFinal) return false;

  if (currentRoomId === 'traps') return false;
  if (room.noExtraDoors) return false;

  const n = count || room.doorsCount || 2;
  const list = [];
  for (let y = 0; y < FIELD_H; y++)
    for (let x = 0; x < FIELD_W; x++) {
      if (player && player.x === x && player.y === y) continue;
      const cell = FIELD[y][x];
      if (!cell.entity) list.push(cell);
    }

  if (list.length === 0) {
    for (let y = 0; y < FIELD_H; y++)
      for (let x = 0; x < FIELD_W; x++) {
        if (player && player.x === x && player.y === y) continue;
        const cell = FIELD[y][x];
        if (cell.entity && !isStaticEntity(cell.entity) && cell.entity.kind !== 'door') list.push(cell);
      }
  }

  if (list.length === 0) return false;

  let placed = 0;
  while (placed < n && list.length > 0) {
    const idx = Math.floor(Math.random() * list.length);
    const cell = list.splice(idx, 1)[0];
    cell.entity = { id: newEntityId(), kind: 'door', locked: false };
    cell.type = 'door';
    placed++;
  }

  if (placed > 0) {
    doorsSpawned = true;
    roomDoorAppeared = true;
    log(`🚪 Появились двери (${placed}) — можно идти дальше!`);
    return true;
  }
  return false;
}

// ============================================
// ПЕРЕХОД В СЛЕДУЮЩУЮ КОМНАТУ
// ============================================
function goToNextRoom() {
  const nextId = getNextRoomId(currentRoomId);
  if (!nextId) { log('🏁 Это была последняя комната.'); return false; }

  if (typeof behaviorStats !== 'undefined')
    behaviorStats.roomsPassed = (behaviorStats.roomsPassed || 0) + 1;

  log(`🚪 Переход в комнату: ${getRoomConfig(nextId).name}`);
  initField(nextId);
  if (typeof markRoomOpened === 'function') markRoomOpened(playerId, nextId);
  initPlayerPosition();
  prefillRoom(nextId);

  if (typeof saveCheckpoint === 'function') saveCheckpoint(nextId);

  if (typeof fieldInitialized !== 'undefined') fieldInitialized = false;
  if (typeof initFieldDOM === 'function') initFieldDOM();
  if (typeof render === 'function') render();

  return true;
}

function initPlayerPosition() {
  const room = getRoomConfig(currentRoomId);
  if (!room || !player) return;
  const ps = room.playerStart || { x: 0, y: 0 };
  player.x = ps.x;
  player.y = ps.y;
}

// ============================================
// УСЛОВИЯ ДВЕРЕЙ
// ============================================
function checkDoorsCondition() {
  if (doorsSpawned) return false;
  const room = getRoomConfig(currentRoomId);
  if (!room || room.isFinal || room.doorsAlwaysPresent) return false;

  if (currentRoomId === 'traps') return false;
  if (room.noExtraDoors) return false;

  if (room.doorsAfterAllBooks) {
    const totalBooks = Object.keys(CONFIG.BOOKS).length;
    const readBooks = behaviorStats.library.booksRead.length;
    if (readBooks >= totalBooks) {
      return spawnDoors(room.doorsCount);
    }
  }

  const limit = room.doorsAfterTurns || CONFIG.DOORS_AFTER_TURNS;
  if (gameTurn >= limit) return spawnDoors(room.doorsCount);

  return false;
}

// ============================================
// СТАРОЕ
// ============================================
function fillAllCells() {
  for (let y = 0; y < FIELD_H; y++) {
    for (let x = 0; x < FIELD_W; x++) {
      const cell = FIELD[y][x];
      if (player && player.x === x && player.y === y) continue;
      if (cell.entity) continue;
      cell.entity = createRandomEntity();
      if (cell.entity) cell.type = cell.entity.kind;
    }
  }
}

// ============================================
// НАРУЧНИКИ ПРИ ГРАФЕ
// ============================================
function ensureHandcuffsIfCountPresent() {
  // Ищем Графа
  let countCell = null;
  for (let y = 0; y < FIELD_H; y++)
    for (let x = 0; x < FIELD_W; x++) {
      const e = FIELD[y][x].entity;
      if (e && e.kind === 'enemy' && e.type === 'count') { countCell = FIELD[y][x]; break; }
    }
  if (!countCell) return;

  // Ищем наручники
  for (let y = 0; y < FIELD_H; y++)
    for (let x = 0; x < FIELD_W; x++) {
      const e = FIELD[y][x].entity;
      if (e && e.kind === 'item' && e.itemType === 'fur_handcuffs') return;
    }

  // Наручников нет — ставим на любую пустую клетку (не игрока)
  const handcuffDef = CONFIG.TORTURE_ITEMS.fur_handcuffs;
  if (!handcuffDef) return;

  const candidates = [];
  for (let y = 0; y < FIELD_H; y++)
    for (let x = 0; x < FIELD_W; x++) {
      if (player && player.x === x && player.y === y) continue;
      const cell = FIELD[y][x];
      if (cell.entity) continue;
      candidates.push(cell);
    }

  if (candidates.length === 0) return;

  const cell = candidates[Math.floor(Math.random() * candidates.length)];
  cell.entity = { id: newEntityId(), kind: 'item', itemType: 'fur_handcuffs', def: handcuffDef };
  cell.type = 'item';

  log('⛓️ На поле появились наручники — при Графе они нужны.');
}