import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { Trophy, RotateCcw, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { useWeb3Store } from '@/store/web3Store';
import { somniaTestnet } from '@/lib/somniaConfig';

interface VictoryScreenProps {
  winner: string | null;
}

export const VictoryScreen = ({ winner }: VictoryScreenProps) => {
  const { resetGame, player1, player2, currentTurn } = useGameStore();
  const { gameMode, matchId, lastTxHash, resetWeb3State } = useWeb3Store();

  const handlePlayAgain = () => {
    resetGame();
    resetWeb3State();
  };

  useEffect(() => {
    // Play victory sound here
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        recycle={false}
        numberOfPieces={500}
        gravity={0.3}
        colors={['#a855f7', '#ec4899', '#3b82f6', '#f59e0b', '#10b981']}
      />

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotateY: 180 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="bg-slate-900/90 backdrop-blur-xl p-12 rounded-2xl shadow-2xl max-w-2xl w-full border border-purple-500/30 relative"
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
            <Trophy className="w-32 h-32 text-yellow-500" />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-yellow-500/30 rounded-full blur-xl"
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
          <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent mb-4">
            {winner === 'Draw' ? 'DRAW!' : 'VICTORY!'}
          </h1>
          <p className="text-2xl text-white mb-2">
            {winner === 'Draw' ? 'Both warriors fell in battle!' : `${winner} wins!`}
          </p>
          <p className="text-slate-400">
            Battle lasted {currentTurn - 1} turns
          </p>
        </motion.div>

        {/* On-chain badge for PvP */}
        {gameMode === 'pvp' && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-400">Result recorded on Somnia blockchain</span>
              {lastTxHash && (
                <a
                  href={`${somniaTestnet.blockExplorers.default.url}/tx/${lastTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-purple-400 hover:underline ml-2"
                >
                  View <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-6 mb-8"
        >
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full" />
              {player1.name}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Final HP:</span>
                <span className={`font-semibold ${player1.hp > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {player1.hp}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attacks:</span>
                <span className="font-semibold text-white">
                  {player1.moveHistory.filter(m => m.move === 'attack').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Defends:</span>
                <span className="font-semibold text-white">
                  {player1.moveHistory.filter(m => m.move === 'defend').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Power-Ups:</span>
                <span className="font-semibold text-white">
                  {player1.moveHistory.filter(m => m.move === 'powerup').length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              {player2.name}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Final HP:</span>
                <span className={`font-semibold ${player2.hp > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {player2.hp}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attacks:</span>
                <span className="font-semibold text-white">
                  {player2.moveHistory.filter(m => m.move === 'attack').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Defends:</span>
                <span className="font-semibold text-white">
                  {player2.moveHistory.filter(m => m.move === 'defend').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Power-Ups:</span>
                <span className="font-semibold text-white">
                  {player2.moveHistory.filter(m => m.move === 'powerup').length}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Match ID (for PvP) */}
        {matchId && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-6 text-center"
          >
            <p className="text-xs text-slate-500 font-mono">
              Match ID: {matchId.slice(0, 20)}...{matchId.slice(-8)}
            </p>
          </motion.div>
        )}

        {/* Play again button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handlePlayAgain}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-6 text-lg shadow-lg shadow-purple-500/25"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            PLAY AGAIN
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};
