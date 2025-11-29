import { motion } from 'framer-motion';

interface DamageIndicatorProps {
  damage: number;
  healing: number;
  position: 'left' | 'right';
}

export const DamageIndicator = ({ damage, healing, position }: DamageIndicatorProps) => {
  const xOffset = position === 'left' ? -30 : 30;
  
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {damage > 0 && (
        <motion.div
          initial={{ y: 0, opacity: 1, scale: 0.5 }}
          animate={{ 
            y: -100, 
            opacity: 0, 
            scale: 1,
            x: xOffset + (Math.random() - 0.5) * 40 
          }}
          transition={{ 
            duration: 1.5, 
            ease: 'easeOut' 
          }}
          className="absolute"
        >
          <span className={`
            text-5xl font-bold text-destructive drop-shadow-[0_2px_8px_rgba(239,68,68,0.8)]
            ${damage > 30 ? 'text-6xl' : ''}
          `}>
            -{damage}
          </span>
        </motion.div>
      )}
      
      {healing > 0 && (
        <motion.div
          initial={{ y: 0, opacity: 1, scale: 0.5 }}
          animate={{ 
            y: -80, 
            opacity: 0, 
            scale: 1,
            x: -xOffset + (Math.random() - 0.5) * 40 
          }}
          transition={{ 
            duration: 1.5, 
            ease: 'easeOut',
            delay: 0.2 
          }}
          className="absolute"
        >
          <span className="text-4xl font-bold text-green-500 drop-shadow-[0_2px_8px_rgba(34,197,94,0.8)]">
            +{healing}
          </span>
        </motion.div>
      )}
    </div>
  );
};
