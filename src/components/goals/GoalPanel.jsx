import React, { useState } from 'react';
import { Trophy, Plus, CheckCircle2, Target } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';

const GoalCard = ({ goal, t }) => {
  const target = goal.target || 1;
  const current = goal.current || 0;
  const percent = Math.min(100, (current / target) * 100);
  
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">{goal.title}</h3>
            <p className="text-xs text-muted-foreground">
              {t('goalMeta')}: {target} | {t('goalCurrent')}: {current}
            </p>
          </div>
        </div>
        {percent >= 100 && <CheckCircle2 className="text-green-500" size={20} />}
      </div>

      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const GoalPanel = () => {
  const { goals, actions, t } = useRoutine();
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target: 5 });

  const handleAdd = () => {
    if (!newGoal.title) return;
    if (actions && actions.addGoal) {
      actions.addGoal({ ...newGoal, type: 'manual' });
      setNewGoal({ title: '', target: 5 });
      setShowForm(false);
    }
  };

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-yellow-500/50 placeholder:text-muted-foreground transition-colors";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('myGoals')}</h2>
          <p className="text-xs text-muted-foreground">{t('trackProgress')}</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="text-xs bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg flex gap-2 items-center hover:opacity-90 transition-all shadow-sm"
        >
          <Plus size={14} /> {t('newGoal')}
        </button>
      </div>

      {showForm && (
        <div className="p-4 bg-card rounded-xl border border-border space-y-3 mb-6 animate-in zoom-in-95 shadow-lg">
          <label className="text-[10px] uppercase text-muted-foreground font-bold">{t('goalTitle')}</label>
          <input 
            type="text" 
            placeholder={t('goalTitlePlaceholder')}
            className={inputClass}
            value={newGoal.title}
            onChange={e => setNewGoal({...newGoal, title: e.target.value})}
          />
          
          <div className="flex gap-3">
            <div className="w-24">
              <label className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">{t('goalTarget')}</label>
              <input 
                type="number" 
                className={inputClass}
                value={newGoal.target}
                onChange={e => setNewGoal({...newGoal, target: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="flex-1 flex items-end">
              <button onClick={handleAdd} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white dark:text-black py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                {t('saveGoal')}
              </button>
            </div>
          </div>
        </div>
      )}

      {(!goals || goals.length === 0) ? (
        // CORREÇÃO: bg-card e border-dashed para ficar bonito no modo claro
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl bg-card">
          <Target className="mx-auto mb-3 opacity-50" size={40} />
          <p className="text-sm">{t('noGoals')}</p>
          <p className="text-xs mt-1">{t('noGoalsDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => <GoalCard key={goal.id} goal={goal} t={t} />)}
        </div>
      )}
    </div>
  );
};

export default GoalPanel;