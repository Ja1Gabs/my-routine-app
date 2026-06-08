import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { format, subDays, startOfWeek, addDays, isBefore, isSameDay, startOfToday, parseISO } from 'date-fns';
import { TRANSLATIONS } from '../constants/translations';
import { useToast } from '../components/ui/ToastProvider';
import {
  browserCanAskNotificationPermission,
  browserSupportsPush,
  getExistingPushSubscription,
  getPushSupportSnapshot,
  registerPushServiceWorker,
  subscribeToPush,
} from '../lib/pushNotifications';
import {
  buildEmptyWeek,
  buildHistoryKey,
  listHistoryEntriesForDate,
  normalizeWeekData,
  parseHistoryKey,
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

const withAssignedTask = (activity) => {
  if (!activity || typeof activity !== 'object') return activity;
  if (activity.assignedTask) return activity;

  const defaultTasks = Array.isArray(activity.defaultTasks) ? activity.defaultTasks.filter(Boolean) : [];
  if (defaultTasks.length === 0) return { ...activity, assignedTask: '' };

  return {
    ...activity,
    assignedTask: defaultTasks[Math.floor(Math.random() * defaultTasks.length)],
  };
};

const normalizeWeekWithTasks = (week, shifts) =>
  normalizeWeekData(week, shifts).map((day) => {
    const nextDay = {};
    Object.entries(day || {}).forEach(([shiftKey, slot]) => {
      nextDay[shiftKey] = Array.isArray(slot) ? slot.map(withAssignedTask) : [];
    });
    return nextDay;
  });

const normalizeConfig = (savedConfig = {}) => ({
  theme: 'dark',
  themePreset: 'default',
  layoutMode: 'immersive',
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
    currentWeek: normalizeWeekWithTasks(snapshot.currentWeek, nextShifts),
    history: snapshot.history && typeof snapshot.history === 'object' ? snapshot.history : {},
    goals: Array.isArray(snapshot.goals) ? snapshot.goals.map(normalizeGoalRecord) : [],
    config: nextConfig,
    canvasNodes: Array.isArray(snapshot.canvasNodes) ? snapshot.canvasNodes : [],
    cycleCards: Array.isArray(snapshot.cycleCards) ? snapshot.cycleCards : [],
    meta: {
      updatedAt: snapshot?.meta?.updatedAt || snapshot?.clientUpdatedAt || null,
    },
  };
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildRequestErrorMessage = (path, status, rawBody = '') => {
  if (path.startsWith('/push') && status === 404) {
    return `O backend publicado ainda nao tem a rota ${path}. Faca redeploy do backend no Render antes de ativar notificacoes.`;
  }

  if (path.startsWith('/push') && status === 503) {
    return 'O servidor de notificacoes respondeu, mas ainda nao esta configurado. Configure VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no Render.';
  }

  if (status === 401 || status === 403) {
    return 'Sua sessao expirou. Entre novamente e tente ativar as notificacoes.';
  }

  if (status >= 500) {
    return `O servidor falhou ao processar ${path}. Tente novamente depois que o Render terminar de acordar.`;
  }

  const compactBody = String(rawBody || '').replace(/\s+/g, ' ').trim();
  return compactBody
    ? `Falha em ${path} (HTTP ${status}): ${compactBody.slice(0, 120)}`
    : `Falha em ${path} (HTTP ${status}).`;
};

const normalizeGoalType = (type = '') => {
  const normalized = String(type || '').trim().toLowerCase();

  if (['manual', 'custom', 'freeform'].includes(normalized)) return 'manual';
  if (['streak', 'daily_streak', 'current_streak', 'dailystreak'].includes(normalized)) return 'streak';
  if (['total_activities', 'totalactivities', 'activity_total', 'total_completed'].includes(normalized)) return 'total_activities';
  if (['perfect_weeks', 'weekly_streak', 'weeklystreak', 'perfectweeks'].includes(normalized)) return 'perfect_weeks';

  return normalized || 'manual';
};

const normalizeGoalRecord = (goal = {}) => ({
  ...goal,
  title: String(goal.title || '').trim(),
  type: normalizeGoalType(goal.type),
  target: Math.max(1, Number(goal.target) || 1),
  current: Math.max(0, Number(goal.current) || 0),
});

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

const getWeekIndexFromDate = (dateStr) => {
  try {
    const date = parseISO(dateStr);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const dayStart = startOfToday();
    const currentWeekStart = startOfWeek(dayStart, { weekStartsOn: 1 });
    if (format(weekStart, 'yyyy-MM-dd') !== format(currentWeekStart, 'yyyy-MM-dd')) return -1;
    return Math.floor((date.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
  } catch (error) {
    return -1;
  }
};

const getExactHistoryEntry = (history, dateStr, shiftKey = 'default', activityId = 'default') =>
  history?.[buildHistoryKey(dateStr, shiftKey, activityId)] || null;

const getCurrentWeekStartDate = () => startOfWeek(startOfToday(), { weekStartsOn: 1 });

const getCurrentWeekDateStr = (index) => format(addDays(getCurrentWeekStartDate(), index), 'yyyy-MM-dd');

const getPlannedEntriesForDate = (week, dateStr) => {
  const weekIndex = getWeekIndexFromDate(dateStr);
  if (weekIndex < 0 || weekIndex >= week.length) return [];

  return Object.entries(week[weekIndex] || {}).flatMap(([shiftKey, slot]) =>
    (Array.isArray(slot) ? slot : [])
      .filter((activity) => activity?.id)
      .map((activity) => ({
        shiftKey,
        activityId: activity.id,
      })),
  );
};

const isPlannedDateComplete = (history, week, dateStr) => {
  const plannedEntries = getPlannedEntriesForDate(week, dateStr);
  if (plannedEntries.length === 0) return false;

  return plannedEntries.every((entry) =>
    Boolean(getExactHistoryEntry(history, dateStr, entry.shiftKey, entry.activityId)?.completed),
  );
};

const hasHistoryContent = (entry = {}) =>
  Boolean(
    entry?.completed ||
      entry?.notes ||
      entry?.image ||
      entry?.activity ||
      (Array.isArray(entry?.tasks) && entry.tasks.length > 0),
  );

const isHistoricalDateComplete = (history, dateStr) => {
  const entries = listHistoryEntriesForDate(history, dateStr).filter((item) => hasHistoryContent(item.value));
  return entries.length > 0 && entries.every((item) => Boolean(item.value?.completed));
};

const getCurrentWeekDates = () => Array.from({ length: 7 }, (_, index) => getCurrentWeekDateStr(index));

const stripImagesFromHistory = (history = {}) =>
  Object.fromEntries(
    Object.entries(history || {}).map(([key, entry]) => [
      key,
      entry && typeof entry === 'object'
        ? {
            ...entry,
            image: entry.image ? '__image_omitted_in_backup__' : entry.image || null,
          }
        : entry,
    ]),
  );

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
  const toast = useToast();
  const db = getLocalDB();
  const initialConfig = normalizeConfig(db.config);

  const [user, setUser] = useState(getLocalUser);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [activitiesPool, setActivitiesPool] = useState(() => db.activities || []);
  const [currentWeek, setCurrentWeek] = useState(() => normalizeWeekWithTasks(db.currentWeek, getConfiguredShifts(initialConfig)));
  const [history, setHistory] = useState(() => db.history || {});
  const [goals, setGoals] = useState(() => db.goals || []);
  const [canvasNodes, setCanvasNodes] = useState(() => db.canvasNodes || []);
  const [cycleCards, setCycleCards] = useState(() => db.cycleCards || []);
  const [isServerWaking, setIsServerWaking] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [config, setConfig] = useState(initialConfig);
  const [hasCompletedInitialSync, setHasCompletedInitialSync] = useState(false);
  const [clockTick, setClockTick] = useState(() => Date.now());
  const [notificationState, setNotificationState] = useState(() => ({
    canAskPermission: browserCanAskNotificationPermission(),
    supported: browserSupportsPush(),
    permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
    browserSubscribed: false,
    serverSubscribed: false,
    subscribed: false,
    loading: false,
    step: '',
    error: '',
    diagnostics: getPushSupportSnapshot(),
  }));
  const lastChangeAtRef = useRef(db.meta?.updatedAt || null);
  const skipNextTouchRef = useRef(false);

  const t = (key) => TRANSLATIONS[config.lang || 'pt'][key] || key;
  const currentWeekStart = useMemo(
    () => format(startOfWeek(new Date(clockTick), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    [clockTick],
  );

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

  const postSnapshotToServer = async (snapshot, authToken = token) => {
    if (!authToken) {
      return { ok: false, status: 401, error: 'Sessão não encontrada. Entre novamente.' };
    }

    try {
      const res = await fetch(`${API_URL}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(snapshot),
      });

      if (res.ok) {
        return { ok: true, status: res.status, error: null };
      }

      let message = 'Nao foi possivel sincronizar agora.';
      try {
        const data = await res.json();
        if (data?.error) message = data.error;
      } catch (error) {
        // keep fallback
      }

      if (res.status === 401 || res.status === 403) {
        message = 'Sua sessão expirou. Entre novamente para sincronizar.';
      }

      return { ok: false, status: res.status, error: message };
    } catch (error) {
      return { ok: false, status: 0, error: 'Servidor indisponível no momento. Tente novamente em instantes.' };
    }
  };

  const fetchWithAuth = async (path, options = {}, authToken = token, retryOptions = {}) => {
    const retries = Math.max(0, Number(retryOptions.retries) || 0);
    const retryDelay = Math.max(250, Number(retryOptions.retryDelay) || 1000);
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const headers = {
          ...(options.headers || {}),
          Authorization: `Bearer ${authToken}`,
        };

        const response = await fetch(`${API_URL}${path}`, {
          ...options,
          headers,
        });

        const rawBody = await response.text();
        let data = null;
        try {
          data = rawBody ? JSON.parse(rawBody) : null;
        } catch (error) {
          data = null;
        }

        if (!response.ok) {
          throw new Error(data?.error || buildRequestErrorMessage(path, response.status, rawBody));
        }

        return data;
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          await wait(retryDelay * (attempt + 1));
        }
      }
    }

    throw lastError || new Error('Nao foi possivel concluir a operacao.');
  };

  const persistLocalSnapshot = (snapshot) => {
    const normalized = normalizeSnapshot(snapshot, config);
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(normalized));
    } catch (error) {
      const fallbackSnapshot = {
        ...normalized,
        history: stripImagesFromHistory(normalized.history),
      };

      localStorage.setItem(DB_KEY, JSON.stringify(fallbackSnapshot));
      toast.warning(
        'Imagem muito pesada para armazenamento local',
        'A rotina foi salva, mas algumas imagens podem precisar ser reenviadas se o navegador ficar sem espaco.',
      );
    }

    const backups = readJSON(BACKUP_KEY, []);
    const savedAt = normalized.meta.updatedAt || new Date().toISOString();
    const backupSafeSnapshot = {
      ...normalized,
      history: stripImagesFromHistory(normalized.history),
    };
    const nextBackups = [
      { savedAt, data: backupSafeSnapshot },
      ...backups.filter((entry) => entry?.savedAt !== savedAt),
    ].slice(0, 5);

    try {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(nextBackups));
    } catch (error) {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(nextBackups.slice(0, 1)));
    }
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

  const commitActivitiesSnapshot = async (nextActivities) => {
    const updatedAt = new Date().toISOString();
    lastChangeAtRef.current = updatedAt;

    const nextSnapshot = buildSnapshot({
      activities: nextActivities,
      updatedAt,
    });

    persistLocalSnapshot(nextSnapshot);
    setActivitiesPool(nextActivities);

    if (token && hasCompletedInitialSync) {
      await postSnapshotToServer(nextSnapshot);
    }
  };

  const refreshNotificationState = async () => {
    const supported = browserSupportsPush();
    const permission = browserCanAskNotificationPermission() ? Notification.permission : 'default';
    const diagnostics = getPushSupportSnapshot();

    if (!supported) {
      setNotificationState({
        canAskPermission: browserCanAskNotificationPermission(),
        supported: false,
        permission,
        browserSubscribed: false,
        serverSubscribed: false,
        subscribed: false,
        loading: false,
        step: '',
        error: '',
        diagnostics,
      });
      return;
    }

    try {
      await registerPushServiceWorker();
      const subscription = await getExistingPushSubscription();
      let serverSubscribed = false;
      let serverStatus = null;

      if (subscription?.endpoint && token) {
        try {
          serverStatus = await fetchWithAuth('/push/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          serverSubscribed = Boolean(serverStatus?.matched);
        } catch (error) {
          serverSubscribed = false;
        }
      }

      setNotificationState((prev) => ({
        ...prev,
        canAskPermission: browserCanAskNotificationPermission(),
        supported: true,
        permission: browserCanAskNotificationPermission() ? Notification.permission : 'default',
        browserSubscribed: Boolean(subscription),
        serverSubscribed,
        subscribed: Boolean(subscription) && serverSubscribed,
        loading: false,
        step: '',
        error: serverStatus?.ready === false ? 'Servidor de push ainda nao esta pronto.' : '',
        diagnostics,
      }));
    } catch (error) {
      setNotificationState((prev) => ({
        ...prev,
        canAskPermission: browserCanAskNotificationPermission(),
        supported: true,
        permission: browserCanAskNotificationPermission() ? Notification.permission : 'default',
        browserSubscribed: false,
        serverSubscribed: false,
        subscribed: false,
        loading: false,
        step: '',
        error: error.message || 'Nao foi possivel verificar notificacoes.',
        diagnostics,
      }));
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'theme-default', 'theme-professional', 'theme-cozy');
    root.classList.add(config.theme === 'light' ? 'light' : 'dark');
    root.classList.add(`theme-${config.themePreset || 'default'}`);
  }, [config.theme, config.themePreset]);

  useEffect(() => {
    const refreshClock = () => setClockTick(Date.now());
    const timer = setInterval(refreshClock, 60000);
    window.addEventListener('focus', refreshClock);
    document.addEventListener('visibilitychange', refreshClock);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refreshClock);
      document.removeEventListener('visibilitychange', refreshClock);
    };
  }, []);

  useEffect(() => {
    refreshNotificationState();
  }, []);

  useEffect(() => {
    setCurrentWeek((prev) => normalizeWeekWithTasks(prev, getConfiguredShifts(config)));
  }, [config.routineMode, config.activeShifts]);

  useEffect(() => {
    if (!token || !hasCompletedInitialSync || !browserSupportsPush()) return;
    refreshNotificationState().catch(() => {});
  }, [token, hasCompletedInitialSync]);

  const syncWithServer = async () => {
    if (!user || !token) return;

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
        postSnapshotToServer(localData).catch(() => {});
        return;
      }

      if (serverHasData && localHasData) {
        const selectedData = getSnapshotTimestamp(serverData) >= getSnapshotTimestamp(localData)
          ? serverData
          : localData;

        applyRemoteSnapshot(selectedData, config);

        if (selectedData === localData) {
          postSnapshotToServer(localData).catch(() => {});
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

  useEffect(() => {
    if (!user || !token) return;

    syncWithServer();
  }, [token, user]);

  useEffect(() => {
    if (!user || !token || !hasCompletedInitialSync) return;

    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        setClockTick(Date.now());
        syncWithServer().catch(() => {});
      }
    };

    const handleFocusSync = () => {
      setClockTick(Date.now());
      syncWithServer().catch(() => {});
    };

    const timer = setInterval(() => {
      syncWithServer().catch(() => {});
    }, 60000);

    window.addEventListener('focus', handleFocusSync);
    document.addEventListener('visibilitychange', handleVisibilitySync);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleFocusSync);
      document.removeEventListener('visibilitychange', handleVisibilitySync);
    };
  }, [user, token, hasCompletedInitialSync, config]);

  useEffect(() => {
    if (!user || !hasCompletedInitialSync) return;

    if (!config.lastWeekStart) {
      setConfig((prev) => ({
        ...prev,
        lastWeekStart: currentWeekStart,
      }));
      return;
    }

    if (config.lastWeekStart === currentWeekStart) return;

    const alreadyPreparedThisWeek =
      config.plannedWeekStart === currentWeekStart ||
      config.lastAutoShuffleWeek === currentWeekStart;

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
            lastAutoShuffleWeek: '',
          }),
    }));

    if (config.autoShuffle && !alreadyPreparedThisWeek) {
      setTimeout(() => {
        executeShuffle(activitiesPool, { ...config, lastAutoShuffleWeek: currentWeekStart }, { preserveToday: false });
        setConfig((prev) => ({
          ...prev,
          shufflesUsed: 0,
          lastWeekStart: currentWeekStart,
          lastAutoShuffleWeek: currentWeekStart,
          plannedWeekStart: currentWeekStart,
        }));
      }, 250);
    }
  }, [user, hasCompletedInitialSync, config, currentWeek, activitiesPool, currentWeekStart]);

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
        postSnapshotToServer(nextDb).catch(() => {});
      }, 800);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [activitiesPool, currentWeek, history, goals, config, canvasNodes, cycleCards, token, hasCompletedInitialSync]);

  const updateDayData = (dateStr, shiftKey, activityId, newData, activitySnapshot) => {
    const key = buildHistoryKey(dateStr, shiftKey, activityId);
    setHistory((prev) => ({
      ...prev,
      [key]: {
        ...(getExactHistoryEntry(prev, dateStr, shiftKey, activityId) || {}),
        ...newData,
        ...(activitySnapshot ? { activity: activitySnapshot } : {}),
        lastUpdated: new Date().toISOString(),
      },
    }));
  };

  const toggleComplete = (dateStr, shiftKey, activityId, activitySnapshot) => {
    const key = buildHistoryKey(dateStr, shiftKey, activityId);
    setHistory((prev) => ({
      ...prev,
      [key]: {
        ...(getExactHistoryEntry(prev, dateStr, shiftKey, activityId) || {}),
        completed: !getExactHistoryEntry(prev, dateStr, shiftKey, activityId)?.completed,
        ...(activitySnapshot ? { activity: activitySnapshot } : {}),
        lastUpdated: new Date().toISOString(),
      },
    }));
  };

  const executeShuffle = (poolOverride = null, configOverride = null, options = {}) => {
    const { preserveToday = false } = options;
    const activeConfig = normalizeConfig(configOverride || config);
    const pool = (poolOverride && poolOverride.length > 0) ? poolOverride : [...activitiesPool];
    const targetShifts = getConfiguredShifts(activeConfig);
    const slotLimit = Math.max(1, Number(activeConfig.maxActivitiesPerSlot) || 1);
    const isSundayPauseLocked = activeConfig.sundayMode === 'pause';

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
        const shouldPreserveSlot = isPastDay || (preserveToday && isTodayDate);
        dayObj[shift] = shouldPreserveSlot ? (currentWeek?.[i]?.[shift] || []).map(withAssignedTask) : [];
      });

      return dayObj;
    });

    const pushActivity = (dayIndex, shiftKey, activity) => {
      if (dayIndex < 0 || dayIndex > 6 || !targetShifts.includes(shiftKey)) return false;
      if (isSundayPauseLocked && dayIndex === 6 && activity?.id !== FIXED_SUNDAY.id) return false;
      const slot = weekPlan[dayIndex][shiftKey];
      const nextActivity = withAssignedTask(activity);
      if (!Array.isArray(slot) || slot.length >= slotLimit) return false;
      if (slot.some((item) => item.id === nextActivity.id && item.assignedTask === nextActivity.assignedTask)) return false;
      slot.push(nextActivity);
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
        if (isSundayPauseLocked && dayIndex === 6) return;
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

      allowedDays
        .filter((dayIndex) => !(isSundayPauseLocked && dayIndex === 6))
        .sort(() => Math.random() - 0.5)
        .forEach((dayIndex) => {
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
      if (isSundayPauseLocked && dayIndex === 6) continue;
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
      toast.warning('Limite de sorteios atingido', 'Você já usou todos os embaralhos disponíveis nesta semana.');
      return;
    }

    setIsShuffling(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    executeShuffle(undefined, undefined, { preserveToday: false });
    setConfig((prev) => ({
      ...prev,
      shufflesUsed: (prev.shufflesUsed || 0) + 1,
      lastWeekStart: currentWeekStart,
      lastAutoShuffleWeek: currentWeekStart,
      plannedWeekStart: currentWeekStart,
    }));
    setIsShuffling(false);
  };

  const enablePushNotifications = async () => {
    if (!browserCanAskNotificationPermission()) {
      throw new Error('Este navegador nao consegue pedir permissao de notificacao neste contexto. Use HTTPS ou instale o app na tela inicial, se estiver no iPhone.');
    }

    let browserSubscription = null;

    setNotificationState((prev) => ({
      ...prev,
      loading: true,
      step: 'Pedindo permissao do navegador...',
      error: '',
      diagnostics: getPushSupportSnapshot(),
    }));

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotificationState((prev) => ({
          ...prev,
          canAskPermission: browserCanAskNotificationPermission(),
          permission,
          browserSubscribed: false,
          serverSubscribed: false,
          subscribed: false,
          loading: false,
          step: '',
          error: 'Permissao de notificacao nao concedida.',
          diagnostics: getPushSupportSnapshot(),
        }));
        throw new Error('Permissao de notificacao nao concedida.');
      }

      if (!browserSupportsPush()) {
        const support = getPushSupportSnapshot();
        const reason = !support.isSecureContext
          ? 'Push web exige HTTPS. Abra o site pelo endereco seguro publicado.'
          : !support.hasServiceWorker
            ? 'Este navegador nao disponibilizou Service Worker para o site.'
            : !support.hasPushManager
              ? 'Este navegador nao tem Push API. No iPhone, instale o site na tela inicial e abra pelo icone.'
              : 'Este navegador ainda nao suporta push web completo neste modo.';

        setNotificationState((prev) => ({
          ...prev,
          canAskPermission: browserCanAskNotificationPermission(),
          supported: false,
          permission,
          browserSubscribed: false,
          serverSubscribed: false,
          subscribed: false,
          loading: false,
          step: '',
          error: reason,
          diagnostics: support,
        }));
        throw new Error(reason);
      }

      setNotificationState((prev) => ({
        ...prev,
        step: 'Buscando chave de notificacao no servidor...',
        diagnostics: getPushSupportSnapshot(),
      }));
      const { publicKey } = await fetchWithAuth('/push/public-key', {}, token, { retries: 2, retryDelay: 1200 });

      setNotificationState((prev) => ({
        ...prev,
        step: 'Criando assinatura no navegador...',
      }));
      browserSubscription = await subscribeToPush(publicKey);

      setNotificationState((prev) => ({
        ...prev,
        browserSubscribed: true,
        step: 'Salvando assinatura no servidor...',
      }));
      await fetchWithAuth('/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: browserSubscription }),
      }, token, { retries: 2, retryDelay: 1200 });

      setNotificationState({
        canAskPermission: browserCanAskNotificationPermission(),
        supported: true,
        permission,
        browserSubscribed: true,
        serverSubscribed: true,
        subscribed: true,
        loading: false,
        step: '',
        error: '',
        diagnostics: getPushSupportSnapshot(),
      });

      return { success: true };
    } catch (error) {
      setNotificationState((prev) => ({
        ...prev,
        browserSubscribed: Boolean(browserSubscription) || prev.browserSubscribed,
        serverSubscribed: false,
        subscribed: false,
        loading: false,
        step: '',
        error: error.message || 'Nao foi possivel ativar as notificacoes.',
        diagnostics: getPushSupportSnapshot(),
      }));
      throw error;
    }
  };

  const disablePushNotifications = async () => {
    if (!browserCanAskNotificationPermission()) {
      throw new Error('Push notifications nao sao suportadas neste dispositivo.');
    }

    setNotificationState((prev) => ({ ...prev, loading: true }));

    try {
      await registerPushServiceWorker();
      const subscription = await getExistingPushSubscription();

      if (subscription?.endpoint) {
        await fetchWithAuth('/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setNotificationState({
        canAskPermission: browserCanAskNotificationPermission(),
        supported: true,
        permission: Notification.permission,
        browserSubscribed: false,
        serverSubscribed: false,
        subscribed: false,
        loading: false,
        step: '',
        error: '',
        diagnostics: getPushSupportSnapshot(),
      });

      return { success: true };
    } catch (error) {
      setNotificationState((prev) => ({ ...prev, loading: false, step: '', error: error.message || prev.error }));
      throw error;
    }
  };

  const sendTestPushNotification = async () => {
    setNotificationState((prev) => ({ ...prev, loading: true }));
    try {
      const result = await fetchWithAuth('/push/test', { method: 'POST' });
      setNotificationState((prev) => ({ ...prev, loading: false }));
      return result;
    } catch (error) {
      setNotificationState((prev) => ({ ...prev, loading: false }));
      throw error;
    }
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
      refreshNotificationState().catch(() => {});
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
    const knownDates = new Set(Array.from({ length: 7 }, (_, index) => getCurrentWeekDateStr(index)));

    Object.keys(history || {}).forEach((key) => {
      const parsed = parseHistoryKey(key);
      if (!parsed.dateStr) return;
      knownDates.add(parsed.dateStr);
    });

    knownDates.forEach((dateStr) => {
      if (getWeekIndexFromDate(dateStr) >= 0) {
        datesObj[dateStr] = isPlannedDateComplete(history, currentWeek, dateStr);
        return;
      }

      datesObj[dateStr] = isHistoricalDateComplete(history, dateStr);
    });

    return datesObj;
  }, [history, currentWeek]);

  const stats = useMemo(() => {
    let daily = 0;
    let dateCursor = startOfToday();

    while (getWeekIndexFromDate(format(dateCursor, 'yyyy-MM-dd')) >= 0 && isPlannedDateComplete(history, currentWeek, format(dateCursor, 'yyyy-MM-dd'))) {
      daily += 1;
      dateCursor = subDays(dateCursor, 1);
    }

    const weekly = getCurrentWeekDates().every((dateStr) => isPlannedDateComplete(history, currentWeek, dateStr)) ? 1 : 0;

    return {
      daily,
      weekly,
      total: Object.values(history).filter((entry) => entry.completed).length,
    };
  }, [currentWeek, history]);

  const resolvedGoals = useMemo(() => {
    return goals.map((rawGoal) => {
      const goal = normalizeGoalRecord(rawGoal);

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
        notificationState,
        completedDays,
        stats,
        actions: {
          login,
          register,
          syncNow: async () => {
            const snapshot = buildSnapshot({ updatedAt: new Date().toISOString() });
            lastChangeAtRef.current = snapshot.meta.updatedAt;
            persistLocalSnapshot(snapshot);
            return postSnapshotToServer(snapshot);
          },
          logout: () => {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            window.location.reload();
          },
          saveActivity: async (activity) => {
            const nextActivity = activity.id ? activity : { ...activity, id: crypto.randomUUID() };
            const nextActivities = nextActivity.id && activitiesPool.some((item) => item.id === nextActivity.id)
              ? activitiesPool.map((item) => (item.id === nextActivity.id ? nextActivity : item))
              : [...activitiesPool, nextActivity];

            await commitActivitiesSnapshot(nextActivities);
          },
          importActivities: async (activities) => {
            const normalizedActivities = Array.isArray(activities) ? activities : [];
            if (normalizedActivities.length === 0) return;

            const nextMap = new Map(activitiesPool.map((activity) => [activity.id, activity]));
            normalizedActivities.forEach((activity) => {
              const nextActivity = activity.id ? activity : { ...activity, id: crypto.randomUUID() };
              nextMap.set(nextActivity.id, nextActivity);
            });

            await commitActivitiesSnapshot(Array.from(nextMap.values()));
          },
          deleteActivity: async (id) => {
            const nextActivities = activitiesPool.filter((activity) => activity.id !== id);
            await commitActivitiesSnapshot(nextActivities);
          },
          triggerShuffle,
          refreshNotificationState,
          enablePushNotifications,
          disablePushNotifications,
          sendTestPushNotification,
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
          addGoal: (goal) =>
            setGoals((prev) => [
              ...prev,
              {
                ...normalizeGoalRecord(goal),
                id: crypto.randomUUID(),
                current: normalizeGoalType(goal?.type) === 'manual' ? Math.max(0, Number(goal?.current) || 0) : 0,
              },
            ]),
          incrementGoal: (id) =>
            setGoals((prev) =>
              prev.map((rawGoal) => {
                const goal = normalizeGoalRecord(rawGoal);
                return goal.id === id && goal.type === 'manual'
                  ? { ...goal, current: Math.min(goal.current + 1, goal.target) }
                  : goal;
              }),
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
