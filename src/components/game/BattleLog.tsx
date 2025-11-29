import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useWeb3Store } from '@/store/web3Store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { somniaTestnet } from '@/lib/somniaConfig';

export const BattleLog = () => {
  const { battleLog, player1, player2 } = useGameStore();
  const { gameMode } = useWeb3Store();

  const getMoveEmoji = (move: string | null) => {
    switch (move) {
      case 'attack': return '⚔️';
      case 'defend': return '🛡️';
      case 'powerup': return '⚡';
      default: return '❓';
    }
  };

  const getMoveColor = (move: string | null) => {
    switch (move) {
      case 'attack': return 'text-red-400';
      case 'defend': return 'text-blue-400';
      case 'powerup': return 'text-purple-400';
      default: return 'text-slate-400';
    }
  };

  if (battleLog.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20 shadow-xl"
    >
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <span>📜</span> Battle Log
        {gameMode === 'pvp' && (
          <span className="text-xs text-purple-400 font-normal ml-2">
            (On-Chain)
          </span>
        )}
      </h3>
      
      <ScrollArea className="h-48">
        <div className="space-y-2 pr-4">
          {battleLog.slice().reverse().map((log, index) => (
            <motion.div
              key={`log-${battleLog.length - index}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-purple-400 text-sm">Turn {log.turn}</span>
                {log.txHash && (
                  <a
                    href={`${somniaTestnet.blockExplorers.default.url}/tx/${log.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-purple-400 transition-colors"
                  >
                    <span className="font-mono">{log.txHash.slice(0, 8)}...</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="font-medium text-white text-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span className="truncate">{player1.name}</span>
                    <span className={getMoveColor(log.player1Move)}>{getMoveEmoji(log.player1Move)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {log.player1Damage > 0 && (
                      <span className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                        -{log.player1Damage} HP
                      </span>
                    )}
                    {log.player1Healing > 0 && (
                      <span className="text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                        +{log.player1Healing} HP
                      </span>
                    )}
                    {log.player1Damage === 0 && log.player1Healing === 0 && (
                      <span className="text-slate-500 text-xs">No damage</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-medium text-white text-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="truncate">{player2.name}</span>
                    <span className={getMoveColor(log.player2Move)}>{getMoveEmoji(log.player2Move)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {log.player2Damage > 0 && (
                      <span className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                        -{log.player2Damage} HP
                      </span>
                    )}
                    {log.player2Healing > 0 && (
                      <span className="text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                        +{log.player2Healing} HP
                      </span>
                    )}
                    {log.player2Damage === 0 && log.player2Healing === 0 && (
                      <span className="text-slate-500 text-xs">No damage</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
};
