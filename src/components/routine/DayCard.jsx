import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  FileText, 
  Image as ImageIcon, 
  Plus, 
  X, 
  Trash2, 
  Save 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { THEMES } from '../../entities/theme';
import { useRoutine } from '../../context/RoutineContext';

// Sub-componente para os itens da checklist
const TaskItem = ({ task, onToggle, onDelete }) => (
  <div className="flex items-center gap-2 group animate-in slide-in-from-left-2 duration-200">
    <button 
      onClick={onToggle}
      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
        task.completed ? 'bg-green-500 border-green-500' : 'border-white/30 hover:border-white'
      }`}
    >
      {task.completed && <Check size={10} className="text-black" strokeWidth={4} />}
    </button>
    <span className={`text-xs flex-1 transition-all ${
      task.completed ? 'text-white/30 line-through' : 'text-white/80'
    }`}>
      {task.text}
    </span>
    <button 
      onClick={onDelete} 
      className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-opacity"
    >
      <X size={12} />
    </button>
  </div>
);

const DayCard = ({ 
  activity, 
  date, 
  isToday, 
  isCompleted, 
  isExpanded, 
  onToggleComplete, 
  onToggleExpand, 
  Icon 
}) => {
  const { actions, history } = useRoutine();
  const fileInputRef = useRef(null);
  const [newTaskText, setNewTaskText] = useState("");

  // Placeholder para slots vazios
  if (!activity) {
    return (
      <div className="h-48 rounded-xl border border-white/5 bg-[#0a0a0a]/50 border-dashed flex items-center justify-center text-white/5 text-xs">
        Vazio
      </div>
    );
  }

  const theme = THEMES[activity.theme] || THEMES.slate;
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayData = history[dateStr] || {};
  const dayTasks = dayData.tasks || [];
  const dayImage = dayData.image || null;
  const dayNotes = dayData.notes || '';

  // --- LÓGICA DE ACTIONS ---

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask = { id: crypto.randomUUID(), text: newTaskText, completed: false };
    actions.updateDayData(dateStr, { tasks: [...dayTasks, newTask] });
    setNewTaskText("");
  };

  const toggleTask = (taskId) => {
    const updated = dayTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    actions.updateDayData(dateStr, { tasks: updated });
  };

  const deleteTask = (taskId) => {
    const updated = dayTasks.filter(t => t.id !== taskId);
    actions.updateDayData(dateStr, { tasks: updated });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => actions.updateDayData(dateStr, { image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const completedTasksCount = dayTasks.filter(t => t.completed).length;
  const progressPercent = dayTasks.length > 0 ? (completedTasksCount / dayTasks.length) * 100 : 0;

  return (
    <motion.div
      layout
      className={`relative rounded-xl border p-5 flex flex-col overflow-hidden transition-all duration-300 ${
        theme.card
      } ${isExpanded ? 'row-span-2 shadow-2xl z-20' : 'h-48 hover:-translate-y-1'}`}
    >
      {/* Background Image Preview (quando colapsado) */}
      {dayImage && !isExpanded && (
        <div className="absolute inset-0 z-0">
          <img src={dayImage} alt="Preview" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme.iconBox} text-xl shadow-inner bg-black/20`}>
          {activity.emoji ? <span>{activity.emoji}</span> : <Icon size={20} strokeWidth={2.5} />}
        </div>
        <div className="text-right">
          <div className={`text-[10px] font-bold uppercase tracking-widest ${theme.textSub}`}>
            {format(date, 'EEEE', { locale: ptBR })}
          </div>
          {isToday && (
            <div className="text-[9px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-full mt-1 inline-block backdrop-blur-sm border border-white/10">
              HOJE
            </div>
          )}
        </div>
      </div>

      <h2 className={`text-xl font-bold mb-auto tracking-tight relative z-10 ${theme.title}`}>
        {activity.name}
      </h2>

      {/* PROGRESS BAR (Checklist curta) */}
      {dayTasks.length > 0 && !isExpanded && (
        <div className="mb-4 relative z-10 animate-in fade-in">
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-white/40" 
            />
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className={`flex gap-2 mt-4 pt-4 border-t border-white/5 relative z-10 ${isExpanded ? 'mb-4' : ''}`}>
        <button 
          onClick={onToggleComplete} 
          className={`flex-1 h-9 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
            isCompleted ? theme.buttonActive : theme.buttonPrimary
          }`}
        >
          {isCompleted && <Check size={14} strokeWidth={3} />} 
          {isCompleted ? "Concluído" : "Marcar"}
        </button>
        
        <button 
          onClick={onToggleExpand} 
          className={`w-9 h-9 rounded-md flex items-center justify-center transition-all active:scale-95 ${
            isExpanded ? 'bg-white text-black shadow-lg' : theme.actionButton
          }`}
        >
          <FileText size={16} />
        </button>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleImageUpload} 
        />
        <button 
          onClick={() => fileInputRef.current.click()}
          className={`w-9 h-9 rounded-md flex items-center justify-center transition-all active:scale-95 ${
            dayImage ? 'text-green-400 bg-green-500/10' : theme.actionButton
          }`}
        >
          <ImageIcon size={16} />
        </button>
      </div>

      {/* ÁREA EXPANDIDA (DETALHES) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }} 
            className="space-y-4 overflow-hidden pt-2"
          >
            {/* Imagem do Dia */}
            {dayImage && (
              <div className="relative rounded-lg overflow-hidden border border-white/10 group aspect-video">
                <img src={dayImage} className="w-full h-full object-cover" alt="Upload" />
                <button 
                  onClick={() => actions.updateDayData(dateStr, { image: null })}
                  className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            {/* Missão Sorteda */}
            {activity.assignedTask && (
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-white/40 font-bold uppercase text-[9px] block mb-1">Missão do Dia</span>
                <p className="text-xs text-white/90 leading-relaxed font-medium">{activity.assignedTask}</p>
              </div>
            )}

            {/* Checklist */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase text-white/40 font-black tracking-widest">Checklist</label>
                <span className="text-[10px] text-white/30 font-bold">{completedTasksCount}/{dayTasks.length}</span>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                {dayTasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={() => toggleTask(task.id)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
                {dayTasks.length === 0 && (
                  <p className="text-[10px] text-white/20 italic text-center py-2">Nenhum item adicionado</p>
                )}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  placeholder="Novo item..." 
                  className={`w-full h-8 rounded-md px-3 text-xs outline-none transition-colors ${theme.input}`} 
                />
                <button 
                  onClick={handleAddTask}
                  className={`w-8 h-8 shrink-0 rounded-md flex items-center justify-center ${theme.actionButton} hover:bg-white hover:text-black transition-colors`}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-white/40 font-black tracking-widest block">Anotações</label>
              <textarea 
                value={dayNotes}
                onChange={(e) => actions.updateDayData(dateStr, { notes: e.target.value })}
                placeholder="Como foi o desempenho hoje?" 
                className={`w-full h-24 rounded-lg p-3 text-xs outline-none resize-none transition-colors leading-relaxed ${theme.input}`} 
              />
            </div>

            <button 
              onClick={onToggleExpand}
              className={`w-full h-9 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${theme.buttonPrimary}`}
            >
              <Save size={14} /> Salvar e Fechar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DayCard;