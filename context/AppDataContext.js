// context/AppDataContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "./UserContext";

const AppDataContext = createContext();

const STORAGE_KEY = "fitnova_food_diary_v1";

/** Format YYYY-MM-DD */
const formatDate = (date = new Date()) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

export const AppDataProvider = ({ children }) => {
  const { user } = useUser();
  const uid = user?.uid || "guest";

  const [diary, setDiary] = useState({});
  const [loading, setLoading] = useState(true);

  const today = formatDate();

  /* LOAD */
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(`${STORAGE_KEY}_${uid}`);
        setDiary(raw ? JSON.parse(raw) : {});
      } catch {
        setDiary({});
      }
      setLoading(false);
    })();
  }, [uid]);

  /* SAVE */
  const saveDiary = async (data) => {
    setDiary(data);
    await AsyncStorage.setItem(`${STORAGE_KEY}_${uid}`, JSON.stringify(data));
  };

  /* HELPERS */
  const getMeals = (dateKey = today) => {
    return Array.isArray(diary[dateKey]) ? diary[dateKey] : [];
  };

  const getTotals = (dateKey = today) => {
    const meals = getMeals(dateKey);

    return meals.reduce(
      (acc, m) => {
        acc.calories += Number(m.calories || 0);
        acc.protein += Number(m.protein || 0);
        acc.carbs += Number(m.carbs || 0);
        acc.fat += Number(m.fat || m.fats || 0);
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  /**
   * addMeal supports BOTH call styles:
   * 1) addMeal(dateKey, mealObj)
   * 2) addMeal(dateKey, mealType, mealObj)  <-- FoodInputHub uses this :contentReference[oaicite:2]{index=2}
   */
  const addMeal = async (dateKey, maybeMealTypeOrObj, maybeObj) => {
    const key = dateKey || today;

    let mealType = undefined;
    let mealObj = undefined;

    // Detect 3-arg vs 2-arg usage
    if (typeof maybeMealTypeOrObj === "string") {
      mealType = maybeMealTypeOrObj;
      mealObj = maybeObj || {};
    } else {
      mealObj = maybeMealTypeOrObj || {};
      mealType = mealObj.mealType; // if provided inside object
    }

    const existing = getMeals(key);

    // Normalize naming so FoodDiary can render consistently
    const normalized = {
      ...mealObj,
      mealType: mealType || mealObj.mealType || "Breakfast",
      foodName: mealObj.foodName || mealObj.food || "",
      // keep original fields if already present:
      food: mealObj.food || mealObj.foodName || "",
      quantity: mealObj.quantity ?? "",
      unit: mealObj.unit || "grams",
    };

    const meal = {
      ...normalized,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      dateKey: key,
      calories: Number(normalized.calories || 0),
      protein: Number(normalized.protein || 0),
      carbs: Number(normalized.carbs || 0),
      fat: Number(normalized.fat || normalized.fats || 0),
    };

    const updated = {
      ...diary,
      [key]: [...existing, meal],
    };

    await saveDiary(updated);
  };

  /* deleteMeal */
  const deleteMeal = async (dateKey, index) => {
    const key = dateKey || today;
    const arr = [...getMeals(key)];
    arr.splice(index, 1);

    const updated = { ...diary, [key]: arr };
    await saveDiary(updated);
  };

  return (
    <AppDataContext.Provider
      value={{
        diary,
        loading,
        today,
        getMeals,
        getTotals,
        addMeal,
        deleteMeal,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);
