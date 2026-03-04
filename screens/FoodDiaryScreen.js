// screens/FoodDiaryScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

import AppTheme from "../constants/AppTheme";
import { useAppData } from "../context/AppDataContext";
import { useUser } from "../context/UserContext";

const MEAL_TYPES = [
  "Breakfast",
  "Morning Snack",
  "Lunch",
  "Evening Snack",
  "Dinner",
];

/**
 * IMPORTANT: Food diary date keys are "YYYY-MM-DD" (local day).
 * Avoid new Date("YYYY-MM-DD") + toISOString() because that shifts dates in non-UTC timezones.
 */
const parseLocalYMD = (ymd) => {
  if (!ymd || typeof ymd !== "string") return new Date(NaN);
  const parts = ymd.split("-").map((n) => Number(n));
  if (parts.length !== 3) return new Date(NaN);
  const [y, m, d] = parts;
  if (!y || !m || !d) return new Date(NaN);
  return new Date(y, m - 1, d); // local midnight
};

const toLocalYMD = (dateObj) => {
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const startOfLocalDay = (dateObj) => {
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return new Date(NaN);
  return new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
};

export default function FoodDiaryScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { userData } = useUser();
  const { diary, loading, today, addMeal, deleteMeal, getTotals } = useAppData();

  const [selectedDate, setSelectedDate] = useState(today);
  const [processedPresetKey, setProcessedPresetKey] = useState(null);

  // For full-screen meal selection when coming from NutritionScreen
  const [mealPickerVisible, setMealPickerVisible] = useState(false);
  const [pendingPreset, setPendingPreset] = useState(null);

  /* ---------------- DATE HELPERS ---------------- */

  const formatDateLabel = (dateStr) => {
    if (dateStr === today) return "Today";

    const d = parseLocalYMD(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const now = parseLocalYMD(today);
    if (isNaN(now.getTime())) {
      const opts = { weekday: "short", month: "short", day: "numeric" };
      return d.toLocaleDateString("en-US", opts);
    }

    const diffMs = startOfLocalDay(d).getTime() - startOfLocalDay(now).getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === -1) return "Yesterday";
    if (diffDays === 1) return "Tomorrow";

    const opts = { weekday: "short", month: "short", day: "numeric" };
    return d.toLocaleDateString("en-US", opts);
  };

  const shiftDate = (delta) => {
    const d = parseLocalYMD(selectedDate);
    if (isNaN(d.getTime())) return;

    d.setDate(d.getDate() + delta);

    // Prevent future dates beyond today (local)
    const todayDate = parseLocalYMD(today);
    if (!isNaN(todayDate.getTime())) {
      if (startOfLocalDay(d) > startOfLocalDay(todayDate)) return;
    }

    setSelectedDate(toLocalYMD(d));
  };

  /* ---------------- PRESET ENTRY HANDLER (FROM NUTRITION) ---------------- */

  useEffect(() => {
    const preset = route?.params?.presetEntry;
    if (!preset) return;

    const key = JSON.stringify(preset);
    if (key === processedPresetKey) return;

    // Store preset and open full-screen meal picker
    setProcessedPresetKey(key);
    setPendingPreset(preset);
    setMealPickerVisible(true);
  }, [route?.params?.presetEntry, selectedDate]);

  const handleSelectMealForPreset = (mealType) => {
    if (!pendingPreset) {
      setMealPickerVisible(false);
      return;
    }

    const p = pendingPreset;

    addMeal(selectedDate, {
      mealType: mealType || p.mealType || "Breakfast",
      foodName: p.foodName || "",
      quantity: Number(p.quantity || 0),
      unit: p.unit || "g",
      calories: Math.round(Number(p.calories || 0)), // round to whole kcal
      protein: Number(p.protein || 0),
      carbs: Number(p.carbs || 0),
      fat: Number(p.fat || p.fats || 0),
      notes: p.notes || "Added from Nutrition",
    });

    setPendingPreset(null);
    setMealPickerVisible(false);

    // Clear param so it doesn't re-add on back
    const currentParams = route.params || {};
    navigation.setParams({ ...currentParams, presetEntry: null });
  };

  const handleCancelPresetPicker = () => {
    setPendingPreset(null);
    setMealPickerVisible(false);

    const currentParams = route.params || {};
    if (currentParams.presetEntry) {
      navigation.setParams({ ...currentParams, presetEntry: null });
    }
  };

  /* ---------------- DATA FOR SELECTED DAY ---------------- */

  const entriesForDay = useMemo(
    () => (diary && typeof diary === "object" ? diary[selectedDate] || [] : []),
    [diary, selectedDate]
  );

  const totalsRaw = typeof getTotals === "function" ? getTotals(selectedDate) : null;
  const totals = {
    calories: Math.round(totalsRaw?.calories || 0),
    protein: totalsRaw?.protein || 0,
    carbs: totalsRaw?.carbs || 0,
    fat: totalsRaw?.fat || 0,
  };

  /* Group entries by meal */
  const groupedMeals = useMemo(() => {
    const groups = MEAL_TYPES.map((mealType) => ({
      mealType,
      items: entriesForDay.filter((e) => e?.mealType === mealType),
    }));

    const misc = entriesForDay.filter(
      (e) => e && !MEAL_TYPES.includes(e.mealType || "")
    );
    if (misc.length > 0) groups.push({ mealType: "Other", items: misc });

    return groups;
  }, [entriesForDay]);

  /* Delete item */
  const handleDeleteEntry = (entry) => {
    const list =
      diary && typeof diary === "object" ? diary[selectedDate] || [] : [];
    const idx = list.indexOf(entry);
    if (idx === -1) return;

    Alert.alert("Remove Food", `Delete "${entry.foodName || "this item"}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMeal(selectedDate, idx),
      },
    ]);
  };

  /* Global Add Food (bottom button) */
  const handleAddFood = () => {
    navigation.navigate("FoodInputHub", {
      tab: "search",
      date: selectedDate,
    });
  };

  /* Plus button in each meal header → open FoodInputHub with that meal preselected */
  const handleAddFoodToMeal = (mealType) => {
    navigation.navigate("FoodInputHub", {
      tab: "manual",
      date: selectedDate,
      initialMealType: mealType,
    });
  };

  const kcalGoal = userData?.calories || 2000;
  const kcalPercent =
    kcalGoal > 0
      ? Math.min(Math.round((totals.calories / kcalGoal) * 100), 100)
      : 0;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={AppTheme.gradient.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
          >
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Food Diary</Text>
          <View style={{ width: 26 }} />
        </View>

        <Text style={styles.headerSubtitle}>
          Track everything you eat and how it impacts your goals
        </Text>

        {/* Date View */}
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.dateArrow}
            onPress={() => shiftDate(-1)}
          >
            <Ionicons name="chevron-back" size={18} color="#E0F2E9" />
          </TouchableOpacity>

          <View style={styles.dateCenter}>
            <Text style={styles.dateLabel}>{formatDateLabel(selectedDate)}</Text>
            <Text style={styles.dateSub}>{selectedDate}</Text>
          </View>

          <TouchableOpacity
            style={styles.dateArrow}
            onPress={() => shiftDate(1)}
          >
            <Ionicons name="chevron-forward" size={18} color="#E0F2E9" />
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Total calories</Text>
              <Text style={styles.summaryKcal}>{totals.calories} kcal</Text>
            </View>

            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>{kcalPercent}%</Text>
              <Text style={styles.summaryBadgeSub}>
                of {Math.round(kcalGoal)} kcal
              </Text>
            </View>
          </View>

          <View style={styles.summaryBarBg}>
            <View
              style={[
                styles.summaryBarFill,
                {
                  width: `${Math.min(kcalPercent, 100)}%`,
                },
              ]}
            />
          </View>

          <View style={styles.summaryMacrosRow}>
            <MacroPill label="Protein" value={totals.protein} unit="g" />
            <MacroPill label="Carbs" value={totals.carbs} unit="g" />
            <MacroPill label="Fat" value={totals.fat} unit="g" />
          </View>
        </View>
      </LinearGradient>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={AppTheme.colors.primary} />
          <Text style={styles.loadingText}>Loading your diary…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Show empty message if no meals */}
          {entriesForDay.length === 0 && (
            <View style={styles.emptyDayWrap}>
              <Text style={styles.emptyDayTitle}>No meals logged</Text>
              <Text style={styles.emptyDaySub}>
                Start adding food to track your calories and macros.
              </Text>
            </View>
          )}

          {/* Render grouped meals */}
          {groupedMeals.map((group) => {
            const mealTotal = group.items.reduce(
              (sum, item) => sum + Number(item?.calories || 0),
              0
            );
            const hasItems = group.items.length > 0;

            return (
              <View key={group.mealType} style={styles.mealSection}>
                {/* Header */}
                <View style={styles.mealHeaderRow}>
                  <View style={styles.mealTitleWrap}>
                    <View style={styles.mealDot} />
                    <Text style={styles.mealTitle}>{group.mealType}</Text>
                  </View>

                  <View style={styles.mealHeaderRight}>
                    <Text style={styles.mealKcal}>
                      {hasItems ? `${Math.round(mealTotal)} kcal` : "—"}
                    </Text>
                    <TouchableOpacity
                      style={styles.mealAddBtn}
                      onPress={() => handleAddFoodToMeal(group.mealType)}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color={AppTheme.colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Items */}
                {hasItems ? (
                  group.items.map((entry, idx) => (
                    <View key={idx} style={styles.mealCard}>
                      <View style={styles.mealCardRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.foodName}>
                            {entry.foodName || "Food item"}
                          </Text>
                          <Text style={styles.foodMeta}>
                            {entry.quantity} {entry.unit || "g"}
                          </Text>
                        </View>

                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={styles.foodKcal}>
                            {Math.round(entry.calories || 0)} kcal
                          </Text>
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDeleteEntry(entry)}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={16}
                              color="#9CA3AF"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Macro row */}
                      <View style={styles.macroRow}>
                        <Text style={styles.macroText}>
                          P {Number(entry.protein || 0).toFixed(1)}g
                        </Text>
                        <Text style={styles.macroDot}>•</Text>
                        <Text style={styles.macroText}>
                          C {Number(entry.carbs || 0).toFixed(1)}g
                        </Text>
                        <Text style={styles.macroDot}>•</Text>
                        <Text style={styles.macroText}>
                          F {Number(entry.fat ?? entry.fats ?? 0).toFixed(1)}g
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>
                      No items in {group.mealType} yet. Tap the + to add a meal.
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add food (global) */}
      <View style={styles.addFoodWrap}>
        <TouchableOpacity style={styles.addFoodBtn} onPress={handleAddFood}>
          <Ionicons
            name="add-circle-outline"
            size={22}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.addFoodText}>Add Food</Text>
        </TouchableOpacity>
      </View>

      {/* FULL-SCREEN MEAL PICKER FOR PRESET ENTRY */}
      <Modal
        visible={mealPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelPresetPicker}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add to which meal?</Text>
            <Text style={styles.modalSubtitle}>
              Choose where to save this food in your diary.
            </Text>

            {MEAL_TYPES.map((meal) => (
              <TouchableOpacity
                key={meal}
                style={styles.modalOption}
                onPress={() => handleSelectMealForPreset(meal)}
              >
                <View style={styles.modalOptionLeft}>
                  <View style={styles.modalBullet} />
                  <Text style={styles.modalOptionText}>{meal}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={AppTheme.colors.subtext}
                />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={handleCancelPresetPicker}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------------- SMALL COMPONENT ---------------- */

function MacroPill({ label, value, unit }) {
  return (
    <View style={styles.macroPill}>
      <Text style={styles.macroPillLabel}>{label}</Text>
      <Text style={styles.macroPillValue}>
        {Number(value || 0).toFixed(1)} {unit}
      </Text>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.bg,
  },

  header: {
    paddingTop: 60,
    paddingBottom: 26,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...AppTheme.shadow.soft,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    ...AppTheme.text.h2,
    color: "#fff",
  },

  headerSubtitle: {
    ...AppTheme.text.p,
    color: "#E0F2E9",
    marginTop: 4,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },

  dateArrow: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(224, 242, 233, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },

  dateCenter: {
    flex: 1,
    alignItems: "center",
  },

  dateLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },

  dateSub: {
    fontSize: 12,
    color: "#C7F0DD",
    marginTop: 2,
  },

  summaryCard: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  summaryLabel: {
    fontSize: 13,
    color: "#E0F2E9",
  },

  summaryKcal: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
  },

  summaryBadge: {
    alignItems: "flex-end",
  },

  summaryBadgeText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },

  summaryBadgeSub: {
    fontSize: 11,
    color: "#C7F0DD",
  },

  summaryBarBg: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
    marginTop: 8,
  },

  summaryBarFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: AppTheme.colors.sand,
  },

  summaryMacrosRow: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "space-between",
  },

  macroPill: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
  },

  macroPillLabel: {
    fontSize: 11,
    color: "#E0F2E9",
  },

  macroPillValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    marginTop: 2,
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  mealSection: {
    marginBottom: 18,
  },

  mealHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  mealTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
  },

  mealHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  mealAddBtn: {
    marginLeft: 8,
    paddingHorizontal: 2,
  },

  mealDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: AppTheme.colors.primary,
    marginRight: 8,
  },

  mealTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: AppTheme.colors.text,
  },

  mealKcal: {
    fontSize: 13,
    fontWeight: "600",
    color: AppTheme.colors.subtext,
  },

  mealCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginTop: 6,
    ...AppTheme.shadow.soft,
  },

  mealCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  foodName: {
    fontSize: 15,
    fontWeight: "700",
    color: AppTheme.colors.text,
  },

  foodMeta: {
    fontSize: 12,
    color: AppTheme.colors.subtext,
    marginTop: 2,
  },

  foodKcal: {
    fontSize: 15,
    fontWeight: "700",
    color: AppTheme.colors.primary,
  },

  deleteBtn: {
    marginTop: 4,
    padding: 4,
  },

  macroRow: {
    flexDirection: "row",
    marginTop: 6,
    alignItems: "center",
  },

  macroText: {
    fontSize: 12,
    color: "#6B7280",
  },

  macroDot: {
    marginHorizontal: 6,
    fontSize: 10,
    color: "#D1D5DB",
  },

  emptyCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 10,
    marginTop: 6,
  },

  emptyText: {
    fontSize: 12,
    color: AppTheme.colors.subtext,
  },

  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 8,
    color: AppTheme.colors.subtext,
  },

  addFoodWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
  },

  addFoodBtn: {
    backgroundColor: AppTheme.colors.primary,
    paddingVertical: 14,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    ...AppTheme.shadow.soft,
  },

  addFoodText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // FULL-SCREEN MEAL PICKER
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "88%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: AppTheme.colors.text,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 13,
    color: AppTheme.colors.subtext,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 10,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  modalOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalBullet: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: AppTheme.colors.primary,
    marginRight: 10,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: AppTheme.colors.text,
  },
  modalCancelBtn: {
    marginTop: 12,
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: AppTheme.colors.text,
  },
  emptyDayWrap: {
    padding: 20,
    alignItems: "center",
  },
  emptyDayTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppTheme.colors.text,
  },
  emptyDaySub: {
    fontSize: 13,
    color: AppTheme.colors.subtext,
    marginTop: 4,
    textAlign: "center",
  },
});
