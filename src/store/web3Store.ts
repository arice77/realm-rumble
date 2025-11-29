import { create } from 'zustand'
import {
  createOnChainMatch,
  submitOnChainMove,
  updateOnChainGameState,
  finishOnChainMatch,
  initializeGameSchemas,
  getOnChainMatchState,
  getOnChainMoves,
} from '@/lib/gameService'
import { OnChainGameStatus, OnChainMoveType, toOnChainMoveType } from '@/lib/gameSchemas'
import type { MoveType } from './gameStore'

export type Web3GameMode = 'local' | 'pvp' | 'ai'

interface Web3Store {
  // Connection state
  walletAddress: `0x${string}` | null
  isConnected: boolean
  isCorrectNetwork: boolean

  // Match state
  matchId: `0x${string}` | null
  opponentAddress: `0x${string}` | null
  isWeb3Match: boolean
  gameMode: Web3GameMode
  isHost: boolean // true if this player created the match

  // Transaction state
  isSubmitting: boolean
  lastTxHash: string | null
  error: string | null

  // Schema initialization
  schemasInitialized: boolean

  // Opponent move tracking for PvP
  opponentMove: MoveType | null
  isWaitingForOpponent: boolean

  // Actions
  setWalletState: (address: `0x${string}` | null, isConnected: boolean, isCorrectNetwork: boolean) => void
  setGameMode: (mode: Web3GameMode) => void
  initSchemas: () => Promise<void>
  
  // Match actions
  createMatch: (player1Address: `0x${string}`) => Promise<`0x${string}`>
  joinMatch: (matchId: `0x${string}`, playerAddress: `0x${string}`) => Promise<void>
  submitMove: (move: MoveType, turnNumber: number) => Promise<void>
  checkForOpponentMove: (turnNumber: number) => Promise<MoveType | null>
  updateGameState: (
    player1HP: number,
    player1Energy: number,
    player1PowerMultiplier: number,
    player2HP: number,
    player2Energy: number,
    player2PowerMultiplier: number,
    currentTurn: number,
    isFinished: boolean
  ) => Promise<void>
  finishMatch: (winner: `0x${string}`, loser: `0x${string}`, totalTurns: number) => Promise<void>
  
  // Reset
  resetWeb3State: () => void
  clearError: () => void
  setOpponentMove: (move: MoveType | null) => void
}

export const useWeb3Store = create<Web3Store>((set, get) => ({
  // Initial state
  walletAddress: null,
  isConnected: false,
  isCorrectNetwork: false,
  matchId: null,
  opponentAddress: null,
  isWeb3Match: false,
  gameMode: 'local',
  isHost: false,
  isSubmitting: false,
  lastTxHash: null,
  error: null,
  schemasInitialized: false,
  opponentMove: null,
  isWaitingForOpponent: false,

  setWalletState: (address, isConnected, isCorrectNetwork) => {
    set({ walletAddress: address, isConnected, isCorrectNetwork })
  },

  setGameMode: (mode) => {
    set({ gameMode: mode, isWeb3Match: mode === 'pvp' })
  },

  initSchemas: async () => {
    const { walletAddress, schemasInitialized } = get()
    
    if (schemasInitialized || !walletAddress) return

    try {
      set({ isSubmitting: true, error: null })
      await initializeGameSchemas(walletAddress)
      set({ schemasInitialized: true })
      console.log('✅ Schemas initialized successfully')
    } catch (error) {
      console.error('Schema initialization failed:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to initialize schemas' })
    } finally {
      set({ isSubmitting: false })
    }
  },

  createMatch: async (player1Address) => {
    const { walletAddress } = get()
    
    if (!walletAddress) {
      throw new Error('Wallet not connected')
    }

    try {
      set({ isSubmitting: true, error: null })
      
      // Create match with player1 = creator, player2 = placeholder (will be updated when opponent joins)
      const placeholderOpponent = '0x0000000000000000000000000000000000000000' as `0x${string}`
      const { matchId, txHash } = await createOnChainMatch(walletAddress, player1Address, placeholderOpponent)
      
      set({
        matchId,
        opponentAddress: null,
        isWeb3Match: true,
        isHost: true,
        lastTxHash: txHash,
      })

      console.log(`✅ Match created: ${matchId}`)
      return matchId
    } catch (error) {
      console.error('Failed to create match:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create match'
      set({ error: errorMessage })
      throw error
    } finally {
      set({ isSubmitting: false })
    }
  },

  joinMatch: async (matchId, playerAddress) => {
    const { walletAddress } = get()
    
    if (!walletAddress) {
      throw new Error('Wallet not connected')
    }

    try {
      set({ isSubmitting: true, error: null })
      
      // For now, just set the match ID - in a full implementation,
      // you'd update the match on-chain to add player2
      set({
        matchId,
        opponentAddress: null, // Will be discovered from chain
        isWeb3Match: true,
        isHost: false,
      })

      console.log(`✅ Joined match: ${matchId}`)
    } catch (error) {
      console.error('Failed to join match:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to join match'
      set({ error: errorMessage })
      throw error
    } finally {
      set({ isSubmitting: false })
    }
  },

  submitMove: async (move, turnNumber) => {
    const { walletAddress, matchId } = get()
    
    if (!walletAddress || !matchId) {
      console.log('Skipping on-chain move submission (local mode)')
      return
    }

    try {
      set({ isSubmitting: true, error: null })
      
      const onChainMove = toOnChainMoveType(move)
      const txHash = await submitOnChainMove(walletAddress, matchId, walletAddress, onChainMove, turnNumber)
      
      set({ lastTxHash: txHash, isWaitingForOpponent: true })
      console.log(`✅ Move submitted on-chain: ${move}`)
    } catch (error) {
      console.error('Failed to submit move:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to submit move' })
    } finally {
      set({ isSubmitting: false })
    }
  },

  checkForOpponentMove: async (turnNumber) => {
    const { matchId, walletAddress, opponentAddress } = get()
    
    if (!matchId || !walletAddress) return null

    try {
      // Get all moves for this match
      const publisherAddress = opponentAddress || walletAddress
      const moves = await getOnChainMoves(matchId, publisherAddress)
      
      // Find opponent's move for this turn
      const opponentMove = moves.find(
        m => m.turnNumber === turnNumber && m.player !== walletAddress
      )
      
      if (opponentMove) {
        const moveType = ['attack', 'defend', 'powerup'][opponentMove.moveType] as MoveType
        set({ opponentMove: moveType, isWaitingForOpponent: false })
        return moveType
      }
      
      return null
    } catch (error) {
      console.error('Failed to check for opponent move:', error)
      return null
    }
  },

  updateGameState: async (
    player1HP,
    player1Energy,
    player1PowerMultiplier,
    player2HP,
    player2Energy,
    player2PowerMultiplier,
    currentTurn,
    isFinished
  ) => {
    const { walletAddress, matchId, opponentAddress, isHost } = get()
    
    // Only host updates state
    if (!walletAddress || !matchId || !isHost) {
      console.log('Skipping on-chain state update (not host or local mode)')
      return
    }

    try {
      set({ isSubmitting: true, error: null })
      
      const player2Addr = opponentAddress || ('0x0000000000000000000000000000000000000000' as `0x${string}`)
      
      const txHash = await updateOnChainGameState(
        walletAddress,
        matchId,
        walletAddress,
        player2Addr,
        player1HP,
        player1Energy,
        player1PowerMultiplier,
        player2HP,
        player2Energy,
        player2PowerMultiplier,
        currentTurn,
        isFinished ? OnChainGameStatus.FINISHED : OnChainGameStatus.ACTIVE
      )
      
      set({ lastTxHash: txHash })
      console.log(`✅ Game state updated on-chain`)
    } catch (error) {
      console.error('Failed to update game state:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to update game state' })
    } finally {
      set({ isSubmitting: false })
    }
  },

  finishMatch: async (winner, loser, totalTurns) => {
    const { walletAddress, matchId, isHost } = get()
    
    // Only host finishes match
    if (!walletAddress || !matchId || !isHost) {
      console.log('Skipping on-chain match finish (not host or local mode)')
      return
    }

    try {
      set({ isSubmitting: true, error: null })
      
      const txHash = await finishOnChainMatch(walletAddress, matchId, winner, loser, totalTurns)
      
      set({ lastTxHash: txHash })
      console.log(`✅ Match finished on-chain: ${winner.slice(0, 8)}... wins!`)
    } catch (error) {
      console.error('Failed to finish match:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to finish match' })
    } finally {
      set({ isSubmitting: false })
    }
  },

  resetWeb3State: () => {
    set({
      matchId: null,
      opponentAddress: null,
      isWeb3Match: false,
      isHost: false,
      isSubmitting: false,
      lastTxHash: null,
      error: null,
      opponentMove: null,
      isWaitingForOpponent: false,
    })
  },

  clearError: () => {
    set({ error: null })
  },

  setOpponentMove: (move) => {
    set({ opponentMove: move })
  },
}))
