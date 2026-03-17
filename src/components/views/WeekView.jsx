import React, { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay, isBefore, startOfToday } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { 
  Shuffle, Code2, Coffee, Rocket, Music, Palette, 
  Moon, Book, Dumbbell, Gamepad, Heart, Briefcase,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutine } from '../../context/RoutineContext';
import DayCard from '../routine/DayCard';

// Mapeamento expandido para evitar erros de ícone faltando
const ICON_MAP = { 
  Code2, Coffee, Rocket, Music, Palette, Moon, 
  Book, Dumbbell, Gamepad, Heart, Briefcase 
};

// ORDEM ESTABELECIDA DOS TURNOS (Sempre Manhã -> Tarde -> Noite)
const SHIFT_ORDER = ['morning', 'afternoon', 'night'];

const WeekView = () => {
  const { currentWeek, history, actions, config, t, isShuffling } = useRoutine();
  const today = startOfToday();
  
  // Define o início da semana sempre na Segunda-feira (weekStartsOn: 1)
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  
  const[expandedDays, setExpandedDays] = useState({});

  const toggleExpand = (key) => {
    setExpandedDays(prev => {
      // Acordeão Único: Fecha todos os outros e abre só o clicado
      const isCurrentlyOpen = prev[key];
      return isCurrentlyOpen ? {} : { [key]: true };
    });
  };

  // Descobre quais turnos renderizar com base no formato escolhido
  const activeShifts = config.routineMode === 'shifts' 
    ? (config.activeShifts?.length > 0 ? config.activeShifts : ['morning']) 
    : ['default'];

  // Filtra e ORDENA estritamente os turnos ativos baseando-se no SHIFT_ORDER
  const orderedShifts = config.routineMode === 'shifts' 
    ? SHIFT_ORDER.filter(s => activeShifts.includes(s)) 
    : ['default'];

  // Define o idioma correto para a formatação do nome dos dias
  const currentLocale = config.lang === 'en' ? enUS : ptBR;

  // --- Controle de Limite de Embaralhos ---
  const shufflesLeft = config.maxShuffles > 0 ? config.maxShuffles - (config.shufflesUsed || 0) : -1;
  const isOutOfShuffles = shufflesLeft === 0;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
      
      {/* HEADER DE AÇÃO: Botão de Shuffle e Contador */}
      <div className="flex flex-col items-center gap-3">
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
          {isOutOfShuffles ? (t('outOfShuffles') || 'Limite Atingido') : (t('shuffleRoutine') || 'Embaralhar Rotina')}
        </button>
        
        {/* Mostrador de Limite de Embaralhos (Visível só se maxShuffles > 0) */}
        {config.maxShuffles > 0 && (
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-secondary px-3 py-1 rounded-md border border-border">
            {shufflesLeft} {t('shufflesLeft') || 'Sorteios Restantes'}
          </span>
        )}
      </div>

      {/* 
        LAYOUT: Carrossel Horizontal
        Resolve o problema dos cards achatados. Os dias viram colunas roláveis no eixo X.
      */}
      <div className="custom-scrollbar flex overflow-x-auto pb-10 pt-4 snap-x snap-mandatory gap-6 px-4 md:px-0">
        <AnimatePresence>
          {/* Oculta o conteúdo e exibe as animações quando o isShuffling ocorre */}
          {!isShuffling && Array.from({ length: 7 }).map((_, index) => {
            const dayData = (currentWeek && currentWeek[index]) ? currentWeek[index] : {};
            const dayDate = addDays(startOfCurrentWeek, index);
            const dateStr = format(dayDate, 'yyyy-MM-dd');
            const isToday = isSameDay(today, dayDate);
            const isPast = isBefore(dayDate, today);
            
            return (
              <motion.div 
                key={`${dateStr}-${config.shufflesUsed || 0}`} // Atualiza a key para forçar a animação ao embaralhar
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 250, damping: 25, delay: index * 0.05 }} // Efeito Cascata
                className={`min-w-[280px] w-[280px] flex-none snap-center flex flex-col gap-4 rounded-3xl p-3 transition-colors ${
                  isToday ? 'bg-primary/5 border border-primary/20 shadow-sm' : ''
                }`}
              >
                {/* Header da Coluna (Nome do Dia) */}
                <div className="text-center mb-2 flex flex-col items-center border-b border-border/50 pb-3">
                  <h3 className={`text-xs font-black uppercase tracking-widest ${
                    isToday ? 'text-primary' : isPast ? 'text-muted-foreground opacity-50' : 'text-foreground'
                  }`}>
                    {format(dayDate, 'EEEE', { locale: currentLocale })}
                  </h3>
                  
                  <span className={`text-[10px] font-medium mt-1 ${isPast ? 'text-muted-foreground opacity-50' : 'text-muted-foreground'}`}>
                    {format(dayDate, 'dd/MM')}
                  </span>
                  
                  {/* Badges do Dia */}
                  {isPast && (
                    <span className="mt-2 text-destructive flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border border-destructive/30 bg-destructive/10">
                      <Lock size={10}/> {t('pastDay') || 'Passado'}
                    </span>
                  )}
                  {isToday && (
                    <span className="mt-2 bg-primary text-primary-foreground text-[9px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                      {t('today') || 'HOJE'}
                    </span>
                  )}
                </div>

                {/* Lista Vertical de Cards (Turnos) */}
                <div className={`flex flex-col gap-4 ${isPast ? 'opacity-70 grayscale-[30%]' : ''}`}>
                  {orderedShifts.map(shift => {
                    const activity = dayData[shift] || null;
                    const uniqueKey = `${dateStr}_${shift}`;
                    
                    // SEGURANÇA: Verificação do ícone com fallback
                    const IconComponent = (activity && ICON_MAP[activity.iconName]) ? ICON_MAP[activity.iconName] : Rocket;
                    const histData = history[uniqueKey] || {};

                    return (
                      <div key={shift} className="relative">
                        <DayCard
                          activity={activity}
                          date={dayDate}
                          isToday={isToday}
                          isPast={isPast} // Passando para o card saber se deve bloquear edições (opcional)
                          isCompleted={!!histData.completed}
                          isExpanded={!!expandedDays[uniqueKey]}
                          Icon={IconComponent}
                          onToggleComplete={() => actions.toggleComplete(dateStr, shift)} // Chave matricial
                          onToggleExpand={() => toggleExpand(uniqueKey)}
                          dateStr={dateStr}
                          shiftKey={shift}
                          shiftLabel={config.routineMode === 'shifts' ? t(shift) : null}
                        />
                      </div>
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