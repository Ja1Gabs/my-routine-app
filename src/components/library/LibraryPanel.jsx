import React, { useState } from 'react';
import { Palette, Plus, Trash2, Edit2, Save, X, Smile, LayoutGrid, CalendarClock, AlertCircle } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';
import { THEMES } from '../../entities/theme';

const DAYS_OF_WEEK = [
  { label: 'Seg', value: 0 }, { label: 'Ter', value: 1 }, { label: 'Qua', value: 2 },
  { label: 'Qui', value: 3 }, { label: 'Sex', value: 4 }, { label: 'Sáb', value: 5 }, { label: 'Dom', value: 6 },
];

const ActivityEditor = ({ initialData, onSave, onCancel }) => {
  const [data, setData] = useState(initialData || { 
    name: '', iconName: 'Rocket', emoji: '', theme: 'blue', defaultTasks: [],
    rules: { frequency: 1, allowedDays: [0, 1, 2, 3, 4, 5, 6] }
  });
  const [newTask, setNewTask] = useState('');
  const [iconType, setIconType] = useState(initialData?.emoji ? 'emoji' : 'icon'); // 'icon' | 'emoji'

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
    let newDays;
    if (currentDays.includes(dayIndex)) newDays = currentDays.filter(d => d !== dayIndex);
    else newDays = [...currentDays, dayIndex];
    setData(prev => ({ ...prev, rules: { ...prev.rules, allowedDays: newDays } }));
  };

  return (
    <div className="p-5 bg-[#1a1a1a] border border-blue-500/30 rounded-xl space-y-5 animate-in fade-in mb-4">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <h3 className="font-bold text-white text-sm">{initialData ? 'Editar Carta' : 'Nova Carta'}</h3>
        <button onClick={onCancel} className="text-white/40 hover:text-white"><X size={16}/></button>
      </div>
      
      {/* Nome */}
      <div>
        <label className="text-[10px] uppercase text-white/40 font-bold">Nome da Atividade</label>
        <input 
          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500/50 outline-none mt-1" 
          value={data.name}
          onChange={e => setData({...data, name: e.target.value})}
          placeholder="Ex: Treino de Perna"
        />
      </div>

      {/* Seletor de Ícone/Emoji */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase text-white/40 font-bold mb-1 block">Visual</label>
          <div className="flex bg-black/50 p-1 rounded-lg border border-white/10 mb-2">
            <button 
              onClick={() => setIconType('icon')}
              className={`flex-1 text-xs py-1 rounded ${iconType === 'icon' ? 'bg-white/20 text-white' : 'text-white/40'}`}
            >
              Ícone
            </button>
            <button 
              onClick={() => setIconType('emoji')}
              className={`flex-1 text-xs py-1 rounded ${iconType === 'emoji' ? 'bg-white/20 text-white' : 'text-white/40'}`}
            >
              Emoji
            </button>
          </div>

          {iconType === 'icon' ? (
            <select 
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
              value={data.iconName}
              onChange={e => setData({...data, iconName: e.target.value, emoji: ''})}
            >
              {['Code2','Rocket','Book','Dumbbell','Music','Coffee','Gamepad','Moon','Briefcase','Heart'].map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          ) : (
            <input 
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-center text-lg outline-none"
              placeholder="Cole um emoji aqui (ex: 💪)"
              value={data.emoji}
              onChange={e => setData({...data, emoji: e.target.value, iconName: ''})}
              maxLength={2}
            />
          )}
        </div>

        <div>
          <label className="text-[10px] uppercase text-white/40 font-bold mb-1 block">Cor do Tema</label>
          <select 
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
            value={data.theme}
            onChange={e => setData({...data, theme: e.target.value})}
          >
            {Object.keys(THEMES).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Regras */}
      <div className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/10 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs text-white/70">Frequência Semanal:</label>
          <div className="flex items-center gap-2">
            <button onClick={() => setData(prev => ({...prev, rules: {...prev.rules, frequency: Math.max(1, (prev.rules?.frequency || 1) - 1)}}))} className="w-6 h-6 bg-black/40 rounded text-white">-</button>
            <span className="text-sm font-bold text-white w-4 text-center">{data.rules?.frequency || 1}</span>
            <button onClick={() => setData(prev => ({...prev, rules: {...prev.rules, frequency: Math.min(7, (prev.rules?.frequency || 1) + 1)}}))} className="w-6 h-6 bg-black/40 rounded text-white">+</button>
          </div>
        </div>

        <div>
          <label className="text-xs text-white/70 block mb-2">Dias Permitidos:</label>
          <div className="grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`py-1.5 rounded text-[10px] font-bold ${data.rules?.allowedDays?.includes(day.value) ? `bg-${data.theme === 'white' ? 'gray' : data.theme}-500 text-white` : 'bg-black/40 text-white/30'}`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tarefas */}
      <div>
        <label className="text-[10px] uppercase text-white/40 font-bold mb-1 block">Tarefas (Sorteio)</label>
        <div className="flex gap-2 mb-2">
          <input 
            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none"
            placeholder="Nova tarefa..."
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
          />
          <button onClick={addTask} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg"><Plus size={14}/></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.defaultTasks?.map((task, i) => (
            <span key={i} className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded text-white/70 flex items-center gap-2">
              {task} <button onClick={() => removeTask(i)} className="hover:text-red-400">×</button>
            </span>
          ))}
        </div>
      </div>

      <button onClick={() => onSave(data)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold text-sm flex justify-center items-center gap-2">
        <Save size={16}/> Salvar Carta
      </button>
    </div>
  );
};

const LibraryPanel = () => {
  const { activitiesPool, actions } = useRoutine();
  const [editingId, setEditingId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Biblioteca</h2>
        <button onClick={() => setIsCreating(true)} className="bg-white text-black font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200">
          <Plus size={16} /> Nova
        </button>
      </div>

      {isCreating && <ActivityEditor onSave={(data) => { actions.saveActivity(data); setIsCreating(false); }} onCancel={() => setIsCreating(false)} />}

      <div className="grid grid-cols-1 gap-3">
        {activitiesPool.map(act => (
          <div key={act.id}>
            {editingId === act.id ? (
              <ActivityEditor initialData={act} onSave={(data) => { actions.saveActivity(data); setEditingId(null); }} onCancel={() => setEditingId(null)} />
            ) : (
              <div className="bg-[#121212] border border-white/10 rounded-xl p-4 flex justify-between items-center group hover:border-white/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${act.theme}-500/20 text-${act.theme}-400 border border-${act.theme}-500/30 text-lg`}>
                     {act.emoji ? act.emoji : <LayoutGrid size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{act.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                      <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded"><CalendarClock size={10} /> {act.rules?.frequency || 1}x</span>
                      <span>{act.defaultTasks?.length || 0} tarefas</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(act.id)} className="p-2 text-white/60 hover:text-white bg-white/5 rounded-lg"><Edit2 size={16}/></button>
                  <button onClick={() => actions.deleteActivity(act.id)} className="p-2 text-red-400 hover:bg-red-500/10 bg-white/5 rounded-lg"><Trash2 size={16}/></button>
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