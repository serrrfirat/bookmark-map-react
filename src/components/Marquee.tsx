import { motion } from 'framer-motion';

interface MarqueeItem {
  id: string;
  img: string;
  title: string;
}

interface MarqueeProps {
  items: MarqueeItem[];
  speed?: number;
  onClick?: (id: string) => void;
}

export function Marquee({ items, speed = 30, onClick }: MarqueeProps) {
  // Double the items for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="w-full overflow-hidden py-12 group">
      <motion.div
        className="flex gap-6"
        animate={{
          x: [0, -50 * items.length + '%'],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: speed,
            ease: 'linear',
          },
        }}
        style={{
          width: `${doubled.length * 280}px`,
        }}
        whileHover={{ animationPlayState: 'paused' }}
      >
        {doubled.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="flex-shrink-0 w-[250px] cursor-pointer"
            data-cursor-hover
            onClick={() => onClick?.(item.id)}
          >
            <div 
              className="aspect-[5/7] overflow-hidden relative"
              style={{
                borderRadius: index % 2 === 0 
                  ? '100px 20px 20px 40px' 
                  : '20px 100px 40px 20px'
              }}
            >
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 hover:!grayscale-0 transition-all duration-700 hover:scale-105"
              />
            </div>
            <p className="mt-4 text-sm font-medium tracking-tight truncate">
              {item.title}
            </p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default Marquee;
