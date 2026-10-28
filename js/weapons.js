// ============================================
// АТАКА И ИСПОЛЬЗОВАНИЕ ОРУЖИЯ
// ============================================

function attackEnemy(enemy) {
  if (!enemy || enemy.kind !== 'enemy') return { killed: false, shouldMove: false };

  if (player.busy && player.busy.type === 'eat') {
    log('🍭 Сосёшь леденец — не можешь атаковать!');
    return { killed: false, shouldMove: false };
  }

  // Госпожа рядом — нельзя атаковать именно её
  if (enemy.type === 'lady') {
    let ladyCell = null;
    for (let y = 0; y < FIELD_H && !ladyCell; y++)
      for (let x = 0; x < FIELD_W; x++) {
        const e = FIELD[y][x].entity;
        if (e === enemy) { ladyCell = { x, y }; break; }
      }
    if (ladyCell && isAdjacentToPlayer(ladyCell.x, ladyCell.y)) {
      log('🧛‍♀️ Госпожа рядом — не можешь атаковать её!');
      return { killed: false, shouldMove: false };
    }
  }

  if (enemy.type === 'latex_maid') enemy.flustered = true;

  const hand = player.hand;

  if (hand && hand.def && hand.def.kind === 'usable') {
    return { killed: false, shouldMove: false };
  }

  if (!hand) {
    if (player.hp > enemy.hp) {
      log(`Игрок съедает врага (${enemy.hp} HP)`);
      playerHitX = player.x; playerHitY = player.y;
      playerTakeDamage(enemy.hp);
      killEnemy(enemy, false);
      return { killed: true, shouldMove: true };
    } else {
      log('Игрок слишком слаб — смерть!');
      playerHitX = player.x; playerHitY = player.y;
      player.hp = 0; playerWasHit = true; gameOver();
      return { killed: false, shouldMove: false };
    }
  }

  if (hand.def.range === 'any') return attackRanged(enemy, hand);
  return attackMelee(enemy, hand);
}

function attackMelee(enemy, weapon) {
  if (weapon.itemType === 'garlic') {
    log('🧄 Чеснок! Вампир морщится.');
    enemy.hp -= 1;
    player.hand = null;
    if (enemy.hp <= 0) { killEnemy(enemy, true); return { killed: true, shouldMove: false }; }
    return { killed: false, shouldMove: false };
  }

  const enemyHp = enemy.hp;
  const wHp = weapon.hp;

  if (wHp > enemyHp) {
    log(`${weapon.def.name} убивает врага (${enemyHp} HP)`);
    weapon.hp -= enemyHp;
    killEnemy(enemy, true);
    return { killed: true, shouldMove: false };
  } else if (wHp === enemyHp) {
    log(`${weapon.def.name} ломается, но враг убит!`);
    player.hand = null;
    killEnemy(enemy, true);
    return { killed: true, shouldMove: false };
  } else {
    log(`${weapon.def.name} ломается, враг теряет ${wHp} HP`);
    enemy.hp -= wHp;
    player.hand = null;
    return { killed: false, shouldMove: false };
  }
}

function attackRanged(enemy, weapon) {
  const enemyHp = enemy.hp;
  const wHp = weapon.hp;
  log(`🪢 Плётка бьёт ${CONFIG.ENEMIES[enemy.type].name} из любой точки!`);

  if (wHp > enemyHp) {
    weapon.hp -= enemyHp;
    killEnemy(enemy, true);
    log(`Плётка убивает врага (${enemyHp} HP). Осталось: ${weapon.hp}`);
    return { killed: true, shouldMove: false };
  } else if (wHp === enemyHp) {
    player.hand = null; killEnemy(enemy, true);
    log('Плётка порвалась, но враг убит!');
    return { killed: true, shouldMove: false };
  } else {
    enemy.hp -= wHp;
    player.hand = null;
    log(`Плётка порвалась, враг теряет ${wHp} HP (осталось ${enemy.hp})`);
    return { killed: false, shouldMove: false };
  }
}

// ============================================
// ИСПОЛЬЗОВАНИЕ ПРЕДМЕТА В РУКАХ
// Вызывается из main.js, если в руках usable и клик по врагу рядом
// ============================================
function useHandItem(targetCell) {
  const item = player.hand;
  if (!item || !item.def) return false;
  if (item.def.kind !== 'usable') return false;

  const def = item.def;

  if (item.itemType === 'nipple_clamps') {
    if (!targetCell || !targetCell.entity || targetCell.entity.kind !== 'enemy') {
      log('🔧 Зажимы нужно надеть на врага рядом.'); return false;
    }
    if (!isAdjacentToPlayer(targetCell.x, targetCell.y)) {
      log('🔧 Враг должен стоять рядом.'); return false;
    }
    const enemy = targetCell.entity;
    enemy.clamped = true;
    player.hand = null;
    behaviorStats.torture.dominated++;
    log(`🔧 Надел зажимы на ${CONFIG.ENEMIES[enemy.type].name}.`);
    return true;
  }

  if (item.itemType === 'fur_handcuffs') {
    if (!targetCell || !targetCell.entity || targetCell.entity.kind !== 'enemy') {
      log('⛓️ Наручники нужно надеть на врага рядом.'); return false;
    }
    if (!isAdjacentToPlayer(targetCell.x, targetCell.y)) {
      log('⛓️ Враг должен стоять рядом.'); return false;
    }
    const enemy = targetCell.entity;

    if (enemy.type === 'count' && !enemy.roleSwapped) {
      log('🧛 Граф ухмыляется: «Поменяемся ролями?»');
      if (typeof showRoleSwapPopup === 'function') showRoleSwapPopup(enemy);
      return true;
    }

    enemy.immobilized = 3;
    player.hand = null;
    behaviorStats.torture.dominated++;
    log(`⛓️ Надел наручники на ${CONFIG.ENEMIES[enemy.type].name}. Не может двигаться 3 хода.`);
    return true;
  }

  if (item.itemType === 'maid_costume') {
    applyMaidCostume();
    player.hand = null;
    return true;
  }

  if (item.itemType === 'frak') {
    applyFrak();
    player.hand = null;
    return true;
  }

  log(`Не знаю, как использовать ${def.name}`);
  return false;
}