import React, { createContext, useContext, useState, useEffect } from 'react';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { TRANSLATIONS } from '../constants/translations';

const RoutineContext = createContext();

export const useRoutine = () => useContext(RoutineContext);

const DEFAULT_ACTIVITIES = [];
const FIXED_SUNDAY = { id: 'pausa', name: 'Pausa', iconName: 'Moon', theme: 'slate', fixed: true };

export const RoutineProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  const [activitiesPool, setActivitiesPool] = useState(DEFAULT_ACTIVITIES);
  const [currentWeek, setCurrentWeek] = useState([]);
  const [history, setHistory] = useState({});
  const [goals, setGoals] = useState([]);
  
  // Configurações
  const [config, setConfig] = useState({ 
    theme: 'dark', 
    sundayMode: 'pause', // 'pause', 'random' ou ID da atividade
    lang: 'pt' 
  });

  // --- HELPER DE TRADUÇÃO ---
  const t = (key) => {
    const lang = config.lang || 'pt';
    return TRANSLATIONS[lang][key] || key;
  };

  // --- EFEITO: TEMA CLARO/ESCURO ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (config.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }
  }, [config.theme]);

  // --- LOAD & SAVE ---
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('routine_user'));
    if (savedUser) setUser(savedUser);

    const data = JSON.parse(localStorage.getItem('routine_db_v8') || '{}');
    if (data.activities) setActivitiesPool(data.activities);
    if (data.currentWeek) setCurrentWeek(data.currentWeek);
    if (data.history) setHistory(data.history);
    if (data.goals) setGoals(data.goals);
    if (data.config) setConfig(data.config);
  }, []);

  useEffect(() => {
    if (user) {
      const db = { activities: activitiesPool, currentWeek, history, goals, config };
      localStorage.setItem('routine_db_v8', JSON.stringify(db));
    }
  }, [activitiesPool, currentWeek, history, goals, config, user]);

  // --- ACTIONS ---
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

  // --- O LOOP INTELIGENTE (SHUFFLE) ---
  const shuffleWeek = (poolOverride = null) => {
    const pool = (Array.isArray(poolOverride) && poolOverride.length > 0) ? poolOverride : [...activitiesPool];
    
    // Segurança: se não tiver atividades, cria semana vazia
    if (!pool || pool.length === 0) {
        setCurrentWeek(new Array(7).fill(null));
        return;
    }

    // 1. Inicializa semana de 7 dias (0=Seg ... 6=Dom) com Nulos
    let weekPlan = new Array(7).fill(null); 

    // 2. Resolve a Lógica do Domingo (Índice 6)
    if (config.sundayMode === 'pause') {
      weekPlan[6] = FIXED_SUNDAY;
    } else if (config.sundayMode !== 'random') {
      // Se for um ID de atividade específica, tenta achar no pool
      const fixedAct = pool.find(a => a.id === config.sundayMode);
      if (fixedAct) {
        weekPlan[6] = { ...fixedAct, assignedTask: '', fixed: true };
      }
    }
    // Se for 'random', o índice 6 continua null e entra no sorteio abaixo

    // 3. Monta o "Baralho" baseado na frequência configurada
    let deck = [];
    pool.forEach(act => {
      const freq = act.rules?.frequency || 1;
      for(let i = 0; i < freq; i++) deck.push({ ...act });
    });

    // Embaralha o baralho inicial
    deck = deck.sort(() => Math.random() - 0.5);

    // 4. Preenche os dias (Backtracking Greedy)
    for (let card of deck) {
      const allowedDays = card.rules?.allowedDays || [0,1,2,3,4,5,6];
      
      // Encontra slots vazios que são permitidos para esta carta
      const validEmptySlots = weekPlan
        .map((slot, index) => slot === null && allowedDays.includes(index) ? index : -1)
        .filter(index => index !== -1);

      if (validEmptySlots.length > 0) {
        // Escolhe um slot aleatório dentre os possíveis
        const randomDayIndex = validEmptySlots[Math.floor(Math.random() * validEmptySlots.length)];
        
        // Sorteia uma tarefa da lista da atividade
        const randomTask = card.defaultTasks && card.defaultTasks.length > 0 
            ? card.defaultTasks[Math.floor(Math.random() * card.defaultTasks.length)] 
            : '';
        
        weekPlan[randomDayIndex] = { ...card, assignedTask: randomTask };
      }
    }

    // 5. Fallback: Preencher buracos restantes (se a lógica acima deixar vago)
    for (let i = 0; i < 7; i++) {
      if (weekPlan[i] === null) {
        // Tenta achar atividades que permitam esse dia
        const validCandidates = pool.filter(a => !a.rules?.allowedDays || a.rules.allowedDays.includes(i));
        
        // Se não tiver candidata perfeita, pega qualquer uma do pool
        const fillerPool = validCandidates.length > 0 ? validCandidates : pool;
        const filler = fillerPool[Math.floor(Math.random() * fillerPool.length)];
        
        if (filler) {
             const randomTask = filler.defaultTasks && filler.defaultTasks.length > 0 
               ? filler.defaultTasks[Math.floor(Math.random() * filler.defaultTasks.length)] 
               : '';
            weekPlan[i] = { ...filler, assignedTask: randomTask };
        } else {
            // Último recurso se o pool estiver vazio (raro aqui)
            weekPlan[i] = FIXED_SUNDAY; 
        }
      }
    }
    
    setCurrentWeek(weekPlan);
  };

  const toggleComplete = (dateStr) => {
    setHistory(prev => ({ ...prev, [dateStr]: { ...prev[dateStr], completed: !prev[dateStr]?.completed } }));
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
      user, config, t,
      currentWeek, activitiesPool, history, goals,
      completedDays: Object.keys(history).reduce((acc, k) => { acc[k] = history[k].completed; return acc; }, {}),
      stats: { streak: calculateStreak(), total: Object.values(history).filter(h => h.completed).length },
      actions: {
        login, logout, saveActivity, deleteActivity, shuffleWeek, toggleComplete, addGoal, setConfig
      }
    }}>
      {children}
    </RoutineContext.Provider>
  );
};