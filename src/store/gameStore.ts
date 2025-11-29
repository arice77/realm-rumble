import { create } from 'zustand';

export type MoveType = 'attack' | 'defend' | 'powerup' | null;
export type GameState = 'lobby' | 'playing' | 'resolving' | 'finished';

export interface Player {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  powerUpMultiplier: number;
  currentMove: MoveType;
  moveHistory: { turn: number; move: MoveType; damage?: number }[];
  isReady: boolean;
}

export interface BattleLogEntry {
  turn: number;
  player1Move: MoveType;
  player2Move: MoveType;
  player1Damage: number;
  player2Damage: number;
  player1Healing: number;
  player2Healing: number;
}

interface GameStore {
  gameState: GameState;
  currentTurn: number;
  timeRemaining: number;
  player1: Player;
  player2: Player;
  battleLog: BattleLogEntry[];
  winner: string | null;
  
  // Actions
  startGame: (player1Name: string, player2Name: string) => void;
  selectMove: (playerId: string, move: MoveType) => void;
  resolveTurn: () => void;
  resetGame: () => void;
  setTimeRemaining: (time: number) => void;
}

const createPlayer = (id: string, name: string): Player => ({
  id,
  name,
  hp: 100,
  maxHp: 100,
  energy: 50,
  maxEnergy: 100,
  powerUpMultiplier: 1.0,
  currentMove: null,
  moveHistory: [],
  isReady: false,
});

const calculateDamage = (
  attacker: Player,
  defender: Player,
  attackerMove: MoveType,
  defenderMove: MoveType
): { damage: number; healing: number } => {
  let damage = 0;
  let healing = 0;

  if (attackerMove === 'attack') {
    const baseDamage = attacker.energy >= 20 ? 25 : 10;
    damage = baseDamage * attacker.powerUpMultiplier;
    
    if (defenderMove === 'defend') {
      const defenseStrength = defender.energy >= 10 ? 0.3 : 0.7;
      damage = damage * defenseStrength;
    }
  } else if (attackerMove === 'powerup') {
    healing = attacker.energy >= 15 ? 10 : 5;
  }

  return { damage: Math.round(damage), healing };
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'lobby',
  currentTurn: 1,
  timeRemaining: 30,
  player1: createPlayer('player1', 'Player 1'),
  player2: createPlayer('player2', 'Player 2'),
  battleLog: [],
  winner: null,

  startGame: (player1Name: string, player2Name: string) => {
    set({
      gameState: 'playing',
      currentTurn: 1,
      timeRemaining: 30,
      player1: createPlayer('player1', player1Name),
      player2: createPlayer('player2', player2Name),
      battleLog: [],
      winner: null,
    });
  },

  selectMove: (playerId: string, move: MoveType) => {
    const state = get();
    
    if (playerId === 'player1') {
      set({
        player1: {
          ...state.player1,
          currentMove: move,
          isReady: true,
        },
      });
    } else {
      set({
        player2: {
          ...state.player2,
          currentMove: move,
          isReady: true,
        },
      });
    }

    // Auto-resolve when both players are ready
    setTimeout(() => {
      const newState = get();
      if (newState.player1.isReady && newState.player2.isReady) {
        get().resolveTurn();
      }
    }, 100);
  },

  resolveTurn: () => {
    const state = get();
    const { player1, player2, currentTurn } = state;

    set({ gameState: 'resolving' });

    // Calculate damage for both players
    const p1Result = calculateDamage(player1, player2, player1.currentMove, player2.currentMove);
    const p2Result = calculateDamage(player2, player1, player2.currentMove, player1.currentMove);

    // Update HP
    let newP1Hp = Math.max(0, player1.hp - p2Result.damage + p1Result.healing);
    let newP2Hp = Math.max(0, player2.hp - p1Result.damage + p2Result.healing);

    // Update energy
    const p1EnergyCost = player1.currentMove === 'attack' ? 20 : player1.currentMove === 'defend' ? 10 : 15;
    const p2EnergyCost = player2.currentMove === 'attack' ? 20 : player2.currentMove === 'defend' ? 10 : 15;
    
    let newP1Energy = Math.min(100, Math.max(0, player1.energy - p1EnergyCost + 15));
    let newP2Energy = Math.min(100, Math.max(0, player2.energy - p2EnergyCost + 15));

    // Update power-up multiplier
    let newP1Multiplier = player1.powerUpMultiplier;
    let newP2Multiplier = player2.powerUpMultiplier;

    if (player1.currentMove === 'attack') {
      newP1Multiplier = 1.0;
    } else if (player1.currentMove === 'powerup' && player1.energy >= 15) {
      newP1Multiplier = Math.min(2.5, player1.powerUpMultiplier + 0.5);
    }

    if (player2.currentMove === 'attack') {
      newP2Multiplier = 1.0;
    } else if (player2.currentMove === 'powerup' && player2.energy >= 15) {
      newP2Multiplier = Math.min(2.5, player2.powerUpMultiplier + 0.5);
    }

    // Add to battle log
    const logEntry: BattleLogEntry = {
      turn: currentTurn,
      player1Move: player1.currentMove,
      player2Move: player2.currentMove,
      player1Damage: p2Result.damage,
      player2Damage: p1Result.damage,
      player1Healing: p1Result.healing,
      player2Healing: p2Result.healing,
    };

    // Update player histories
    const p1History = [...player1.moveHistory, { turn: currentTurn, move: player1.currentMove, damage: p1Result.damage }];
    const p2History = [...player2.moveHistory, { turn: currentTurn, move: player2.currentMove, damage: p2Result.damage }];

    // Check for winner
    let winner = null;
    let gameState: GameState = 'playing';
    
    if (newP1Hp <= 0 && newP2Hp <= 0) {
      winner = 'Draw';
      gameState = 'finished';
    } else if (newP1Hp <= 0) {
      winner = player2.name;
      gameState = 'finished';
    } else if (newP2Hp <= 0) {
      winner = player1.name;
      gameState = 'finished';
    }

    setTimeout(() => {
      set({
        player1: {
          ...player1,
          hp: newP1Hp,
          energy: newP1Energy,
          powerUpMultiplier: newP1Multiplier,
          currentMove: null,
          isReady: false,
          moveHistory: p1History,
        },
        player2: {
          ...player2,
          hp: newP2Hp,
          energy: newP2Energy,
          powerUpMultiplier: newP2Multiplier,
          currentMove: null,
          isReady: false,
          moveHistory: p2History,
        },
        battleLog: [...state.battleLog, logEntry],
        currentTurn: currentTurn + 1,
        timeRemaining: 30,
        gameState,
        winner,
      });
    }, 1500);
  },

  resetGame: () => {
    set({
      gameState: 'lobby',
      currentTurn: 1,
      timeRemaining: 30,
      player1: createPlayer('player1', 'Player 1'),
      player2: createPlayer('player2', 'Player 2'),
      battleLog: [],
      winner: null,
    });
  },

  setTimeRemaining: (time: number) => {
    set({ timeRemaining: time });
  },
}));
