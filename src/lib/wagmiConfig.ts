import { createConfig, http } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { somniaTestnet } from './somniaConfig'

// WalletConnect Project ID - Replace with your own in production
const WALLETCONNECT_PROJECT_ID = 'a52b91c7af57ef10e2a0e3d1b3cbe5c3'

export const wagmiConfig = createConfig({
  chains: [somniaTestnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'Realm Rush',
        description: 'Strategic 1v1 Battle Arena on Somnia',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons: ['https://avatars.githubusercontent.com/u/37784886'],
      },
    }),
  ],
  transports: {
    [somniaTestnet.id]: http('https://dream-rpc.somnia.network'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}

