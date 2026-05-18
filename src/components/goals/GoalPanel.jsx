import React, { useMemo, useState } from 'react';
import {
  Trophy,
  Plus,
  CheckCircle2,
  Target,
  Flame,
  BarChart3,
  Edit3,
  Trash2,
  Sparkles,
  ArrowUpRight,
  CalendarRange,
  CheckCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutine } from '../../context/RoutineContext';

const GOAL_META = {
  manual: {
    icon: Edit3,
    label: 'Manual',
    chip: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    accent: 'from-slate-500/18 to-slate-500/4',
    helper: 'Voce controla o progresso manualmente.',
  },
  streak: {
    icon: Flame,
    label: 'Sequencia',
    chip: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    accent: 'from-orange-500/18 to-orange-500/4',
    helper: 'Atualiza com sua sequencia diaria atual.',
  },
  total_activities: {
    icon: BarChart3,
    label: 'Atividades',
    chip: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    accent: 'from-blue-500/18 to-blue-500/4',
    helper: 'Conta o total de atividades concluidas.',
  },
  perfect_weeks: {
    icon: CalendarRange,
    label: 'Semanas perfeitas',
    chip: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    accent: 'from-emerald-500/18 to-emerald-500/4',
    helper: 'Conta semanas com 100% de aproveitamento.',
  },
};

const formatPercent = (value) => `${Math.round(value)}%`;

const SummaryCard = ({ icon: Icon, label, value, tone }) => (
  <div className="premium-tile rounded-[1.35rem] p-4 border border-border">
    <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] ${tone}`}>
      <Icon size={14} />
      <span>{label}</span>
    </div>
    <div className="mt-3 text-3xl font-black text-foreground tracking-tight">{value}</div>
  </div>
);

const GoalCard = ({ goal, t, actions }) => {
  const target = goal.target || 1;
  const current = goal.current || 0;
  const percent = Math.min(100, (current / target) * 100);
  const isCompleted = percent >= 100;
  const meta = GOAL_META[goal.type] || GOAL_META.manual;
  const MetaIcon = meta.icon;
  const remaining = Math.max(0, target - current);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-[1.6rem] border p-5 transition-all group premium-panel ${
        isCompleted ? 'border-green-500/30 shadow-[0_24px_60px_rgba(40,160,100,0.12)]' : 'hover:border-primary/25'
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${meta.accent} opacity-80 pointer-events-none`} />
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`mt-0.5 p-2.5 rounded-2xl shadow-inner border ${isCompleted ? 'bg-green-500/10 text-green-500 border-green-500/20' : meta.chip}`}>
            <MetaIcon size={19} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h3 className="font-bold text-foreground text-base leading-tight">{goal.title}</h3>
              <span className={`text-[10px] font-black uppercase tracking-[0.18em] border rounded-full px-2 py-1 ${meta.chip}`}>
                {meta.label}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{meta.helper}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {goal.type === 'manual' && !isCompleted && (
            <button
              onClick={() => actions.incrementGoal(goal.id)}
              className="bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.18em] transition-colors border border-border"
            >
              {t('increment')}
            </button>
          )}

          {isCompleted && (
            <div className="bg-green-500 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.14em] flex items-center gap-1 shadow-sm">
              <CheckCircle2 size={12} />
              <span className="hidden sm:inline">{t('completedGoal')}</span>
            </div>
          )}

          <button
            onClick={() => actions.deleteGoal(goal.id)}
            className="p-2 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-destructive/40"
            title={t('delete')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-3 mb-5">
        <div className="premium-tile rounded-2xl px-3 py-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground mb-1">{t('goalCurrent')}</div>
          <div className="text-xl font-black text-foreground">{current}</div>
        </div>
        <div className="premium-tile rounded-2xl px-3 py-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground mb-1">{t('goalMeta')}</div>
          <div className="text-xl font-black text-foreground">{target}</div>
        </div>
        <div className="premium-tile rounded-2xl px-3 py-3">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground mb-1">Status</div>
          <div className="text-xl font-black text-foreground">{formatPercent(percent)}</div>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2 text-[11px]">
          <span className="font-bold text-muted-foreground">
            {current} / {target}
          </span>
          <span className="font-semibold text-muted-foreground">
            {isCompleted ? t('completedGoal') : `${remaining} restantes`}
          </span>
        </div>

        <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden border border-border/60">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-primary/80 to-primary'}`}
          />
        </div>
      </div>
    </motion.div>
  );
};

const GoalPanel = () => {
  const { goals, actions, t, stats } = useRoutine();
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target: 5 });

  const templates = [
    { title: t('goalTemplate1'), desc: t('goalTemplate1Desc'), type: 'streak', target: 7, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
    { title: t('goalTemplate2'), desc: t('goalTemplate2Desc'), type: 'total_activities', target: 50, icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
    { title: t('goalTemplate3'), desc: t('goalTemplate3Desc'), type: 'streak', target: 21, icon: Trophy, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
    { title: 'Semanas Perfeitas', desc: 'Conte quantas semanas fecharam 100%', type: 'perfect_weeks', target: 4, icon: CalendarRange, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  ];

  const goalSummary = useMemo(() => {
    const activeGoals = goals || [];
    const completedGoals = activeGoals.filter((goal) => (goal.current || 0) >= (goal.target || 1)).length;
    const automaticGoals = activeGoals.filter((goal) => goal.type !== 'manual').length;

    return {
      total: activeGoals.length,
      completed: completedGoals,
      automatic: automaticGoals,
    };
  }, [goals]);

  const handleAddManual = () => {
    if (!newGoal.title.trim()) return;
    actions.addGoal({ ...newGoal, title: newGoal.title.trim(), type: 'manual' });
    setNewGoal({ title: '', target: 5 });
    setShowForm(false);
  };

  const handleAddTemplate = (template) => {
    actions.addGoal({ title: template.title, type: template.type, target: template.target });
    setShowForm(false);
  };

  const inputClass = 'w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-5xl mx-auto pb-6 md:pb-8">
      <div className="premium-panel rounded-[2rem] p-5 md:p-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-primary" />
              <p className="eyebrow text-muted-foreground">Sistema de metas</p>
            </div>
            <h2 className="hero-title text-3xl md:text-4xl text-foreground leading-none">{t('myGoals')}</h2>
            <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-2xl">
              Metas claras, progresso legivel e menos adivinhacao entre o que voce precisa empurrar manualmente e o que o sistema atualiza sozinho.
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs bg-primary text-primary-foreground font-bold px-4 py-3 rounded-xl flex gap-2 items-center hover:opacity-90 transition-all shadow-md active:scale-95 self-start lg:self-auto"
          >
            <Plus size={14} /> {t('newGoal')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 relative z-10">
          <SummaryCard icon={Target} label="Ativas" value={goalSummary.total} tone="text-primary" />
          <SummaryCard icon={CheckCheck} label="Concluidas" value={goalSummary.completed} tone="text-green-500" />
          <SummaryCard icon={ArrowUpRight} label="Automaticas" value={goalSummary.automatic} tone="text-blue-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 relative z-10">
          <div className="premium-tile rounded-[1.25rem] p-4 border border-border">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Sequencia atual</div>
            <div className="text-2xl font-black text-foreground">{stats?.daily || 0}</div>
          </div>
          <div className="premium-tile rounded-[1.25rem] p-4 border border-border">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Semanas perfeitas</div>
            <div className="text-2xl font-black text-foreground">{stats?.weekly || 0}</div>
          </div>
          <div className="premium-tile rounded-[1.25rem] p-4 border border-border">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Atividades concluidas</div>
            <div className="text-2xl font-black text-foreground">{stats?.total || 0}</div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div className="premium-panel rounded-[1.75rem] p-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Target size={14} /> {t('suggestedGoals')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
                {templates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddTemplate(template)}
                    className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-95 ${template.bg}`}
                  >
                    <template.icon size={20} className={`mb-2 ${template.color}`} />
                    <span className="font-bold text-sm text-foreground leading-tight">{template.title}</span>
                    <span className="text-[10px] text-muted-foreground mt-1 leading-tight">{template.desc}</span>
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
                      onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    />
                  </div>
                  <div className="w-full sm:w-28">
                    <input
                      type="number"
                      min="1"
                      className={inputClass}
                      value={newGoal.target}
                      onChange={(e) => setNewGoal({ ...newGoal, target: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    />
                  </div>
                  <button onClick={handleAddManual} className="w-full sm:w-auto bg-foreground hover:bg-foreground/90 text-background px-6 py-2.5 rounded-xl text-sm font-bold transition-colors">
                    {t('saveGoal') || t('save')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence>
          {goals?.map((goal) => (
            <GoalCard key={goal.id} goal={goal} t={t} actions={actions} />
          ))}
        </AnimatePresence>
      </div>

      {(!goals || goals.length === 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="premium-panel rounded-[1.75rem] text-center py-20 px-6 text-muted-foreground"
        >
          <Target className="mx-auto mb-4 opacity-40" size={48} strokeWidth={1} />
          <p className="text-base font-semibold text-foreground">{t('noGoals')}</p>
          <p className="text-sm mt-2 max-w-md mx-auto opacity-80">
            {t('noGoalsDesc')} Comece por uma meta automatica para sentir progresso sem precisar atualizar tudo na mao.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default GoalPanel;
