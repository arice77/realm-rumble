import { motion } from 'framer-motion';
import { Player } from '@/store/gameStore';
import { HPBar } from './HPBar';
import { EnergyBar } from './EnergyBar';
import { Flame, Shield, Zap } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isOpponent: boolean;
}

export const PlayerCard = ({ player, isOpponent }: PlayerCardProps) => {
  const hpPercentage = (player.hp / player.maxHp) * 100;
  const isLowHp = hpPercentage < 30;

  return (
    <motion.div
      animate={
        isLowHp
          ? {
              boxShadow: [
                '0 0 20px rgba(239, 68, 68, 0.5)',
                '0 0 40px rgba(239, 68, 68, 0.8)',
                '0 0 20px rgba(239, 68, 68, 0.5)',
              ],
            }
          : {}
      }
      transition={{ duration: 1, repeat: isLowHp ? Infinity : 0 }}
      className="bg-card rounded-lg p-6 border-2 border-primary/20 shadow-xl relative overflow-hidden"
    >
      {/* Background gradient effect */}
      <div className={`absolute inset-0 opacity-10 ${isOpponent ? 'bg-gradient-to-br from-secondary to-destructive' : 'bg-gradient-to-br from-primary to-chart-1'}`} />

      <div className="relative z-10">
        {/* Player name and status */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">{player.name}</h2>
          {player.isReady && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-3 py-1 bg-primary/20 rounded-full"
            >
              <span className="text-xs font-semibold text-primary">READY</span>
            </motion.div>
          )}
        </div>

        {/* Stats display */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">HP</span>
            <span className={`text-lg font-bold ${isLowHp ? 'text-destructive' : 'text-foreground'}`}>
              {player.hp}/{player.maxHp}
            </span>
          </div>
          <HPBar hp={player.hp} maxHp={player.maxHp} />

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-chart-1" />
              <span className="text-sm font-medium text-muted-foreground">Energy</span>
            </div>
            <span className="text-sm font-bold text-foreground">
              {player.energy}/{player.maxEnergy}
            </span>
          </div>
          <EnergyBar energy={player.energy} maxEnergy={player.maxEnergy} />
        </div>

        {/* Power-up multiplier */}
        <motion.div
          animate={player.powerUpMultiplier > 1 ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <Flame className={`w-5 h-5 ${player.powerUpMultiplier > 1 ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium text-foreground">Power Boost</span>
          </div>
          <span className={`text-lg font-bold ${player.powerUpMultiplier > 1 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {player.powerUpMultiplier.toFixed(1)}x
          </span>
        </motion.div>

        {/* Current move indicator */}
        {player.currentMove && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-2 bg-primary/10 rounded-lg text-center"
          >
            <span className="text-xs font-semibold text-primary uppercase">
              {player.currentMove === 'attack' && '⚔️ Attack'}
              {player.currentMove === 'defend' && '🛡️ Defend'}
              {player.currentMove === 'powerup' && '⚡ Power-Up'}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
