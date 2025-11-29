import { motion } from 'framer-motion';

interface HPBarProps {
  hp: number;
  maxHp: number;
}

export const HPBar = ({ hp, maxHp }: HPBarProps) => {
  const percentage = (hp / maxHp) * 100;
  
  const getColor = () => {
    if (percentage > 60) return 'from-green-500 to-emerald-500';
    if (percentage > 30) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const getShadow = () => {
    if (percentage > 60) return 'shadow-green-500/50';
    if (percentage > 30) return 'shadow-yellow-500/50';
    return 'shadow-red-500/50';
  };

  return (
    <div className="relative h-5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
      <motion.div
        initial={{ width: `${percentage}%` }}
        animate={{ width: `${percentage}%` }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 15,
        }}
        className={`h-full bg-gradient-to-r ${getColor()} relative shadow-lg ${getShadow()}`}
      >
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />
      </motion.div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};
