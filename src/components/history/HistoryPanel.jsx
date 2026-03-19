import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckCircle2, FileText, Image as ImageIcon, Sun, CloudSun, MoonStar, CheckSquare, X, PlaySquare, Rocket, Code2, Coffee, Music, Palette, Moon, Book, Dumbbell, Gamepad, Heart, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutine } from '../../context/RoutineContext';
import { THEMES } from '../../entities/theme';

const ICON_MAP = { Code2, Coffee, Rocket, Music, Palette, Moon, Book, Dumbbell, Gamepad, Heart, Briefcase };

const SHIFT_ICONS = {
  morning: <Sun size={12} className="text-yellow-500" />,
  afternoon: <CloudSun size={12} className="text-orange-500" />,
  night: <MoonStar size={12} className="text-indigo-500" />,
  default: <CheckCircle2 size={12} className="text-primary" />
};
const SHIFT_LABELS = { morning: 'Manhã', afternoon: 'Tarde', night: 'Noite', default: 'Geral' };

// --- CARD ARQUIVADO (GRAVAÇÃO) ---
const ArchivedCard = ({ record, shift }) => {
  const activity = record.activity || { name: "Atividade Encerrada", theme: "slate", iconName: "Archive" };
  const theme = THEMES[activity.theme] || THEMES.slate;
  const Icon = ICON_MAP[activity.iconName] || Rocket;

  return (
    <div className={`relative rounded-2xl border p-4 flex flex-col overflow-hidden transition-all shadow-sm ${theme.card}`}>
      {record.image && (
        <div className="absolute inset-0 z-0">
          <img src={record.image} alt="Proof" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
        </div>
      )}

      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.iconBox} text-xl shadow-sm bg-background border border-border`}>
          {activity.emoji ? <span>{activity.emoji}</span> : <Icon size={20} strokeWidth={2} />}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded-md shadow-sm">
            {SHIFT_ICONS[shift]}
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{SHIFT_LABELS[shift]}</span>
          </div>
          {record.completed && (
            <div className="flex items-center gap-1 text-[9px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20 uppercase tracking-widest">
              <CheckCircle2 size={10} /> Concluído
            </div>
          )}
        </div>
      </div>

      <h2 className={`text-lg font-black mb-4 tracking-tight relative z-10 ${theme.title}`}>{activity.name}</h2>

      <div className="space-y-4 relative z-10">
        {record.tasks && record.tasks.length > 0 && (
          <div className="bg-secondary/80 p-3 rounded-xl border border-border">
            <label className="text-[9px] uppercase text-muted-foreground font-black mb-2 flex items-center gap-1"><CheckSquare size={10}/> Checklist</label>
            <div className="space-y-2">
              {record.tasks.map(t => (
                <div key={t.id} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className={`shrink-0 mt-0.5 ${t.completed ? 'text-green-500' : 'text-muted-foreground/30'}`} />
                  <span className={`text-xs font-medium ${t.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {record.notes && (
          <div className="bg-secondary/80 p-3 rounded-xl border border-border">
             <label className="text-[9px] uppercase text-muted-foreground font-black mb-2 flex items-center gap-1"><FileText size={10}/> Notas do dia</label>
             <p className="text-xs text-foreground italic border-l-2 border-primary pl-2">{record.notes}</p>
          </div>
        )}

        {record.image && (
           <div className="bg-secondary/80 p-3 rounded-xl border border-border mt-4">
             <label className="text-[9px] uppercase text-muted-foreground font-black mb-2 flex items-center gap-1"><ImageIcon size={10}/> Anexo</label>
             <img src={record.image} className="w-full h-40 object-cover rounded-lg border border-border shadow-sm" alt="Record" />
           </div>
        )}
      </div>
    </div>
  );
};


// --- PAINEL PRINCIPAL ---
const HistoryPanel = ({ completedDays = {} }) => {
  const { t, config, history } = useRoutine();
  const today = new Date();
  
  const [viewingMonth, setViewingMonth] = useState(startOfMonth(today));
  
  // Estados para Multi-select e Modal
  const[selectedDates, setSelectedDates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentMonthStart = startOfMonth(viewingMonth);
  const currentMonthEnd = endOfMonth(viewingMonth);
  const daysInMonth = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });
  const startDayIndex = getDay(currentMonthStart); 
  
  const dateLocale = config.lang === 'en' ? enUS : ptBR;
  const translatedDays = t('weekDaysShort');
  const weekDays = Array.isArray(translatedDays) ? translatedDays :["D", "S", "T", "Q", "Q", "S", "S"];

  const toggleDateSelection = (dateStr) => {
    setSelectedDates(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
  };

  // Coleta as gravações dos dias selecionados
  const getSelectedRecordings = () => {
    const shifts =['morning', 'afternoon', 'night', 'default'];
    let recordings = {};

    selectedDates.forEach(dateStr => {
      recordings[dateStr] =[];
      shifts.forEach(shift => {
        const key = `${dateStr}_${shift}`;
        if (history[key] && (history[key].completed || history[key].notes || history[key].image || (history[key].tasks && history[key].tasks.length > 0))) {
          recordings[dateStr].push({ shift, ...history[key] });
        }
      });
    });
    return recordings;
  };

  const recordings = getSelectedRecordings();
  const sortedSelectedDates = [...selectedDates].sort();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto pb-32">
      
      {/* CALENDÁRIO */}
      <div className="p-6 rounded-3xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between mb-6 px-2">
          <button onClick={() => setViewingMonth(subMonths(viewingMonth, 1))} className="p-2 bg-secondary hover:bg-border rounded-xl text-muted-foreground hover:text-foreground transition-all">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-black capitalize text-foreground tracking-tight">
            {format(viewingMonth, 'MMMM yyyy', { locale: dateLocale })}
          </h2>
          <button onClick={() => setViewingMonth(addMonths(viewingMonth, 1))} className="p-2 bg-secondary hover:bg-border rounded-xl text-muted-foreground hover:text-foreground transition-all">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
          {weekDays.map((day, i) => (
            <div key={i} className="text-[10px] font-black text-muted-foreground uppercase tracking-widest py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}

          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isCompleted = completedDays[dateStr];
            const isCurrentDay = isToday(day);
            const isSelected = selectedDates.includes(dateStr);

            return (
              <button 
                key={dateStr}
                onClick={() => toggleDateSelection(dateStr)}
                className={`
                  aspect-square relative rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all
                  hover:scale-105 active:scale-95
                  ${isSelected ? 'ring-4 ring-primary ring-offset-2 ring-offset-background z-10' : 'border border-transparent'}
                  ${isCompleted 
                    ? 'bg-green-500/20 text-green-600 dark:text-green-500 border-green-500/20' 
                    : 'bg-secondary text-foreground hover:bg-border'
                  }
                  ${isCurrentDay && !isCompleted && !isSelected ? 'bg-primary/10 text-primary border-primary/20' : ''}
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

      {/* BARRA FLUTUANTE DE AÇÃO (Quando dias são selecionados) */}
      <AnimatePresence>
        {selectedDates.length > 0 && !isModalOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: 100, opacity: 0, x: "-50%" }}
            className="fixed bottom-8 left-1/2 z-40 bg-foreground text-background px-3 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-border"
          >
            <div className="flex items-center gap-2 pl-2">
              <div className="bg-background text-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">
                {selectedDates.length}
              </div>
              <span className="text-xs font-bold hidden sm:inline">selecionados</span>
            </div>
            
            <div className="w-px h-6 bg-background/20 hidden sm:block"></div>
            
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              <PlaySquare size={14} className="text-red-500" /> Puxar Gravações
            </button>
            
            <button 
              onClick={() => setSelectedDates([])} 
              className="p-2 hover:bg-background/20 rounded-xl transition-colors text-background/70 hover:text-background"
              title="Limpar seleção"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* O MODAL DE VIDRO (ARQUIVO DE GRAVAÇÕES) */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)} // Clicar no fundo fecha
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()} // Clicar dentro não fecha
              className="w-full max-w-4xl max-h-[85vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header do Modal */}
              <div className="flex justify-between items-center p-6 border-b border-border bg-secondary/30 relative z-20">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-500/10 text-red-500 rounded-xl animate-pulse shadow-inner border border-red-500/20">
                    <PlaySquare size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground tracking-tight">Arquivo de Rotina</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{selectedDates.length} dias recuperados</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2.5 bg-background border border-border hover:bg-border rounded-full text-muted-foreground hover:text-foreground transition-colors active:scale-95">
                  <X size={20} />
                </button>
              </div>

              {/* Corpo do Modal (Rolável) */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-background/30 relative">
                
                <div className="space-y-12 relative z-10">
                  {/* Linha vertical da Timeline */}
                  <div className="absolute left-[19px] top-6 bottom-6 w-1 bg-border rounded-full z-0 hidden md:block"></div>

                  {sortedSelectedDates.map(dateStr => {
                    const dayRecords = recordings[dateStr];

                    return (
                      <div key={dateStr} className="relative z-10 md:pl-12">
                        {/* Bolinha da Timeline */}
                        <div className="absolute left-[15px] top-2 w-3 h-3 bg-primary rounded-full ring-4 ring-card hidden md:block"></div>
                        
                        <h4 className="text-lg font-black text-foreground mb-4 uppercase tracking-tight flex items-center gap-3">
                          {format(parseISO(dateStr), "EEEE, dd 'de' MMM", { locale: dateLocale })}
                          {dayRecords.length === 0 && <span className="text-[10px] bg-secondary border border-border text-muted-foreground px-2 py-1 rounded-md font-bold">Sem Registros Salvos</span>}
                        </h4>

                        {dayRecords.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dayRecords.map((rec, i) => (
                              <ArchivedCard key={i} record={rec} shift={rec.shift} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default HistoryPanel;