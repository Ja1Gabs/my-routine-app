import React, { useState } from 'react';
import { LayoutGrid, BarChart3, History, Settings, Target, Library, Coffee, KanbanSquare, LayoutDashboard, Kanban, dayNotes   } from 'lucide-react';
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
import CanvasView from '../components/views/CanvasView';
export default function Home() {
  const { user, config, t, isServerWaking } = useRoutine();
  const [activeTab, setActiveTab] = useState('week');

  // Bloqueio de acesso se não houver usuário logado
  if (!user) return <LoginScreen />;

  // Menu de Abas
  const tabs =[
    { id: 'week', label: 'week', icon: LayoutGrid },
    { id: 'board', label: 'board', icon: Kanban  },
    { id: 'library', label: 'library', icon: Library },
    { id: 'goals', label: 'goals', icon: Target },
    { id: 'stats', label: 'stats', icon: BarChart3 },
    { id: 'history', label: 'history', icon: History },
    { id: 'config', label: 'config', icon: Settings },
  ];

  return (  
    <div 
      className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 bg-cover bg-center bg-fixed"
      style={{ 
        backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined 
      }}
    >
      {/* Overlay de contraste: Ativado apenas quando há imagem de fundo configurada */}
      {config.backgroundImage && (
        <div className="fixed inset-0 bg-background/80 dark:bg-black/80 z-0 pointer-events-none backdrop-blur-[2px]" />
      )}

      {/* --- OVERLAY DE HIBERNAÇÃO (O SEGREDO PREMIUM) --- */}
      <AnimatePresence>
        {isServerWaking && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60"
          >
            <div className="bg-card p-8 rounded-3xl shadow-2xl border border-border flex flex-col items-center max-w-sm text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                {/* Ícone de café pulando */}
                <Coffee size={32} className="text-primary animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">
                {t('wakingServer') || "Acordando Servidor..."}
              </h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                {t('wakingServerDesc') || "Como usamos uma hospedagem gratuita, o servidor pode levar alguns segundos para despertar. Pegue um café!"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative z-10 px-4 md:px-8 pb-24 md:pb-8 pt-4">
        
        {/* HEADER: Info do Usuário e Título */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
             <div className="flex -space-x-2">
               <img 
                 src={user.avatar} 
                 className="w-6 h-6 rounded-full border border-border" 
                 alt="Avatar"
               />
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

        {/* NAVEGAÇÃO DESKTOP (Invisível no Celular) */}
        <nav className="hidden md:flex justify-center mb-10">
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
                <tab.icon size={16} className={activeTab === tab.id ? 'text-primary-foreground' : 'text-muted-foreground'} />
                {t(tab.label)}
              </button>
            ))}
          </div>
        </nav>

        <main>
          <AnimatePresence mode='wait'>
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {activeTab === 'week' && <WeekView />}
              {activeTab === 'board' && <CanvasView />}
              {activeTab === 'library' && <LibraryPanel />}
              {activeTab === 'goals' && <GoalPanel />}
              {activeTab === 'stats' && <StatsPanel />}
              {activeTab === 'history' && <HistoryPanel />}
              {activeTab === 'config' && <SettingsPanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* NAVEGAÇÃO MOBILE (Invisível no Desktop, Fixa embaixo no Celular) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-center px-2 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all
                ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:bg-secondary/50'}
              `}
            >
              <tab.icon size={20} className={activeTab === tab.id ? 'fill-primary/20' : ''} />
              <span className={`text-[9px] font-bold ${activeTab === tab.id ? 'opacity-100' : 'opacity-0 h-0'} transition-all`}>
                {t(tab.label)}
              </span>
            </button>
          ))}
        </div>
      </nav>

    </div>
  );
}