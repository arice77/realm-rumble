import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { useEffect } from 'react'
import { somniaTestnet } from '@/lib/somniaConfig'

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors, isPending: isConnectPending, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchPending } = useSwitchChain()

  const isCorrectNetwork = chainId === somniaTestnet.id
  const isPending = isConnecting || isConnectPending || isSwitchPending

  // Auto-switch to Somnia when connected but on wrong network
  useEffect(() => {
    if (isConnected && !isCorrectNetwork && !isSwitchPending) {
      console.log('🔄 Auto-switching to Somnia Testnet...')
      switchToSomnia()
    }
  }, [isConnected, isCorrectNetwork, isSwitchPending])

  const connectWallet = async () => {
    // Try MetaMask first, then any available connector
    const metaMask = connectors.find(c => c.id === 'io.metamask' || c.name.toLowerCase().includes('metamask'))
    const injected = connectors.find(c => c.id === 'injected')
    const connector = metaMask || injected || connectors[0]
    
    if (connector) {
      try {
        await connect({ connector, chainId: somniaTestnet.id })
      } catch (error) {
        console.error('Connection error:', error)
        // If connection fails with chainId, try without
        connect({ connector })
      }
    }
  }

  const switchToSomnia = async () => {
    try {
      // First try to switch
      switchChain({ chainId: somniaTestnet.id })
    } catch (error: any) {
      console.log('Switch failed, trying to add network...', error)
      // If switch fails, try to add the network
      await addSomniaNetwork()
    }
  }

  const addSomniaNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      console.error('No wallet detected')
      return
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${somniaTestnet.id.toString(16)}`,
            chainName: somniaTestnet.name,
            nativeCurrency: somniaTestnet.nativeCurrency,
            rpcUrls: ['https://dream-rpc.somnia.network'],
            blockExplorerUrls: ['https://somnia-testnet.socialscan.io'],
          },
        ],
      })
      console.log('✅ Somnia Testnet added')
    } catch (error: any) {
      if (error.code !== 4001) { // User didn't reject
        console.error('Failed to add network:', error)
      }
    }
  }

  // Format address for display
  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null

  return {
    // State
    address,
    isConnected,
    isCorrectNetwork,
    isPending,
    shortAddress,
    chainId,
    connectError,
    connectors,

    // Actions
    connectWallet,
    disconnect,
    switchToSomnia,
    addSomniaNetwork,
    connect,
  }
}

// Hook for game-specific wallet operations
export function useGameWallet() {
  const wallet = useWallet()

  // Check if wallet is ready for game actions
  const isReady = wallet.isConnected && wallet.isCorrectNetwork && wallet.address

  // Get wallet address with type safety
  const walletAddress = wallet.address as `0x${string}` | undefined

  return {
    ...wallet,
    isReady,
    walletAddress,
  }
}
