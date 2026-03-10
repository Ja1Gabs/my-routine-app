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
  const { user, config, t } = useRoutine();
  const [activeTab, setActiveTab] = useState('week');

  // Bloqueio de acesso se não houver usuário logado
  if (!user) return <LoginScreen />;

  // Menu de Abas
  const tabs =[
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
      {/* Overlay de contraste: Ativado apenas quando há imagem de fundo configurada */}
      {config.backgroundImage && (
  <div className="fixed inset-0 z-0 pointer-events-none bg-white/70 dark:bg-black/80 backdrop-blur-sm transition-colors duration-300" />
)}

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* HEADER: Info do Usuário e Título */}
        <header className="text-center mb-10 pt-4">
          
          <div className="flex items-center justify-center gap-3 mb-4">
             <div className="flex -space-x-2">
               <img 
                 src={user.avatar || 'https://via.placeholder.com/150'} 
                 className="w-8 h-8 rounded-full border-2 border-primary/30 object-cover shadow-lg" 
                 alt="Avatar"
               />
             </div>
             <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
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

        {/* NAVEGAÇÃO: Menu de Abas (Glassmorphism adaptável) */}
        <nav className="flex justify-center mb-10 px-2 md:px-0">
          <div className="bg-card/60 backdrop-blur-xl border border-border p-1.5 rounded-2xl flex w-full max-w-4xl shadow-lg overflow-x-auto gap-1 no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 min-w-[100px] py-3.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap uppercase tracking-wider
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-md scale-[1.02] translate-y-[-1px]' 
                      : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                    }
                  `}
                >
                  <tab.icon 
                    size={16} 
                    strokeWidth={isActive ? 3 : 2} 
                    className={isActive ? 'text-primary-foreground' : 'text-muted-foreground'} 
                  />
                  {t(tab.label)}
                </button>
              );
            })}
          </div>
        </nav>

        {/* CONTEÚDO PRINCIPAL: Renderização Condicional com Framer Motion */}
        <main className="pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* O WeekView agora puxa seus dados diretamente do Contexto */}
              {activeTab === 'week' && <WeekView />}
              {activeTab === 'library' && <LibraryPanel />}
              {activeTab === 'goals' && <GoalPanel />}
              {/* Stats e History continuam puxando dados do contexto internamente, sem precisar passar via Props */}
              {activeTab === 'stats' && <StatsPanel />}
              {activeTab === 'history' && <HistoryPanel />}
              {activeTab === 'config' && <SettingsPanel />}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}