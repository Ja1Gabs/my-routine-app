import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarX2, CheckCircle2, FileText, Image as ImageIcon, Sun, CloudSun, MoonStar, CheckSquare, X } from 'lucide-react';
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
  
  const[viewingMonth, setViewingMonth] = useState(startOfMonth(today));
  
  // NOVO: Estado para abrir/fechar o Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(today, 'yyyy-MM-dd'));

  const currentMonthStart = startOfMonth(viewingMonth);
  const currentMonthEnd = endOfMonth(viewingMonth);
  const daysInMonth = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });
  const startDayIndex = getDay(currentMonthStart); 
  
  const dateLocale = config.lang === 'en' ? enUS : ptBR;
  const translatedDays = t('weekDaysShort');
  const weekDays = Array.isArray(translatedDays) ? translatedDays :["D", "S", "T", "Q", "Q", "S", "S"];

  const handlePrevMonth = () => setViewingMonth(subMonths(viewingMonth, 1));
  const handleNextMonth = () => setViewingMonth(addMonths(viewingMonth, 1));

  // Abertura do Modal
  const handleDayClick = (dateStr) => {
    setSelectedDate(dateStr);
    setIsModalOpen(true);
  };

  const getDayDetails = (dateStr) => {
    const shifts =['morning', 'afternoon', 'night', 'default'];
    let details =[];

    shifts.forEach(shift => {
      const key = `${dateStr}_${shift}`;
      const shiftData = history[key];
      if (shiftData && (shiftData.completed || shiftData.notes || shiftData.image || (shiftData.tasks && shiftData.tasks.length > 0))) {
        details.push({ shift, ...shiftData });
      }
    });
    return details;
  };

  const selectedDayDetails = getDayDetails(selectedDate);
  const formattedSelectedDate = format(parseISO(selectedDate), "EEEE, d 'de' MMMM", { locale: dateLocale });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-3xl mx-auto pb-20">
      
      {/* O CALENDÁRIO */}
      <div className="p-6 rounded-3xl border border-border bg-card shadow-sm transition-colors">
        
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

        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
          {weekDays.map((day, i) => (
            <div key={i} className="text-[10px] font-black text-muted-foreground uppercase tracking-widest py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}

          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isCompleted = completedDays[dateStr];
            const isCurrentDay = isToday(day);

            return (
              <button 
                key={dateStr}
                onClick={() => handleDayClick(dateStr)} // Abre o Modal
                className={`
                  aspect-square relative rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all hover:scale-105 active:scale-95
                  ${isCompleted 
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/20' 
                    : 'bg-secondary text-foreground border border-transparent hover:border-border'
                  }
                  ${isCurrentDay && !isCompleted ? 'bg-primary/10 text-primary border-primary/20 ring-1 ring-primary' : ''}
                `}
              >
                {format(day, 'd')}
                {isCurrentDay && <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4 mt-6 text-xs text-muted-foreground px-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/50"></div> {t('completedLegend')}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-secondary border border-border"></div> {t('registeredLegend')}
          </div>
        </div>
      </div>

      {/* O NOVO MODAL DE INSPEÇÃO */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)} // Clicar fora fecha
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()} // Clicar dentro não fecha
              className="w-full max-w-lg max-h-[80vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header do Modal */}
              <div className="flex justify-between items-center p-5 border-b border-border bg-secondary/50">
                <h3 className="text-lg font-black text-foreground capitalize tracking-tight">
                  {formattedSelectedDate}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-background hover:bg-border rounded-full text-muted-foreground hover:text-foreground transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Conteúdo Rolável do Modal */}
              <div className="p-5 overflow-y-auto custom-scrollbar space-y-4">
                {selectedDayDetails.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                    <CalendarX2 size={48} className="opacity-20 mb-4" strokeWidth={1} />
                    <p className="text-sm font-bold">{t('noRecords')}</p>
                  </div>
                ) : (
                  selectedDayDetails.map((detail, index) => (
                    <div key={index} className="p-5 rounded-2xl border border-border bg-background shadow-sm flex flex-col gap-4">
                      
                      <div className="flex justify-between items-center pb-3 border-b border-border border-dashed">
                        <div className="flex items-center gap-2">
                          {SHIFT_ICONS[detail.shift]}
                          <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                            {t('shift')} {SHIFT_LABELS[detail.shift]}
                          </span>
                        </div>
                        {detail.completed && (
                          <span className="flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle2 size={12} /> {t('completedLegend')}
                          </span>
                        )}
                      </div>

                      {detail.tasks && detail.tasks.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                            <CheckSquare size={12} /> {t('tasksCompleted')}
                          </div>
                          <div className="space-y-2">
                            {detail.tasks.map(task => (
                              <div key={task.id} className="flex items-start gap-2 bg-secondary p-2.5 rounded-lg border border-border">
                                <CheckCircle2 size={14} className={task.completed ? "text-green-500 shrink-0 mt-0.5" : "text-muted-foreground/30 shrink-0 mt-0.5"} />
                                <span className={`text-xs font-medium ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                  {task.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {detail.notes && (
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                            <FileText size={12} /> {t('notes')}
                          </div>
                          <div className="text-xs text-foreground bg-secondary/50 p-4 rounded-xl italic border-l-4 border-primary">
                            "{detail.notes}"
                          </div>
                        </div>
                      )}

                      {detail.image && (
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                            <ImageIcon size={12} /> {t('proofImage')}
                          </div>
                          <img src={detail.image} alt="Prova" className="w-full max-h-64 object-cover rounded-xl border border-border shadow-sm" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default HistoryPanel;