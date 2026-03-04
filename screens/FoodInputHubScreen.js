import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import debounce from "lodash.debounce";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AppTheme from "../constants/AppTheme";
import { useAppData } from "../context/AppDataContext";

/* ✅ ENGINE (single source of truth) */
import { analyzeFood, UNITS, getDefaultUnitForFood, shouldPreferCooked } from "../services/nutritionEngine";

/* =========================================================
   GOOGLE/PLAY POLICY:
   This screen must NOT call 3rd-party APIs directly.
   It calls our secure server (Firebase Gen-2 / Cloud Run) only.
========================================================= */

const PRIVACY_CONSENT_KEY = "fitnova_privacy_consent_external_services_v1";

const HEALTH_DISCLAIMER =
  "Nutrition values are estimates for informational purposes only. " +
  "This app does not provide medical advice. Always consult a qualified " +
  "health professional for dietary or medical guidance.";

const MEAL_TYPES = [
  "Breakfast",
  "Morning Snack",
  "Lunch",
  "Evening Snack",
  "Dinner",
];

/* ✅ If you want to remove suggestion list from UI, keep false */
const SHOW_SUGGESTIONS = true;

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatMacro(v, unit = "g") {
  if (v === null || v === undefined) return "--";
  const n = safeNum(v, null);
  if (n === null) return "--";
  return unit === "kcal" ? `${Math.round(n)} kcal` : `${n}${unit}`;
}

export default function FoodInputHubScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { today, addMeal } = useAppData();

  const initialDate = route.params?.date || today;
  const [date] = useState(initialDate);

  const [food, setFood] = useState(route.params?.prefillFood || "");
  const [unit, setUnit] = useState(route.params?.prefillUnit || (route.params?.prefillFood ? getDefaultUnitForFood(route.params.prefillFood) : "pieces"));
  const [quantity, setQuantity] = useState(
    route.params?.prefillQty ? String(route.params.prefillQty) : "1"
  );

  const [mealType, setMealType] = useState(
    route.params?.initialMealType || "Breakfast"
  );

  const [foodSuggestions, setFoodSuggestions] = useState([]);
  const [nutritionData, setNutritionData] = useState(null);
  const [scaledMacros, setScaledMacros] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [unitPickerOpen, setUnitPickerOpen] = useState(false);
  const [mealPickerOpen, setMealPickerOpen] = useState(false);

  const [privacyConsent, setPrivacyConsent] = useState(false);
  const consentLoadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(PRIVACY_CONSENT_KEY);
        setPrivacyConsent(v === "1");
      } catch {
        setPrivacyConsent(false);
      } finally {
        consentLoadedRef.current = true;
      }
    })();
  }, []);

  const askPrivacyConsent = async () => {
    Alert.alert(
      "External Services Consent",
      "To search foods and analyze nutrition, FitNova uses external services via our secure server. Do you allow this?",
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Allow",
          onPress: async () => {
            try {
              await AsyncStorage.setItem(PRIVACY_CONSENT_KEY, "1");
              setPrivacyConsent(true);
            } catch {
              setPrivacyConsent(true);
            }
          },
        },
      ]
    );
  };

  const onFoodChange = (txt) => {
    setFood(txt);
    setNutritionData(null);
    setScaledMacros(null);
    setErrorMsg("");
    fetchSuggestions(txt);

    // ✅ keep your smart unit behavior without breaking UI
    const f = String(txt || "").trim();
    if (f) setUnit(getDefaultUnitForFood(f));
  };

  const onQuantityChange = (txt) => {
    const cleaned = txt.replace(/[^0-9.]/g, "");
    setQuantity(cleaned);
    setScaledMacros(null);
    setErrorMsg("");
  };

  const fetchSuggestions = async (txt) => {
  try {
    if (!txt || txt.length < 2) {
      setFoodSuggestions([]);
      return;
    }

    console.log("🧪 [FoodInputHub] backend request", {
      foodName: txt,
    });

    const result = await analyzeFood({
      foodName: txt.trim(),
      quantity: 1,
      unitValue: "pieces",
    });

    // ✅ Backend returns direct object
    if (result?.foodName) {
      setFoodSuggestions([result.foodName]);
    } else {
      setFoodSuggestions([txt.trim()]);
    }
  } catch (e) {
    console.log("USDA suggestion error:", e);
    setFoodSuggestions([txt.trim()]);
  }
};


  const applySuggestion = (name) => {
    setFood(name);
    setFoodSuggestions([]);
    setNutritionData(null);
    setScaledMacros(null);
    setErrorMsg("");
    if (name) setUnit(getDefaultUnitForFood(name));
  };

  // ✅ ENGINE-ONLY nutrition fetch (NO duplicates anywhere else)
  const fetchNutrition = async () => {
    const foodName = food.trim();
    if (!foodName) {
      setErrorMsg("Please enter a food name.");
      return;
    }

    const qty = safeNum(quantity, 0);
    if (!qty || qty <= 0) {
      setErrorMsg("Please enter a valid quantity.");
      return;
    }

    if (!privacyConsent) {
      await askPrivacyConsent();
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setFoodSuggestions([]);

    try {
  console.log("🧪 [FoodInputHub] analyze request", {
    foodName,
    qty,
    unit,
  });

  const preferCooked = shouldPreferCooked(foodName, unit);

  const result = await analyzeFood({
    foodName,
    quantity: qty,
    unitValue: unit,
    preferredCooked: preferCooked,
  });

  if (!result?.ok) {
    throw new Error(result?.error || "Gateway request failed");
  }

  setNutritionData(result);
  setScaledMacros(result.scaledMacrosDiary);
} catch (err) {
  console.error("Gateway analyze error:", err);
  setErrorMsg("Could not fetch nutrition data. Please try again.");
  setNutritionData(null);
  setScaledMacros(null);
}
 finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!scaledMacros) {
      Alert.alert("Missing data", "Please analyze nutrition before saving.");
      return;
    }

    const foodName = food.trim();
    if (!foodName) {
      Alert.alert("Missing food", "Please enter a food name.");
      return;
    }

    setSaving(true);
    try {
      await addMeal(date, mealType, {
        food: foodName,
        quantity: String(quantity),
        unit,
        calories: safeNum(scaledMacros.Calories, 0),
        protein: safeNum(scaledMacros.Protein, 0),
        carbs: safeNum(scaledMacros.Carbohydrates, 0),
        fat: safeNum(scaledMacros.Fat, 0),
        grams: safeNum(scaledMacros.grams, 0),
        source: nutritionData?.source || "engine",
      });

      Alert.alert("Saved", "Meal saved to your diary.");
      navigation.navigate("FoodDiary");
    } catch (e) {
      Alert.alert("Error", "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const selectedUnitLabel = useMemo(() => {
    return UNITS.find((u) => u.value === unit)?.label || unit;
  }, [unit]);

  const macroCards = useMemo(() => {
    const m = scaledMacros || {};
    return [
      { k: "Calories", v: m.Calories, u: "kcal", icon: "flame" },
      { k: "Protein", v: m.Protein, u: "g", icon: "barbell" },
      { k: "Carbohydrates", v: m.Carbohydrates, u: "g", icon: "nutrition" },
      { k: "Fat", v: m.Fat, u: "g", icon: "water" },
    ];
  }, [scaledMacros]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: AppTheme.colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient colors={AppTheme.gradient.header} style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => {
                if (navigation.canGoBack()) navigation.goBack();
                else navigation.navigate("Home");
              }}
              style={styles.headerBack}
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Add Food</Text>

            <TouchableOpacity
              style={styles.headerScan}
              onPress={() => navigation.navigate("ScanScreen")}
            >
              <Ionicons name="scan-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.headerSub}>
            Add food to: <Text style={{ fontWeight: "800" }}>{mealType}</Text>
          </Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Food Name</Text>

          <View style={styles.inputWrap}>
            <Ionicons
              name="search-outline"
              size={18}
              color={AppTheme.colors.muted}
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={styles.input}
              placeholder="e.g. Boiled egg, chicken biryani..."
              placeholderTextColor={AppTheme.colors.muted}
              value={food}
              onChangeText={onFoodChange}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={fetchNutrition}
            />
          </View>

          {SHOW_SUGGESTIONS && !!foodSuggestions.length && (
            <View style={styles.suggestionsWrap}>
              {foodSuggestions.map((sug) => (
                <TouchableOpacity
                  key={sug}
                  style={styles.suggestionItem}
                  onPress={() => applySuggestion(sug)}
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={16}
                    color={AppTheme.colors.primary}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.suggestionText}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
            Quantity & Unit
          </Text>

          <View style={styles.qtyRow}>
            <View style={[styles.inputWrap, { flex: 1, marginRight: 10 }]}>
              <Ionicons
                name="calculator-outline"
                size={18}
                color={AppTheme.colors.muted}
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor={AppTheme.colors.muted}
                value={quantity}
                onChangeText={onQuantityChange}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>

            <TouchableOpacity
              style={styles.unitBtn}
              onPress={() => setUnitPickerOpen(true)}
            >
              <Text style={styles.unitBtnText}>{selectedUnitLabel}</Text>
              <Ionicons name="chevron-down" size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Meal Type</Text>

          <TouchableOpacity
            style={styles.mealBtn}
            onPress={() => setMealPickerOpen(true)}
          >
            <Ionicons
              name="fast-food-outline"
              size={18}
              color={AppTheme.colors.primary}
              style={{ marginRight: 10 }}
            />
            <Text style={styles.mealBtnText}>{mealType}</Text>
            <Ionicons name="chevron-down" size={18} color="#475569" />
          </TouchableOpacity>

          {!privacyConsent && consentLoadedRef.current && (
            <View style={styles.consentBox}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={AppTheme.colors.primary}
              />
              <Text style={styles.consentText}>
                External services are disabled until you allow consent.
              </Text>
              <TouchableOpacity
                style={styles.consentBtn}
                onPress={askPrivacyConsent}
              >
                <Text style={styles.consentBtnText}>Allow</Text>
              </TouchableOpacity>
            </View>
          )}

          {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          <TouchableOpacity
            style={[
              AppTheme.button(AppTheme.colors.primary),
              styles.analyzeBtn,
              (loading || saving) && { opacity: 0.7 },
            ]}
            onPress={fetchNutrition}
            disabled={loading || saving}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.analyzeBtnText}>Analyze Nutrition</Text>
            )}
          </TouchableOpacity>
        </View>

        {scaledMacros && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Nutrition Summary</Text>

            <View style={styles.macroGrid}>
              {macroCards.map((m) => (
                <View key={m.k} style={styles.macroCard}>
                  <Ionicons
                    name={m.icon}
                    size={18}
                    color={AppTheme.colors.primary}
                  />
                  <Text style={styles.macroKey}>{m.k}</Text>
                  <Text style={styles.macroVal}>
                    {m.u === "kcal" ? formatMacro(m.v, "kcal") : formatMacro(m.v)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.gramsRow}>
              <Text style={styles.gramsText}>
                Estimated grams:{" "}
                <Text style={{ fontWeight: "800" }}>{scaledMacros.grams} g</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[AppTheme.button(AppTheme.colors.primary), styles.saveBtn]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save to Diary</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimerText}>{HEALTH_DISCLAIMER}</Text>
          </View>
        )}

        {/* UNIT PICKER */}
        <Modal
          visible={unitPickerOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setUnitPickerOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Select Unit</Text>

              <FlatList
                data={UNITS}
                keyExtractor={(i) => i.value}
                renderItem={({ item }) => {
                  const active = item.value === unit;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.modalItem,
                        active && styles.modalItemActive,
                      ]}
                      onPress={() => {
                        setUnit(item.value);
                        setUnitPickerOpen(false);
                        setScaledMacros(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          active && styles.modalItemTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />

              <TouchableOpacity
                style={[styles.modalClose, { marginTop: 14 }]}
                onPress={() => setUnitPickerOpen(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* MEAL PICKER */}
        <Modal
          visible={mealPickerOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setMealPickerOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Select Meal</Text>

              <FlatList
                data={MEAL_TYPES}
                keyExtractor={(i) => i}
                renderItem={({ item }) => {
                  const active = item === mealType;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.modalItem,
                        active && styles.modalItemActive,
                      ]}
                      onPress={() => {
                        setMealType(item);
                        setMealPickerOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalItemText,
                          active && styles.modalItemTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />

              <TouchableOpacity
                style={[styles.modalClose, { marginTop: 14 }]}
                onPress={() => setMealPickerOpen(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppTheme.colors.bg },
  header: {
    paddingTop: 70,
    paddingBottom: 28,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBack: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerScan: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: {
    color: "rgba(255,255,255,0.9)",
    marginTop: 10,
    fontSize: 13,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  input: { flex: 1, fontSize: 15, color: "#0f172a" },
  suggestionsWrap: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#fff",
  },
  suggestionText: {
    fontSize: 14,
    color: "#0f172a",
    flex: 1,
    fontWeight: "600",
  },
  qtyRow: { flexDirection: "row", alignItems: "center" },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },
  unitBtnText: {
    fontSize: 13,
    fontWeight: "700",
    marginRight: 8,
    color: "#0f172a",
  },
  mealBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  mealBtnText: { flex: 1, fontSize: 14, color: "#0f172a", fontWeight: "700" },
  analyzeBtn: {
    marginTop: 18,
    borderRadius: 16,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  analyzeBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  errorText: {
    color: "#ef4444",
    marginTop: 10,
    fontWeight: "700",
    fontSize: 13,
  },
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    justifyContent: "space-between",
  },
  macroCard: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  macroKey: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },
  macroVal: { marginTop: 6, fontSize: 15, fontWeight: "900", color: "#0f172a" },
  gramsRow: { marginTop: 4, marginBottom: 10, alignItems: "center" },
  gramsText: { fontSize: 13, color: "#334155", fontWeight: "700" },
  saveBtn: {
    borderRadius: 16,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  disclaimerText: { marginTop: 12, fontSize: 12, color: "#475569", lineHeight: 16 },
  consentBox: {
    marginTop: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  consentText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: "#334155",
    fontWeight: "700",
  },
  consentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: AppTheme.colors.primary,
  },
  consentBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 10,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  modalItemActive: {
    backgroundColor: "#F1F5F9",
    borderColor: AppTheme.colors.primary,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
  },
  modalItemTextActive: { color: AppTheme.colors.primary },
  modalClose: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: { color: "#fff", fontSize: 14, fontWeight: "900" },
});
