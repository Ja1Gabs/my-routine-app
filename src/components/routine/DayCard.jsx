import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  Sun,
  CloudSun,
  MoonStar,
  Rocket,
  Lock,
  Pin,
  KanbanSquare,
  Sparkles,
  X,
  BookmarkPlus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { THEMES } from '../../entities/theme';
import { useRoutine } from '../../context/RoutineContext';
import { getHistoryEntry } from '../../lib/routine';

const SHIFT_ICONS = {
  morning: <Sun size={12} className="text-yellow-500" />,
  afternoon: <CloudSun size={12} className="text-orange-500" />,
  night: <MoonStar size={12} className="text-indigo-400" />,
  default: <Rocket size={12} className="text-primary" />,
};

const normalizeTaskText = (value = '') => value.trim().toLowerCase();

const TaskItem = ({ task, onToggle, onDelete }) => (
  <div
    className="flex items-start gap-3 group bg-secondary/50 p-2.5 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-default"
    onClick={(e) => e.stopPropagation()}
  >
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${task.completed ? 'bg-green-500 border-green-500' : 'border-border hover:border-primary bg-background'}`}
    >
      {task.completed && <Check size={12} className="text-white" strokeWidth={3} />}
    </motion.button>

    <span className={`text-xs font-medium flex-1 transition-all pt-0.5 ${task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
      {task.text}
    </span>

    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete();
      }}
      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all shrink-0 sm:opacity-0 sm:group-hover:opacity-100"
    >
      <Trash2 size={14} />
    </button>
  </div>
);

const DayCard = ({
  activity,
  date,
  isToday,
  isPast,
  isExpanded,
  onToggleExpand,
  Icon,
  dateStr,
  shiftKey,
  shiftLabel,
}) => {
  const { actions, history, config, t, cycleCards } = useRoutine();
  const fileInputRef = useRef(null);
  const [newTaskText, setNewTaskText] = useState('');

  const actualDateStr = useMemo(() => dateStr || format(date, 'yyyy-MM-dd'), [date, dateStr]);
  const actualShiftKey = shiftKey || 'default';
  const actualActivityId = activity?.id || 'default';
  const dayData = getHistoryEntry(history, actualDateStr, actualShiftKey, actualActivityId);
  const { tasks: dayTasks = [], image: dayImage = null, notes: dayNotes = '', completed: isCompleted = false } = dayData;
  const relatedCycles = cycleCards.filter((card) => card.activityId === actualActivityId);
  const libraryTasks = Array.isArray(activity?.defaultTasks) ? activity.defaultTasks.filter(Boolean) : [];
  const currentTaskLookup = new Set(dayTasks.map((task) => normalizeTaskText(task.text)));
  const suggestedTasks = libraryTasks.filter((task) => !currentTaskLookup.has(normalizeTaskText(task)));
  const assignedTaskText = activity?.assignedTask?.trim() || '';
  const assignedTaskAlreadyTracked = activity?.assignedTask
    ? currentTaskLookup.has(normalizeTaskText(activity.assignedTask))
    : false;

  useEffect(() => {
    if (!activity?.assignedTask) return;
    if (assignedTaskAlreadyTracked) return;

    actions.updateDayData(
      actualDateStr,
      actualShiftKey,
      actualActivityId,
      {
        tasks: [...dayTasks, { id: crypto.randomUUID(), text: activity.assignedTask, completed: false }],
      },
      activity,
    );
  }, [
    actions,
    activity,
    actualActivityId,
    actualDateStr,
    actualShiftKey,
    assignedTaskAlreadyTracked,
    dayTasks,
  ]);

  useEffect(() => {
    if (!isExpanded) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isExpanded]);

  const isUrgent = useMemo(() => {
    if (!isToday || isCompleted) return false;
    const currentHour = new Date().getHours();
    if (config.routineMode === 'shifts') {
      if (shiftKey === 'morning' && currentHour >= 10) return true;
      if (shiftKey === 'afternoon' && currentHour >= 16) return true;
      if (shiftKey === 'night' && currentHour >= 21) return true;
    } else if (currentHour >= 18) {
      return true;
    }
    return false;
  }, [config.routineMode, isCompleted, isToday, shiftKey]);

  if (!activity) return null;

  const theme = THEMES[activity.theme] || THEMES.slate;
  const shouldOfferLibrarySave =
    newTaskText.trim().length > 0 &&
    !libraryTasks.some((task) => normalizeTaskText(task) === normalizeTaskText(newTaskText));
  const datalistId = `task-suggestions-${actualActivityId}`;

  const handleCompleteClick = (e) => {
    e.stopPropagation();
    if (isPast && !isCompleted) return;

    if (!isCompleted) {
      const rect = e.currentTarget.getBoundingClientRect();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
      });
    }

    actions.toggleComplete(actualDateStr, actualShiftKey, actualActivityId, activity);
  };

  const updateTasks = (nextTasks) => {
    actions.updateDayData(actualDateStr, actualShiftKey, actualActivityId, { tasks: nextTasks }, activity);
  };

  const appendTask = (taskText) => {
    const value = taskText.trim();
    if (!value) return;
    updateTasks([...dayTasks, { id: crypto.randomUUID(), text: value, completed: false }]);
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    appendTask(newTaskText);
    setNewTaskText('');
  };

  const saveTaskToLibrary = () => {
    const value = newTaskText.trim();
    if (!value) return;
    const nextLibraryTasks = [...libraryTasks, value];
    actions.saveActivity({ ...activity, defaultTasks: nextLibraryTasks });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      actions.updateDayData(actualDateStr, actualShiftKey, actualActivityId, { image: reader.result }, activity);
    };
    reader.readAsDataURL(file);
  };

  const modalContent = (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="relative w-full max-w-4xl premium-panel rounded-[2rem] border border-border shadow-[0_30px_90px_rgba(0,0,0,0.3)] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent_24%)] opacity-80 pointer-events-none" />
      {dayImage && (
        <>
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: `url(${dayImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(42px)',
              transform: 'scale(1.08)',
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_42%),linear-gradient(180deg,rgba(9,16,28,0.28),rgba(9,16,28,0.78))] pointer-events-none" />
        </>
      )}
      <div className="relative z-10 max-h-[88vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 z-20 bg-background/82 backdrop-blur-xl border-b border-border px-4 py-4 md:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.iconBox} text-2xl shadow-inner bg-background/50 border border-border shrink-0`}>
                {activity.emoji ? <span>{activity.emoji}</span> : <Icon size={24} strokeWidth={2} />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {shiftLabel && (
                    <div className="flex items-center gap-1.5 bg-background/80 border border-border px-2 py-1 rounded-md shadow-sm">
                      {SHIFT_ICONS[shiftKey] || SHIFT_ICONS.default}
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{shiftLabel}</span>
                    </div>
                  )}
                  {activity.fixed && (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 uppercase tracking-widest">
                      <Pin size={10} /> {t('fixed')}
                    </div>
                  )}
                  {isCompleted && (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20 uppercase tracking-widest">
                      <Check size={10} /> {t('done')}
                    </div>
                  )}
                </div>
                <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${theme.title}`}>{activity.name}</h2>
              </div>
            </div>

            <button
              onClick={onToggleExpand}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-secondary hover:bg-border text-foreground border border-border transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
          <div className="space-y-4">
            <div className="bg-secondary/50 p-4 rounded-2xl border border-border">
              <div className="flex justify-between items-center mb-3 text-[10px] uppercase text-muted-foreground font-bold tracking-widest">
                <label>{t('tasksTitle')}</label>
                <span>{dayTasks.filter((task) => task.completed).length}/{dayTasks.length}</span>
              </div>

              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto no-scrollbar pr-1">
                {dayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => updateTasks(dayTasks.map((item) => (item.id === task.id ? { ...item, completed: !item.completed } : item)))}
                    onDelete={() => updateTasks(dayTasks.filter((item) => item.id !== task.id))}
                  />
                ))}
                {dayTasks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border bg-background/30 p-4 text-center">
                    <span className="text-xs font-medium text-muted-foreground">{t('noTasks')}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    list={datalistId}
                    placeholder={t('taskPlaceholder')}
                    className="w-full h-10 bg-background/50 border border-border rounded-xl px-3 text-xs outline-none focus:border-primary transition-colors"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                  <datalist id={datalistId}>
                    {libraryTasks.map((task, index) => (
                      <option key={`${task}-${index}`} value={task} />
                    ))}
                  </datalist>
                  <button onClick={handleAddTask} className="w-10 h-10 shrink-0 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl flex items-center justify-center transition-colors">
                    <Plus size={14} />
                  </button>
                </div>

                {shouldOfferLibrarySave && (
                  <button
                    onClick={saveTaskToLibrary}
                    className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-2 rounded-xl hover:bg-primary/15 transition-colors"
                  >
                    <BookmarkPlus size={14} /> Salvar tambem na biblioteca
                  </button>
                )}

                {suggestedTasks.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] uppercase text-muted-foreground font-bold tracking-widest">
                      <Sparkles size={12} /> Sugestoes da biblioteca
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTasks.map((task, index) => (
                        <button
                          key={`${task}-${index}`}
                          onClick={() => appendTask(task)}
                          className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          {task}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {relatedCycles.length > 0 && (
              <div className="p-4 bg-background/60 border border-border rounded-2xl">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase mb-3 tracking-widest">
                  <KanbanSquare size={12} /> {t('cycles')}
                </div>
                <div className="space-y-2">
                  {relatedCycles.map((card) => (
                    <div key={card.id} className="rounded-xl border border-border bg-secondary/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">{card.title}</span>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground">{t(card.status)}</span>
                      </div>
                      {card.notes && <p className="text-xs text-muted-foreground mt-1">{card.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {dayImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-border group bg-background/40">
                <div className="absolute inset-0">
                  <img src={dayImage} className="w-full h-full object-cover scale-110 blur-2xl opacity-45" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/25 to-background/70" />
                </div>
                <div className="relative flex items-center justify-center p-4">
                  <div className="w-full aspect-square max-h-[20rem] rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_45px_rgba(0,0,0,0.28)]">
                    <img src={dayImage} className="w-full h-full object-cover" alt="Capture" />
                  </div>
                </div>
                <button
                  onClick={() => actions.updateDayData(actualDateStr, actualShiftKey, actualActivityId, { image: null }, activity)}
                  className="absolute top-3 right-3 bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-secondary/20 h-52 flex items-center justify-center">
                <div className="text-center px-6">
                  <ImageIcon size={20} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground">Anexe uma imagem para registrar progresso ou contexto.</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 h-10 rounded-xl text-[10px] font-bold uppercase border border-border transition-all flex items-center justify-center gap-2 ${dayImage ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-background hover:bg-secondary'}`}
              >
                <ImageIcon size={14} /> {dayImage ? t('changeImage') : t('addImage')}
              </button>
            </div>

            <div className="bg-secondary/40 border border-border rounded-2xl p-4">
              <label className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block tracking-widest">{t('notes')}</label>
              <textarea
                placeholder={t('notePlaceholder')}
                className="w-full h-36 bg-background border border-border rounded-xl p-3 text-xs outline-none resize-none focus:border-primary transition-colors"
                value={dayNotes}
                onChange={(e) => actions.updateDayData(actualDateStr, actualShiftKey, actualActivityId, { notes: e.target.value }, activity)}
              />
            </div>

            <button
              onClick={onToggleExpand}
              className="w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-secondary hover:bg-border text-foreground border border-border transition-all active:scale-[0.98]"
            >
              <Save size={14} /> {t('saveAndClose')}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={onToggleExpand}
        className={`relative rounded-2xl border p-4 flex flex-col overflow-hidden transition-all cursor-pointer group
          ${theme.card}
          min-h-44 hover:shadow-[0_20px_45px_rgba(0,0,0,0.16)] hover:-translate-y-1
          ${isCompleted ? 'opacity-70 grayscale-[0.3]' : ''}
          ${isUrgent ? 'ring-2 ring-orange-500/80 shadow-orange-500/20 animate-pulse' : ''}
        `}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),transparent_24%)] opacity-80 pointer-events-none" />
        {dayImage && (
          <div className="absolute inset-0 z-0">
            <img src={dayImage} alt="" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          </div>
        )}

        <div className="flex justify-between items-start mb-3 relative z-10">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.iconBox} text-2xl shadow-inner bg-background/50 backdrop-blur-md border border-border`}>
            {activity.emoji ? <span>{activity.emoji}</span> : <Icon size={24} strokeWidth={2} />}
          </div>

          <div className="flex flex-col items-end gap-1">
            {shiftLabel && (
              <div className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm border border-border px-2 py-1 rounded-md shadow-sm">
                {SHIFT_ICONS[shiftKey] || SHIFT_ICONS.default}
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{shiftLabel}</span>
              </div>
            )}
            {activity.fixed && (
              <div className="flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 uppercase tracking-widest">
                <Pin size={10} /> {t('fixed')}
              </div>
            )}
          </div>
        </div>

        <h2 className={`text-[1.3rem] font-bold mb-auto tracking-tight relative z-10 ${theme.title} ${isCompleted ? 'line-through decoration-muted-foreground' : ''}`}>
          {activity.name}
        </h2>

        {assignedTaskText && (
          <div className="mt-3 relative z-10">
            <div className="inline-flex max-w-full items-center rounded-xl bg-background/65 border border-border px-3 py-2">
              <span className="truncate text-[11px] font-semibold text-muted-foreground">
                {assignedTaskText}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-auto pt-3 relative z-10">
          <motion.button
            whileTap={{ scale: isPast && !isCompleted ? 1 : 0.95 }}
            onClick={handleCompleteClick}
            disabled={isPast && !isCompleted}
            className={`flex-1 h-10 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors
              ${isPast && !isCompleted ? 'bg-secondary text-muted-foreground opacity-50 cursor-not-allowed' : isCompleted ? 'bg-green-500 text-white dark:text-black hover:bg-green-600 border-none' : theme.buttonPrimary}
            `}
          >
            {isCompleted ? <Check size={16} strokeWidth={3} /> : isPast && !isCompleted ? <Lock size={14} /> : null}
            {isCompleted ? t('done') : t('mark')}
          </motion.button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-primary-foreground' : theme.actionButton}`}
          >
            <FileText size={16} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/58 backdrop-blur-md p-3 sm:p-5 md:p-8 flex items-center justify-center"
            onClick={onToggleExpand}
          >
            {modalContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DayCard;
