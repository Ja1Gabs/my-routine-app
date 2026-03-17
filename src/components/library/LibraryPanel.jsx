import React, { useState } from 'react';
import { Palette, Plus, Trash2, Edit2, Save, X, List, CalendarClock, Code2, Coffee, Rocket, Music, Moon, Book, Dumbbell, Gamepad, Heart, Briefcase } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';
import { THEMES } from '../../entities/theme';

const ICON_MAP = { Code2, Coffee, Rocket, Music, Palette, Moon, Book, Dumbbell, Gamepad, Heart, Briefcase };

const DAYS_OF_WEEK =[
  { label: 'Seg', value: 0 }, { label: 'Ter', value: 1 }, { label: 'Qua', value: 2 },
  { label: 'Qui', value: 3 }, { label: 'Sex', value: 4 }, { label: 'Sáb', value: 5 }, { label: 'Dom', value: 6 },
];

const ActivityEditor = ({ initialData, onSave, onCancel }) => {
  const { t, config } = useRoutine();
  const [data, setData] = useState(initialData || { 
    name: 'Nova Atividade', iconName: 'Rocket', emoji: '', theme: 'blue', defaultTasks:[],
    rules: { frequency: 1, allowedDays:[0, 1, 2, 3, 4, 5, 6] }
  });
  const [newTask, setNewTask] = useState('');
  const [iconType, setIconType] = useState(initialData?.emoji ? 'emoji' : 'icon');

  const addTask = () => {
    if (newTask.trim()) {
      setData(prev => ({ ...prev, defaultTasks: [...(prev.defaultTasks || []), newTask] }));
      setNewTask('');
    }
  };

  const toggleDay = (dayIndex) => {
    const currentDays = data.rules?.allowedDays ||[0,1,2,3,4,5,6];
    let newDays = currentDays.includes(dayIndex) ? currentDays.filter(d => d !== dayIndex) : [...currentDays, dayIndex];
    setData(prev => ({ ...prev, rules: { ...prev.rules, allowedDays: newDays } }));
  };

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:border-primary outline-none transition-colors placeholder:text-muted-foreground";
  const labelClass = "text-[10px] uppercase text-muted-foreground font-bold mb-1.5 block tracking-wider";

  // Estilo do Tema em Tempo Real
  const theme = THEMES[data.theme] || THEMES.slate;
  const LiveIcon = ICON_MAP[data.iconName] || Rocket;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-xl mb-6 animate-in zoom-in-95">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black text-foreground text-lg">{initialData ? t('editCard') : t('newCard')}</h3>
        <button onClick={onCancel} className="p-2 bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors"><X size={16}/></button>
      </div>
      
      <div className="flex flex-col-reverse md:flex-row gap-8">
        
        {/* LADO ESQUERDO: FORMULÁRIO */}
        <div className="flex-1 space-y-6">
          
          {/* Seção 1: Identidade */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-primary uppercase border-b border-border pb-1">{t('basicInfo')}</h4>
            
            <div>
              <label className={labelClass}>{t('cardName')}</label>
              <input 
                className={inputClass} value={data.name}
                onChange={e => setData({...data, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('visual')}</label>
                <div className="flex bg-secondary p-1 rounded-lg border border-border mb-2">
                  <button onClick={() => setIconType('icon')} className={`flex-1 text-xs py-1 rounded transition-colors ${iconType === 'icon' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>{t('icon')}</button>
                  <button onClick={() => setIconType('emoji')} className={`flex-1 text-xs py-1 rounded transition-colors ${iconType === 'emoji' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>{t('emoji')}</button>
                </div>
                {iconType === 'icon' ? (
                  <select className={inputClass} value={data.iconName} onChange={e => setData({...data, iconName: e.target.value, emoji: ''})}>
                    {Object.keys(ICON_MAP).map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                ) : (
                  <input className={`${inputClass} text-center text-xl`} placeholder="🚀" value={data.emoji} onChange={e => setData({...data, emoji: e.target.value, iconName: ''})} maxLength={2} />
                )}
              </div>

              <div>
                <label className={labelClass}>{t('cardColor')}</label>
                <div className="relative">
                  <select className={`${inputClass} pl-8`} value={data.theme} onChange={e => setData({...data, theme: e.target.value})}>
                    {Object.keys(THEMES).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                  {/* Cor do preview no select */}
                  <div className={`absolute left-3 top-3.5 w-3 h-3 rounded-full bg-${data.theme}-500`} />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Regras */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-primary uppercase border-b border-border pb-1">{t('rulesConfig')}</h4>
            
            <div className="flex items-center justify-between bg-secondary p-3 rounded-xl border border-border">
              <label className="text-xs font-bold text-foreground">{t('frequency')}</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setData(prev => ({...prev, rules: {...prev.rules, frequency: Math.max(1, (prev.rules?.frequency || 1) - 1)}}))} className="w-7 h-7 bg-background shadow-sm rounded flex items-center justify-center text-foreground hover:bg-border transition-colors">-</button>
                <span className="text-sm font-black text-foreground w-4 text-center">{data.rules?.frequency || 1}</span>
                <button onClick={() => setData(prev => ({...prev, rules: {...prev.rules, frequency: Math.min(7, (prev.rules?.frequency || 1) + 1)}}))} className="w-7 h-7 bg-background shadow-sm rounded flex items-center justify-center text-foreground hover:bg-border transition-colors">+</button>
              </div>
            </div>

            <div>
              <label className={labelClass}>{t('allowedDays')}</label>
              <div className="flex gap-1 justify-between bg-secondary p-2 rounded-xl border border-border">
                {DAYS_OF_WEEK.map((day) => {
                  const isSel = data.rules?.allowedDays?.includes(day.value);
                  return (
                    <button key={day.value} onClick={() => toggleDay(day.value)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${isSel ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-background'}`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {config.routineMode === 'shifts' && (
              <div>
                <label className={labelClass}>Turnos Permitidos</label>
                <div className="flex gap-2">
                  {['morning', 'afternoon', 'night'].map((shift) => {
                    const isSel = !data.rules?.allowedShifts || data.rules.allowedShifts.includes(shift);
                    return (
                      <button key={shift} onClick={() => {
                          const current = data.rules?.allowedShifts || ['morning','afternoon','night'];
                          const newS = current.includes(shift) ? current.filter(s => s !== shift) : [...current, shift];
                          setData(prev => ({ ...prev, rules: { ...prev.rules, allowedShifts: newS } }));
                        }}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all border ${isSel ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-secondary text-muted-foreground border-border hover:bg-border'}`}
                      >
                        {t(shift)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Seção 3: Tarefas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-primary uppercase border-b border-border pb-1">{t('tasksTitle')}</h4>
            <div className="flex gap-2">
              <input className={inputClass} placeholder={t('taskPlaceholder')} value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
              <button onClick={addTask} className="bg-primary hover:opacity-90 text-primary-foreground px-4 rounded-lg font-bold transition-colors"><Plus size={16}/></button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {data.defaultTasks?.map((task, i) => (
                <span key={i} className="text-xs bg-secondary border border-border px-3 py-1.5 rounded-lg text-foreground flex items-center gap-2 shadow-sm">
                  {task} <button onClick={() => removeTask(i)} className="text-muted-foreground hover:text-destructive transition-colors"><X size={14}/></button>
                </span>
              ))}
            </div>
          </div>

          <button onClick={() => onSave(data)} className="w-full bg-foreground hover:bg-foreground/90 text-background py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 shadow-lg transition-all active:scale-95 mt-4">
            <Save size={18}/> {t('saveCard')}
          </button>

        </div>

        {/* LADO DIREITO: LIVE PREVIEW (Heurística de Feedback Real) */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col items-center">
          <label className="text-[10px] uppercase text-muted-foreground font-bold mb-3 tracking-widest">{t('preview')}</label>
          
          {/* Mockup exato do DayCard */}
          <div className={`w-full h-44 rounded-2xl border p-4 flex flex-col shadow-lg transition-all ${theme.card}`}>
            <div className="flex justify-between items-start mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme.iconBox} text-2xl shadow-sm bg-background border border-border transition-colors`}>
                {data.emoji ? <span>{data.emoji}</span> : <LiveIcon size={24} strokeWidth={2} />}
              </div>
            </div>
            <h2 className={`text-xl font-bold mb-auto tracking-tight ${theme.title} transition-colors`}>{data.name || 'Nova Carta'}</h2>
            <div className={`h-10 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${theme.buttonPrimary}`}>
              {t('mark')}
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full border border-border">
              <CalendarClock size={12}/> Sorteado {data.rules?.frequency || 1}x por semana
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const LibraryPanel = () => {
  const { activitiesPool, actions, t } = useRoutine();
  const [editingId, setEditingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in pb-20">
      
      {!isCreating && !editingId && (
        <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm mb-6">
          <div>
            <h2 className="text-xl font-black text-foreground">{t('libTitle')}</h2>
            <p className="text-xs text-muted-foreground">{activitiesPool.length} cartas criadas</p>
          </div>
          <button onClick={() => setIsCreating(true)} className="bg-primary text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-md active:scale-95">
            <Plus size={16} /> {t('newCard')}
          </button>
        </div>
      )}

      {isCreating && <ActivityEditor onSave={(data) => { actions.saveActivity(data); setIsCreating(false); }} onCancel={() => setIsCreating(false)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activitiesPool.map(act => (
          <React.Fragment key={act.id}>
            {editingId === act.id ? (
              <div className="col-span-1 md:col-span-2">
                <ActivityEditor initialData={act} onSave={(data) => { actions.saveActivity(data); setEditingId(null); }} onCancel={() => setEditingId(null)} />
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-5 flex flex-col group hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${act.theme}-500/10 text-${act.theme}-600 dark:text-${act.theme}-400 border border-${act.theme}-500/20 text-2xl shadow-sm`}>
                     {act.emoji ? act.emoji : <Palette size={24} />}
                  </div>
                  <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingId(act.id)} className="p-2 text-muted-foreground hover:text-foreground bg-secondary hover:bg-border rounded-lg transition-colors"><Edit2 size={14}/></button>
                    <button onClick={() => actions.deleteActivity(act.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 bg-secondary rounded-lg transition-colors"><Trash2 size={14}/></button>
                  </div>
                </div>
                
                <h3 className="font-bold text-foreground text-lg leading-tight mb-3">{act.name}</h3>
                
                <div className="flex flex-wrap gap-2 mt-auto">
                  <span className="flex items-center gap-1 bg-secondary border border-border px-2 py-1 rounded-md text-[10px] font-bold text-muted-foreground uppercase"><CalendarClock size={10} /> {act.rules?.frequency || 1}x/sem</span>
                  <span className="flex items-center gap-1 bg-secondary border border-border px-2 py-1 rounded-md text-[10px] font-bold text-muted-foreground uppercase"><List size={10} /> {act.defaultTasks?.length || 0} Tarefas</span>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default LibraryPanel;