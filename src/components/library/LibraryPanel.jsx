import React, { useState } from 'react';
import { Palette, Plus, Trash2, Edit2, Save, X, List, CalendarClock, AlertCircle } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';
import { THEMES } from '../../entities/theme';

const DAYS_OF_WEEK = [
  { label: 'Seg', value: 0 },
  { label: 'Ter', value: 1 },
  { label: 'Qua', value: 2 },
  { label: 'Qui', value: 3 },
  { label: 'Sex', value: 4 },
  { label: 'Sáb', value: 5 },
];

const ActivityEditor = ({ initialData, onSave, onCancel }) => {
  const [data, setData] = useState(initialData || { 
    name: '', 
    iconName: 'Rocket', 
    theme: 'blue', 
    defaultTasks: [],
    // Novas propriedades de regras
    rules: {
      frequency: 1, // Quantas vezes na semana
      allowedDays: [0, 1, 2, 3, 4, 5] // Todos os dias (exceto domingo que é fixo)
    }
  });
  const [newTask, setNewTask] = useState('');

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
    const currentDays = data.rules?.allowedDays || [0,1,2,3,4,5];
    let newDays;
    if (currentDays.includes(dayIndex)) {
      newDays = currentDays.filter(d => d !== dayIndex);
    } else {
      newDays = [...currentDays, dayIndex];
    }
    setData(prev => ({ ...prev, rules: { ...prev.rules, allowedDays: newDays } }));
  };

  return (
    <div className="p-5 bg-[#1a1a1a] border border-blue-500/30 rounded-xl space-y-5 animate-in fade-in mb-4">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <h3 className="font-bold text-white text-sm">{initialData ? 'Editar Carta' : 'Nova Carta'}</h3>
        <button onClick={onCancel} className="text-white/40 hover:text-white"><X size={16}/></button>
      </div>
      
      {/* Nome e Cor */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase text-white/40 font-bold">Nome</label>
          <input 
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500/50 outline-none" 
            value={data.name}
            onChange={e => setData({...data, name: e.target.value})}
            placeholder="Ex: Academia"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase text-white/40 font-bold">Cor</label>
          <select 
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none"
            value={data.theme}
            onChange={e => setData({...data, theme: e.target.value})}
          >
            {Object.keys(THEMES).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* --- SEÇÃO DE REGRAS --- */}
      <div className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/10 space-y-3">
        <div className="flex items-center gap-2 text-blue-400 mb-1">
          <CalendarClock size={14} />
          <span className="text-xs font-bold uppercase">Regras de Embaralhamento</span>
        </div>
        
        <div className="flex items-center justify-between">
          <label className="text-xs text-white/70">Frequência Semanal:</label>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setData(prev => ({...prev, rules: {...prev.rules, frequency: Math.max(1, (prev.rules?.frequency || 1) - 1)}}))}
              className="w-6 h-6 bg-black/40 rounded text-white hover:bg-white/10"
            >-</button>
            <span className="text-sm font-bold text-white w-4 text-center">{data.rules?.frequency || 1}</span>
            <button 
              onClick={() => setData(prev => ({...prev, rules: {...prev.rules, frequency: Math.min(6, (prev.rules?.frequency || 1) + 1)}}))}
              className="w-6 h-6 bg-black/40 rounded text-white hover:bg-white/10"
            >+</button>
          </div>
        </div>

        <div>
          <label className="text-xs text-white/70 block mb-2">Dias Permitidos:</label>
          <div className="flex gap-1 justify-between">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = data.rules?.allowedDays?.includes(day.value);
              return (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={`
                    flex-1 py-1.5 rounded text-[10px] font-bold transition-all
                    ${isSelected 
                      ? `bg-${data.theme === 'white' ? 'gray' : data.theme}-500 text-white shadow-lg` 
                      : 'bg-black/40 text-white/30 hover:bg-white/5'}
                  `}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
          {(!data.rules?.allowedDays || data.rules.allowedDays.length === 0) && (
            <div className="flex items-center gap-2 mt-2 text-amber-400 text-[10px]">
              <AlertCircle size={12} /> Selecione pelo menos um dia!
            </div>
          )}
        </div>
      </div>

      {/* Lista de Tarefas */}
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
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Biblioteca</h2>
          <p className="text-xs text-white/40">Defina regras e frequências</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-white text-black font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200">
          <Plus size={16} /> Nova
        </button>
      </div>

      {isCreating && (
        <ActivityEditor 
          onSave={(data) => { actions.saveActivity(data); setIsCreating(false); }} 
          onCancel={() => setIsCreating(false)} 
        />
      )}

      <div className="grid grid-cols-1 gap-3">
        {activitiesPool.map(act => (
          <div key={act.id}>
            {editingId === act.id ? (
              <ActivityEditor 
                initialData={act} 
                onSave={(data) => { actions.saveActivity(data); setEditingId(null); }} 
                onCancel={() => setEditingId(null)} 
              />
            ) : (
              <div className="bg-[#121212] border border-white/10 rounded-xl p-4 flex justify-between items-center group hover:border-white/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${act.theme}-500/20 text-${act.theme}-400 border border-${act.theme}-500/30`}>
                     <Palette size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{act.name}</h3>
                    <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                      <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                        <CalendarClock size={10} /> {act.rules?.frequency || 1}x/sem
                      </span>
                      <span className="flex items-center gap-1">
                        <List size={10} /> {act.defaultTasks?.length || 0} tarefas
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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