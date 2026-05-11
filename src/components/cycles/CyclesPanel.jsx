import React, { useState } from 'react';
import { Plus, Trash2, KanbanSquare, StickyNote } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';

const COLUMNS = ['todo', 'doing', 'done'];

const columnColors = {
  todo: 'from-slate-500/10 to-slate-500/5',
  doing: 'from-amber-500/10 to-orange-500/5',
  done: 'from-emerald-500/10 to-emerald-500/5',
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
      <div className="max-w-5xl mx-auto bg-card border border-border rounded-3xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <KanbanSquare size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">{t('cycles')}</h2>
            <p className="text-sm text-muted-foreground">{t('cyclesDesc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_140px] gap-3">
          <input
            value={draft.title}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            className="bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
            placeholder={t('cycleTitlePlaceholder')}
          />
          <select
            value={draft.activityId}
            onChange={(e) => setDraft((prev) => ({ ...prev, activityId: e.target.value }))}
            className="bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">{t('linkActivity')}</option>
            {activitiesPool.map((activity) => (
              <option key={activity.id} value={activity.id}>{activity.name}</option>
            ))}
          </select>
          <button onClick={submitCard} className="bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 px-4 py-3 hover:opacity-90 transition-all">
            <Plus size={16} /> {t('newCard')}
          </button>
        </div>

        <textarea
          value={draft.notes}
          onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
          className="mt-3 w-full h-24 bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none resize-none focus:border-primary"
          placeholder={t('cycleNotesPlaceholder')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {COLUMNS.map((column) => (
          <div key={column} className={`rounded-3xl border border-border bg-gradient-to-b ${columnColors[column]} p-4 min-h-[28rem]`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.28em] text-foreground">{t(column)}</h3>
                <p className="text-xs text-muted-foreground">{cycleCards.filter((card) => card.status === column).length} {t('cards')}</p>
              </div>
              <StickyNote size={18} className="text-muted-foreground" />
            </div>

            <div className="space-y-3">
              {cycleCards.filter((card) => card.status === column).map((card) => {
                const linkedActivity = activitiesPool.find((activity) => activity.id === card.activityId);
                return (
                  <div key={card.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{card.title}</h4>
                        {linkedActivity && <p className="text-xs text-primary mt-1">{linkedActivity.name}</p>}
                      </div>
                      <button onClick={() => actions.deleteCycleCard(card.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <textarea
                      value={card.notes || ''}
                      onChange={(e) => actions.updateCycleCard(card.id, { notes: e.target.value })}
                      className="mt-3 w-full h-24 bg-secondary/60 border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none resize-none focus:border-primary"
                      placeholder={t('cycleNotesPlaceholder')}
                    />

                    <div className="mt-3 flex gap-2">
                      {COLUMNS.map((status) => (
                        <button
                          key={status}
                          onClick={() => actions.updateCycleCard(card.id, { status })}
                          className={`flex-1 rounded-lg px-2 py-2 text-[10px] uppercase font-bold transition-colors ${card.status === status ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                        >
                          {t(status)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CyclesPanel;
