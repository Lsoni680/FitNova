// screens/HealthGoalsScreen.js
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import AppTheme from "../constants/AppTheme";
import { useUser } from "../context/UserContext";

/* ==========================================================================
   MAIN SCREEN
   ========================================================================== */
export default function HealthGoalsScreen({ navigation }) {
  const { userData, updateUser } = useUser();

  const userName =
    userData?.firstName ||
    userData?.name ||
    userData?.displayName ||
    "there";

  /* Fade animation */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  /* ==========================================================================
     GOALS STORED IN REF
     ========================================================================== */

  const goalRef = useRef({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    steps: "",
    water: "",
    sleep: "",
    weight: "",
  });

  useEffect(() => {
    if (!userData) return;

    const get = (v, d) => String(v ?? d);

    goalRef.current = {
      calories: get(userData.calories, 2000),
      protein: get(userData.protein, 50),
      carbs: get(userData.carbs, 250),
      fat: get(userData.fat, 70),
      steps: get(userData.stepsGoal, 8000),
      water: get(userData.waterGoal, 2000),
      sleep: get(userData.sleepGoal, 7),
      weight: get(userData.weightGoal ?? userData.weight, 70),
    };
  }, [userData]);

  /* ==========================================================================
     HELPERS
     ========================================================================== */

  const clean = (v) =>
    v?.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "") || "";

  const num = (k) => Number(goalRef.current[k] || 0);

  const calculateSmartGoals = (u) => {
    if (!u) return { calories: 2000, protein: 50, carbs: 250, fat: 70 };

    const w = Number(u.weight || 70);
    const h = Number(u.height || 170);
    const a = Number(u.age || 30);
    const male = u.gender?.toLowerCase().startsWith("m");

    const BMR = male
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;

    const mult = {
      Sedentary: 1.2,
      Light: 1.375,
      Moderate: 1.55,
      Active: 1.725,
      Athlete: 1.9,
    }[u.activity || "Moderate"];

    const calories = Math.round(BMR * mult);
    const protein = Math.round(w * 1.8);
    const fat = Math.round((calories * 0.28) / 9);
    const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

    return { calories, protein, carbs, fat };
  };

  /* ==========================================================================
     SAVE GOALS
     ========================================================================== */
  const saveGoals = async () => {
    if (num("sleep") > 24)
      return Alert.alert("Invalid", "Sleep cannot exceed 24 hours.");

    if (num("steps") > 200000)
      return Alert.alert("Invalid", "Steps goal too high.");

    if (num("calories") > 6000)
      return Alert.alert("Invalid", "Calories unrealistic.");

    try {
      await updateUser({
        calories: num("calories"),
        protein: num("protein"),
        carbs: num("carbs"),
        fat: num("fat"),
        stepsGoal: num("steps"),
        waterGoal: num("water"),
        sleepGoal: num("sleep"),
        weightGoal: num("weight"),
      });
      Alert.alert("Success", "Your goals have been updated.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "Failed to save goals.");
    }
  };

  /* ==========================================================================
     FIELD COMPONENT
     ========================================================================== */

  const Field = ({ icon, label, unit, valueKey }) => (
    <View style={styles.fieldRow}>
      <View style={styles.fieldLeft}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={20} color={AppTheme.colors.primary} />
        </View>
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>

      <View style={styles.fieldRight}>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          defaultValue={goalRef.current[valueKey]}
          placeholder="0"
          onChangeText={(t) => {
            goalRef.current[valueKey] = clean(t);
          }}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
    </View>
  );

  /* CARD WRAPPER */
  const Card = ({ title, children }) => (
    <View style={[styles.card, AppTheme.shadow.card]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  /* ==========================================================================
     RENDER
     ========================================================================== */

  return (
    <View style={styles.safe}>
      {/* HEADER */}
      <LinearGradient colors={AppTheme.gradient.header} style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 🔥 USER ICON + NAME ADDED BACK */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name="person-circle-outline"
            size={22}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.headerGreeting}>Hello, {userName} 👋</Text>
        </View>

        <Text style={styles.headerTitle}>Health Goals</Text>
        <Text style={styles.headerSubtitle}>
          Set your daily nutrition & fitness targets
        </Text>
      </LinearGradient>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 160 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* ❌ RINGS REMOVED */}
            {/* ❌ SMART GOAL BUTTON REMOVED */}

            {/* NUTRITION */}
            <Card title="Nutrition Goals">
              <Field icon="flame-outline" label="Daily Calories" unit="kcal" valueKey="calories" />
              <Field icon="fish-outline" label="Protein" unit="g" valueKey="protein" />
              <Field icon="leaf-outline" label="Carbs" unit="g" valueKey="carbs" />
              <Field icon="pie-chart-outline" label="Fat" unit="g" valueKey="fat" />
            </Card>

            {/* FITNESS */}
            <Card title="Fitness Goals">
              <Field icon="walk-outline" label="Daily Steps" unit="steps" valueKey="steps" />
              <Field icon="water-outline" label="Water Intake" unit="ml" valueKey="water" />
              <Field icon="moon-outline" label="Sleep" unit="hrs" valueKey="sleep" />
              <Field icon="body-outline" label="Weight Goal" unit="kg" valueKey="weight" />
            </Card>

            {/* SAVE BUTTON */}
            <TouchableOpacity style={styles.saveBtn} onPress={saveGoals}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
              <Text style={styles.saveText}>Save Goals</Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

/* ==========================================================================
   STYLES
   ========================================================================== */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppTheme.colors.bg,
  },

  header: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  headerGreeting: {
    color: "#E0F2E9",
    fontSize: 14,
    marginBottom: 4,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#E0F2E9",
    marginTop: 6,
    fontSize: 13,
  },

  container: {
    padding: 20,
    flexGrow: 1,
  },

  /* CARDS */
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
    color: AppTheme.colors.text,
  },

  /* FIELD ROW */
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },

  fieldLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  iconWrap: {
    width: 26,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
  },

  fieldLabel: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "600",
    color: AppTheme.colors.subtext,
  },

  fieldRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 140,
  },

  input: {
    width: 92,
    height: 40,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 4,
  },

  unit: {
    marginLeft: 8,
    fontSize: 14,
    color: AppTheme.colors.subtext,
  },

  /* SAVE BUTTON */
  saveBtn: {
    backgroundColor: AppTheme.colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    ...AppTheme.shadow.soft,
  },

  saveText: {
    marginLeft: 6,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
