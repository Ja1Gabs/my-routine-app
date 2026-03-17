import React, { useState } from 'react';
import { Trophy, Plus, CheckCircle2, Target, Flame, BarChart3, Edit3, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutine } from '../../context/RoutineContext';

const GoalCard = ({ goal, t, actions }) => {
  const target = goal.target || 1;
  const current = goal.current || 0;
  const percent = Math.min(100, (current / target) * 100);
  const isCompleted = percent >= 100;
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all group shadow-sm
        ${isCompleted ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-card hover:border-primary/30'}
      `}
    >
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shadow-inner border ${isCompleted ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm leading-tight">{goal.title}</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
              {t('goalCurrent')}: {current} / {target}
            </p>
          </div>
        </div>
        
        {/* Ações do Card */}
        <div className="flex items-center gap-2">
          {/* Botão +1 para Metas Manuais */}
          {goal.type === 'manual' && !isCompleted && (
            <button 
              onClick={() => actions.incrementGoal(goal.id)}
              className="bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground px-2 py-1 rounded-md text-[10px] font-bold transition-colors border border-border"
            >
              {t('increment')}
            </button>
          )}

          {isCompleted && (
            <div className="bg-green-500 text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <CheckCircle2 size={12} /> <span className="hidden sm:inline">{t('completedGoal')}</span>
            </div>
          )}

          {/* Botão Deletar (Fica visível no hover do card em PCs, ou sempre no mobile) */}
          <button 
            onClick={() => actions.deleteGoal(goal.id)}
            className="p-1.5 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground rounded-md opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-destructive/50"
            title={t('delete')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Barra de Progresso Fina e Elegante */}
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden relative z-10">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-yellow-500'}`}
        />
      </div>
    </motion.div>
  );
};

const GoalPanel = () => {
  const { goals, actions, t } = useRoutine();
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target: 5 });

  const templates =[
    { title: t('goalTemplate1'), desc: t('goalTemplate1Desc'), type: 'streak', target: 7, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
    { title: t('goalTemplate2'), desc: t('goalTemplate2Desc'), type: 'total_activities', target: 50, icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
    { title: t('goalTemplate3'), desc: t('goalTemplate3Desc'), type: 'streak', target: 21, icon: Trophy, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
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

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('myGoals')}</h2>
          <p className="text-xs text-muted-foreground">{t('trackProgress')}</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="text-xs bg-primary text-primary-foreground font-bold px-4 py-2.5 rounded-xl flex gap-2 items-center hover:opacity-90 transition-all shadow-md active:scale-95"
        >
          <Plus size={14} /> {t('newGoal')}
        </button>
      </div>

      {/* Formulário Retrátil */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
              
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Target size={14} /> {t('suggestedGoals')}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {templates.map((tpl, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleAddTemplate(tpl)}
                    className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-95 ${tpl.bg}`}
                  >
                    <tpl.icon size={20} className={`mb-2 ${tpl.color}`} />
                    <span className="font-bold text-sm text-foreground leading-tight">{tpl.title}</span>
                    <span className="text-[10px] text-muted-foreground mt-1 leading-tight">{tpl.desc}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-border pt-5">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Edit3 size={14} /> {t('customGoal')}
                </h3>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="w-full sm:flex-1">
                    <input 
                      type="text" 
                      placeholder={t('goalTitlePlaceholder')}
                      className={inputClass}
                      value={newGoal.title}
                      onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                    />
                  </div>
                  <div className="w-full sm:w-24">
                    <input 
                      type="number" 
                      className={inputClass}
                      value={newGoal.target}
                      onChange={e => setNewGoal({...newGoal, target: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <button onClick={handleAddManual} className="w-full sm:w-auto bg-foreground hover:bg-foreground/90 text-background px-6 py-2 rounded-lg text-sm font-bold transition-colors">
                    {t('save')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {goals?.map(goal => (
            <GoalCard key={goal.id} goal={goal} t={t} actions={actions} />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {(!goals || goals.length === 0) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl bg-card/50">
          <Target className="mx-auto mb-4 opacity-30" size={48} strokeWidth={1} />
          <p className="text-sm font-medium">{t('noGoals')}</p>
          <p className="text-xs mt-1 opacity-70">{t('noGoalsDesc')}</p>
        </motion.div>
      )}
    </div>
  );
};

export default GoalPanel;