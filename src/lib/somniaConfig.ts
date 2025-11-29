import { createPublicClient, createWalletClient, http, webSocket, custom } from 'viem'
import { defineChain } from 'viem'

// Define Somnia Testnet Chain
export const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    name: 'STT',
    symbol: 'STT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://dream-rpc.somnia.network'],
      webSocket: ['wss://dream-rpc.somnia.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: 'https://somnia-testnet.socialscan.io',
    },
  },
  testnet: true,
})

// RPC URLs
const HTTP_RPC_URL = 'https://dream-rpc.somnia.network'
const WS_RPC_URL = 'wss://dream-rpc.somnia.network'

// Public client for reading (HTTP)
export function getPublicHttpClient() {
  return createPublicClient({
    chain: somniaTestnet,
    transport: http(HTTP_RPC_URL),
  })
}

// Public client for subscriptions (WebSocket)
export function getPublicWsClient() {
  return createPublicClient({
    chain: somniaTestnet,
    transport: webSocket(WS_RPC_URL),
  })
}

// Ensure wallet is on Somnia network before returning client
export async function ensureSomniaNetwork(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet detected')
  }

  try {
    // Get current chain
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' }) as string
    const currentChainId = parseInt(chainIdHex, 16)
    
    if (currentChainId === somniaTestnet.id) {
      return true // Already on correct network
    }

    console.log(`🔄 Switching from chain ${currentChainId} to Somnia (${somniaTestnet.id})...`)

    // Try to switch
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${somniaTestnet.id.toString(16)}` }],
      })
      console.log('✅ Switched to Somnia Testnet')
      return true
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        console.log('📝 Adding Somnia network to wallet...')
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${somniaTestnet.id.toString(16)}`,
              chainName: somniaTestnet.name,
              nativeCurrency: somniaTestnet.nativeCurrency,
              rpcUrls: [HTTP_RPC_URL],
              blockExplorerUrls: ['https://somnia-testnet.socialscan.io'],
            },
          ],
        })
        console.log('✅ Added and switched to Somnia Testnet')
        return true
      }
      throw switchError
    }
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('Please switch to Somnia Testnet in your wallet to continue')
    }
    throw error
  }
}

// Wallet client for writing (uses browser wallet)
export function getWalletClient(account: `0x${string}`) {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet detected')
  }

  return createWalletClient({
    account,
    chain: somniaTestnet,
    transport: custom(window.ethereum),
  })
}

// Add Somnia network to wallet
export async function addSomniaNetwork() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet detected')
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${somniaTestnet.id.toString(16)}`,
          chainName: somniaTestnet.name,
          nativeCurrency: somniaTestnet.nativeCurrency,
          rpcUrls: [HTTP_RPC_URL],
          blockExplorerUrls: ['https://somnia-testnet.socialscan.io'],
        },
      ],
    })
  } catch (error: any) {
    if (error.code !== 4001) {
      console.error('Failed to add Somnia network:', error)
    }
    throw error
  }
}

// Switch to Somnia network
export async function switchToSomnia() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet detected')
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${somniaTestnet.id.toString(16)}` }],
    })
  } catch (error: any) {
    if (error.code === 4902) {
      await addSomniaNetwork()
    } else {
      throw error
    }
  }
}
