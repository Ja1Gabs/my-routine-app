import React, { useState, useEffect, useRef } from 'react';
import { format, addDays, startOfWeek, isSameDay, isBefore, startOfToday } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import {
  Shuffle,
  Code2,
  Coffee,
  Rocket,
  Music,
  Palette,
  Moon,
  Book,
  Dumbbell,
  Gamepad,
  Heart,
  Briefcase,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutine } from '../../context/RoutineContext';
import DayCard from '../routine/DayCard';
import GlassClock from '../ui/GlassClock';

const ICON_MAP = { Code2, Coffee, Rocket, Music, Palette, Moon, Book, Dumbbell, Gamepad, Heart, Briefcase };
const SHIFT_ORDER = ['morning', 'afternoon', 'night'];
const SHIFT_LABELS = { morning: 'Manha', afternoon: 'Tarde', night: 'Noite' };

const WeekView = () => {
  const { currentWeek, actions, config, t, isShuffling } = useRoutine();
  const today = startOfToday();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  const [expandedDays, setExpandedDays] = useState({});
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentHour(new Date().getHours()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const toggleExpand = (key) => {
    setExpandedDays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const activeShifts = config.routineMode === 'shifts' ? (config.activeShifts?.length > 0 ? config.activeShifts : ['morning']) : ['default'];
  const orderedShifts = config.routineMode === 'shifts' ? SHIFT_ORDER.filter((shift) => activeShifts.includes(shift)) : ['default'];
  const shufflesLeft = config.maxShuffles > 0 ? Math.max(0, config.maxShuffles - (config.shufflesUsed || 0)) : -1;
  const isOutOfShuffles = config.maxShuffles > 0 && shufflesLeft === 0;
  const currentLocale = config.lang === 'en' ? enUS : ptBR;

  const checkIsPast = (dayDate, shift, isTodayDate) => {
    if (isBefore(dayDate, today)) return true;
    if (!isTodayDate) return false;
    if (config.routineMode === 'shifts') {
      if (shift === 'morning' && currentHour >= 12) return true;
      if (shift === 'afternoon' && currentHour >= 18) return true;
    }
    return false;
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
      <div className="premium-panel rounded-[2rem] px-5 py-6 md:px-8 md:py-7">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12">
        <div className="flex-shrink-0 animate-in zoom-in-90 duration-500 delay-100 hidden sm:block">
          <GlassClock />
        </div>

          <div className="flex-1 text-center lg:text-left">
            <p className="eyebrow text-muted-foreground mb-2">Planejamento da semana</p>
            <h2 className="hero-title text-3xl md:text-4xl text-foreground leading-none">Uma semana desenhada para continuar coerente.</h2>
            <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-2xl">
              Veja o que ja esta definido, o que ainda pede energia e o que vale preservar para nao quebrar seu ritmo.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => actions.triggerShuffle()}
            disabled={isShuffling || isOutOfShuffles}
            className={`px-8 py-3 rounded-full flex items-center gap-3 text-sm font-bold shadow-lg transition-all active:scale-95 ${isShuffling || isOutOfShuffles ? 'bg-secondary text-muted-foreground cursor-not-allowed border border-border shadow-none' : 'bg-primary hover:opacity-90 text-primary-foreground shadow-[0_18px_35px_rgba(0,0,0,0.16)]'}`}
          >
            <Shuffle size={18} className={isShuffling ? 'animate-spin' : 'opacity-80'} />
            {isOutOfShuffles ? t('outOfShuffles') : t('shuffle')}
          </button>

          {config.maxShuffles > 0 && (
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary px-2 py-1 rounded-full border border-border">
              {shufflesLeft} {t('shufflesLeft')}
            </span>
          )}
        </div>
      </div>
      </div>

      <div ref={scrollContainerRef} className="custom-scrollbar flex overflow-x-auto pb-10 pt-4 snap-x snap-mandatory gap-6 px-4 scroll-smooth">
        <AnimatePresence>
          {!isShuffling &&
            currentWeek.map((dayData, index) => {
              const dayDate = addDays(startOfCurrentWeek, index);
              const dateStr = format(dayDate, 'yyyy-MM-dd');
              const isTodayDate = isSameDay(today, dayDate);
              const isDayCompletelyPast = isBefore(dayDate, today);

              return (
                <motion.div
                  key={`${dateStr}-${config.shufflesUsed}`}
                  initial={{ opacity: 0, x: 50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25, delay: index * 0.05 }}
                  className={`min-w-[320px] w-[320px] flex-none snap-center flex flex-col gap-4 rounded-[2rem] p-4 transition-colors premium-panel ${isTodayDate ? 'ring-1 ring-primary/25' : ''}`}
                >
                  <div className="text-center mb-2 flex flex-col items-center border-b border-white/6 pb-4">
                    <h3 className={`text-xs font-black uppercase tracking-[0.28em] ${isTodayDate ? 'text-primary' : isDayCompletelyPast ? 'text-muted-foreground opacity-50' : 'text-muted-foreground'}`}>
                      {format(dayDate, 'EEEE', { locale: currentLocale })}
                    </h3>
                    <span className={`text-[11px] font-medium mt-2 ${isDayCompletelyPast ? 'text-muted-foreground opacity-50' : 'text-muted-foreground'}`}>
                      {format(dayDate, 'dd/MM')}
                    </span>
                    {isDayCompletelyPast && (
                      <span className="mt-2 text-destructive flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border border-destructive/30 bg-destructive/10">
                        <Lock size={10} /> {t('pastDay')}
                      </span>
                    )}
                    {isTodayDate && <span className="mt-2 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">{t('today')}</span>}
                  </div>

                  {orderedShifts.map((shift) => {
                    const activities = Array.isArray(dayData?.[shift]) ? dayData[shift] : [];
                    const isShiftPast = checkIsPast(dayDate, shift, isTodayDate);

                    return (
                      <div key={shift} className="space-y-3">
                        {config.routineMode === 'shifts' && (
                          <div className="flex items-center justify-between px-1 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">{SHIFT_LABELS[shift]}</span>
                            <span className="text-[10px] font-medium text-muted-foreground bg-secondary rounded-full px-2 py-1 border border-border">{activities.length} {t('activities')}</span>
                          </div>
                        )}

                        {activities.length === 0 && (
                          <div className="h-24 rounded-2xl border border-dashed border-border bg-secondary/30 opacity-60 flex items-center justify-center">
                            <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">{t('empty')}</span>
                          </div>
                        )}

                        {activities.map((activity, activityIndex) => {
                          const uniqueKey = `${dateStr}_${shift}_${activity.id}_${activityIndex}`;
                          const IconComponent = activity?.iconName && ICON_MAP[activity.iconName] ? ICON_MAP[activity.iconName] : Rocket;

                          return (
                            <DayCard
                              key={uniqueKey}
                              activity={activity}
                              date={dayDate}
                              isToday={isTodayDate}
                              isPast={isShiftPast}
                              isExpanded={!!expandedDays[uniqueKey]}
                              Icon={IconComponent}
                              onToggleExpand={() => toggleExpand(uniqueKey)}
                              dateStr={dateStr}
                              shiftKey={shift}
                              shiftLabel={config.routineMode === 'shifts' ? SHIFT_LABELS[shift] : null}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WeekView;
