// ============================================
// ГЛАВНЫЙ ФАЙЛ (Особняк вампиров)
// ============================================

let gameState = 'start';
let playerId = "-";

let pressTimer = null;
let isLongPress = false;
let lastClickTime = 0;

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxk6ZG05as22TzdnUhubtLLnTxVJ8EGsJepQE3bh8Ka43C6Ef9tj-zRuxKCJ79ZKzKi/exec';

let stats = {};

function loadStats() {
  try {
    const saved = localStorage.getItem('manor_player_stats');
    stats = saved ? JSON.parse(saved) : {};
  } catch (e) { stats = {}; }
}

function saveStats() {
  try { localStorage.setItem('manor_player_stats', JSON.stringify(stats)); } catch (e) {}
}

function getPlayerRecord(id) {
  if (!stats[id]) stats[id] = { games: 0, maxWine: 0, maxRooms: 0 };
  return stats[id];
}

function updateStats(id, wine, rooms) {
  const rec = getPlayerRecord(id);
  rec.games += 1;
  if (wine > rec.maxWine) rec.maxWine = wine;
  if (rooms > rec.maxRooms) rec.maxRooms = rooms;
  saveStats();
  return rec;
}

loadStats();

// ============================================
// ПОПАП
// ============================================
function showTooltip(title, desc) {
  const tt = document.getElementById('tooltip');
  if (!tt) return;
  document.getElementById('tt-title').textContent = title;
  document.getElementById('tt-desc').innerHTML = desc;
  tt.classList.add('active');
}

function hideTooltip() {
  const tt = document.getElementById('tooltip');
  if (tt) tt.classList.remove('active');
  isLongPress = false;
}

document.getElementById('tt-close-btn').onclick = (e) => {
  e.stopPropagation();
  hideTooltip();
};

// ============================================
// ПОПАП ОБМЕНА РОЛЯМИ
// ============================================
function showRoleSwapPopup(countEnemy) {
  const tt = document.getElementById('tooltip');
  if (!tt) return;

  document.getElementById('tt-title').textContent = 'Граф';
  document.getElementById('tt-desc').innerHTML =
    '«Хочешь поменяться ролями?»';

  const closeBtn = document.getElementById('tt-close-btn');

  // Убираем старую кнопку отказа, если она осталась от прошлого показа
  const oldDecline = document.getElementById('tt-decline-btn');
  if (oldDecline) oldDecline.remove();

  // Кнопка «Принять»
  closeBtn.textContent = 'Принять';
  closeBtn.onclick = (ev) => {
    ev.stopPropagation();
    acceptRoleSwap(countEnemy);
    cleanupRoleSwapButtons();
    hideTooltip();
    render();
  };

  // Кнопка «Отказаться» — создаём и вставляем рядом с closeBtn
  const declineBtn = document.createElement('button');
  declineBtn.id = 'tt-decline-btn';
  declineBtn.textContent = 'Отказаться';
  // Копируем классы у closeBtn, чтобы стиль совпал
  declineBtn.className = closeBtn.className;
  declineBtn.style.marginTop = '8px';
  declineBtn.onclick = (ev) => {
    ev.stopPropagation();
    log('🧛 Граф усмехается: «Как хочешь.»');
    // Помечаем, что предложение обработано — больше не показываем
    if (countEnemy) {
      countEnemy.roleSwapOffered = true;
      countEnemy.roleSwapDeclined = true;
    }
    cleanupRoleSwapButtons();
    hideTooltip();
    render();
  };

  // Убираем абсолютное позиционирование у обеих кнопок
  closeBtn.style.position = 'static';
  closeBtn.style.transform = 'none';
  declineBtn.style.position = 'static';
  declineBtn.style.transform = 'none';
  declineBtn.style.marginTop = '0';

  // Контейнер для кнопок
  let btnRow = document.getElementById('tt-btn-row');
  if (!btnRow) {
    btnRow = document.createElement('div');
    btnRow.id = 'tt-btn-row';
    btnRow.className = 'tt-buttons';
    closeBtn.parentNode.insertBefore(btnRow, closeBtn);
    btnRow.appendChild(closeBtn);
  }
  btnRow.appendChild(declineBtn);
  tt.classList.add('active');
}

function cleanupRoleSwapButtons() {
  const closeBtn = document.getElementById('tt-close-btn');
  const declineBtn = document.getElementById('tt-decline-btn');
  const btnRow = document.getElementById('tt-btn-row');

  if (declineBtn) declineBtn.remove();

  if (closeBtn) {
    // Вернуть абсолютное позиционирование
    closeBtn.style.position = '';
    closeBtn.style.transform = '';
    closeBtn.style.marginTop = '';
    closeBtn.textContent = 'ОК';
    closeBtn.onclick = (e) => { e.stopPropagation(); hideTooltip(); };
  }

  // Убрать контейнер, если он остался
  if (btnRow && btnRow.parentNode) {
    // Вернуть closeBtn обратно в #tooltip (перед btnRow)
    btnRow.parentNode.insertBefore(closeBtn, btnRow);
    btnRow.remove();
  }
}
// ============================================
// СТАРТ
// ============================================
document.getElementById('start-btn').addEventListener('click', () => {
  const input = document.getElementById('player-id-input');
  const val = input.value.trim();
  if (!val) { alert('Введите номер!'); return; }
  playerId = val;
  document.getElementById('start-modal').classList.remove('active');
  gameState = 'playing';
  startGame(false);
});

// ============================================
// ПОРАЖЕНИЕ
// ============================================
function gameOver() {
  if (typeof window.showGameOver === 'function') {
    window.showGameOver();
  } else {
    console.error('showGameOver ещё не загружен');
  }
}

window.showGameOver = function() {
  gameState = 'gameover';
  if (typeof onPlayerDeath === 'function') onPlayerDeath();

  const rec = updateStats(playerId, player.wineCount, behaviorStats.roomsPassed || 0);

  document.getElementById('final-player-id').textContent = playerId;
  document.getElementById('final-score').textContent = player.wineCount;
  document.getElementById('final-rooms').textContent = behaviorStats.roomsPassed || 0;
  document.getElementById('final-max-score').textContent = rec.maxWine;
  document.getElementById('final-games').textContent = rec.games;

  const btnContinue = document.getElementById('continue-btn');
  if (btnContinue) btnContinue.style.display = hasCheckpoint() ? '' : 'none';

    document.getElementById('gameover-modal').classList.add('active');

  console.log('🏁 gameOver вызван, отправляем статистику...');
  sendToGoogleSheets();
};

document.getElementById('continue-btn')?.addEventListener('click', () => {
  document.getElementById('gameover-modal').classList.remove('active');
  gameState = 'playing';
  startGame(true);
});

document.getElementById('restart-btn').addEventListener('click', () => {
  clearCheckpoint();
  document.getElementById('gameover-modal').classList.remove('active');
  document.getElementById('start-modal').classList.add('active');
  document.getElementById('player-id-input').value = playerId;
  gameState = 'start';
});

// ============================================
// ЗАПУСК
// ============================================
function startGame(continueFromCheckpoint) {
  document.getElementById('log').innerHTML = '';
  let startRoom = 'hall';

  if (continueFromCheckpoint) {
    const roomId = loadCheckpoint();
    if (roomId) { startRoom = roomId; log(`💾 Загружен чекпоинт: ${getRoomConfig(roomId).name}`); }
    else { log('⚠️ Чекпоинт не найден — с холла.'); initPlayer(); }
  } else initPlayer();

  initField(startRoom);
  markRoomOpened(playerId, startRoom);

  const room = getRoomConfig(startRoom);
  if (room && room.playerStart) {
    player.x = room.playerStart.x;
    player.y = room.playerStart.y;
  }

  prefillRoom(startRoom);

  if (!continueFromCheckpoint) saveCheckpoint(startRoom);

  fieldInitialized = false;
  initFieldDOM();
  render();

  log(`🏰 Добро пожаловать в особняк. Локация: ${room.name}`);
}

// ============================================
// КЛИК ПО КЛЕТКЕ
// ============================================
function onCellClick(x, y) {
  if (gameState !== 'playing') return;
  if (x < 0 || y < 0 || x >= FIELD_W || y >= FIELD_H) return;

  const cell = getCell(x, y);
  if (!cell) return;
  if (x === player.x && y === player.y) return;

  if (player.busy && player.busy.type === 'eat') { log('🍭 Сосёшь леденец — подожди.'); return; }
  if (player.frozen > 0) { log('⛓️ Скован — не можешь двигаться.'); return; }

  const dx = x - player.x;
  const dy = y - player.y;
  const isAdj = (Math.abs(dx) + Math.abs(dy) === 1);
  const target = cell.entity;

  // Дверь — только если рядом
  if (target && target.kind === 'door') {
    if (!isAdj) return;
    goToNextRoom();
    return;
  }

  // Дальний бой (плётка)
  if (player.hand && player.hand.def && player.hand.def.range === 'any'
      && target && target.kind === 'enemy') {
    const enemyId = target.id;
    attackEnemy(target);
    animateHitById(enemyId, 'enemy');
    if (gameState !== 'playing') return;
    render();
    setTimeout(() => { if (gameState === 'playing') endPlayerTurn(); }, 350);
    return;
  }

  // Взаимодействие с НЕ-врагами и НЕ-ловушками
  if (target && target.kind !== 'enemy' && target.kind !== 'trap') {
    if (!isAdj) return;

    lastPlayerFrom = { x: player.x, y: player.y };

    const wasItem = (target.kind === 'item' || target.kind === 'book' ||
                     target.kind === 'drug' || target.kind === 'wine' ||
                     target.kind === 'bat');

    const spent = interactWithCell(cell);
    if (spent) {
      if (wasItem) {
        const oldX = player.x, oldY = player.y;
        const direction = dx === -1 ? 'left' : dx === 1 ? 'right' : dy === -1 ? 'up' : 'down';
        shiftLine(direction, oldX, oldY);
        player.x = x;
        player.y = y;
        countCardStep();
      }
      render();
      if (gameState !== 'playing') return;
      setTimeout(() => { if (gameState === 'playing') endPlayerTurn(); }, 350);
    } else {
      render();
    }
    return;
  }

  // Ближний бой — по врагу рядом
  if (target && target.kind === 'enemy' && isAdj) {
    const enemyId = target.id;

    if (player.hand && player.hand.def && player.hand.def.kind === 'usable') {
      const used = useHandItem(cell);
      if (used) {
        render();
        if (gameState !== 'playing') return;
        setTimeout(() => { if (gameState === 'playing') endPlayerTurn(); }, 350);
        return;
      }
    }

    const result = attackEnemy(target);
    animateHitById(enemyId, 'enemy');
    if (result.shouldMove) {
      const oldX = player.x, oldY = player.y;
      const direction = dx === -1 ? 'left' : dx === 1 ? 'right' : dy === -1 ? 'up' : 'down';
      shiftLine(direction, oldX, oldY);
      player.x = x;
      player.y = y;
      countCardStep();
    }
    if (gameState !== 'playing') return;
    render();
    setTimeout(() => { if (gameState === 'playing') endPlayerTurn(); }, 350);
    return;
  }

  // Движение
  if (!isAdj) return;

  const trapAtTarget = (target && target.kind === 'trap') ? target : null;

  if (trapAtTarget && trapAtTarget.trapType === 'spikes' && trapAtTarget.state === 'deadly') {
    playerTakeDamage(CONFIG.SPIKES_DAMAGE);
    log(`🔺 Наступил на шипы! -${CONFIG.SPIKES_DAMAGE} HP`);
    if (gameState !== 'playing') return;
  }

  let cannonHits = false;
  if (trapAtTarget && trapAtTarget.trapType === 'fireCannon') {
    const fireCells = getFireCannonCells(x, y, trapAtTarget.direction);
    cannonHits = fireCells.some(fc => fc.x === player.x && fc.y === player.y);
  }

  if (trapAtTarget && trapAtTarget.trapType !== 'slick') {
    cell.entity = null;
    cell.type = 'empty';
  }

  const oldX = player.x;
  const oldY = player.y;
  const direction = dx === -1 ? 'left' : dx === 1 ? 'right' : dy === -1 ? 'up' : 'down';

  shiftLine(direction, oldX, oldY);

  player.x = x;
  player.y = y;
  countCardStep();

  if (trapAtTarget && trapAtTarget.trapType === 'fireCannon' && cannonHits) {
    playerTakeDamage(CONFIG.FIRE_CANNON_DAMAGE);
    log(`🔥 Пушка выстрелила в упор! -${CONFIG.FIRE_CANNON_DAMAGE} HP`);
    if (gameState !== 'playing') return;
  }

  // Скользкая плитка: сдвиг ещё на 1 клетку (в том же ходу)
  if (trapAtTarget && trapAtTarget.trapType === 'slick') {
    const sdx = Math.sign(dx);
    const sdy = Math.sign(dy);
    const sx = player.x + sdx;
    const sy = player.y + sdy;
    const sCell = getCell(sx, sy);
    if (sCell && !(sCell.entity && (sCell.entity.kind === 'enemy' || sCell.entity.kind === 'door'))) {
      const fromSlickX = player.x;
      const fromSlickY = player.y;
      player.x = sx;
      player.y = sy;
      countCardStep();
      log('💧 Скользкая плитка — проехал ещё на 1 клетку!');

      if (sCell.entity && sCell.entity.kind === 'trap') {
        const t2 = sCell.entity;
        if (t2.trapType === 'spikes') {
          if (t2.state === 'deadly') {
            playerTakeDamage(CONFIG.SPIKES_DAMAGE);
            log(`🔺 Наехал на шипы! -${CONFIG.SPIKES_DAMAGE} HP`);
          }
          sCell.entity = null;
          sCell.type = 'empty';
        } else if (t2.trapType === 'fireCannon') {
          const fc = getFireCannonCells(sx, sy, t2.direction);
          if (fc.some(c => c.x === fromSlickX && c.y === fromSlickY)) {
            playerTakeDamage(CONFIG.FIRE_CANNON_DAMAGE);
            log(`🔥 Пушка выстрелила в упор! -${CONFIG.FIRE_CANNON_DAMAGE} HP`);
          }
          sCell.entity = null;
          sCell.type = 'empty';
        }
      }
    }
  }

  render();
  if (gameState !== 'playing') return;
  setTimeout(() => { if (gameState === 'playing') endPlayerTurn(); }, 350);
}

// ============================================
// ДОЛГОЕ НАЖАТИЕ + КОРОТКИЙ КЛИК
// ============================================
function attachLongPressHandlers() {
  const slots = document.querySelectorAll('.click-slot');
  slots.forEach((slot, index) => {
    if (slot.dataset.lpAttached === '1') return;
    slot.dataset.lpAttached = '1';

    const x = index % FIELD_W;
    const y = Math.floor(index / FIELD_W);

    let localTimer = null;
    let localLongPress = false;

    const onStart = (e) => {
      if (gameState !== 'playing') return;
      const tt = document.getElementById('tooltip');
      if (tt.classList.contains('active')) return;

      // Не даём браузеру эмулировать mouseup после touchend
      if (e.type === 'touchstart') {
        try { e.preventDefault(); } catch (err) {}
      }

      localLongPress = false;
      localTimer = setTimeout(() => {
        localLongPress = true;
        buildAndShowTooltip(x, y);
      }, 500);
    };

    const onEnd = (e) => {
      if (localTimer) { clearTimeout(localTimer); localTimer = null; }

      const tt = document.getElementById('tooltip');
      if (localLongPress || tt.classList.contains('active')) {
        e.stopPropagation();
        e.preventDefault();
      } else {
        // Защита от двойного клика (touchend + mouseup)
        const now = Date.now();
        if (now - lastClickTime < 300) return;
        lastClickTime = now;

        onCellClick(x, y);
      }
      localLongPress = false;
    };

    const onCancel = () => {
      if (localTimer) { clearTimeout(localTimer); localTimer = null; }
      localLongPress = false;
    };

    slot.addEventListener('mousedown', onStart);
    slot.addEventListener('touchstart', onStart, { passive: false });
    slot.addEventListener('mouseup', onEnd);
    slot.addEventListener('touchend', onEnd);
    slot.addEventListener('mouseleave', onCancel);
    slot.addEventListener('touchcancel', onCancel);
  });
}

function buildAndShowTooltip(x, y) {
  let title = 'Пусто';
  let desc = 'Здесь ничего нет.';

  if (player.x === x && player.y === y) {
    const w = player.hand ? `${player.hand.def.name} (${player.hand.hp || ''} HP)` : 'нет';
    title = 'Лисёнок';
    desc = `HP: ${player.hp}/${CONFIG.PLAYER_MAX_HP}<br>В руках: ${w}<br>Вино: ${player.wineCount}`;
  } else {
    const cell = getCell(x, y);
    if (cell && cell.entity) {
      const e = cell.entity;
      if (e.kind === 'enemy') {
        const cfg = CONFIG.ENEMIES[e.type];
        title = cfg.name;
        desc = `HP: ${e.hp}<br>${cfg.desc}`;
      } else if (e.kind === 'item') {
        title = e.def.name; desc = e.def.desc || '';
      } else if (e.kind === 'book') {
        title = 'Книга'; desc = 'Можно прочитать.';
      } else if (e.kind === 'drug') {
        title = e.def.name; desc = 'Снимает 1 HP. Каждый второй — эффект.';
      } else if (e.kind === 'wine') {
        title = e.def.name; desc = e.def.popup;
      } else if (e.kind === 'trap') {
        title = CONFIG.TRAPS[e.trapType].name;
        desc = CONFIG.TRAPS[e.trapType].desc;
      } else if (e.kind === 'device') {
        title = e.def.name; desc = 'Алхимический прибор.';
      } else if (e.kind === 'door') {
        title = 'Дверь'; desc = 'Ведёт в следующую комнату.';
      } else if (e.kind === 'entrance') {
        title = 'Входная дверь'; desc = '«Обратного пути нет.»';
      } else if (e.kind === 'butler') {
        title = 'Дворецкий'; desc = 'Кликните на него, чтобы получить приветствие.';
      } else if (e.kind === 'librarian') {
        title = 'Библиотекарша'; desc = '«Тш-ш-ш. Или я превращу тебя в закладку!»';
      } else if (e.kind === 'alchemist') {
        title = 'Алхимик'; desc = 'Снаркоманился, не реагирует.';
      } else if (e.kind === 'bat') {
        title = 'Летучая мышь'; desc = e.asleep ? 'Спит вверх ногами.' : 'Просыпается...';
      } else if (e.kind === 'vomit') {
        title = 'Рвота'; desc = 'Фу.';
      } else if (e.kind === 'hallucination') {
        title = 'Галлюцинация'; desc = 'Что-то не так...';
      } else if (e.kind === 'panic') {
        title = 'Паника'; desc = 'Сердце колотится.';
      }
    }
  }

  showTooltip(title, desc);
  try { if (navigator.vibrate) navigator.vibrate(50); } catch (e) {}
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ
// ============================================
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

function pickupOnCell(cell) {
  if (!cell || !cell.entity) return;
  const e = cell.entity;
  if (e.kind === 'item' || e.kind === 'wine' || e.kind === 'drug' || e.kind === 'book') {
    interactWithCell(cell);
  }
}

// ============================================
// GOOGLE SHEETS
// ============================================
function sendToGoogleSheets() {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('ВСТАВЬ_СЮДА')) {
    console.warn('Google Script URL не настроен.');
    return;
  }

  const fd = new FormData();
  fd.append('playerId', playerId);
  fd.append('wineCollected', player.wineCount);
  fd.append('roomsPassed', behaviorStats.roomsPassed || 0);
  fd.append('deaths', behaviorStats.deaths || 0);
  fd.append('tortureSubmitted', behaviorStats.torture.submitted);
  fd.append('tortureDominated', behaviorStats.torture.dominated);
  fd.append('metCount', behaviorStats.torture.metCount ? 'да' : 'нет');
  fd.append('tortureTurnsAfterDoor', behaviorStats.tortureTurnsAfterDoor || 0);
  fd.append('labCardsBeforeDoor', behaviorStats.labCardsBeforeDoor || 0);
  fd.append('libraryCardsAfterDoor', behaviorStats.libraryCardsAfterDoor || 0);
  fd.append('booksRead', (behaviorStats.library.booksRead || []).length);
  fd.append('drugsTried', (behaviorStats.lab.drugsTried || []).length);
  fd.append('finalHp', player.hp);
  fd.append('timestamp', new Date().toISOString());

  console.log('📤 Отправка в Google Sheets:', {
    playerId,
    wineCollected: player.wineCount,
    roomsPassed: behaviorStats.roomsPassed || 0,
    finalHp: player.hp
  });

  fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: fd })
    .then(r => {
      console.log('📥 HTTP статус:', r.status, r.statusText);
      return r.json();
    })
    .then(data => console.log('✅ Ответ скрипта:', data))
    .catch(err => console.error('❌ Ошибка fetch:', err));
}

// ============================================
// DOM READY
// ============================================
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('start-continue-btn');
  if (!btn) return;

  const input = document.getElementById('player-id-input');

  const updateBtn = () => {
    const val = input.value.trim();
    if (!val) { btn.style.display = 'none'; return; }
    const opened = getOpenedRooms(val);
    btn.style.display = opened.length > 0 ? '' : 'none';
  };
  input.addEventListener('input', updateBtn);
  updateBtn();

  btn.addEventListener('click', () => {
    const val = input.value.trim();
    if (!val) { alert('Введите номер!'); return; }
    const opened = getOpenedRooms(val);
    if (opened.length === 0) { alert('Нет открытых комнат.'); return; }
    showRoomPicker(val, opened);
  });
});

function showRoomPicker(id, opened) {
  const modal = document.getElementById('start-modal');
  if (!modal) return;
  const win = modal.querySelector('.modal-window');

  const old = document.getElementById('room-picker');
  if (old) old.remove();

  const picker = document.createElement('div');
  picker.id = 'room-picker';
  picker.innerHTML = `<div class="modal-desc" style="margin-top:12px;">Выбери комнату:</div>`;

  for (const roomId of opened) {
    const room = getRoomConfig(roomId);
    if (!room) continue;
    const b = document.createElement('button');
    b.className = 'modal-btn';
    b.style.marginTop = '6px';
    b.textContent = room.name;
    b.addEventListener('click', () => {
      playerId = id;
      startGameFromRoom(roomId);
    });
    picker.appendChild(b);
  }

  win.appendChild(picker);
}

function startGameFromRoom(roomId) {
  document.getElementById('start-modal').classList.remove('active');
  gameState = 'playing';

  initPlayer();
  initField(roomId);

  const room = getRoomConfig(roomId);
  if (room && room.playerStart) {
    player.x = room.playerStart.x;
    player.y = room.playerStart.y;
  }

  prefillRoom(roomId);
  saveCheckpoint(roomId);
  markRoomOpened(playerId, roomId);

  document.getElementById('log').innerHTML = '';
  fieldInitialized = false;
  initFieldDOM();
  render();

  log(`🏰 Старт с комнаты: ${room.name}`);
}

function getOpenedRooms(id) {
  try {
    const raw = localStorage.getItem('manor_rooms_' + id);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function markRoomOpened(id, roomId) {
  const list = getOpenedRooms(id);
  if (!list.includes(roomId)) {
    list.push(roomId);
    try { localStorage.setItem('manor_rooms_' + id, JSON.stringify(list)); } catch (e) {}
  }
}

function countCardStep() {
  if (currentRoomId === 'lab') {
    behaviorStats.labCardsBeforeDoor++;
  } else if (currentRoomId === 'library') {
    if (roomDoorAppeared) {
      behaviorStats.libraryCardsAfterDoor++;
    }
  }
}