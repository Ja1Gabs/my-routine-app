import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, GripHorizontal, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';
import { THEMES } from '../../entities/theme';
import { Code2, Coffee, Rocket, Music, Palette, Moon, Book, Dumbbell, Gamepad, Heart, Briefcase } from 'lucide-react';

const ICON_MAP = { Code2, Coffee, Rocket, Music, Palette, Moon, Book, Dumbbell, Gamepad, Heart, Briefcase };

// --- CARD ARRASTÁVEL ---
const CanvasCard = ({ node, constraintsRef }) => {
  const { activitiesPool, actions, t } = useRoutine();
  const [expanded, setExpanded] = useState(false);
  const [newTask, setNewTask] = useState("");

  // Busca as configurações visuais baseadas no activityId original
  const activity = activitiesPool.find(a => a.id === node.activityId);
  if (!activity) return null; // Se a atividade for deletada da biblioteca, o card some ou pode ter um fallback

  const theme = THEMES[activity.theme] || THEMES.slate;
  const Icon = ICON_MAP[activity.iconName] || Rocket;

  const handleDragEnd = (event, info) => {
    // Atualiza a posição no estado (para salvar ao sair)
    actions.updateCanvasNodePos(node.id, node.x + info.offset.x, node.y + info.offset.y);
  };

  const toggleTask = (taskId) => {
    const newTasks = node.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    actions.updateCanvasNodeData(node.id, { tasks: newTasks });
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const t = { id: crypto.randomUUID(), text: newTask, completed: false };
    actions.updateCanvasNodeData(node.id, { tasks:[...node.tasks, t] });
    setNewTask("");
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={constraintsRef}
      onDragEnd={handleDragEnd}
      initial={{ x: node.x, y: node.y, scale: 0 }}
      animate={{ scale: 1 }}
      className={`absolute z-10 w-72 rounded-2xl border shadow-xl flex flex-col overflow-hidden backdrop-blur-md transition-shadow hover:shadow-2xl ${theme.card}`}
      // style para forçar o framer motion a iniciar no lugar certo na tela
      style={{ x: node.x, y: node.y }}
    >
      {/* HEADER (Area de Arrastar) */}
      <div className={`cursor-grab active:cursor-grabbing p-3 flex justify-between items-center border-b border-border bg-background/50`}>
        <div className="flex items-center gap-2">
          <GripHorizontal size={14} className="text-muted-foreground opacity-50" />
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${theme.iconBox} text-xs`}>
            {activity.emoji ? activity.emoji : <Icon size={12} />}
          </div>
          <span className={`text-sm font-bold ${theme.title}`}>{activity.name}</span>
        </div>
        
        <div className="flex gap-1">
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button onClick={() => actions.deleteCanvasNode(node.id)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* CONTEÚDO (Tarefas rápidas) */}
      <div className="p-4" onPointerDownCapture={(e) => e.stopPropagation()}>
        {/* Parar a propagação do clique aqui evita arrastar o card quando tenta clicar num input ou botão */}
        
        {/* Progress Bar Mini */}
        {node.tasks.length > 0 && (
          <div className="h-1 w-full bg-secondary rounded-full overflow-hidden mb-4">
            <div className="h-full bg-primary/70 transition-all" style={{ width: `${(node.tasks.filter(t=>t.completed).length / node.tasks.length) * 100}%` }}/>
          </div>
        )}

        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
          {node.tasks.map(task => (
            <div key={task.id} className="flex items-start gap-2 group">
              <button onClick={() => toggleTask(task.id)} className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-border hover:border-primary'}`}>
                {task.completed && <Check size={10} strokeWidth={3} />}
              </button>
              <span className={`text-xs flex-1 transition-all ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {task.text}
              </span>
            </div>
          ))}
        </div>

        {/* Expansão com Input */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-3 border-t border-border mt-3 overflow-hidden">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder={t('taskPlaceholder')}
                  className={theme.input + " h-8 rounded-md px-3 text-xs outline-none flex-1 w-full"} 
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                />
                <button onClick={addTask} className={theme.actionButton + " w-8 h-8 shrink-0 rounded-md flex items-center justify-center"}>
                  <Plus size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};


// --- O QUADRO (CANVAS) ---
const CanvasView = () => {
  const { activitiesPool, canvasNodes, actions, t } = useRoutine();
  const constraintsRef = useRef(null);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Menu Superior de Ações */}
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="font-bold text-foreground">{t('board')}</h2>
          <p className="text-xs text-muted-foreground">{t('boardDesc')}</p>
        </div>

        {/* Dropdown simples para adicionar no quadro */}
        <div className="flex gap-2 items-center">
           <span className="text-xs font-bold uppercase text-muted-foreground">{t('addNode')}:</span>
           <div className="flex gap-2 overflow-x-auto max-w-[40vw] custom-scrollbar pb-1">
             {activitiesPool.map(act => (
               <button 
                 key={act.id} 
                 onClick={() => actions.addCanvasNode(act)}
                 className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground border border-border rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
               >
                 {act.emoji ? act.emoji : <Code2 size={12} />}
                 {act.name}
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* A ÁREA DO QUADRO (Fundo Pontilhado) */}
      <div 
        ref={constraintsRef} 
        className="w-full h-[65vh] bg-background border border-border rounded-3xl relative overflow-hidden bg-dots shadow-inner"
      >
        {/* Renderiza todos os nodes jogados no quadro */}
        {canvasNodes.map(node => (
          <CanvasCard key={node.id} node={node} constraintsRef={constraintsRef} />
        ))}

        {canvasNodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50 pointer-events-none">
             <GripHorizontal size={48} className="mb-4" />
             <p className="font-bold">Seu quadro está vazio.</p>
             <p className="text-xs">Clique nas atividades acima para jogar cards na tela.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasView;