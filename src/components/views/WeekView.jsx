import React, { useState, useEffect, useRef } from 'react';
import { format, addDays, startOfWeek, isSameDay, isBefore, startOfToday } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { 
  Shuffle, Code2, Coffee, Rocket, Music, Palette, 
  Moon, Book, Dumbbell, Gamepad, Heart, Briefcase, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutine } from '../../context/RoutineContext';
import DayCard from '../routine/DayCard';
import GlassClock from '../ui/GlassClock';

// Mapeamento de ícones para evitar falhas de renderização
const ICON_MAP = { 
  Code2, Coffee, Rocket, Music, Palette, Moon, 
  Book, Dumbbell, Gamepad, Heart, Briefcase 
};

const SHIFT_ORDER = ['morning', 'afternoon', 'night'];
const SHIFT_LABELS = { morning: 'Manhã', afternoon: 'Tarde', night: 'Noite' };

const WeekView = () => {
  const { currentWeek, history, actions, config, t, isShuffling } = useRoutine();
  const today = startOfToday();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  
  const [expandedDays, setExpandedDays] = useState({});
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  
  // REF para a barra de rolagem
  const scrollContainerRef = useRef(null);

  // Atualiza a hora para travar os turnos em tempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentHour(new Date().getHours()), 60000); // 1 minuto
    return () => clearInterval(timer);
  }, []);

  // --- O TRUQUE MÁGICO: Scroll Vertical vira Horizontal ---
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // Se for um trackpad (que já manda movimento horizontal nativo), ignora a nossa lógica
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // Impede a página inteira de rolar para baixo e move o nosso carrossel para o lado
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    };

    // Usamos { passive: false } para poder usar o e.preventDefault() sem dar erro no navegador
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);
  // --------------------------------------------------------

  const toggleExpand = (key) => setExpandedDays(prev => ({ [key]: !prev[key] }));

  const activeShifts = config.routineMode === 'shifts' ? (config.activeShifts?.length > 0 ? config.activeShifts : ['morning']) : ['default'];
  const orderedShifts = config.routineMode === 'shifts' ? SHIFT_ORDER.filter(s => activeShifts.includes(s)) : ['default'];

  const shufflesLeft = config.maxShuffles > 0 ? Math.max(0, config.maxShuffles - (config.shufflesUsed || 0)) : -1;
  const isOutOfShuffles = config.maxShuffles > 0 && shufflesLeft === 0;

  const currentLocale = config.lang === 'en' ? enUS : ptBR;

  const checkIsPast = (dayDate, shift, isTodayDate) => {
    if (isBefore(dayDate, today)) return true; 
    if (!isTodayDate) return false; 

    if (config.routineMode === 'shifts') {
      if (shift === 'morning' && currentHour >= 12) return true; 
      if (shift === 'afternoon' && currentHour >= 18) return true; 
      return false; 
    }
    
    return false; 
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-16">
        <div className="flex-shrink-0 animate-in zoom-in-90 duration-500 delay-100 hidden sm:block">
           <GlassClock />
        </div>

        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={() => actions.triggerShuffle()} 
            disabled={isShuffling || isOutOfShuffles}
            className={`
              px-8 py-3 rounded-full flex items-center gap-3 text-sm font-bold shadow-lg transition-all active:scale-95
              ${isShuffling || isOutOfShuffles 
                ? 'bg-secondary text-muted-foreground cursor-not-allowed border border-border shadow-none' 
                : 'bg-primary hover:opacity-90 text-primary-foreground shadow-primary/20'}
            `}
          >
            <Shuffle size={18} className={isShuffling ? "animate-spin" : "opacity-80"} /> 
            {isOutOfShuffles ? t('outOfShuffles') : t('shuffle')}
          </button>
          
          {config.maxShuffles > 0 && (
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary px-2 py-1 rounded-md border border-border">
              {shufflesLeft} {t('shufflesLeft')}
            </span>
          )}
        </div>
      </div>

      {/* APLICAMOS O REF AQUI NESSE CONTAINER */}
      <div 
        ref={scrollContainerRef}
        className="custom-scrollbar flex overflow-x-auto pb-10 pt-4 snap-x snap-mandatory gap-6 px-4 scroll-smooth"
      >
        <AnimatePresence>
          {!isShuffling && currentWeek.map((dayData, index) => {
            const dayDate = addDays(startOfCurrentWeek, index);
            const dateStr = format(dayDate, 'yyyy-MM-dd');
            const isToday = isSameDay(today, dayDate);
            const isDayCompletelyPast = isBefore(dayDate, today); 
            
            return (
              <motion.div 
                key={`${dateStr}-${config.shufflesUsed}`}
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25, delay: index * 0.05 }}
                className={`min-w-[280px] w-[280px] flex-none snap-center flex flex-col gap-4 rounded-3xl p-3 transition-colors ${isToday ? 'bg-primary/5 border border-primary/20' : ''}`}
              >
                <div className="text-center mb-2 flex flex-col items-center">
                  <h3 className={`text-xs font-black uppercase tracking-widest ${isToday ? 'text-primary' : isDayCompletelyPast ? 'text-muted-foreground opacity-50' : 'text-muted-foreground'}`}>
                    {format(dayDate, 'EEEE', { locale: currentLocale })}
                  </h3>
                  <span className={`text-[10px] font-medium mt-1 ${isDayCompletelyPast ? 'text-muted-foreground opacity-50' : 'text-muted-foreground'}`}>
                    {format(dayDate, 'dd/MM')}
                  </span>
                  {isDayCompletelyPast && <span className="mt-2 text-destructive flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border border-destructive/30 bg-destructive/10"><Lock size={10}/> {t('pastDay')}</span>}
                  {isToday && <span className="mt-2 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">HOJE</span>}
                </div>

                {orderedShifts.map(shift => {
                  const activity = dayData ? dayData[shift] : null;
                  const uniqueKey = `${dateStr}_${shift}`;
                  const IconComponent = (activity && ICON_MAP[activity.iconName]) ? ICON_MAP[activity.iconName] : Rocket;
                  const histData = history[uniqueKey] || {};
                  const isShiftPast = checkIsPast(dayDate, shift, isToday);

                  return (
                    <DayCard
                      key={shift}
                      activity={activity}
                      date={dayDate}
                      isToday={isToday}
                      isPast={isShiftPast}
                      isCompleted={!!histData.completed}
                      isExpanded={!!expandedDays[uniqueKey]}
                      Icon={IconComponent}
                      onToggleComplete={() => actions.toggleComplete(dateStr, shift, activity)}
                      onToggleExpand={() => toggleExpand(uniqueKey)}
                      dateStr={dateStr}
                      shiftKey={shift}
                      shiftLabel={config.routineMode === 'shifts' ? SHIFT_LABELS[shift] : null} 
                    />
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