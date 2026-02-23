import React, { useState } from 'react';
import { LayoutGrid, BarChart3, History, Settings, Target, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutine } from '../context/RoutineContext';

import WeekView from '../components/views/WeekView';
import StatsPanel from '../components/stats/StatsPanel';
import HistoryPanel from '../components/history/HistoryPanel';
import SettingsPanel from '../components/settings/SettingsPanel';
import GoalPanel from '../components/goals/GoalPanel.jsx';
import LibraryPanel from '../components/library/LibraryPanel';
import LoginScreen from '../components/auth/LoginScreen';

export default function Home() {
  const { user, currentWeek, completedDays, actions, t } = useRoutine(); // Adicionado t
  const [activeTab, setActiveTab] = useState('week');

  if (!user) return <LoginScreen />;

  const tabs = [
    { id: 'week', label: 'week', icon: LayoutGrid },
    { id: 'library', label: 'library', icon: Library },
    { id: 'goals', label: 'goals', icon: Target },
    { id: 'stats', label: 'stats', icon: BarChart3 },
    { id: 'history', label: 'history', icon: History },
    { id: 'config', label: 'config', icon: Settings },
  ];

  return (
    // CORREÇÃO: bg-background e text-foreground (adapta ao tema)
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        <header className="text-center mb-8 pt-4">
          <div className="flex items-center justify-center gap-2 mb-2">
             <div className="flex -space-x-2">
               <img src={user.avatar} className="w-6 h-6 rounded-full border border-border" alt=""/>
             </div>
             <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
               {t('online')} • {user.name}
             </p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            {t('appTitle')}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base font-medium mt-1">
            {t('appSubtitle')}
          </p>
        </header>

        <nav className="flex justify-center mb-10">
          <div className="bg-card border border-border p-1.5 rounded-2xl flex w-full max-w-4xl shadow-sm overflow-x-auto gap-1 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 min-w-[90px] py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }
                `}
              >
                <tab.icon size={16} />
                {t(tab.label)}
              </button>
            ))}
          </div>
        </nav>

        <main>
          <AnimatePresence mode='wait'>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'week' && (
                <WeekView 
                  routine={currentWeek} 
                  completed={completedDays} 
                  onToggleComplete={actions.toggleComplete} 
                  onShuffle={actions.shuffleWeek} 
                />
              )}
              {activeTab === 'library' && <LibraryPanel />}
              {activeTab === 'goals' && <GoalPanel />}
              {activeTab === 'stats' && <StatsPanel completedDays={completedDays} />}
              {activeTab === 'history' && <HistoryPanel completedDays={completedDays} />}
              {activeTab === 'config' && <SettingsPanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}