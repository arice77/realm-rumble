import { Player, MoveType } from '@/store/gameStore';

/**
 * AI decision logic for opponent moves
 * Returns the best move based on current game state
 */
export const getAIMove = (aiPlayer: Player, humanPlayer: Player): MoveType => {
  // If AI has low HP (<30), prefer Defend or PowerUp
  if (aiPlayer.hp < 30) {
    // If low energy, must defend
    if (aiPlayer.energy < 15) {
      return 'defend';
    }
    return Math.random() < 0.6 ? 'defend' : 'powerup';
  }

  // If AI has high power multiplier (≥2x), use it to attack
  if (aiPlayer.powerUpMultiplier >= 2.0 && aiPlayer.energy >= 20) {
    return 'attack';
  }

  // If human is low HP (<40), attack aggressively
  if (humanPlayer.hp < 40) {
    if (aiPlayer.energy >= 20) {
      return Math.random() < 0.7 ? 'attack' : 'powerup';
    }
  }

  // If AI has low energy (<30), build it up with power-up
  if (aiPlayer.energy < 30) {
    return 'powerup';
  }

  // Strategic: build power multiplier if it's still low
  if (aiPlayer.powerUpMultiplier < 1.5 && aiPlayer.energy >= 15) {
    return Math.random() < 0.5 ? 'powerup' : 'attack';
  }

  // Default: weighted random based on energy availability
  const rand = Math.random();
  
  // Can afford all moves
  if (aiPlayer.energy >= 20) {
    if (rand < 0.45) return 'attack';
    if (rand < 0.75) return 'defend';
    return 'powerup';
  }
  
  // Can only afford defend or powerup
  if (aiPlayer.energy >= 15) {
    return rand < 0.5 ? 'defend' : 'powerup';
  }
  
  // Can only afford defend
  if (aiPlayer.energy >= 10) {
    return 'defend';
  }

  // Desperate: use any move even if weak
  return rand < 0.5 ? 'attack' : 'defend';
};
