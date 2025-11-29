import { motion } from 'framer-motion';
import { Wallet, Loader2, Check, AlertCircle, ExternalLink, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { somniaTestnet } from '@/lib/somniaConfig';

export const WalletConnect = () => {
  const {
    address,
    isConnected,
    isCorrectNetwork,
    isPending,
    shortAddress,
    connectWallet,
    disconnect,
    switchToSomnia,
    addSomniaNetwork,
    connectError,
    chainId,
  } = useWallet();

  // Not connected state
  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-3"
      >
        <Button
          onClick={connectWallet}
          disabled={isPending}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 rounded-lg flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-5 h-5" />
              Connect to Somnia Testnet
            </>
          )}
        </Button>

        {/* Network Info */}
        <div className="text-center text-xs text-slate-500">
          <p>Chain ID: {somniaTestnet.id} | Network: {somniaTestnet.name}</p>
        </div>

        {connectError && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-destructive text-sm mt-2 text-center"
          >
            {connectError.message}
          </motion.p>
        )}
      </motion.div>
    );
  }

  // Connected but wrong network
  if (!isCorrectNetwork) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-3"
      >
        <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <span className="text-sm text-red-400 font-medium block">Wrong Network!</span>
              <span className="text-xs text-slate-500">Current: Chain {chainId}</span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{shortAddress}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={switchToSomnia}
            disabled={isPending}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Switching...
              </>
            ) : (
              'Switch Network'
            )}
          </Button>
          
          <Button
            onClick={addSomniaNetwork}
            variant="outline"
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Network
          </Button>
        </div>

        {/* Manual add instructions */}
        <div className="p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400">
          <p className="font-medium text-slate-300 mb-2">Manual Setup:</p>
          <ul className="space-y-1">
            <li><span className="text-purple-400">Network:</span> Somnia Testnet</li>
            <li><span className="text-purple-400">RPC:</span> https://dream-rpc.somnia.network</li>
            <li><span className="text-purple-400">Chain ID:</span> 50312</li>
            <li><span className="text-purple-400">Currency:</span> STT</li>
          </ul>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => disconnect()}
          className="w-full text-xs text-slate-500 hover:text-red-400"
        >
          Disconnect Wallet
        </Button>
      </motion.div>
    );
  }

  // Connected to correct network
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <div>
            <span className="text-sm text-green-400 font-medium block">Connected to Somnia</span>
            <span className="text-xs text-slate-500">Chain ID: {somniaTestnet.id}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono text-foreground">{shortAddress}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => disconnect()}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            ×
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
        <Check className="w-3 h-3 text-green-500" />
        <span>{somniaTestnet.name}</span>
        <a
          href={`${somniaTestnet.blockExplorers.default.url}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:underline"
        >
          Explorer <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
};

// Compact version for header
export const WalletConnectCompact = () => {
  const {
    isConnected,
    isCorrectNetwork,
    isPending,
    shortAddress,
    connectWallet,
    disconnect,
    switchToSomnia,
  } = useWallet();

  if (!isConnected) {
    return (
      <Button
        onClick={connectWallet}
        disabled={isPending}
        size="sm"
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Wallet className="w-4 h-4 mr-1" />
            Connect
          </>
        )}
      </Button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <Button
        onClick={switchToSomnia}
        disabled={isPending}
        size="sm"
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <AlertCircle className="w-4 h-4 mr-1" />
            Wrong Network
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm font-mono text-foreground">{shortAddress}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => disconnect()}
        className="text-xs text-muted-foreground hover:text-destructive"
      >
        ×
      </Button>
    </div>
  );
};
