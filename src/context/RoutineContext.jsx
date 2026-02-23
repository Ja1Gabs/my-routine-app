import React, { createContext, useContext, useState, useEffect } from 'react';
import { format, subDays, startOfWeek, addDays } from 'date-fns';

const RoutineContext = createContext();

export const useRoutine = () => useContext(RoutineContext);

// --- SEM ATIVIDADES PADRÃO (COMEÇA VAZIO) ---
const DEFAULT_ACTIVITIES = [];

export const RoutineProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  const [activitiesPool, setActivitiesPool] = useState(DEFAULT_ACTIVITIES);
  const [currentWeek, setCurrentWeek] = useState([]);
  const [history, setHistory] = useState({});
  const [goals, setGoals] = useState([]);
  const [config, setConfig] = useState({ theme: 'dark' }); // Removemos sundayMode

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('routine_user'));
    if (savedUser) setUser(savedUser);

    const data = JSON.parse(localStorage.getItem('routine_db_v7') || '{}');
    if (data.activities) setActivitiesPool(data.activities);
    if (data.currentWeek) setCurrentWeek(data.currentWeek);
    if (data.history) setHistory(data.history);
    if (data.goals) setGoals(data.goals);
    if (data.config) setConfig(data.config);
  }, []);

  useEffect(() => {
    if (user) {
      const db = { activities: activitiesPool, currentWeek, history, goals, config };
      localStorage.setItem('routine_db_v7', JSON.stringify(db));
    }
  }, [activitiesPool, currentWeek, history, goals, config, user]);

  const login = (email, name) => {
    const newUser = { name, email, avatar: `https://ui-avatars.com/api/?name=${name}&background=random` };
    setUser(newUser);
    localStorage.setItem('routine_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('routine_user');
    window.location.reload();
  };

  const saveActivity = (activity) => {
    if (activity.id) {
      setActivitiesPool(prev => prev.map(a => a.id === activity.id ? activity : a));
    } else {
      setActivitiesPool(prev => [...prev, { ...activity, id: crypto.randomUUID() }]);
    }
  };

  const deleteActivity = (id) => {
    setActivitiesPool(prev => prev.filter(a => a.id !== id));
  };

  // --- ALGORITMO PURO (DOMINGO É DIA NORMAL) ---
  const smartShuffle = (poolOverride = null) => {
    const pool = (Array.isArray(poolOverride) && poolOverride.length > 0) ? poolOverride : [...activitiesPool];

    if (!pool || pool.length === 0) {
        // Se não tiver atividades, cria uma semana vazia para não quebrar a UI
        setCurrentWeek(new Array(7).fill(null));
        return;
    }

    // 1. Inicializa semana de 7 dias (0=Seg ... 6=Dom)
    let weekPlan = new Array(7).fill(null); 

    // 2. Monta o "Baralho"
    let deck = [];
    pool.forEach(act => {
      const freq = act.rules?.frequency || 1;
      for(let i = 0; i < freq; i++) {
        deck.push({ ...act });
      }
    });

    // Embaralha
    deck = deck.sort(() => Math.random() - 0.5);

    // 3. Preenche (Backtracking Greedy)
    for (let card of deck) {
      // Se não tiver regra de dias, aceita todos (0-6)
      const allowedDays = card.rules?.allowedDays || [0,1,2,3,4,5,6];
      
      const validEmptySlots = weekPlan
        .map((slot, index) => slot === null && allowedDays.includes(index) ? index : -1)
        .filter(index => index !== -1);

      if (validEmptySlots.length > 0) {
        const randomDayIndex = validEmptySlots[Math.floor(Math.random() * validEmptySlots.length)];
        
        const randomTask = card.defaultTasks && card.defaultTasks.length > 0 
            ? card.defaultTasks[Math.floor(Math.random() * card.defaultTasks.length)] 
            : '';

        weekPlan[randomDayIndex] = { ...card, assignedTask: randomTask };
      }
    }

    // 4. Preencher buracos restantes
    for (let i = 0; i < 7; i++) {
      if (weekPlan[i] === null) {
        const validCandidates = pool.filter(a => !a.rules?.allowedDays || a.rules.allowedDays.includes(i));
        const fillerPool = validCandidates.length > 0 ? validCandidates : pool;
        
        const filler = fillerPool[Math.floor(Math.random() * fillerPool.length)];

        if (filler) {
             const randomTask = filler.defaultTasks && filler.defaultTasks.length > 0 
            ? filler.defaultTasks[Math.floor(Math.random() * filler.defaultTasks.length)] 
            : '';
            weekPlan[i] = { ...filler, assignedTask: randomTask };
        }
      }
    }

    setCurrentWeek(weekPlan);
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
        saveActivity, deleteActivity,
        shuffleWeek: smartShuffle,
        toggleComplete,
        addGoal, setConfig
      }
    }}>
      {children}
    </RoutineContext.Provider>
  );
};