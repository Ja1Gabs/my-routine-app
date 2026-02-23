import React from 'react';
import { BarChart3, Flame, Calendar, LayoutGrid } from 'lucide-react';
import { isSameMonth, parseISO } from 'date-fns';
import { useRoutine } from '../../context/RoutineContext'; // Importar contexto

const StatCard = ({ title, value, icon: Icon, colorClass, borderClass, bgClass }) => (
  // CORREÇÃO: Usando bg-card e border-border para o container base
  <div className={`p-6 rounded-xl border flex flex-col justify-between h-32 transition-all hover:shadow-md bg-card border-border`}>
    <div>
      {/* Ícone e Título com cores específicas (mantendo identidade visual) */}
      <div className={`flex items-center gap-2 mb-1 ${colorClass}`}>
        <Icon size={18} />
        <span className="text-sm font-medium">{title}</span>
      </div>
      {/* Texto principal adapta ao tema (Preto no claro, Branco no escuro) */}
      <div className="text-4xl font-bold text-foreground mt-2">{value}</div>
    </div>
  </div>
);

const StatsPanel = ({ completedDays }) => {
  const { t } = useRoutine(); // Hook de tradução
  const today = new Date();
  
  const totalCompleted = Object.values(completedDays).filter(Boolean).length;
  // Lógica de streak placeholder
  const currentStreak = 0; 
  const thisMonthCount = Object.keys(completedDays).filter(dateStr => {
    return completedDays[dateStr] && isSameMonth(parseISO(dateStr), today);
  }).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title={t('totalCompleted')} 
          value={totalCompleted} 
          icon={BarChart3}
          colorClass="text-blue-500"
        />
        <StatCard 
          title={t('currentStreak')} 
          value={`${currentStreak} ${t('days')}`} 
          icon={Flame}
          colorClass="text-amber-500"
        />
        <StatCard 
          title={t('thisMonth')} 
          value={`${thisMonthCount} ${t('days')}`} 
          icon={Calendar}
          colorClass="text-purple-500"
        />
      </div>

      <div className="p-6 rounded-xl border border-border bg-card flex items-center gap-3 text-muted-foreground h-24">
        <LayoutGrid size={20} />
        <span className="font-medium text-sm">{t('byActivity')}</span>
      </div>
    </div>
  );
};

export default StatsPanel;