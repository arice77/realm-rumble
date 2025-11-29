import { motion } from 'framer-motion';

interface EnergyBarProps {
  energy: number;
  maxEnergy: number;
}

export const EnergyBar = ({ energy, maxEnergy }: EnergyBarProps) => {
  const percentage = (energy / maxEnergy) * 100;

  return (
    <div className="relative h-4 bg-muted/30 rounded-full overflow-hidden border border-border">
      <motion.div
        initial={{ width: `${percentage}%` }}
        animate={{ width: `${percentage}%` }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 15,
        }}
        className="h-full bg-gradient-to-r from-chart-1 to-primary relative"
      >
        <motion.div
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
      </motion.div>
    </div>
  );
};
