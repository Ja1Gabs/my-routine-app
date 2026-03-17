import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { TRANSLATIONS } from '../constants/translations';

const RoutineContext = createContext();

export const useRoutine = () => useContext(RoutineContext);

// URL DO BACKEND
const API_URL = "https://my-routine-app-jxx7.onrender.com"; 

const DEFAULT_ACTIVITIES =[];
const FIXED_SUNDAY = { id: 'pausa', name: 'Pausa', iconName: 'Moon', theme: 'slate', fixed: true };

export const RoutineProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  
  const [activitiesPool, setActivitiesPool] = useState(DEFAULT_ACTIVITIES);
  const[currentWeek, setCurrentWeek] = useState(() => Array.from({ length: 7 }, () => ({}))); 
  const [history, setHistory] = useState({}); 
  const [goals, setGoals] = useState([]);
  
  // --- CONFIGURAÇÃO COM LAZY LOAD (Previne piscar o tema no primeiro load) ---
  const [config, setConfig] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem('routine_db_v10') || '{}'); 
      if (data.config) return data.config;
    } catch (e) {}
    
    return { 
      theme: 'dark', 
      sundayMode: 'pause', 
      lang: 'pt',
      backgroundImage: '',
      routineMode: 'simple',
      activeShifts: ['default'] 
    };
  });

  const isFirstLoad = useRef(true);

  // --- TRADUÇÃO & TEMA ---
  const t = (key) => TRANSLATIONS[config.lang || 'pt'][key] || key;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(config.theme === 'dark' ? 'dark' : 'light');
  }, [config.theme]);

  // --- 1. CARREGAR DADOS (CLOUD OU LOCAL) ---
  useEffect(() => {
    const init = async () => {
      const cachedUser = localStorage.getItem('user_data');
      if (token && cachedUser) {
        setUser(JSON.parse(cachedUser));
        await loadDataFromCloud(token);
      } else {
        loadLocalData();
      }
      isFirstLoad.current = false;
    };
    init();
  }, [token]);

  const loadDataFromCloud = async (authToken) => {
    try {
      const res = await fetch(`${API_URL}/data`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Object.keys(data).length > 0) {
          if (data.activities) setActivitiesPool(data.activities);
          if (data.currentWeek && Array.isArray(data.currentWeek)) setCurrentWeek(data.currentWeek);
          if (data.history) setHistory(data.history);
          if (data.goals) setGoals(data.goals);
          if (data.config) setConfig(prev => ({ ...prev, ...data.config }));
        }
      }
    } catch (error) {
      console.error("Erro ao sincronizar nuvem:", error);
      loadLocalData();
    }
  };

  const loadLocalData = () => {
    const data = JSON.parse(localStorage.getItem('routine_db_v10') || '{}');
    if (data.activities) setActivitiesPool(data.activities);
    if (data.currentWeek && Array.isArray(data.currentWeek)) setCurrentWeek(data.currentWeek);
    if (data.history) setHistory(data.history);
    if (data.goals) setGoals(data.goals);
    if (data.config) setConfig(prev => ({ ...prev, ...data.config }));
  };

  // --- 2. SALVAR DADOS (AUTO-SYNC COM DEBOUNCE) ---
  useEffect(() => {
    if (isFirstLoad.current) return;

    const dataToSave = { activities: activitiesPool, currentWeek, history, goals, config };
    localStorage.setItem('routine_db_v10', JSON.stringify(dataToSave));

    if (token) {
      const timer = setTimeout(() => {
        fetch(`${API_URL}/data`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(dataToSave)
        }).catch(err => console.error("Erro no auto-save nuvem:", err));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [activitiesPool, currentWeek, history, goals, config, token]);

  // --- AUTH ACTIONS ---
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return login(email, password);
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.reload();
  };

  // --- COMPLETED DAYS MAPPER (Exportação segura p/ UI não quebrar) ---
  const completedDays = useMemo(() => {
    if (!history) return {};
    const shiftsToCheck = config.routineMode === 'shifts' && config.activeShifts?.length > 0 ? config.activeShifts : ['default'];
    const datesObj = {};
    const uniqueDates =[...new Set(Object.keys(history).map(k => k.split('_')[0]))];
    
    uniqueDates.forEach(dateStr => {
      // Retorna true APENAS SE todos os turnos ativos daquele dia foram completados
      datesObj[dateStr] = shiftsToCheck.every(s => history[`${dateStr}_${s}`]?.completed);
    });
    return datesObj;
  }, [history, config.routineMode, config.activeShifts]);

  // --- STATS ENGINE (Baseado no completedDays) ---
  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

    // 1. Sequência Diária
    let daily = 0;
    if (completedDays[todayStr] || completedDays[yesterdayStr]) {
      let checkDate = completedDays[todayStr] ? today : subDays(today, 1);
      while (completedDays[format(checkDate, 'yyyy-MM-dd')]) {
        daily++;
        checkDate = subDays(checkDate, 1);
      }
    }

    // 2. Semanas Perfeitas
    let weekly = 0;
    let wStart = startOfWeek(today, { weekStartsOn: 1 });
    
    const checkWeek = (start) => {
      for (let i = 0; i < 7; i++) {
        if (!completedDays[format(addDays(start, i), 'yyyy-MM-dd')]) return false;
      }
      return true;
    };

    let currentW = wStart;
    while (true) {
      if (checkWeek(currentW)) {
        weekly++;
        currentW = subDays(currentW, 7);
      } else {
        break;
      }
    }

    // Calcula total completado contando os turnos/atividades individuais (history)
    const totalCompletedShifts = Object.values(history).filter(h => h.completed).length;

    return {
      dailyStreak: daily,
      weeklyStreak: weekly,
      totalCompleted: totalCompletedShifts
    };
  }, [completedDays, history]);

  // --- APP ACTIONS BÁSICAS ---
  const updateDayData = (dateStr, shiftKey, newData) => {
    const key = `${dateStr}_${shiftKey}`;
    setHistory(prev => ({
      ...prev,
      [key]: { ...prev[key], ...newData, lastUpdated: new Date().toISOString() }
    }));
  };

  const toggleComplete = (dateStr, shiftKey) => {
    const key = `${dateStr}_${shiftKey}`;
    setHistory(prev => ({
      ...prev,
      [key]: { ...prev[key], completed: !prev[key]?.completed, lastUpdated: new Date().toISOString() }
    }));
  };

  const saveActivity = (activity) => {
    if (activity.id) setActivitiesPool(prev => prev.map(a => a.id === activity.id ? activity : a));
    else setActivitiesPool(prev => [...prev, { ...activity, id: crypto.randomUUID() }]);
  };
  
  const deleteActivity = (id) => setActivitiesPool(prev => prev.filter(a => a.id !== id));

  // --- GOALS ACTIONS ---
  const addGoal = (goal) => {
    setGoals(prev =>[...prev, { ...goal, id: crypto.randomUUID(), current: 0 }]);
  };

  const incrementGoal = (id) => {
    setGoals(prev => prev.map(g => {
      if (g.id === id && g.type === 'manual') {
        return { ...g, current: Math.min(g.current + 1, g.target) };
      }
      return g;
    }));
  };

  const deleteGoal = (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  // --- SHUFFLE MATRICIAL (TURNOS) ---
  const shuffleWeek = (poolOverride = null) => {
    const pool = (Array.isArray(poolOverride) && poolOverride.length > 0) ? poolOverride : [...activitiesPool];
    const targetShifts = config.routineMode === 'shifts' ? (config.activeShifts?.length > 0 ? config.activeShifts :['morning']) : ['default'];

    if (!pool || pool.length === 0) {
      const emptyWeek = Array.from({ length: 7 }, () => {
         let dayObj = {};
         targetShifts.forEach(s => dayObj[s] = null);
         return dayObj;
      });
      setCurrentWeek(emptyWeek);
      return;
    }

    let weekPlan = Array.from({ length: 7 }, () => {
      let dayObj = {};
      targetShifts.forEach(s => dayObj[s] = null);
      return dayObj;
    });

    if (config.sundayMode === 'pause') {
      targetShifts.forEach(s => weekPlan[6][s] = FIXED_SUNDAY);
    } else if (config.sundayMode !== 'random') {
      const fixedAct = pool.find(a => a.id === config.sundayMode);
      if (fixedAct) targetShifts.forEach(s => weekPlan[6][s] = { ...fixedAct, assignedTask: '', fixed: true });
    }

    let deck =[];
    pool.forEach(act => {
      const freq = act.rules?.frequency || 1;
      for (let i = 0; i < freq; i++) deck.push({ ...act });
    });
    deck = deck.sort(() => Math.random() - 0.5);

    for (let card of deck) {
      const allowedDays = card.rules?.allowedDays ||[0, 1, 2, 3, 4, 5, 6];
      const allowedShifts = card.rules?.allowedShifts || targetShifts;
      let placed = false;

      for (let dIdx of allowedDays.sort(() => Math.random() - 0.5)) {
        if (dIdx > 6) continue;
        for (let sKey of allowedShifts.sort(() => Math.random() - 0.5)) {
          if (targetShifts.includes(sKey) && weekPlan[dIdx][sKey] === null) {
            const tasks = card.defaultTasks ||[];
            const randomTask = tasks.length > 0 ? tasks[Math.floor(Math.random() * tasks.length)] : '';
            weekPlan[dIdx][sKey] = { ...card, assignedTask: randomTask };
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
    }

    for (let i = 0; i < 7; i++) {
      for (let s of targetShifts) {
        if (weekPlan[i][s] === null) {
          const valid = pool.filter(a => 
            (!a.rules?.allowedDays || a.rules.allowedDays.includes(i)) &&
            (!a.rules?.allowedShifts || a.rules.allowedShifts.includes(s))
          );
          const filler = (valid.length > 0 ? valid : pool)[Math.floor(Math.random() * (valid.length || pool.length))];
          if (filler) {
            weekPlan[i][s] = { ...filler, assignedTask: filler.defaultTasks?.[0] || '' };
          } else {
            weekPlan[i][s] = FIXED_SUNDAY;
          }
        }
      }
    }
    setCurrentWeek(weekPlan);
  };

  return (
    <RoutineContext.Provider value={{
      user, config, t,
      currentWeek, activitiesPool, history, goals,
      completedDays, // Evita crashes nas telas de UI exportando o mapa consolidado
      stats,
      actions: {
        login, register, logout,
        saveActivity, deleteActivity, shuffleWeek, 
        toggleComplete, updateDayData, 
        addGoal, incrementGoal, deleteGoal, setConfig
      }
    }}>
      {children}
    </RoutineContext.Provider>
  );
};