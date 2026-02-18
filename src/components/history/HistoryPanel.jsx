import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HistoryPanel = ({ completedDays }) => {
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  
  // Gera todos os dias do mês
  const daysInMonth = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });
  
  // Padding para o dia da semana (0 = Domingo)
  const startDayIndex = getDay(currentMonthStart); 

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto">
      {/* Calendário */}
      <div className="p-6 rounded-xl border border-white/10 bg-[#121212]">
        {/* Header do Calendário */}
        <div className="flex items-center justify-between mb-6 px-2">
          <ChevronLeft className="text-white/20 hover:text-white cursor-pointer" size={20} />
          <h2 className="text-lg font-bold capitalize text-white">
            {format(today, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <ChevronRight className="text-white/20 hover:text-white cursor-pointer" size={20} />
        </div>

        {/* Dias da Semana */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-xs font-bold text-white/30 uppercase tracking-wider py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grid de Dias */}
        <div className="grid grid-cols-7 gap-2">
          {/* Espaços vazios antes do dia 1 */}
          {Array.from({ length: startDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

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
                    ? 'bg-white text-black border-white' 
                    : isCompleted 
                      ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                  }
                `}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="flex gap-4 mt-6 text-xs text-white/40 px-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/10 border border-green-500/30"></div> 
            Completado
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-white/5 border border-white/10"></div> 
            Registrado
          </div>
        </div>
      </div>

      {/* Lista de Histórico (Estática baseada no print) */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white px-1">Histórico de Semanas</h3>
        
        {/* Item de Histórico */}
        <div className="p-4 rounded-xl border border-white/10 bg-[#121212] flex flex-col gap-3">
          <div className="text-xs text-white/40 font-medium">Semana de 09/02/2026</div>
          <div className="grid grid-cols-7 gap-1">
             {/* Exemplo visual de mini-atividades */}
             {['blue', 'amber', 'emerald', 'emerald', 'purple', 'pink', 'slate'].map((color, i) => (
               <div key={i} className="h-1 rounded-full w-full bg-white/10 overflow-hidden">
                  <div className={`h-full w-full bg-${color}-500/50`}></div>
               </div>
             ))}
          </div>
          <div className="flex justify-between text-[10px] text-white/30">
             <span>Seg: Programação</span>
             <span>Ter: Folga</span>
             <span>Qua: Projeto</span>
             <span>...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPanel;