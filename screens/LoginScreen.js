import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as AppleAuthentication from "expo-apple-authentication";

import { useAuth } from "../context/AuthContext";
import AppTheme from "../constants/AppTheme";

/* -----------------------------------
   TEMPORARY FEATURE FLAGS
   (set true later to re-enable)
----------------------------------- */
const ENABLE_GOOGLE_LOGIN = false;
const ENABLE_APPLE_LOGIN = false;

export default function LoginScreen({ navigation }) {
  const {
    login,
    signup,
    resetPassword,
    googleLogin,
    appleLogin,
    loadingAuth,
  } = useAuth();

  const [isSignup, setIsSignup] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  /* ------------------------------------------------
        HANDLE EMAIL LOGIN / SIGNUP
  ------------------------------------------------ */
  const handleSubmit = async () => {
    if (!email || !password) {
      return Alert.alert("Missing Fields", "Enter email and password.");
    }

    if (isSignup) {
      if (!name || !age) {
        return Alert.alert("Missing Details", "Enter your name & age.");
      }

      if (password !== confirmPwd) {
        return Alert.alert("Password Mismatch", "Passwords do not match!");
      }

      try {
        await signup(
          email.trim(),
          password.trim(),
          name.trim(),
          age.trim()
        );
        Alert.alert("Success", "Account created!");
        navigation.goBack();
      } catch (err) {
        Alert.alert("Error", err.message);
      }
    } else {
      try {
        await login(email.trim(), password.trim());
        navigation.goBack();
      } catch (err) {
        Alert.alert("Error", err.message);
      }
    }
  };

  /* ------------------------------------------------
        FORGOT PASSWORD
  ------------------------------------------------ */
  const handleForgot = async () => {
    if (!email) {
      return Alert.alert("Email Required", "Enter your email first.");
    }

    try {
      await resetPassword(email.trim());
      Alert.alert("Check Email", "A reset link has been sent.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <LinearGradient colors={["#ffffff", "#f4f7f9"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollWrap}
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isSignup ? "Create Account" : "Welcome Back"}
            </Text>
            <Text style={styles.subtitle}>
              Track nutrition, fitness and daily habits.
            </Text>
          </View>

          {/* FORM CARD */}
          <View style={styles.card}>
            {/* SIGNUP EXTRA FIELDS */}
            {isSignup && (
              <>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={[styles.label, { marginTop: 16 }]}>Age</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your age"
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                />
              </>
            )}

            {/* EMAIL */}
            <Text style={[styles.label, { marginTop: isSignup ? 16 : 0 }]}>
              Email
            </Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            {/* PASSWORD */}
            <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/* CONFIRM PASSWORD */}
            {isSignup && (
              <>
                <Text style={[styles.label, { marginTop: 16 }]}>
                  Confirm Password
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  secureTextEntry
                  value={confirmPwd}
                  onChangeText={setConfirmPwd}
                />
              </>
            )}

            {/* FORGOT PASSWORD */}
            {!isSignup && (
              <TouchableOpacity
                onPress={handleForgot}
                style={{ alignSelf: "flex-end", marginTop: 8 }}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* SUBMIT */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSubmit}
              disabled={loadingAuth}
            >
              <Text style={styles.primaryText}>
                {isSignup ? "Sign Up" : "Login"}
              </Text>
            </TouchableOpacity>

            {/* SWITCH MODE */}
            <TouchableOpacity
              onPress={() => setIsSignup(!isSignup)}
              style={{ marginTop: 14 }}
            >
              <Text style={styles.switchText}>
                {isSignup
                  ? "Already have an account? Login"
                  : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* GOOGLE LOGIN (TEMP DISABLED) */}
          {ENABLE_GOOGLE_LOGIN && (
            <TouchableOpacity style={styles.socialBtn} onPress={googleLogin}>
              <Ionicons name="logo-google" size={20} color="#fff" />
              <Text style={styles.socialText}>Continue with Google</Text>
            </TouchableOpacity>
          )}

          {/* APPLE LOGIN (TEMP DISABLED) */}
          {ENABLE_APPLE_LOGIN && Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
              }
              buttonStyle={
                AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={12}
              style={styles.appleBtn}
              onPress={appleLogin}
            />
          )}

          {/* GUEST MODE */}
          <TouchableOpacity
            style={{ marginTop: 20 }}
            onPress={() => navigation.replace("MainTabs")}
          >
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

/* ------------------------------------------------
      STYLES
------------------------------------------------ */
const styles = StyleSheet.create({
  container: { flex: 1 },

  scrollWrap: {
    paddingHorizontal: 22,
    paddingTop: 70,
    paddingBottom: 80,
  },

  header: { marginBottom: 40 },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0a0a0a",
  },

  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    marginTop: 6,
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
  },

  forgotText: {
    color: AppTheme.colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },

  primaryBtn: {
    backgroundColor: AppTheme.colors.primary,
    paddingVertical: 16,
    marginTop: 20,
    borderRadius: 14,
    alignItems: "center",
  },

  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  switchText: {
    color: AppTheme.colors.primary,
    fontWeight: "600",
    textAlign: "center",
    fontSize: 14,
  },

  socialBtn: {
    marginTop: 30,
    backgroundColor: AppTheme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },

  socialText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "700",
    fontSize: 15,
  },

  appleBtn: {
    marginTop: 14,
    width: "100%",
    height: 50,
  },

  guestText: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
});
