import React, { useState } from 'react';
import { LayoutGrid, BarChart3, History, Settings, Target, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutine } from '../context/RoutineContext';

// Imports Corrigidos (conforme seu print)
import WeekView from '../components/views/WeekView';
import StatsPanel from '../components/stats/StatsPanel';
import HistoryPanel from '../components/history/HistoryPanel';
import SettingsPanel from '../components/settings/SettingsPanel';
import GoalPanel from '../components/goals/GoalPanel.jsx'; // Nome corrigido (Singular)
import LibraryPanel from '../components/library/LibraryPanel';
import LoginScreen from '../components/auth/LoginScreen';

export default function Home() {
  const { user, currentWeek, completedDays, actions } = useRoutine();
  const [activeTab, setActiveTab] = useState('week');

  if (!user) return <LoginScreen />;

  const tabs = [
    { id: 'week', label: 'Semana', icon: LayoutGrid },
    { id: 'library', label: 'Biblioteca', icon: Library },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'config', label: 'Config', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-8 pt-4">
          <div className="flex items-center justify-center gap-2 mb-2">
             <div className="flex -space-x-2">
               <img src={user.avatar} className="w-6 h-6 rounded-full border border-black" alt=""/>
             </div>
             <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Olá, {user.name}</p>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Minha Rotina</h1>
        </header>

        {/* Navegação Scrollable */}
        <nav className="flex justify-center mb-10">
          <div className="bg-[#111] border border-white/10 p-1.5 rounded-2xl flex w-full max-w-4xl shadow-2xl overflow-x-auto gap-1 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 min-w-[90px] py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/5' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <tab.icon size={16} className={activeTab === tab.id ? 'text-white' : 'text-white/40'} />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Área Principal */}
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