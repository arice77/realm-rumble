import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { Trophy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';

interface VictoryScreenProps {
  winner: string | null;
}

export const VictoryScreen = ({ winner }: VictoryScreenProps) => {
  const { resetGame, player1, player2, currentTurn } = useGameStore();

  useEffect(() => {
    // Play victory sound here
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent to-card relative overflow-hidden">
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        recycle={false}
        numberOfPieces={500}
        gravity={0.3}
      />

      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotateY: 180 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="bg-card p-12 rounded-lg shadow-2xl max-w-2xl w-full border-4 border-primary/30 relative"
      >
        {/* Trophy animation */}
        <motion.div
          animate={{
            rotate: [0, -10, 10, -10, 10, 0],
            scale: [1, 1.1, 1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <Trophy className="w-32 h-32 text-primary" />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
            />
          </div>
        </motion.div>

        {/* Winner announcement */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            {winner === 'Draw' ? 'DRAW!' : 'VICTORY!'}
          </h1>
          <p className="text-2xl text-foreground mb-2">
            {winner === 'Draw' ? 'Both warriors fell in battle!' : `${winner} wins!`}
          </p>
          <p className="text-muted-foreground">
            Battle lasted {currentTurn - 1} turns
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-6 mb-8"
        >
          <div className="bg-muted/20 p-4 rounded-lg">
            <h3 className="font-bold text-foreground mb-2">{player1.name}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Final HP:</span>
                <span className="font-semibold text-foreground">{player1.hp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attacks:</span>
                <span className="font-semibold text-foreground">
                  {player1.moveHistory.filter(m => m.move === 'attack').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Defends:</span>
                <span className="font-semibold text-foreground">
                  {player1.moveHistory.filter(m => m.move === 'defend').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Power-Ups:</span>
                <span className="font-semibold text-foreground">
                  {player1.moveHistory.filter(m => m.move === 'powerup').length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-muted/20 p-4 rounded-lg">
            <h3 className="font-bold text-foreground mb-2">{player2.name}</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Final HP:</span>
                <span className="font-semibold text-foreground">{player2.hp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attacks:</span>
                <span className="font-semibold text-foreground">
                  {player2.moveHistory.filter(m => m.move === 'attack').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Defends:</span>
                <span className="font-semibold text-foreground">
                  {player2.moveHistory.filter(m => m.move === 'defend').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Power-Ups:</span>
                <span className="font-semibold text-foreground">
                  {player2.moveHistory.filter(m => m.move === 'powerup').length}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Play again button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={resetGame}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-bold py-6 text-lg"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            PLAY AGAIN
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
