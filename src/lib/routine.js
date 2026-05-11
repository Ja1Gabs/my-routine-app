const ALL_SHIFTS = ['default', 'morning', 'afternoon', 'night'];

export const buildHistoryKey = (dateStr, shiftKey = 'default', activityId = 'default') =>
  `${dateStr}_${shiftKey}_${activityId || 'default'}`;

export const parseHistoryKey = (key) => {
  const [dateStr = '', shiftKey = 'default', ...activityParts] = String(key).split('_');
  return {
    dateStr,
    shiftKey,
    activityId: activityParts.join('_') || 'default',
  };
};

export const normalizeSlotActivities = (slotValue) => {
  if (!slotValue) return [];
  if (Array.isArray(slotValue)) return slotValue.filter(Boolean);
  return [slotValue].filter(Boolean);
};

export const normalizeWeekEntry = (entry = {}, shifts = ['default']) => {
  const normalized = {};
  shifts.forEach((shift) => {
    normalized[shift] = normalizeSlotActivities(entry?.[shift]);
  });

  ALL_SHIFTS.forEach((shift) => {
    if (!(shift in normalized) && entry?.[shift]) {
      normalized[shift] = normalizeSlotActivities(entry[shift]);
    }
  });

  return normalized;
};

export const normalizeWeekData = (week = [], shifts = ['default']) =>
  Array.from({ length: 7 }, (_, index) => normalizeWeekEntry(week?.[index], shifts));

export const buildEmptyWeek = (shifts = ['default']) =>
  Array.from({ length: 7 }, () => normalizeWeekEntry({}, shifts));

export const getHistoryEntry = (history, dateStr, shiftKey = 'default', activityId = 'default') => {
  const nextKey = buildHistoryKey(dateStr, shiftKey, activityId);
  return history?.[nextKey] || history?.[`${dateStr}_${shiftKey}`] || {};
};

export const listHistoryEntriesForDate = (history, dateStr) =>
  Object.entries(history || {})
    .map(([key, value]) => ({ key, value, ...parseHistoryKey(key) }))
    .filter((item) => item.dateStr === dateStr);
