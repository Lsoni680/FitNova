// context/TrackerContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "./UserContext";

const TrackerContext = createContext();

const STORAGE_KEY = "fitnova_tracker_entries_v1";

/** Format date as YYYY-MM-DD */
const formatDate = (date = new Date()) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export function TrackerProvider({ children }) {
  const { user } = useUser();
  const uid = user?.uid || "guest";

  const [entries, setEntries] = useState([]);
  const [loadingTrackers, setLoadingTrackers] = useState(true);

  const todayKey = formatDate();

  /* ---------------- LOAD FROM STORAGE ---------------- */
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(`${STORAGE_KEY}_${uid}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          setEntries(Array.isArray(parsed) ? parsed : []);
        } else {
          setEntries([]);
        }
      } catch (e) {
        console.log("Tracker load error:", e);
        setEntries([]);
      } finally {
        setLoadingTrackers(false);
      }
    };

    load();
  }, [uid]);

  const saveEntries = async (list) => {
    try {
      setEntries(list);
      await AsyncStorage.setItem(
        `${STORAGE_KEY}_${uid}`,
        JSON.stringify(list)
      );
    } catch (e) {
      console.log("Tracker save error:", e);
    }
  };

  /* ---------------- ADD ENTRY ---------------- */
  const addTrackerEntry = useCallback(
    async ({ type, value, unit = "", note = "", dateKey }) => {
      if (!type) return;

      const v = Number(value) || 0;
      const dk = dateKey || todayKey;

      const newEntry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type,
        value: v,
        unit,
        note,
        dateKey: dk,
        createdAt: Date.now(),
      };

      const updated = [...entries, newEntry];
      await saveEntries(updated);
    },
    [entries, todayKey]
  );

  /* ---------------- HELPERS: GROUP / SUMMARY ---------------- */

  const getEntriesForDate = useCallback(
    (dateKey = todayKey) =>
      entries.filter((e) => (e.dateKey || todayKey) === dateKey),
    [entries, todayKey]
  );

  /**
   * NEW FIXED LOGIC:
   *
   * steps, water, workout → last entry wins (NOT sum)
   * sleep, weight → last entry wins (already correct)
   */
  const getSummaryForDate = useCallback(
    (dateKey = todayKey) => {
      const dayEntries = getEntriesForDate(dateKey);

      if (!dayEntries.length) {
        return {
          calories: 0,
          water: 0,
          steps: 0,
          sleep: 0,
          workout: 0,
          weight: null,
        };
      }

      let lastSteps = null;
      let lastWater = null;
      let lastWorkout = null;
      let lastSleep = null;
      let lastWeight = null;

      const isLater = (a, b) => !a || (b.createdAt > a.createdAt);

      dayEntries.forEach((e) => {
        switch (e.type) {
          case "steps":
            if (isLater(lastSteps, e)) lastSteps = e;
            break;

          case "water":
            if (isLater(lastWater, e)) lastWater = e;
            break;

          case "workout":
            if (isLater(lastWorkout, e)) lastWorkout = e;
            break;

          case "sleep":
            if (isLater(lastSleep, e)) lastSleep = e;
            break;

          case "weight":
            if (isLater(lastWeight, e)) lastWeight = e;
            break;

          default:
            break;
        }
      });

      return {
        calories: 0,
        water: lastWater ? Number(lastWater.value) || 0 : 0,
        steps: lastSteps ? Number(lastSteps.value) || 0 : 0,
        sleep: lastSleep ? Number(lastSleep.value) || 0 : 0,
        workout: lastWorkout ? Number(lastWorkout.value) || 0 : 0,
        weight: lastWeight ? Number(lastWeight.value) || null : null,
      };
    },
    [getEntriesForDate]
  );

  const todayEntries = useMemo(
    () => getEntriesForDate(todayKey),
    [getEntriesForDate, todayKey]
  );

  const todaySummary = useMemo(
    () => getSummaryForDate(todayKey),
    [getSummaryForDate, todayKey]
  );

  /* ---- Convenience helpers ---- */
  const getTodayTotal = useCallback(
    (type) => {
      // With new logic, steps/water/workout should use summary, not sum.
      return todaySummary[type] ?? 0;
    },
    [todaySummary]
  );

  const getTodayEntries = useCallback(
    (type) => todayEntries.filter((e) => e.type === type),
    [todayEntries]
  );

  const getWeeklyData = useCallback(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dk = formatDate(d);
      const summary = getSummaryForDate(dk);
      days.push({
        date: dk,
        ...summary,
      });
    }
    return days;
  }, [getSummaryForDate]);

  /* ---------------- CLEAR ALL ---------------- */

  const clearAllTrackers = async () => {
    setEntries([]);
    await AsyncStorage.removeItem(`${STORAGE_KEY}_${uid}`);
  };

  return (
    <TrackerContext.Provider
      value={{
        entries,
        todayEntries,
        todaySummary,
        loadingTrackers,

        addTrackerEntry,
        getEntriesForDate,
        getSummaryForDate,
        getTodayTotal,
        getTodayEntries,
        getWeeklyData,
        clearAllTrackers,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
}

/* ---------------- HOOKS ---------------- */
export const useTracker = () => useContext(TrackerContext);

// Legacy alias
export const useTrackers = useTracker;
