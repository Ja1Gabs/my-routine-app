import React, { useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isToday, parseISO, startOfMonth, subMonths } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Dot, Sparkles } from 'lucide-react';
import { useRoutine } from '../../context/RoutineContext';
import { listHistoryEntriesForDate } from '../../lib/routine';

const hasUsefulContent = (entry) =>
  entry?.completed || entry?.notes || entry?.image || (Array.isArray(entry?.tasks) && entry.tasks.length > 0);

const CalendarPanel = ({ selectedDate, onSelectDate, onOpenHistory }) => {
  const { t, config, history, completedDays } = useRoutine();
  const [viewingMonth, setViewingMonth] = useState(selectedDate ? startOfMonth(parseISO(selectedDate)) : startOfMonth(new Date()));
  const dateLocale = config.lang === 'en' ? enUS : ptBR;
  const translatedDays = t('weekDaysShort');
  const weekDays = Array.isArray(translatedDays) ? translatedDays : ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const daysWithRecords = useMemo(() => {
    const set = new Set();
    Object.entries(history || {}).forEach(([key, value]) => {
      const dateStr = key.split('_')[0];
      if (hasUsefulContent(value)) set.add(dateStr);
    });
    return set;
  }, [history]);

  const currentMonthStart = startOfMonth(viewingMonth);
  const currentMonthEnd = endOfMonth(viewingMonth);
  const daysInMonth = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });
  const startDayIndex = getDay(currentMonthStart);

  const activeDate = selectedDate || format(new Date(), 'yyyy-MM-dd');
  const activeRecords = listHistoryEntriesForDate(history, activeDate)
    .filter(({ value }) => hasUsefulContent(value));

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in pb-6 md:pb-8">
      <section className="premium-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow text-muted-foreground mb-3">{t('calendar') || 'Calendario'}</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">{t('calendarTitle') || 'Mapa visual dos seus registros'}</h2>
            <p className="text-sm md:text-base text-muted-foreground mt-3 leading-relaxed">
              {t('calendarDesc') || 'Acompanhe o mes, veja dias com registro e pule direto para o arquivo detalhado quando quiser abrir uma data.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
            <div className="premium-tile rounded-2xl px-4 py-4">
              <p className="eyebrow text-muted-foreground mb-1">{t('recordedDays') || 'Dias registrados'}</p>
              <p className="text-2xl font-black text-foreground">{daysWithRecords.size}</p>
            </div>
            <div className="premium-tile rounded-2xl px-4 py-4">
              <p className="eyebrow text-muted-foreground mb-1">{t('selectedDate') || 'Data selecionada'}</p>
              <p className="text-sm font-black text-foreground capitalize">{format(parseISO(activeDate), 'dd MMM yyyy', { locale: dateLocale })}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.15fr,0.85fr] gap-6">
        <div className="bg-card border border-border rounded-[1.75rem] p-5 md:p-6 shadow-[0_16px_45px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setViewingMonth(subMonths(viewingMonth, 1))} className="p-2 bg-secondary hover:bg-border rounded-xl text-muted-foreground hover:text-foreground transition-all">
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-xl md:text-2xl font-black capitalize text-foreground tracking-tight">
              {format(viewingMonth, 'MMMM yyyy', { locale: dateLocale })}
            </h3>
            <button onClick={() => setViewingMonth(addMonths(viewingMonth, 1))} className="p-2 bg-secondary hover:bg-border rounded-xl text-muted-foreground hover:text-foreground transition-all">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {weekDays.map((day, index) => (
              <div key={`${day}-${index}`} className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.22em] py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startDayIndex }).map((_, index) => <div key={`empty-${index}`} />)}

            {daysInMonth.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isSelected = activeDate === dateStr;
              const isCompleted = Boolean(completedDays?.[dateStr]);
              const hasRecords = daysWithRecords.has(dateStr);

              return (
                <button
                  key={dateStr}
                  onClick={() => onSelectDate(dateStr)}
                  className={`aspect-square relative rounded-2xl border text-sm font-bold transition-all hover:-translate-y-0.5 ${
                    isSelected
                      ? 'border-primary bg-primary/12 ring-2 ring-primary/40'
                      : isCompleted
                        ? 'border-emerald-500/25 bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
                        : hasRecords
                          ? 'border-sky-500/20 bg-sky-500/10 text-foreground'
                          : 'border-transparent bg-secondary text-foreground hover:bg-border'
                  }`}
                >
                  <span>{format(day, 'd')}</span>
                  {isToday(day) && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary" />}
                  {hasRecords && <Dot size={18} className="absolute bottom-1 left-1/2 -translate-x-1/2 text-current opacity-80" />}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 mt-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
              {t('completedLegend')}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-sky-500/10 border border-sky-500/30" />
              {t('registeredLegend')}
            </div>
          </div>
        </div>

        <aside className="bg-card border border-border rounded-[1.75rem] p-5 md:p-6 shadow-[0_16px_45px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">{t('selectedDate') || 'Data selecionada'}</p>
              <h3 className="text-2xl font-black text-foreground capitalize mt-2">
                {format(parseISO(activeDate), "dd 'de' MMMM", { locale: dateLocale })}
              </h3>
            </div>
            <CalendarDays size={20} className="text-primary" />
          </div>

          <div className="rounded-2xl border border-border bg-background/45 p-4 mb-4">
            <p className="text-sm font-bold text-foreground">
              {activeRecords.length > 0
                ? `${activeRecords.length} ${t('entries') || 'entradas'}`
                : (t('noRecords') || 'Nenhum registro encontrado neste dia.')}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {completedDays?.[activeDate]
                ? t('completedLegend')
                : daysWithRecords.has(activeDate)
                  ? t('registeredLegend')
                  : (t('historyEmptyDesc') || 'Sem atividade arquivada nesta data.')}
            </p>
          </div>

          <button
            onClick={onOpenHistory}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-sm font-bold text-background transition-all hover:opacity-90"
          >
            <ArrowRight size={16} />
            {t('openHistory') || 'Abrir no historico'}
          </button>

          {activeRecords.length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-background/30 p-5 text-center">
              <Sparkles size={18} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">{t('noRecords') || 'Nenhum registro encontrado neste dia.'}</p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
};

export default CalendarPanel;
