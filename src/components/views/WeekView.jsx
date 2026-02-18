import React, { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { Shuffle, Code2, Coffee, Rocket, Music, Palette, Moon, Book, Dumbbell, Gamepad } from 'lucide-react';
import DayCard from '../routine/DayCard';

const ICON_MAP = { 
  Code2, Coffee, Rocket, Music, Palette, Moon, Book, Dumbbell, Gamepad 
};

const WeekView = ({ routine, completed, onToggleComplete, onShuffle }) => {
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
          onClick={onShuffle}
          className="bg-[#111] hover:bg-[#1a1a1a] text-white border border-white/10 px-6 py-3 rounded-full flex items-center gap-2 text-sm font-medium transition-all shadow-lg active:scale-95"
        >
          <Shuffle size={16} className="text-white/60" />
          Embaralhar Semana
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {routine.map((activity, index) => {
          const dayDate = addDays(startOfCurrentWeek, index);
          const dateStr = format(dayDate, 'yyyy-MM-dd');
          
          return (
            <DayCard
              key={`${dateStr}-${activity.id || index}`}
              activity={activity}
              date={dayDate}
              isToday={isSameDay(today, dayDate)}
              isCompleted={!!completed[dateStr]}
              isExpanded={!!expandedDays[dateStr]}
              Icon={ICON_MAP[activity.iconName] || Rocket}
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