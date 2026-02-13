import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, BarChart3, History, Settings } from 'lucide-react';
import WeekView from './components/views/WeekView';

// --- DADOS INICIAIS (Mock) ---
const INITIAL_ACTIVITIES = [
  { id: 'prog', name: 'Programação', iconName: 'Code2', theme: 'blue' },
  { id: 'folga', name: 'Folga', iconName: 'Coffee', theme: 'amber' },
  { id: 'proj1', name: 'Projeto', iconName: 'Rocket', theme: 'emerald' },
  { id: 'proj2', name: 'Projeto', iconName: 'Rocket', theme: 'emerald' },
  { id: 'musica', name: 'Música', iconName: 'Music', theme: 'purple' },
  { id: 'desenho', name: 'Desenho', iconName: 'Palette', theme: 'pink' },
];
const FIXED_SUNDAY = { id: 'pausa', name: 'Pausa', iconName: 'Moon', theme: 'slate', fixed: true };

// --- PLACEHOLDERS PARA OUTRAS VIEWS ---
const StatsView = () => <div className="p-10 text-center text-white/40 border border-white/5 rounded-xl bg-[#111]">Estatísticas em breve</div>;
const HistoryView = () => <div className="p-10 text-center text-white/40 border border-white/5 rounded-xl bg-[#111]">Histórico em breve</div>;
const ConfigView = () => <div className="p-10 text-center text-white/40 border border-white/5 rounded-xl bg-[#111]">Configurações em breve</div>;

export default function App() {
  const [activeTab, setActiveTab] = useState('week');
  const [weekRoutine, setWeekRoutine] = useState([]);
  const [completedDays, setCompletedDays] = useState({});

  // --- Lógica de Carregamento/Salvamento ---
  useEffect(() => {
    try {
      const savedRoutine = localStorage.getItem('myRoutine_week');
      const savedCompleted = localStorage.getItem('myRoutine_completed');
      if (savedRoutine) setWeekRoutine(JSON.parse(savedRoutine));
      else handleShuffle();
      if (savedCompleted) setCompletedDays(JSON.parse(savedCompleted));
    } catch (e) {
      localStorage.clear();
      handleShuffle();
    }
  }, []);

  useEffect(() => {
    if (weekRoutine.length) localStorage.setItem('myRoutine_week', JSON.stringify(weekRoutine));
  }, [weekRoutine]);

  useEffect(() => {
    localStorage.setItem('myRoutine_completed', JSON.stringify(completedDays));
  }, [completedDays]);

  // --- Ações ---
  const handleShuffle = () => {
    const shuffled = [...INITIAL_ACTIVITIES].sort(() => Math.random() - 0.5);
    setWeekRoutine([...shuffled, FIXED_SUNDAY]);
  };

  const toggleComplete = (dateStr) => {
    setCompletedDays(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-10 pt-6">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">Minha Rotina</h1>
          <p className="text-white/40 text-sm md:text-base font-medium">Organize sua semana de forma criativa</p>
        </header>

        {/* Navegação */}
        <nav className="flex justify-center mb-12">
          <div className="bg-[#111] border border-white/10 p-1.5 rounded-2xl flex w-full max-w-2xl shadow-2xl shadow-black/50">
            {[
              { id: 'week', label: 'Semana', icon: LayoutGrid },
              { id: 'stats', label: 'Stats', icon: BarChart3 },
              { id: 'history', label: 'Histórico', icon: History },
              { id: 'config', label: 'Config', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/5' 
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon size={16} className={activeTab === tab.id ? 'text-white' : 'text-white/40'} />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Conteúdo Dinâmico */}
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
                  routine={weekRoutine} 
                  completed={completedDays} 
                  onToggleComplete={toggleComplete} 
                  onShuffle={handleShuffle} 
                />
              )}
              {activeTab === 'stats' && <StatsView />}
              {activeTab === 'history' && <HistoryView />}
              {activeTab === 'config' && <ConfigView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}