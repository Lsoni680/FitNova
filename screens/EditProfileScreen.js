// screens/EditProfileScreen.js
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import AppTheme from "../constants/AppTheme";
import { useUser } from "../context/UserContext";

export default function EditProfileScreen({ navigation }) {
  const { userData, updateUser } = useUser();

  /* -----------------------------------------------------------
      STEP WIZARD
  ----------------------------------------------------------- */
  const [step, setStep] = useState(1);

  /* -----------------------------------------------------------
      FORM STATE
  ----------------------------------------------------------- */
  const [name, setName] = useState(userData?.name || "");
  const [age, setAge] = useState(String(userData?.age || ""));
  const [gender, setGender] = useState(userData?.gender || "");
  const [height, setHeight] = useState(String(userData?.height || ""));
  const [weight, setWeight] = useState(String(userData?.weight || ""));
  const [activity, setActivity] = useState(userData?.activity || "");
  const [diet, setDiet] = useState(userData?.diet || "");
  const [goal, setGoal] = useState(userData?.goal || "maintain");

  /* -----------------------------------------------------------
      DROPDOWN STATE
  ----------------------------------------------------------- */
  const [modalType, setModalType] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  const genderOptions = ["Male", "Female", "Other"];
  const dietOptions = [
    "Balanced",
    "High Protein",
    "Low Carb",
    "Vegetarian",
    "Vegan",
    "Keto",
    "Mediterranean",
  ];
  const activityOptions = [
    "Sedentary",
    "Light",
    "Moderate",
    "Active",
    "Athlete",
  ];
  const goalOptions = [
    { key: "weight_loss", label: "Weight Loss" },
    { key: "maintain", label: "Maintain Weight" },
    { key: "muscle_gain", label: "Muscle Gain" },
  ];

  /* -----------------------------------------------------------
      VALIDATION (PLAY STORE SAFETY)
  ----------------------------------------------------------- */
  const validateStep = () => {
    if (step === 1) {
      if (!name.trim()) return "Please enter your name";
      if (!age || Number(age) < 10 || Number(age) > 100)
        return "Please enter a valid age (10–100)";
      if (!gender) return "Please select gender";
      if (!height || Number(height) < 100 || Number(height) > 250)
        return "Please enter a valid height (100–250 cm)";
      if (!weight || Number(weight) < 30 || Number(weight) > 300)
        return "Please enter a valid weight (30–300 kg)";
    }

    if (step === 2) {
      if (!activity) return "Please select activity level";
      if (!diet) return "Please select diet preference";
    }

    if (step === 3) {
      if (!goal) return "Please select your goal";
    }

    return null;
  };

  /* -----------------------------------------------------------
      AUTO CALCULATE MACROS (BMR FORMULA)
  ----------------------------------------------------------- */
  const nutrition = useMemo(() => {
    const w = Number(weight);
    const h = Number(height);
    const a = Number(age);
    if (!w || !h || !a) return null;

    const isMale = gender?.toLowerCase().startsWith("m");

    let BMR = isMale
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;

    let multiplier =
      activity === "Sedentary"
        ? 1.2
        : activity === "Light"
        ? 1.375
        : activity === "Moderate"
        ? 1.55
        : activity === "Active"
        ? 1.725
        : 1.9;

    let calories =
      goal === "weight_loss"
        ? BMR * multiplier * 0.8
        : goal === "muscle_gain"
        ? BMR * multiplier * 1.2
        : BMR * multiplier;

    calories = Math.round(calories);

    const protein = Math.round(w * 1.8);
    const fat = Math.round((calories * 0.28) / 9);
    const carbs = Math.round(
      (calories - (protein * 4 + fat * 9)) / 4
    );

    return { calories, protein, carbs, fat };
  }, [height, weight, age, gender, activity, goal]);

  /* -----------------------------------------------------------
      BMI CALCULATION
  ----------------------------------------------------------- */
  const bmiInfo = useMemo(() => {
    const w = Number(weight);
    const hCm = Number(height);
    if (!w || !hCm) return null;

    const hM = hCm / 100;
    const bmi = w / (hM * hM);
    const rounded = Math.round(bmi * 10) / 10;

    let category = "—";
    if (rounded < 18.5) category = "Underweight";
    else if (rounded < 25) category = "Normal";
    else if (rounded < 30) category = "Overweight";
    else if (rounded < 35) category = "Obesity (Class I)";
    else if (rounded < 40) category = "Obesity (Class II)";
    else category = "Obesity (Class III)";

    return { bmi: rounded, category };
  }, [height, weight]);

  /* -----------------------------------------------------------
      SAVE UPDATED PROFILE
  ----------------------------------------------------------- */
  const saveProfile = async () => {
    const error = validateStep();
    if (error) {
      Alert.alert("Incomplete Information", error);
      return;
    }

    const updated = {
      name,
      age: Number(age),
      gender,
      height: Number(height),
      weight: Number(weight),
      activity,
      diet,
      goal,
      calories: nutrition?.calories || userData.calories || 2000,
      protein: nutrition?.protein || userData.protein || 50,
      carbs: nutrition?.carbs || userData.carbs || 250,
      fat: nutrition?.fat || userData.fat || 70,
      bmi: bmiInfo?.bmi ?? userData?.bmi ?? null,
      bmiCategory: bmiInfo?.category ?? userData?.bmiCategory ?? "",
    };

    await updateUser(updated);
    navigation.goBack();
  };

  /* -----------------------------------------------------------
      REUSABLE DROPDOWN
  ----------------------------------------------------------- */
  const renderDropdown = (options, current, setter) => (
    <Modal visible={modalVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Select</Text>

          <FlatList
            data={options}
            keyExtractor={(item) => item.key || item}
            renderItem={({ item }) => {
              const label = item.label || item;
              const value = item.key || item;
              const isActive = current === value;

              return (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    isActive && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setter(value);
                    setModalVisible(false);
                    setModalType("");
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      isActive && styles.modalItemTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity
            style={[styles.modalClose, AppTheme.button(AppTheme.colors.primary)]}
            onPress={() => {
              setModalVisible(false);
              setModalType("");
            }}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  /* -----------------------------------------------------------
      MAIN RENDER
  ----------------------------------------------------------- */
  return (
    <View style={styles.safe}>
      <LinearGradient
        colors={AppTheme.gradient.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Text style={styles.stepLabel}>Step {step} of 4</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.container}>

        {/* STEP 1 – PERSONAL INFO */}
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your Name"
            />

            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="Age"
            />

            <Text style={styles.label}>Gender</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setModalType("gender");
                setModalVisible(true);
              }}
            >
              <Text style={styles.dropdownText}>
                {gender || "Select Gender"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#888" />
            </TouchableOpacity>

            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              keyboardType="numeric"
              onChangeText={setHeight}
              placeholder="Height"
            />

            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              keyboardType="numeric"
              onChangeText={setWeight}
              placeholder="Weight"
            />
          </View>
        )}

        {/* STEP 2 – LIFESTYLE */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lifestyle</Text>

            <Text style={styles.label}>Activity Level</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setModalType("activity");
                setModalVisible(true);
              }}
            >
              <Text style={styles.dropdownText}>
                {activity || "Select Activity Level"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#888" />
            </TouchableOpacity>

            <Text style={styles.label}>Diet Preference</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setModalType("diet");
                setModalVisible(true);
              }}
            >
              <Text style={styles.dropdownText}>
                {diet || "Select Diet Preference"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#888" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3 – FITNESS GOAL */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Your Goal</Text>

            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setModalType("goal");
                setModalVisible(true);
              }}
            >
              <Text style={styles.dropdownText}>
                {
                  goalOptions.find((g) => g.key === goal)?.label ||
                  "Select Goal"
                }
              </Text>
              <Ionicons name="chevron-down" size={18} color="#888" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4 – NUTRITION SUMMARY */}
        {step === 4 && nutrition && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Daily Nutrition Targets</Text>

            <Text style={styles.nutriLine}>🔥 Calories: {nutrition.calories}</Text>
            <Text style={styles.nutriLine}>🥩 Protein: {nutrition.protein} g</Text>
            <Text style={styles.nutriLine}>🍞 Carbs: {nutrition.carbs} g</Text>
            <Text style={styles.nutriLine}>🧈 Fat: {nutrition.fat} g</Text>

            {bmiInfo && (
              <Text style={styles.nutriLine}>
                ⚖️ BMI: {bmiInfo.bmi} ({bmiInfo.category})
              </Text>
            )}

            <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 10 }}>
              Nutrition values are estimates and not medical advice.
            </Text>
          </View>
        )}

        {/* STEP NAVIGATION BUTTONS */}
        <View style={styles.stepNav}>
          {step > 1 && (
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: AppTheme.colors.sky }]}
              onPress={() => setStep(step - 1)}
            >
              <Text style={styles.navText}>Back</Text>
            </TouchableOpacity>
          )}

          {step < 4 ? (
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: AppTheme.colors.primary }]}
              onPress={() => {
                const error = validateStep();
                if (error) {
                  Alert.alert("Incomplete Information", error);
                  return;
                }
                setStep(step + 1);
              }}
            >
              <Text style={styles.navText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: AppTheme.colors.mint }]}
              onPress={saveProfile}
            >
              <Text style={styles.navText}>Save Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {modalType === "gender" &&
        renderDropdown(genderOptions, gender, setGender)}
      {modalType === "diet" &&
        renderDropdown(dietOptions, diet, setDiet)}
      {modalType === "activity" &&
        renderDropdown(activityOptions, activity, setActivity)}
      {modalType === "goal" &&
        renderDropdown(goalOptions.map((g) => g.key), goal, setGoal)}
    </View>
  );
}

/* -----------------------------------------------------------
    STYLES (UNCHANGED)
----------------------------------------------------------- */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppTheme.colors.bg,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 36,
    alignItems: "center",
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    top: 60,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  stepLabel: {
    color: "#E0F2E9",
    marginTop: 4,
    fontSize: 13,
  },
  container: {
    padding: 18,
    paddingBottom: 60,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    color: AppTheme.colors.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: AppTheme.colors.text,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    marginBottom: 16,
    fontSize: 15,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    height: 48,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dropdownText: {
    fontSize: 15,
    color: AppTheme.colors.text,
    fontWeight: "600",
  },
  nutriLine: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: AppTheme.colors.text,
  },
  stepNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  navBtn: {
    width: "48%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  navText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: AppTheme.colors.border,
    alignItems: "center",
  },
  modalItemActive: {
    backgroundColor: AppTheme.colors.bg,
  },
  modalItemText: {
    fontSize: 16,
    color: AppTheme.colors.text,
  },
  modalItemTextActive: {
    color: AppTheme.colors.primary,
    fontWeight: "700",
  },
  modalClose: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalCloseText: {
    textAlign: "center",
    fontWeight: "700",
    color: "#fff",
  },
});
