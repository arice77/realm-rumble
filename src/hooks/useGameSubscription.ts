import { useEffect, useState, useCallback } from 'react'
import { subscribeToGameUpdates, getOnChainMatchState, type GameSubscription } from '@/lib/gameService'
import { type OnChainMatchState, OnChainGameStatus } from '@/lib/gameSchemas'

interface UseGameSubscriptionReturn {
  gameState: OnChainMatchState | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useGameSubscription(
  matchId: `0x${string}` | null,
  publisher: `0x${string}` | null
): UseGameSubscriptionReturn {
  const [gameState, setGameState] = useState<OnChainMatchState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch current state from chain
  const refetch = useCallback(async () => {
    if (!matchId || !publisher) return

    try {
      setLoading(true)
      const state = await getOnChainMatchState(matchId, publisher)
      if (state) {
        setGameState(state)
      }
      setError(null)
    } catch (err) {
      console.error('Failed to fetch game state:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch game state')
    } finally {
      setLoading(false)
    }
  }, [matchId, publisher])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!matchId) {
      setLoading(false)
      return
    }

    let subscription: GameSubscription | null = null

    async function setup() {
      try {
        // Initial fetch
        await refetch()

        // Subscribe to updates
        subscription = await subscribeToGameUpdates(
          matchId,
          (state) => {
            console.log('📡 Game state updated via subscription:', state)
            setGameState(state)
            setLoading(false)
          },
          (err) => {
            console.error('Subscription error:', err)
            setError(err.message)
          }
        )
      } catch (err) {
        console.error('Failed to setup subscription:', err)
        setError(err instanceof Error ? err.message : 'Subscription setup failed')
        setLoading(false)
      }
    }

    setup()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [matchId, refetch])

  return { gameState, loading, error, refetch }
}

// Hook to track match status
export function useMatchStatus(matchId: `0x${string}` | null, publisher: `0x${string}` | null) {
  const { gameState, loading, error, refetch } = useGameSubscription(matchId, publisher)

  const isActive = gameState?.gameStatus === OnChainGameStatus.ACTIVE
  const isFinished = gameState?.gameStatus === OnChainGameStatus.FINISHED
  const isWaiting = gameState?.gameStatus === OnChainGameStatus.WAITING

  return {
    gameState,
    loading,
    error,
    refetch,
    isActive,
    isFinished,
    isWaiting,
  }
}

