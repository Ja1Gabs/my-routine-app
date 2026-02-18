import React, { createContext, useContext, useState, useEffect } from 'react';
import { format, subDays, startOfWeek, addDays } from 'date-fns';

const RoutineContext = createContext();

export const useRoutine = () => useContext(RoutineContext);

// Atividades Padrão (com regras iniciais)
const DEFAULT_ACTIVITIES = [
  { 
    id: 'prog', name: 'Programação', iconName: 'Code2', theme: 'blue', 
    defaultTasks: ['Estudar React', 'Projeto Pessoal'],
    rules: { frequency: 5, allowedDays: [0,1,2,3,4] } // Seg-Sex
  },
  { 
    id: 'folga', name: 'Folga', iconName: 'Coffee', theme: 'amber', 
    defaultTasks: ['Ver Série', 'Jogar'],
    rules: { frequency: 1, allowedDays: [0,1,2,3,4,5] } 
  },
];

const FIXED_SUNDAY = { id: 'pausa', name: 'Pausa', iconName: 'Moon', theme: 'slate', fixed: true };

export const RoutineProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  const [activitiesPool, setActivitiesPool] = useState(DEFAULT_ACTIVITIES);
  const [currentWeek, setCurrentWeek] = useState([]);
  const [history, setHistory] = useState({});
  const [goals, setGoals] = useState([]);
  const [config, setConfig] = useState({ theme: 'dark', sundayMode: 'pause' });

  // --- LOAD & SAVE (Mantido igual) ---
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('routine_user'));
    if (savedUser) setUser(savedUser);

    const data = JSON.parse(localStorage.getItem('routine_db_v5') || '{}');
    if (data.activities) setActivitiesPool(data.activities);
    if (data.currentWeek) setCurrentWeek(data.currentWeek);
    if (data.history) setHistory(data.history);
    if (data.goals) setGoals(data.goals);
    if (data.config) setConfig(data.config);
    
    if (!data.currentWeek && savedUser) smartShuffle(data.activities || DEFAULT_ACTIVITIES);
  }, []);

  useEffect(() => {
    if (user) {
      const db = { activities: activitiesPool, currentWeek, history, goals, config };
      localStorage.setItem('routine_db_v5', JSON.stringify(db));
    }
  }, [activitiesPool, currentWeek, history, goals, config, user]);

  // --- AUTH ACTIONS (Mantido igual) ---
  const login = (email, name) => {
    const newUser = { name, email, avatar: `https://ui-avatars.com/api/?name=${name}&background=random` };
    setUser(newUser);
    localStorage.setItem('routine_user', JSON.stringify(newUser));
    if (currentWeek.length === 0) smartShuffle();
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

  // --- ALGORITMO DE EMBARALHAMENTO INTELIGENTE ---
  const smartShuffle = (poolOverride = null) => {
    const pool = poolOverride || [...activitiesPool];
    if (pool.length === 0) return;

    // 1. Inicializa semana vazia (6 dias, Seg-Sáb)
    let weekPlan = new Array(6).fill(null); 
    
    // 2. Cria uma lista de "Cartas" baseada na frequência desejada
    // Ex: Se "Academia" tem freq 3, cria 3 instâncias de Academia
    let deck = [];
    pool.forEach(act => {
      const freq = act.rules?.frequency || 1;
      for(let i = 0; i < freq; i++) {
        deck.push({ ...act }); // Clone para não mexer no original
      }
    });

    // 3. Embaralha o deck para aleatoriedade inicial
    deck = deck.sort(() => Math.random() - 0.5);

    // 4. ALGORITMO DE PREENCHIMENTO (Backtracking simplificado)
    // Tenta encaixar as atividades nos dias permitidos
    
    // Passo A: Preenche dias que têm restrições primeiro
    for (let card of deck) {
      const allowedDays = card.rules?.allowedDays || [0,1,2,3,4,5];
      
      // Tenta encontrar um dia vago que seja permitido para esta carta
      // Começa procurando aleatoriamente entre os permitidos para não viciar
      const shuffledPossibleDays = allowedDays.filter(d => d < 6).sort(() => Math.random() - 0.5);
      
      let placed = false;
      for (let dayIndex of shuffledPossibleDays) {
        if (weekPlan[dayIndex] === null) {
          // Sorteia uma tarefa específica se houver
          const randomTask = card.defaultTasks && card.defaultTasks.length > 0 
            ? card.defaultTasks[Math.floor(Math.random() * card.defaultTasks.length)] 
            : '';
          
          weekPlan[dayIndex] = { ...card, assignedTask: randomTask };
          placed = true;
          break; // Carta colocada, vai para a próxima
        }
      }
    }

    // Passo B: Se sobrar buraco (null), preenche com qualquer atividade aleatória do pool
    // que permita aquele dia
    for (let i = 0; i < 6; i++) {
      if (weekPlan[i] === null) {
        // Filtra atividades que permitem este dia 'i'
        const candidates = pool.filter(a => 
          !a.rules?.allowedDays || a.rules.allowedDays.includes(i)
        );
        
        const filler = candidates.length > 0 
          ? candidates[Math.floor(Math.random() * candidates.length)]
          : pool[Math.floor(Math.random() * pool.length)]; // Fallback total

        weekPlan[i] = { ...filler, assignedTask: '' };
      }
    }

    // 5. Adiciona Domingo
    const sunday = config.sundayMode === 'pause' ? FIXED_SUNDAY : weekPlan[0]; // Simplificado
    setCurrentWeek([...weekPlan, sunday]);
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
        shuffleWeek: smartShuffle, // Agora usa a versão inteligente
        toggleComplete,
        addGoal, setConfig
      }
    }}>
      {children}
    </RoutineContext.Provider>
  );
};