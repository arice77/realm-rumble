import { useGameStore } from '@/store/gameStore';
import { GameLobby } from '@/components/game/GameLobby';
import { BattleArena } from '@/components/game/BattleArena';

const Index = () => {
  const gameState = useGameStore((state) => state.gameState);

  return (
    <div className="min-h-screen">
      {gameState === 'lobby' ? <GameLobby /> : <BattleArena />}
    </div>
  );
};

export default Index;
