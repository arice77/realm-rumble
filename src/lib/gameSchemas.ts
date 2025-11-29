// Somnia Data Streams Schemas for Realm Rush
// These define the structure of on-chain game data

// Schema 1: Match State - Current game state stored on-chain
export const MATCH_STATE_SCHEMA = 
  'bytes32 matchId, address player1, address player2, uint8 player1HP, uint8 player1Energy, uint16 player1PowerMultiplier, uint8 player2HP, uint8 player2Energy, uint16 player2PowerMultiplier, uint8 currentTurn, uint8 gameStatus, uint64 lastUpdateTime'

// Schema 2: Player Move - Individual turn actions
export const MOVE_SCHEMA = 
  'bytes32 matchId, address player, uint8 moveType, uint8 turnNumber, uint64 timestamp'

// Schema 3: Match Result - Final outcome stored permanently
export const MATCH_RESULT_SCHEMA = 
  'bytes32 matchId, address winner, address loser, uint8 totalTurns, uint64 endTime'

// Move Types Enum (matches game store)
export enum OnChainMoveType {
  ATTACK = 0,
  DEFEND = 1,
  POWERUP = 2,
}

// Game Status Enum
export enum OnChainGameStatus {
  WAITING = 0,    // Waiting for players
  ACTIVE = 1,     // Game in progress
  FINISHED = 2,   // Game completed
  CANCELLED = 3,  // Game cancelled
}

// Type definitions for parsed data
export interface OnChainMatchState {
  matchId: `0x${string}`
  player1: `0x${string}`
  player2: `0x${string}`
  player1HP: number
  player1Energy: number
  player1PowerMultiplier: number
  player2HP: number
  player2Energy: number
  player2PowerMultiplier: number
  currentTurn: number
  gameStatus: OnChainGameStatus
  lastUpdateTime: number
}

export interface OnChainMove {
  matchId: `0x${string}`
  player: `0x${string}`
  moveType: OnChainMoveType
  turnNumber: number
  timestamp: number
}

export interface OnChainMatchResult {
  matchId: `0x${string}`
  winner: `0x${string}`
  loser: `0x${string}`
  totalTurns: number
  endTime: number
}

// Helper to convert local move type to on-chain
export function toOnChainMoveType(move: 'attack' | 'defend' | 'powerup' | null): OnChainMoveType {
  switch (move) {
    case 'attack': return OnChainMoveType.ATTACK
    case 'defend': return OnChainMoveType.DEFEND
    case 'powerup': return OnChainMoveType.POWERUP
    default: return OnChainMoveType.ATTACK
  }
}

// Helper to convert on-chain move type to local
export function fromOnChainMoveType(move: OnChainMoveType): 'attack' | 'defend' | 'powerup' {
  switch (move) {
    case OnChainMoveType.ATTACK: return 'attack'
    case OnChainMoveType.DEFEND: return 'defend'
    case OnChainMoveType.POWERUP: return 'powerup'
  }
}

// Zero bytes32 for root schema (no parent)
export const PARENT_SCHEMA_ID = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
