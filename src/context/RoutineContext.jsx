import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { TRANSLATIONS } from '../constants/translations';

const RoutineContext = createContext();

export const useRoutine = () => useContext(RoutineContext);

// URL DO BACKEND (Em dev é localhost, em prod será o link do Render)
const API_URL = "https://my-routine-app-jxx7.onrender.com"; 

const DEFAULT_ACTIVITIES = [];
const FIXED_SUNDAY = { id: 'pausa', name: 'Pausa', iconName: 'Moon', theme: 'slate', fixed: true };

export const RoutineProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  
  // Estado da Aplicação
  const [activitiesPool, setActivitiesPool] = useState(DEFAULT_ACTIVITIES);
  const [currentWeek, setCurrentWeek] = useState([]);
  const [history, setHistory] = useState({});
  const [goals, setGoals] = useState([]);
  const [config, setConfig] = useState({ theme: 'dark', sundayMode: 'pause', lang: 'pt' });

  // Controle de Salvamento (Debounce)
  const isFirstLoad = useRef(true);

  // --- TRADUÇÃO & TEMA ---
  const t = (key) => {
    const lang = config.lang || 'pt';
    return TRANSLATIONS[lang][key] || key;
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(config.theme === 'dark' ? 'dark' : 'light');
  }, [config.theme]);

  // --- 1. CARREGAR DADOS (LOGIN OU SYNC) ---
  useEffect(() => {
    const init = async () => {
      // Recupera usuário do cache se existir
      const cachedUser = localStorage.getItem('user_data');
      if (token && cachedUser) {
        setUser(JSON.parse(cachedUser));
        await loadDataFromCloud(token);
      } else {
        // Se não tiver conta, carrega do localStorage antigo (modo offline)
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
        // Se o banco estiver vazio, mantém o estado atual ou local
        if (Object.keys(data).length > 0) {
          if (data.activities) setActivitiesPool(data.activities);
          if (data.currentWeek) setCurrentWeek(data.currentWeek);
          if (data.history) setHistory(data.history);
          if (data.goals) setGoals(data.goals);
          if (data.config) setConfig(data.config);
        }
      }
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
    }
  };

  const loadLocalData = () => {
    const data = JSON.parse(localStorage.getItem('routine_db_offline') || '{}');
    if (data.activities) setActivitiesPool(data.activities);
    if (data.currentWeek) setCurrentWeek(data.currentWeek);
    if (data.history) setHistory(data.history);
    if (data.goals) setGoals(data.goals);
    if (data.config) setConfig(data.config);
  };

  // --- 2. SALVAR DADOS (AUTO-SYNC) ---
  useEffect(() => {
    if (isFirstLoad.current) return;

    const dataToSave = { activities: activitiesPool, currentWeek, history, goals, config };

    // Salva localmente (Backup)
    localStorage.setItem('routine_db_offline', JSON.stringify(dataToSave));

    // Se estiver logado, salva na nuvem
    if (token) {
      const timer = setTimeout(() => {
        fetch(`${API_URL}/data`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(dataToSave)
        }).catch(err => console.error("Erro no auto-save:", err));
      }, 2000); // Salva 2 segundos após parar de mexer (Debounce)
      
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
      
      // Auto login após registro
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
    // Não limpamos 'routine_db_offline' para não perder dados se o user deslogar sem querer
    window.location.reload();
  };

  // --- APP ACTIONS (Lógica inalterada) ---
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

  const shuffleWeek = (poolOverride = null) => {
    const pool = (Array.isArray(poolOverride) && poolOverride.length > 0) ? poolOverride : [...activitiesPool];
    if (!pool || pool.length === 0) {
        setCurrentWeek(new Array(7).fill(null));
        return;
    }

    let weekPlan = new Array(7).fill(null); 
    
    // Configura Domingo
    if (config.sundayMode === 'pause') {
      weekPlan[6] = FIXED_SUNDAY;
    } else if (config.sundayMode !== 'random') {
      const fixedAct = pool.find(a => a.id === config.sundayMode);
      if (fixedAct) weekPlan[6] = { ...fixedAct, assignedTask: '', fixed: true };
    }

    let deck = [];
    pool.forEach(act => {
      const freq = act.rules?.frequency || 1;
      for(let i = 0; i < freq; i++) deck.push({ ...act });
    });

    deck = deck.sort(() => Math.random() - 0.5);

    for (let card of deck) {
      const allowedDays = card.rules?.allowedDays || [0,1,2,3,4,5,6];
      const validEmptySlots = weekPlan.map((slot, index) => slot === null && allowedDays.includes(index) ? index : -1).filter(index => index !== -1);

      if (validEmptySlots.length > 0) {
        const randomDayIndex = validEmptySlots[Math.floor(Math.random() * validEmptySlots.length)];
        const randomTask = card.defaultTasks && card.defaultTasks.length > 0 
            ? card.defaultTasks[Math.floor(Math.random() * card.defaultTasks.length)] : '';
        weekPlan[randomDayIndex] = { ...card, assignedTask: randomTask };
      }
    }

    // Fallback
    for (let i = 0; i < 7; i++) {
      if (weekPlan[i] === null) {
        const validCandidates = pool.filter(a => !a.rules?.allowedDays || a.rules.allowedDays.includes(i));
        const fillerPool = validCandidates.length > 0 ? validCandidates : pool;
        const filler = fillerPool[Math.floor(Math.random() * fillerPool.length)];
        if (filler) {
             const randomTask = filler.defaultTasks && filler.defaultTasks.length > 0 ? filler.defaultTasks[Math.floor(Math.random() * filler.defaultTasks.length)] : '';
            weekPlan[i] = { ...filler, assignedTask: randomTask };
        } else {
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
        login, register, logout, // Ações reais
        saveActivity, deleteActivity, shuffleWeek, toggleComplete, addGoal, setConfig
      }
    }}>
      {children}
    </RoutineContext.Provider>
  );
};