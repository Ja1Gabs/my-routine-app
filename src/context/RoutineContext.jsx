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
  
  // Estado da Aplicação
  const [activitiesPool, setActivitiesPool] = useState(DEFAULT_ACTIVITIES);
  const [currentWeek, setCurrentWeek] = useState([]); // Matriz: [{ morning: act, ... }, ...]
  const [history, setHistory] = useState({});         // Chaves: "YYYY-MM-DD_shift"
  const [goals, setGoals] = useState([]);
  
  // Configurações unificadas
  // attempt to load stored configuration immediately to avoid theme flash
  const getInitialConfig = () => {
    const defaultCfg = {
      theme: 'light',
      sundayMode: 'pause',
      lang: 'pt',
      backgroundImage: '',
      routineMode: 'simple',
      activeShifts: ['default'],
    };

    try {
      const stored = JSON.parse(localStorage.getItem('routine_db_v10') || '{}');
      const themeOverride = localStorage.getItem('routine_theme');
      
      // Start with defaults and merge saved config (except theme)
      const cfg = { ...defaultCfg };
      if (stored.config) {
        const { theme, ...otherConfig } = stored.config;
        Object.assign(cfg, otherConfig);
      }
      
      // Apply theme: explicit save > default
      if (themeOverride && (themeOverride === 'light' || themeOverride === 'dark')) {
        cfg.theme = themeOverride;
      } else {
        cfg.theme = 'light';
        localStorage.setItem('routine_theme', 'light');
      }
      
      console.log('🔄 Initial config loaded - Theme:', cfg.theme);
      
      // Apply class to html immediately
      if (typeof window !== 'undefined') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(cfg.theme === 'dark' ? 'dark' : 'light');
      }
      
      return cfg;
    } catch (e) {
      console.warn('❌ Failed reading config from storage:', e);
      
      // Fallback: ensure html gets the default light class
      if (typeof window !== 'undefined') {
        localStorage.setItem('routine_theme', 'light');
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add('light');
      }
      return defaultCfg;
    }
  };

  const [config, setConfig] = useState(getInitialConfig);


  const isFirstLoad = useRef(true);

  // --- TRADUÇÃO & TEMA ---
  const t = (key) => {
    const lang = config.lang || 'pt';
    return TRANSLATIONS[lang][key] || key;
  };

  // Ensure theme class is always correct on html element
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = config.theme === 'dark';
    
    // Remove both classes first
    root.classList.remove('light', 'dark');
    
    // Add the correct one
    root.classList.add(isDark ? 'dark' : 'light');
    
    // Also apply inline to ensure override
    if (isDark) {
      root.style.removeProperty('background-color');
    } else {
      root.style.backgroundColor = 'var(--background)';
    }
    
    console.log('🎨 Theme applied:', isDark ? 'DARK' : 'LIGHT', '- html class:', root.className);
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
          if (data.currentWeek) setCurrentWeek(data.currentWeek);
          if (data.history) setHistory(data.history);
          if (data.goals) setGoals(data.goals);
          if (data.config) {
            // never override the already-loaded theme (which may come from localStorage or user interaction)
            const theme = config.theme;
            setConfig(prev => ({ ...prev, ...data.config, theme }));
          }
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
    if (data.currentWeek) setCurrentWeek(data.currentWeek);
    if (data.history) setHistory(data.history);
    if (data.goals) setGoals(data.goals);
    if (data.config) {
      // Don't let stored config override the theme - it's controlled separately
      const { theme, ...otherConfig } = data.config;
      setConfig(prev => ({ ...prev, ...otherConfig }));
    }
  };

  // --- 2. SALVAR DADOS (AUTO-SYNC COM DEBOUNCE) ---
  // persist changes immediately; also keep theme in its own key so toggling is instant
  useEffect(() => {
    if (isFirstLoad.current) return;

    const existing = JSON.parse(localStorage.getItem('routine_db_v10') || '{}');
    const dataToSave = { activities: activitiesPool, currentWeek, history, goals, config };
    localStorage.setItem('routine_db_v10', JSON.stringify({ ...existing, ...dataToSave }));

    // also stash theme separately to avoid latency on initial load
    localStorage.setItem('routine_theme', config.theme);

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

  // --- COMPLETED DAYS MAPPER (Correção para Calendário e Histórico) ---
  // Transforma os turnos do history matricial em um mapa { "2026-03-09": true }
  const completedDays = useMemo(() => {
    const shiftsToCheck = config.routineMode === 'shifts' && config.activeShifts?.length > 0 ? config.activeShifts : ['default'];
    const datesObj = {};
    const uniqueDates = [...new Set(Object.keys(history).map(k => k.split('_')[0]))];
    
    uniqueDates.forEach(dateStr => {
      // O dia só está "completado" no calendário se TODOS os turnos daquele dia estiverem marcados
      datesObj[dateStr] = shiftsToCheck.every(s => history[`${dateStr}_${s}`]?.completed);
    });
    return datesObj;
  }, [history, config.routineMode, config.activeShifts]);


  // --- STATS ENGINE (Baseado no completedDays para evitar crashs) ---
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

    return {
      dailyStreak: daily,
      weeklyStreak: weekly,
      totalCompleted: Object.values(history).filter(h => h.completed).length // Conta turnos/atividades individuais
    };
  }, [completedDays, history]);

  // --- APP ACTIONS ---
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

  // SHUFFLE MATRICIAL
  const shuffleWeek = (poolOverride = null) => {
    const pool = (Array.isArray(poolOverride) && poolOverride.length > 0) ? poolOverride : [...activitiesPool];
    const targetShifts = config.routineMode === 'shifts' ? (config.activeShifts?.length > 0 ? config.activeShifts :['morning']) : ['default'];

    // Se a pool estiver vazia, cria matriz vazia
    if (!pool || pool.length === 0) {
      const emptyWeek = Array.from({length: 7}, () => {
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

    // Domingo
    if (config.sundayMode === 'pause') {
      targetShifts.forEach(s => weekPlan[6][s] = FIXED_SUNDAY);
    } else if (config.sundayMode !== 'random') {
      const fixedAct = pool.find(a => a.id === config.sundayMode);
      if (fixedAct) targetShifts.forEach(s => weekPlan[6][s] = { ...fixedAct, assignedTask: '', fixed: true });
    }

    // Deck & Distribuição
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

    // Preenchimento de Gaps
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

  const addGoal = (goal) => setGoals(prev => [...prev, { ...goal, id: crypto.randomUUID(), current: 0 }]);

  return (
    <RoutineContext.Provider value={{
      user, config, t,
      currentWeek, activitiesPool, history, goals,
      completedDays, // <-- Exportado com segurança para o UI/Calendar não quebrar
      stats,
      actions: {
        login, register, logout,
        saveActivity, deleteActivity, shuffleWeek, 
        toggleComplete, updateDayData, 
        addGoal, setConfig
      }
    }}>
      {children}
    </RoutineContext.Provider>
  );
};