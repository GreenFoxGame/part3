function enemiesTurn() {
  const enemies = [];
  for (let y = 0; y < FIELD_H; y++)
    for (let x = 0; x < FIELD_W; x++) {
      const e = FIELD[y][x].entity;
      if (e && e.kind === 'enemy' && e.hp > 0) enemies.push({ cell: FIELD[y][x], e });
    }

  for (const { cell, e } of enemies) {
    if (!cell.entity || cell.entity !== e) continue;
    if (e.hp <= 0) continue;

    // Зажимы
    if (e.clamped && e.hp > 1) {
      e.hp -= 1;
      log(`🔧 ${CONFIG.ENEMIES[e.type].name} теряет 1 HP от зажимов (${e.hp})`);
      animateHitById(e.id, 'enemy');
      if (e.hp <= 1) { log('🔧 Зажимы больше не действуют.'); e.clamped = false; }
    }

    // Наручники
    if (e.immobilized && e.immobilized > 0) {
      e.immobilized--;
      log(`⛓️ ${CONFIG.ENEMIES[e.type].name} не может двигаться (${e.immobilized})`);
      continue;
    }

    // Фартук
    if (player.apronTurns > 0) {
      if (isAdjacentToPlayer(cell.x, cell.y)) {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        const swaps = [];
        for (const [dx, dy] of dirs) {
          const n = getCell(cell.x + dx, cell.y + dy);
          if (!n || (n.x === player.x && n.y === player.y)) continue;
          if (n.entity && (n.entity.kind === 'door' || n.entity.essential)) continue;
          if (n.entity && n.entity.kind === 'enemy') continue;
          swaps.push(n);
        }
        if (swaps.length > 0) {
          const target = swaps[Math.floor(Math.random() * swaps.length)];
          const tmp = target.entity;
          target.entity = cell.entity;
          target.type = cell.type;
          cell.entity = tmp;
          cell.type = tmp ? tmp.kind : 'empty';
          log(`🥼 ${CONFIG.ENEMIES[e.type].name} уступает дорогу контролирующему.`);
          continue;
        }
      }
      if (e.type === 'sommelier' || e.type === 'tavernkeeper') {
        log(`🥼 ${CONFIG.ENEMIES[e.type].name} стесняется при контролирующем.`);
        continue;
      }
      continue;
    }

    switch (e.behavior) {
      case 'count':         countTurn(cell, e); break;
      case 'count_chaser':  countChaserTurn(cell, e); break;
      case 'lady':          ladyTurn(cell, e); break;
      case 'submissive':    submissiveTurn(cell, e); break;
      case 'latex_maid':    latexMaidTurn(cell, e); break;
      case 'drunkard':      drunkardTurn(cell, e); break;
      case 'sommelier':     sommelierTurn(cell, e); break;
      case 'winemaker':     winemakerTurn(cell, e); break;
      case 'tavernkeeper':  tavernkeeperTurn(cell, e); break;
      default: break;
    }

    if (gameState !== 'playing') return;
  }
}


function countTurn(cell, e) {
  if (player.invisible) return;

  if (e.cooldown === undefined) e.cooldown = 0;
  if (e.cooldown > 0) {
    e.cooldown--;
    log(`🧛 Граф готовит плётку (${e.cooldown})`);
    return;
  }

  if (player.hp <= 1) { log('🧛 Граф не атакует — у игрока 1 HP.'); return; }

  playerTakeDamage(1);
  log('🧛 Граф бьёт плёткой: -1 HP');
  animateHitById('player', 'player');
  e.cooldown = 2;
}

function countChaserTurn(cell, e) {
  if (player.invisible) return;
  if (isAdjacentToPlayer(cell.x, cell.y)) {
    log('🧛 Граф (в наручниках) стоит рядом, но не атакует.');
    return;
  }
  // Граф-в-наручниках тоже расталкивает врагов
  stepTowards(cell, e, player.x, player.y, true);
}

function acceptRoleSwap(countEnemy) {
  if (!countEnemy || !player.hand || player.hand.itemType !== 'fur_handcuffs') return false;
  if (countEnemy.roleSwapped) return false;

  // Наручники уходят Графу
  player.hand = null;

  const whipDef = CONFIG.TORTURE_ITEMS.whip;
  const whipItem = { id: newEntityId(), itemType: 'whip', def: whipDef, hp: getWeaponHp(whipDef) };
  playerPickupHand(whipItem);

  countEnemy.roleSwapped = true;
  countEnemy.offerRoleSwap = false;
  countEnemy.behavior = 'count_chaser';

  log('🧛 Граф надел наручники и теперь преследует, но не атакует.');
  behaviorStats.torture.dominated++;
  return true;
}

function ladyTurn(cell, e) {
  if (player.invisible) return;

  // Уже рядом с игроком — «подавляет», ходить не нужно
  if (isAdjacentToPlayer(cell.x, cell.y)) {
    e.subduing = true;
    if (!player.submitted) {
      behaviorStats.torture.submitted++;
      log('🧛‍♀️ Госпожа рядом — ты не можешь атаковать её.');
    }
    player.submitted = true;
    return;
  }

  e.subduing = false;

  // Кулдаун: Госпожа приближается раз в 2 хода
  if (e.moveCooldown === undefined) e.moveCooldown = 0;
  if (e.moveCooldown > 0) {
    e.moveCooldown--;
    log(`🧛‍♀️ Госпожа медлит (${e.moveCooldown})`);
    return;
  }

  // Куда хотим шагнуть
  const dx = player.x - cell.x;
  const dy = player.y - cell.y;
  let stepX = 0, stepY = 0;
  if (Math.abs(dx) >= Math.abs(dy)) stepX = Math.sign(dx);
  else stepY = Math.sign(dy);

  const nx = cell.x + stepX;
  const ny = cell.y + stepY;
  const target = getCell(nx, ny);

  // Госпожа ↔ Госпожа: не меняемся местами, чтобы не крутились
  if (target && target.entity && target.entity.kind === 'enemy'
      && target.entity.type === 'lady') {
    log('🧛‍♀️ Госпожа не подходит — рядом другая Госпожа.');
    return;
  }

  // Проверяем: не станет ли она рядом с другой Госпожой (Чебышёв ≤ 1)
  let blocked = false;
  for (let y2 = 0; y2 < FIELD_H; y2++)
    for (let x2 = 0; x2 < FIELD_W; x2++) {
      const other = FIELD[y2][x2].entity;
      if (!other || other === e) continue;
      if (other.kind !== 'enemy' || other.type !== 'lady') continue;
      if (Math.abs(nx - x2) <= 1 && Math.abs(ny - y2) <= 1) {
        blocked = true;
      }
    }

  if (blocked) {
    log('🧛‍♀️ Госпожа не подходит — рядом другая Госпожа.');
    return;
  }

  // ВАРИАНТ B: не вставать вплотную, если это создаст окружение игроку
  if (wouldTrapPlayerAfterLadyStep(cell, e, nx, ny)) {
    log('🧛‍♀️ Госпожа не подходит — не хочет загонять тебя в угол.');
    return;
  }

  // Госпожа может расталкивать врагов
  const moved = stepTowards(cell, e, player.x, player.y, true);
  if (moved) {
    // Успешный шаг → пропустит следующий ход (итого шаг раз в 2 хода)
    e.moveCooldown = 1;
  } else {
    // Не смогла шагнуть — кулдаун не ставим, попробует снова в следующий ход
    log('🧛‍♀️ Госпожа не может подойти.');
  }
}

function submissiveTurn(cell, e) {
  if (player.invisible) return;

  // Ищем Госпожу на поле
  let lady = null;
  for (let y = 0; y < FIELD_H && !lady; y++)
    for (let x = 0; x < FIELD_W; x++) {
      const en = FIELD[y][x].entity;
      if (en && en.kind === 'enemy' && en.type === 'lady' && en.hp > 0) { lady = { x, y }; break; }
    }

  // Госпожи нет — просто стоит
  if (!lady) return;

  // Уже рядом с Госпожой — стоит
  const dist = Math.abs(cell.x - lady.x) + Math.abs(cell.y - lady.y);
  if (dist <= 1) return;

  // Идём к Госпоже (без расталкивания врагов — только по пустым)
  stepTowards(cell, e, lady.x, lady.y);
}

function latexMaidTurn(cell, e) { /* ничего не делает */ }

function drunkardTurn(cell, e) {
  if (player.invisible) return;
}

function sommelierTurn(cell, e) {
  if (player.invisible) return;

  if (e.drinkCooldown === undefined) e.drinkCooldown = 0;

  if (e.drinkCooldown > 0) {
    e.drinkCooldown--;
    log(`🍾 Сомелье готовится пить (${e.drinkCooldown})`);
    return;
  }

  // Ищем вино рядом
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  for (const [dx, dy] of dirs) {
    const n = getCell(cell.x + dx, cell.y + dy);
    if (!n || !n.entity) continue;
    if (n.entity.kind === 'wine') {
      log(`🍾 Сомелье пьёт из бокала ${n.entity.def.name} и лечится! Вино остаётся.`);
      e.hp = Math.min(e.maxHp, e.hp + 1);
      e.drinkCooldown = 3;
      animateHitById(e.id, 'enemy');
      return;
    }
  }

  log('🍾 Сомелье ждёт вина.');
}

function winemakerTurn(cell, e) {
  if (player.invisible) return;
}

function tavernkeeperTurn(cell, e) {
  if (player.invisible) return;

  if (e.stealCooldown === undefined) e.stealCooldown = 0;

  if (e.stealCooldown > 0) {
    e.stealCooldown--;
    log(`🍻 Трактирщик готовится красть (${e.stealCooldown})`);
    return;
  }

  // Ищем вино рядом
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  for (const [dx, dy] of dirs) {
    const n = getCell(cell.x + dx, cell.y + dy);
    if (!n || !n.entity) continue;
    if (n.entity.kind === 'wine') {
      log(`🍻 Трактирщик крадёт ${n.entity.def.name}!`);
      n.entity = null;
      n.type = 'empty';
      e.stealCooldown = 3;
      return;
    }
  }

  // Не смог — счётчик стопается (cooldown остаётся 0), ждёт
  log('🍻 Трактирщик ищет вино рядом.');
}

function isAdjacentToPlayer(x, y) {
  return (Math.abs(player.x - x) + Math.abs(player.y - y) === 1);
}

function stepTowardsPlayer(cell, e) { stepTowards(cell, e, player.x, player.y); }

/**
 * Шаг к цели.
 * @param canSwapWithEnemies — если true, враг на целевой клетке не блокирует
 *        шаг, а происходит обмен местами (кроме дверей и essential).
 *        Госпожа и Граф-в-наручниках передают true.
 */
function stepTowards(cell, e, tx, ty, canSwapWithEnemies = false) {
  const dx = tx - cell.x;
  const dy = ty - cell.y;
  if (dx === 0 && dy === 0) return false;

  let stepX = 0, stepY = 0;
  if (Math.abs(dx) >= Math.abs(dy)) stepX = Math.sign(dx);
  else stepY = Math.sign(dy);

  const nx = cell.x + stepX;
  const ny = cell.y + stepY;
  const target = getCell(nx, ny);
  if (!target) return false;
  if (nx === player.x && ny === player.y) return false;

  // Двери и essential — не трогаем никогда
  if (target.entity) {
    if (target.entity.kind === 'door') return false;
    if (target.entity.essential) return false;
    if (target.entity.kind === 'enemy') {
      // Враг на пути
      if (!canSwapWithEnemies) return false;
      // Не расталкиваем другую Госпожу (чтобы две Госпожи не крутились)
      if (target.entity.type === 'lady' && e.type === 'lady') return false;
      // Не расталкиваем врага, который тоже Госпожа (общий случай)
      if (target.entity.type === 'lady' && target.entity !== e) return false;
    }
  }

  // Меняемся местами с картой (или идём на пустую)
  const tmp = target.entity;
  target.entity = cell.entity;
  target.type = cell.type;
  cell.entity = tmp;
  cell.type = tmp ? tmp.kind : 'empty';
  return true;
}

function killEnemy(enemy, killedByWeapon) {
  for (let y = 0; y < FIELD_H; y++)
    for (let x = 0; x < FIELD_W; x++) {
      if (FIELD[y][x].entity !== enemy) continue;
      const cell = FIELD[y][x];
      cell.entity = null; cell.type = 'empty';
      return;
    }
}

function enemiesMakeWay() {
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const enemies = [];
  for (let y = 0; y < FIELD_H; y++)
    for (let x = 0; x < FIELD_W; x++) {
      const e = FIELD[y][x].entity;
      if (e && e.kind === 'enemy') enemies.push({ cell: FIELD[y][x], e });
    }

  for (const { cell, e } of enemies) {
    if (!isAdjacentToPlayer(cell.x, cell.y)) continue;

    // Ищем клетку для обмена
    const swaps = [];
    for (const [dx, dy] of dirs) {
      const n = getCell(cell.x + dx, cell.y + dy);
      if (!n) continue;
      if (n.x === player.x && n.y === player.y) continue;
      if (n.entity && (n.entity.kind === 'door' || n.entity.essential)) continue;
      if (n.entity && n.entity.kind === 'enemy') continue;
      swaps.push(n);
    }
    if (swaps.length === 0) continue;

    const target = swaps[Math.floor(Math.random() * swaps.length)];
    const tmp = target.entity;
    target.entity = cell.entity;
    target.type = cell.type;
    cell.entity = tmp;
    cell.type = tmp ? tmp.kind : 'empty';

    log(`🥼 ${CONFIG.ENEMIES[e.type].name} расступается перед контролирующим.`);
  }

  if (typeof render === 'function') render();
}

// ============================================
// ПРОВЕРКА ОКРУЖЕНИЯ ИГРОКА (Вариант B)
// ============================================

/**
 * Свободна ли клетка для шага игрока:
 * нет сущности, либо это проходимая сущность (не дверь, не essential, не враг).
 */
function isCellPassableForPlayer(x, y) {
  const cell = getCell(x, y);
  if (!cell) return false;
  const e = cell.entity;
  if (!e) return true;
  if (e.kind === 'door') return false;
  if (e.essential) return false;
  if (e.kind === 'enemy') return false;
  return true;
}

/**
 * Есть ли у игрока хоть один проходимый сосед (Манхэттен = 1).
 * Использует ТЕКУЩЕЕ состояние поля.
 */
function playerHasFreeNeighbor() {
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  for (const [dx, dy] of dirs) {
    if (isCellPassableForPlayer(player.x + dx, player.y + dy)) return true;
  }
  return false;
}

/**
 * Симулирует: если сущность `mover` шагнёт из (fromX,fromY) в (toX,toY)
 * (обмен местами с тем, что там стоит), останется ли у игрока
 * хоть один проходимый сосед.
 *
 * Не меняет FIELD — только читает.
 */
function playerHasFreeNeighborAfterMove(fromX, fromY, toX, toY) {
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  // Что стоит в целевой и исходной клетках СЕЙЧАС
  const targetCell = getCell(toX, toY);
  const targetEntity = targetCell ? targetCell.entity : null;
  const sourceCell = getCell(fromX, fromY);
  const sourceEntity = sourceCell ? sourceCell.entity : null;

  // Симулируем обмен: mover уходит из source в target,
  // а targetEntity (если был) — на место mover.
  // ВАЖНО: игрок не может быть в target (это проверяется в stepTowards),
  // поэтому targetEntity — не игрок.

  for (const [dx, dy] of dirs) {
    const nx = player.x + dx;
    const ny = player.y + dy;
    const n = getCell(nx, ny);
    if (!n) continue;

    // Что окажется в клетке (nx, ny) после симулированного обмена?
    let occupant = n.entity;

    if (nx === fromX && ny === fromY) {
      // Исходная клетка mover'а — туда встанет targetEntity (или пусто)
      occupant = targetEntity;
    } else if (nx === toX && ny === toY) {
      // Целевая клетка — туда встанет mover
      occupant = sourceEntity;
    }

    // Проверяем проходимость для игрока
    if (!occupant) return true;
    if (occupant.kind === 'door') continue;
    if (occupant.essential) continue;
    if (occupant.kind === 'enemy') continue;
    return true;
  }

  return false;
}

/**
 * Шаг Госпожи (fromX,fromY) → (toX,toY) создаст окружение игроку?
 *
 * Окружение = после шага у игрока НЕТ ни одного проходимого соседа.
 * Проверяем только если шаг вообще приближает Госпожу к игроку
 * и окажется вплотную (иначе она не «зажимает»).
 */
function wouldTrapPlayerAfterLadyStep(cell, e, toX, toY) {
  // Шаг не вплотную к игроку — окружения не создаёт этим шагом.
  const adjacentAfter = (Math.abs(toX - player.x) + Math.abs(toY - player.y) === 1);
  if (!adjacentAfter) return false;

  // Если игрок и так уже в окружении — не усугубляем, пусть идёт
  // (иначе Госпожа вообще никогда не подойдёт).
  if (!playerHasFreeNeighbor()) return false;

  // Симулируем шаг и смотрим, останется ли у игрока выход
  return !playerHasFreeNeighborAfterMove(cell.x, cell.y, toX, toY);
}