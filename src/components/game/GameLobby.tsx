import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Gamepad2, Users, Bot, Loader2, ExternalLink, Sparkles, Copy, Check, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGameStore } from '@/store/gameStore';
import { useWeb3Store, type Web3GameMode } from '@/store/web3Store';
import { WalletConnect } from './WalletConnect';
import { useGameWallet } from '@/hooks/useWallet';
import { somniaTestnet } from '@/lib/somniaConfig';

type PvPStep = 'choose' | 'create' | 'join' | 'waiting' | 'ready';

export const GameLobby = () => {
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('AI Opponent');
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  
  // PvP specific state
  const [pvpStep, setPvpStep] = useState<PvPStep>('choose');
  const [joinMatchId, setJoinMatchId] = useState('');
  const [copied, setCopied] = useState(false);
  
  const startGame = useGameStore((state) => state.startGame);
  const setWeb3Mode = useGameStore((state) => state.setWeb3Mode);
  
  const {
    gameMode,
    setGameMode,
    createMatch,
    joinMatch,
    setWalletState,
    isSubmitting,
    error,
    clearError,
    matchId,
    opponentAddress,
    isHost,
  } = useWeb3Store();
  
  const { walletAddress, isConnected, isCorrectNetwork, isReady, shortAddress } = useGameWallet();

  // Sync wallet state to store
  useEffect(() => {
    setWalletState(walletAddress || null, isConnected, isCorrectNetwork);
  }, [walletAddress, isConnected, isCorrectNetwork, setWalletState]);

  // Update player name when wallet connects
  useEffect(() => {
    if (shortAddress && gameMode !== 'local') {
      setPlayer1Name(shortAddress);
    }
  }, [shortAddress, gameMode]);

  // Reset PvP step when mode changes
  useEffect(() => {
    if (gameMode !== 'pvp') {
      setPvpStep('choose');
    }
  }, [gameMode]);

  const handleModeSelect = (mode: Web3GameMode) => {
    setGameMode(mode);
    clearError();
    
    if (mode === 'local') {
      setPlayer1Name('Player 1');
      setPlayer2Name('Player 2');
    } else if (mode === 'ai') {
      setPlayer1Name(shortAddress || 'Player 1');
      setPlayer2Name('AI Opponent');
    } else {
      setPlayer1Name(shortAddress || 'Player 1');
      setPlayer2Name('');
      setPvpStep('choose');
    }
  };

  const handleCreateMatch = async () => {
    if (!isReady || !walletAddress) return;
    
    try {
      setIsCreatingMatch(true);
      clearError();
      
      // Create match with self as player1, opponent TBD
      const newMatchId = await createMatch(walletAddress);
      setPvpStep('waiting');
      
    } catch (err) {
      console.error('Failed to create match:', err);
    } finally {
      setIsCreatingMatch(false);
    }
  };

  const handleJoinMatch = async () => {
    if (!isReady || !walletAddress || !joinMatchId) return;
    
    try {
      setIsCreatingMatch(true);
      clearError();
      
      // Validate match ID format
      if (!joinMatchId.startsWith('0x') || joinMatchId.length !== 66) {
        throw new Error('Invalid Match ID format');
      }
      
      await joinMatch(joinMatchId as `0x${string}`, walletAddress);
      setPvpStep('ready');
      
    } catch (err) {
      console.error('Failed to join match:', err);
    } finally {
      setIsCreatingMatch(false);
    }
  };

  const handleStartPvPGame = () => {
    if (!matchId) return;
    
    setWeb3Mode(true, matchId);
    const opponentName = opponentAddress 
      ? `${opponentAddress.slice(0, 6)}...${opponentAddress.slice(-4)}`
      : 'Opponent';
    startGame(player1Name, opponentName, walletAddress, opponentAddress || undefined);
  };

  const handleStartGame = async () => {
    // For PvP mode with match ready
    if (gameMode === 'pvp' && matchId && (pvpStep === 'ready' || pvpStep === 'waiting')) {
      handleStartPvPGame();
      return;
    }
    
    // Local or AI mode
    startGame(player1Name, player2Name);
  };

  const copyMatchId = () => {
    if (matchId) {
      navigator.clipboard.writeText(matchId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canStartGame = () => {
    if (gameMode === 'local') {
      return player1Name.trim() && player2Name.trim();
    }
    if (gameMode === 'ai') {
      return player1Name.trim();
    }
    if (gameMode === 'pvp') {
      return matchId && (pvpStep === 'ready' || pvpStep === 'waiting');
    }
    return false;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"
        />
        
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-lg w-full border border-purple-500/20 relative z-10"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="inline-block mb-4 relative"
          >
            <Swords className="w-16 h-16 text-purple-400 mx-auto" />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl"
            />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
            REALM RUSH
          </h1>
          <p className="text-slate-400 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Strategic 1v1 Battle Arena on Somnia
            <Sparkles className="w-4 h-4 text-purple-400" />
          </p>
        </motion.div>

        {/* Wallet Connection */}
        <div className="mb-6">
          <WalletConnect />
        </div>

        {/* Game Mode Selection */}
        <div className="mb-6">
          <label className="text-sm font-medium text-slate-300 mb-3 block">
            Select Game Mode
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { mode: 'local' as Web3GameMode, icon: Gamepad2, label: 'Local', desc: '2 Players' },
              { mode: 'ai' as Web3GameMode, icon: Bot, label: 'vs AI', desc: 'Practice' },
              { mode: 'pvp' as Web3GameMode, icon: Users, label: 'PvP', desc: 'On-Chain', web3: true },
            ].map(({ mode, icon: Icon, label, desc, web3 }) => (
              <motion.button
                key={mode}
                onClick={() => handleModeSelect(mode)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={web3 && !isReady}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200
                  ${gameMode === mode
                    ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }
                  ${web3 && !isReady ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${gameMode === mode ? 'text-purple-400' : 'text-slate-400'}`} />
                <div className={`text-sm font-medium ${gameMode === mode ? 'text-purple-300' : 'text-slate-300'}`}>
                  {label}
                </div>
                <div className="text-xs text-slate-500">{desc}</div>
                
                {web3 && (
                  <div className="absolute -top-2 -right-2">
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full">
                      WEB3
                    </span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* PvP Mode UI */}
        <AnimatePresence mode="wait">
          {gameMode === 'pvp' && isReady && (
            <motion.div
              key="pvp-flow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              {/* Step: Choose Create or Join */}
              {pvpStep === 'choose' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400 text-center mb-4">
                    🎮 Play against another player on a different browser/wallet
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => setPvpStep('create')}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-6"
                    >
                      <Swords className="w-5 h-5 mr-2" />
                      Create Match
                    </Button>
                    <Button
                      onClick={() => setPvpStep('join')}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 py-6"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      Join Match
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Create Match */}
              {pvpStep === 'create' && !matchId && (
                <div className="space-y-4">
                  <Button
                    onClick={() => setPvpStep('choose')}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400"
                  >
                    ← Back
                  </Button>
                  <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                    <Swords className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-white mb-2">Create New Match</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Create a match and share the ID with your opponent
                    </p>
                    <Button
                      onClick={handleCreateMatch}
                      disabled={isCreatingMatch || isSubmitting}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {isCreatingMatch || isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Match...
                        </>
                      ) : (
                        'Create Match'
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Waiting for Opponent (after creating) */}
              {(pvpStep === 'waiting' || pvpStep === 'create') && matchId && (
                <div className="space-y-4">
                  <div className="text-center p-6 bg-green-500/10 rounded-xl border border-green-500/30">
                    <Check className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-white mb-2">Match Created!</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Share this Match ID with your opponent:
                    </p>
                    
                    {/* Match ID Display */}
                    <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg mb-4">
                      <code className="flex-1 text-xs text-purple-400 font-mono break-all">
                        {matchId}
                      </code>
                      <Button
                        onClick={copyMatchId}
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-sm text-yellow-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Waiting for opponent to join...
                    </div>
                    
                    <p className="text-xs text-slate-500 mt-4">
                      You can start the game now - opponent can join anytime
                    </p>
                  </div>
                </div>
              )}

              {/* Step: Join Match */}
              {pvpStep === 'join' && !matchId && (
                <div className="space-y-4">
                  <Button
                    onClick={() => setPvpStep('choose')}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400"
                  >
                    ← Back
                  </Button>
                  <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                    <UserPlus className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-white mb-2 text-center">Join Match</h3>
                    <p className="text-sm text-slate-400 mb-4 text-center">
                      Enter the Match ID shared by your opponent
                    </p>
                    <Input
                      value={joinMatchId}
                      onChange={(e) => setJoinMatchId(e.target.value)}
                      placeholder="0x..."
                      className="bg-slate-900 border-slate-700 text-white font-mono text-sm mb-4"
                    />
                    <Button
                      onClick={handleJoinMatch}
                      disabled={!joinMatchId || isCreatingMatch || isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    >
                      {isCreatingMatch || isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Joining Match...
                        </>
                      ) : (
                        'Join Match'
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Ready to Play (after joining) */}
              {pvpStep === 'ready' && matchId && (
                <div className="text-center p-6 bg-blue-500/10 rounded-xl border border-blue-500/30">
                  <Check className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">Joined Match!</h3>
                  <p className="text-sm text-slate-400 mb-2">
                    Match ID: <code className="text-purple-400">{matchId.slice(0, 10)}...{matchId.slice(-8)}</code>
                  </p>
                  <p className="text-sm text-green-400">
                    ✓ Ready to battle!
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Non-PvP Mode Forms */}
          {gameMode !== 'pvp' && (
            <motion.div
              key="standard-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 mb-6"
            >
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  {gameMode === 'local' ? 'Player 1 Name' : 'Your Name'}
                </label>
                <Input
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-slate-800/50 border-slate-700 focus:border-purple-500 text-white placeholder:text-slate-500"
                />
              </div>

              {gameMode === 'local' && (
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Player 2 Name
                  </label>
                  <Input
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    placeholder="Enter player 2 name"
                    className="bg-slate-800/50 border-slate-700 focus:border-purple-500 text-white placeholder:text-slate-500"
                  />
                </div>
              )}

              {gameMode === 'ai' && (
                <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Bot className="w-4 h-4" />
                    <span>You'll battle against an AI opponent</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
            >
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Button */}
        {(gameMode !== 'pvp' || canStartGame()) && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleStartGame}
              disabled={!canStartGame() || isSubmitting || isCreatingMatch}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-6 text-lg shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isCreatingMatch ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </span>
              ) : (
                <>
                  {gameMode === 'pvp' && <span className="mr-2">⛓️</span>}
                  START BATTLE
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* How to Play */}
        <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 text-sm">
          <p className="font-semibold mb-3 text-slate-200 flex items-center gap-2">
            <Swords className="w-4 h-4 text-purple-400" />
            How to Play
          </p>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li className="flex items-start gap-2">
              <span className="text-lg">⚔️</span>
              <span><strong className="text-slate-300">Attack:</strong> Deal 25 damage (costs 25 energy)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">🛡️</span>
              <span><strong className="text-slate-300">Defend:</strong> Block 70% + counterattack (costs 10 energy)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">⚡</span>
              <span><strong className="text-slate-300">Power-Up:</strong> Boost attack +0.5x & heal 10 HP (costs 15 energy)</span>
            </li>
          </ul>
          
          {gameMode === 'pvp' && (
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <p className="text-xs text-purple-400 flex items-center gap-1">
                <span>🔗</span>
                All moves recorded on Somnia blockchain
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
