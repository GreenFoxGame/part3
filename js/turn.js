// ============================================
// КОНЕЦ ХОДА ИГРОКА
// ============================================

let lastEndTurnTime = 0;

function endPlayerTurn() {
  const now = Date.now();
  if (now - lastEndTurnTime < 100) return;   // защита от двойного вызова
  lastEndTurnTime = now;

  if (currentRoomId === 'torture' && roomDoorAppeared) {
    behaviorStats.tortureTurnsAfterDoor++;
  }
  if (gameState !== 'playing') return;

  gameTurn++;
  globalTurn++;

  player.submitted = false;
  if (player.gagTurns > 0) {
    player.gagTurns--;
    if (player.gagTurns === 0) log('🍭 Кляп-леденец снят.');
  }

  if (player.apronTurns > 0) {
    player.apronTurns--;
    if (player.apronTurns === 0) log('🥼 Фартук дворецкого больше не действует.');
  }

  if (player.frozen > 0) {
    player.frozen--;
    log(`⛓️ Игрок скован (${player.frozen})`);
  }

  enemiesTurn();
  if (gameState !== 'playing') return;

  itemsTurn();
  if (gameState !== 'playing') return;

  // Каждые 2 хода — случайный эффект
    // Каждые 2 хода — случайный эффект (ТОЛЬКО в лаборатории)
  if (currentRoomId === 'lab' && globalTurn % 2 === 0) {
    const effect = ['vomit', 'hallucination', 'panic'][Math.floor(Math.random() * 3)];
    applyDrugEffect(effect);
  }

  if (typeof hallucinationTurns !== 'undefined' && hallucinationTurns > 0) {
    hallucinationTurns--;
    if (hallucinationTurns === 0) log('🌀 Галлюцинации рассеялись.');
  }
  if (typeof panicTurns !== 'undefined' && panicTurns > 0) {
    panicTurns--;
    if (panicTurns === 0) log('😱 Паническая атака прошла.');
  }

  checkDoorsCondition();

  if (playerWasHit) {
    playerWasHit = false;
    playerHitX = null; playerHitY = null;
    animateHitById('player', 'player');
  }

  render();
}