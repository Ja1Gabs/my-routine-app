import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  FileText, 
  Image as ImageIcon, 
  Plus, 
  X, 
  Trash2, 
  Save,
  Sun, 
  CloudSun, 
  MoonStar,
  Rocket,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { THEMES } from '../../entities/theme';
import { useRoutine } from '../../context/RoutineContext';

// Mapeamento dos ícones para o badge do turno
const SHIFT_ICONS = {
  morning: <Sun size={12} className="text-yellow-500" />,
  afternoon: <CloudSun size={12} className="text-orange-500" />,
  night: <MoonStar size={12} className="text-indigo-400" />,
  // Fallbacks para UI traduzida
  Manhã: <Sun size={12} className="text-yellow-500" />,
  Tarde: <CloudSun size={12} className="text-orange-500" />,
  Noite: <MoonStar size={12} className="text-indigo-400" />
};

// Sub-componente: Item de Subtarefa/Checklist (Adaptável a Light/Dark Mode)
const TaskItem = ({ task, onToggle, onDelete }) => (
  <div 
    className="flex items-center gap-3 group bg-background/50 dark:bg-black/20 p-2 rounded-lg border border-border dark:border-white/5 hover:border-primary/50 dark:hover:border-white/20 transition-colors" 
    onClick={(e) => e.stopPropagation()} 
  >
    <button 
      onClick={onToggle}
      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
        task.completed 
          ? 'bg-green-500 border-green-500' 
          : 'border-border dark:border-white/30 hover:border-primary dark:hover:border-white'
      }`}
    >
      {task.completed && <Check size={12} className="text-white dark:text-black" strokeWidth={3} />}
    </button>
    
    <span className={`text-xs font-medium flex-1 transition-all ${
      task.completed ? 'text-muted-foreground line-through' : 'text-foreground'
    }`}>
      {task.text}
    </span>
    
    <button 
      onClick={onDelete} 
      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
    >
      <X size={14} />
    </button>
  </div>
);

const DayCard = ({ 
  activity, 
  date, 
  isToday, 
  isPast,        // NOVO: Prop para identificar se o dia já passou
  isCompleted, 
  isExpanded, 
  onToggleComplete, 
  onToggleExpand, 
  Icon, 
  dateStr,      // Ex: "2026-03-09"
  shiftKey,     // Ex: "morning"
  shiftLabel    // Ex: "Manhã" (traduzido para UI)
}) => {
  const { actions, history, config, t } = useRoutine();
  const fileInputRef = useRef(null);
  const[newTaskText, setNewTaskText] = useState("");

  // Tratamento para Card Vazio (Buraco na grade)
  if (!activity) {
    return (
      <div className="h-44 rounded-2xl border border-dashed border-border bg-secondary/50 opacity-50 flex items-center justify-center">
        <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">{t('empty') || 'Vazio'}</span>
      </div>
    );
  }

  // Define tema e chaves seguras
  const theme = THEMES[activity.theme] || THEMES.slate;
  const actualDateStr = dateStr || format(date, 'yyyy-MM-dd');
  const actualShiftKey = shiftKey || 'default';
  
  // A CHAVE MATRICIAL DO HISTÓRICO
  const uniqueKey = `${actualDateStr}_${actualShiftKey}`;
  const dayData = history[uniqueKey] || {};
  const dayTasks = dayData.tasks ||[]; 
  const dayImage = dayData.image || null;
  const dayNotes = dayData.notes || '';

  const dateLocale = config.lang === 'en' ? enUS : ptBR;

  // --- HANDLERS ---
  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask = { id: crypto.randomUUID(), text: newTaskText, completed: false };
    actions.updateDayData(actualDateStr, actualShiftKey, { tasks:[...dayTasks, newTask] });
    setNewTaskText("");
  };

  const toggleTask = (taskId) => {
    const updatedTasks = dayTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    actions.updateDayData(actualDateStr, actualShiftKey, { tasks: updatedTasks });
  };

  const deleteTask = (taskId) => {
    const updatedTasks = dayTasks.filter(t => t.id !== taskId);
    actions.updateDayData(actualDateStr, actualShiftKey, { tasks: updatedTasks });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => actions.updateDayData(actualDateStr, actualShiftKey, { image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const completedCount = dayTasks.filter(t => t.completed).length;

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onClick={onToggleExpand}
      className={`relative rounded-2xl border p-4 flex flex-col overflow-hidden transition-all cursor-pointer group
        ${theme.card}
        ${isExpanded ? 'shadow-2xl z-20 ring-2 ring-primary/30' : 'h-44 hover:shadow-lg hover:-translate-y-1'}
        ${isCompleted && !isExpanded ? 'opacity-70 grayscale-[0.3]' : ''}
      `}
    >
      {/* BACKGROUND IMAGE PREVIEW (Quando Fechado) */}
      {dayImage && !isExpanded && (
        <div className="absolute inset-0 z-0">
          <img src={dayImage} alt="Cover" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
        </div>
      )}

      {/* HEADER: Ícone, Dia da Semana e Turno */}
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.iconBox} text-2xl shadow-inner bg-background/50 backdrop-blur-md border border-border`}>
          {activity.emoji ? <span>{activity.emoji}</span> : <Icon size={24} strokeWidth={2} />}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          {config.routineMode !== 'shifts' && (
             <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest backdrop-blur-sm bg-background/50 px-2 py-0.5 rounded-md border border-border">
               {format(date, 'EEEE', { locale: dateLocale })}
             </div>
          )}

          {shiftLabel && (
            <div className="flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded-md shadow-sm">
              {SHIFT_ICONS[shiftLabel] || SHIFT_ICONS[shiftKey]}
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{shiftLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* TÍTULO DA ATIVIDADE */}
      <h2 className={`text-xl font-bold mb-auto tracking-tight relative z-10 ${theme.title} ${isCompleted ? 'line-through decoration-muted-foreground' : ''}`}>
        {activity.name}
      </h2>

      {/* MINI-PROGRESSO (Barrinhas coloridas quando fechado) */}
      {dayTasks.length > 0 && !isExpanded && (
        <div className="mt-2 mb-3 relative z-10 flex gap-1 animate-in fade-in">
           {dayTasks.map((t, i) => (
             <div key={i} className={`h-1.5 flex-1 rounded-full ${t.completed ? 'bg-green-500' : 'bg-border'}`} />
           ))}
        </div>
      )}

      {/* FOOTER ACTIONS (Com trava para dias passados) */}
      <div className={`flex gap-2 mt-auto pt-3 relative z-10 ${isExpanded ? 'mb-4 border-b border-border pb-4' : ''}`}>
        <button
          onClick={(e) => { 
            e.stopPropagation(); 
            // Se for dia passado e a tarefa não estiver concluída, bloqueia o clique
            if (!isPast || isCompleted) onToggleComplete(); 
          }}
          disabled={isPast && !isCompleted}
          className={`flex-1 h-10 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95
            ${(isPast && !isCompleted) 
              ? 'bg-secondary text-muted-foreground opacity-50 cursor-not-allowed border-none' // Estado Travado
              : isCompleted 
                ? 'bg-green-500 text-white dark:text-black hover:bg-green-600 border-none shadow-md' 
                : theme.buttonPrimary}
          `}
        >
          {isCompleted ? <Check size={16} strokeWidth={3} /> : (isPast && !isCompleted && <Lock size={14} />)}
          {isCompleted ? t('done') : t('mark')}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
            isExpanded ? 'bg-primary text-primary-foreground shadow-lg' : theme.actionButton
          }`}
        >
          <FileText size={16} />
        </button>

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        <button 
          onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
            dayImage ? 'text-green-600 dark:text-green-400 bg-green-500/20 border border-green-500/30' : theme.actionButton
          }`}
        >
          <ImageIcon size={16} />
        </button>
      </div>

      {/* ========================================= */}
      {/* ÁREA EXPANDIDA (Detalhes, Tasks e Notas)  */}
      {/* ========================================= */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.3, ease:[0.04, 0.62, 0.23, 0.98] }} // Easing perfeito
            className="overflow-hidden relative z-10"
            onClick={(e) => e.stopPropagation()} // Clicar aqui dentro NÃO fechará o card
          >
            {/* O SEGREDO DO ANIMATE-PRESENCE: Isolar o padding interno do height: auto */}
            <div className="pt-4 space-y-4 pb-2">
              
              {/* 1. Imagem Adicionada (Preview Grande) */}
              {dayImage && (
                <div className="relative rounded-xl overflow-hidden border border-border group shadow-md">
                  <img src={dayImage} className="w-full h-40 object-cover" alt="Upload" />
                  <button 
                    onClick={() => actions.updateDayData(actualDateStr, actualShiftKey, { image: null })}
                    className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* 2. Missão Sorteada */}
              {activity.assignedTask && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="flex items-center gap-2 text-[10px] text-primary font-bold uppercase mb-1">
                    <Rocket size={12} /> {t('raffleTask') || 'Missão do Dia'}
                  </div>
                  <div className="text-sm text-foreground font-medium">{activity.assignedTask}</div>
                </div>
              )}

              {/* 3. Checklist / Subtarefas */}
              <div className="bg-secondary p-3 rounded-xl border border-border">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">
                    {t('tasksTitle') || 'Subtarefas'}
                  </label>
                  <span className="text-[10px] text-muted-foreground font-bold">{completedCount}/{dayTasks.length}</span>
                </div>
                
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto no-scrollbar">
                  {dayTasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={() => toggleTask(task.id)} onDelete={() => deleteTask(task.id)} />
                  ))}
                  {dayTasks.length === 0 && (
                    <p className="text-[10px] text-muted-foreground/50 italic text-center py-2">{t('noTasks') || 'Nenhuma tarefa'}</p>
                  )}
                </div>

                {/* Input de Nova Tarefa */}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder={t('taskPlaceholder')}
                    className="w-full h-9 bg-background/50 dark:bg-black/40 border border-border dark:border-white/10 rounded-lg px-3 text-xs text-foreground outline-none focus:border-primary transition-colors placeholder:text-muted-foreground" 
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                  <button onClick={handleAddTask} className="w-9 h-9 shrink-0 bg-secondary-foreground/10 hover:bg-secondary-foreground/20 text-foreground rounded-lg flex items-center justify-center transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* 4. Bloco de Notas */}
              <div>
                <label className="text-[10px] uppercase text-muted-foreground font-bold mb-1 block tracking-widest">
                  {t('notes') || 'Anotações'}
                </label>
                <textarea 
                  placeholder={t('notePlaceholder')} 
                  className="w-full h-24 bg-background border border-border rounded-xl p-3 text-xs text-foreground outline-none resize-none focus:border-primary transition-colors placeholder:text-muted-foreground leading-relaxed shadow-sm"
                  value={dayNotes}
                  onChange={(e) => actions.updateDayData(actualDateStr, actualShiftKey, { notes: e.target.value })}
                />
              </div>

              {/* 5. Botão Fechar Inferior */}
              <button 
                onClick={onToggleExpand}
                className={`w-full h-10 mt-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-secondary hover:bg-border text-foreground border border-border active:scale-95 transition-all`}
              >
                <Save size={14} /> {t('saveAndClose') || 'Fechar Aba'}
              </button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DayCard;