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
  consecutiveAttacks: number;
  hasAttackBuff: boolean;
  walletAddress?: `0x${string}`;
}

export interface BattleLogEntry {
  turn: number;
  player1Move: MoveType;
  player2Move: MoveType;
  player1Damage: number;
  player2Damage: number;
  player1Healing: number;
  player2Healing: number;
  txHash?: string;
}

interface GameStore {
  gameState: GameState;
  currentTurn: number;
  timeRemaining: number;
  player1: Player;
  player2: Player;
  battleLog: BattleLogEntry[];
  winner: string | null;
  
  // Web3 state
  isWeb3Mode: boolean;
  matchId: `0x${string}` | null;
  pendingTxHash: string | null;
  
  // Actions
  startGame: (player1Name: string, player2Name: string, player1Address?: `0x${string}`, player2Address?: `0x${string}`) => void;
  selectMove: (playerId: string, move: MoveType) => void;
  resolveTurn: () => void;
  resetGame: () => void;
  setTimeRemaining: (time: number) => void;
  
  // Web3 actions
  setWeb3Mode: (enabled: boolean, matchId?: `0x${string}`) => void;
  setPendingTx: (txHash: string | null) => void;
  addTxToLog: (turn: number, txHash: string) => void;
}

const createPlayer = (id: string, name: string, walletAddress?: `0x${string}`): Player => ({
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
  consecutiveAttacks: 0,
  hasAttackBuff: false,
  walletAddress,
});

const calculateDamage = (
  attacker: Player,
  defender: Player,
  attackerMove: MoveType,
  defenderMove: MoveType
): { damage: number; healing: number; counterDamage: number } => {
  let damage = 0;
  let healing = 0;
  let counterDamage = 0;

  if (attackerMove === 'attack') {
    const baseDamage = attacker.energy >= 25 ? 25 : 10;
    let finalDamage = baseDamage * attacker.powerUpMultiplier;
    
    // Apply attack buff from previous PowerUp vs Attack interaction
    if (attacker.hasAttackBuff) {
      finalDamage *= 1.5;
    }
    
    // Attack fatigue: 2+ consecutive attacks reduces damage by 30%
    if (attacker.consecutiveAttacks >= 1) {
      finalDamage *= 0.7;
    }
    
    // Both Attack: 1.3x damage
    if (defenderMove === 'attack') {
      finalDamage *= 1.3;
    }
    // Defend vs Attack: Reduced damage + counterattack
    else if (defenderMove === 'defend') {
      const defenseStrength = defender.energy >= 10 ? 0.3 : 0.7;
      finalDamage *= defenseStrength;
      counterDamage = 5; // Defender counterattacks for 5 damage
    }
    
    damage = finalDamage;
  } else if (attackerMove === 'powerup') {
    healing = attacker.energy >= 15 ? 10 : 5;
  }

  return { damage: Math.round(damage), healing, counterDamage };
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'lobby',
  currentTurn: 1,
  timeRemaining: 30,
  player1: createPlayer('player1', 'Player 1'),
  player2: createPlayer('player2', 'Player 2'),
  battleLog: [],
  winner: null,
  
  // Web3 state
  isWeb3Mode: false,
  matchId: null,
  pendingTxHash: null,

  startGame: (player1Name: string, player2Name: string, player1Address?: `0x${string}`, player2Address?: `0x${string}`) => {
    set({
      gameState: 'playing',
      currentTurn: 1,
      timeRemaining: 30,
      player1: createPlayer('player1', player1Name, player1Address),
      player2: createPlayer('player2', player2Name, player2Address),
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

    // Update HP (including counterattack damage)
    let newP1Hp = Math.max(0, player1.hp - p2Result.damage - p2Result.counterDamage + p1Result.healing);
    let newP2Hp = Math.max(0, player2.hp - p1Result.damage - p1Result.counterDamage + p2Result.healing);

    // Update energy with new system
    // Base regen: 20 energy/turn
    // Attack costs 25 (net -5)
    // Defend gives +5 bonus (net +25 total)
    // PowerUp gives +10 bonus (net +30 total)
    const baseRegen = 20;
    const p1EnergyCost = player1.currentMove === 'attack' ? 25 : player1.currentMove === 'defend' ? 10 : 15;
    const p2EnergyCost = player2.currentMove === 'attack' ? 25 : player2.currentMove === 'defend' ? 10 : 15;
    
    const p1EnergyBonus = player1.currentMove === 'defend' ? 5 : player1.currentMove === 'powerup' ? 10 : 0;
    const p2EnergyBonus = player2.currentMove === 'defend' ? 5 : player2.currentMove === 'powerup' ? 10 : 0;
    
    let newP1Energy = Math.min(100, Math.max(0, player1.energy - p1EnergyCost + baseRegen + p1EnergyBonus));
    let newP2Energy = Math.min(100, Math.max(0, player2.energy - p2EnergyCost + baseRegen + p2EnergyBonus));

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

    // Update consecutive attacks counter
    const newP1ConsecutiveAttacks = player1.currentMove === 'attack' ? player1.consecutiveAttacks + 1 : 0;
    const newP2ConsecutiveAttacks = player2.currentMove === 'attack' ? player2.consecutiveAttacks + 1 : 0;

    // Update attack buff (PowerUp vs Attack gives next attack buff)
    const newP1AttackBuff = player1.currentMove === 'powerup' && player2.currentMove === 'attack';
    const newP2AttackBuff = player2.currentMove === 'powerup' && player1.currentMove === 'attack';

    // Add to battle log
    const logEntry: BattleLogEntry = {
      turn: currentTurn,
      player1Move: player1.currentMove,
      player2Move: player2.currentMove,
      player1Damage: p2Result.damage + p2Result.counterDamage,
      player2Damage: p1Result.damage + p1Result.counterDamage,
      player1Healing: p1Result.healing,
      player2Healing: p2Result.healing,
    };

    // Update player histories
    const p1History = [...player1.moveHistory, { turn: currentTurn, move: player1.currentMove, damage: p1Result.damage }];
    const p2History = [...player2.moveHistory, { turn: currentTurn, move: player2.currentMove, damage: p2Result.damage }];

    // Check for winner (HP ≤ 0 OR turn limit reached)
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
    } else if (currentTurn >= 15) {
      // Turn limit reached: highest HP wins
      if (newP1Hp > newP2Hp) {
        winner = player1.name;
      } else if (newP2Hp > newP1Hp) {
        winner = player2.name;
      } else {
        winner = 'Draw';
      }
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
          consecutiveAttacks: newP1ConsecutiveAttacks,
          hasAttackBuff: newP1AttackBuff,
        },
        player2: {
          ...player2,
          hp: newP2Hp,
          energy: newP2Energy,
          powerUpMultiplier: newP2Multiplier,
          currentMove: null,
          isReady: false,
          moveHistory: p2History,
          consecutiveAttacks: newP2ConsecutiveAttacks,
          hasAttackBuff: newP2AttackBuff,
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
      isWeb3Mode: false,
      matchId: null,
      pendingTxHash: null,
    });
  },

  setTimeRemaining: (time: number) => {
    set({ timeRemaining: time });
  },
  
  // Web3 actions
  setWeb3Mode: (enabled: boolean, matchId?: `0x${string}`) => {
    set({ isWeb3Mode: enabled, matchId: matchId || null });
  },
  
  setPendingTx: (txHash: string | null) => {
    set({ pendingTxHash: txHash });
  },
  
  addTxToLog: (turn: number, txHash: string) => {
    const { battleLog } = get();
    const updatedLog = battleLog.map(entry => 
      entry.turn === turn ? { ...entry, txHash } : entry
    );
    set({ battleLog: updatedLog });
  },
}));
