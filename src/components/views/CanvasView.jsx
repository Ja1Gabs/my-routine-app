import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  X,
  Check,
  GripHorizontal,
  Trash2,
  StickyNote,
  Image as ImageIcon,
  CopyPlus,
  Rocket,
  Code2,
  Coffee,
  Music,
  Palette,
  Moon,
  Book,
  Dumbbell,
  Gamepad,
  Heart,
  Briefcase,
} from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';
import { THEMES } from '../../entities/theme';

const ICON_MAP = { Code2, Coffee, Rocket, Music, Palette, Moon, Book, Dumbbell, Gamepad, Heart, Briefcase };

const StickyNode = ({ node, constraintsRef, actions }) => {
  const handleDragEnd = (e, info) => actions.updateCanvasNodePos(node.id, node.x + info.offset.x, node.y + info.offset.y);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={constraintsRef}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      style={{ x: node.x, y: node.y }}
      className={`absolute z-20 w-52 h-52 rounded-[1.4rem] shadow-xl flex flex-col overflow-hidden transition-shadow hover:shadow-2xl ${node.color} border border-black/10`}
    >
      <div className="h-8 bg-black/10 cursor-grab active:cursor-grabbing flex justify-between items-center px-3 group border-b border-black/5">
        <GripHorizontal size={12} className="opacity-50" />
        <button onClick={() => actions.deleteCanvasNode(node.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity">
          <X size={12} />
        </button>
      </div>

      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-black/6 to-transparent opacity-70" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/8 to-transparent opacity-60" />
        <textarea
          className="sticky-scrollbar h-full w-full bg-transparent px-3 py-3 outline-none resize-none font-medium text-[13px] leading-5 placeholder:text-black/30 overflow-y-auto"
          placeholder="Escreva uma ideia ou tarefa rapida..."
          value={node.text || ''}
          onChange={(e) => actions.updateCanvasNodeData(node.id, { text: e.target.value })}
          onPointerDownCapture={(e) => e.stopPropagation()}
        />
      </div>
    </motion.div>
  );
};

const ImageNode = ({ node, constraintsRef, actions, t }) => {
  const handleDragEnd = (e, info) => actions.updateCanvasNodePos(node.id, node.x + info.offset.x, node.y + info.offset.y);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={constraintsRef}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      style={{ x: node.x, y: node.y }}
      className="absolute z-10 w-64 rounded-2xl shadow-xl bg-card border border-border flex flex-col overflow-hidden group"
    >
      <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <div className="cursor-grab active:cursor-grabbing p-1.5 bg-black/50 text-white rounded-lg backdrop-blur-sm"><GripHorizontal size={14} /></div>
        <button onClick={() => actions.deleteCanvasNode(node.id)} className="p-1.5 bg-red-500/80 text-white rounded-lg backdrop-blur-sm hover:bg-red-600"><Trash2 size={14} /></button>
      </div>

      {node.url ? (
        <img src={node.url} alt="Vision" className="w-full h-auto min-h-[100px] object-cover pointer-events-none" />
      ) : (
        <div className="p-4" onPointerDownCapture={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 text-muted-foreground mb-2"><ImageIcon size={16} /> <span className="text-xs font-bold">URL da Imagem</span></div>
          <input
            className="w-full bg-secondary border border-border rounded-lg p-2 text-xs text-foreground outline-none focus:border-primary"
            placeholder={t('imagePlaceholder')}
            value={node.url || ''}
            onChange={(e) => actions.updateCanvasNodeData(node.id, { url: e.target.value })}
          />
        </div>
      )}
    </motion.div>
  );
};

const ActivityNode = ({ node, constraintsRef, actions }) => {
  const { activitiesPool } = useRoutine();
  const activity = activitiesPool.find((item) => item.id === node.activityId);

  if (!activity) return null;
  const theme = THEMES[activity.theme] || THEMES.slate;
  const Icon = ICON_MAP[activity.iconName] || Rocket;

  const handleDragEnd = (e, info) => actions.updateCanvasNodePos(node.id, node.x + info.offset.x, node.y + info.offset.y);
  const toggleTask = (taskId) => actions.updateCanvasNodeData(node.id, { tasks: node.tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)) });

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={constraintsRef}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      style={{ x: node.x, y: node.y }}
      className={`absolute z-30 w-56 rounded-2xl border shadow-xl flex flex-col overflow-hidden backdrop-blur-md transition-shadow hover:shadow-2xl ${theme.card}`}
    >
      <div className="cursor-grab active:cursor-grabbing p-3 flex justify-between items-center border-b border-border bg-background/50">
        <div className="flex items-center gap-2">
          <GripHorizontal size={14} className="text-muted-foreground opacity-50" />
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${theme.iconBox} text-xs border border-border`}>
            {activity.emoji ? activity.emoji : <Icon size={12} strokeWidth={2.5} />}
          </div>
          <span className={`text-xs font-bold ${theme.title} truncate`}>{activity.name}</span>
        </div>
        <button onClick={() => actions.deleteCanvasNode(node.id)} className="p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><X size={14} /></button>
      </div>

      {node.tasks && node.tasks.length > 0 && (
        <div className="p-3 space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar bg-background/30" onPointerDownCapture={(e) => e.stopPropagation()}>
          {node.tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-2 group">
              <button onClick={() => toggleTask(task.id)} className={`mt-0.5 w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-all ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-border hover:border-primary'}`}>
                {task.completed && <Check size={8} strokeWidth={4} />}
              </button>
              <span className={`text-[10px] font-medium leading-tight pt-0.5 transition-all ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.text}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const CanvasView = () => {
  const { activitiesPool, canvasNodes, actions, t } = useRoutine();
  const constraintsRef = useRef(null);

  const safeNodes = Array.isArray(canvasNodes) ? canvasNodes : [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="font-bold text-foreground text-xl">{t('board')}</h2>
          <p className="text-xs text-muted-foreground">{t('boardDesc')}</p>
        </div>
      </div>

      <div
        ref={constraintsRef}
        className="w-full h-[78vh] min-h-[620px] bg-card border border-border rounded-3xl relative overflow-hidden bg-dots shadow-inner"
      >
        {safeNodes.map((node) => {
          const type = node.type || 'activity';
          if (type === 'sticky') return <StickyNode key={node.id} node={node} constraintsRef={constraintsRef} actions={actions} />;
          if (type === 'image') return <ImageNode key={node.id} node={node} constraintsRef={constraintsRef} actions={actions} t={t} />;
          return <ActivityNode key={node.id} node={node} constraintsRef={constraintsRef} actions={actions} />;
        })}

        {safeNodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-40 pointer-events-none">
            <CopyPlus size={48} className="mb-4" strokeWidth={1} />
            <p className="font-bold">Seu espaco esta em branco.</p>
            <p className="text-xs">Use o menu abaixo para criar seu mural.</p>
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 bg-background/85 backdrop-blur-xl border border-border p-2 rounded-2xl shadow-2xl flex flex-wrap items-center justify-center gap-2 max-w-[calc(100%-2rem)] md:max-w-[90%]">
          <button onClick={() => actions.addStickyNode()} className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground rounded-xl text-xs font-bold transition-all active:scale-95 group">
            <StickyNote size={14} className="text-yellow-500 group-hover:text-primary-foreground" /> {t('addSticky')}
          </button>

          <button onClick={() => actions.addImageNode()} className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground rounded-xl text-xs font-bold transition-all active:scale-95 group">
            <ImageIcon size={14} className="text-blue-500 group-hover:text-primary-foreground" /> {t('addImage')}
          </button>

          <div className="hidden md:block w-px h-6 bg-border mx-1"></div>

          <div className="flex gap-2 max-w-full md:max-w-[42vw] overflow-x-auto custom-scrollbar px-1">
            {activitiesPool.map((activity) => (
              <button
                key={activity.id}
                onClick={() => actions.addCanvasNode(activity)}
                title={t('addCard')}
                className="shrink-0 w-8 h-8 flex items-center justify-center bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground border border-border rounded-xl transition-all active:scale-95 shadow-sm"
              >
                {activity.emoji ? <span className="text-xs">{activity.emoji}</span> : <Code2 size={14} />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasView;
