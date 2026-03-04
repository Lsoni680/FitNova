console.log("✅ NutritionScreen LOADED v2");
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AppTheme from "../constants/AppTheme";
import { analyzeFood, UNITS, shouldPreferCooked, getDefaultUnitForFood } from "../services/nutritionEngine";

/* =========================================================
   CONFIG
========================================================= */

const PRIVACY_CONSENT_KEY = "fitnova_privacy_consent_v1";

const HEALTH_DISCLAIMER =
  "Nutrition values are estimates for informational purposes only. " +
  "This app does not provide medical advice. Consult a qualified health professional for guidance.";

/* =========================================================
   COMPONENT
========================================================= */

export default function NutritionScreen({ navigation, route }) {
  const preFood =
  route?.params?.food && route.params.food !== "Food"
  ? route.params.food
  : "";
  const preQty = route?.params?.quantity || "1";
  const preUnit = route?.params?.unit || "";

  const [food, setFood] = useState(preFood);
  const [quantity, setQuantity] = useState(String(preQty));
  const [unit, setUnit] = useState(preUnit || (preFood ? getDefaultUnitForFood(preFood) : "pieces"));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nutrition, setNutrition] = useState(null);

  const [unitModalVisible, setUnitModalVisible] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const consentLoaded = useRef(false);

  /* ---------- Load Consent ---------- */
  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(PRIVACY_CONSENT_KEY);
        setPrivacyConsent(v === "1");
      } catch {
        setPrivacyConsent(false);
      } finally {
        consentLoaded.current = true;
      }
    })();
  }, []);

  const acceptConsent = async () => {
    try {
      await AsyncStorage.setItem(PRIVACY_CONSENT_KEY, "1");
    } catch {}
    setPrivacyConsent(true);
  };

  /* ---------- Smart unit defaults (NO UI CHANGE) ---------- */
  useEffect(() => {
    const f = String(food || "").trim();
    if (!f) return;
    setUnit(getDefaultUnitForFood(f));
  }, [food]);

  /* ---------- ANALYZE (ENGINE ONLY) ---------- */
  const handleAnalyze = async () => {
  try {
    setError("");
    setNutrition(null);

    if (!food.trim() || food.trim().toLowerCase() === "food") {
      setError("Please enter a food name.");
      return;
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError("Enter a valid quantity.");
      return;
    }

    if (!privacyConsent) {
      Alert.alert(
        "Privacy Consent",
        "FitNova uses nutrition data via our secure Firebase server.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Allow", onPress: acceptConsent },
        ]
      );
      return;
    }

    setLoading(true);

    console.log("🧪 [NutritionScreen] analyze request", {
      foodName: food.trim(),
      qty,
      unit,
    });

    const preferCooked = shouldPreferCooked(food.trim(), unit);

    const result = await analyzeFood({
      foodName: food.trim(),
      quantity: qty,
      unitValue: unit,
      preferredCooked: preferCooked,
    });

    if (!result?.ok) {
      throw new Error(result?.error || "Gateway failed");
    }

    // SINGLE SOURCE OF TRUTH
    setNutrition(result.scaledMacros);
  } catch (e) {
    console.log("❌ [NutritionScreen] analyze error:", e?.message || e);
    setError("Could not fetch data. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const unitLabel = UNITS.find((u) => u.value === unit)?.label || "Pieces";

  /* ================= UI (UNCHANGED) ================= */

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={AppTheme.gradient.header} style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate("Home"); // or Diary screen
         }}
    >
         <Ionicons name="chevron-back" size={22} color="#fff" />
      </TouchableOpacity>


        <Text style={styles.title}>Nutrition Analysis</Text>
        <Text style={styles.subtitle}>Verified + USDA via Secure Server</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Food</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. egg, rice, apple, sushi"
            placeholderTextColor="#64748B"
            value={food}
            onChangeText={setFood}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>Quantity</Text>
              <TextInput
                style={[styles.input, { marginBottom: 0 }]}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="1"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={{ width: 150 }}>
              <Text style={styles.subLabel}>Unit</Text>
              <TouchableOpacity style={styles.unitBtn} onPress={() => setUnitModalVisible(true)}>
                <Text style={styles.unitText}>{unitLabel}</Text>
                <Ionicons name="chevron-down" size={18} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.analyzeText}>Analyze Nutrition</Text>}
          </TouchableOpacity>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Text style={styles.disclaimer}>{HEALTH_DISCLAIMER}</Text>
        </View>

        {nutrition && (
          <View style={styles.card}>
            <Text style={styles.section}>Nutrition Summary</Text>

            <View style={styles.grid}>
              {[
                ["Calories", `${nutrition.calories} kcal`],
                ["Protein", `${nutrition.protein} g`],
                ["Carbs", `${nutrition.carbs} g`],
                ["Fat", `${nutrition.fat} g`],
              ].map(([k, v]) => (
                <View key={k} style={styles.macro}>
                  <Text style={styles.macroVal}>{v}</Text>
                  <Text style={styles.macroKey}>{k}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.grams}>Estimated weight: {nutrition.grams} g</Text>
          </View>
        )}
      </ScrollView>

      {/* UNIT MODAL (UNCHANGED) */}
      <Modal
        visible={unitModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUnitModalVisible(false)}
      >
        <View style={styles.unitOverlay}>
          <View style={styles.unitSheet}>
            <Text style={styles.unitTitle}>Select Unit</Text>

            <ScrollView>
              {UNITS.map((u) => {
                const active = u.value === unit;
                return (
                  <TouchableOpacity
                    key={u.value}
                    style={[styles.unitItem, active && styles.unitItemActive]}
                    onPress={() => {
                      setUnit(u.value);
                      setUnitModalVisible(false);
                    }}
                  >
                    <Text style={[styles.unitItemText, active && styles.unitItemTextActive]}>
                      {u.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.unitCloseBtn} onPress={() => setUnitModalVisible(false)}>
              <Text style={styles.unitCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= STYLES (UNCHANGED) ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { padding: 18, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "900", color: "#fff" },
  subtitle: { color: "#E2E8F0", fontSize: 13 },
  content: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  label: { fontWeight: "800", marginBottom: 6 },
  subLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 6,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    marginBottom: 10,
    color: "#0F172A",
    fontWeight: "700",
  },
  row: { flexDirection: "row", gap: 10, alignItems: "flex-end", marginBottom: 10 },
  unitBtn: {
    width: 150,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  unitText: { fontWeight: "700", color: "#0F172A" },
  analyzeBtn: {
    marginTop: 14,
    backgroundColor: AppTheme.colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  analyzeText: { color: "#fff", fontWeight: "900" },
  error: { marginTop: 10, color: "#DC2626", fontWeight: "700", textAlign: "center" },
  section: { fontSize: 16, fontWeight: "900", marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  macro: {
    width: "48%",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  macroVal: { fontSize: 18, fontWeight: "900", color: AppTheme.colors.primary },
  macroKey: { marginTop: 4, fontSize: 12, fontWeight: "700", color: "#475569" },
  grams: { textAlign: "center", fontSize: 13, fontWeight: "700", color: "#334155" },

  disclaimer: {
    marginTop: 10,
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  unitOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  unitSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 16,
    maxHeight: "75%",
  },
  unitTitle: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 14,
  },
  unitItem: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  unitItemActive: {
    borderColor: AppTheme.colors.primary,
    backgroundColor: "#F0FDFA",
  },
  unitItemText: { textAlign: "center", fontWeight: "800" },
  unitItemTextActive: { color: AppTheme.colors.primary },
  unitCloseBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  unitCloseText: { color: "#fff", fontWeight: "900", fontSize: 16 },
});
