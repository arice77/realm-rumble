import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { PlayerCard } from './PlayerCard';
import { MoveSelector } from './MoveSelector';
import { BattleLog } from './BattleLog';
import { VictoryScreen } from './VictoryScreen';
import { DamageIndicator } from './DamageIndicator';
import { getAIMove } from '@/utils/aiLogic';

export const BattleArena = () => {
  const { 
    gameState, 
    currentTurn, 
    player1, 
    player2, 
    selectMove, 
    battleLog,
    winner 
  } = useGameStore();

  const [showDamage, setShowDamage] = useState(false);
  const [damageInfo, setDamageInfo] = useState<{
    player1Damage: number;
    player2Damage: number;
    player1Healing: number;
    player2Healing: number;
  }>({ player1Damage: 0, player2Damage: 0, player1Healing: 0, player2Healing: 0 });

  // AI move selection
  useEffect(() => {
    if (gameState === 'playing' && player1.isReady && !player2.isReady) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(player2, player1);
        selectMove('player2', aiMove);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [player1.isReady, player2.isReady, gameState, player1, player2, selectMove]);

  // Show damage indicators after turn resolution
  useEffect(() => {
    if (gameState === 'resolving' && battleLog.length > 0) {
      const lastLog = battleLog[battleLog.length - 1];
      setDamageInfo({
        player1Damage: lastLog.player1Damage,
        player2Damage: lastLog.player2Damage,
        player1Healing: lastLog.player1Healing,
        player2Healing: lastLog.player2Healing,
      });
      setShowDamage(true);
      
      const timer = setTimeout(() => {
        setShowDamage(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [gameState, battleLog]);

  if (gameState === 'finished') {
    return <VictoryScreen winner={winner} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-card p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            REALM RUSH
          </h1>
          <div className="flex items-center justify-center gap-4">
            <span className="text-lg text-foreground font-semibold">
              Turn: {currentTurn}
            </span>
            {gameState === 'resolving' && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-sm text-primary font-medium px-3 py-1 bg-primary/10 rounded-full"
              >
                Resolving...
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Player Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="relative"
          >
            <PlayerCard player={player1} isOpponent={false} />
            <AnimatePresence>
              {showDamage && (damageInfo.player1Damage > 0 || damageInfo.player1Healing > 0) && (
                <DamageIndicator
                  damage={damageInfo.player1Damage}
                  healing={damageInfo.player1Healing}
                  position="left"
                />
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="relative"
          >
            <PlayerCard player={player2} isOpponent={true} />
            <AnimatePresence>
              {showDamage && (damageInfo.player2Damage > 0 || damageInfo.player2Healing > 0) && (
                <DamageIndicator
                  damage={damageInfo.player2Damage}
                  healing={damageInfo.player2Healing}
                  position="right"
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Move Selector */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <MoveSelector player={player1} />
        </motion.div>

        {/* Battle Log */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <BattleLog />
        </motion.div>
      </div>
    </div>
  );
};
