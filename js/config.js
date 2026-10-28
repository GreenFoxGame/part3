// ============================================
// НАСТРОЙКИ ИГРЫ — ОСОБНЯК ВАМПИРОВ
// Ядро от «Кладбища», комнаты сверху
// ============================================

const CONFIG = {
  PLAYER_START_HP: 10,
  PLAYER_MAX_HP: 10,
  ENEMY_GROWTH_PER_TURN: 0.01,
  ENEMY_MAX_MULTIPLIER: 1.5,
  RESOURCE_DECAY_PER_TURN: 0.003,
  RESOURCE_MIN_MULTIPLIER: 0.8,
  ROOM_ORDER: ['hall', 'traps', 'torture', 'library', 'lab', 'cellar'],
  DOORS_AFTER_TURNS: 12,

  PLAYER_SKINS: {
    "1":  "fox_idle",
    "2":  "fox_idle",
    "3":  "skin_3",
    "4":  "skin_3",
    "5":  "skin_3",
    "6":  "skin_3",
    "7":  "skin_3",
    "8":  "skin_3",
    "9":  "skin_3",
    "10": "skin_3"
  },

  ROOMS: {
    hall: {
      id: 'hall',
      name: 'Холл',
      width: 3, height: 5,
      playerStart: { x: 1, y: 4 },
      fixed: [
        { x: 1, y: 0, kind: 'door' },
        { x: 0, y: 0, kind: 'door' },
        { x: 2, y: 0, kind: 'door' },
        { x: 0, y: 4, kind: 'butler' },
        { x: 2, y: 4, kind: 'butler' }
      ],
      doorsAlwaysPresent: true,
      spawnWeights: {}
    },

    traps: {
      id: 'traps',
      name: 'Комната с ловушками',
      width: 3, height: 5,
      playerStart: { x: 1, y: 4 },
      fixed: [
        { x: 1, y: 0, kind: 'door' },

        { x: 0, y: 4, kind: 'trap', trapType: 'spikes', state: 'safe' },
        { x: 2, y: 4, kind: 'trap', trapType: 'spikes', state: 'safe' },

        { x: 0, y: 3, kind: 'trap', trapType: 'fireCannon', direction: 3 },
        { x: 1, y: 3, kind: 'trap', trapType: 'fireCannon', direction: 2 },
        { x: 2, y: 3, kind: 'trap', trapType: 'slick' },

        { x: 0, y: 2, kind: 'trap', trapType: 'slick' },
        { x: 1, y: 2, kind: 'trap', trapType: 'spikes', state: 'safe' },
        { x: 2, y: 2, kind: 'trap', trapType: 'spikes', state: 'deadly' },

        { x: 0, y: 1, kind: 'trap', trapType: 'spikes', state: 'deadly' },
        { x: 1, y: 1, kind: 'trap', trapType: 'fireCannon', direction: 3 },
        { x: 2, y: 1, kind: 'trap', trapType: 'fireCannon', direction: 0 },

        { x: 0, y: 0, kind: 'trap', trapType: 'spikes', state: 'safe' },
        { x: 2, y: 0, kind: 'trap', trapType: 'spikes', state: 'safe' }
      ],
      spawnWeights: {
        spikes: 4,
        slick: 3,
        fireCannon: 2,
        empty: 1
      },
      doorsAfterTurns: 8,
      doorsCount: 2
    },

    torture: {
      id: 'torture',
      name: 'Пыточная',
      width: 4, height: 4,
      playerStart: { x: 0, y: 3 },
      fixed: [],
      spawnWeights: {
        whip: 2,
        glass: 2,
        nipple_clamps: 1,
        fur_handcuffs: 1,
        lubricant: 2,
        gag_lollipop: 2,
        count: 2,
        lady: 1,
        submissive: 2,
        latex_maid: 2,
      },
      doorsAfterTurns: 20,
      doorsCount: 2
    },

    library: {
      id: 'library',
      name: 'Библиотека',
      width: 4, height: 4,
      playerStart: { x: 1, y: 2 },
      fixed: [
        { x: 0, y: 0, kind: 'librarian' }
      ],
      spawnWeights: {
        bat: 3,
        tea_cookies: 2
      },
      doorsAfterAllBooks: true,
      doorsAfterTurns: 5,
      doorsCount: 2
    },

    lab: {
      id: 'lab',
      name: 'Лаборатория',
      width: 4, height: 4,
      playerStart: { x: 0, y: 3 },
      fixed: [
        { x: 3, y: 0, kind: 'door' },
        { x: 1, y: 1, kind: 'alchemist' },
        { x: 0, y: 2, kind: 'device', deviceType: 'flask' },
        { x: 0, y: 1, kind: 'device', deviceType: 'dephlegmator' },
        { x: 0, y: 0, kind: 'device', deviceType: 'distill_column' },
        { x: 1, y: 0, kind: 'device', deviceType: 'evaporator' },
        { x: 2, y: 0, kind: 'device', deviceType: 'filter_baskets' }
      ],
      spawnWeights: {
        drug: 5,
        empty: 2
      },
      // двери уже есть (fixed), новые не появляются
      noExtraDoors: true
    },

    cellar: {
      id: 'cellar',
      name: 'Винный погреб',
      width: 4, height: 4,
      playerStart: { x: 0, y: 3 },
      fixed: [],
      spawnWeights: {
        wine: 6,
        cellar_weapon: 4,
        drunkard: 1,
        sommelier: 1,
        winemaker: 1,
        tavernkeeper: 1
      },
      isFinal: true
    }
  },

  TORTURE_ITEMS: {
    whip:          { name: 'Плётка', kind: 'weapon', hp: 4
      , range: 'any', icon: '🪢',
                     desc: 'Атакует из любой части карты.' },
    glass:         { name: 'Стек', kind: 'weapon', hp: 3, range: 'melee', icon: '🍷',
                     desc: 'Обычное оружие ближнего боя.' },

    nipple_clamps: { name: 'Зажимы', kind: 'usable', icon: '🔧',
                     desc: 'Можно надеть на рядом стоящего врага. Он теряет 1 HP каждый ход.' },
    fur_handcuffs: { name: 'Наручники с мехом', kind: 'usable', icon: '⛓️',
                     desc: 'Любимое развлечение Графа. Можно надеть на рядом стоящего врага. Он не может двигаться 3 хода.' },
    lubricant:     { name: 'Съедобный лубрикант', kind: 'food', heal: 3, icon: '🧴',
                     desc: 'Восстанавлиет 3 HP.' },
    gag_lollipop:  { name: 'Кляп-леденец', kind: 'food', heal: 2, turnsToEat: 2, icon: '🍭',
                 desc: 'Восстанавливает 2 HP. Сосёшь 2 хода.' },
  },

  CELLAR_WEAPONS: {
    corkscrew:     { name: 'Штопор', kind: 'weapon', hp: 2, range: 'melee', icon: '🔩',
                     desc: 'Мало HP.' },
    frak: {
      name: 'Фрак',
      kind: 'usable',
      icon: '🥼',
      desc: 'Враги путают вас с дворецким и 3 хода ведут себя прилично (не атакуют, не пьют, не крадут).'
    },
    cooper_hammer: { name: 'Бондарный молоток', kind: 'weapon', hp: 4, range: 'melee', icon: '🔨',
                     desc: 'Обычное оружие.' },
    broken_glass:  { name: 'Битый бокал', kind: 'weapon', hp: 3, range: 'melee', icon: '🍷',
                     desc: 'Обычное оружие.' },
    barrel_key:    { name: 'Бочковый ключ', kind: 'weapon', hp: 3, range: 'melee', icon: '🗝️',
                     desc: 'Обычное оружие.' }
  },

  ENEMIES: {
    count:       { name: 'Граф', icon: '🧛', hpMin: 8, hpMax: 10, behavior: 'count',
                   desc: 'Атакует плёткой раз в 3 хода. Любит бывать в обеих ролях.' },
    lady:        { name: 'Госпожа', icon: '🧛‍♀️', hpMin: 6, hpMax: 8, behavior: 'lady',
                   desc: 'Подойдя вплотную, подчиняет (запрещает атаковать себя).' },
    submissive:  { name: 'Сабмиссив', icon: '🧎', hpMin: 4, hpMax: 5, behavior: 'submissive',
                   desc: 'Следует за Госпожой.' },
    latex_maid:  { name: 'Горничная', icon: '🧹', hpMin: 4, hpMax: 6, behavior: 'latex_maid',
                   desc: 'Просто смущается.' },
    drunkard:    { name: 'Пьяница', icon: '🍺', hpMin: 4, hpMax: 6, behavior: 'drunkard',
               desc: 'Напился и спит.' },
sommelier:   { name: 'Сомелье', icon: '🍾', hpMin: 5, hpMax: 7, behavior: 'sommelier',
               desc: 'Пьёт вино и лечится на 1 HP каждые 3 хода.' },
winemaker:   { name: 'Винодел', icon: '🧑‍🌾', hpMin: 10, hpMax: 14, behavior: 'winemaker',
               desc: 'Просто стоит.' },
tavernkeeper:{ name: 'Трактирщик', icon: '🍻', hpMin: 5, hpMax: 7, behavior: 'tavernkeeper',
               desc: 'Крадёт вино рядом каждые 3 хода.' }
  },

  DRUGS: {
    drug_cocaine:   { name: 'Порошок', icon: '❄️' },
    drug_heroin:    { name: 'Шприц', icon: '💉' },
    drug_weed:      { name: 'Косяк', icon: '🚬' },
    drug_ecstasy:   { name: 'Таблетка', icon: '💊' },
    drug_lsd:       { name: 'Марка', icon: '📄' },
    drug_snus:      { name: 'Шайба', icon: '⚪' },
    drug_mushrooms: { name: 'Грибы', icon: '🍄' }
  },

  DEVICES: {
    flask:          { name: 'Трёхгорлая колба', icon: '⚗️' },
    dephlegmator:   { name: 'Дефлегматор', icon: '🧪' },
    distill_column: { name: 'Дистилляционная колонна', icon: '🏗️' },
    evaporator:     { name: 'Испаритель', icon: '💨' },
    filter_baskets: { name: 'Фильтровальные корзины', icon: '🧺' }
  },

  BOOKS: {
    book_bite:        { name: 'Книга', popup: '«Как перестать кусаться и начать жить»' },
    book_50_red:      { name: 'Книга', popup: '«50 оттенков красного»' },
    book_succubus:    { name: 'Книга', popup: '«Как призвать суккуба. Для чайников.»' },
    book_klyki:       { name: 'Книга', popup: '«Властелин клыков»' },
    book_markrovita:  { name: 'Книга', popup: '«Мастер и Маркровита»' },
    book_three:       { name: 'Книга', popup: '«Три кровососа»' },
    book_krovoegin:   { name: 'Книга', popup: '«Евгений Кровегин»' },
    book_grimoire:    { name: 'Книга', popup: '«Гримуар травника»' },
    book_diary:       { name: 'Книга', popup: '«Дневник домохозяйки: уборка в гробу»' },
    book_moonshine:   { name: 'Книга', popup: '«Домашний самогон»' },
    book_victim_psych:{ name: 'Книга', popup: '«Психология жертвы»' }
  },

  TEA: { name: 'Чай с печеньками', icon: '🍵', heal: 5, popup: '«Не кроши на книги.»' },

  WINES: {
    wine_virgin:      { name: 'Кровь девственника', heal: 1,
                        popup: 'Урожай 1897 года. Девственник был молод, но уже не девственник.' },
    wine_virgin_fake: { name: 'Кровь девственницы', heal: 1,
                        popup: 'Cделано из клюквы. Граф не оценил.' },
    wine_sacrifice:   { name: 'Жертвенное вино', heal: 0, sacrifice: true,
                        popup: 'То самое вино...' }
  },

  TRAPS: {
    spikes:     { name: 'Шипы', icon: '🔺', hp: 3,
                  desc: 'Появляются из пола через ход.' },
    slick:      { name: 'Скользкая плитка', icon: '💧', hp: 0,
                  desc: 'Заставляет скользить на клетку вперёд в направлении движения.' },
    fireCannon: { name: 'Огненная пушка', icon: '🔥', hp: 1,
                  desc: 'Вращается каждый ход. Наносит урон в направлении дула.' }
  },

  TRAP_SPIKES_INTERVAL: 1,
  FIRE_CANNON_DAMAGE: 1,
  SPIKES_DAMAGE: 3,

  WEAPON_HP_CALIBRATION: {
    ENEMY_HP_DIVISOR: 20,
    MIN_ENEMY_FACTOR: 0.7,
    MAX_ENEMY_FACTOR: 3.0,
    RANDOM_MIN: 0.85,
    RANDOM_MAX: 1.15
  }
};

// ============================================
// ХЕЛПЕРЫ (ядро «Кладбища»)
// ============================================
function weightedRandom(weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  if (entries.length === 0) return null;
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

function randomHp(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getWeaponHp(def) {
  if (!def || !def.hp) return 1;
  const cal = CONFIG.WEAPON_HP_CALIBRATION;

  let totalEnemyHp = 0;
  if (typeof FIELD !== 'undefined') {
    for (let y = 0; y < FIELD_H; y++)
      for (let x = 0; x < FIELD_W; x++) {
        const e = FIELD[y][x].entity;
        if (e && e.kind === 'enemy') totalEnemyHp += e.hp;
      }
  }

  let enemyFactor = 1 + (totalEnemyHp / cal.ENEMY_HP_DIVISOR);
  enemyFactor = Math.max(cal.MIN_ENEMY_FACTOR, Math.min(cal.MAX_ENEMY_FACTOR, enemyFactor));
  const rf = cal.RANDOM_MIN + Math.random() * (cal.RANDOM_MAX - cal.RANDOM_MIN);
  return Math.max(1, Math.round(def.hp * enemyFactor * rf));
}

function getEnemyHp(type) {
  const cfg = CONFIG.ENEMIES[type];
  if (!cfg) return 1;
  return randomHp(cfg.hpMin, cfg.hpMax);
}

function getRoomConfig(roomId) {
  return CONFIG.ROOMS[roomId] || null;
}

function getRoomIndex(roomId) {
  return CONFIG.ROOM_ORDER.indexOf(roomId);
}

function getNextRoomId(roomId) {
  const idx = getRoomIndex(roomId);
  if (idx < 0 || idx >= CONFIG.ROOM_ORDER.length - 1) return null;
  return CONFIG.ROOM_ORDER[idx + 1];
}