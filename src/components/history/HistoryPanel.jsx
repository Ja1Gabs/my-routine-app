import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';

const HistoryPanel = ({ completedDays }) => {
  const { t, config } = useRoutine();
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });
  const startDayIndex = getDay(currentMonthStart); 
  
  const dateLocale = config.lang === 'en' ? enUS : ptBR;
  
  // SEGURANÇA: Garante que weekDays seja sempre um array, mesmo se a tradução falhar
  const translatedDays = t('weekDaysShort');
  const weekDays = Array.isArray(translatedDays) 
    ? translatedDays 
    : ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto">
      <div className="p-6 rounded-xl border border-border bg-card shadow-sm transition-colors">
        
        <div className="flex items-center justify-between mb-6 px-2">
          <ChevronLeft className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors" size={20} />
          <h2 className="text-lg font-bold capitalize text-foreground">
            {format(today, 'MMMM yyyy', { locale: dateLocale })}
          </h2>
          <ChevronRight className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors" size={20} />
        </div>

        {/* Dias da Semana */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
          {weekDays.map((day, i) => (
            <div key={i} className="text-xs font-bold text-muted-foreground uppercase tracking-wider py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}

          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isCompleted = completedDays[dateStr];
            const isCurrentDay = isSameDay(today, day);

            return (
              <div 
                key={dateStr}
                className={`
                  aspect-square rounded-lg flex items-center justify-center text-sm font-medium border transition-all
                  ${isCurrentDay 
                    ? 'bg-primary text-primary-foreground border-primary shadow-md font-bold' 
                    : isCompleted 
                      ? 'bg-green-500/20 border-green-500/30 text-green-600 dark:text-green-400' 
                      : 'bg-secondary border-border text-muted-foreground hover:bg-border'
                  }
                `}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 mt-6 text-xs text-muted-foreground px-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/50"></div> 
            {t('completedLegend')}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-secondary border border-border"></div> 
            {t('registeredLegend')}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground px-1">{t('historyTitle')}</h3>
        <div className="p-4 rounded-xl border border-border bg-card flex flex-col gap-3 opacity-60">
          <div className="text-xs text-muted-foreground font-medium">{t('example')} ({t('lastWeek')})</div>
          <div className="grid grid-cols-7 gap-1">
             {['blue', 'amber', 'emerald', 'emerald', 'purple', 'pink', 'slate'].map((color, i) => (
               <div key={i} className="h-1 rounded-full w-full bg-secondary overflow-hidden">
                  <div className={`h-full w-full bg-${color}-500 opacity-80`}></div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;