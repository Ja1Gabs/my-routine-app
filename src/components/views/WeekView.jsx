import React, { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay, isBefore, startOfToday } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { 
  Shuffle, Code2, Coffee, Rocket, Music, Palette, 
  Moon, Book, Dumbbell, Gamepad, Heart, Briefcase 
} from 'lucide-react';
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
  const { currentWeek, history, actions, config, t } = useRoutine();
  const today = startOfToday();
  
  // Define o início da semana sempre na Segunda-feira (weekStartsOn: 1)
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  
  const [expandedDays, setExpandedDays] = useState({});

  const toggleExpand = (key) => {
    setExpandedDays(prev => {
      // Acordeão Único: Fecha todos os outros e abre só o clicado 
      // (melhora a experiência no celular e evita que a tela fique infinita)
      const isCurrentlyOpen = prev[key];
      return isCurrentlyOpen ? {} : { [key]: true };
    });
  };

  // Descobre quais turnos renderizar com base no formato escolhido (Simples ou Turnos)
  const activeShifts = config.routineMode === 'shifts' 
    ? (config.activeShifts?.length > 0 ? config.activeShifts : ['morning']) 
    : ['default'];

  // Filtra e ORDENA estritamente os turnos ativos baseando-se no SHIFT_ORDER
  const orderedShifts = config.routineMode === 'shifts' 
    ? SHIFT_ORDER.filter(s => activeShifts.includes(s)) 
    : ['default'];

  // Define o idioma correto para a formatação do nome dos dias e rótulos
  const currentLocale = config.lang === 'en' ? enUS : ptBR;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Botão Superior de Shuffle */}
      <div className="flex justify-center">
        <button 
          onClick={() => actions.shuffleWeek()} 
          className="bg-primary hover:opacity-90 text-primary-foreground px-8 py-3 rounded-full flex items-center gap-3 text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <Shuffle size={18} className="opacity-80" /> 
          {t('shuffleRoutine') || t('shuffle') || 'Embaralhar Rotina'}
        </button>
      </div>

      {/* 
        LAYOUT: Carrossel Horizontal
        Resolve o problema dos cards achatados. Os dias viram colunas roláveis no eixo X.
      */}
      <div className="flex overflow-x-auto pb-10 pt-4 snap-x snap-mandatory gap-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent px-4 md:px-0">
        
        {Array.from({ length: 7 }).map((_, index) => {
          const dayData = currentWeek[index] || {}; // Puxa da matriz com fallback de segurança
          const dayDate = addDays(startOfCurrentWeek, index);
          const dateStr = format(dayDate, 'yyyy-MM-dd');
          const isToday = isSameDay(today, dayDate);
          const isPast = isBefore(dayDate, today);
          
          return (
            <div 
              key={dateStr} 
              // Largura fixa para a coluna do dia (não amassa os cards)
              className={`min-w-[280px] w-[280px] flex-none snap-center flex flex-col gap-4 rounded-3xl p-3 transition-colors ${
                isToday ? 'bg-primary/5 border border-primary/20 shadow-sm' : 
                isPast ? 'opacity-70 grayscale-[30%]' : '' // Dias passados ficam levemente apagados
              }`}
            >
              {/* Header da Coluna (Nome do Dia) */}
              <div className="text-center mb-2 flex flex-col items-center border-b border-border/50 pb-3">
                <h3 className={`text-xs font-black uppercase tracking-widest ${isToday ? 'text-primary' : 'text-foreground'}`}>
                  {format(dayDate, 'EEEE', { locale: currentLocale })}
                </h3>
                <span className="text-[10px] text-muted-foreground font-medium mt-1">
                  {format(dayDate, 'dd/MM')}
                </span>
                {isToday && (
                  <span className="mt-2 bg-primary text-primary-foreground text-[9px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                    {t('today')}
                  </span>
                )}
              </div>

              {/* Lista Vertical de Cards (Turnos) */}
              <div className="flex flex-col gap-4">
                {orderedShifts.map(shift => {
                  const activity = dayData[shift] || null;
                  const uniqueKey = `${dateStr}_${shift}`;
                  
                  // SEGURANÇA: Verificação do ícone com fallback para o Rocket
                  const IconComponent = (activity && ICON_MAP[activity.iconName]) ? ICON_MAP[activity.iconName] : Rocket;
                  
                  // Pega os dados do histórico para este turno específico
                  const histData = history[uniqueKey] || {};

                  return (
                    <DayCard
                      key={uniqueKey}
                      activity={activity}
                      date={dayDate}
                      isToday={isToday}
                      isCompleted={!!histData.completed}
                      isExpanded={!!expandedDays[uniqueKey]}
                      Icon={IconComponent}
                      onToggleComplete={() => actions.toggleComplete(dateStr, shift)} // Chave matricial
                      onToggleExpand={() => toggleExpand(uniqueKey)}
                      dateStr={dateStr}
                      shiftKey={shift}
                      shiftLabel={config.routineMode === 'shifts' ? t(shift) : null} // Envia o nome do turno traduzido para o DayCard exibir, se necessário
                    />
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;