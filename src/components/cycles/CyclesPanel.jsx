import React, { useState } from 'react';
import { Plus, Trash2, KanbanSquare, StickyNote, ArrowRight, Link2, Sparkles } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';

const COLUMNS = ['todo', 'doing', 'done'];

const columnColors = {
  todo: 'from-slate-500/12 via-slate-500/6 to-transparent',
  doing: 'from-amber-500/14 via-orange-500/8 to-transparent',
  done: 'from-emerald-500/14 via-emerald-500/8 to-transparent',
};

const statusAccent = {
  todo: 'text-slate-500',
  doing: 'text-amber-500',
  done: 'text-emerald-500',
};

const CyclesPanel = () => {
  const { cycleCards, activitiesPool, actions, t } = useRoutine();
  const [draft, setDraft] = useState({ title: '', notes: '', activityId: '', status: 'todo' });

  const submitCard = () => {
    if (!draft.title.trim()) return;
    actions.addCycleCard(draft);
    setDraft({ title: '', notes: '', activityId: '', status: 'todo' });
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-24">
      <section className="max-w-6xl mx-auto premium-panel rounded-[2rem] p-6 md:p-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_28%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow text-muted-foreground mb-3">{t('cycles')}</p>
            <h2 className="hero-title text-4xl md:text-5xl leading-none text-foreground">kanban pessoal com mais presença</h2>
            <p className="text-sm md:text-base text-muted-foreground mt-3 leading-relaxed">{t('cyclesDesc')}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full lg:w-[360px]">
            {COLUMNS.map((column) => (
              <div key={column} className="premium-tile rounded-2xl px-4 py-4">
                <p className="eyebrow text-muted-foreground mb-1">{t(column)}</p>
                <p className={`text-2xl font-black ${statusAccent[column]}`}>{cycleCards.filter((card) => card.status === column).length}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto bg-card border border-border rounded-[1.75rem] p-5 md:p-6 shadow-[0_18px_55px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground">{t('newCard')}</h3>
            <p className="text-sm text-muted-foreground">{t('cycleComposerDesc') || 'Jogue uma frente em andamento aqui e arrume o contexto depois.'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr_160px] gap-3">
          <input
            value={draft.title}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            className="bg-secondary border border-border rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
            placeholder={t('cycleTitlePlaceholder')}
          />
          <select
            value={draft.activityId}
            onChange={(e) => setDraft((prev) => ({ ...prev, activityId: e.target.value }))}
            className="bg-secondary border border-border rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">{t('linkActivity')}</option>
            {activitiesPool.map((activity) => (
              <option key={activity.id} value={activity.id}>{activity.name}</option>
            ))}
          </select>
          <button onClick={submitCard} className="bg-primary text-primary-foreground rounded-2xl font-bold text-sm flex items-center justify-center gap-2 px-4 py-3 hover:opacity-90 transition-all">
            <Plus size={16} /> {t('newCard')}
          </button>
        </div>

        <textarea
          value={draft.notes}
          onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
          className="mt-3 w-full h-24 bg-secondary border border-border rounded-2xl px-4 py-3 text-sm text-foreground outline-none resize-none focus:border-primary"
          placeholder={t('cycleNotesPlaceholder')}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {COLUMNS.map((column) => (
          <section key={column} className={`rounded-[1.75rem] border border-border bg-gradient-to-b ${columnColors[column]} bg-card p-4 md:p-5 min-h-[30rem] shadow-[0_16px_45px_rgba(0,0,0,0.08)]`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.28em] text-foreground">{t(column)}</h3>
                <p className="text-xs text-muted-foreground">{cycleCards.filter((card) => card.status === column).length} {t('cards')}</p>
              </div>
              <div className={`w-10 h-10 rounded-2xl bg-background/65 border border-border flex items-center justify-center ${statusAccent[column]}`}>
                <StickyNote size={18} />
              </div>
            </div>

            <div className="space-y-3">
              {cycleCards.filter((card) => card.status === column).map((card) => {
                const linkedActivity = activitiesPool.find((activity) => activity.id === card.activityId);
                return (
                  <article key={card.id} className="rounded-[1.4rem] border border-border bg-background/50 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-black text-foreground leading-tight">{card.title}</h4>
                        {linkedActivity && (
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                            <Link2 size={11} />
                            {linkedActivity.name}
                          </div>
                        )}
                      </div>
                      <button onClick={() => actions.deleteCycleCard(card.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <textarea
                      value={card.notes || ''}
                      onChange={(e) => actions.updateCycleCard(card.id, { notes: e.target.value })}
                      className="mt-4 w-full h-24 bg-secondary/60 border border-border rounded-2xl px-3 py-3 text-xs text-foreground outline-none resize-none focus:border-primary"
                      placeholder={t('cycleNotesPlaceholder')}
                    />

                    <div className="mt-4 flex gap-2">
                      {COLUMNS.map((status) => (
                        <button
                          key={status}
                          onClick={() => actions.updateCycleCard(card.id, { status })}
                          className={`flex-1 rounded-xl px-2 py-2 text-[10px] uppercase font-bold transition-colors ${card.status === status ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                        >
                          {t(status)}
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}

              {cycleCards.filter((card) => card.status === column).length === 0 && (
                <div className="rounded-[1.4rem] border border-dashed border-border bg-background/28 p-5 text-center">
                  <p className="text-sm font-bold text-foreground">{t('emptyColumnTitle') || 'Nada por aqui ainda'}</p>
                  <p className="text-xs text-muted-foreground mt-2">{t('emptyColumnDesc') || 'Crie um card ou mova uma frente para esta etapa.'}</p>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default CyclesPanel;
