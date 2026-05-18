import React, { useMemo, useState } from 'react';
import { LayoutGrid, BarChart3, History, Settings, Target, Library, Coffee, KanbanSquare, Rows3, CalendarDays, Sparkles, PanelLeftClose } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutine } from '../context/RoutineContext';
import WeekView from '../components/views/WeekView';
import StatsPanel from '../components/stats/StatsPanel';
import HistoryPanel from '../components/history/HistoryPanel';
import SettingsPanel from '../components/settings/SettingsPanel';
import GoalPanel from '../components/goals/GoalPanel.jsx';
import LibraryPanel from '../components/library/LibraryPanel';
import LoginScreen from '../components/auth/LoginScreen';
import CanvasView from '../components/views/CanvasView';
import CyclesPanel from '../components/cycles/CyclesPanel';
import CalendarPanel from '../components/history/CalendarPanel';

export default function Home() {
  const { user, config, t, isServerWaking, currentWeek, activitiesPool, goals, stats } = useRoutine();
  const [activeTab, setActiveTab] = useState('week');
  const [selectedHistoryDate, setSelectedHistoryDate] = useState('');

  if (!user) return <LoginScreen />;

  const tabs = [
    { id: 'week', label: 'week', icon: LayoutGrid },
    { id: 'cycles', label: 'cycles', icon: Rows3 },
    { id: 'board', label: 'board', icon: KanbanSquare },
    { id: 'library', label: 'library', icon: Library },
    { id: 'goals', label: 'goals', icon: Target },
    { id: 'stats', label: 'stats', icon: BarChart3 },
    { id: 'calendar', label: 'calendar', icon: CalendarDays },
    { id: 'history', label: 'history', icon: History },
    { id: 'config', label: 'config', icon: Settings },
  ];

  const isClassicLayout = (config.layoutMode || 'immersive') === 'classic';

  const overviewCards = useMemo(() => {
    const weeklyPlanned = currentWeek.reduce(
      (sum, day) => sum + Object.values(day || {}).reduce((daySum, slot) => daySum + (Array.isArray(slot) ? slot.length : 0), 0),
      0,
    );

    return [
      { label: 'Ritmo', value: `${config.maxActivitiesPerSlot} por bloco` },
      { label: 'Biblioteca', value: `${activitiesPool.length} cartas` },
      { label: 'Semana', value: `${weeklyPlanned} atividades` },
      { label: 'Sequencia', value: `${stats.daily} dias` },
      { label: 'Metas', value: `${goals.length} ativas` },
      { label: 'Modo', value: config.routineMode === 'shifts' ? 'Turnos' : 'Simples' },
    ];
  }, [activitiesPool.length, config.maxActivitiesPerSlot, config.routineMode, currentWeek, goals.length, stats.daily]);

  return (
    <div
      className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 bg-cover bg-center bg-fixed relative overflow-x-hidden"
      style={{ backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined }}
    >
      {config.backgroundImage && <div className="fixed inset-0 bg-background/80 dark:bg-black/80 z-0 pointer-events-none backdrop-blur-[2px]" />}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/6 to-transparent z-0" />
      <div className="pointer-events-none absolute left-[-8rem] top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.12),transparent_70%)] blur-3xl z-0" />
      <div className="pointer-events-none absolute right-[-6rem] top-40 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,190,120,0.16),transparent_68%)] blur-3xl z-0" />

      <AnimatePresence>
        {isServerWaking && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 px-4"
          >
            <div className="premium-panel p-6 sm:p-8 rounded-[2rem] border border-border flex flex-col items-center max-w-md text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Coffee size={32} className="text-primary animate-bounce" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mb-2">
                {t('wakingServer') || 'Acordando Servidor...'}
              </h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                {t('wakingServerDesc') || 'Como usamos uma hospedagem gratuita, o servidor pode levar alguns segundos para despertar. Pegue um cafe!'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1500px] mx-auto relative z-10 px-3 sm:px-4 md:px-6 xl:px-8 pt-4 md:pt-5 pb-28 md:pb-8">
        <header className="mb-6 md:mb-8">
          <div className="premium-panel rounded-[2rem] md:rounded-[2.4rem] px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8 overflow-hidden relative">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_55%)]" />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px] xl:items-stretch relative z-10">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="flex items-center gap-2 premium-tile rounded-full px-3 py-2">
                    <img src={user.avatar} className="w-7 h-7 rounded-full border border-border object-cover" alt="Avatar" />
                    <p className="eyebrow text-muted-foreground">
                      {t('online')} • {user.name}
                    </p>
                  </div>
                  <div className="premium-tile rounded-full px-3 py-2 text-[11px] font-bold text-foreground/90">
                    {config.theme === 'light' ? 'Atmosfera clara' : 'Atmosfera noturna'}
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 mb-4">
                  <img
                    src="/logo-my-routine.svg"
                    alt="Logo My Routine"
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-[1rem] md:rounded-[1.35rem] shadow-[0_18px_45px_rgba(0,0,0,0.18)] shrink-0"
                  />
                  <div className="min-w-0">
                    <h1 className="hero-title text-3xl sm:text-4xl md:text-5xl xl:text-6xl leading-[0.95] text-foreground break-words">
                      {t('appTitle')}
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base font-medium mt-3 max-w-2xl">
                      {t('appSubtitle')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="premium-tile rounded-[1.4rem] p-4">
                    <p className="eyebrow text-muted-foreground mb-2">Direcao</p>
                    <p className="text-base font-bold text-foreground leading-snug">Planeje semanas densas sem perder a leitura do que importa hoje.</p>
                  </div>
                  <div className="premium-tile rounded-[1.4rem] p-4">
                    <p className="eyebrow text-muted-foreground mb-2">Estrutura</p>
                    <p className="text-base font-bold text-foreground leading-snug">Biblioteca, ciclos, mural e historico organizados no mesmo fluxo.</p>
                  </div>
                  <div className="premium-tile rounded-[1.4rem] p-4 sm:col-span-2 lg:col-span-1">
                    <p className="eyebrow text-muted-foreground mb-2">Pacing</p>
                    <p className="text-base font-bold text-foreground leading-snug">Layouts mais amplos no desktop e navegação mais respirada no mobile.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 self-start">
                {overviewCards.map((card) => (
                  <div key={card.label} className="premium-tile rounded-[1.4rem] px-4 py-4 min-h-[104px] flex flex-col justify-between">
                    <p className="eyebrow text-muted-foreground">{card.label}</p>
                    <p className="text-sm sm:text-base font-bold text-foreground leading-tight">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className={isClassicLayout ? '' : 'xl:grid xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-8'}>
          {!isClassicLayout && (
          <aside className="hidden xl:block">
            <div className="sticky top-6 space-y-4">
              <div className="premium-panel rounded-[2rem] p-3">
                <div className="flex items-center gap-2 px-3 pb-3">
                  <PanelLeftClose size={16} className="text-primary" />
                  <p className="eyebrow text-muted-foreground">Navegacao</p>
                </div>
                <div className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-4 py-3 rounded-[1.2rem] transition-all flex items-center justify-between gap-3 ${
                        activeTab === tab.id
                          ? 'bg-primary text-primary-foreground shadow-[0_14px_36px_rgba(0,0,0,0.16)]'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <tab.icon size={16} className={activeTab === tab.id ? 'text-primary-foreground' : 'text-muted-foreground'} />
                        <span className="text-sm font-bold truncate">{t(tab.label)}</span>
                      </span>
                      {activeTab === tab.id && <Sparkles size={14} className="text-primary-foreground/90" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="premium-panel rounded-[2rem] p-5">
                <p className="eyebrow text-muted-foreground mb-3">Resumo rapido</p>
                <div className="space-y-3">
                  <div className="premium-tile rounded-[1.2rem] px-4 py-3">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.22em] mb-2">Fluxo ativo</p>
                    <p className="text-sm font-bold text-foreground">{t(tabs.find((tab) => tab.id === activeTab)?.label || 'week')}</p>
                  </div>
                  <div className="premium-tile rounded-[1.2rem] px-4 py-3">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.22em] mb-2">Tema visual</p>
                    <p className="text-sm font-bold text-foreground">{config.themePreset || 'default'}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
          )}

          <section className="min-w-0">
            <nav className={`${isClassicLayout ? 'mb-8 md:mb-10 hidden md:flex justify-center' : 'xl:hidden mb-5 md:mb-6'}`}>
              <div className={`premium-panel ${isClassicLayout ? 'p-1.5 rounded-[1.4rem] flex w-full max-w-5xl overflow-x-auto gap-1 no-scrollbar' : 'rounded-[1.6rem] p-2'}`}>
                <div className={`${isClassicLayout ? 'contents' : 'flex gap-2 overflow-x-auto no-scrollbar px-1'}`}>
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${isClassicLayout ? 'flex-1 min-w-[100px] py-3 rounded-[1rem]' : 'shrink-0 px-4 py-3 rounded-[1rem]'} text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(0,0,0,0.16)]'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <tab.icon size={15} className={activeTab === tab.id ? 'text-primary-foreground' : 'text-muted-foreground'} />
                      {t(tab.label)}
                    </button>
                  ))}
                </div>
              </div>
            </nav>

            <main className={isClassicLayout ? '' : 'premium-panel rounded-[2rem] md:rounded-[2.2rem] p-3 sm:p-4 md:p-5 xl:p-6'}>
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}>
                  {activeTab === 'week' && <WeekView />}
                  {activeTab === 'cycles' && <CyclesPanel />}
                  {activeTab === 'board' && <CanvasView />}
                  {activeTab === 'library' && <LibraryPanel />}
                  {activeTab === 'goals' && <GoalPanel />}
                  {activeTab === 'stats' && <StatsPanel />}
                  {activeTab === 'calendar' && (
                    <CalendarPanel
                      selectedDate={selectedHistoryDate}
                      onSelectDate={setSelectedHistoryDate}
                      onOpenHistory={() => setActiveTab('history')}
                    />
                  )}
                  {activeTab === 'history' && (
                    <HistoryPanel
                      selectedDate={selectedHistoryDate}
                      onSelectDate={setSelectedHistoryDate}
                      onOpenCalendar={() => setActiveTab('calendar')}
                    />
                  )}
                  {activeTab === 'config' && <SettingsPanel />}
                </motion.div>
              </AnimatePresence>
            </main>
          </section>
        </div>
      </div>

      {activeTab !== 'config' && (
        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className="md:hidden fixed right-3 bottom-[5.15rem] z-50 inline-flex items-center gap-2 rounded-full border border-border bg-card/92 px-4 py-3 text-xs font-black text-foreground shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-2xl active:scale-95"
          aria-label="Abrir configuracoes"
        >
          <Settings size={16} className="text-primary" />
          Config
        </button>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/88 backdrop-blur-2xl border-t border-border z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.14)]">
        <div className="flex gap-1 px-2 py-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 min-w-[76px] flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl transition-all min-h-[56px] ${
                activeTab === tab.id ? 'text-primary bg-primary/12 shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'fill-primary/20' : ''} />
              <span className="text-[9px] font-bold leading-none text-center">{t(tab.label)}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
