import React, { useState } from 'react';
import { LayoutGrid, BarChart3, History, Settings, Target, Library, Coffee, KanbanSquare, Rows3, CalendarDays } from 'lucide-react';
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
  const { user, config, t, isServerWaking } = useRoutine();
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

  return (
    <div
      className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 bg-cover bg-center bg-fixed relative overflow-hidden"
      style={{ backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined }}
    >
      {config.backgroundImage && <div className="fixed inset-0 bg-background/80 dark:bg-black/80 z-0 pointer-events-none backdrop-blur-[2px]" />}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/6 to-transparent z-0" />

      <AnimatePresence>
        {isServerWaking && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60"
          >
            <div className="bg-card p-8 rounded-3xl shadow-2xl border border-border flex flex-col items-center max-w-sm text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Coffee size={32} className="text-primary animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">{t('wakingServer') || 'Acordando Servidor...'}</h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">{t('wakingServerDesc') || 'Como usamos uma hospedagem gratuita, o servidor pode levar alguns segundos para despertar. Pegue um cafe!'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative z-10 px-4 md:px-8 pb-28 md:pb-10 pt-5">
        <header className="mb-8 md:mb-10">
          <div className="premium-panel rounded-[2rem] px-5 py-5 md:px-8 md:py-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex -space-x-2">
                    <img src={user.avatar} className="w-7 h-7 rounded-full border border-border object-cover" alt="Avatar" />
                  </div>
                  <p className="eyebrow text-muted-foreground">
                    {t('online')} • {user.name}
                  </p>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <img
                    src="/logo-my-routine.svg"
                    alt="Logo My Routine"
                    className="w-14 h-14 md:w-16 md:h-16 rounded-[1.35rem] shadow-[0_18px_45px_rgba(0,0,0,0.18)]"
                  />
                  <div>
                    <h1 className="hero-title text-4xl md:text-6xl leading-none text-foreground">{t('appTitle')}</h1>
                    <p className="text-muted-foreground text-sm md:text-base font-medium mt-2 max-w-xl">{t('appSubtitle')}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="premium-tile rounded-full px-3 py-1.5 text-[11px] font-bold text-foreground/90">
                    Semana pessoal
                  </span>
                  <span className="premium-tile rounded-full px-3 py-1.5 text-[11px] font-bold text-foreground/90">
                    Planejamento vivo
                  </span>
                  <span className="premium-tile rounded-full px-3 py-1.5 text-[11px] font-bold text-foreground/90">
                    Sandbox criativo
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-[320px]">
                <div className="premium-tile rounded-2xl px-3 py-3">
                  <p className="eyebrow text-muted-foreground mb-1">Modo</p>
                  <p className="text-sm font-bold text-foreground">{config.routineMode === 'shifts' ? 'Turnos' : 'Simples'}</p>
                </div>
                <div className="premium-tile rounded-2xl px-3 py-3">
                  <p className="eyebrow text-muted-foreground mb-1">Tema</p>
                  <p className="text-sm font-bold text-foreground">{config.theme === 'light' ? 'Claro' : 'Noturno'}</p>
                </div>
                <div className="premium-tile rounded-2xl px-3 py-3">
                  <p className="eyebrow text-muted-foreground mb-1">Ritmo</p>
                  <p className="text-sm font-bold text-foreground">{config.maxActivitiesPerSlot} por bloco</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <nav className="hidden md:flex justify-center mb-10">
          <div className="premium-panel p-1.5 rounded-[1.4rem] flex w-full max-w-5xl overflow-x-auto gap-1 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[100px] py-3 rounded-[1rem] text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(0,0,0,0.16)]'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <tab.icon size={16} className={activeTab === tab.id ? 'text-primary-foreground' : 'text-muted-foreground'} />
                {t(tab.label)}
              </button>
            ))}
          </div>
        </nav>

        <main>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
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
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/88 backdrop-blur-2xl border-t border-border z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.14)]">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all min-h-[52px] ${
                activeTab === tab.id ? 'text-primary bg-primary/12 shadow-sm' : 'text-muted-foreground hover:bg-secondary/50'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'fill-primary/20' : ''} />
              <span className="text-[9px] font-bold leading-none">{t(tab.label)}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
