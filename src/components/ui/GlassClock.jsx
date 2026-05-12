import React, { useEffect, useMemo, useState } from 'react';

const markers = Array.from({ length: 12 }, (_, index) => index);

const GlassClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsDegrees = time.getSeconds() * 6;
  const minutesDegrees = time.getMinutes() * 6 + time.getSeconds() * 0.1;
  const hoursDegrees = (time.getHours() % 12) * 30 + time.getMinutes() * 0.5;

  const digitalTime = useMemo(
    () => time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    [time],
  );

  const dayLabel = useMemo(
    () =>
      time.toLocaleDateString([], {
        weekday: 'short',
      }),
    [time],
  );

  return (
    <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full border border-white/10 bg-white/6 backdrop-blur-2xl shadow-[0_24px_55px_rgba(0,0,0,0.2)] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.24),transparent_34%),radial-gradient(circle_at_76%_74%,rgba(255,179,102,0.14),transparent_36%)]" />
      <div className="absolute inset-[7px] rounded-full border border-white/10 opacity-90" />
      <div className="absolute inset-[14px] rounded-full border border-white/6 opacity-80" />
      <div className="absolute inset-[18px] rounded-full bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.07),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))]" />

      {markers.map((marker) => {
        const isPrimary = marker % 3 === 0;
        return (
          <div
            key={marker}
            className="absolute left-1/2 top-1/2 origin-center"
            style={{ transform: `translate(-50%, -50%) rotate(${marker * 30}deg)` }}
          >
            <div
              className={`${isPrimary ? 'h-3.5 w-[2.5px]' : 'h-2 w-[1.5px]'} rounded-full ${isPrimary ? 'bg-foreground/42' : 'bg-muted-foreground/35'}`}
              style={{ transform: 'translateY(-50px)' }}
            />
          </div>
        );
      })}

      <div className="absolute top-5 text-[9px] font-black tracking-[0.28em] uppercase text-muted-foreground/90">
        {dayLabel}
      </div>

      <div
        className="absolute w-1.5 h-8 sm:h-9 bg-foreground rounded-full origin-bottom bottom-1/2 z-20 transition-transform duration-200 shadow-[0_0_12px_rgba(255,255,255,0.08)]"
        style={{ transform: `rotate(${hoursDegrees}deg)` }}
      />

      <div
        className="absolute w-1 h-11 sm:h-12 bg-foreground/85 rounded-full origin-bottom bottom-1/2 z-20 transition-transform duration-200"
        style={{ transform: `rotate(${minutesDegrees}deg)` }}
      />

      <div
        className="absolute w-[2px] h-12 sm:h-[3.6rem] bg-gradient-to-b from-amber-300 via-orange-400 to-rose-500 rounded-full origin-bottom bottom-1/2 z-20 shadow-[0_0_12px_rgba(255,140,92,0.35)]"
        style={{ transform: `rotate(${secondsDegrees}deg)` }}
      />

      <div className="absolute w-3 h-3 rounded-full bg-primary z-30 shadow-[0_0_18px_rgba(255,255,255,0.18)] border border-white/20">
        <div className="absolute inset-[3px] rounded-full bg-primary-foreground/16" />
      </div>

      <div className="absolute top-1/2 mt-6 bg-background/84 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-foreground border border-white/10 shadow-sm z-30 tracking-[0.22em]">
        {digitalTime}
      </div>
    </div>
  );
};

export default GlassClock;
