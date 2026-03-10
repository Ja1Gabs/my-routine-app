import React, { useState } from 'react';
import { Trophy, Plus, CheckCircle2, Target, Flame, BarChart3, Edit3 } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';

const GoalCard = ({ goal, t, actions }) => {
  const target = goal.target || 1;
  const current = goal.current || 0;
  const percent = Math.min(100, (current / target) * 100);
  const isCompleted = percent >= 100;
  
  return (
    <div className={`relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md ${isCompleted ? 'ring-2 ring-green-500/50 bg-green-500/5' : ''}`}>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'}`}>
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">{goal.title}</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
              {t('goalCurrent')}: {current} / {target}
            </p>
          </div>
        </div>
        
        {/* Se a meta for manual e não estiver completa, mostra o botão +1 */}
        {goal.type === 'manual' && !isCompleted && (
          <button 
            onClick={() => actions.incrementGoal(goal.id)}
            className="bg-secondary hover:bg-border text-foreground px-2 py-1 rounded text-xs font-bold transition-colors"
          >
            +1
          </button>
        )}

        {isCompleted && (
          <div className="bg-green-500 text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <CheckCircle2 size={12} /> {t('completedGoal')}
          </div>
        )}
      </div>

      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden relative z-10">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-yellow-500 to-amber-500'}`}
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

  // Sugestões de Metas Pré-Criadas
  const templates =[
    { title: t('goalTemplate1'), desc: t('goalTemplate1Desc'), type: 'streak', target: 7, icon: Flame, color: 'text-orange-500' },
    { title: t('goalTemplate2'), desc: t('goalTemplate2Desc'), type: 'total_activities', target: 50, icon: BarChart3, color: 'text-blue-500' },
    { title: t('goalTemplate3'), desc: t('goalTemplate3Desc'), type: 'streak', target: 21, icon: Trophy, color: 'text-purple-500' },
  ];

  const handleAddManual = () => {
    if (!newGoal.title) return;
    actions.addGoal({ ...newGoal, type: 'manual' });
    setNewGoal({ title: '', target: 5 });
    setShowForm(false);
  };

  const handleAddTemplate = (template) => {
    actions.addGoal({ title: template.title, type: template.type, target: template.target });
    setShowForm(false);
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

      {/* Menu de Criação (Templates + Manual) */}
      {showForm && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6 animate-in zoom-in-95 shadow-lg">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{t('suggestedGoals')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {templates.map((tpl, i) => (
              <button 
                key={i} 
                onClick={() => handleAddTemplate(tpl)}
                className="flex flex-col items-start p-3 bg-secondary hover:bg-border border border-border rounded-lg text-left transition-colors"
              >
                <tpl.icon size={18} className={`mb-2 ${tpl.color}`} />
                <span className="font-bold text-sm text-foreground">{tpl.title}</span>
                <span className="text-[10px] text-muted-foreground mt-1">{tpl.desc}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
              <Edit3 size={14} /> {t('customGoal')}
            </h3>
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder={t('goalTitlePlaceholder')}
                className={`${inputClass} flex-1`}
                value={newGoal.title}
                onChange={e => setNewGoal({...newGoal, title: e.target.value})}
              />
              <input 
                type="number" 
                className={`${inputClass} w-20`}
                value={newGoal.target}
                onChange={e => setNewGoal({...newGoal, target: parseInt(e.target.value) || 0})}
              />
              <button onClick={handleAddManual} className="bg-yellow-500 hover:bg-yellow-600 text-white dark:text-black px-6 rounded-lg text-sm font-bold transition-colors shadow-sm">
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Metas Ativas */}
      {(!goals || goals.length === 0) ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl bg-card">
          <Target className="mx-auto mb-3 opacity-50" size={40} />
          <p className="text-sm">{t('noGoals')}</p>
          <p className="text-xs mt-1">{t('noGoalsDesc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => <GoalCard key={goal.id} goal={goal} t={t} actions={actions} />)}
        </div>
      )}
    </div>
  );
};

export default GoalPanel;