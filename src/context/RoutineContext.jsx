import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { 
  format, 
  subDays, 
  startOfWeek, 
  addDays, 
  isBefore, 
  isSameDay, 
  startOfToday 
} from 'date-fns';
import { TRANSLATIONS } from '../constants/translations';

const RoutineContext = createContext();
export const useRoutine = () => useContext(RoutineContext);

const API_URL = import.meta.env.VITE_API_URL || "https://my-routine-app-jxx7.onrender.com";
const FIXED_SUNDAY = { id: 'pausa', name: 'Pausa', iconName: 'Moon', theme: 'slate', fixed: true };

export const RoutineProvider = ({ children }) => {
  // --- ESTADOS ---
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [activitiesPool, setActivitiesPool] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(() => Array.from({ length: 7 }, () => ({}))); 
  const [history, setHistory] = useState({}); 
  const [goals, setGoals] = useState([]);
  const [canvasNodes, setCanvasNodes] = useState([]);
  const [isServerWaking, setIsServerWaking] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  const [config, setConfig] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem('routine_db_v11') || '{}'); 
      if (data.config) return data.config;
    } catch (e) {}
    return { 
      theme: 'dark', sundayMode: 'pause', lang: 'pt', routineMode: 'simple', 
      activeShifts: ['default'], autoShuffle: true, maxShuffles: 3, 
      shufflesUsed: 0, lastWeekStart: '' 
    };
  });

  const isFirstLoad = useRef(true);
  const t = (key) => TRANSLATIONS[config.lang || 'pt'][key] || key;

  // --- TEMA ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (config.theme === 'dark') root.classList.add('dark');
  }, [config.theme]);

  // --- INICIALIZAÇÃO E SINCRONIZAÇÃO ---
  useEffect(() => {
    const initApp = async () => {
      const savedUser = JSON.parse(localStorage.getItem('routine_user'));
      const dataLocal = JSON.parse(localStorage.getItem('routine_db_v11') || '{}');
      let currentConfig = dataLocal.config || config;
      
      const todayStartOfWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      let didWeekChange = false;

      if (currentConfig.lastWeekStart !== todayStartOfWeek) {
        currentConfig = { ...currentConfig, shufflesUsed: 0, lastWeekStart: todayStartOfWeek };
        setConfig(currentConfig);
        didWeekChange = true;
      }

      if (savedUser && token) {
        setUser(savedUser);
        const wakeTimer = setTimeout(() => setIsServerWaking(true), 2500);
        try {
          const res = await fetch(`${API_URL}/data`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          clearTimeout(wakeTimer);
          setIsServerWaking(false);
          if (res.ok) {
            const data = await res.json();
            if (data.activities) setActivitiesPool(data.activities);
            if (data.currentWeek && !didWeekChange) setCurrentWeek(data.currentWeek);
            if (data.history) setHistory(data.history);
            if (data.goals) setGoals(data.goals);
            if (data.canvasNodes) setCanvasNodes(data.canvasNodes);
            setConfig(prev => ({ ...prev, ...(data.config || {}) }));
          }
        } catch (error) {
          clearTimeout(wakeTimer);
          setIsServerWaking(false);
          loadLocalBackup(dataLocal, didWeekChange);
        }
      } else {
        loadLocalBackup(dataLocal, didWeekChange);
      }

      if (didWeekChange && currentConfig.autoShuffle) {
        setTimeout(() => executeShuffle(dataLocal.activities || [], currentConfig), 800);
      }
      isFirstLoad.current = false;
    };
    initApp();
  }, [token]);

  const loadLocalBackup = (dataLocal, didWeekChange) => {
    if (dataLocal.activities) setActivitiesPool(dataLocal.activities);
    if (dataLocal.currentWeek && !didWeekChange) setCurrentWeek(dataLocal.currentWeek);
    if (dataLocal.history) setHistory(dataLocal.history);
    if (dataLocal.goals) setGoals(dataLocal.goals);
    if (dataLocal.canvasNodes) setCanvasNodes(dataLocal.canvasNodes);
  };

  useEffect(() => {
    if (isFirstLoad.current) return;
    const db = { activities: activitiesPool, currentWeek, history, goals, config, canvasNodes };
    localStorage.setItem('routine_db_v11', JSON.stringify(db));
    if (token) {
      const timer = setTimeout(() => {
        fetch(`${API_URL}/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(db)
        }).catch(() => {});
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activitiesPool, currentWeek, history, goals, config, canvasNodes, token]);

  // --- ACTIONS DE HISTÓRICO (COM SNAPSHOT/FOTO DA ATIVIDADE) ---
  const updateDayData = (dateStr, shiftKey, newData, activitySnapshot) => {
    const key = `${dateStr}_${shiftKey}`;
    setHistory(prev => ({
      ...prev,
      [key]: { 
        ...prev[key], 
        ...newData, 
        ...(activitySnapshot ? { activity: activitySnapshot } : {}), 
        lastUpdated: new Date().toISOString() 
      }
    }));
  };

  const toggleComplete = (dateStr, shiftKey, activitySnapshot) => {
    const key = `${dateStr}_${shiftKey}`;
    setHistory(prev => ({
      ...prev,
      [key]: { 
        ...prev[key], 
        completed: !prev[key]?.completed,
        ...(activitySnapshot ? { activity: activitySnapshot } : {}),
        lastUpdated: new Date().toISOString()
      }
    }));
  };

  // --- ALGORITMO DE SHUFFLE (CONSOLIDADO COM TIME-LOCK) ---
  const executeShuffle = (poolOverride = null, configOverride = null) => {
    const activeConfig = configOverride || config;
    const pool = (poolOverride && poolOverride.length > 0) ? poolOverride : [...activitiesPool];
    const targetShifts = activeConfig.routineMode === 'shifts' 
      ? (activeConfig.activeShifts?.length > 0 ? activeConfig.activeShifts : ['morning']) 
      : ['default'];

    if (!pool || pool.length === 0) {
      setCurrentWeek(Array.from({ length: 7 }, () => {
        let obj = {};
        targetShifts.forEach(s => obj[s] = null);
        return obj;
      }));
      return;
    }

    const today = new Date();
    const todayDateOnly = startOfToday();
    const currentHour = today.getHours();
    const startOfCurrentWeek = startOfWeek(todayDateOnly, { weekStartsOn: 1 });

    let weekPlan = Array.from({ length: 7 }, (_, i) => {
      let dayObj = {};
      const dayDate = addDays(startOfCurrentWeek, i);
      const isPastDay = isBefore(dayDate, todayDateOnly);
      const isTodayDate = isSameDay(dayDate, todayDateOnly);

      targetShifts.forEach(s => {
        let isPastShift = isPastDay;
        if (isTodayDate && activeConfig.routineMode === 'shifts') {
          if (s === 'morning' && currentHour >= 12) isPastShift = true;
          if (s === 'afternoon' && currentHour >= 18) isPastShift = true;
        }
        if (isPastShift && currentWeek[i] && currentWeek[i][s]) {
          dayObj[s] = currentWeek[i][s];
        } else {
          dayObj[s] = null;
        }
      });
      return dayObj;
    });

    if (activeConfig.sundayMode === 'pause') {
      targetShifts.forEach(s => { if (weekPlan[6][s] === null) weekPlan[6][s] = FIXED_SUNDAY; });
    } else if (activeConfig.sundayMode !== 'random') {
      const fixedAct = pool.find(a => a.id === activeConfig.sundayMode);
      if (fixedAct) targetShifts.forEach(s => { 
        if (weekPlan[6][s] === null) weekPlan[6][s] = { ...fixedAct, assignedTask: '', fixed: true }; 
      });
    }

    let deck = [];
    pool.forEach(act => {
      const freq = act.rules?.frequency || 1;
      for (let i = 0; i < freq; i++) deck.push({ ...act });
    });
    deck = deck.sort(() => Math.random() - 0.5);

    for (let card of deck) {
      const allowedDays = card.rules?.allowedDays || [0, 1, 2, 3, 4, 5, 6];
      const allowedShifts = card.rules?.allowedShifts || targetShifts;
      let placed = false;

      for (let day of allowedDays.sort(() => Math.random() - 0.5)) {
        if (day > 6) continue;
        for (let shift of allowedShifts.sort(() => Math.random() - 0.5)) {
          if (targetShifts.includes(shift) && weekPlan[day][shift] === null) {
            const task = card.defaultTasks?.length > 0 ? card.defaultTasks[Math.floor(Math.random() * card.defaultTasks.length)] : '';
            weekPlan[day][shift] = { ...card, assignedTask: task };
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
          const candidates = pool.filter(a => 
            (!a.rules?.allowedDays || a.rules.allowedDays.includes(i)) && 
            (!a.rules?.allowedShifts || a.rules.allowedShifts.includes(s))
          );
          const filler = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : pool[0];
          if (filler) {
            const task = filler.defaultTasks?.length > 0 ? filler.defaultTasks[Math.floor(Math.random() * filler.defaultTasks.length)] : '';
            weekPlan[i][s] = { ...filler, assignedTask: task };
          } else {
            weekPlan[i][s] = FIXED_SUNDAY;
          }
        }
      }
    }
    setCurrentWeek(weekPlan);
  };

  const triggerShuffle = async () => {
    if (config.maxShuffles > 0 && config.shufflesUsed >= config.maxShuffles) {
      alert("Limite de sorteios semanais atingido!");
      return; 
    }
    setIsShuffling(true);
    await new Promise(r => setTimeout(r, 400));
    executeShuffle();
    setConfig(prev => ({ ...prev, shufflesUsed: (prev.shufflesUsed || 0) + 1 }));
    setIsShuffling(false); 
  };

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
      setToken(data.token); setUser(data.user);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('routine_user', JSON.stringify(data.user));
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
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

  // --- ESTATÍSTICAS ---
  const completedDays = useMemo(() => {
    const shifts = config.routineMode === 'shifts' && config.activeShifts?.length > 0 ? config.activeShifts : ['default'];
    const datesObj = {};
    const uniqueDates = [...new Set(Object.keys(history).map(k => k.split('_')[0]))];
    uniqueDates.forEach(d => datesObj[d] = shifts.every(s => history[`${d}_${s}`]?.completed));
    return datesObj;
  }, [history, config]);

  const stats = useMemo(() => {
    let daily = 0; let d = new Date();
    while (completedDays[format(d, 'yyyy-MM-dd')]) { daily++; d = subDays(d, 1); }
    return { daily, total: Object.values(history).filter(h => h.completed).length };
  }, [completedDays, history]);

  return (
    <RoutineContext.Provider value={{
      user, config, t, isServerWaking, isShuffling, currentWeek, activitiesPool, history, goals, canvasNodes, completedDays, stats,
      actions: {
        login, 
        register, 
        logout: () => { localStorage.clear(); window.location.reload(); }, 
        saveActivity: (act) => act.id ? setActivitiesPool(p => p.map(a => a.id === act.id ? act : a)) : setActivitiesPool(p => [...p, { ...act, id: crypto.randomUUID() }]),
        deleteActivity: (id) => setActivitiesPool(p => p.filter(a => a.id !== id)),
        triggerShuffle,
        toggleComplete, 
        updateDayData, 
        addCanvasNode: (act) => setCanvasNodes(p => [...p, { id: crypto.randomUUID(), activityId: act.id, x: 100, y: 100, tasks: act.defaultTasks?.map(t=>({id: crypto.randomUUID(), text: t, completed: false})) || [] }]),
        updateCanvasNodePos: (id, x, y) => setCanvasNodes(p => p.map(n => n.id === id ? { ...n, x, y } : n)),
        updateCanvasNodeData: (id, data) => setCanvasNodes(p => p.map(n => n.id === id ? { ...n, ...data } : n)),
        deleteCanvasNode: (id) => setCanvasNodes(p => p.filter(n => n.id !== id)),
        setConfig, addGoal: (g) => setGoals(p => [...p, { ...g, id: crypto.randomUUID(), current: 0 }]),
        incrementGoal: (id) => setGoals(p => p.map(g => (g.id === id && g.type === 'manual') ? { ...g, current: Math.min(g.current + 1, g.target) } : g)),
        deleteGoal: (id) => setGoals(p => p.filter(g => g.id !== id))
      }
    }}>
      {children}
    </RoutineContext.Provider>
  );
};