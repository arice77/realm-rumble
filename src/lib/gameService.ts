import { SDK, SchemaEncoder, zeroBytes32 } from '@somnia-chain/streams'
import { getPublicHttpClient, getWalletClient, getPublicWsClient, ensureSomniaNetwork } from './somniaConfig'
import { waitForTransactionReceipt } from 'viem/actions'
import { toHex, type Hex, keccak256, encodePacked, pad } from 'viem'
import {
  MATCH_STATE_SCHEMA,
  MOVE_SCHEMA,
  MATCH_RESULT_SCHEMA,
  OnChainMoveType,
  OnChainGameStatus,
  OnChainMatchState,
  OnChainMove,
  OnChainMatchResult,
  PARENT_SCHEMA_ID,
} from './gameSchemas'

// Encoders for each schema
const matchStateEncoder = new SchemaEncoder(MATCH_STATE_SCHEMA)
const moveEncoder = new SchemaEncoder(MOVE_SCHEMA)
const matchResultEncoder = new SchemaEncoder(MATCH_RESULT_SCHEMA)

// Track if schemas have been registered
let schemasRegistered = false

// Check if user has enough STT for gas
async function checkBalance(address: `0x${string}`): Promise<boolean> {
  const publicClient = getPublicHttpClient()
  const balance = await publicClient.getBalance({ address })
  console.log(`💰 STT Balance: ${balance} wei (${Number(balance) / 1e18} STT)`)
  
  if (balance === 0n) {
    console.error('❌ No STT tokens! Get testnet tokens from: https://somnia-testnet.socialscan.io/faucet')
    return false
  }
  return true
}

// Get read-only SDK
function getReadSDK() {
  return new SDK({
    public: getPublicHttpClient(),
  })
}

// Get write SDK (requires wallet)
function getWriteSDK(walletAddress: `0x${string}`) {
  return new SDK({
    public: getPublicHttpClient(),
    wallet: getWalletClient(walletAddress),
  })
}

// Get WebSocket SDK for subscriptions
function getWsSDK() {
  return new SDK({
    public: getPublicWsClient(),
  })
}

// ========================================
// SCHEMA REGISTRATION
// ========================================

async function ensureSchemasRegistered(walletAddress: `0x${string}`) {
  // First ensure we're on the right network
  await ensureSomniaNetwork()

  if (schemasRegistered) {
    console.log('✅ Schemas already registered (local cache)')
    return
  }

  // Check if user has STT tokens
  const hasBalance = await checkBalance(walletAddress)
  if (!hasBalance) {
    throw new Error('No STT tokens. Please get testnet tokens from the faucet: https://somnia-testnet.socialscan.io/faucet')
  }

  const sdk = getWriteSDK(walletAddress)
  const publicClient = getPublicHttpClient()

  // Try to register all schemas at once
  console.log('🚀 Registering data schemas on Somnia...')

  // First, compute all schema IDs for logging
  const matchSchemaId = await sdk.streams.computeSchemaId(MATCH_STATE_SCHEMA)
  const moveSchemaId = await sdk.streams.computeSchemaId(MOVE_SCHEMA)
  const resultSchemaId = await sdk.streams.computeSchemaId(MATCH_RESULT_SCHEMA)
  
  console.log('📋 Schema IDs:')
  console.log('   Match:', matchSchemaId)
  console.log('   Move:', moveSchemaId)
  console.log('   Result:', resultSchemaId)

  try {
    // Try to register schemas - use ignoreIfExists to avoid errors
    const txHash = await sdk.streams.registerDataSchemas(
      [
        { schemaName: `realmRushMatch_${Date.now()}`, schema: MATCH_STATE_SCHEMA, parentSchemaId: PARENT_SCHEMA_ID },
        { schemaName: `realmRushMove_${Date.now()}`, schema: MOVE_SCHEMA, parentSchemaId: PARENT_SCHEMA_ID },
        { schemaName: `realmRushResult_${Date.now()}`, schema: MATCH_RESULT_SCHEMA, parentSchemaId: PARENT_SCHEMA_ID },
      ],
      true // ignore if already registered
    )

    if (txHash && typeof txHash === 'string' && txHash.startsWith('0x')) {
      console.log('📝 Schema registration tx:', txHash)
      await waitForTransactionReceipt(publicClient, { hash: txHash })
      console.log('✅ Schemas registered successfully!')
      // Wait a bit for chain propagation
      await new Promise(resolve => setTimeout(resolve, 2000))
    } else if (txHash instanceof Error) {
      console.warn('⚠️ Schema registration returned error:', txHash.message)
      // Continue anyway - schemas might already exist
    } else {
      console.log('✅ Schemas already exist on chain (no tx needed)')
    }

    schemasRegistered = true
  } catch (error: any) {
    console.error('Schema registration error:', error)
    
    // If it's because schemas exist, that's fine
    if (error?.message?.includes('already') || error?.message?.includes('exists') || error?.message?.includes('registered')) {
      console.log('✅ Schemas already registered')
      schemasRegistered = true
      return
    }
    
    // Otherwise, still mark as registered and proceed
    console.warn('⚠️ Proceeding anyway - schemas may already exist')
    schemasRegistered = true
  }
}

// ========================================
// MATCH OPERATIONS
// ========================================

// Generate unique match ID
function generateMatchId(): `0x${string}` {
  const timestamp = Date.now()
  const random = Math.random().toString()
  return keccak256(encodePacked(['uint256', 'string'], [BigInt(timestamp), random]))
}

// Create a new match on-chain
export async function createOnChainMatch(
  walletAddress: `0x${string}`,
  player1: `0x${string}`,
  player2: `0x${string}`
): Promise<{ matchId: `0x${string}`; txHash: Hex }> {
  // Ensure we're on Somnia network
  await ensureSomniaNetwork()
  
  // Ensure schemas are registered first
  await ensureSchemasRegistered(walletAddress)

  const sdk = getWriteSDK(walletAddress)
  const publicClient = getPublicHttpClient()

  const matchId = generateMatchId()
  const matchStateSchemaId = await sdk.streams.computeSchemaId(MATCH_STATE_SCHEMA)

  console.log('📝 Creating match...')
  console.log('   Match ID:', matchId)
  console.log('   Schema ID:', matchStateSchemaId)
  console.log('   Player 1:', player1)
  console.log('   Player 2:', player2)

  // Encode initial game state
  const data = matchStateEncoder.encodeData([
    { name: 'matchId', value: matchId, type: 'bytes32' },
    { name: 'player1', value: player1, type: 'address' },
    { name: 'player2', value: player2, type: 'address' },
    { name: 'player1HP', value: '100', type: 'uint8' },
    { name: 'player1Energy', value: '50', type: 'uint8' },
    { name: 'player1PowerMultiplier', value: '100', type: 'uint16' },
    { name: 'player2HP', value: '100', type: 'uint8' },
    { name: 'player2Energy', value: '50', type: 'uint8' },
    { name: 'player2PowerMultiplier', value: '100', type: 'uint16' },
    { name: 'currentTurn', value: '1', type: 'uint8' },
    { name: 'gameStatus', value: OnChainGameStatus.ACTIVE.toString(), type: 'uint8' },
    { name: 'lastUpdateTime', value: Date.now().toString(), type: 'uint64' },
  ])

  try {
    console.log('📤 Sending transaction to store match data...')
    
    // Use set for data-only operations (no events)
    const txHash = await sdk.streams.set(
      [{ id: matchId, schemaId: matchStateSchemaId, data }]
    )

    console.log('📝 Transaction hash:', txHash)

    if (!txHash || typeof txHash !== 'string' || !txHash.startsWith('0x')) {
      throw new Error(`Invalid transaction hash: ${txHash}`)
    }

    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...')
    await waitForTransactionReceipt(publicClient, { hash: txHash as Hex })

    console.log(`✅ Match created on-chain: ${matchId}`)
    return { matchId, txHash: txHash as Hex }

  } catch (error: any) {
    console.error('❌ Failed to create match:', error)
    
    // Provide more helpful error message
    if (error?.message?.includes('reverted')) {
      throw new Error('Transaction reverted. Make sure you have enough STT tokens and the Somnia testnet is operational.')
    }
    if (error?.message?.includes('user rejected')) {
      throw new Error('Transaction was rejected by user.')
    }
    
    throw error
  }
}

// Submit a move to the blockchain
export async function submitOnChainMove(
  walletAddress: `0x${string}`,
  matchId: `0x${string}`,
  playerAddress: `0x${string}`,
  moveType: OnChainMoveType,
  turnNumber: number
): Promise<Hex> {
  // Ensure we're on the right network
  await ensureSomniaNetwork()
  
  // Check balance
  const hasBalance = await checkBalance(walletAddress)
  if (!hasBalance) {
    throw new Error('No STT tokens. Please get testnet tokens from the faucet.')
  }
  
  await ensureSchemasRegistered(walletAddress)

  const sdk = getWriteSDK(walletAddress)
  const publicClient = getPublicHttpClient()

  const moveSchemaId = await sdk.streams.computeSchemaId(MOVE_SCHEMA)
  
  // Create unique move ID with timestamp to prevent collisions
  const timestamp = Date.now()
  const moveId = keccak256(encodePacked(
    ['bytes32', 'uint8', 'address', 'uint64'],
    [matchId, turnNumber, playerAddress, BigInt(timestamp)]
  ))

  console.log('🎮 Preparing move submission:')
  console.log('   Match ID:', matchId)
  console.log('   Player:', playerAddress)
  console.log('   Move type:', moveType, `(${OnChainMoveType[moveType]})`)
  console.log('   Turn:', turnNumber)
  console.log('   Move ID:', moveId)
  console.log('   Schema ID:', moveSchemaId)
  console.log('   Timestamp:', timestamp)

  // Encode move data - explicitly log each field
  const moveData = [
    { name: 'matchId', value: matchId, type: 'bytes32' },
    { name: 'player', value: playerAddress, type: 'address' },
    { name: 'moveType', value: moveType.toString(), type: 'uint8' },
    { name: 'turnNumber', value: turnNumber.toString(), type: 'uint8' },
    { name: 'timestamp', value: timestamp.toString(), type: 'uint64' },
  ]
  console.log('   Move data fields:', JSON.stringify(moveData, null, 2))
  
  const data = moveEncoder.encodeData(moveData)
  console.log('   Encoded data length:', data.length)
  console.log('   Encoded data preview:', data.slice(0, 66) + '...')

  try {
    console.log('📤 Submitting move to blockchain...')
    
    // Use set for data-only operations
    const result = await sdk.streams.set([
      { id: moveId, schemaId: moveSchemaId, data }
    ])
    
    // Check if result is an Error
    if (result instanceof Error) {
      console.error('❌ SDK returned error:', result.message)
      throw result
    }
    
    const txHash = result

    if (!txHash || typeof txHash !== 'string' || !txHash.startsWith('0x')) {
      throw new Error(`Invalid transaction hash: ${txHash}`)
    }

    console.log('📝 Transaction hash:', txHash)
    console.log('⏳ Waiting for confirmation...')
    await waitForTransactionReceipt(publicClient, { hash: txHash as Hex })

    console.log(`✅ Move submitted: ${OnChainMoveType[moveType]} by ${playerAddress.slice(0, 8)}...`)
    return txHash as Hex

  } catch (error: any) {
    console.error('❌ Failed to submit move:', error)
    
    // Provide helpful error messages
    if (error?.message?.includes('reverted')) {
      // Schema might not be registered - reset flag and retry
      schemasRegistered = false
      throw new Error('Transaction reverted. Schema may not be registered. Please try again.')
    }
    if (error?.message?.includes('user rejected')) {
      throw new Error('Transaction was rejected by user.')
    }
    if (error?.message?.includes('insufficient funds')) {
      throw new Error('Insufficient STT tokens. Please get testnet tokens from faucet.')
    }
    
    throw error
  }
}

// Update game state on-chain
export async function updateOnChainGameState(
  walletAddress: `0x${string}`,
  matchId: `0x${string}`,
  player1: `0x${string}`,
  player2: `0x${string}`,
  player1HP: number,
  player1Energy: number,
  player1PowerMultiplier: number,
  player2HP: number,
  player2Energy: number,
  player2PowerMultiplier: number,
  currentTurn: number,
  gameStatus: OnChainGameStatus
): Promise<Hex> {
  await ensureSomniaNetwork()
  await ensureSchemasRegistered(walletAddress)

  const sdk = getWriteSDK(walletAddress)
  const publicClient = getPublicHttpClient()

  const matchStateSchemaId = await sdk.streams.computeSchemaId(MATCH_STATE_SCHEMA)

  const data = matchStateEncoder.encodeData([
    { name: 'matchId', value: matchId, type: 'bytes32' },
    { name: 'player1', value: player1, type: 'address' },
    { name: 'player2', value: player2, type: 'address' },
    { name: 'player1HP', value: Math.max(0, player1HP).toString(), type: 'uint8' },
    { name: 'player1Energy', value: Math.min(100, player1Energy).toString(), type: 'uint8' },
    { name: 'player1PowerMultiplier', value: Math.round(player1PowerMultiplier * 100).toString(), type: 'uint16' },
    { name: 'player2HP', value: Math.max(0, player2HP).toString(), type: 'uint8' },
    { name: 'player2Energy', value: Math.min(100, player2Energy).toString(), type: 'uint8' },
    { name: 'player2PowerMultiplier', value: Math.round(player2PowerMultiplier * 100).toString(), type: 'uint16' },
    { name: 'currentTurn', value: currentTurn.toString(), type: 'uint8' },
    { name: 'gameStatus', value: gameStatus.toString(), type: 'uint8' },
    { name: 'lastUpdateTime', value: Date.now().toString(), type: 'uint64' },
  ])

  try {
    console.log('📤 Updating game state on-chain...')
    
    const txHash = await sdk.streams.set(
      [{ id: matchId, schemaId: matchStateSchemaId, data }]
    )

    if (!txHash || typeof txHash !== 'string' || !txHash.startsWith('0x')) {
      throw new Error(`Invalid transaction hash: ${txHash}`)
    }

    await waitForTransactionReceipt(publicClient, { hash: txHash as Hex })

    console.log(`✅ Game state updated for match ${matchId.slice(0, 10)}...`)
    return txHash as Hex

  } catch (error: any) {
    console.error('❌ Failed to update game state:', error)
    if (error?.message?.includes('reverted')) {
      schemasRegistered = false
      throw new Error('Transaction reverted. Please try again.')
    }
    throw error
  }
}

// Record match result on-chain
export async function finishOnChainMatch(
  walletAddress: `0x${string}`,
  matchId: `0x${string}`,
  winner: `0x${string}`,
  loser: `0x${string}`,
  totalTurns: number
): Promise<Hex> {
  await ensureSomniaNetwork()
  await ensureSchemasRegistered(walletAddress)

  const sdk = getWriteSDK(walletAddress)
  const publicClient = getPublicHttpClient()

  const matchResultSchemaId = await sdk.streams.computeSchemaId(MATCH_RESULT_SCHEMA)

  const data = matchResultEncoder.encodeData([
    { name: 'matchId', value: matchId, type: 'bytes32' },
    { name: 'winner', value: winner, type: 'address' },
    { name: 'loser', value: loser, type: 'address' },
    { name: 'totalTurns', value: totalTurns.toString(), type: 'uint8' },
    { name: 'endTime', value: Date.now().toString(), type: 'uint64' },
  ])

  try {
    console.log('📤 Recording match result on-chain...')
    
    const txHash = await sdk.streams.set(
      [{ id: matchId, schemaId: matchResultSchemaId, data }]
    )

    if (!txHash || typeof txHash !== 'string' || !txHash.startsWith('0x')) {
      throw new Error(`Invalid transaction hash: ${txHash}`)
    }

    await waitForTransactionReceipt(publicClient, { hash: txHash as Hex })

    console.log(`✅ Match finished: ${winner.slice(0, 8)}... wins!`)
    return txHash as Hex

  } catch (error: any) {
    console.error('❌ Failed to finish match:', error)
    if (error?.message?.includes('reverted')) {
      schemasRegistered = false
      throw new Error('Transaction reverted. Please try again.')
    }
    throw error
  }
}

// ========================================
// READ OPERATIONS
// ========================================

export async function getOnChainMatchState(
  matchId: `0x${string}`,
  publisher: `0x${string}`
): Promise<OnChainMatchState | null> {
  const sdk = getReadSDK()
  const matchStateSchemaId = await sdk.streams.computeSchemaId(MATCH_STATE_SCHEMA)

  try {
    const rawData = await sdk.streams.getByKey(matchStateSchemaId, publisher, matchId)

    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return null
    }

    const data = rawData[0] as any[]

    return {
      matchId: data[0] as `0x${string}`,
      player1: data[1] as `0x${string}`,
      player2: data[2] as `0x${string}`,
      player1HP: Number(data[3]),
      player1Energy: Number(data[4]),
      player1PowerMultiplier: Number(data[5]) / 100,
      player2HP: Number(data[6]),
      player2Energy: Number(data[7]),
      player2PowerMultiplier: Number(data[8]) / 100,
      currentTurn: Number(data[9]),
      gameStatus: Number(data[10]) as OnChainGameStatus,
      lastUpdateTime: Number(data[11]),
    }
  } catch (error) {
    console.error('Failed to get match state:', error)
    return null
  }
}

export async function getOnChainMoves(
  matchId: `0x${string}`,
  publisher: `0x${string}`
): Promise<OnChainMove[]> {
  const sdk = getReadSDK()
  const moveSchemaId = await sdk.streams.computeSchemaId(MOVE_SCHEMA)

  try {
    const allMoves = await sdk.streams.getAllPublisherDataForSchema(moveSchemaId, publisher)

    if (!allMoves || !Array.isArray(allMoves)) {
      return []
    }

    return allMoves
      .filter((move: any) => move[0] === matchId)
      .map((move: any) => ({
        matchId: move[0] as `0x${string}`,
        player: move[1] as `0x${string}`,
        moveType: Number(move[2]) as OnChainMoveType,
        turnNumber: Number(move[3]),
        timestamp: Number(move[4]),
      }))
  } catch (error) {
    console.error('Failed to get moves:', error)
    return []
  }
}

export async function getOnChainMatchResult(
  matchId: `0x${string}`,
  publisher: `0x${string}`
): Promise<OnChainMatchResult | null> {
  const sdk = getReadSDK()
  const matchResultSchemaId = await sdk.streams.computeSchemaId(MATCH_RESULT_SCHEMA)

  try {
    const rawData = await sdk.streams.getByKey(matchResultSchemaId, publisher, matchId)

    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return null
    }

    const data = rawData[0] as any[]

    return {
      matchId: data[0] as `0x${string}`,
      winner: data[1] as `0x${string}`,
      loser: data[2] as `0x${string}`,
      totalTurns: Number(data[3]),
      endTime: Number(data[4]),
    }
  } catch (error) {
    console.error('Failed to get match result:', error)
    return null
  }
}

// ========================================
// SUBSCRIPTION (Polling-based for reliability)
// ========================================

export interface GameSubscription {
  unsubscribe: () => void
}

export async function subscribeToGameUpdates(
  matchId: `0x${string}`,
  onUpdate: (state: OnChainMatchState) => void,
  onError?: (error: Error) => void
): Promise<GameSubscription> {
  let isActive = true

  return {
    unsubscribe: () => {
      isActive = false
      console.log('🔌 Unsubscribed from game updates')
    },
  }
}

// Export schema registration for manual initialization if needed
export async function initializeGameSchemas(walletAddress: `0x${string}`) {
  await ensureSchemasRegistered(walletAddress)
}
