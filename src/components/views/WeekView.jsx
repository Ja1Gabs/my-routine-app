import React, { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Shuffle, Code2, Coffee, Rocket, Music, Palette, Moon, Book, Dumbbell, Gamepad, Heart, Briefcase } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext'; // Importar contexto
import DayCard from '../routine/DayCard';

// Mapeamento expandido para evitar erros de ícone faltando
const ICON_MAP = { 
  Code2, Coffee, Rocket, Music, Palette, Moon, Book, Dumbbell, Gamepad, Heart, Briefcase
};

const WeekView = ({ routine, completed, onToggleComplete, onShuffle }) => {
  const { t } = useRoutine();
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  const [expandedDays, setExpandedDays] = useState({});

  const toggleExpand = (dateStr) => {
    setExpandedDays(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-center">
        <button 
          onClick={() => onShuffle()} 
          className="bg-primary hover:opacity-90 text-primary-foreground border border-primary/20 px-6 py-3 rounded-full flex items-center gap-2 text-sm font-medium transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          <Shuffle size={16} className="opacity-70" />
          {t('Embaralhar Rotina')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {routine.map((activity, index) => {
          const dayDate = addDays(startOfCurrentWeek, index);
          const dateStr = format(dayDate, 'yyyy-MM-dd');
          
          // SEGURANÇA 1: Se activity for null (buraco), usamos um ID baseado no index
          const uniqueKey = activity?.id ? `${dateStr}-${activity.id}` : `${dateStr}-empty-${index}`;
          
          // SEGURANÇA 2: Verificação segura do ícone (activity?.iconName)
          const IconComponent = (activity && ICON_MAP[activity.iconName]) ? ICON_MAP[activity.iconName] : Rocket;

          return (
            <DayCard
              key={uniqueKey}
              activity={activity}
              date={dayDate}
              isToday={isSameDay(today, dayDate)}
              isCompleted={!!completed[dateStr]}
              isExpanded={!!expandedDays[dateStr]}
              Icon={IconComponent}
              onToggleComplete={() => onToggleComplete(dateStr)}
              onToggleExpand={() => toggleExpand(dateStr)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;