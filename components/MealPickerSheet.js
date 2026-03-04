import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppTheme from "../constants/AppTheme";
import { useNavigation } from "@react-navigation/native";
import { auth } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";

const STORAGE_KEY = "food_diary_entries_v1";

const MEAL_TYPES = [
  "Breakfast",
  "Morning Snack",
  "Lunch",
  "Evening Snack",
  "Dinner",
];

const todayKey = () => new Date().toISOString().slice(0, 10);

export default function MealPlanScreen() {
  const navigation = useNavigation();
  const [entries, setEntries] = useState([]);

  // LOAD DATA: LOCAL + FIREBASE SYNC
  const loadEntries = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      let localEntries = json ? JSON.parse(json) : [];

      // 🔥 If user logged in → merge with Firestore
      const user = auth.currentUser;
      if (user) {
        const q = query(
          collection(db, "foodDiary"),
          where("userId", "==", user.uid),
          where("date", "==", todayKey())
        );
        const snap = await getDocs(q);
        const cloudEntries = snap.docs.map((doc) => doc.data());

        // merge local + cloud (cloud wins)
        const merged = [...localEntries, ...cloudEntries];
        setEntries(merged);
      } else {
        setEntries(localEntries);
      }
    } catch (e) {
      console.warn("Load meal plan failed:", e);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const grouped = MEAL_TYPES.map((type) => ({
    mealType: type,
    items: entries.filter((e) => e.mealType === type),
  }));

  const totalDay = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <View style={{ flex: 1, backgroundColor: AppTheme.colors.bg }}>
      {/* HEADER */}
      <LinearGradient
        colors={AppTheme.gradient.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Your Meal Plan</Text>
        <Text style={styles.headerSubtitle}>
          Daily meals with full macros & details
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.container}>
        {/* DAILY SUMMARY */}
        <View style={[styles.summaryCard, AppTheme.shadow.card]}>
          <Text style={styles.summaryTitle}>Today’s Summary</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryValue}>
                {Math.round(totalDay.calories)}
              </Text>
              <Text style={styles.summaryLabel}>Calories</Text>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryValue}>
                {totalDay.protein.toFixed(0)}g
              </Text>
              <Text style={styles.summaryLabel}>Protein</Text>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryValue}>
                {totalDay.carbs.toFixed(0)}g
              </Text>
              <Text style={styles.summaryLabel}>Carbs</Text>
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryValue}>
                {totalDay.fat.toFixed(0)}g
              </Text>
              <Text style={styles.summaryLabel}>Fat</Text>
            </View>
          </View>
        </View>

        {/* GROUPED MEALS */}
        {grouped.map((group) => (
          <View
            key={group.mealType}
            style={[styles.mealSection, AppTheme.shadow.soft]}
          >
            <View style={styles.mealHeader}>
              <Text style={styles.mealTitle}>{group.mealType}</Text>
              <Text style={styles.mealTotal}>
                {Math.round(
                  group.items.reduce((sum, e) => sum + (e.calories || 0), 0)
                )}{" "}
                kcal
              </Text>
            </View>

            {group.items.length === 0 ? (
              <Text style={styles.emptyText}>No items added yet.</Text>
            ) : (
              group.items.map((item, idx) => (
                <View key={idx} style={[styles.foodCard, AppTheme.shadow.card]}>
                  <Text style={styles.foodName}>🍲 {item.foodName}</Text>

                  <Text style={styles.foodLine}>
                    ⚡ Calories:{" "}
                    <Text style={styles.foodValue}>
                      {Math.round(item.calories)} kcal
                    </Text>
                  </Text>

                  <Text style={styles.foodLine}>
                    🥩 Protein:{" "}
                    <Text style={styles.foodValue}>
                      {item.protein.toFixed(1)} g
                    </Text>
                  </Text>

                  <Text style={styles.foodLine}>
                    🍞 Carbs:{" "}
                    <Text style={styles.foodValue}>
                      {item.carbs.toFixed(1)} g
                    </Text>
                  </Text>

                  <Text style={styles.foodLine}>
                    🧈 Fat:{" "}
                    <Text style={styles.foodValue}>
                      {item.fat.toFixed(1)} g
                    </Text>
                  </Text>
                </View>
              ))
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    ...AppTheme.shadow.soft,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  headerSubtitle: {
    marginTop: 6,
    color: "#E0F2E9",
    fontSize: 14,
  },
  container: { padding: 16 },

  // Summary Card
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppTheme.colors.text,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryBox: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: AppTheme.colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: AppTheme.colors.subtext,
  },

  // Meal Sections
  mealSection: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: AppTheme.colors.text,
  },
  mealTotal: {
    fontSize: 14,
    color: AppTheme.colors.subtext,
  },
  emptyText: {
    fontSize: 13,
    color: AppTheme.colors.subtext,
  },

  // Food Card (Style 3)
  foodCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "700",
    color: AppTheme.colors.text,
    marginBottom: 6,
  },
  foodLine: {
    fontSize: 14,
    color: AppTheme.colors.subtext,
    marginBottom: 4,
  },
  foodValue: {
    color: AppTheme.colors.primary,
    fontWeight: "700",
  },
});
