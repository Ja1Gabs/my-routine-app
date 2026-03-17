import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { TRANSLATIONS } from '../constants/translations';

const RoutineContext = createContext();
export const useRoutine = () => useContext(RoutineContext);

// ⚠️ URL DO BACKEND (Usando variável de ambiente do Vite com Fallback) ⚠️
const API_URL = import.meta.env.VITE_API_URL || "https://my-routine-app-jxx7.onrender.com";

const DEFAULT_ACTIVITIES =[];
const FIXED_SUNDAY = { id: 'pausa', name: 'Pausa', iconName: 'Moon', theme: 'slate', fixed: true };

export const RoutineProvider = ({ children }) => {
  // --- ESTADOS DE AUTENTICAÇÃO ---
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  
  // --- ESTADOS DA APLICAÇÃO ---
  const[activitiesPool, setActivitiesPool] = useState(DEFAULT_ACTIVITIES);
  const [currentWeek, setCurrentWeek] = useState(() => Array.from({ length: 7 }, () => ({}))); 
  const[history, setHistory] = useState({}); 
  const [goals, setGoals] = useState([]);
  const[canvasNodes, setCanvasNodes] = useState([]); // Nodes do Quadro Livre
  
  // --- ESTADOS DE INTERFACE E CONTROLE ---
  const [isServerWaking, setIsServerWaking] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false); // Estado da Animação do Shuffle

  // --- CONFIGURAÇÃO COM LAZY LOAD (Previne piscar o tema no 1º load) ---
  const [config, setConfig] = useState(() => {
    try {
      const data = JSON.parse(localStorage.getItem('routine_db_v11') || '{}'); 
      if (data.config) return data.config;
    } catch (e) {}
    
    return { 
      theme: 'dark', 
      sundayMode: 'pause', 
      lang: 'pt', 
      backgroundImage: '', 
      routineMode: 'simple', 
      activeShifts: ['default'],
      autoShuffle: true,   // Embaralha automaticamente na segunda-feira
      maxShuffles: 3,      // Limite por semana (0 = ilimitado)
      shufflesUsed: 0,     // Conta quantas vezes o usuário sorteou
      lastWeekStart: ''    // Registra quando foi o último reset
    };
  });

  const isFirstLoad = useRef(true);
  const t = (key) => TRANSLATIONS[config.lang || 'pt'][key] || key;

  // --- EFEITO: APLICAÇÃO DO TEMA NO HTML ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (config.theme === 'dark') root.classList.add('dark');
  }, [config.theme]);

  // --- 📡 1. LÓGICA DE CONEXÃO COM O BACKEND & VIRADA DE SEMANA ---
  useEffect(() => {
    const initApp = async () => {
      const savedUser = JSON.parse(localStorage.getItem('routine_user'));
      
      // PREPARA A LÓGICA DE VIRADA DE SEMANA LOCALMENTE PRIMEIRO
      const dataLocal = JSON.parse(localStorage.getItem('routine_db_v11') || '{}');
      let currentConfig = dataLocal.config || config;
      
      const todayStartOfWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      let didWeekChange = false;

      // Detecta se a semana virou
      if (currentConfig.lastWeekStart !== todayStartOfWeek) {
        currentConfig = { 
          ...currentConfig, 
          shufflesUsed: 0, 
          lastWeekStart: todayStartOfWeek 
        };
        setConfig(currentConfig);
        didWeekChange = true;
      }

      // --- SINCRONIZAÇÃO COM O SERVIDOR ---
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
            if (Object.keys(data).length > 0) {
              if (data.activities) setActivitiesPool(data.activities);
              if (data.currentWeek && Array.isArray(data.currentWeek) && !didWeekChange) {
                // Se a semana virou, o autoShuffle vai sobrescrever o array vazio logo em seguida.
                setCurrentWeek(data.currentWeek);
              }
              if (data.history) setHistory(data.history);
              if (data.goals) setGoals(data.goals);
              if (data.canvasNodes) setCanvasNodes(data.canvasNodes);
              
              // Mescla config local alterada pela virada da semana com a config do server
              setConfig(prev => ({ ...prev, ...(data.config || {}) }));
            }
          }
        } catch (error) {
          clearTimeout(wakeTimer);
          setIsServerWaking(false);
          console.warn("Modo Offline ativado ou erro no servidor:", error);
          loadLocalBackup(dataLocal, didWeekChange);
        }
      } else {
        loadLocalBackup(dataLocal, didWeekChange);
      }

      // Executa o Auto Shuffle se a semana tiver virado e o autoShuffle estiver ligado
      if (didWeekChange && currentConfig.autoShuffle) {
         setTimeout(() => {
           executeShuffle(dataLocal.activities ||[], currentConfig);
         }, 800); // Pausa dramática na abertura do site para o shuffle automático
      }

      isFirstLoad.current = false;
    };

    initApp();
  }, [token]); // Executa no mount e quando o token mudar

  const loadLocalBackup = (dataLocal, didWeekChange) => {
    if (dataLocal.activities) setActivitiesPool(dataLocal.activities);
    if (dataLocal.currentWeek && !didWeekChange) setCurrentWeek(dataLocal.currentWeek);
    if (dataLocal.history) setHistory(dataLocal.history);
    if (dataLocal.goals) setGoals(dataLocal.goals);
    if (dataLocal.canvasNodes) setCanvasNodes(dataLocal.canvasNodes);
  };

  // --- 💾 2. AUTO-SYNC (Salva Local e Manda pro Backend Silenciosamente) ---
  useEffect(() => {
    if (isFirstLoad.current) return;
    
    const db = { activities: activitiesPool, currentWeek, history, goals, config, canvasNodes };
    localStorage.setItem('routine_db_v11', JSON.stringify(db));

    if (token) {
      const timer = setTimeout(() => {
        fetch(`${API_URL}/data`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(db)
        }).catch(err => console.warn("Erro no sync silencioso com a nuvem:", err));
      }, 3000); 
      return () => clearTimeout(timer);
    }
  },[activitiesPool, currentWeek, history, goals, config, canvasNodes, token]);

  // --- 🔐 AUTH ACTIONS ---
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
      localStorage.setItem('routine_user', JSON.stringify(data.user));
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
    localStorage.removeItem('routine_user'); 
    localStorage.removeItem('auth_token'); 
    window.location.reload(); 
  };

  // --- 📊 SISTEMA DE ESTATÍSTICAS E MAPA DE DIAS ---
  const completedDays = useMemo(() => {
    if (!history) return {};
    const shiftsToCheck = config.routineMode === 'shifts' && config.activeShifts?.length > 0 ? config.activeShifts : ['default'];
    const datesObj = {};
    const uniqueDates =[...new Set(Object.keys(history).map(k => k.split('_')[0]))]; 
    
    uniqueDates.forEach(dateStr => {
      datesObj[dateStr] = shiftsToCheck.every(s => history[`${dateStr}_${s}`]?.completed);
    });
    
    return datesObj;
  },[history, config.routineMode, config.activeShifts]);

  const stats = useMemo(() => {
    let daily = 0;
    let dDate = new Date();
    const todayStr = format(dDate, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(dDate, 1), 'yyyy-MM-dd');

    if (completedDays[todayStr]) { 
      daily++; 
      dDate = subDays(dDate, 1); 
    } else if (completedDays[yesterdayStr]) { 
      dDate = subDays(dDate, 1); 
    }

    while (true) { 
      if (completedDays[format(dDate, 'yyyy-MM-dd')]) { 
        daily++; 
        dDate = subDays(dDate, 1); 
      } else {
        break; 
      }
    }

    const total = Object.values(history).filter(h => h.completed).length;
    
    return { daily, weekly: 0, total };
  }, [completedDays, history]);

  // --- 🎯 APP ACTIONS BÁSICAS ---
  const saveActivity = (act) => {
    if (act.id) setActivitiesPool(prev => prev.map(a => a.id === act.id ? act : a));
    else setActivitiesPool(prev => [...prev, { ...act, id: crypto.randomUUID() }]);
  };
  
  const deleteActivity = (id) => {
    setActivitiesPool(prev => prev.filter(a => a.id !== id));
  };
  
  const addGoal = (goal) => {
    setGoals(prev => [...prev, { ...goal, id: crypto.randomUUID(), current: 0 }]);
  };
  
  const incrementGoal = (id) => {
    setGoals(prev => prev.map(g => (g.id === id && g.type === 'manual') ? { ...g, current: Math.min(g.current + 1, g.target) } : g));
  };
  
  const deleteGoal = (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const updateDayData = (dateStr, shiftKey, newData) => { 
    const key = `${dateStr}_${shiftKey}`; 
    setHistory(prev => ({ ...prev, [key]: { ...prev[key], ...newData, lastUpdated: new Date().toISOString() } })); 
  };
  
  const toggleComplete = (dateStr, shiftKey) => { 
    const key = `${dateStr}_${shiftKey}`; 
    setHistory(prev => ({ ...prev, [key]: { ...prev[key], completed: !prev[key]?.completed, lastUpdated: new Date().toISOString() } })); 
  };

  // --- 🎨 ACTIONS: QUADRO LIVRE (CANVAS) ---
  const addCanvasNode = (activity) => {
    const newNode = {
      id: crypto.randomUUID(),
      activityId: activity.id,
      x: Math.random() * 200 + 50, 
      y: Math.random() * 200 + 50,
      tasks: activity.defaultTasks?.map(t => ({ id: crypto.randomUUID(), text: t, completed: false })) ||[],
      notes: ''
    };
    setCanvasNodes(prev => [...prev, newNode]);
  };

  const updateCanvasNodePos = (id, newX, newY) => {
    setCanvasNodes(prev => prev.map(node => node.id === id ? { ...node, x: newX, y: newY } : node));
  };

  const updateCanvasNodeData = (id, newData) => {
    setCanvasNodes(prev => prev.map(node => node.id === id ? { ...node, ...newData } : node));
  };

  const deleteCanvasNode = (id) => {
    setCanvasNodes(prev => prev.filter(node => node.id !== id));
  };

  // --- 🎲 ANIMAÇÃO E TRIGGER DO SHUFFLE ---
  const triggerShuffle = async () => {
    // Bloqueia se o limite for atingido e maxShuffles não for infinito (0)
    if (config.maxShuffles > 0 && config.shufflesUsed >= config.maxShuffles) {
      alert("Você atingiu o limite de embaralhos para esta semana!"); // Opcional, pode usar um toast da UI depois
      return; 
    }

    setIsShuffling(true); // Inicia a animação UI de saída dos cards
    setCurrentWeek([]); // Limpa a grade de vez

    // Tempo dramático para a UI desaparecer (400ms)
    await new Promise(resolve => setTimeout(resolve, 400));

    // Executa o algoritmo central pesado
    executeShuffle(activitiesPool, config);
    
    // Contabiliza o uso
    setConfig(prev => ({ ...prev, shufflesUsed: (prev.shufflesUsed || 0) + 1 }));
    
    // Cards voltam voando graças à AnimatePresence no WeekView
    setIsShuffling(false); 
  };

  // --- O ALGORITMO CENTRAL DO SHUFFLE (ISOLADO PARA O AUTO-SHUFFLE) ---
  const executeShuffle = (poolSource, currentConfig) => {
    const pool = poolSource.length > 0 ? poolSource :[...activitiesPool];
    const targetShifts = currentConfig.routineMode === 'shifts' 
      ? (currentConfig.activeShifts?.length > 0 ? currentConfig.activeShifts : ['morning']) 
      :['default'];
    
    if (!pool || pool.length === 0) {
      setCurrentWeek(Array.from({ length: 7 }, () => { 
        let obj = {}; 
        targetShifts.forEach(s => obj[s] = null); 
        return obj; 
      }));
      return;
    }

    let weekPlan = Array.from({ length: 7 }, () => { 
      let obj = {}; 
      targetShifts.forEach(s => obj[s] = null); 
      return obj; 
    });

    if (currentConfig.sundayMode === 'pause') { 
      targetShifts.forEach(s => weekPlan[6][s] = FIXED_SUNDAY); 
    } else if (currentConfig.sundayMode !== 'random') { 
      const fixedAct = pool.find(a => a.id === currentConfig.sundayMode); 
      if (fixedAct) targetShifts.forEach(s => weekPlan[6][s] = { ...fixedAct, assignedTask: '', fixed: true }); 
    }

    let deck =[]; 
    pool.forEach(act => { 
      const freq = act.rules?.frequency || 1; 
      for(let i = 0; i < freq; i++) deck.push({ ...act }); 
    });
    deck = deck.sort(() => Math.random() - 0.5);

    for (let card of deck) {
      const allowedDays = card.rules?.allowedDays ||[0, 1, 2, 3, 4, 5, 6]; 
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
          const candidates = pool.filter(a => (!a.rules?.allowedDays || a.rules.allowedDays.includes(i)) && (!a.rules?.allowedShifts || a.rules.allowedShifts.includes(s)));
          const fillPool = candidates.length > 0 ? candidates : pool; 
          const filler = fillPool[Math.floor(Math.random() * fillPool.length)];
          
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

  return (
    <RoutineContext.Provider value={{
      user, 
      config, 
      t,
      isServerWaking,
      isShuffling, // Exportado para as animações no UI
      currentWeek, 
      activitiesPool, 
      history, 
      goals,
      canvasNodes, 
      completedDays, 
      stats,
      actions: {
        login, 
        register, 
        logout, 
        saveActivity, 
        deleteActivity, 
        triggerShuffle,       // A UI vai chamar esse trigger com animação!
        toggleComplete, 
        updateDayData, 
        addGoal, 
        incrementGoal, 
        deleteGoal,
        addCanvasNode,        
        updateCanvasNodePos,  
        updateCanvasNodeData, 
        deleteCanvasNode,     
        setConfig
      }
    }}>
      {children}
    </RoutineContext.Provider>
  );
};