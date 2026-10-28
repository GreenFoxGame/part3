// ============================================
// ИГРОК (Особняк вампиров)
// ============================================

let player = {
  x: 0, y: 0,
  hp: 10,
  hand: null,         // ← оружие ИЛИ usable (один предмет)
  inventory: [],      // ← только еда
  wineCount: 0,
  busy: null,
  maidCostume: false,
  frozen: 0,
  submitted: false,
  apronTurns: 0,
  gagTurns: 0
};

let playerWasHit = false;
let playerHitX = null;
let playerHitY = null;

let behaviorStats = {
  torture: { submitted: 0, dominated: 0, metCount: false },
  library: { booksRead: [] },
  lab: { drugsTried: [] },
  roomsPassed: 0,
  wineCollected: 0,
  deaths: 0,

  // НОВОЕ
  tortureTurnsAfterDoor: 0,
  labCardsBeforeDoor: 0,
  libraryCardsAfterDoor: 0
};

function initPlayer() {
  const room = getRoomConfig('hall');
  const ps = room ? room.playerStart : { x: 1, y: 1 };
  player.gagTurns = 0;
  player.x = ps.x;
  player.y = ps.y;
  player.hp = CONFIG.PLAYER_START_HP;
  player.hand = null;
  player.inventory = [];
  player.wineCount = 0;
  player.busy = null;
  player.maidCostume = false;
  player.frozen = 0;
  player.submitted = false;
  player.apronTurns = 0;

  playerWasHit = false;
  playerHitX = null;
  playerHitY = null;

  behaviorStats = {
    torture: { submitted: 0, dominated: 0, metCount: false },
    library: { booksRead: [] },
    lab: { drugsTried: [] },
    roomsPassed: 0,
    wineCollected: 0,
    deaths: 0
  };
}

function playerTakeDamage(amount) {
  if (amount <= 0) return;
  player.hp -= amount;
  playerWasHit = true;
  if (playerHitX === null) { playerHitX = player.x; playerHitY = player.y; }
  log(`💔 Игрок получает ${amount} урона. HP: ${player.hp}`);
  if (player.hp <= 0) { player.hp = 0; gameOver(); }
}

function playerHeal(amount) {
  if (amount <= 0) return;
  const before = player.hp;
  player.hp = Math.min(CONFIG.PLAYER_MAX_HP, player.hp + amount);
  log(`💚 Игрок восстанавливает ${player.hp - before} HP. HP: ${player.hp}/${CONFIG.PLAYER_MAX_HP}`);
}

function playerPickupHand(item) {
  if (!item || !item.def) return false;
  const def = item.def;
  if (def.kind !== 'weapon' && def.kind !== 'usable') return false;

  if (player.hand) {
    log(`Выкинул ${player.hand.def.name}, взял ${def.name}`);
  }
  player.hand = item;
  log(`В руках: ${def.name}`);
  return true;
}

function addToInventory(item) {
  if (!item) return false;
  if (item.def && item.def.kind !== 'food') return false;
  if (player.inventory.some(i => i.id === item.id)) return false;
  player.inventory.push(item);
  log(`В сумке: ${item.def.name}`);
  return true;
}

function removeFromInventory(itemId) {
  const idx = player.inventory.findIndex(i => i.id === itemId);
  if (idx < 0) return null;
  return player.inventory.splice(idx, 1)[0];
}

function hasInInventory(itemType) {
  return player.inventory.some(i => i.itemType === itemType);
}

function getFromInventory(itemType) {
  return player.inventory.find(i => i.itemType === itemType) || null;
}

function addWine(n = 1) {
  player.wineCount += n;
  behaviorStats.wineCollected = player.wineCount;
  log(`🍷 Жертвенное вино! Всего: ${player.wineCount}`);
}

function startEating(item) {
  if (!item || !item.def || item.def.kind !== 'food') return false;
  const def = item.def;

  if (def.turnsToEat && def.turnsToEat > 1) {
    player.busy = { type: 'eat', itemId: item.id, itemDef: def, turnsLeft: def.turnsToEat, heal: def.heal || 0 };
    log(`🍭 Сосёшь ${def.name}... (${def.turnsToEat} хода, +${def.heal} HP в конце)`);
    return true;
  }

  playerHeal(def.heal || 0);
  return true;
}

function tickEating() {
  if (!player.busy || player.busy.type !== 'eat') return;
  player.busy.turnsLeft--;
  if (player.busy.turnsLeft <= 0) {
    const heal = player.busy.heal || 0;
    if (heal > 0) playerHeal(heal);
    log('🍭 Закончил сосать леденец.');
    player.busy = null;
  } else {
    log(`🍭 Продолжаешь сосать... (ещё ${player.busy.turnsLeft})`);
  }
}

function applyMaidCostume() {
  player.maidCostume = true;
  log('👗 Надел костюм горничной — враги отвлеклись (пропустят ход)!');
}

function applyFrak() {
  player.apronTurns = 3;
  log('🥼 Надел фрак — все думают, что ты контролирующий (3 хода).');

  // Враги сразу расступаются
  if (typeof enemiesMakeWay === 'function') enemiesMakeWay();
}

const CHECKPOINT_KEY = 'manor_checkpoint_v1';

function saveCheckpoint(roomId) {
  try {
    const data = {
      roomId: roomId || currentRoomId,
      hp: player.hp,
      hand: player.hand ? { id: player.hand.id, itemType: player.hand.itemType, hp: player.hand.hp } : null,
      inventory: player.inventory.map(i => ({ id: i.id, itemType: i.itemType })),
      wineCount: player.wineCount,
      behaviorStats: JSON.parse(JSON.stringify(behaviorStats)),
      savedAt: Date.now()
    };
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(data));
    console.log('💾 Чекпоинт сохранён:', data.roomId);
  } catch (e) { console.warn('Не удалось сохранить чекпоинт:', e); }
}

function hasCheckpoint() {
  try { return !!localStorage.getItem(CHECKPOINT_KEY); }
  catch (e) { return false; }
}
function loadCheckpoint() {
  try {
    const raw = localStorage.getItem(CHECKPOINT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);

    player.hp = data.hp || CONFIG.PLAYER_START_HP;
    player.wineCount = data.wineCount || 0;

    if (data.hand) {
      const def = CONFIG.TORTURE_ITEMS[data.hand.itemType] || CONFIG.CELLAR_WEAPONS[data.hand.itemType];
      player.hand = def ? { id: data.hand.id, itemType: data.hand.itemType, def, hp: data.hand.hp } : null;
    } else { player.hand = null; }

    player.inventory = [];
    if (Array.isArray(data.inventory)) {
      for (const it of data.inventory) {
        const def = CONFIG.TORTURE_ITEMS[it.itemType] || CONFIG.CELLAR_WEAPONS[it.itemType];
        if (def) player.inventory.push({ id: it.id, itemType: it.itemType, def });
      }
    }

    if (data.behaviorStats) behaviorStats = data.behaviorStats;

    player.busy = null;
    player.maidCostume = false;
    player.frozen = 0;
    player.submitted = false;

    return data.roomId || 'hall';
  } catch (e) { console.warn('Не удалось загрузить чекпоинт:', e); return null; }
}

function clearCheckpoint() {
  try { localStorage.removeItem(CHECKPOINT_KEY); } catch (e) {}
}

function onPlayerDeath() {
  behaviorStats.deaths = (behaviorStats.deaths || 0) + 1;
}