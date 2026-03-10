import React from 'react';
import { BarChart3, Flame, Trophy, Check, X, Minus } from 'lucide-react';
import { format, startOfWeek, addDays, isBefore, startOfToday, isSameDay } from 'date-fns';
import { useRoutine } from '../../context/RoutineContext';

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
  <div className="p-6 rounded-xl border border-border bg-card flex flex-col justify-between h-32 transition-all hover:shadow-md">
    <div>
      <div className={`flex items-center gap-2 mb-1 ${colorClass}`}>
        <Icon size={18} />
        <span className="text-sm font-bold uppercase tracking-widest">{title}</span>
      </div>
      <div className="text-4xl font-black text-foreground mt-2">{value}</div>
    </div>
    {subtitle && <div className="text-muted-foreground text-xs font-medium">{subtitle}</div>}
  </div>
);

const StatsPanel = ({ completedDays = {} }) => {
  const { t, stats } = useRoutine();
  
  // Lógica para o Rastreador da Semana Atual
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  const weekDaysShort = t('weekDaysShort') ||["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto pb-20">
      
      {/* Rastreador Visual da Semana Atual */}
      <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4">{t('currentWeekTracker')}</h3>
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          {Array.from({ length: 7 }).map((_, i) => {
            const date = addDays(startOfCurrentWeek, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const isCompleted = completedDays[dateStr];
            const isPast = isBefore(date, startOfToday());
            const isTodayDate = isSameDay(date, today);
            
            // Lógica de cores super clara para o usuário
            let bgColor = "bg-secondary text-muted-foreground border border-transparent"; // Futuro
            let icon = <Minus size={14} />;
            
            if (isCompleted) {
              bgColor = "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50 shadow-sm";
              icon = <Check size={14} strokeWidth={3} />;
            } else if (isPast) {
              bgColor = "bg-destructive/10 text-destructive border-destructive/30"; // Passou e não fez
              icon = <X size={14} strokeWidth={3} />;
            } else if (isTodayDate) {
              bgColor = "bg-primary/10 text-primary border-primary/50 ring-2 ring-primary/20"; // É hoje
            }

            // O dia da semana da array (Ajuste para bater com o startOfWeek=1 que é Segunda)
            // weekDaysShort padrão do date-fns começa no Domingo (0), então precisamos ajustar o índice
            const displayDayName = weekDaysShort[(i + 1) % 7];

            return (
              <div key={dateStr} className="flex flex-col items-center gap-2 relative group">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{displayDayName}</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${bgColor}`}>
                  {icon}
                </div>
                
                {/* Tooltip escondido para mostrar a data ao passar o mouse */}
                <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] bg-foreground text-background px-2 py-1 rounded">
                  {format(date, 'dd/MM')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cards de Sequência */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sequência de Dias (Chama) */}
        <StatCard 
          title={t('dailyStreak')} 
          value={stats.daily} 
          subtitle={stats.daily > 0 ? "Dias consecutivos" : "Faça uma atividade hoje para iniciar!"}
          icon={Flame}
          colorClass="text-orange-500"
        />

        {/* Semanas Perfeitas (Troféu) */}
        <StatCard 
          title={t('weeklyStreak')} 
          value={stats.weekly} 
          subtitle="Semanas com 100% de aproveitamento"
          icon={Trophy}
          colorClass="text-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <StatCard 
          title={t('totalCompleted')} 
          value={stats.total} 
          icon={BarChart3}
          colorClass="text-blue-500"
        />
      </div>

    </div>
  );
};

export default StatsPanel;