import React, { useState } from 'react';
import { LayoutGrid, BarChart3, History, Settings, Target, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoutine } from '../context/RoutineContext';

// Importação dos Painéis
import WeekView from '../components/views/WeekView';
import StatsPanel from '../components/stats/StatsPanel';
import HistoryPanel from '../components/history/HistoryPanel';
import SettingsPanel from '../components/settings/SettingsPanel';
import GoalPanel from '../components/goals/GoalPanel.jsx';
import LibraryPanel from '../components/library/LibraryPanel';
import LoginScreen from '../components/auth/LoginScreen';

export default function Home() {
  const { user, currentWeek, completedDays, actions, config, t } = useRoutine();
  const [activeTab, setActiveTab] = useState('week');

  // Bloqueio de acesso se não houver usuário logado
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
    <div 
      className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans transition-all duration-500 bg-cover bg-center bg-fixed relative"
      style={{ 
        backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : 'none' 
      }}
    >
      {/* Overlay de contraste: Ativado apenas quando há imagem de fundo */}
      {config.backgroundImage && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px] z-0 pointer-events-none transition-opacity duration-500" />
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* HEADER: Info do Usuário e Título */}
        <header className="text-center mb-8 pt-4">
          <div className="flex items-center justify-center gap-3 mb-3">
             <div className="flex -space-x-2">
               <img 
                 src={user.avatar || 'https://via.placeholder.com/150'} 
                 className="w-8 h-8 rounded-full border-2 border-primary/30 object-cover shadow-lg" 
                 alt="Avatar"
               />
             </div>
             <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
               {t('online')} • {user.name}
             </p>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground drop-shadow-md">
            {t('appTitle')}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base font-bold mt-2 opacity-80">
            {t('appSubtitle')}
          </p>
        </header>

        {/* NAVEGAÇÃO: Menu de Abas */}
        <nav className="flex justify-center mb-10">
          <div className="bg-card/40 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl flex w-full max-w-4xl shadow-2xl overflow-x-auto gap-1 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 min-w-[100px] py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap uppercase tracking-wider
                  ${activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02] translate-y-[-1px]' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }
                `}
              >
                <tab.icon size={16} strokeWidth={2.5} />
                {t(tab.label)}
              </button>
            ))}
          </div>
        </nav>

        {/* CONTEÚDO PRINCIPAL: Renderização Condicional com Framer Motion */}
        <main className="pb-10">
          <AnimatePresence mode='wait'>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
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