import React, { useState } from 'react';
import { Palette, Plus, Trash2, Edit2, Save, X, List, CalendarClock, AlertCircle } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';
import { THEMES } from '../../entities/theme';

const DAYS_OF_WEEK = [
  { label: 'Seg', value: 0 }, { label: 'Ter', value: 1 }, { label: 'Qua', value: 2 },
  { label: 'Qui', value: 3 }, { label: 'Sex', value: 4 }, { label: 'Sáb', value: 5 }, { label: 'Dom', value: 6 },
];

const ActivityEditor = ({ initialData, onSave, onCancel }) => {
  const { t } = useRoutine();
  const [data, setData] = useState(initialData || { 
    name: '', iconName: 'Rocket', emoji: '', theme: 'blue', defaultTasks: [],
    rules: { frequency: 1, allowedDays: [0, 1, 2, 3, 4, 5, 6] }
  });
  const [newTask, setNewTask] = useState('');
  const [iconType, setIconType] = useState(initialData?.emoji ? 'emoji' : 'icon');

  const addTask = () => {
    if (newTask.trim()) {
      setData(prev => ({ ...prev, defaultTasks: [...(prev.defaultTasks || []), newTask] }));
      setNewTask('');
    }
  };

  const removeTask = (index) => {
    setData(prev => ({ ...prev, defaultTasks: prev.defaultTasks.filter((_, i) => i !== index) }));
  };

  const toggleDay = (dayIndex) => {
    const currentDays = data.rules?.allowedDays || [0,1,2,3,4,5,6];
    let newDays = currentDays.includes(dayIndex) 
      ? currentDays.filter(d => d !== dayIndex) 
      : [...currentDays, dayIndex];
    setData(prev => ({ ...prev, rules: { ...prev.rules, allowedDays: newDays } }));
  };

  // CLASSE MÁGICA: Adapta ao tema (fundo claro no light mode, fundo escuro no dark mode)
  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-primary outline-none transition-colors placeholder:text-muted-foreground";
  const labelClass = "text-[10px] uppercase text-muted-foreground font-bold mb-1 block";

  return (
    <div className="p-5 bg-card border border-border rounded-xl space-y-5 animate-in fade-in mb-4 shadow-sm">
      <div className="flex justify-between items-center border-b border-border pb-2">
        <h3 className="font-bold text-foreground text-sm">{initialData ? t('editCard') : t('newCard')}</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X size={16}/></button>
      </div>
      
      {/* Nome */}
      <div>
        <label className={labelClass}>{t('cardName')}</label>
        <input 
          className={inputClass} 
          value={data.name}
          onChange={e => setData({...data, name: e.target.value})}
          placeholder="Ex: Academia"
        />
      </div>

      {/* Visual & Cor */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{t('visual')}</label>
          <div className="flex bg-secondary p-1 rounded-lg border border-border mb-2">
            <button onClick={() => setIconType('icon')} className={`flex-1 text-xs py-1 rounded transition-colors ${iconType === 'icon' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>{t('icon')}</button>
            <button onClick={() => setIconType('emoji')} className={`flex-1 text-xs py-1 rounded transition-colors ${iconType === 'emoji' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>{t('emoji')}</button>
          </div>

          {iconType === 'icon' ? (
            <select className={inputClass} value={data.iconName} onChange={e => setData({...data, iconName: e.target.value, emoji: ''})}>
              {['Code2','Rocket','Book','Dumbbell','Music','Coffee','Gamepad','Moon','Heart'].map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          ) : (
            <input className={`${inputClass} text-center text-lg`} placeholder={t('emojiPlaceholder')} value={data.emoji} onChange={e => setData({...data, emoji: e.target.value, iconName: ''})} maxLength={2} />
          )}
        </div>

        <div>
          <label className={labelClass}>{t('cardColor')}</label>
          <select className={inputClass} value={data.theme} onChange={e => setData({...data, theme: e.target.value})}>
            {Object.keys(THEMES).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Regras */}
      <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 space-y-3">
        <div className="flex items-center gap-2 text-primary mb-1">
          <CalendarClock size={14} />
          <span className="text-xs font-bold uppercase">{t('rulesTitle')}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <label className="text-xs text-foreground/80">{t('frequency')}:</label>
          <div className="flex items-center gap-2">
            <button onClick={() => setData(prev => ({...prev, rules: {...prev.rules, frequency: Math.max(1, (prev.rules?.frequency || 1) - 1)}}))} className="w-6 h-6 bg-secondary hover:bg-border rounded text-foreground">-</button>
            <span className="text-sm font-bold text-foreground w-4 text-center">{data.rules?.frequency || 1}</span>
            <button onClick={() => setData(prev => ({...prev, rules: {...prev.rules, frequency: Math.min(7, (prev.rules?.frequency || 1) + 1)}}))} className="w-6 h-6 bg-secondary hover:bg-border rounded text-foreground">+</button>
          </div>
        </div>

        <div>
          <label className="text-xs text-foreground/80 block mb-2">{t('allowedDays')}:</label>
          <div className="grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`py-1.5 rounded text-[10px] font-bold transition-all ${data.rules?.allowedDays?.includes(day.value) ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-muted-foreground hover:bg-border'}`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tarefas */}
      <div>
        <label className={labelClass}>{t('tasksTitle')}</label>
        <div className="flex gap-2 mb-2">
          <input className={`${inputClass} py-1.5 text-xs`} placeholder={t('taskPlaceholder')} value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
          <button onClick={addTask} className="bg-secondary hover:bg-border text-foreground p-2 rounded-lg border border-border"><Plus size={14}/></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.defaultTasks?.map((task, i) => (
            <span key={i} className="text-xs bg-secondary border border-border px-2 py-1 rounded text-foreground flex items-center gap-2">
              {task} <button onClick={() => removeTask(i)} className="hover:text-destructive">×</button>
            </span>
          ))}
        </div>
      </div>

      <button onClick={() => onSave(data)} className="w-full bg-primary hover:opacity-90 text-primary-foreground py-2 rounded-lg font-bold text-sm flex justify-center items-center gap-2 shadow-sm">
        <Save size={16}/> {t('saveCard')}
      </button>
    </div>
  );
};

const LibraryPanel = () => {
  const { activitiesPool, actions, t } = useRoutine();
  const [editingId, setEditingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('libTitle')}</h2>
          <p className="text-xs text-muted-foreground">{t('libSubtitle')}</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-primary text-primary-foreground font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 shadow-sm">
          <Plus size={16} /> {t('newCard')}
        </button>
      </div>

      {isCreating && <ActivityEditor onSave={(data) => { actions.saveActivity(data); setIsCreating(false); }} onCancel={() => setIsCreating(false)} />}

      <div className="grid grid-cols-1 gap-3">
        {activitiesPool.map(act => (
          <div key={act.id}>
            {editingId === act.id ? (
              <ActivityEditor initialData={act} onSave={(data) => { actions.saveActivity(data); setEditingId(null); }} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="bg-card border border-border rounded-xl p-4 flex justify-between items-center group hover:border-primary/50 transition-all shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${act.theme}-500/20 text-${act.theme}-500 border border-${act.theme}-500/30 text-lg`}>
                     {act.emoji ? act.emoji : <Palette size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{act.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1 bg-secondary px-1.5 py-0.5 rounded"><CalendarClock size={10} /> {act.rules?.frequency || 1}x</span>
                      <span className="flex items-center gap-1"><List size={10} /> {act.defaultTasks?.length || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(act.id)} className="p-2 text-muted-foreground hover:text-foreground bg-secondary hover:bg-border rounded-lg transition-colors"><Edit2 size={16}/></button>
                  <button onClick={() => actions.deleteActivity(act.id)} className="p-2 text-destructive hover:bg-destructive/10 bg-secondary rounded-lg transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LibraryPanel;