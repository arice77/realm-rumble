import { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGameStore } from '@/store/gameStore';

export const GameLobby = () => {
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('AI Opponent');
  const startGame = useGameStore((state) => state.startGame);

  const handleStartGame = () => {
    startGame(player1Name, player2Name);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent to-card">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card p-8 rounded-lg shadow-2xl max-w-md w-full border-2 border-primary/20"
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="inline-block mb-4"
          >
            <Swords className="w-16 h-16 text-primary mx-auto" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            REALM RUSH
          </h1>
          <p className="text-muted-foreground">Strategic 1v1 Battle Arena</p>
        </motion.div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Your Name
            </label>
            <Input
              value={player1Name}
              onChange={(e) => setPlayer1Name(e.target.value)}
              placeholder="Enter your name"
              className="bg-background border-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Opponent
            </label>
            <Input
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              placeholder="AI Opponent"
              className="bg-background border-primary/30 focus:border-primary"
            />
          </div>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleStartGame}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-bold py-6 text-lg"
          >
            START BATTLE
          </Button>
        </motion.div>

        <div className="mt-6 p-4 bg-muted/20 rounded-lg text-sm text-muted-foreground">
          <p className="font-semibold mb-2">How to Play:</p>
          <ul className="space-y-1 text-xs">
            <li>⚔️ <strong>Attack:</strong> Deal 25 damage (costs 20 energy)</li>
            <li>🛡️ <strong>Defend:</strong> Reduce incoming damage by 70% (costs 10 energy)</li>
            <li>⚡ <strong>Power-Up:</strong> Boost attack +0.5x & heal 10 HP (costs 15 energy)</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};
