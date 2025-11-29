import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useWeb3Store } from '@/store/web3Store';
import { PlayerCard } from './PlayerCard';
import { MoveSelector } from './MoveSelector';
import { BattleLog } from './BattleLog';
import { VictoryScreen } from './VictoryScreen';
import { DamageIndicator } from './DamageIndicator';
import { WalletConnectCompact } from './WalletConnect';
import { getAIMove } from '@/utils/aiLogic';
import { somniaTestnet } from '@/lib/somniaConfig';

export const BattleArena = () => {
  const { 
    gameState, 
    currentTurn, 
    player1, 
    player2, 
    selectMove, 
    battleLog,
    winner,
    isWeb3Mode,
    pendingTxHash,
  } = useGameStore();

  const {
    gameMode,
    isSubmitting,
    matchId,
    lastTxHash,
    submitMove: submitWeb3Move,
    updateGameState: updateWeb3State,
    finishMatch: finishWeb3Match,
    walletAddress,
    opponentAddress,
  } = useWeb3Store();

  const [showDamage, setShowDamage] = useState(false);
  const [damageInfo, setDamageInfo] = useState<{
    player1Damage: number;
    player2Damage: number;
    player1Healing: number;
    player2Healing: number;
  }>({ player1Damage: 0, player2Damage: 0, player1Healing: 0, player2Healing: 0 });

  // AI move selection (only in AI mode)
  useEffect(() => {
    if (gameMode === 'ai' && gameState === 'playing' && player1.isReady && !player2.isReady) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(player2, player1);
        selectMove('player2', aiMove);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [player1.isReady, player2.isReady, gameState, player1, player2, selectMove, gameMode]);

  // Submit move to blockchain when player selects (Web3 mode)
  useEffect(() => {
    if (gameMode === 'pvp' && player1.isReady && player1.currentMove && matchId && walletAddress) {
      submitWeb3Move(player1.currentMove, currentTurn);
    }
  }, [player1.isReady, player1.currentMove, gameMode, matchId, walletAddress, currentTurn, submitWeb3Move]);

  // Update blockchain state after turn resolution (Web3 mode)
  useEffect(() => {
    if (gameMode === 'pvp' && gameState === 'playing' && battleLog.length > 0) {
      const lastLog = battleLog[battleLog.length - 1];
      if (lastLog.turn === currentTurn - 1) {
        // Update on-chain state after turn
        updateWeb3State(
          player1.hp,
          player1.energy,
          player1.powerUpMultiplier,
          player2.hp,
          player2.energy,
          player2.powerUpMultiplier,
          currentTurn,
          false
        );
      }
    }
  }, [battleLog, currentTurn, gameState, gameMode, player1, player2, updateWeb3State]);

  // Finish match on blockchain when game ends (Web3 mode)
  useEffect(() => {
    if (gameMode === 'pvp' && gameState === 'finished' && winner && walletAddress && opponentAddress) {
      const winnerAddress = winner === player1.name ? walletAddress : opponentAddress;
      const loserAddress = winner === player1.name ? opponentAddress : walletAddress;
      finishWeb3Match(winnerAddress, loserAddress, currentTurn - 1);
    }
  }, [gameState, winner, gameMode, walletAddress, opponentAddress, player1.name, currentTurn, finishWeb3Match]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"
        />
        
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
              REALM RUSH
            </h1>
            <div className="flex items-center justify-center gap-4">
              <span className="text-lg text-white font-semibold">
                Turn: {currentTurn}/15
              </span>
              
              {/* Game Mode Badge */}
              <span className={`
                px-3 py-1 rounded-full text-xs font-bold
                ${gameMode === 'pvp' 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                  : gameMode === 'ai'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }
              `}>
                {gameMode === 'pvp' ? '⛓️ ON-CHAIN' : gameMode === 'ai' ? '🤖 VS AI' : '🎮 LOCAL'}
              </span>
              
              {gameState === 'resolving' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-sm text-purple-400 font-medium px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/30"
                >
                  Resolving...
                </motion.span>
              )}
            </div>
          </div>
          
          {/* Wallet Status (compact) */}
          <div className="absolute right-0 top-0">
            <WalletConnectCompact />
          </div>
        </motion.div>

        {/* Web3 Status Bar */}
        <AnimatePresence>
          {gameMode === 'pvp' && (isSubmitting || lastTxHash) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className={`
                flex items-center justify-between p-3 rounded-lg border
                ${isSubmitting 
                  ? 'bg-yellow-500/10 border-yellow-500/30' 
                  : 'bg-green-500/10 border-green-500/30'
                }
              `}>
                <div className="flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                      <span className="text-sm text-yellow-400">
                        Recording on blockchain...
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-green-400">
                        Transaction confirmed
                      </span>
                    </>
                  )}
                </div>
                
                {lastTxHash && (
                  <a
                    href={`${somniaTestnet.blockExplorers.default.url}/tx/${lastTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-purple-400 hover:underline"
                  >
                    View Tx <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Match ID Display */}
        {matchId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 text-center"
          >
            <span className="text-xs text-slate-500 font-mono">
              Match: {matchId.slice(0, 10)}...{matchId.slice(-8)}
            </span>
          </motion.div>
        )}

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
          <MoveSelector player={player1} disabled={isSubmitting} />
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
