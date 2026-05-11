import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { format, subDays, startOfWeek, addDays, isBefore, isSameDay, startOfToday, parseISO } from 'date-fns';
import { TRANSLATIONS } from '../constants/translations';
import {
  buildEmptyWeek,
  buildHistoryKey,
  getHistoryEntry,
  listHistoryEntriesForDate,
  normalizeWeekData,
} from '../lib/routine';

const RoutineContext = createContext();
export const useRoutine = () => useContext(RoutineContext);

const API_URL = import.meta.env.VITE_API_URL || 'https://my-routine-app-jxx7.onrender.com';
const FIXED_SUNDAY = { id: 'pausa', name: 'Pausa', iconName: 'Moon', theme: 'slate', fixed: true };
const DB_KEY = 'routine_db_v12';
const LEGACY_DB_KEY = 'routine_db_v11';

const getConfiguredShifts = (config) =>
  config?.routineMode === 'shifts'
    ? config?.activeShifts?.length > 0
      ? config.activeShifts
      : ['morning']
    : ['default'];

const getLocalDB = () => {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) || JSON.parse(localStorage.getItem(LEGACY_DB_KEY)) || {};
  } catch (e) {
    return {};
  }
};

const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem('routine_user')) || null;
  } catch (e) {
    return null;
  }
};

const normalizeConfig = (savedConfig = {}) => ({
  theme: 'dark',
  sundayMode: 'pause',
  lang: 'pt',
  routineMode: 'simple',
  activeShifts: ['default'],
  autoShuffle: true,
  maxShuffles: 3,
  shufflesUsed: 0,
  lastWeekStart: '',
  backgroundImage: '',
  maxActivitiesPerSlot: 2,
  ...savedConfig,
});

export const RoutineProvider = ({ children }) => {
  const db = getLocalDB();
  const initialConfig = normalizeConfig(db.config);
  const initialShifts = getConfiguredShifts(initialConfig);

  const [user, setUser] = useState(getLocalUser);
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || null);
  const [activitiesPool, setActivitiesPool] = useState(() => db.activities || []);
  const [currentWeek, setCurrentWeek] = useState(() => normalizeWeekData(db.currentWeek, initialShifts));
  const [history, setHistory] = useState(() => db.history || {});
  const [goals, setGoals] = useState(() => db.goals || []);
  const [canvasNodes, setCanvasNodes] = useState(() => db.canvasNodes || []);
  const [cycleCards, setCycleCards] = useState(() => db.cycleCards || []);
  const [isServerWaking, setIsServerWaking] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [config, setConfig] = useState(initialConfig);

  const t = (key) => TRANSLATIONS[config.lang || 'pt'][key] || key;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(config.theme === 'light' ? 'light' : 'dark');
  }, [config.theme]);

  useEffect(() => {
    setCurrentWeek((prev) => normalizeWeekData(prev, getConfiguredShifts(config)));
  }, [config.routineMode, config.activeShifts]);

  useEffect(() => {
    if (!user || !token) return;

    const syncWithServer = async () => {
      const wakeTimer = setTimeout(() => setIsServerWaking(true), 2500);
      try {
        const res = await fetch(`${API_URL}/data`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        clearTimeout(wakeTimer);
        setIsServerWaking(false);

        if (res.ok) {
          const data = await res.json();
          const nextConfig = normalizeConfig(data.config || config);
          const nextShifts = getConfiguredShifts(nextConfig);
          if (data.activities) setActivitiesPool(data.activities);
          if (data.currentWeek) setCurrentWeek(normalizeWeekData(data.currentWeek, nextShifts));
          if (data.history) setHistory(data.history);
          if (data.goals) setGoals(data.goals);
          if (data.canvasNodes) setCanvasNodes(data.canvasNodes);
          if (data.cycleCards) setCycleCards(data.cycleCards);
          if (data.config) setConfig(nextConfig);
        }
      } catch (error) {
        clearTimeout(wakeTimer);
        setIsServerWaking(false);
      }
    };

    syncWithServer();
  }, [token, user]);

  useEffect(() => {
    if (!user) return;

    const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    if (!config.lastWeekStart) {
      setConfig((prev) => ({ ...prev, lastWeekStart: currentWeekStart }));
    } else if (config.lastWeekStart !== currentWeekStart) {
      setConfig((prev) => ({ ...prev, shufflesUsed: 0, lastWeekStart: currentWeekStart }));
      if (config.autoShuffle) {
        setTimeout(() => executeShuffle(activitiesPool, config), 500);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      const nextDb = { activities: activitiesPool, currentWeek, history, goals, config, canvasNodes, cycleCards };
      localStorage.setItem(DB_KEY, JSON.stringify(nextDb));
    }

    if (token) {
      const timer = setTimeout(() => {
        const nextDb = { activities: activitiesPool, currentWeek, history, goals, config, canvasNodes, cycleCards };
        fetch(`${API_URL}/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(nextDb),
        }).catch(() => {});
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activitiesPool, currentWeek, history, goals, config, canvasNodes, cycleCards, user, token]);

  const updateDayData = (dateStr, shiftKey, activityId, newData, activitySnapshot) => {
    const key = buildHistoryKey(dateStr, shiftKey, activityId);
    const previous = getHistoryEntry(history, dateStr, shiftKey, activityId);
    setHistory((prev) => ({
      ...prev,
      [key]: {
        ...previous,
        ...newData,
        ...(activitySnapshot ? { activity: activitySnapshot } : {}),
        lastUpdated: new Date().toISOString(),
      },
    }));
  };

  const toggleComplete = (dateStr, shiftKey, activityId, activitySnapshot) => {
    const key = buildHistoryKey(dateStr, shiftKey, activityId);
    const previous = getHistoryEntry(history, dateStr, shiftKey, activityId);
    setHistory((prev) => ({
      ...prev,
      [key]: {
        ...previous,
        completed: !previous?.completed,
        ...(activitySnapshot ? { activity: activitySnapshot } : {}),
        lastUpdated: new Date().toISOString(),
      },
    }));
  };

  const executeShuffle = (poolOverride = null, configOverride = null) => {
    const activeConfig = normalizeConfig(configOverride || config);
    const pool = (poolOverride && poolOverride.length > 0) ? poolOverride : [...activitiesPool];
    const targetShifts = getConfiguredShifts(activeConfig);
    const slotLimit = Math.max(1, Number(activeConfig.maxActivitiesPerSlot) || 1);

    if (!pool || pool.length === 0) {
      setCurrentWeek(buildEmptyWeek(targetShifts));
      return;
    }

    const today = new Date();
    const todayDateOnly = startOfToday();
    const currentHour = today.getHours();
    const startOfCurrentWeek = startOfWeek(todayDateOnly, { weekStartsOn: 1 });

    const weekPlan = Array.from({ length: 7 }, (_, i) => {
      const dayDate = addDays(startOfCurrentWeek, i);
      const isPastDay = isBefore(dayDate, todayDateOnly);
      const isTodayDate = isSameDay(dayDate, todayDateOnly);
      const dayObj = {};

      targetShifts.forEach((shift) => {
        let isPastShift = isPastDay;
        if (isTodayDate && activeConfig.routineMode === 'shifts') {
          if (shift === 'morning' && currentHour >= 12) isPastShift = true;
          if (shift === 'afternoon' && currentHour >= 18) isPastShift = true;
        }

        dayObj[shift] = isPastShift
          ? (currentWeek?.[i]?.[shift] || []).slice()
          : [];
      });

      return dayObj;
    });

    const pushActivity = (dayIndex, shiftKey, activity) => {
      if (dayIndex < 0 || dayIndex > 6 || !targetShifts.includes(shiftKey)) return false;
      const slot = weekPlan[dayIndex][shiftKey];
      if (!Array.isArray(slot) || slot.length >= slotLimit) return false;
      if (slot.some((item) => item.id === activity.id && item.assignedTask === activity.assignedTask)) return false;
      slot.push(activity);
      return true;
    };

    if (activeConfig.sundayMode === 'pause') {
      targetShifts.forEach((shift) => {
        if ((weekPlan[6][shift] || []).length === 0) pushActivity(6, shift, FIXED_SUNDAY);
      });
    } else if (activeConfig.sundayMode !== 'random') {
      const fixedAct = pool.find((activity) => activity.id === activeConfig.sundayMode);
      if (fixedAct) {
        targetShifts.forEach((shift) => {
          if ((weekPlan[6][shift] || []).length === 0) {
            pushActivity(6, shift, { ...fixedAct, assignedTask: '', fixed: true });
          }
        });
      }
    }

    pool.forEach((activity) => {
      const pinnedDays = activity.rules?.pinnedDays || [];
      const allowedShifts = activity.rules?.allowedShifts?.length ? activity.rules.allowedShifts : targetShifts;
      if (pinnedDays.length === 0) return;

      pinnedDays.forEach((dayIndex) => {
        allowedShifts.forEach((shiftKey) => {
          const task = activity.defaultTasks?.length
            ? activity.defaultTasks[Math.floor(Math.random() * activity.defaultTasks.length)]
            : '';
          pushActivity(dayIndex, shiftKey, { ...activity, assignedTask: task, fixed: true });
        });
      });
    });

    let deck = [];
    pool.forEach((activity) => {
      const chance = Number(activity.rules?.appearanceChance ?? 1);
      if (Math.random() > Math.min(1, Math.max(0, chance))) return;

      const frequency = Math.max(0, Math.floor(Number(activity.rules?.frequency ?? 1)));
      for (let i = 0; i < frequency; i += 1) {
        deck.push({ ...activity });
      }
    });
    deck = deck.sort(() => Math.random() - 0.5);

    deck.forEach((card) => {
      const allowedDays = card.rules?.allowedDays?.length ? [...card.rules.allowedDays] : [0, 1, 2, 3, 4, 5, 6];
      const allowedShifts = card.rules?.allowedShifts?.length ? [...card.rules.allowedShifts] : [...targetShifts];
      let placed = false;

      allowedDays.sort(() => Math.random() - 0.5).forEach((dayIndex) => {
        if (placed || dayIndex > 6) return;
        allowedShifts.sort(() => Math.random() - 0.5).forEach((shiftKey) => {
          if (placed) return;
          const task = card.defaultTasks?.length
            ? card.defaultTasks[Math.floor(Math.random() * card.defaultTasks.length)]
            : '';
          placed = pushActivity(dayIndex, shiftKey, { ...card, assignedTask: task });
        });
      });
    });

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      for (const shiftKey of targetShifts) {
        while ((weekPlan[dayIndex][shiftKey] || []).length < slotLimit) {
          const candidates = pool.filter((activity) => {
            const allowedDays = activity.rules?.allowedDays?.length ? activity.rules.allowedDays : [0, 1, 2, 3, 4, 5, 6];
            const allowedShifts = activity.rules?.allowedShifts?.length ? activity.rules.allowedShifts : targetShifts;
            const chance = Number(activity.rules?.appearanceChance ?? 1);
            return allowedDays.includes(dayIndex) && allowedShifts.includes(shiftKey) && chance > 0;
          });
          const filler = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : pool[0];
          if (!filler) break;

          const task = filler.defaultTasks?.length
            ? filler.defaultTasks[Math.floor(Math.random() * filler.defaultTasks.length)]
            : '';
          if (!pushActivity(dayIndex, shiftKey, { ...filler, assignedTask: task })) break;
        }
      }
    }

    setCurrentWeek(weekPlan);
  };

  const triggerShuffle = async () => {
    if (config.maxShuffles > 0 && config.shufflesUsed >= config.maxShuffles) {
      alert('Limite de sorteios semanais atingido!');
      return;
    }
    setIsShuffling(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    executeShuffle();
    setConfig((prev) => ({ ...prev, shufflesUsed: (prev.shufflesUsed || 0) + 1 }));
    setIsShuffling(false);
  };

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('routine_user', JSON.stringify(data.user));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return login(email, password);
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const completedDays = useMemo(() => {
    const datesObj = {};
    const uniqueDates = [...new Set(Object.keys(history).map((key) => key.split('_')[0]))];
    uniqueDates.forEach((dateStr) => {
      const dayEntries = listHistoryEntriesForDate(history, dateStr);
      datesObj[dateStr] = dayEntries.length > 0 && dayEntries.every((entry) => entry.value?.completed);
    });
    return datesObj;
  }, [history]);

  const stats = useMemo(() => {
    let daily = 0;
    let dateCursor = new Date();
    while (completedDays[format(dateCursor, 'yyyy-MM-dd')]) {
      daily += 1;
      dateCursor = subDays(dateCursor, 1);
    }

    const weekStarts = {};
    Object.keys(completedDays).forEach((dateStr) => {
      if (!completedDays[dateStr]) return;
      const weekStart = format(startOfWeek(parseISO(dateStr), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      weekStarts[weekStart] = weekStarts[weekStart] || [];
      weekStarts[weekStart].push(dateStr);
    });

    const weekly = Object.values(weekStarts).filter((dates) => dates.length === 7).length;

    return {
      daily,
      weekly,
      total: Object.values(history).filter((entry) => entry.completed).length,
    };
  }, [completedDays, history]);

  const resolvedGoals = useMemo(() => {
    return goals.map((goal) => {
      if (goal.type === 'manual') return goal;
      if (goal.type === 'streak') return { ...goal, current: stats.daily };
      if (goal.type === 'total_activities') return { ...goal, current: stats.total };
      if (goal.type === 'perfect_weeks') return { ...goal, current: stats.weekly };
      return goal;
    });
  }, [goals, stats]);

  return (
    <RoutineContext.Provider
      value={{
        user,
        config,
        t,
        isServerWaking,
        isShuffling,
        currentWeek,
        activitiesPool,
        history,
        goals: resolvedGoals,
        canvasNodes,
        cycleCards,
        completedDays,
        stats,
        actions: {
          login,
          register,
          logout: () => {
            localStorage.clear();
            window.location.reload();
          },
          saveActivity: (activity) =>
            activity.id
              ? setActivitiesPool((prev) => prev.map((item) => (item.id === activity.id ? activity : item)))
              : setActivitiesPool((prev) => [...prev, { ...activity, id: crypto.randomUUID() }]),
          deleteActivity: (id) => setActivitiesPool((prev) => prev.filter((activity) => activity.id !== id)),
          triggerShuffle,
          toggleComplete,
          updateDayData,
          addCanvasNode: (activity) =>
            setCanvasNodes((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                type: 'activity',
                activityId: activity.id,
                x: Math.random() * 100 + 50,
                y: Math.random() * 100 + 50,
                tasks: activity.defaultTasks?.map((task) => ({
                  id: crypto.randomUUID(),
                  text: task,
                  completed: false,
                })) || [],
              },
            ]),
          addStickyNode: () =>
            setCanvasNodes((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                type: 'sticky',
                text: '',
                x: Math.random() * 100 + 50,
                y: Math.random() * 100 + 50,
                color: ['bg-yellow-200/90 text-yellow-900', 'bg-blue-200/90 text-blue-900', 'bg-pink-200/90 text-pink-900', 'bg-emerald-200/90 text-emerald-900'][Math.floor(Math.random() * 4)],
              },
            ]),
          addImageNode: () =>
            setCanvasNodes((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                type: 'image',
                url: '',
                x: Math.random() * 100 + 50,
                y: Math.random() * 100 + 50,
              },
            ]),
          updateCanvasNodePos: (id, x, y) => setCanvasNodes((prev) => prev.map((node) => (node.id === id ? { ...node, x, y } : node))),
          updateCanvasNodeData: (id, data) => setCanvasNodes((prev) => prev.map((node) => (node.id === id ? { ...node, ...data } : node))),
          deleteCanvasNode: (id) => setCanvasNodes((prev) => prev.filter((node) => node.id !== id)),
          setConfig,
          addGoal: (goal) => setGoals((prev) => [...prev, { ...goal, id: crypto.randomUUID(), current: 0 }]),
          incrementGoal: (id) =>
            setGoals((prev) =>
              prev.map((goal) => (goal.id === id && goal.type === 'manual' ? { ...goal, current: Math.min(goal.current + 1, goal.target) } : goal)),
            ),
          deleteGoal: (id) => setGoals((prev) => prev.filter((goal) => goal.id !== id)),
          addCycleCard: (card) =>
            setCycleCards((prev) => [...prev, { id: crypto.randomUUID(), status: 'todo', notes: '', activityId: '', ...card }]),
          updateCycleCard: (id, data) => setCycleCards((prev) => prev.map((card) => (card.id === id ? { ...card, ...data } : card))),
          deleteCycleCard: (id) => setCycleCards((prev) => prev.filter((card) => card.id !== id)),
        },
      }}
    >
      {children}
    </RoutineContext.Provider>
  );
};
