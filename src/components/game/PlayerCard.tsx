import { motion } from 'framer-motion';
import { Player } from '@/store/gameStore';
import { HPBar } from './HPBar';
import { EnergyBar } from './EnergyBar';
import { Flame, Shield, Zap, Swords } from 'lucide-react';

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
                '0 0 20px rgba(239, 68, 68, 0.3)',
                '0 0 40px rgba(239, 68, 68, 0.5)',
                '0 0 20px rgba(239, 68, 68, 0.3)',
              ],
            }
          : {}
      }
      transition={{ duration: 1, repeat: isLowHp ? Infinity : 0 }}
      className={`
        bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border-2 shadow-xl relative overflow-hidden
        ${isOpponent ? 'border-blue-500/30' : 'border-purple-500/30'}
      `}
    >
      {/* Background gradient effect */}
      <div className={`
        absolute inset-0 opacity-10
        ${isOpponent 
          ? 'bg-gradient-to-br from-blue-600 to-cyan-600' 
          : 'bg-gradient-to-br from-purple-600 to-pink-600'
        }
      `} />

      <div className="relative z-10">
        {/* Player name and status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isOpponent ? 'bg-blue-500' : 'bg-purple-500'}`} />
            <h2 className="text-xl font-bold text-white">{player.name}</h2>
          </div>
          {player.isReady && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30"
            >
              <span className="text-xs font-semibold text-green-400">READY</span>
            </motion.div>
          )}
        </div>

        {/* Stats display */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400 flex items-center gap-1">
              <span className="text-lg">❤️</span> HP
            </span>
            <span className={`text-lg font-bold ${isLowHp ? 'text-red-400' : 'text-white'}`}>
              {player.hp}/{player.maxHp}
            </span>
          </div>
          <HPBar hp={player.hp} maxHp={player.maxHp} />

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-slate-400">Energy</span>
            </div>
            <span className="text-sm font-bold text-white">
              {player.energy}/{player.maxEnergy}
            </span>
          </div>
          <EnergyBar energy={player.energy} maxEnergy={player.maxEnergy} />
        </div>

        {/* Power-up multiplier */}
        <motion.div
          animate={player.powerUpMultiplier > 1 ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          className={`
            flex items-center justify-between p-3 rounded-lg
            ${player.powerUpMultiplier > 1 
              ? 'bg-orange-500/20 border border-orange-500/30' 
              : 'bg-slate-800/50 border border-slate-700/50'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <Flame className={`w-5 h-5 ${player.powerUpMultiplier > 1 ? 'text-orange-400' : 'text-slate-500'}`} />
            <span className="text-sm font-medium text-slate-300">Power Boost</span>
          </div>
          <span className={`text-lg font-bold ${player.powerUpMultiplier > 1 ? 'text-orange-400' : 'text-slate-500'}`}>
            {player.powerUpMultiplier.toFixed(1)}x
          </span>
        </motion.div>

        {/* Status effects */}
        {(player.hasAttackBuff || player.consecutiveAttacks >= 1) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {player.hasAttackBuff && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/30"
              >
                <Swords className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400 font-medium">+50% Next ATK</span>
              </motion.div>
            )}
            {player.consecutiveAttacks >= 1 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full border border-red-500/30"
              >
                <Shield className="w-3 h-3 text-red-400" />
                <span className="text-xs text-red-400 font-medium">Fatigue -30%</span>
              </motion.div>
            )}
          </div>
        )}

        {/* Current move indicator */}
        {player.currentMove && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              mt-4 p-2 rounded-lg text-center
              ${player.currentMove === 'attack' ? 'bg-red-500/20 border border-red-500/30' : ''}
              ${player.currentMove === 'defend' ? 'bg-blue-500/20 border border-blue-500/30' : ''}
              ${player.currentMove === 'powerup' ? 'bg-purple-500/20 border border-purple-500/30' : ''}
            `}
          >
            <span className={`
              text-sm font-semibold uppercase
              ${player.currentMove === 'attack' ? 'text-red-400' : ''}
              ${player.currentMove === 'defend' ? 'text-blue-400' : ''}
              ${player.currentMove === 'powerup' ? 'text-purple-400' : ''}
            `}>
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
