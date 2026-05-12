import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
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
const BACKUP_KEY = 'routine_db_v12_backups';
const USER_KEY = 'routine_user';
const TOKEN_KEY = 'auth_token';

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

const getConfiguredShifts = (config) =>
  config?.routineMode === 'shifts'
    ? config?.activeShifts?.length > 0
      ? config.activeShifts
      : ['morning']
    : ['default'];

const normalizeConfig = (savedConfig = {}) => ({
  theme: 'dark',
  themePreset: 'default',
  sundayMode: 'pause',
  lang: 'pt',
  routineMode: 'simple',
  activeShifts: ['default'],
  autoShuffle: true,
  maxShuffles: 3,
  shufflesUsed: 0,
  lastWeekStart: '',
  lastAutoShuffleWeek: '',
  plannedWeekStart: '',
  backgroundImage: '',
  maxActivitiesPerSlot: 2,
  ...savedConfig,
});

const normalizeSnapshot = (snapshot = {}, configFallback = {}) => {
  const nextConfig = normalizeConfig(snapshot.config || configFallback);
  const nextShifts = getConfiguredShifts(nextConfig);

  return {
    activities: Array.isArray(snapshot.activities) ? snapshot.activities : [],
    currentWeek: normalizeWeekData(snapshot.currentWeek, nextShifts),
    history: snapshot.history && typeof snapshot.history === 'object' ? snapshot.history : {},
    goals: Array.isArray(snapshot.goals) ? snapshot.goals : [],
    config: nextConfig,
    canvasNodes: Array.isArray(snapshot.canvasNodes) ? snapshot.canvasNodes : [],
    cycleCards: Array.isArray(snapshot.cycleCards) ? snapshot.cycleCards : [],
    meta: {
      updatedAt: snapshot?.meta?.updatedAt || snapshot?.clientUpdatedAt || null,
    },
  };
};

const hasMeaningfulData = (snapshot) => {
  const normalized = normalizeSnapshot(snapshot);
  return (
    normalized.activities.length > 0 ||
    normalized.goals.length > 0 ||
    normalized.canvasNodes.length > 0 ||
    normalized.cycleCards.length > 0 ||
    Object.keys(normalized.history).length > 0 ||
    normalized.currentWeek.some((day) =>
      Object.values(day || {}).some((slot) => Array.isArray(slot) && slot.length > 0),
    )
  );
};

const getSnapshotTimestamp = (snapshot) =>
  Date.parse(snapshot?.meta?.updatedAt || snapshot?.clientUpdatedAt || 0) || 0;

const getLocalDB = () => {
  const primaryRaw = readJSON(DB_KEY, null) || readJSON(LEGACY_DB_KEY, null) || {};
  const primary = normalizeSnapshot(primaryRaw);
  if (hasMeaningfulData(primary)) return primary;

  const backups = readJSON(BACKUP_KEY, []);
  const latestBackup = Array.isArray(backups)
    ? backups.map((entry) => normalizeSnapshot(entry?.data)).find(hasMeaningfulData)
    : null;

  return latestBackup || primary;
};

const getLocalUser = () => readJSON(USER_KEY, null);

export const RoutineProvider = ({ children }) => {
  const db = getLocalDB();
  const initialConfig = normalizeConfig(db.config);

  const [user, setUser] = useState(getLocalUser);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [activitiesPool, setActivitiesPool] = useState(() => db.activities || []);
  const [currentWeek, setCurrentWeek] = useState(() => normalizeWeekData(db.currentWeek, getConfiguredShifts(initialConfig)));
  const [history, setHistory] = useState(() => db.history || {});
  const [goals, setGoals] = useState(() => db.goals || []);
  const [canvasNodes, setCanvasNodes] = useState(() => db.canvasNodes || []);
  const [cycleCards, setCycleCards] = useState(() => db.cycleCards || []);
  const [isServerWaking, setIsServerWaking] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [config, setConfig] = useState(initialConfig);
  const [hasCompletedInitialSync, setHasCompletedInitialSync] = useState(false);
  const lastChangeAtRef = useRef(db.meta?.updatedAt || null);
  const skipNextTouchRef = useRef(false);
  const hasCheckedWeekRef = useRef(false);

  const t = (key) => TRANSLATIONS[config.lang || 'pt'][key] || key;

  const buildSnapshot = (overrides = {}) => ({
    activities: overrides.activities ?? activitiesPool,
    currentWeek: overrides.currentWeek ?? currentWeek,
    history: overrides.history ?? history,
    goals: overrides.goals ?? goals,
    config: overrides.config ?? config,
    canvasNodes: overrides.canvasNodes ?? canvasNodes,
    cycleCards: overrides.cycleCards ?? cycleCards,
    meta: {
      updatedAt: overrides.updatedAt ?? lastChangeAtRef.current ?? new Date().toISOString(),
    },
  });

  const persistLocalSnapshot = (snapshot) => {
    const normalized = normalizeSnapshot(snapshot, config);
    localStorage.setItem(DB_KEY, JSON.stringify(normalized));

    const backups = readJSON(BACKUP_KEY, []);
    const savedAt = normalized.meta.updatedAt || new Date().toISOString();
    const nextBackups = [
      { savedAt, data: normalized },
      ...backups.filter((entry) => entry?.savedAt !== savedAt),
    ].slice(0, 5);
    localStorage.setItem(BACKUP_KEY, JSON.stringify(nextBackups));
  };

  const applyRemoteSnapshot = (snapshot = {}, configFallback = config) => {
    const normalized = normalizeSnapshot(snapshot, configFallback);
    skipNextTouchRef.current = true;
    lastChangeAtRef.current = normalized.meta.updatedAt || lastChangeAtRef.current || new Date().toISOString();

    setActivitiesPool(normalized.activities);
    setCurrentWeek(normalized.currentWeek);
    setHistory(normalized.history);
    setGoals(normalized.goals);
    setCanvasNodes(normalized.canvasNodes);
    setCycleCards(normalized.cycleCards);
    setConfig(normalized.config);

    persistLocalSnapshot(normalized);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'theme-default', 'theme-professional', 'theme-cozy');
    root.classList.add(config.theme === 'light' ? 'light' : 'dark');
    root.classList.add(`theme-${config.themePreset || 'default'}`);
  }, [config.theme, config.themePreset]);

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

        if (!res.ok) return;

        const serverData = normalizeSnapshot(await res.json(), config);
        const localData = getLocalDB();
        const serverHasData = hasMeaningfulData(serverData);
        const localHasData = hasMeaningfulData(localData);

        if (!serverHasData && localHasData) {
          applyRemoteSnapshot(localData, config);
          fetch(`${API_URL}/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(localData),
          }).catch(() => {});
          return;
        }

        if (serverHasData && localHasData) {
          const selectedData = getSnapshotTimestamp(serverData) >= getSnapshotTimestamp(localData)
            ? serverData
            : localData;

          applyRemoteSnapshot(selectedData, config);

          if (selectedData === localData) {
            fetch(`${API_URL}/data`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(localData),
            }).catch(() => {});
          }
          return;
        }

        if (serverHasData) {
          applyRemoteSnapshot(serverData, config);
          return;
        }

        if (localHasData) {
          applyRemoteSnapshot(localData, config);
        }
      } catch (error) {
        clearTimeout(wakeTimer);
        setIsServerWaking(false);
      } finally {
        setHasCompletedInitialSync(true);
      }
    };

    syncWithServer();
  }, [token, user]);

  useEffect(() => {
    if (!user || !hasCompletedInitialSync || hasCheckedWeekRef.current) return;
    hasCheckedWeekRef.current = true;

    const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekHasAnyActivities = currentWeek.some((day) =>
      Object.values(day || {}).some((slot) => Array.isArray(slot) && slot.length > 0),
    );

    if (!config.lastWeekStart) {
      setConfig((prev) => ({
        ...prev,
        lastWeekStart: currentWeekStart,
        ...(weekHasAnyActivities
          ? {
              lastAutoShuffleWeek: prev.lastAutoShuffleWeek || currentWeekStart,
              plannedWeekStart: prev.plannedWeekStart || currentWeekStart,
            }
          : {}),
      }));
    } else if (config.lastWeekStart !== currentWeekStart) {
      const alreadyPreparedThisWeek =
        config.plannedWeekStart === currentWeekStart ||
        config.lastAutoShuffleWeek === currentWeekStart ||
        weekHasAnyActivities;

      setConfig((prev) => ({
        ...prev,
        shufflesUsed: 0,
        lastWeekStart: currentWeekStart,
        ...(alreadyPreparedThisWeek
          ? {
              lastAutoShuffleWeek: prev.lastAutoShuffleWeek || currentWeekStart,
              plannedWeekStart: prev.plannedWeekStart || currentWeekStart,
            }
          : {
              plannedWeekStart: '',
            }),
      }));

      if (config.autoShuffle && !alreadyPreparedThisWeek) {
        setTimeout(() => {
          executeShuffle(activitiesPool, { ...config, lastAutoShuffleWeek: currentWeekStart });
          setConfig((prev) => ({
            ...prev,
            shufflesUsed: 0,
            lastWeekStart: currentWeekStart,
            lastAutoShuffleWeek: currentWeekStart,
            plannedWeekStart: currentWeekStart,
          }));
        }, 500);
      }
    }
  }, [user, hasCompletedInitialSync, config, currentWeek, activitiesPool]);

  useEffect(() => {
    if (!hasCompletedInitialSync) return;
    if (skipNextTouchRef.current) {
      skipNextTouchRef.current = false;
      return;
    }
    lastChangeAtRef.current = new Date().toISOString();
  }, [activitiesPool, currentWeek, history, goals, config, canvasNodes, cycleCards, hasCompletedInitialSync]);

  useEffect(() => {
    const nextDb = buildSnapshot();
    persistLocalSnapshot(nextDb);

    if (token && hasCompletedInitialSync) {
      const timer = setTimeout(() => {
        fetch(`${API_URL}/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(nextDb),
        }).catch(() => {});
      }, 800);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [activitiesPool, currentWeek, history, goals, config, canvasNodes, cycleCards, token, hasCompletedInitialSync]);

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
    const startOfCurrentWeek = startOfWeek(todayDateOnly, { weekStartsOn: 1 });

    const weekPlan = Array.from({ length: 7 }, (_, i) => {
      const dayDate = addDays(startOfCurrentWeek, i);
      const isPastDay = isBefore(dayDate, todayDateOnly);
      const isTodayDate = isSameDay(dayDate, todayDateOnly);
      const dayObj = {};

      targetShifts.forEach((shift) => {
        const shouldPreserveSlot = isPastDay || isTodayDate;
        dayObj[shift] = shouldPreserveSlot ? (currentWeek?.[i]?.[shift] || []).slice() : [];
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
    const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    setConfig((prev) => ({
      ...prev,
      shufflesUsed: (prev.shufflesUsed || 0) + 1,
      lastWeekStart: currentWeekStart,
      lastAutoShuffleWeek: currentWeekStart,
      plannedWeekStart: currentWeekStart,
    }));
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

      const localData = getLocalDB();
      const serverData = normalizeSnapshot(data.data, config);
      const selectedData =
        hasMeaningfulData(serverData) && getSnapshotTimestamp(serverData) >= getSnapshotTimestamp(localData)
          ? serverData
          : localData;

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      if (hasMeaningfulData(selectedData)) {
        applyRemoteSnapshot(selectedData, config);
      } else {
        applyRemoteSnapshot(serverData, config);
      }

      setHasCompletedInitialSync(true);
      hasCheckedWeekRef.current = false;
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
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
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
                tasks:
                  activity.defaultTasks?.map((task) => ({
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
