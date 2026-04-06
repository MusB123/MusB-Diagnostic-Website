import React, { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';

const AnimatedCounter = ({ value, duration = 2, suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // If value is a string with numbers like "$128,450", we need to extract the number
    const numericValue = typeof value === 'number' 
        ? value 
        : parseFloat(value.toString().replace(/[^0-9.-]+/g,"")) || 0;

    const controls = animate(0, numericValue, {
      duration: duration,
      ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for professional feel
      onUpdate(value) {
        setDisplayValue(Math.floor(value));
      }
    });

    return () => controls.stop();
  }, [value, duration]);

  // If the original value had a prefix like "$", handle it
  const prefix = typeof value === 'string' && value.startsWith('$') ? '$' : '';
  
  return (
    <motion.span>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </motion.span>
  );
};

export default AnimatedCounter;
