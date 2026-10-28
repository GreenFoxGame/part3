// ============================================
// ХОД ПРЕДМЕТОВ И ЛОВУШЕК
// ============================================

function itemsTurn() {
  trapsTurn();
  if (player.busy && player.busy.type === 'eat') tickEating();
  if (typeof checkDoorsCondition === 'function') checkDoorsCondition();

  // Граф на поле + наручники в руках → предложение обмена
  if (player.hand && player.hand.itemType === 'fur_handcuffs') {
    for (let y = 0; y < FIELD_H; y++)
      for (let x = 0; x < FIELD_W; x++) {
        const e = FIELD[y][x].entity;
        if (!e || e.kind !== 'enemy' || e.type !== 'count') continue;
        if (e.roleSwapOffered) continue;
        if (e.roleSwapped) continue;

        e.roleSwapOffered = true;
        behaviorStats.torture.metCount = true;
        log('🧛 Граф замечает наручники: «Хочешь поменяться ролями?»');
        if (typeof showRoleSwapPopup === 'function') showRoleSwapPopup(e);
        return;
      }
  }
}

function trapsTurn() {
  for (let y = 0; y < FIELD_H; y++) {
    for (let x = 0; x < FIELD_W; x++) {
      const cell = FIELD[y][x];
      const e = cell.entity;
      if (!e || e.kind !== 'trap') continue;

      if (e.trapType === 'spikes') {
        e.timer = (e.timer || 0) + 1;
        if (e.timer >= CONFIG.TRAP_SPIKES_INTERVAL) {
          e.timer = 0;
          e.state = e.state === 'safe' ? 'deadly' : 'safe';
          log(`🔺 Шипы ${e.state === 'deadly' ? 'ВЗВЕЛИСЬ' : 'опустились'}`);
        }
        if (e.state === 'deadly' && player.x === x && player.y === y) {
          playerTakeDamage(CONFIG.SPIKES_DAMAGE);
          log(`🔺 Шипы ранят игрока! -${CONFIG.SPIKES_DAMAGE} HP`);
          animateHitById('player', 'player');
        }
      }

      if (e.trapType === 'fireCannon') {
        e.direction = (e.direction + 1) % 4;
        const fireCells = getFireCannonCells(x, y, e.direction);
        for (const fc of fireCells) {
          if (fc.x === player.x && fc.y === player.y) {
            playerTakeDamage(CONFIG.FIRE_CANNON_DAMAGE);
            log(`🔥 Огненная пушка обжигает игрока! -${CONFIG.FIRE_CANNON_DAMAGE} HP`);
            animateHitById('player', 'player');
            break;
          }
        }
      }
    }
  }
}

function getFireCannonCells(x, y, direction) {
  const cells = [];
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const [dx, dy] = dirs[direction];
  let cx = x + dx, cy = y + dy;
  while (cx >= 0 && cy >= 0 && cx < FIELD_W && cy < FIELD_H) {
    cells.push({ x: cx, y: cy });
    cx += dx; cy += dy;
  }
  return cells;
}

// ============================================
// ВЗАИМОДЕЙСТВИЕ С КЛЕТКОЙ
// Ловушки сюда не попадают — они обрабатываются в main.js (движение)
// ============================================
function interactWithCell(cell) {
  if (!cell || !cell.entity) return false;
  const e = cell.entity;

  // Ловушки — не «взаимодействие», пропускаем
  if (e.kind === 'trap') return false;

  const isAdj = (Math.abs(player.x - cell.x) + Math.abs(player.y - cell.y) === 1);

  if (e.kind === 'door') {
    log('🚪 Ты открываешь дверь...');
    goToNextRoom();
    return true;
  }

  if (e.kind === 'entrance') {
    if (!e.examined) e.examined = true;
    showTooltip('Входная дверь', '«Обратного пути нет.»');
    return false;
  }

  if (e.kind === 'butler') {
    if (!e.greeted) {
      e.greeted = true;
      showTooltip('Дворецкий', '«Добро пожаловать в особняк. Хозяин ждёт вас в погребе. Не задерживайтесь.»');
    } else showTooltip('Дворецкий', '«Что-то ещё?»');
    return false;
  }

  if (e.kind === 'librarian') {
    showTooltip('Библиотекарша', '«Тш-ш-ш. Или я превращу тебя в закладку!»');
    return false;
  }

  if (e.kind === 'alchemist') {
    showTooltip('Алхимик', 'Алхимик снаркоманился и не реагирует. Глаза стеклянные, на губах — пена.');
    return false;
  }

  if (e.kind === 'device') {
    showTooltip(e.def.name, 'Прибор для алхимии. Пока не используется.');
    return false;
  }

  if (e.kind === 'book') {
    if (!isAdj) return false;
    readBook(cell);
    return true;
  }

  if (e.kind === 'item' && e.itemType === 'tea_cookies') {
    if (!isAdj) return false;
    showTooltip('Чай с печеньками', CONFIG.TEA.popup + `<br>+${CONFIG.TEA.heal} HP`);
    playerHeal(CONFIG.TEA.heal);
    cell.entity = null; cell.type = 'empty';
    return true;
  }

  if (e.kind === 'drug') {
    if (!isAdj) return false;
    takeDrug(cell);
    return true;
  }

  if (e.kind === 'wine') {
    if (!isAdj) return false;
    drinkWine(cell);
    return true;
  }

  if (e.kind === 'bat') {
    if (!isAdj) return false;
    if (e.asleep) {
      showTooltip('Летучая мышь', 'Спит вверх ногами. Если потревожить — улетит и оставит пустую карту.');
      e.asleep = false;
      setTimeout(() => {
        if (cell.entity === e) { cell.entity = null; cell.type = 'empty'; render(); }
      }, 400);
    } else showTooltip('Летучая мышь', 'Уже просыпается...');
    return true;
  }

  if (e.kind === 'item') {
    if (!isAdj) return false;
    const def = e.def;
    const item = { id: e.id, itemType: e.itemType, def, hp: e.hp || def.hp || 1 };

    // Кляп-леденец — надевается на 1 ход, даёт +2 HP сразу
    if (e.itemType === 'gag_lollipop') {
      player.gagTurns = 2;
      playerHeal(def.heal || 0);
      log(`🍭 Кляп-леденец: +${def.heal || 0} HP. Через ход снимется.`);
      cell.entity = null; cell.type = 'empty';
      return true;
    }

    // Съедобный лубрикант — мгновенно +3 HP, не попадает в руку/инвентарь
    if (e.itemType === 'lubricant') {
      playerHeal(def.heal || 3);
      log(`🧴 Съедобный лубрикант: +${def.heal || 3} HP.`);
      cell.entity = null; cell.type = 'empty';
      return true;
    }

    if (def.kind === 'weapon' || def.kind === 'usable') {
      // Фрак надевается сразу
      if (e.itemType === 'frak') {
        applyFrak();
        cell.entity = null; cell.type = 'empty';
        return true;
      }
      playerPickupHand(item);
      cell.entity = null; cell.type = 'empty';
      return true;
    }

    if (def.kind === 'food') {
      addToInventory(item);
      cell.entity = null; cell.type = 'empty';
      return true;
    }

    return false;
  }

  return false;
}

// ============================================
// ЧТЕНИЕ КНИГИ
// ============================================
function readBook(cell) {
  const e = cell.entity;
  if (!e || e.kind !== 'book') return;

  showTooltip('Книга', e.def.popup);

  if (!behaviorStats.library.booksRead.includes(e.bookType)) {
    behaviorStats.library.booksRead.push(e.bookType);
    const total = Object.keys(CONFIG.BOOKS).length;
    log(`📖 Прочитано книг: ${behaviorStats.library.booksRead.length}/${total}`);
  }

  // Книга исчезает — клетка становится пустой
  cell.entity = null;
  cell.type = 'empty';
  render();
}

// ============================================
// НАРКОТИКИ
function takeDrug(cell) {
  const e = cell.entity;
  if (!e || e.kind !== 'drug') return;

  if (player.hp <= 1) {
    log(`💊 ${e.def.name}: HP уже 1 — наркотик не отнимает здоровье.`);
  } else {
    log(`💊 Попробовал ${e.def.name}: -1 HP`);
    playerTakeDamage(1);
  }

  if (!behaviorStats.lab.drugsTried.includes(e.drugType))
    behaviorStats.lab.drugsTried.push(e.drugType);

  cell.entity = null; cell.type = 'empty';

  render();
}

function applyDrugEffect(effect) {
  if (effect === 'vomit') {
    let target = null;

    // 1) Пробуем клетку, откуда пришёл игрок
    if (typeof lastPlayerFrom !== 'undefined' && lastPlayerFrom) {
      const cell = getCell(lastPlayerFrom.x, lastPlayerFrom.y);
      if (cell && !cell.entity && !isCellNearDoor(cell.x, cell.y)) {
        target = cell;
      }
    }

    // 2) Иначе — ближайшая пустая клетка, не соседняя с дверью
    if (!target) {
      target = findNearestEmptyCell(player.x, player.y, true);
    }

    // 3) Если вообще нет подходящей — ставим куда угодно (крайний случай)
    if (!target) {
      target = findNearestEmptyCell(player.x, player.y, false);
    }

    if (target) {
      target.entity = { id: newEntityId(), kind: 'vomit', essential: true };
      target.type = 'vomit';
    }

    log('🤢 Рвота! Появилась карточка рвоты.');
    showTooltip('Рвота', 'Фу. Лучше не наступать.');

  } else if (effect === 'hallucination') {
    hallucinationTurns = 2;
    log('🌀 Галлюцинации! Поле накрыло завесой на 1 ход.');
    showTooltip('Галлюцинации', 'Всё плывёт перед глазами. Поле накрыло завесой.');

  } else if (effect === 'panic') {
    panicTurns = 2;
    log('😱 Паническая атака! Дальние клетки накрыло завесой на 1 ход.');
    showTooltip('Паническая атака', 'Сердце колотится. Дальние клетки накрыло завесой.');
  }
}

function findNearestEmptyCell(px, py, avoidDoors = false) {
  let best = null, bestDist = Infinity;
  for (let y = 0; y < FIELD_H; y++)
    for (let x = 0; x < FIELD_W; x++) {
      if (player.x === x && player.y === y) continue;
      const c = FIELD[y][x];
      if (c.entity) continue;
      if (avoidDoors && isCellNearDoor(x, y)) continue;
      const d = Math.abs(px - x) + Math.abs(py - y);
      if (d < bestDist) { bestDist = d; best = c; }
    }
  return best;
}
function isCellNearDoor(x, y) {
  // Сама клетка — дверь
  const cell = getCell(x, y);
  if (cell && cell.entity && cell.entity.kind === 'door') return true;

  // Соседняя клетка с дверью (Манхэттен = 1)
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  for (const [dx, dy] of dirs) {
    const n = getCell(x + dx, y + dy);
    if (n && n.entity && n.entity.kind === 'door') return true;
  }
  return false;
}
// ============================================
// ВИНО
// ============================================
function drinkWine(cell) {
  const e = cell.entity;
  if (!e || e.kind !== 'wine') return;
  const def = e.def;

  if (currentRoomId !== 'cellar') {
    showTooltip(def.name, def.popup);
  }

  if (def.sacrifice) {
    addWine(1);
    log('🍷 Жертвенное вино! +1 к счётчику.');
  }
  else if (def.heal > 0) playerHeal(def.heal);

  cell.entity = null; cell.type = 'empty';
  render();
}

function pickupEntity(e) {}
