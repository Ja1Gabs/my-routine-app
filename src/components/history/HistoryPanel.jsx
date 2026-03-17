import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarX2, CheckCircle2, FileText, Image as ImageIcon, Sun, CloudSun, MoonStar, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutine } from '../../context/RoutineContext';

const SHIFT_ICONS = {
  morning: <Sun size={16} className="text-yellow-500" />,
  afternoon: <CloudSun size={16} className="text-orange-500" />,
  night: <MoonStar size={16} className="text-indigo-500" />,
  default: <CheckCircle2 size={16} className="text-primary" />
};

const SHIFT_LABELS = { morning: 'Manhã', afternoon: 'Tarde', night: 'Noite', default: 'Geral' };

const HistoryPanel = ({ completedDays = {} }) => {
  const { t, config, history } = useRoutine();
  const today = new Date();
  
  // Estados de Navegação e Seleção
  const [viewingMonth, setViewingMonth] = useState(startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(format(today, 'yyyy-MM-dd'));

  // Cálculos do Calendário
  const currentMonthStart = startOfMonth(viewingMonth);
  const currentMonthEnd = endOfMonth(viewingMonth);
  const daysInMonth = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });
  const startDayIndex = getDay(currentMonthStart); 
  
  const dateLocale = config.lang === 'en' ? enUS : ptBR;
  const translatedDays = t('weekDaysShort');
  const weekDays = Array.isArray(translatedDays) ? translatedDays :["D", "S", "T", "Q", "Q", "S", "S"];

  // Funções de Navegação
  const handlePrevMonth = () => setViewingMonth(subMonths(viewingMonth, 1));
  const handleNextMonth = () => setViewingMonth(addMonths(viewingMonth, 1));

  // Puxar os dados do dia selecionado do objeto de histórico global
  // Ex: Procura chaves como "2026-03-17_morning", "2026-03-17_afternoon"
  const getDayDetails = (dateStr) => {
    const shifts = ['morning', 'afternoon', 'night', 'default'];
    let details =[];

    shifts.forEach(shift => {
      const key = `${dateStr}_${shift}`;
      const shiftData = history[key];
      
      // Se houver qualquer interação salva neste turno, nós mostramos
      if (shiftData && (shiftData.completed || shiftData.notes || shiftData.image || (shiftData.tasks && shiftData.tasks.length > 0))) {
        details.push({ shift, ...shiftData });
      }
    });
    return details;
  };

  const selectedDayDetails = getDayDetails(selectedDate);
  const formattedSelectedDate = format(parseISO(selectedDate), "EEEE, d 'de' MMMM", { locale: dateLocale });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto pb-20">
      
      {/* 1. O CALENDÁRIO */}
      <div className="p-6 rounded-3xl border border-border bg-card shadow-sm transition-colors">
        
        {/* Header do Calendário */}
        <div className="flex items-center justify-between mb-6 px-2">
          <button onClick={handlePrevMonth} className="p-2 bg-secondary hover:bg-border rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-95">
            <ChevronLeft size={20} />
          </button>
          
          <h2 className="text-xl font-black capitalize text-foreground tracking-tight">
            {format(viewingMonth, 'MMMM yyyy', { locale: dateLocale })}
          </h2>
          
          <button onClick={handleNextMonth} className="p-2 bg-secondary hover:bg-border rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-95">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Dias da Semana */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
          {weekDays.map((day, i) => (
            <div key={i} className="text-[10px] font-black text-muted-foreground uppercase tracking-widest py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grid de Dias */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}

          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isCompleted = completedDays[dateStr];
            const isCurrentDay = isToday(day);
            const isSelected = selectedDate === dateStr;

            return (
              <button 
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`
                  aspect-square relative rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all
                  hover:scale-105 active:scale-95
                  ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border border-transparent'}
                  ${isCompleted 
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/20' 
                    : 'bg-secondary text-foreground hover:bg-border'
                  }
                  ${isCurrentDay && !isCompleted ? 'bg-primary/10 text-primary border-primary/20' : ''}
                `}
              >
                {format(day, 'd')}
                {/* Ponto indicativo de hoje */}
                {isCurrentDay && <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. PAINEL DE INSPEÇÃO (Raio-X do Dia) */}
      <div>
        <h3 className="text-sm font-bold text-foreground px-2 mb-3 capitalize">
          {formattedSelectedDate}
        </h3>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate} // Força re-render da animação ao trocar o dia
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {selectedDayDetails.length === 0 ? (
              // Empty State (Dia sem registros)
              <div className="p-8 rounded-3xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center text-muted-foreground">
                <CalendarX2 size={40} className="opacity-20 mb-3" strokeWidth={1} />
                <p className="text-sm font-medium">{t('noRecords')}</p>
              </div>
            ) : (
              // Lista de Registros do Dia
              selectedDayDetails.map((detail, index) => (
                <div key={index} className="p-5 rounded-3xl border border-border bg-card shadow-sm flex flex-col gap-4">
                  
                  {/* Cabeçalho do Registro (Turno e Status) */}
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      {SHIFT_ICONS[detail.shift]}
                      <span className="font-bold text-foreground text-sm uppercase tracking-wider">
                        {t('shift')} {SHIFT_LABELS[detail.shift]}
                      </span>
                    </div>
                    {detail.completed && (
                      <span className="flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 size={12} /> {t('completedLegend')}
                      </span>
                    )}
                  </div>

                  {/* Tarefas Concluídas */}
                  {detail.tasks && detail.tasks.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                        <CheckSquare size={12} /> {t('tasksCompleted')}
                      </div>
                      <div className="space-y-1.5">
                        {detail.tasks.map(task => (
                          <div key={task.id} className="flex items-start gap-2 bg-secondary/50 p-2 rounded-lg">
                            <CheckCircle2 size={14} className={task.completed ? "text-green-500 shrink-0 mt-0.5" : "text-muted-foreground/30 shrink-0 mt-0.5"} />
                            <span className={`text-xs ${task.completed ? 'text-foreground line-through opacity-70' : 'text-foreground'}`}>
                              {task.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Anotações */}
                  {detail.notes && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                        <FileText size={12} /> {t('notes')}
                      </div>
                      <div className="text-xs text-foreground bg-secondary/50 p-3 rounded-xl italic border-l-2 border-primary">
                        "{detail.notes}"
                      </div>
                    </div>
                  )}

                  {/* Imagem */}
                  {detail.image && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                        <ImageIcon size={12} /> {t('proofImage')}
                      </div>
                      <img src={detail.image} alt="Prova" className="w-full max-h-48 object-cover rounded-xl border border-border" />
                    </div>
                  )}

                </div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HistoryPanel;