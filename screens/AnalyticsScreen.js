// screens/AnalyticsScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import AppTheme from "../constants/AppTheme";
import { useUser } from "../context/UserContext";
import { useAppData } from "../context/AppDataContext";
import { useTrackers } from "../context/TrackerContext";

export default function AnalyticsScreen() {
  const navigation = useNavigation();

  const { userData } = useUser();
  const { diary, getTotals } = useAppData();
  const { entries, getSummaryForDate } = useTrackers();

  const [weekDays, setWeekDays] = useState([]);

  // Build last 7 days list (oldest -> newest)
  useEffect(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      days.push({ key, label });
    }
    setWeekDays(days);
  }, []);

  // Weekly nutrition data from diary
  const weeklyNutrition = useMemo(() => {
    if (weekDays.length === 0) return [];
    return weekDays.map((d) => {
      const totals = getTotals(d.key);
      return {
        key: d.key,
        label: d.label,
        calories: totals.calories || 0,
        protein: totals.protein || 0,
        carbs: totals.carbs || 0,
        fats: totals.fats || 0,
      };
    });
  }, [weekDays, diary]);

  // Weekly activity data from trackers
  const weeklyTrackers = useMemo(() => {
    if (weekDays.length === 0) return [];
    return weekDays.map((d) => {
      const sum = getSummaryForDate(d.key);
      return {
        key: d.key,
        label: d.label,
        steps: sum.steps || 0,
        water: sum.waterMl || 0,
        sleep: sum.sleepHours || 0,
        workout: sum.workoutCalories || 0,
      };
    });
  }, [weekDays, entries]);

  // Goals
  const calorieGoal = userData?.calories || 2000;
  const stepsGoal = userData?.stepsGoal || 10000;
  const waterGoal = userData?.waterGoal || 2000;
  const sleepGoal = userData?.sleepGoal || 8;

  const todayKey = weekDays.length ? weekDays[weekDays.length - 1].key : null;
  const todayNutrition = todayKey
    ? weeklyNutrition.find((d) => d.key === todayKey)
    : null;
  const todayTracker = todayKey
    ? weeklyTrackers.find((d) => d.key === todayKey)
    : null;

  const todayCaloriesRaw = todayNutrition?.calories || 0;
  const todaySteps = todayTracker?.steps || 0;

  const todayCalories = Math.round(todayCaloriesRaw);

  const todayCaloriePct = calorieGoal
    ? Math.min(Math.round((todayCaloriesRaw / calorieGoal) * 100), 999)
    : 0;
  const todayStepsPct = stepsGoal
    ? Math.min(Math.round((todaySteps / stepsGoal) * 100), 999)
    : 0;

  // Scales for charts
  const maxCalories = weeklyNutrition.reduce(
    (max, d) => Math.max(max, d.calories),
    1
  );
  const maxProtein = weeklyNutrition.reduce(
    (max, d) => Math.max(max, d.protein),
    1
  );
  const maxCarbs = weeklyNutrition.reduce(
    (max, d) => Math.max(max, d.carbs),
    1
  );
  const maxFats = weeklyNutrition.reduce(
    (max, d) => Math.max(max, d.fats),
    1
  );
  const maxSteps = weeklyTrackers.reduce(
    (max, d) => Math.max(max, d.steps),
    1
  );
  const maxWater = weeklyTrackers.reduce(
    (max, d) => Math.max(max, d.water),
    1
  );
  const maxSleep = weeklyTrackers.reduce(
    (max, d) => Math.max(max, d.sleep),
    1
  );
  const maxWorkout = weeklyTrackers.reduce(
    (max, d) => Math.max(max, d.workout),
    1
  );

  const weeklyCalorieAvg = weeklyNutrition.length
    ? Math.round(
        weeklyNutrition.reduce((sum, d) => sum + d.calories, 0) /
          weeklyNutrition.length
      )
    : 0;

  const weeklyProteinAvgRaw = weeklyNutrition.length
    ? weeklyNutrition.reduce((sum, d) => sum + d.protein, 0) /
      weeklyNutrition.length
    : 0;

  const weeklyProteinAvg = Number(weeklyProteinAvgRaw.toFixed(1));

  const weekGoalHits = weeklyNutrition.filter(
    (d) =>
      d.calories >= calorieGoal * 0.9 && d.calories <= calorieGoal * 1.1
  ).length;

  return (
    <View style={styles.container}>
      {/* HEADER WITH BACK BUTTON + RINGS (COMPACT) */}
      <LinearGradient
        colors={AppTheme.gradient.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
            }
          }}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Weekly Insights</Text>
            <Text style={styles.headerSub}>
              Last 7 days · Nutrition & activity
            </Text>
          </View>

          {/* Spacer to balance layout */}
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.ringsRow}>
          {/* Calorie ring */}
          <View style={styles.ringBlock}>
            <Text style={styles.ringLabel}>Calories</Text>
            <View style={styles.ringOuter}>
              <View style={styles.ringInner}>
                <Text style={styles.ringValue}>{todayCalories}</Text>
                <Text style={styles.ringUnit}>kcal</Text>
                <Text style={styles.ringPct}>{todayCaloriePct}%</Text>
              </View>
            </View>
            <Text style={styles.ringGoal}>Goal {calorieGoal} kcal</Text>
          </View>

          {/* Steps ring */}
          <View style={styles.ringBlock}>
            <Text style={styles.ringLabel}>Steps</Text>
            <View style={styles.ringOuter}>
              <View style={styles.ringInner}>
                <Text style={styles.ringValue}>
                  {todaySteps.toLocaleString()}
                </Text>
                <Text style={styles.ringUnit}>steps</Text>
                <Text style={styles.ringPct}>{todayStepsPct}%</Text>
              </View>
            </View>
            <Text style={styles.ringGoal}>
              Goal {stepsGoal.toLocaleString()} steps
            </Text>
          </View>
        </View>

        {/* Quick insight cards */}
        <View style={styles.insightsRow}>
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>Weekly avg</Text>
            <Text style={styles.insightValue}>{weeklyCalorieAvg} kcal</Text>
            <Text style={styles.insightSub}>per day</Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>Goal hits</Text>
            <Text style={styles.insightValue}>{weekGoalHits}/7</Text>
            <Text style={styles.insightSub}>calorie goal days</Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>Avg protein</Text>
            <Text style={styles.insightValue}>{weeklyProteinAvg} g</Text>
            <Text style={styles.insightSub}>per day</Text>
          </View>
        </View>
      </LinearGradient>

      {/* BODY */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* EMPTY STATE (Play Store safety) */}
        {weeklyNutrition.every(d => d.calories === 0) &&
         weeklyTrackers.every(d => d.steps === 0) && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptySub}>
              Start logging meals and activities to see insights here.
            </Text>
         </View>
       )}
       
        {/* CALORIES BAR CHART */}
        <View style={[styles.card, AppTheme.shadow.card]}>
          <Text style={styles.cardTitle}>Calories (Last 7 days)</Text>
          <Text style={styles.cardSubtitle}>
            Compare to your daily goal of {calorieGoal} kcal
          </Text>

          {weeklyNutrition.map((d) => {
            const pct = maxCalories ? (d.calories / maxCalories) * 100 : 0;
            const goalLinePct = maxCalories
              ? (calorieGoal / maxCalories) * 100
              : 0;

            return (
              <View key={d.key} style={styles.barRow}>
                <Text style={styles.barLabel}>{d.label}</Text>
                <View style={styles.barTrack}>
                  {/* Gradient fill */}
                  <LinearGradient
                    colors={[
                      AppTheme.colors.primary,
                      AppTheme.colors.accent || "#F97316",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.barFill,
                      { width: `${Math.min(pct, 100)}%` },
                    ]}
                  />

                  {/* Goal line */}
                  {goalLinePct > 4 && (
                    <View
                      style={[
                        styles.goalLine,
                        { left: `${Math.min(goalLinePct, 100)}%` },
                      ]}
                    />
                  )}
                </View>
                <Text style={styles.barValue}>
                  {Math.round(d.calories)} kcal
                </Text>
              </View>
            );
          })}
        </View>

        {/* MACROS BAR CHART */}
        <View style={[styles.card, AppTheme.shadow.card]}>
          <Text style={styles.cardTitle}>Macros (Weekly view)</Text>
          <Text style={styles.cardSubtitle}>
            Protein, carbs, and fats per day
          </Text>

          {/* Protein */}
          <Text style={styles.sectionLabel}>Protein (g)</Text>
          {weeklyNutrition.map((d) => {
            const pct = maxProtein ? (d.protein / maxProtein) * 100 : 0;
            return (
              <MiniBarRow
                key={d.key + "-p"}
                label={d.label}
                value={`${d.protein.toFixed(1)} g`}
                pct={pct}
                colors={[
                  AppTheme.colors.mint || AppTheme.colors.primary,
                  AppTheme.colors.primary,
                ]}
              />
            );
          })}

          {/* Carbs */}
          <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Carbs (g)</Text>
          {weeklyNutrition.map((d) => {
            const pct = maxCarbs ? (d.carbs / maxCarbs) * 100 : 0;
            return (
              <MiniBarRow
                key={d.key + "-c"}
                label={d.label}
                value={`${d.carbs.toFixed(1)} g`}
                pct={pct}
                colors={[
                  AppTheme.colors.sky || AppTheme.colors.primary,
                  AppTheme.colors.primary,
                ]}
              />
            );
          })}

          {/* Fat */}
          <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Fat (g)</Text>
          {weeklyNutrition.map((d) => {
            const pct = maxFats ? (d.fats / maxFats) * 100 : 0;
            return (
              <MiniBarRow
                key={d.key + "-f"}
                label={d.label}
                value={`${d.fats.toFixed(1)} g`}
                pct={pct}
                colors={[
                  AppTheme.colors.sand || AppTheme.colors.primary,
                  AppTheme.colors.primary,
                ]}
              />
            );
          })}
        </View>

        {/* ACTIVITY CHARTS */}
        <View style={[styles.card, AppTheme.shadow.card]}>
          <Text style={styles.cardTitle}>Activity (Last 7 days)</Text>
          <Text style={styles.cardSubtitle}>
            Steps, water, sleep & workout
          </Text>

          <Text style={styles.sectionLabel}>Steps</Text>
          {weeklyTrackers.map((d) => {
            const pct = maxSteps ? (d.steps / maxSteps) * 100 : 0;
            return (
              <MiniBarRow
                key={d.key + "-steps"}
                label={d.label}
                value={d.steps.toLocaleString()}
                pct={pct}
                colors={["#9CA3AF", "#4B5563"]}
              />
            );
          })}

          <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
            Water (ml)
          </Text>
          {weeklyTrackers.map((d) => {
            const pct = maxWater ? (d.water / maxWater) * 100 : 0;
            return (
              <MiniBarRow
                key={d.key + "-water"}
                label={d.label}
                value={`${Math.round(d.water)} ml`}
                pct={pct}
                colors={[
                  AppTheme.colors.sky || AppTheme.colors.primary,
                  AppTheme.colors.primary,
                ]}
              />
            );
          })}

          <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
            Sleep (hrs)
          </Text>
          {weeklyTrackers.map((d) => {
            const pct = maxSleep ? (d.sleep / maxSleep) * 100 : 0;
            return (
              <MiniBarRow
                key={d.key + "-sleep"}
                label={d.label}
                value={`${d.sleep.toFixed(1)} h`}
                pct={pct}
                colors={["#C4B5FD", "#8B5CF6"]}
              />
            );
          })}

          <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
            Workout (units)
          </Text>
          {weeklyTrackers.map((d) => {
            const pct = maxWorkout ? (d.workout / maxWorkout) * 100 : 0;
            return (
              <MiniBarRow
                key={d.key + "-workout"}
                label={d.label}
                value={Math.round(d.workout).toString()}
                pct={pct}
                colors={[AppTheme.colors.primary, "#F97316"]}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function MiniBarRow({ label, value, pct, colors }) {
  return (
    <View style={styles.miniRow}>
      <Text style={styles.miniLabel}>{label}</Text>
      <View style={styles.miniTrack}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.miniFill,
            { width: `${Math.min(pct, 100)}%` },
          ]}
        />
      </View>
      <Text style={styles.miniValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.bg,
  },
  header: {
    paddingTop: 48, // slightly more compact
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...AppTheme.shadow.soft,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    ...AppTheme.text.h2,
    color: "#fff",
  },
  headerSub: {
    ...AppTheme.text.small,
    color: "#E0F2E9",
    marginTop: 2,
  },
  ringsRow: {
    flexDirection: "row",
    marginTop: 16,
    justifyContent: "space-between",
  },
  ringBlock: {
    alignItems: "center",
    flex: 1,
  },
  ringLabel: {
    fontSize: 13,
    color: "#E5E7EB",
    marginBottom: 4,
  },
  ringOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  ringUnit: {
    fontSize: 10,
    color: "#E5E7EB",
    marginTop: 1,
  },
  ringPct: {
    fontSize: 11,
    color: "#BBF7D0",
    marginTop: 2,
  },
  ringGoal: {
    fontSize: 11,
    color: "#D1FAE5",
    marginTop: 4,
  },
  insightsRow: {
    flexDirection: "row",
    marginTop: 14,
  },
  insightCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 14,
    padding: 10,
    marginHorizontal: 4,
  },
  insightLabel: {
    fontSize: 11,
    color: "#E0F2E9",
  },
  insightValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
  },
  insightSub: {
    fontSize: 10,
    color: "#C7F0DD",
    marginTop: 2,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: AppTheme.colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
  },
  cardTitle: {
    ...AppTheme.text.h2,
    marginBottom: 2,
  },
  cardSubtitle: {
    ...AppTheme.text.small,
    color: AppTheme.colors.subtext,
    marginBottom: 10,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  barLabel: {
    width: 40,
    fontSize: 12,
    color: AppTheme.colors.subtext,
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
    overflow: "hidden",
    position: "relative",
  },
  barFill: {
    height: "100%",
    borderRadius: 6,
  },
  goalLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#F97316",
    transform: [{ translateX: -1 }],
  },
  barValue: {
    width: 80,
    textAlign: "right",
    fontSize: 12,
    color: AppTheme.colors.subtext,
  },
  sectionLabel: {
    ...AppTheme.text.h3,
    marginBottom: 4,
  },
  miniRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  miniLabel: {
    width: 40,
    fontSize: 12,
    color: AppTheme.colors.subtext,
  },
  miniTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
    overflow: "hidden",
  },
  miniFill: {
    height: "100%",
    borderRadius: 999,
  },
  miniValue: {
    width: 70,
    fontSize: 12,
    textAlign: "right",
    color: AppTheme.colors.subtext,
  },
  emptyState: {
  padding: 24,
  alignItems: "center",
},
emptyTitle: {
  fontSize: 16,
  fontWeight: "700",
  color: AppTheme.colors.text,
},
emptySub: {
  marginTop: 6,
  fontSize: 13,
  color: AppTheme.colors.subtext,
  textAlign: "center",
},
});
