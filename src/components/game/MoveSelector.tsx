import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Shield, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MoveType, Player } from '@/store/gameStore';
import { useGameStore } from '@/store/gameStore';
import { useWeb3Store } from '@/store/web3Store';

interface MoveSelectorProps {
  player: Player;
  disabled?: boolean;
}

export const MoveSelector = ({ player, disabled: externalDisabled }: MoveSelectorProps) => {
  const { gameState, selectMove } = useGameStore();
  const { isSubmitting, gameMode } = useWeb3Store();
  
  const isDisabled = player.isReady || gameState !== 'playing' || externalDisabled || isSubmitting;

  const moves = [
    {
      type: 'attack' as MoveType,
      icon: Sword,
      label: 'ATTACK',
      cost: 25,
      description: '25 damage',
      gradient: 'from-red-600 to-orange-600',
      hoverGradient: 'hover:from-red-700 hover:to-orange-700',
      shadowColor: 'shadow-red-500/25',
      borderColor: 'border-red-500/30',
    },
    {
      type: 'defend' as MoveType,
      icon: Shield,
      label: 'DEFEND',
      cost: 10,
      description: 'Block 70% + counter',
      gradient: 'from-blue-600 to-cyan-600',
      hoverGradient: 'hover:from-blue-700 hover:to-cyan-700',
      shadowColor: 'shadow-blue-500/25',
      borderColor: 'border-blue-500/30',
    },
    {
      type: 'powerup' as MoveType,
      icon: Zap,
      label: 'POWER-UP',
      cost: 15,
      description: '+0.5x & heal 10',
      gradient: 'from-purple-600 to-pink-600',
      hoverGradient: 'hover:from-purple-700 hover:to-pink-700',
      shadowColor: 'shadow-purple-500/25',
      borderColor: 'border-purple-500/30',
    },
  ];

  const handleMoveSelect = (moveType: MoveType) => {
    if (!isDisabled) {
      selectMove(player.id, moveType);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-xl border border-purple-500/20 shadow-xl">
      <motion.h3
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-center text-2xl font-bold text-white mb-6 flex items-center justify-center gap-3"
      >
        <span>🎯</span>
        CHOOSE YOUR MOVE
        <span>🎯</span>
      </motion.h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {moves.map((move) => {
          const canAfford = player.energy >= move.cost;
          const isSelected = player.currentMove === move.type;
          const buttonDisabled = isDisabled || !canAfford;

          return (
            <motion.div
              key={move.type}
              whileHover={!buttonDisabled ? { scale: 1.03, y: -3 } : {}}
              whileTap={!buttonDisabled ? { scale: 0.97 } : {}}
            >
              <Button
                onClick={() => handleMoveSelect(move.type)}
                disabled={buttonDisabled}
                className={`
                  w-full h-auto p-6 flex flex-col items-center gap-3 relative overflow-hidden
                  ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
                  ${!canAfford ? 'opacity-40 grayscale' : ''}
                  bg-gradient-to-br ${move.gradient} ${move.hoverGradient}
                  shadow-lg ${move.shadowColor}
                  transition-all duration-200
                  disabled:cursor-not-allowed
                  border ${move.borderColor}
                `}
              >
                <move.icon className="w-10 h-10 text-white drop-shadow-lg" />
                <div className="text-center">
                  <div className="font-bold text-lg text-white mb-1 drop-shadow">
                    {move.label}
                  </div>
                  <div className="text-xs text-white/80 mb-2">
                    {move.description}
                  </div>
                  <div className="text-xs font-semibold text-white/90 flex items-center justify-center gap-1 bg-black/20 px-2 py-1 rounded-full">
                    <Zap className="w-3 h-3" />
                    {move.cost} Energy
                  </div>
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <span className="text-xs text-slate-900 font-bold">✓</span>
                  </motion.div>
                )}

                {!canAfford && (
                  <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-xs font-bold text-red-400 px-3 py-1 bg-red-500/20 rounded-full border border-red-500/30">
                      NOT ENOUGH ENERGY
                    </span>
                  </div>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Status Messages */}
      <AnimatePresence mode="wait">
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
              <span className="text-sm font-semibold text-yellow-400">
                Recording move on-chain...
              </span>
            </div>
          </motion.div>
        )}

        {!isSubmitting && isDisabled && !player.isReady && gameState === 'resolving' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center text-sm text-slate-400"
          >
            Resolving turn...
          </motion.div>
        )}

        {player.isReady && !isSubmitting && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-purple-400">
                {gameMode === 'pvp' ? 'Waiting for opponent move...' : 'Waiting for opponent...'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

