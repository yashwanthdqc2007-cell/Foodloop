import React, { useState, useEffect } from 'react';
import { differenceInMinutes, isPast } from 'date-fns';
import { Clock, AlertTriangle, Flame, Ban } from 'lucide-react';

export const CountdownTimer = ({ deadline }) => {
  const [mins, setMins] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const d = new Date(deadline);
      if (isPast(d)) {
        setExpired(true);
        setMins(0);
      } else {
        setMins(differenceInMinutes(d, new Date()));
        setExpired(false);
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (expired) {
    return <span className="flex items-center gap-1 text-text-muted font-medium text-xs"><Ban size={14}/> Listing closed</span>;
  }

  if (mins <= 15) {
    return <span className="flex items-center gap-1 text-status-danger font-medium text-xs animate-pulse"><Flame size={14}/> {mins} min left</span>;
  }
  
  if (mins <= 60) {
    return <span className="flex items-center gap-1 text-status-warning font-medium text-xs"><AlertTriangle size={14}/> {mins} min left</span>;
  }

  return <span className="flex items-center gap-1 text-brand-primary font-medium text-xs"><Clock size={14}/> {Math.floor(mins/60)}h {mins%60}m left</span>;
};
