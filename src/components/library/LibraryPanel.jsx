import React, { useRef, useState } from 'react';
import {
  Palette,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  List,
  CalendarClock,
  Code2,
  Coffee,
  Rocket,
  Music,
  Moon,
  Book,
  Dumbbell,
  Gamepad,
  Heart,
  Briefcase,
  Pin,
  Shuffle,
  Download,
  Upload,
} from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';
import { THEMES } from '../../entities/theme';
import { useToast } from '../ui/ToastProvider';

const ICON_MAP = { Code2, Coffee, Rocket, Music, Palette, Moon, Book, Dumbbell, Gamepad, Heart, Briefcase };

const DAYS_OF_WEEK = [
  { label: 'Seg', value: 0 },
  { label: 'Ter', value: 1 },
  { label: 'Qua', value: 2 },
  { label: 'Qui', value: 3 },
  { label: 'Sex', value: 4 },
  { label: 'Sab', value: 5 },
  { label: 'Dom', value: 6 },
];

const SHIFT_OPTIONS = [
  { label: 'Manha', value: 'morning' },
  { label: 'Tarde', value: 'afternoon' },
  { label: 'Noite', value: 'night' },
];

const toggleItem = (list = [], value) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

const ActivityEditor = ({ initialData, onSave, onCancel }) => {
  const { t, config } = useRoutine();
  const [data, setData] = useState(
    initialData || {
      name: '',
      iconName: 'Rocket',
      emoji: '',
      theme: 'blue',
      defaultTasks: [],
      rules: {
        frequency: 1,
        appearanceChance: 1,
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
        allowedShifts: ['morning', 'afternoon', 'night'],
        pinnedDays: [],
      },
    },
  );
  const [newTask, setNewTask] = useState('');
  const [iconType, setIconType] = useState(initialData?.emoji ? 'emoji' : 'icon');

  const inputClass = 'w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-primary outline-none transition-colors placeholder:text-muted-foreground';
  const labelClass = 'text-[10px] uppercase text-muted-foreground font-bold mb-1.5 block tracking-wider';
  const theme = THEMES[data.theme] || THEMES.slate;
  const LiveIcon = ICON_MAP[data.iconName] || Rocket;
  const showShiftRules = config.routineMode === 'shifts';

  const saveData = () => {
    const nextRules = {
      frequency: Math.max(1, Number(data.rules?.frequency) || 1),
      appearanceChance: Math.min(1, Math.max(0, Number(data.rules?.appearanceChance ?? 1))),
      allowedDays: data.rules?.allowedDays?.length ? data.rules.allowedDays : [0, 1, 2, 3, 4, 5, 6],
      allowedShifts: showShiftRules
        ? (data.rules?.allowedShifts?.length ? data.rules.allowedShifts : ['morning'])
        : ['default'],
      pinnedDays: data.rules?.pinnedDays || [],
    };

    onSave({ ...data, rules: nextRules });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl mb-6 animate-in zoom-in-95">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-foreground text-lg">{initialData ? t('editCard') : t('newCard')}</h3>
        <button onClick={onCancel} className="p-2 bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col-reverse md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-primary uppercase border-b border-border pb-1">{t('basicInfo')}</h4>
            <div>
              <label className={labelClass}>{t('cardName')}</label>
              <input className={inputClass} value={data.name} placeholder="Ex: Meditacao, Academia..." onChange={(e) => setData({ ...data, name: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('visual')}</label>
                <div className="flex bg-secondary p-1 rounded-lg border border-border mb-2">
                  <button type="button" onClick={() => setIconType('icon')} className={`flex-1 text-xs py-1 rounded transition-colors ${iconType === 'icon' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>{t('icon')}</button>
                  <button type="button" onClick={() => setIconType('emoji')} className={`flex-1 text-xs py-1 rounded transition-colors ${iconType === 'emoji' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>{t('emoji')}</button>
                </div>
                {iconType === 'icon' ? (
                  <select className={inputClass} value={data.iconName} onChange={(e) => setData({ ...data, iconName: e.target.value, emoji: '' })}>
                    {Object.keys(ICON_MAP).map((iconName) => (
                      <option key={iconName} value={iconName}>{iconName}</option>
                    ))}
                  </select>
                ) : (
                  <input className={`${inputClass} text-center text-xl`} placeholder="🚀" value={data.emoji} onChange={(e) => setData({ ...data, emoji: e.target.value, iconName: '' })} maxLength={2} />
                )}
              </div>

              <div>
                <label className={labelClass}>{t('cardColor')}</label>
                <select className={inputClass} value={data.theme} onChange={(e) => setData({ ...data, theme: e.target.value })}>
                  {Object.keys(THEMES).map((themeName) => (
                    <option key={themeName} value={themeName}>{themeName.charAt(0).toUpperCase() + themeName.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-primary uppercase border-b border-border pb-1">{t('rulesConfig')}</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between bg-secondary p-3 rounded-xl border border-border">
                <label className="text-xs font-bold text-foreground">{t('frequency')}</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setData((prev) => ({ ...prev, rules: { ...prev.rules, frequency: Math.max(1, (prev.rules?.frequency || 1) - 1) } }))} className="w-7 h-7 bg-background shadow-sm rounded flex items-center justify-center text-foreground hover:bg-border transition-colors">-</button>
                  <span className="text-sm font-black text-foreground w-4 text-center">{data.rules?.frequency || 1}</span>
                  <button type="button" onClick={() => setData((prev) => ({ ...prev, rules: { ...prev.rules, frequency: Math.min(7, (prev.rules?.frequency || 1) + 1) } }))} className="w-7 h-7 bg-background shadow-sm rounded flex items-center justify-center text-foreground hover:bg-border transition-colors">+</button>
                </div>
              </div>

              <div className="bg-secondary p-3 rounded-xl border border-border space-y-2">
                <label className="text-xs font-bold text-foreground">{t('appearanceChance')}</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  className={inputClass}
                  value={data.rules?.appearanceChance ?? 1}
                  onChange={(e) => setData((prev) => ({ ...prev, rules: { ...prev.rules, appearanceChance: e.target.value } }))}
                />
                <p className="text-[11px] text-muted-foreground">{t('appearanceChanceDesc')}</p>
              </div>
            </div>

            <div>
              <label className={labelClass}>{t('allowedDays')}</label>
              <div className="flex gap-1 justify-between bg-secondary p-2 rounded-xl border border-border">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = data.rules?.allowedDays?.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => setData((prev) => ({ ...prev, rules: { ...prev.rules, allowedDays: toggleItem(prev.rules?.allowedDays || [], day.value) } }))}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${isSelected ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-background'}`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {showShiftRules && (
              <div>
                <label className={labelClass}>{t('allowedShifts')}</label>
                <div className="flex gap-2 bg-secondary p-2 rounded-xl border border-border">
                  {SHIFT_OPTIONS.map((shift) => {
                    const isSelected = data.rules?.allowedShifts?.includes(shift.value);
                    return (
                      <button
                        key={shift.value}
                        type="button"
                        onClick={() => setData((prev) => {
                          const nextShifts = toggleItem(prev.rules?.allowedShifts || [], shift.value);
                          return { ...prev, rules: { ...prev.rules, allowedShifts: nextShifts.length > 0 ? nextShifts : [shift.value] } };
                        })}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${isSelected ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-background'}`}
                      >
                        {shift.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>{t('fixedDays')}</label>
              <div className="flex gap-1 justify-between bg-secondary p-2 rounded-xl border border-border">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = data.rules?.pinnedDays?.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => setData((prev) => ({ ...prev, rules: { ...prev.rules, pinnedDays: toggleItem(prev.rules?.pinnedDays || [], day.value) } }))}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${isSelected ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-background'}`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">{t('fixedDaysDesc')}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-primary uppercase border-b border-border pb-1">{t('tasksTitle')}</h4>
            <div className="flex gap-2">
              <input className={inputClass} placeholder={t('taskPlaceholder')} value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && newTask.trim() && (setData((prev) => ({ ...prev, defaultTasks: [...(prev.defaultTasks || []), newTask] })), setNewTask(''))} />
              <button type="button" onClick={() => newTask.trim() && (setData((prev) => ({ ...prev, defaultTasks: [...(prev.defaultTasks || []), newTask] })), setNewTask(''))} className="bg-primary hover:opacity-90 text-primary-foreground px-4 rounded-lg font-bold transition-colors">
                <Plus size={16} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {data.defaultTasks?.map((task, index) => (
                <span key={`${task}-${index}`} className="text-xs bg-secondary border border-border pl-3 pr-1 py-1 rounded-lg text-foreground flex items-center gap-2 shadow-sm">
                  {task}
                  <button type="button" onClick={() => setData((prev) => ({ ...prev, defaultTasks: prev.defaultTasks.filter((_, taskIndex) => taskIndex !== index) }))} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button onClick={saveData} className="w-full bg-foreground hover:bg-foreground/90 text-background py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 shadow-lg transition-all active:scale-95 mt-4">
            <Save size={18} /> {t('saveCard')}
          </button>
        </div>

        <div className="w-full md:w-64 flex-shrink-0 flex flex-col items-center">
          <label className="text-[10px] uppercase text-muted-foreground font-bold mb-3 tracking-widest">{t('preview')}</label>
          <div className={`w-full h-52 rounded-2xl border p-4 flex flex-col shadow-lg transition-all ${theme.card}`}>
            <div className="flex justify-between items-start mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.iconBox} text-2xl shadow-sm bg-background border border-border transition-colors`}>
                {data.emoji ? <span>{data.emoji}</span> : <LiveIcon size={24} strokeWidth={2} />}
              </div>
              {data.rules?.pinnedDays?.length > 0 && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-1 flex items-center gap-1">
                  <Pin size={10} /> {t('fixed')}
                </span>
              )}
            </div>
            <h2 className={`text-xl font-bold mb-auto tracking-tight ${theme.title} transition-colors`}>{data.name || 'Nova Carta'}</h2>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-3">
              <Shuffle size={12} />
              <span>{t('appearanceChance')}: {Number(data.rules?.appearanceChance ?? 1).toFixed(2)}</span>
            </div>
            <div className={`h-10 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${theme.buttonPrimary}`}>
              {t('mark')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LibraryPanel = () => {
  const { activitiesPool, actions, t } = useRoutine();
  const toast = useToast();
  const [editingId, setEditingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const importInputRef = useRef(null);

  const exportLibrary = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      activities: activitiesPool,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `my-routine-library-${stamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importLibrary = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const rawText = await file.text();
      const parsed = JSON.parse(rawText);
      const importedActivities = Array.isArray(parsed) ? parsed : parsed.activities;

      if (!Array.isArray(importedActivities) || importedActivities.length === 0) {
        toast.warning('Importação vazia', 'O arquivo não trouxe cartas válidas para a biblioteca.');
        return;
      }

      const normalizedActivities = importedActivities.map((activity) => ({
        ...activity,
        id: activity.id || crypto.randomUUID(),
        rules: {
          frequency: 1,
          appearanceChance: 1,
          allowedDays: [0, 1, 2, 3, 4, 5, 6],
          allowedShifts: ['morning', 'afternoon', 'night'],
          pinnedDays: [],
          ...activity.rules,
        },
        defaultTasks: Array.isArray(activity.defaultTasks) ? activity.defaultTasks : [],
      }));

      if (actions.importActivities) {
        await actions.importActivities(normalizedActivities);
      } else {
        normalizedActivities.forEach((activity) => {
          actions.saveActivity(activity);
        });
      }

      toast.success('Biblioteca importada', `${importedActivities.length} carta(s) foram adicionadas à sua biblioteca.`);
    } catch (error) {
      toast.error('Falha ao importar', 'Nao foi possivel importar esse arquivo.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in pb-6 md:pb-8">
      {!isCreating && !editingId && (
        <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm mb-6">
          <div>
            <h2 className="text-xl font-black text-foreground">{t('libTitle')}</h2>
            <p className="text-xs text-muted-foreground">{activitiesPool.length} cartas criadas</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={importLibrary}
            />
            <button
              onClick={() => importInputRef.current?.click()}
              className="bg-secondary text-foreground font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-border transition-all shadow-sm active:scale-95"
            >
              <Upload size={16} /> Importar
            </button>
            <button
              onClick={exportLibrary}
              className="bg-secondary text-foreground font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-border transition-all shadow-sm active:scale-95"
            >
              <Download size={16} /> Exportar
            </button>
            <button onClick={() => setIsCreating(true)} className="bg-primary text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-md active:scale-95">
              <Plus size={16} /> {t('newCard')}
            </button>
          </div>
        </div>
      )}

      {isCreating && <ActivityEditor onSave={(nextData) => { actions.saveActivity(nextData); setIsCreating(false); }} onCancel={() => setIsCreating(false)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activitiesPool.map((activity) => {
          const theme = THEMES[activity.theme] || THEMES.slate;
          const Icon = ICON_MAP[activity.iconName] || Palette;

          return (
            <React.Fragment key={activity.id}>
              {editingId === activity.id ? (
                <div className="col-span-1 md:col-span-2">
                  <ActivityEditor initialData={activity} onSave={(nextData) => { actions.saveActivity(nextData); setEditingId(null); }} onCancel={() => setEditingId(null)} />
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-5 flex flex-col group hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.iconBox} border border-border text-2xl shadow-sm`}>
                      {activity.emoji ? activity.emoji : <Icon size={22} />}
                    </div>
                    <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingId(activity.id)} className="p-2 text-muted-foreground hover:text-foreground bg-secondary hover:bg-border rounded-lg transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => actions.deleteActivity(activity.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 bg-secondary rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground text-lg leading-tight mb-3">{activity.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    <span className="flex items-center gap-1 bg-secondary border border-border px-2 py-1 rounded-md text-[10px] font-bold text-muted-foreground uppercase"><CalendarClock size={10} /> {activity.rules?.frequency || 1}x/sem</span>
                    <span className="flex items-center gap-1 bg-secondary border border-border px-2 py-1 rounded-md text-[10px] font-bold text-muted-foreground uppercase"><List size={10} /> {activity.defaultTasks?.length || 0} tarefas</span>
                    <span className="flex items-center gap-1 bg-secondary border border-border px-2 py-1 rounded-md text-[10px] font-bold text-muted-foreground uppercase"><Shuffle size={10} /> {Number(activity.rules?.appearanceChance ?? 1).toFixed(2)}</span>
                    {activity.rules?.pinnedDays?.length > 0 && (
                      <span className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-2 py-1 rounded-md text-[10px] font-bold text-primary uppercase"><Pin size={10} /> {t('fixed')}</span>
                    )}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default LibraryPanel;
