import React, { useEffect, useState } from 'react';

const GlassClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  },[]);

  // Cálculo dos ângulos dos ponteiros
  const secondsDegrees = time.getSeconds() * 6;
  const minutesDegrees = time.getMinutes() * 6 + (time.getSeconds() * 0.1);
  const hoursDegrees = (time.getHours() % 12) * 30 + (time.getMinutes() * 0.5);

  return (
    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-border/50 bg-secondary/30 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] flex items-center justify-center">
      
      {/* Marcadores das horas (3, 6, 9, 12) */}
      <div className="absolute top-2 w-1 h-1.5 rounded bg-muted-foreground/50"></div>
      <div className="absolute bottom-2 w-1 h-1.5 rounded bg-muted-foreground/50"></div>
      <div className="absolute left-2 w-1.5 h-1 rounded bg-muted-foreground/50"></div>
      <div className="absolute right-2 w-1.5 h-1 rounded bg-muted-foreground/50"></div>

      {/* Ponto Central */}
      <div className="absolute w-2 h-2 rounded-full bg-primary z-30 shadow-md"></div>
      
      {/* Ponteiro das Horas */}
      <div 
        className="absolute w-1.5 h-7 sm:h-8 bg-foreground rounded-full origin-bottom bottom-1/2 z-20 transition-transform duration-200" 
        style={{ transform: `rotate(${hoursDegrees}deg)` }} 
      />
      
      {/* Ponteiro dos Minutos */}
      <div 
        className="absolute w-1 h-10 sm:h-12 bg-foreground/80 rounded-full origin-bottom bottom-1/2 z-20 transition-transform duration-200" 
        style={{ transform: `rotate(${minutesDegrees}deg)` }} 
      />
      
      {/* Ponteiro dos Segundos */}
      <div 
        className="absolute w-[2px] h-12 sm:h-14 bg-red-500 rounded-full origin-bottom bottom-1/2 z-20" 
        style={{ transform: `rotate(${secondsDegrees}deg)` }} 
      />

      {/* Relógio Digital com Vidro */}
      <div className="absolute top-1/2 mt-5 bg-background/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-black text-foreground border border-border/50 shadow-sm z-30 tracking-widest">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};

export default GlassClock;