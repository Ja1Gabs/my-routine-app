import React, { useState } from 'react';
import { Trophy, Plus, CheckCircle2, Target } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';

const GoalCard = ({ goal }) => {
  // Evita divisão por zero se target for 0 ou indefinido
  const target = goal.target || 1;
  const current = goal.current || 0;
  const percent = Math.min(100, (current / target) * 100);
  
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#121212] p-5 transition-all hover:border-white/20">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{goal.title}</h3>
            <p className="text-xs text-white/40">Meta: {target} | Atual: {current}</p>
          </div>
        </div>
        {percent >= 100 && <CheckCircle2 className="text-green-500" size={20} />}
      </div>

      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-yellow-600 to-amber-400 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const GoalPanel = () => {
  const { goals, actions } = useRoutine();
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target: 5 });

  const handleAdd = () => {
    if (!newGoal.title) return;
    // Garante que a função existe antes de chamar
    if (actions && actions.addGoal) {
      actions.addGoal({ ...newGoal, type: 'manual' });
      setNewGoal({ title: '', target: 5 });
      setShowForm(false);
    } else {
      console.error("Erro: actions.addGoal não encontrado no contexto");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Meus Objetivos</h2>
          <p className="text-xs text-white/40">Acompanhe seu progresso</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="text-xs bg-white text-black font-bold px-4 py-2 rounded-lg flex gap-2 items-center hover:bg-gray-200 transition-colors"
        >
          <Plus size={14} /> Novo Objetivo
        </button>
      </div>

      {showForm && (
        <div className="p-4 bg-[#1a1a1a] rounded-xl border border-white/10 space-y-3 mb-6 animate-in zoom-in-95">
          <label className="text-[10px] uppercase text-white/40 font-bold">Título da Meta</label>
          <input 
            type="text" 
            placeholder="Ex: Ler 5 livros este mês" 
            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
            value={newGoal.title}
            onChange={e => setNewGoal({...newGoal, title: e.target.value})}
          />
          
          <div className="flex gap-3">
            <div className="w-24">
              <label className="text-[10px] uppercase text-white/40 font-bold block mb-1">Alvo</label>
              <input 
                type="number" 
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
                value={newGoal.target}
                onChange={e => setNewGoal({...newGoal, target: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="flex-1 flex items-end">
              <button onClick={handleAdd} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black py-2 rounded-lg text-sm font-bold transition-colors">
                Salvar Meta
              </button>
            </div>
          </div>
        </div>
      )}

      {(!goals || goals.length === 0) ? (
        <div className="text-center py-16 text-white/30 border border-dashed border-white/10 rounded-xl bg-[#121212]">
          <Target className="mx-auto mb-3 opacity-50" size={40} />
          <p className="text-sm">Nenhuma meta ativa.</p>
          <p className="text-xs mt-1">Crie objetivos para se manter motivado!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
        </div>
      )}
    </div>
  );
};

export default GoalPanel;