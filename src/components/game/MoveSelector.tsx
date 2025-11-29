import { motion } from 'framer-motion';
import { Sword, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MoveType, Player } from '@/store/gameStore';
import { useGameStore } from '@/store/gameStore';

interface MoveSelectorProps {
  player: Player;
}

export const MoveSelector = ({ player }: MoveSelectorProps) => {
  const { gameState, selectMove } = useGameStore();
  const isDisabled = player.isReady || gameState !== 'playing';

  const moves = [
    {
      type: 'attack' as MoveType,
      icon: Sword,
      label: 'ATTACK',
      cost: 20,
      description: '25 damage',
      color: 'from-destructive to-destructive/80',
      disabled: false,
    },
    {
      type: 'defend' as MoveType,
      icon: Shield,
      label: 'DEFEND',
      cost: 10,
      description: 'Reduce 70% dmg',
      color: 'from-chart-1 to-primary',
      disabled: false,
    },
    {
      type: 'powerup' as MoveType,
      icon: Zap,
      label: 'POWER-UP',
      cost: 15,
      description: '+0.5x & heal 10',
      color: 'from-chart-2 to-chart-1',
      disabled: false,
    },
  ];

  const handleMoveSelect = (moveType: MoveType) => {
    if (!isDisabled) {
      selectMove(player.id, moveType);
      // Play sound effect here
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg border-2 border-primary/20 shadow-xl">
      <motion.h3
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-center text-2xl font-bold text-foreground mb-6"
      >
        🎯 CHOOSE YOUR MOVE 🎯
      </motion.h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {moves.map((move) => {
          const canAfford = player.energy >= move.cost;
          const isSelected = player.currentMove === move.type;
          const buttonDisabled = isDisabled || !canAfford;

          return (
            <motion.div
              key={move.type}
              whileHover={!buttonDisabled ? { scale: 1.05, y: -5 } : {}}
              whileTap={!buttonDisabled ? { scale: 0.95 } : {}}
            >
              <Button
                onClick={() => handleMoveSelect(move.type)}
                disabled={buttonDisabled}
                className={`
                  w-full h-auto p-6 flex flex-col items-center gap-3 relative overflow-hidden
                  ${isSelected ? 'ring-4 ring-primary' : ''}
                  ${!canAfford ? 'opacity-50 grayscale' : ''}
                  bg-gradient-to-br ${move.color}
                  hover:opacity-90 transition-all duration-200
                  disabled:cursor-not-allowed
                `}
              >
                <move.icon className="w-12 h-12 text-primary-foreground" />
                <div className="text-center">
                  <div className="font-bold text-lg text-primary-foreground mb-1">
                    {move.label}
                  </div>
                  <div className="text-xs text-primary-foreground/80 mb-2">
                    {move.description}
                  </div>
                  <div className="text-xs font-semibold text-primary-foreground/90 flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3" />
                    {move.cost} Energy
                  </div>
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                  >
                    <span className="text-xs text-primary-foreground">✓</span>
                  </motion.div>
                )}

                {!canAfford && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <span className="text-xs font-bold text-destructive">
                      NOT ENOUGH ENERGY
                    </span>
                  </div>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {isDisabled && !player.isReady && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center text-sm text-muted-foreground"
        >
          Waiting for turn to complete...
        </motion.div>
      )}

      {player.isReady && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <div className="inline-block px-4 py-2 bg-primary/20 rounded-lg">
            <span className="text-sm font-semibold text-primary">
              ⏳ Waiting for opponent...
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
