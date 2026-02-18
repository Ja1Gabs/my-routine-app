import React, { createContext, useContext, useState, useEffect } from 'react';
import { format, subDays, startOfWeek, addDays } from 'date-fns';

const RoutineContext = createContext();

export const useRoutine = () => useContext(RoutineContext);

// Atividades Padrão com Tarefas de Exemplo
const DEFAULT_ACTIVITIES = [
  { id: 'prog', name: 'Programação', iconName: 'Code2', theme: 'blue', defaultTasks: ['Estudar React', 'Refatorar Context', 'Criar Componentes'] },
  { id: 'folga', name: 'Folga', iconName: 'Coffee', theme: 'amber', defaultTasks: ['Ver Série', 'Jogar', 'Dormir'] },
  { id: 'proj1', name: 'Projeto', iconName: 'Rocket', theme: 'emerald', defaultTasks: ['Planejamento', 'Execução'] },
  { id: 'musica', name: 'Música', iconName: 'Music', theme: 'purple', defaultTasks: ['Praticar Escalas', 'Aprender Música Nova'] },
];

const FIXED_SUNDAY = { id: 'pausa', name: 'Pausa', iconName: 'Moon', theme: 'slate', fixed: true };

export const RoutineProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  // Banco de Dados Local
  const [activitiesPool, setActivitiesPool] = useState(DEFAULT_ACTIVITIES);
  const [currentWeek, setCurrentWeek] = useState([]);
  const [history, setHistory] = useState({});
  const [goals, setGoals] = useState([]);
  const [config, setConfig] = useState({ theme: 'dark', sundayMode: 'pause' });

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('routine_user'));
    if (savedUser) setUser(savedUser);

    const data = JSON.parse(localStorage.getItem('routine_db_v4') || '{}');
    if (data.activities) setActivitiesPool(data.activities);
    if (data.currentWeek) setCurrentWeek(data.currentWeek);
    if (data.history) setHistory(data.history);
    if (data.goals) setGoals(data.goals);
    if (data.config) setConfig(data.config);
    
    // Gera semana inicial se não existir
    if (!data.currentWeek && savedUser) shuffleWeek(data.activities || DEFAULT_ACTIVITIES);
  }, []);

  // --- SALVAMENTO AUTOMÁTICO ---
  useEffect(() => {
    if (user) {
      const db = { activities: activitiesPool, currentWeek, history, goals, config };
      localStorage.setItem('routine_db_v4', JSON.stringify(db));
    }
  }, [activitiesPool, currentWeek, history, goals, config, user]);

  // --- ACTIONS: AUTH ---
  const login = (email, name) => {
    const newUser = { name, email, avatar: `https://ui-avatars.com/api/?name=${name}&background=random` };
    setUser(newUser);
    localStorage.setItem('routine_user', JSON.stringify(newUser));
    if (currentWeek.length === 0) shuffleWeek();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('routine_user');
    window.location.reload();
  };

  // --- ACTIONS: LIBRARY (BIBLIOTECA) ---
  const saveActivity = (activity) => {
    if (activity.id) {
      // Editar
      setActivitiesPool(prev => prev.map(a => a.id === activity.id ? activity : a));
    } else {
      // Criar Nova
      setActivitiesPool(prev => [...prev, { ...activity, id: crypto.randomUUID() }]);
    }
  };

  const deleteActivity = (id) => {
    setActivitiesPool(prev => prev.filter(a => a.id !== id));
  };

  // --- ACTIONS: ROTINA ---
  const shuffleWeek = (poolOverride = null) => {
    let pool = poolOverride || [...activitiesPool];
    if (pool.length === 0) pool = DEFAULT_ACTIVITIES;

    // Garante cartas suficientes
    let deck = [...pool];
    while (deck.length < 6) deck = [...deck, ...pool];

    // Sorteia 6 dias e injeta uma tarefa aleatória da lista da atividade
    const shuffled = deck.sort(() => Math.random() - 0.5).slice(0, 6).map(act => {
      const randomTask = act.defaultTasks && act.defaultTasks.length > 0 
        ? act.defaultTasks[Math.floor(Math.random() * act.defaultTasks.length)] 
        : '';
      return { ...act, assignedTask: randomTask };
    });

    // Lógica do Domingo
    const sunday = config.sundayMode === 'pause' ? FIXED_SUNDAY : shuffled[0]; // Simplificado
    setCurrentWeek([...shuffled, sunday]);
  };

  const toggleComplete = (dateStr) => {
    setHistory(prev => ({
      ...prev,
      [dateStr]: { ...prev[dateStr], completed: !prev[dateStr]?.completed }
    }));
  };

  const addGoal = (goal) => {
    setGoals(prev => [...prev, { ...goal, id: crypto.randomUUID(), current: 0 }]);
  };

  // --- HELPERS ---
  const calculateStreak = () => {
    let streak = 0;
    let date = new Date();
    if (!history[format(date, 'yyyy-MM-dd')]?.completed) date = subDays(date, 1);
    while (true) {
      if (history[format(date, 'yyyy-MM-dd')]?.completed) { streak++; date = subDays(date, 1); }
      else break;
    }
    return streak;
  };

  return (
    <RoutineContext.Provider value={{
      user,
      currentWeek,
      activitiesPool,
      history,
      goals,
      config,
      completedDays: Object.keys(history).reduce((acc, k) => { acc[k] = history[k].completed; return acc; }, {}),
      stats: { streak: calculateStreak(), total: Object.values(history).filter(h => h.completed).length },
      actions: {
        login, logout,
        saveActivity, deleteActivity, // <--- FALTAVAM ESTES!
        shuffleWeek, toggleComplete,
        addGoal, setConfig
      }
    }}>
      {children}
    </RoutineContext.Provider>
  );
};