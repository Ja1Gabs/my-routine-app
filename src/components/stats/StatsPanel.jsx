import React from 'react';
import { BarChart3, Flame, Trophy, Check, X, Minus, AlertCircle } from 'lucide-react';
import { format, startOfWeek, addDays, isBefore, startOfToday, isSameDay } from 'date-fns';
import { useRoutine } from '../../context/RoutineContext';

// Componente base para os cards simples (Semanas e Total)
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

const StatsPanel = () => {
  // Puxando tudo diretamente do Contexto (não precisa de props)
  const { t, stats, completedDays } = useRoutine();
  
  // Referências de data
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Semana começa na Segunda
  
  // Array de dias traduzidos (Fallback seguro)
  const weekDaysShort = t('weekDaysShort') ||["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // --- LÓGICA DE URGÊNCIA DO STREAK (GAME FEEL) ---
  const currentHour = today.getHours();
  const todayStr = format(today, 'yyyy-MM-dd');
  const isTodayDone = completedDays[todayStr];
  // Se não fez hoje E já passou das 18h
  const isStreakInDanger = !isTodayDone && currentHour >= 18;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto pb-6 md:pb-8">
      
      {/* RASTREADOR VISUAL DA SEMANA ATUAL */}
      <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-widest">{t('currentWeekTracker')}</h3>
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          {Array.from({ length: 7 }).map((_, i) => {
            const date = addDays(startOfCurrentWeek, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            
            const isCompleted = completedDays[dateStr];
            const isPast = isBefore(date, startOfToday());
            const isTodayDate = isSameDay(date, today);
            
            // Lógica de cores clara para o usuário
            let bgColor = "bg-secondary text-muted-foreground border border-transparent"; // Futuro
            let icon = <Minus size={14} />;
            
            if (isCompleted) {
              bgColor = "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50 shadow-sm";
              icon = <Check size={14} strokeWidth={3} />;
            } else if (isPast) {
              bgColor = "bg-destructive/10 text-destructive border-destructive/30"; // Passou e não fez
              icon = <X size={14} strokeWidth={3} />;
            } else if (isTodayDate) {
              // Se for hoje e estiver em perigo, fica laranja, senão usa a cor primária padrão
              bgColor = isStreakInDanger 
                ? "bg-orange-500/20 text-orange-500 border-orange-500/50 ring-2 ring-orange-500/30 animate-pulse" 
                : "bg-primary/10 text-primary border-primary/50 ring-2 ring-primary/20"; 
            }

            // O weekDaysShort do date-fns começa no Domingo (0), e a nossa semana começa na Segunda (1)
            // Calculamos o índice correto para exibição:
            const displayDayName = Array.isArray(weekDaysShort) ? weekDaysShort[(i + 1) % 7] :["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][(i + 1) % 7];

            return (
              <div key={dateStr} className="flex flex-col items-center gap-2 relative group cursor-default">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{displayDayName}</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${bgColor}`}>
                  {icon}
                </div>
                
                {/* Tooltip escondido para mostrar a data ao passar o mouse */}
                <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold tracking-widest bg-foreground text-background px-2 py-1 rounded z-10 pointer-events-none whitespace-nowrap shadow-md">
                  {format(date, 'dd/MM')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CARDS DE ESTATÍSTICAS E SEQUÊNCIA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* SEQUÊNCIA DIÁRIA (CHAMA DINÂMICA) */}
        <div className={`relative p-6 rounded-xl border flex flex-col justify-between h-32 transition-all shadow-sm overflow-hidden
          ${isStreakInDanger ? 'bg-orange-500/10 border-orange-500/50 ring-1 ring-orange-500/30' : 'bg-card border-border hover:shadow-md'}
        `}>
          {/* Efeito Glow para o perigo */}
          {isStreakInDanger && (
             <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent pointer-events-none animate-pulse" />
          )}
          
          <div className="relative z-10">
            <div className={`flex items-center justify-between mb-1`}>
               <div className={`flex items-center gap-2 ${isStreakInDanger ? 'text-orange-500 font-black' : 'text-orange-500'}`}>
                 {/* Foguinho que treme se tiver em perigo */}
                 <Flame size={18} className={isStreakInDanger ? "animate-pulse" : ""} />
                 <span className="text-sm font-bold uppercase tracking-widest">{t('dailyStreak')}</span>
               </div>
               
               {/* Badges de Status */}
               {isStreakInDanger && (
                 <span className="text-[9px] bg-orange-500 text-white px-2 py-0.5 rounded uppercase font-bold animate-bounce shadow-sm flex items-center gap-1">
                   <AlertCircle size={10} strokeWidth={3}/> {t('dangerZone') || 'Risco'}
                 </span>
               )}
               {isTodayDone && (
                 <span className="text-[9px] bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded uppercase font-bold border border-green-500/30 shadow-sm">
                   {t('streakSafe') || 'Salvo'}
                 </span>
               )}
            </div>
            <div className="text-4xl font-black text-foreground mt-2">{stats?.daily || 0}</div>
          </div>
          
          <div className="text-muted-foreground text-xs font-medium relative z-10">
            {stats?.daily > 0 
              ? (isStreakInDanger ? (t('saveStreak') || "Salve sua sequência hoje!") : "Dias consecutivos") 
              : "Faça uma atividade hoje para iniciar!"}
          </div>
        </div>

        {/* SEMANAS PERFEITAS (TROFÉU) */}
        <StatCard 
          title={t('weeklyStreak')} 
          value={stats?.weekly || 0} 
          subtitle="Semanas com 100% de aproveitamento"
          icon={Trophy}
          colorClass="text-yellow-500"
        />
      </div>

      {/* TOTAL COMPLETADO */}
      <div className="grid grid-cols-1 gap-4">
        <StatCard 
          title={t('totalCompleted')} 
          value={stats?.total || 0} 
          icon={BarChart3}
          colorClass="text-blue-500"
        />
      </div>

    </div>
  );
};

export default StatsPanel;
