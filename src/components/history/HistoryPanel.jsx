import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  FileText,
  Image as ImageIcon,
  Moon,
  MoonStar,
  CloudSun,
  Sun,
  Sparkles,
  Code2,
  Coffee,
  Music,
  Palette,
  Book,
  Dumbbell,
  Gamepad,
  Heart,
  Briefcase,
  Rocket,
} from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';
import { THEMES } from '../../entities/theme';
import { listHistoryEntriesForDate } from '../../lib/routine';

const ICON_MAP = { Code2, Coffee, Rocket, Music, Palette, Moon, Book, Dumbbell, Gamepad, Heart, Briefcase };

const SHIFT_ICONS = {
  morning: <Sun size={12} className="text-amber-500" />,
  afternoon: <CloudSun size={12} className="text-orange-500" />,
  night: <MoonStar size={12} className="text-indigo-500" />,
  default: <CheckCircle2 size={12} className="text-primary" />,
};

const SHIFT_LABELS = {
  morning: 'Manha',
  afternoon: 'Tarde',
  night: 'Noite',
  default: 'Geral',
};

const hasUsefulContent = (entry) =>
  entry?.completed || entry?.notes || entry?.image || (Array.isArray(entry?.tasks) && entry.tasks.length > 0);

const ArchivedCard = ({ record, shift, t }) => {
  const activity = record.activity || { name: 'Atividade Encerrada', theme: 'slate', iconName: 'Rocket' };
  const theme = THEMES[activity.theme] || THEMES.slate;
  const Icon = ICON_MAP[activity.iconName] || Rocket;
  const completedTasks = Array.isArray(record.tasks) ? record.tasks.filter((task) => task.completed).length : 0;

  return (
    <article className={`relative overflow-hidden rounded-[1.75rem] border p-5 shadow-[0_22px_60px_rgba(0,0,0,0.10)] transition-all ${theme.card}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_42%)] pointer-events-none" />
      {record.image && (
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          <img src={record.image} alt="Registro" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="relative z-10 flex items-start justify-between gap-4 mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.iconBox} bg-background/90 border border-border shadow-sm text-xl`}>
          {activity.emoji ? <span>{activity.emoji}</span> : <Icon size={22} strokeWidth={2} />}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
            {SHIFT_ICONS[shift]}
            {t(shift) || SHIFT_LABELS[shift] || shift}
          </span>
          {record.completed && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-500">
              <CheckCircle2 size={11} />
              {t('done')}
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 space-y-4">
        <div>
          <h3 className={`text-xl font-black tracking-tight ${theme.title}`}>{activity.name}</h3>
          {record.assignedTask && <p className="text-sm text-muted-foreground mt-1">{record.assignedTask}</p>}
        </div>

        {Array.isArray(record.tasks) && record.tasks.length > 0 && (
          <section className="rounded-2xl border border-border bg-background/55 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                <CheckSquare size={12} />
                {t('tasksTitle')}
              </span>
              <span className="text-xs font-bold text-foreground">{completedTasks}/{record.tasks.length}</span>
            </div>
            <div className="space-y-2">
              {record.tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 size={14} className={`mt-0.5 shrink-0 ${task.completed ? 'text-emerald-500' : 'text-muted-foreground/35'}`} />
                  <span className={task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}>{task.text}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {record.notes && (
          <section className="rounded-2xl border border-border bg-background/55 p-4">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground mb-3">
              <FileText size={12} />
              {t('notes')}
            </span>
            <p className="text-sm text-foreground leading-relaxed">{record.notes}</p>
          </section>
        )}

        {record.image && (
          <section className="rounded-2xl border border-border bg-background/55 p-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground mb-3">
              <ImageIcon size={12} />
              {t('proofImage')}
            </span>
            <img src={record.image} className="w-full h-44 object-cover rounded-[1rem] border border-border shadow-sm" alt="Registro visual" />
          </section>
        )}
      </div>
    </article>
  );
};

const HistoryPanel = ({ selectedDate, onSelectDate, onOpenCalendar }) => {
  const { t, config, history, completedDays } = useRoutine();
  const dateLocale = config.lang === 'en' ? enUS : ptBR;

  const datesWithContent = useMemo(() => {
    const grouped = {};

    Object.keys(history || {}).forEach((key) => {
      const dateStr = key.split('_')[0];
      if (!grouped[dateStr]) grouped[dateStr] = [];
    });

    return Object.keys(grouped)
      .map((dateStr) => {
        const records = listHistoryEntriesForDate(history, dateStr)
          .filter(({ value }) => hasUsefulContent(value))
          .map(({ shiftKey, value }) => ({ shift: shiftKey, ...value }));

        return {
          dateStr,
          records,
          completed: Boolean(completedDays?.[dateStr]),
        };
      })
      .filter((entry) => entry.records.length > 0)
      .sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [history, completedDays]);

  const activeDate = selectedDate && datesWithContent.some((entry) => entry.dateStr === selectedDate)
    ? selectedDate
    : datesWithContent[0]?.dateStr || '';

  const activeEntry = datesWithContent.find((entry) => entry.dateStr === activeDate) || null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in pb-6 md:pb-8">
      <section className="premium-panel rounded-[2rem] p-6 md:p-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_30%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow text-muted-foreground mb-3">{t('history')}</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">{t('historyArchive') || 'Arquivo premium da sua rotina'}</h2>
            <p className="text-sm md:text-base text-muted-foreground mt-3 leading-relaxed">
              {t('historyArchiveDesc') || 'Veja seus registros com mais clareza e navegue para o calendario quando quiser revisar o ritmo do mes.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-auto w-full">
            <div className="premium-tile rounded-2xl px-4 py-4">
              <p className="eyebrow text-muted-foreground mb-1">{t('recordedDays') || 'Dias registrados'}</p>
              <p className="text-2xl font-black text-foreground">{datesWithContent.length}</p>
            </div>
            <div className="premium-tile rounded-2xl px-4 py-4">
              <p className="eyebrow text-muted-foreground mb-1">{t('entries') || 'Entradas'}</p>
              <p className="text-2xl font-black text-foreground">{datesWithContent.reduce((sum, item) => sum + item.records.length, 0)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[280px,1fr] gap-6">
        <aside className="bg-card border border-border rounded-[1.75rem] p-4 md:p-5 shadow-[0_16px_45px_rgba(0,0,0,0.08)] h-fit">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">{t('selectedDate') || 'Data selecionada'}</p>
              <h3 className="text-lg font-black text-foreground mt-1">{activeEntry ? format(parseISO(activeEntry.dateStr), 'dd MMM yyyy', { locale: dateLocale }) : '--'}</h3>
            </div>
            <button
              onClick={onOpenCalendar}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-border"
            >
              <CalendarDays size={14} />
              {t('openCalendar') || 'Abrir calendario'}
            </button>
          </div>

          {datesWithContent.length > 0 ? (
            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {datesWithContent.map((entry) => {
                const isActive = entry.dateStr === activeDate;
                return (
                  <button
                    key={entry.dateStr}
                    onClick={() => onSelectDate(entry.dateStr)}
                    className={`w-full text-left rounded-2xl border px-4 py-3 transition-all ${
                      isActive ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-background/40 hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-foreground capitalize">{format(parseISO(entry.dateStr), "EEEE, dd MMM", { locale: dateLocale })}</p>
                        <p className="text-xs text-muted-foreground mt-1">{entry.records.length} {t('entries') || 'entradas'}</p>
                      </div>
                      {entry.completed && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-background/35 px-4 py-8 text-center">
              <Sparkles size={20} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-bold text-foreground">{t('historyEmpty') || 'Ainda nao ha registros salvos'}</p>
            </div>
          )}
        </aside>

        <div className="space-y-4">
          {activeEntry ? (
            <>
              <div className="bg-card border border-border rounded-[1.75rem] p-5 md:p-6 shadow-[0_16px_45px_rgba(0,0,0,0.08)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">{t('dayDetails')}</p>
                    <h3 className="text-2xl md:text-3xl font-black text-foreground capitalize mt-2">
                      {format(parseISO(activeEntry.dateStr), "EEEE, dd 'de' MMMM", { locale: dateLocale })}
                    </h3>
                  </div>
                  <button
                    onClick={onOpenCalendar}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-sm font-bold text-background transition-all hover:opacity-90"
                  >
                    <ArrowRight size={16} />
                    {t('openCalendar') || 'Ver no calendario'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeEntry.records.map((record, index) => (
                  <ArchivedCard key={`${activeEntry.dateStr}-${record.shift}-${index}`} record={record} shift={record.shift} t={t} />
                ))}
              </div>
            </>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-[1.75rem] p-10 text-center">
              <p className="text-lg font-bold text-foreground">{t('historyEmpty') || 'Ainda nao ha registros salvos'}</p>
              <p className="text-sm text-muted-foreground mt-2">{t('historyEmptyDesc') || 'Complete uma atividade, adicione nota ou imagem e ela vai aparecer aqui.'}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HistoryPanel;
