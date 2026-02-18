import React from 'react';
import { BarChart3, Flame, Calendar, LayoutGrid } from 'lucide-react';
import { isSameMonth, parseISO } from 'date-fns';

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, borderClass, bgClass }) => (
  <div className={`p-6 rounded-xl border ${borderClass} ${bgClass} flex flex-col justify-between h-32`}>
    <div>
      <div className={`flex items-center gap-2 mb-1 ${colorClass}`}>
        <Icon size={18} />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-4xl font-bold text-white mt-2">{value}</div>
    </div>
    {subtitle && <div className="text-white/40 text-xs">{subtitle}</div>}
  </div>
);

const StatsPanel = ({ completedDays }) => {
  const today = new Date();
  
  // 1. Total Completado
  const totalCompleted = Object.values(completedDays).filter(Boolean).length;

  // 2. Cálculo de Sequência (Streak) - Lógica simplificada
  // (Num app real, iteraríamos para trás a partir de hoje)
  const currentStreak = 0; // Placeholder para lógica complexa

  // 3. Este Mês
  const thisMonthCount = Object.keys(completedDays).filter(dateStr => {
    return completedDays[dateStr] && isSameMonth(parseISO(dateStr), today);
  }).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Cards Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Total Completado" 
          value={totalCompleted} 
          icon={BarChart3}
          colorClass="text-blue-400"
          bgClass="bg-blue-950/20"
          borderClass="border-blue-500/20"
        />
        <StatCard 
          title="Sequência Atual" 
          value={`${currentStreak} dias`} 
          icon={Flame}
          colorClass="text-amber-400"
          bgClass="bg-amber-950/20"
          borderClass="border-amber-500/20"
        />
        <StatCard 
          title="Este Mês" 
          value={`${thisMonthCount} dias`} 
          icon={Calendar}
          colorClass="text-purple-400"
          bgClass="bg-purple-950/20"
          borderClass="border-purple-500/20"
        />
      </div>

      {/* Seção Inferior (Placeholder para Gráficos Futuros) */}
      <div className="p-6 rounded-xl border border-white/10 bg-[#121212] flex items-center gap-3 text-white/40 h-24">
        <LayoutGrid size={20} />
        <span className="font-medium text-sm">Por Atividade (Total)</span>
      </div>
    </div>
  );
};

export default StatsPanel;