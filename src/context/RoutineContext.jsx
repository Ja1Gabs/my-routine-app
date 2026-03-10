import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { TRANSLATIONS } from '../constants/translations';

const RoutineContext = createContext();
export const useRoutine = () => useContext(RoutineContext);

const DEFAULT_ACTIVITIES =[];
const FIXED_SUNDAY = { id: 'pausa', name: 'Pausa', iconName: 'Moon', theme: 'slate', fixed: true };

export const RoutineProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activitiesPool, setActivitiesPool] = useState(DEFAULT_ACTIVITIES);
  const [currentWeek, setCurrentWeek] = useState(() => Array.from({ length: 7 }, () => ({}))); 
  const [history, setHistory] = useState({}); 
  const [goals, setGoals] = useState([]);
  
  // --- CONFIGURAÇÃO COM LAZY LOAD (Para não piscar o tema) ---
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
  const t = (key) => TRANSLATIONS[config.lang || 'pt'][key] || key;

  // --- EFEITO DO TEMA ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (config.theme === 'dark') root.classList.add('dark');
  }, [config.theme]);

  // --- LOAD ---
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('routine_user') || 'null');
    if (savedUser) setUser(savedUser);

    const data = JSON.parse(localStorage.getItem('routine_db_v10') || '{}');
    if (data.activities) setActivitiesPool(data.activities);
    if (data.currentWeek && Array.isArray(data.currentWeek)) setCurrentWeek(data.currentWeek);
    if (data.history) setHistory(data.history);
    if (data.goals) setGoals(data.goals);
    
    isFirstLoad.current = false;
  },[]);

  // --- SAVE ---
  useEffect(() => {
    if (isFirstLoad.current) return;
    const db = { activities: activitiesPool, currentWeek, history, goals, config };
    localStorage.setItem('routine_db_v10', JSON.stringify(db));
  },[activitiesPool, currentWeek, history, goals, config]);

  // --- ACTIONS BÁSICAS ---
  const login = (email, name) => {
    const newUser = { name, email, avatar: `https://ui-avatars.com/api/?name=${name}&background=random` };
    setUser(newUser);
    localStorage.setItem('routine_user', JSON.stringify(newUser));
  };
  const logout = () => { setUser(null); localStorage.removeItem('routine_user'); window.location.reload(); };

  const saveActivity = (act) => {
    if (act.id) setActivitiesPool(prev => prev.map(a => a.id === act.id ? act : a));
    else setActivitiesPool(prev =>[...prev, { ...act, id: crypto.randomUUID() }]);
  };
  const deleteActivity = (id) => setActivitiesPool(prev => prev.filter(a => a.id !== id));
  const addGoal = (goal) => setGoals(prev =>[...prev, { ...goal, id: crypto.randomUUID(), current: 0 }]);

  // --- SHUFFLE MATRICIAL (TURNOS) ---
  const shuffleWeek = (poolOverride = null) => {
    const pool = (Array.isArray(poolOverride) && poolOverride.length > 0) ? poolOverride : [...activitiesPool];
    const targetShifts = config.routineMode === 'shifts' ? (config.activeShifts?.length > 0 ? config.activeShifts :['morning']) : ['default'];

    if (!pool || pool.length === 0) {
        const emptyWeek = Array.from({length: 7}, () => {
           let dayObj = {};
           targetShifts.forEach(s => dayObj[s] = null);
           return dayObj;
        });
        setCurrentWeek(emptyWeek);
        return;
    }

    let weekPlan = Array.from({length: 7}, () => {
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
      for(let i = 0; i < freq; i++) deck.push({ ...act });
    });
    deck = deck.sort(() => Math.random() - 0.5);

    for (let card of deck) {
      const allowedDays = card.rules?.allowedDays ||[0,1,2,3,4,5,6];
      const allowedShifts = card.rules?.allowedShifts || targetShifts; 

      let placed = false;
      for(let dayIndex of allowedDays.sort(()=> Math.random()-0.5)) {
          if (dayIndex > 6) continue;
          for(let shift of allowedShifts.sort(()=> Math.random()-0.5)) {
              if (targetShifts.includes(shift) && weekPlan[dayIndex][shift] === null) {
                  const randomTask = card.defaultTasks?.length > 0 ? card.defaultTasks[Math.floor(Math.random() * card.defaultTasks.length)] : '';
                  weekPlan[dayIndex][shift] = { ...card, assignedTask: randomTask };
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
          const validCandidates = pool.filter(a => 
             (!a.rules?.allowedDays || a.rules.allowedDays.includes(i)) &&
             (!a.rules?.allowedShifts || a.rules.allowedShifts.includes(s))
          );
          const fillerPool = validCandidates.length > 0 ? validCandidates : pool;
          const filler = fillerPool[Math.floor(Math.random() * fillerPool.length)];
          
          if (filler) {
              const randomTask = filler.defaultTasks?.length > 0 ? filler.defaultTasks[Math.floor(Math.random() * filler.defaultTasks.length)] : '';
              weekPlan[i][s] = { ...filler, assignedTask: randomTask };
          } else {
              weekPlan[i][s] = FIXED_SUNDAY;
          }
        }
      }
    }
    setCurrentWeek(weekPlan);
  };

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
      [key]: { ...prev[key], completed: !prev[key]?.completed }
    }));
  };

  // --- O SEGREDO QUE ESTAVA FALTANDO PARA O STATS/HISTÓRICO ---
  const getCompletedDaysObj = () => {
    if (!history) return {};
    const shiftsToCheck = config.routineMode === 'shifts' && config.activeShifts?.length > 0 ? config.activeShifts : ['default'];
    const datesObj = {};
    const uniqueDates =[...new Set(Object.keys(history).map(k => k.split('_')[0]))]; 
    
    uniqueDates.forEach(dateStr => {
      // Retorna true APENAS SE todos os turnos ativos daquele dia foram completados
      datesObj[dateStr] = shiftsToCheck.every(s => history[`${dateStr}_${s}`]?.completed);
    });
    return datesObj;
  };

  // --- STATS ---
  const calculateStreaks = () => {
    const completedDaysObj = getCompletedDaysObj();
    let daily = 0;
    let dDate = new Date();
    const todayStr = format(dDate, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(dDate, 1), 'yyyy-MM-dd');

    if (completedDaysObj[todayStr]) { daily++; dDate = subDays(dDate, 1); } 
    else if (completedDaysObj[yesterdayStr]) { dDate = subDays(dDate, 1); }

    while (true) {
      if (completedDaysObj[format(dDate, 'yyyy-MM-dd')]) { daily++; dDate = subDays(dDate, 1); } 
      else break;
    }

    // Calcula total completado contando os turnos individuais
    const totalCompletedShifts = Object.values(history).filter(h => h.completed).length;

    return { daily, weekly: 0, total: totalCompletedShifts };
  };

  const currentStats = calculateStreaks();

  return (
    <RoutineContext.Provider value={{
      user, config, t,
      currentWeek, activitiesPool, history, goals,
      completedDays: getCompletedDaysObj(), // <--- ISSO RESOLVE O BUG
      stats: currentStats,
      actions: {
        login, logout, saveActivity, deleteActivity, shuffleWeek, 
        toggleComplete, updateDayData, addGoal, setConfig
      }
    }}>
      {children}
    </RoutineContext.Provider>
  );
};
