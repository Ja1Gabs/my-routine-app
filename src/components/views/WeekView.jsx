import React, { useState, useEffect } from 'react';
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
  CalendarRange,
  Layers3,
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentHour(new Date().getHours()), 60000);
    return () => clearInterval(timer);
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

  const weeklyActivityCount = currentWeek.reduce(
    (sum, day) => sum + Object.values(day || {}).reduce((daySum, slot) => daySum + (Array.isArray(slot) ? slot.length : 0), 0),
    0,
  );
  const lockedDaysCount = currentWeek.reduce((sum, _, index) => {
    const dayDate = addDays(startOfCurrentWeek, index);
    return sum + (isBefore(dayDate, today) ? 1 : 0);
  }, 0);

  return (
    <div className="space-y-6 md:space-y-8 pb-2 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_340px]">
        <div className="premium-panel rounded-[2rem] px-5 py-6 md:px-7 md:py-7 overflow-hidden relative">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_58%)]" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex flex-shrink-0 animate-in zoom-in-90 duration-500 delay-100">
                <GlassClock />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="premium-tile rounded-full px-3 py-1.5 text-[11px] font-bold text-foreground/90">
                    Planejamento da semana
                  </span>
                  <span className="premium-tile rounded-full px-3 py-1.5 text-[11px] font-bold text-foreground/90">
                    {config.routineMode === 'shifts' ? 'Ritmo por turnos' : 'Ritmo simples'}
                  </span>
                </div>

                <h2 className="hero-title text-2xl sm:text-3xl md:text-4xl text-foreground leading-[0.95]">
                  Um panorama mais claro, sem apertar a sua semana em um carrossel.
                </h2>
                <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-2xl">
                  Agora a semana respira melhor em qualquer tela: leitura vertical no mobile, mais densidade no desktop e menos atrito para expandir cada atividade.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-stretch sm:items-center gap-2 sm:min-w-[220px]">
              <button
                onClick={() => actions.triggerShuffle()}
                disabled={isShuffling || isOutOfShuffles}
                className={`px-8 py-3 rounded-full flex items-center justify-center gap-3 text-sm font-bold shadow-lg transition-all active:scale-95 ${
                  isShuffling || isOutOfShuffles
                    ? 'bg-secondary text-muted-foreground cursor-not-allowed border border-border shadow-none'
                    : 'bg-primary hover:opacity-90 text-primary-foreground shadow-[0_18px_35px_rgba(0,0,0,0.16)]'
                }`}
              >
                <Shuffle size={18} className={isShuffling ? 'animate-spin' : 'opacity-80'} />
                {isOutOfShuffles ? t('outOfShuffles') : t('shuffle')}
              </button>

              {config.maxShuffles > 0 && (
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary px-3 py-1.5 rounded-full border border-border text-center">
                  {shufflesLeft} {t('shufflesLeft')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="premium-tile rounded-[1.5rem] p-4 min-h-[108px]">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <CalendarRange size={15} />
              <p className="eyebrow">Semana</p>
            </div>
            <p className="text-2xl font-black text-foreground">{weeklyActivityCount}</p>
            <p className="text-sm text-muted-foreground mt-2">atividades distribuidas</p>
          </div>

          <div className="premium-tile rounded-[1.5rem] p-4 min-h-[108px]">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Layers3 size={15} />
              <p className="eyebrow">Turnos</p>
            </div>
            <p className="text-2xl font-black text-foreground">{orderedShifts.length}</p>
            <p className="text-sm text-muted-foreground mt-2">blocos ativos no modo atual</p>
          </div>

          <div className="premium-tile rounded-[1.5rem] p-4 min-h-[108px]">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Lock size={15} />
              <p className="eyebrow">Travados</p>
            </div>
            <p className="text-2xl font-black text-foreground">{lockedDaysCount}</p>
            <p className="text-sm text-muted-foreground mt-2">dias ja fechados pela linha do tempo</p>
          </div>

          <div className="premium-tile rounded-[1.5rem] p-4 min-h-[108px]">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Coffee size={15} />
              <p className="eyebrow">Ritmo</p>
            </div>
            <p className="text-2xl font-black text-foreground">{config.maxActivitiesPerSlot}</p>
            <p className="text-sm text-muted-foreground mt-2">cartas por bloco</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-5">
        <AnimatePresence>
          {!isShuffling &&
            currentWeek.map((dayData, index) => {
              const dayDate = addDays(startOfCurrentWeek, index);
              const dateStr = format(dayDate, 'yyyy-MM-dd');
              const isTodayDate = isSameDay(today, dayDate);
              const isDayCompletelyPast = isBefore(dayDate, today);
              const dailyCount = Object.values(dayData || {}).reduce((sum, slot) => sum + (Array.isArray(slot) ? slot.length : 0), 0);

              return (
                <motion.div
                  key={`${dateStr}-${config.shufflesUsed}`}
                  initial={{ opacity: 0, y: 28, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24, delay: index * 0.045 }}
                  className={`premium-panel rounded-[2rem] p-4 md:p-5 flex flex-col gap-4 transition-colors ${isTodayDate ? 'ring-1 ring-primary/25 shadow-[0_24px_55px_rgba(0,0,0,0.16)]' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-white/6 pb-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-xs font-black uppercase tracking-[0.28em] ${isTodayDate ? 'text-primary' : isDayCompletelyPast ? 'text-muted-foreground opacity-50' : 'text-muted-foreground'}`}>
                          {format(dayDate, 'EEEE', { locale: currentLocale })}
                        </h3>
                        {isTodayDate && (
                          <span className="bg-primary text-primary-foreground text-[9px] font-bold px-2 py-1 rounded-full shadow-sm">
                            {t('today')}
                          </span>
                        )}
                      </div>

                      <span className={`text-[11px] font-medium mt-2 block ${isDayCompletelyPast ? 'text-muted-foreground opacity-50' : 'text-muted-foreground'}`}>
                        {format(dayDate, 'dd/MM')}
                      </span>

                      {isDayCompletelyPast && (
                        <span className="mt-3 inline-flex text-destructive items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-full border border-destructive/30 bg-destructive/10">
                          <Lock size={10} /> {t('pastDay')}
                        </span>
                      )}
                    </div>

                    <div className="premium-tile rounded-[1rem] px-3 py-2 text-right min-w-[92px]">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground mb-1">Carga</p>
                      <p className="text-lg font-black text-foreground">{dailyCount}</p>
                    </div>
                  </div>

                  {orderedShifts.map((shift) => {
                    const activities = Array.isArray(dayData?.[shift]) ? dayData[shift] : [];
                    const isShiftPast = checkIsPast(dayDate, shift, isTodayDate);

                    return (
                      <div key={shift} className="space-y-3">
                        {config.routineMode === 'shifts' && (
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                              {SHIFT_LABELS[shift]}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground bg-secondary rounded-full px-2 py-1 border border-border">
                              {activities.length} {t('activities')}
                            </span>
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
      </section>
    </div>
  );
};

export default WeekView;
