import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { ScrollArea } from '@/components/ui/scroll-area';

export const BattleLog = () => {
  const { battleLog, player1, player2 } = useGameStore();

  const getMoveEmoji = (move: string | null) => {
    switch (move) {
      case 'attack': return '⚔️';
      case 'defend': return '🛡️';
      case 'powerup': return '⚡';
      default: return '❓';
    }
  };

  if (battleLog.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card rounded-lg p-4 border-2 border-primary/20 shadow-xl"
    >
      <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
        📜 Battle Log
      </h3>
      
      <ScrollArea className="h-48">
        <div className="space-y-2 pr-4">
          {battleLog.slice().reverse().map((log, index) => (
            <motion.div
              key={`log-${battleLog.length - index}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 bg-muted/20 rounded-lg text-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-primary">Turn {log.turn}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="font-medium text-foreground flex items-center gap-1">
                    <span>{player1.name}</span>
                    <span>{getMoveEmoji(log.player1Move)}</span>
                  </div>
                  {log.player1Damage > 0 && (
                    <div className="text-destructive text-xs">
                      -{log.player1Damage} HP
                    </div>
                  )}
                  {log.player1Healing > 0 && (
                    <div className="text-green-500 text-xs">
                      +{log.player1Healing} HP
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="font-medium text-foreground flex items-center gap-1">
                    <span>{player2.name}</span>
                    <span>{getMoveEmoji(log.player2Move)}</span>
                  </div>
                  {log.player2Damage > 0 && (
                    <div className="text-destructive text-xs">
                      -{log.player2Damage} HP
                    </div>
                  )}
                  {log.player2Healing > 0 && (
                    <div className="text-green-500 text-xs">
                      +{log.player2Healing} HP
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
};
