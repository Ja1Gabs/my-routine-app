import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, FileText, Image as ImageIcon, Plus, X, 
  Trash2, Save, Sun, CloudSun, MoonStar, Rocket, 
  AlertCircle, Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { THEMES } from '../../entities/theme';
import { useRoutine } from '../../context/RoutineContext';

const SHIFT_ICONS = {
  morning: <Sun size={12} className="text-yellow-500" />,
  afternoon: <CloudSun size={12} className="text-orange-500" />,
  night: <MoonStar size={12} className="text-indigo-400" />,
  Manhã: <Sun size={12} className="text-yellow-500" />,
  Tarde: <CloudSun size={12} className="text-orange-500" />,
  Noite: <MoonStar size={12} className="text-indigo-400" />
};

// --- Sub-componente: Item de Tarefa ---
const TaskItem = ({ task, onToggle, onDelete }) => (
  <div className="flex items-start gap-3 group bg-secondary/50 p-2.5 rounded-lg border border-border hover:border-primary/50 transition-colors" onClick={(e) => e.stopPropagation()}>
    <motion.button 
      whileTap={{ scale: 0.8 }}
      onClick={onToggle} 
      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${task.completed ? 'bg-green-500 border-green-500' : 'border-border hover:border-primary bg-background'}`}
    >
      {task.completed && <Check size={12} className="text-white" strokeWidth={3} />}
    </motion.button>
    <span className={`text-xs font-medium flex-1 transition-all pt-0.5 ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
      {task.text}
    </span>
    {/* A CORREÇÃO DA LIXEIRA AQUI: stopPropagation e área de clique maior */}
    <button 
      onClick={(e) => { e.stopPropagation(); onDelete(); }} 
      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all shrink-0"
    >
      <Trash2 size={14} />
    </button>
  </div>
);

// --- Componente Principal: DayCard ---
const DayCard = ({ 
  activity, date, isToday, isPast, isCompleted, 
  isExpanded, onToggleComplete, onToggleExpand, 
  Icon, dateStr, shiftKey, shiftLabel 
}) => {
  const { actions, history, config, t } = useRoutine();
  const fileInputRef = useRef(null);
  const [newTaskText, setNewTaskText] = useState("");

  // Memoização de chaves e dados para performance
  const actualDateStr = useMemo(() => dateStr || format(date, 'yyyy-MM-dd'), [date, dateStr]);
  const actualShiftKey = shiftKey || 'default';
  const uniqueKey = `${actualDateStr}_${actualShiftKey}`;
  
  const dayData = history[uniqueKey] || {};
  const { tasks: dayTasks = [], image: dayImage = null, notes: dayNotes = '' } = dayData;

  // Lógica de Urgência (Faltando pouco tempo para acabar o turno/dia)
  const isUrgent = useMemo(() => {
    if (!isToday || isCompleted) return false;
    const currentHour = new Date().getHours();

    if (config.routineMode === 'shifts') {
      if (shiftKey === 'morning' && currentHour >= 10) return true; // Alerta as 10h-12h
      if (shiftKey === 'afternoon' && currentHour >= 16) return true; // Alerta as 16h-18h
      if (shiftKey === 'night' && currentHour >= 21) return true; // Alerta após as 21h
    } else {
      if (currentHour >= 18) return true; // Modo simples: Alerta noite
    }
    return false;
  }, [isToday, isCompleted, config.routineMode, shiftKey]);

  if (!activity) {
    return (
      <div className="h-44 rounded-2xl border border-dashed border-border bg-secondary/30 opacity-50 flex items-center justify-center">
        <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">{t('empty') || 'Vazio'}</span>
      </div>
    );
  }

  const theme = THEMES[activity.theme] || THEMES.slate;

  const handleCompleteClick = (e) => {
    e.stopPropagation();
    if (isPast && !isCompleted) return;

    if (!isCompleted) {
      const rect = e.currentTarget.getBoundingClientRect();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { 
          x: (rect.left + rect.width / 2) / window.innerWidth, 
          y: (rect.top + rect.height / 2) / window.innerHeight 
        },
        colors: ['#22c55e', '#3b82f6', '#f59e0b']
      });
    }
    onToggleComplete();
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    actions.updateDayData(actualDateStr, actualShiftKey, { 
      tasks: [...dayTasks, { id: crypto.randomUUID(), text: newTaskText, completed: false }] 
    });
    setNewTaskText("");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => actions.updateDayData(actualDateStr, actualShiftKey, { image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={onToggleExpand}
      className={`relative rounded-2xl border p-4 flex flex-col overflow-hidden transition-all cursor-pointer group
        ${theme.card}
        ${isExpanded ? 'shadow-2xl z-20 ring-2 ring-primary/30' : 'h-44 hover:shadow-lg hover:-translate-y-1'}
        ${isCompleted && !isExpanded ? 'opacity-70 grayscale-[0.3]' : ''}
        ${isUrgent && !isExpanded ? 'ring-2 ring-orange-500/80 shadow-orange-500/20 animate-pulse' : ''}
      `}
    >
      {/* Background Image Preview */}
      {dayImage && !isExpanded && (
        <div className="absolute inset-0 z-0">
          <img src={dayImage} alt="" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.iconBox} text-2xl shadow-inner bg-background/50 backdrop-blur-md border border-border`}>
          {activity.emoji ? <span>{activity.emoji}</span> : <Icon size={24} strokeWidth={2} />}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          {shiftLabel && (
            <div className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm border border-border px-2 py-1 rounded-md shadow-sm">
              {SHIFT_ICONS[shiftLabel] || SHIFT_ICONS[shiftKey]}
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{shiftLabel}</span>
            </div>
          )}
          {isUrgent && !isExpanded && (
            <div className="flex items-center gap-1 text-[9px] font-bold text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
              <AlertCircle size={10} /> {t('urgent') || 'Atenção'}
            </div>
          )}
        </div>
      </div>

      {/* Título */}
      <h2 className={`text-xl font-bold mb-auto tracking-tight relative z-10 ${theme.title} ${isCompleted ? 'line-through decoration-muted-foreground' : ''}`}>
        {activity.name}
      </h2>

      {/* Progresso de Tarefas (Fechado) */}
      {dayTasks.length > 0 && !isExpanded && (
        <div className="mt-2 mb-3 relative z-10 flex gap-1">
           {dayTasks.map((t, i) => (
             <div key={i} className={`h-1 flex-1 rounded-full ${t.completed ? 'bg-green-500' : 'bg-muted-foreground/20'}`} />
           ))}
        </div>
      )}

      {/* Footer / Botões Rápidos */}
      <div className={`flex gap-2 mt-auto pt-3 relative z-10 ${isExpanded ? 'mb-4 border-b border-border pb-4' : ''}`}>
        <motion.button
          whileTap={{ scale: (isPast && !isCompleted) ? 1 : 0.95 }}
          onClick={handleCompleteClick}
          disabled={isPast && !isCompleted}
          aria-label={isCompleted ? "Unmark complete" : "Mark as complete"}
          className={`flex-1 h-10 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors
            ${(isPast && !isCompleted) ? 'bg-secondary text-muted-foreground opacity-50 cursor-not-allowed' 
              : isCompleted ? 'bg-green-500 text-white dark:text-black hover:bg-green-600 border-none' 
              : theme.buttonPrimary}
          `}
        >
          {isCompleted ? <Check size={16} strokeWidth={3} /> : (isPast && !isCompleted ? <Lock size={14} /> : null)}
          {isCompleted ? t('done') : t('mark')}
        </motion.button>

        <button 
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} 
          aria-label="Toggle details"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-primary-foreground' : theme.actionButton}`}
        >
          <FileText size={16} />
        </button>

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        <button 
          onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }} 
          aria-label="Upload image"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${dayImage ? 'text-green-600 bg-green-500/10 border border-green-500/20' : theme.actionButton}`}
        >
          <ImageIcon size={16} />
        </button>
      </div>

      {/* Área Expandida */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden relative z-10"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="pt-4 space-y-4 pb-2">
              {dayImage && (
                <div className="relative rounded-xl overflow-hidden border border-border group">
                  <img src={dayImage} className="w-full h-44 object-cover" alt="Moment of the day" />
                  <button 
                    onClick={() => actions.updateDayData(actualDateStr, actualShiftKey, { image: null })} 
                    className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {activity.assignedTask && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="flex items-center gap-2 text-[10px] text-primary font-bold uppercase mb-1">
                    <Rocket size={12} /> {t('raffleTask') || 'Tarefa Sorteada'}
                  </div>
                  <div className="text-sm text-foreground font-medium">{activity.assignedTask}</div>
                </div>
              )}

              <div className="bg-secondary/50 p-3 rounded-xl border border-border">
                <div className="flex justify-between items-center mb-3 text-[10px] uppercase text-muted-foreground font-bold tracking-widest">
                  <label>{t('tasksTitle') || 'Checklist'}</label>
                  <span>{dayTasks.filter(t => t.completed).length}/{dayTasks.length}</span>
                </div>
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto no-scrollbar">
                  {dayTasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={() => actions.updateDayData(actualDateStr, actualShiftKey, { 
                        tasks: dayTasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t) 
                      })} 
                      onDelete={() => actions.updateDayData(actualDateStr, actualShiftKey, { 
                        tasks: dayTasks.filter(t => t.id !== task.id) 
                      })} 
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder={t('taskPlaceholder') || 'Nova sub-tarefa...'} 
                    className="w-full h-9 bg-background/50 border border-border rounded-lg px-3 text-xs outline-none focus:border-primary transition-colors" 
                    value={newTaskText} 
                    onChange={(e) => setNewTaskText(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()} 
                  />
                  <button 
                    onClick={handleAddTask} 
                    className="w-9 h-9 shrink-0 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block tracking-widest">{t('notes') || 'Anotações'}</label>
                <textarea 
                  placeholder={t('notePlaceholder') || 'Como foi essa atividade?'} 
                  className="w-full h-24 bg-background border border-border rounded-xl p-3 text-xs outline-none resize-none focus:border-primary transition-colors" 
                  value={dayNotes} 
                  onChange={(e) => actions.updateDayData(actualDateStr, actualShiftKey, { notes: e.target.value })} 
                />
              </div>

              <button 
                onClick={onToggleExpand} 
                className="w-full h-10 mt-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-secondary hover:bg-border text-foreground border border-border transition-all active:scale-[0.98]"
              >
                <Save size={14} /> {t('saveAndClose') || 'Salvar e Fechar'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DayCard;