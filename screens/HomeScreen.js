// screens/HomeScreen.js
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import AppTheme from "../constants/AppTheme";
import { useUser } from "../context/UserContext";
import { useAppData } from "../context/AppDataContext";
import { useTrackers } from "../context/TrackerContext";
import AddTrackerEntrySheet from "../components/AddTrackerEntrySheet";
import TrackerChoiceSheet from "../components/TrackerChoiceSheet";

/* -------------------------------------------
   DATE HELPERS
--------------------------------------------*/
function formatDateLabel(dateString) {
  try {
    const d = new Date(dateString);
    const options = { weekday: "short", month: "short", day: "numeric" };
    return d.toLocaleDateString("en-US", options);
  } catch {
    return "Today";
  }
}

function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let matrix = [];
  let row = [];

  for (let i = 0; i < offset; i++) row.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    row.push(d);
    if (row.length === 7) {
      matrix.push(row);
      row = [];
    }
  }

  if (row.length > 0) {
    while (row.length < 7) row.push(null);
    matrix.push(row);
  }

  return matrix;
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { userData, loadingUser } = useUser();
  const { today, getTotals, loading: loadingDiary } = useAppData();
  const { todaySummary, getSummaryForDate, loadingTrackers } = useTrackers();

  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const initial = new Date();
  const [currentYear, setCurrentYear] = useState(initial.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initial.getMonth());

  const [trackerSheetVisible, setTrackerSheetVisible] = useState(false);
  const [choiceVisible, setChoiceVisible] = useState(false);
  const [activeTracker, setActiveTracker] = useState(null);

  const totals = useMemo(() => getTotals(selectedDate), [getTotals, selectedDate]);

  /* -------------------------------------------
     IMPORT CORRECT GOALS FROM USERDATA
  --------------------------------------------*/

  const calorieGoal = userData?.calories || 2000;
  const stepsGoal = userData?.stepsGoal || 8000;
  const waterGoal = userData?.waterGoal || 2000;
  const sleepGoal = userData?.sleepGoal || 7;
  const weightGoal = userData?.weightGoal || userData?.weight || 70;

  const caloriePercent = useMemo(() => {
    if (!calorieGoal) return 0;
    return Math.round(((totals.calories || 0) / calorieGoal) * 100);
  }, [totals.calories, calorieGoal]);

  const selectedSummary = useMemo(() => {
    if (typeof getSummaryForDate === "function") {
      return getSummaryForDate(selectedDate) || {};
    }
    return todaySummary || {};
  }, [getSummaryForDate, selectedDate, todaySummary]);

  const steps = selectedSummary.steps || 0;
  const water = selectedSummary.water || 0;
  const sleep = selectedSummary.sleep || 0;
  const workout = selectedSummary.workout || 0;
  const weight = selectedSummary.weight || userData?.weight || 70;

  const goToFoodDiary = useCallback(() => navigation.navigate("FoodDiary"), [navigation]);
  const goToScan = useCallback(() => navigation.navigate("ScanScreen"), [navigation]);
  const goToAnalytics = useCallback(() => navigation.navigate("Analytics"), [navigation]);
  const goToFoodInput = useCallback(() => navigation.navigate("FoodInputHub"), [navigation]);
  const goToProfile = useCallback(() => navigation.navigate("Profile"), [navigation]);

  const trackerConfigs = {
    water: { id: "water", label: "Water", unit: "ml" },
    steps: { id: "steps", label: "Steps", unit: "steps" },
    sleep: { id: "sleep", label: "Sleep", unit: "hours" },
    workout: { id: "workout", label: "Workout", unit: "minutes" },
    weight: { id: "weight", label: "Weight", unit: "kg" },
  };

  const handleTracker = useCallback((key) => {
    const cfg = trackerConfigs[key];
    if (!cfg) return;
    setActiveTracker(cfg);
    setTrackerSheetVisible(true);
  }, []);

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monthMatrix = useMemo(() => getMonthMatrix(currentYear, currentMonth), [currentYear, currentMonth]);

  const pickDate = useCallback(
    (day) => {
      if (!day) return;
      const formatted = `${currentYear}-${String(currentMonth + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      setSelectedDate(formatted);
      setCalendarVisible(false);
    },
    [currentYear, currentMonth]
  );

  const goPrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else setCurrentMonth((m) => m - 1);
  }, [currentMonth]);

  const goNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else setCurrentMonth((m) => m + 1);
  }, [currentMonth]);

  const jumpToToday = useCallback(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    setCurrentYear(y);
    setCurrentMonth(m);
    setSelectedDate(`${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }, []);

  const isLoading = loadingUser || loadingDiary || loadingTrackers;
  const greetingName = userData?.name?.split(" ")[0] || "there";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* HEADER */}
        <LinearGradient colors={AppTheme.gradient.header} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.helloText}>Hi, {greetingName} 👋</Text>
              <Text style={styles.dateText}>{formatDateLabel(selectedDate)}</Text>

              <TouchableOpacity
                style={styles.calendarChip}
                onPress={() => setCalendarVisible((prev) => !prev)}
              >
                <Ionicons name="calendar-outline" size={16} color="#fff" />
                <Text style={styles.calendarChipText}>{formatDateLabel(selectedDate)}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={goToProfile}>
              <Ionicons name="person-circle-outline" size={38} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* CALORIE RING */}
          <View style={styles.calorieRow}>
            <View style={styles.calorieCircleWrap}>
              <View style={styles.calorieCircleOuter}>
                <View style={styles.calorieCircleInner}>
                  <Text style={styles.calorieMain}>{(totals.calories || 0).toFixed(1)}</Text>
                  <Text style={styles.calorieUnit}>kcal</Text>
                  <Text style={styles.caloriePercent}>
                    {isNaN(caloriePercent) ? 0 : caloriePercent}%
                  </Text>
                </View>
              </View>
            </View>

            <View>
              <Text style={styles.calorieLabel}>Daily Goal</Text>
              <Text style={styles.calorieGoal}>{calorieGoal} kcal</Text>
            </View>
          </View>

          {/* QUICK BUTTONS */}
          <View style={styles.quickRow}>
            <QuickBtn icon="scan-outline" label="Scan" onPress={goToScan} />
            <QuickBtn icon="add-circle-outline" label="Add food" onPress={goToFoodInput} />
            <QuickBtn icon="stats-chart-outline" label="Analytics" onPress={goToAnalytics} />
            <QuickBtn icon="apps-outline" label="Trackers" onPress={() => setChoiceVisible(true)} />
          </View>
        </LinearGradient>
        {/* CALENDAR */}
        {calendarVisible && (
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={goPrevMonth}>
                <Ionicons name="chevron-back" size={24} color="#000" />
              </TouchableOpacity>

              <Text style={styles.calendarTitle}>
                {new Date(currentYear, currentMonth).toLocaleString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>

              <TouchableOpacity onPress={goNextMonth}>
                <Ionicons name="chevron-forward" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.todayBtn} onPress={jumpToToday}>
              <Text style={styles.todayBtnText}>Jump to Today</Text>
            </TouchableOpacity>

            <View style={styles.weekRow}>
              {weekDays.map((w) => (
                <Text key={w} style={styles.weekLabel}>
                  {w}
                </Text>
              ))}
            </View>

            {monthMatrix.map((row, i) => (
              <View key={i} style={styles.weekRow}>
                {row.map((day, j) => {
                  const isSelected =
                    day &&
                    selectedDate ===
                      `${currentYear}-${String(currentMonth + 1).padStart(
                        2,
                        "0"
                      )}-${String(day).padStart(2, "0")}`;

                  return (
                    <TouchableOpacity
                      key={j}
                      style={[
                        styles.dayCell,
                        isSelected && styles.daySelected,
                      ]}
                      onPress={() => pickDate(day)}
                      activeOpacity={day ? 0.7 : 1}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !day && { opacity: 0.2 },
                          isSelected && styles.dayTextSelected,
                        ]}
                      >
                        {day || ""}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* BODY CONTENT */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={AppTheme.colors.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.body}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >

            {/* ------------ NUTRITION CARD ------------ */}
            <Text style={styles.sectionTitle}>Nutrition</Text>

            <View style={styles.nutritionCard}>
              <View style={styles.nutriRow}>
                <Text style={styles.nutriLabel}>Calories</Text>
                <Text style={styles.nutriValue}>
                  {(totals.calories || 0).toFixed(1)} / {(userData?.calories || 2000).toFixed(1)} kcal
                </Text>
              </View>

              <View style={styles.nutriRow}>
                <Text style={styles.nutriLabel}>Protein</Text>
                <Text style={styles.nutriValue}>
                  {(totals.protein || 0).toFixed(1)}g / {(userData?.protein || 80).toFixed(1)}g
                </Text>
              </View>

              <View style={styles.nutriRow}>
                <Text style={styles.nutriLabel}>Carbs</Text>
                <Text style={styles.nutriValue}>
                  {(totals.carbs || 0).toFixed(1)}g / {(userData?.carbs || 250).toFixed(1)}g
                </Text>
              </View>

              <View style={styles.nutriRow}>
                <Text style={styles.nutriLabel}>Fat</Text>
                <Text style={styles.nutriValue}>
                  {(totals.fat || 0).toFixed(1)}g / {(userData?.fat || 70).toFixed(1)}g
                </Text>
              </View>
            </View>

            {/* ------------ ACTIVITY SECTION ------------ */}
            <Text style={styles.sectionTitle}>Activity</Text>

            {/* ROW 1 */}
            <View style={styles.activityGrid}>
              <ActivityCard
                icon="walk-outline"
                label="Steps"
                value={steps.toLocaleString()}
                sub={`${stepsGoal} goal`}
                onPress={() => handleTracker("steps")}
              />

              <ActivityCard
                icon="water-outline"
                label="Water"
                value={`${water} ml`}
                sub={`${waterGoal} ml goal`}
                onPress={() => handleTracker("water")}
              />
            </View>

            {/* ROW 2 */}
            <View style={styles.activityGrid}>
              <ActivityCard
                icon="moon-outline"
                label="Sleep"
                value={`${sleep} h`}
                sub={`${sleepGoal}h goal`}
                onPress={() => handleTracker("sleep")}
              />

              <ActivityCard
                icon="barbell-outline"
                label="Workout"
                value={`${workout} min`}
                sub="Tap to log"
                onPress={() => handleTracker("workout")}
              />
            </View>

            {/* ROW 3 */}
            <View style={styles.activityGrid}>
              <ActivityCard
                icon="body-outline"
                label="Weight"
                value={`${weight} kg`}
                sub={`Goal ${weightGoal} kg`}
                onPress={() => handleTracker("weight")}
              />

              <ActivityCard
                icon="restaurant-outline"
                label="Food diary"
                value={`${totals.calories || 0} kcal`}
                sub="View meals"
                onPress={goToFoodDiary}
              />
            </View>
          </ScrollView>
        )}

        {/* Sheets */}
        <TrackerChoiceSheet
          visible={choiceVisible}
          onClose={() => setChoiceVisible(false)}
          onSelect={(id) => {
            setChoiceVisible(false);
            if (id === "food") return goToFoodDiary();
            handleTracker(id);
          }}
        />

        <AddTrackerEntrySheet
          visible={trackerSheetVisible}
          onClose={() => setTrackerSheetVisible(false)}
          tracker={activeTracker}
        />
      </View>
    </SafeAreaView>
  );
}

/* -------------------------------------------
   COMPONENTS
--------------------------------------------*/
function QuickBtn({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress}>
      <View style={styles.quickIconWrap}>
        <Ionicons name={icon} size={22} color={AppTheme.colors.primary} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActivityCard({ icon, label, value, sub, onPress }) {
  return (
    <TouchableOpacity style={styles.activityCard} onPress={onPress}>
      <View style={styles.activityHeader}>
        <View style={styles.activityIconWrap}>
          <Ionicons name={icon} size={20} color={AppTheme.colors.primary} />
        </View>
        <Text style={styles.activityLabel}>{label}</Text>
      </View>

      <Text style={styles.activityValue}>{value}</Text>
      <Text style={styles.activitySub}>{sub}</Text>
    </TouchableOpacity>
  );
}

/* -------------------------------------------
   STYLES
--------------------------------------------*/
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppTheme.colors.bg },
  container: { flex: 1 },

  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  helloText: { fontSize: 20, fontWeight: "800", color: "#fff" },
  dateText: { fontSize: 13, color: "#E0F2E9", marginTop: 2 },

  calendarChip: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.23)",
  },

  calendarChipText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "700",
    fontSize: 12,
  },

  calorieRow: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
  },

  calorieCircleWrap: { width: 120, alignItems: "center" },
  calorieCircleOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 10,
    borderColor: "rgba(255,255,255,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  calorieCircleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  calorieMain: { fontSize: 20, fontWeight: "800", color: "#fff" },
  calorieUnit: { color: "#eee", fontSize: 11 },
  caloriePercent: { color: "#BBF7D0", marginTop: 2 },

  calorieLabel: { color: "#E0F2E9", fontSize: 13 },
  calorieGoal: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 4 },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },

  quickBtn: { flex: 1, alignItems: "center" },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  quickLabel: { color: "#fff", marginTop: 4 },

  /* CALENDAR */
  calendarContainer: {
    margin: 16,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 16,
  },

  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  calendarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },

  todayBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: AppTheme.colors.primarySoft,
    marginBottom: 8,
  },

  todayBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: AppTheme.colors.primary,
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  weekLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
  },

  dayCell: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },

  dayText: { fontSize: 15, color: "#222" },

  daySelected: { backgroundColor: AppTheme.colors.primarySoft },

  dayTextSelected: { fontWeight: "700", color: AppTheme.colors.primary },

  /* BODY */
  body: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },

  nutritionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },

  nutriRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },

  nutriLabel: { fontSize: 14, fontWeight: "600", color: "#444" },

  nutriValue: {
    fontSize: 14,
    fontWeight: "700",
    color: AppTheme.colors.primary,
  },

  activityGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  activityCard: {
    backgroundColor: "#fff",
    width: "48%",
    borderRadius: 18,
    padding: 14,
  },

  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  activityIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppTheme.colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },

  activityLabel: {
    fontSize: 13,
    fontWeight: "700",
  },

  activityValue: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },

  activitySub: {
    fontSize: 11,
    color: "#777",
    marginTop: 2,
  },

  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
