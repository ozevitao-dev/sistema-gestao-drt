'use client';
import { useState, useEffect, useRef } from 'react';

export default function CountUp({ end, duration = 1000, prefix = '', suffix = '', decimals = 0 }: {
  end: number; duration?: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const endVal = end ?? 0;

  useEffect(() => {
    let start = 0;
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / (duration ?? 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (endVal - start) * eased;
      setCount(current);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [endVal, duration]);

  return <span ref={ref}>{prefix}{(count ?? 0)?.toFixed?.(decimals ?? 0) ?? '0'}{suffix}</span>;
}
