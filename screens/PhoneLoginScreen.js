// screens/PhoneLoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import {
  PhoneAuthProvider,
  signInWithCredential,
} from "firebase/auth";

import { auth, firebaseApp } from "../firebaseConfig";   // ✅ FIXED
import AppTheme from "../constants/AppTheme";

export default function PhoneLoginScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1 = enter phone, 2 = enter OTP
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationId, setVerificationId] = useState(null);

  /* -------------------------------------------
        SEND OTP  (Expo SDK 54 required format)
  --------------------------------------------*/
  const handleSendOTP = async () => {
    if (!phone) return Alert.alert("Enter phone number");

    try {
      const provider = new PhoneAuthProvider(auth);

      // ✅ MUST PASS firebaseApp OR OTP WILL FAIL
      const verification = await provider.verifyPhoneNumber(phone, firebaseApp);

      setVerificationId(verification);
      setStep(2);
      Alert.alert("OTP Sent", "Please check your SMS.");
    } catch (err) {
      Alert.alert("Error", err.message);
      console.log("OTP ERROR:", err);
    }
  };

  /* -------------------------------------------
        VERIFY OTP
  --------------------------------------------*/
  const handleVerifyOTP = async () => {
    if (!otp) return Alert.alert("Enter the OTP");

    try {
      const credential = PhoneAuthProvider.credential(
        verificationId,
        otp.trim()
      );

      await signInWithCredential(auth, credential);

      Alert.alert("Success", "Logged in successfully!");
      navigation.replace("MainTabs"); // Go to dashboard
    } catch (err) {
      Alert.alert("Incorrect OTP", "Please try again.");
      console.log("OTP VERIFY ERROR:", err);
    }
  };

  return (
    <LinearGradient colors={["#ffffff", "#f4f7f9"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.container}
        >
          <Text style={styles.title}>
            {step === 1 ? "Enter Mobile Number" : "Verify OTP"}
          </Text>

          <Text style={styles.subtitle}>
            {step === 1
              ? "We will send an OTP to verify your number."
              : "Enter the 6-digit code sent to your phone."}
          </Text>

          <View style={styles.card}>
            {step === 1 ? (
              <>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+971500000000"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />

                <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOTP}>
                  <Text style={styles.primaryText}>Send OTP</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>OTP Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  keyboardType="numeric"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />

                <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOTP}>
                  <Text style={styles.primaryText}>Verify & Login</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* BACK BUTTON */}
          <TouchableOpacity
            onPress={() => {
              if (step === 2) {
                setStep(1);
                setOtp("");
              } else {
                navigation.goBack();
              }
            }}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={18} color="#111" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

/* -------------------------------------------
      STYLES
--------------------------------------------*/
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 70,
    paddingBottom: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0a0a0a",
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    marginTop: 6,
    marginBottom: 30,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },
  primaryBtn: {
    backgroundColor: AppTheme.colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  backBtn: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontSize: 14,
    color: "#111",
    fontWeight: "600",
    marginLeft: 4,
  },
});
