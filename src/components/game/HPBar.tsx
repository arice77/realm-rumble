import { motion } from 'framer-motion';

interface HPBarProps {
  hp: number;
  maxHp: number;
}

export const HPBar = ({ hp, maxHp }: HPBarProps) => {
  const percentage = (hp / maxHp) * 100;
  
  const getColor = () => {
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-destructive';
  };

  return (
    <div className="relative h-6 bg-muted/30 rounded-full overflow-hidden border border-border">
      <motion.div
        initial={{ width: `${percentage}%` }}
        animate={{ width: `${percentage}%` }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 15,
        }}
        className={`h-full ${getColor()} relative`}
      >
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />
      </motion.div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-foreground drop-shadow-md">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};
