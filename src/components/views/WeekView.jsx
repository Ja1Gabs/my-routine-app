import React, { useState, useEffect, useMemo } from 'react';
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

const WeekView = () => {
  const { currentWeek, history, actions, config, t, isShuffling } = useRoutine();
  const today = startOfToday();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  
  const [expandedDays, setExpandedDays] = useState({});
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  // Atualiza a hora a cada minuto para o bloqueio dinâmico de turnos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Acordeão Único: Fecha outros ao abrir um novo
  const toggleExpand = (key) => {
    setExpandedDays(prev => prev[key] ? {} : { [key]: true });
  };

  // Determina quais turnos exibir com base na configuração
  const orderedShifts = useMemo(() => {
    const activeShifts = config.routineMode === 'shifts' 
      ? (config.activeShifts?.length > 0 ? config.activeShifts : ['morning']) 
      : ['default'];

    return config.routineMode === 'shifts' 
      ? SHIFT_ORDER.filter(s => activeShifts.includes(s)) 
      : ['default'];
  }, [config.routineMode, config.activeShifts]);

  // Lógica de Bloqueio (Passado/Futuro)
  const checkIsPast = (dayDate, shift) => {
    if (isBefore(dayDate, today)) return true; // Dias anteriores
    if (!isSameDay(dayDate, today)) return false; // Dias futuros

    // Se é HOJE, verifica a hora para bloquear turnos específicos
    if (config.routineMode === 'shifts') {
      if (shift === 'morning' && currentHour >= 12) return true;
      if (shift === 'afternoon' && currentHour >= 18) return true;
    }
    return false;
  };

  const currentLocale = config.lang === 'en' ? enUS : ptBR;
  const shufflesLeft = config.maxShuffles > 0 ? config.maxShuffles - (config.shufflesUsed || 0) : -1;
  const isOutOfShuffles = shufflesLeft === 0;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
      
      {/* HEADER: Relógio + Controles */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-12">
        
        <div className="flex-shrink-0 animate-in zoom-in-90 duration-700">
           <GlassClock />
        </div>

        <div className="flex flex-col items-center gap-3">
          <button 
            onClick={() => actions.triggerShuffle()} 
            disabled={isShuffling || isOutOfShuffles}
            className={`
              px-8 py-3 rounded-full flex items-center gap-3 text-sm font-bold shadow-lg transition-all active:scale-95
              ${isShuffling || isOutOfShuffles 
                ? 'bg-secondary text-muted-foreground cursor-not-allowed border border-border' 
                : 'bg-primary hover:opacity-90 text-primary-foreground shadow-primary/20'}
            `}
          >
            <Shuffle size={18} className={isShuffling ? "animate-spin" : "opacity-80"} /> 
            {isOutOfShuffles ? t('outOfShuffles') : (t('shuffleRoutine') || 'Embaralhar')}
          </button>
          
          {config.maxShuffles > 0 && (
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary/50 px-3 py-1 rounded-md border border-border backdrop-blur-sm">
              {shufflesLeft} {t('shufflesLeft') || 'Sorteios Restantes'}
            </span>
          )}
        </div>
      </div>

      {/* CARROSSEL DE DIAS */}
      <div className="custom-scrollbar flex overflow-x-auto pb-10 pt-4 snap-x snap-mandatory gap-6 px-4 md:px-0">
        <AnimatePresence mode='wait'>
          {!isShuffling && Array.from({ length: 7 }).map((_, index) => {
            const dayData = currentWeek?.[index] || {};
            const dayDate = addDays(startOfCurrentWeek, index);
            const dateStr = format(dayDate, 'yyyy-MM-dd');
            const isToday = isSameDay(today, dayDate);
            const isDayPast = isBefore(dayDate, today);
            
            return (
              <motion.div 
                key={`${dateStr}-${config.shufflesUsed}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={`min-w-[280px] w-[280px] flex-none snap-center flex flex-col gap-4 rounded-3xl p-3 transition-colors ${
                  isToday ? 'bg-primary/5 border border-primary/20 shadow-sm' : ''
                }`}
              >
                {/* Cabeçalho do Dia */}
                <div className="text-center mb-2 flex flex-col items-center border-b border-border/50 pb-3">
                  <h3 className={`text-xs font-black uppercase tracking-widest ${
                    isToday ? 'text-primary' : isDayPast ? 'text-muted-foreground opacity-50' : 'text-foreground'
                  }`}>
                    {format(dayDate, 'EEEE', { locale: currentLocale })}
                  </h3>
                  
                  <span className="text-[10px] font-medium mt-1 text-muted-foreground">
                    {format(dayDate, 'dd/MM')}
                  </span>
                  
                  {isDayPast && (
                    <span className="mt-2 text-destructive flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border border-destructive/30 bg-destructive/10">
                      <Lock size={10}/> {t('pastDay')}
                    </span>
                  )}
                  {isToday && (
                    <span className="mt-2 bg-primary text-primary-foreground text-[9px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                      {t('today') || 'HOJE'}
                    </span>
                  )}
                </div>

                {/* Lista de Turnos */}
                <div className={`flex flex-col gap-4 ${isDayPast ? 'opacity-70 grayscale-[30%]' : ''}`}>
                  {orderedShifts.map(shift => {
                    const activity = dayData[shift] || null;
                    const uniqueKey = `${dateStr}_${shift}`;
                    const IconComponent = (activity && ICON_MAP[activity.iconName]) ? ICON_MAP[activity.iconName] : Rocket;
                    const isShiftPast = checkIsPast(dayDate, shift);
                    const isCompleted = !!history[uniqueKey]?.completed;

                    return (
                      <DayCard
                        key={shift}
                        activity={activity}
                        date={dayDate}
                        isToday={isToday}
                        isPast={isShiftPast}
                        isCompleted={isCompleted}
                        isExpanded={!!expandedDays[uniqueKey]}
                        Icon={IconComponent}
                        onToggleComplete={() => actions.toggleComplete(dateStr, shift, activity)}
                        onToggleExpand={() => toggleExpand(uniqueKey)}
                        dateStr={dateStr}
                        shiftKey={shift}
                        shiftLabel={config.routineMode === 'shifts' ? t(shift) : null}
                      />
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WeekView;