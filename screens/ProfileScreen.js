import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";

import AppTheme from "../constants/AppTheme";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";

// 🔐 Firebase delete
import { auth } from "../firebaseConfig";
import { deleteUser } from "firebase/auth";

/* ===================== LINKS ===================== */
const LINKS = {
  privacy:
    "https://lsoni680.github.io/fitnova-policies/privacy-policy.html",
  terms:
    "https://lsoni680.github.io/fitnova-policies/terms.html",
  deletion:
    "https://lsoni680.github.io/fitnova-policies/data-deletion.html",
  support:
    "https://lsoni680.github.io/fitnova-policies/contact.html",
};

export default function ProfileScreen({ navigation }) {
  const {
    userData,
    loadingUser,
    uploadProfilePhoto,
    removeProfilePhoto,
  } = useUser();

  const { logout, user, isGuest } = useAuth();

  const userName = userData?.name || user?.displayName || "Guest";

  const avatarSource = userData?.avatar
    ? { uri: userData.avatar }
    : user?.photoURL
    ? { uri: user.photoURL }
    : require("../assets/avatar-placeholder.png");

  if (loadingUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppTheme.colors.primary} />
      </View>
    );
  }

  /* ===================== HELPERS ===================== */
  const openLink = async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Unable to open link");
    }
  };

  /* ===================== AVATAR ===================== */
  const handleAvatarPress = () => {
  Alert.alert("Update Profile Photo", "Choose an option", [
    { text: "Take a Photo", onPress: pickCamera },
    { text: "Choose from Gallery", onPress: pickGallery },
    {
      text: "Remove Photo",
      style: "destructive",
      onPress: removeProfilePhoto,
    },
    { text: "Cancel", style: "cancel" },
  ]);
};


  const pickGallery = async () => {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      "Permission Required",
      "Please allow gallery access from settings."
    );
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets?.length) {
    await uploadProfilePhoto(result.assets[0].uri);
  }
};

const pickCamera = async () => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Permission Required", "Camera access is needed.");
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets?.length) {
    await uploadProfilePhoto(result.assets[0].uri);
  }
};


  /* ===================== ACCOUNT DELETION (GOOGLE REQUIRED) ===================== */
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all associated data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const currentUser = auth.currentUser;
              if (!currentUser) return;

              await deleteUser(currentUser);

              Alert.alert(
                "Account Deleted",
                "Your account has been permanently deleted."
              );

              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } catch (e) {
              Alert.alert(
                "Re-authentication Required",
                "For security reasons, please log in again before deleting your account."
              );
            }
          },
        },
      ]
    );
  };

  const ActionRow = ({ icon, label, onPress, danger }) => (
    <TouchableOpacity style={styles.actionRow} onPress={onPress}>
      <Ionicons
        name={icon}
        size={22}
        color={danger ? "#EF4444" : AppTheme.colors.primary}
        style={{ width: 28 }}
      />
      <Text
        style={[
          styles.actionText,
          danger && { color: "#EF4444", fontWeight: "700" },
        ]}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* HEADER */}
      <LinearGradient colors={AppTheme.gradient.header} style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handleAvatarPress}
          >
            <Image source={avatarSource} style={styles.avatar} />
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>{userName}</Text>

          {(userData?.email || user?.email) && (
            <Text style={styles.email}>
              {userData?.email || user?.email}
            </Text>
          )}
        </View>
      </LinearGradient>

      {/* ACTIONS */}
      <View style={[styles.card, styles.floatCard]}>
        <Text style={styles.cardTitle}>Actions</Text>

        <ActionRow
          icon="trophy-outline"
          label="My Health Goals"
          onPress={() => navigation.navigate("HealthGoalsScreen")}
        />

        <ActionRow
          icon="create-outline"
          label="Edit Profile"
          onPress={() => navigation.navigate("EditProfile")}
        />

        {!isGuest && (
          <ActionRow
            icon="log-out-outline"
            label="Logout"
            danger
            onPress={logout}
          />
        )}
      </View>

      {/* LEGAL & SUPPORT */}
      <View style={[styles.card, styles.floatCard]}>
        <Text style={styles.cardTitle}>Legal & Support</Text>

        <ActionRow
          icon="document-text-outline"
          label="Privacy Policy"
          onPress={() => openLink(LINKS.privacy)}
        />

        <ActionRow
          icon="shield-checkmark-outline"
          label="Terms & Conditions"
          onPress={() => openLink(LINKS.terms)}
        />

        <ActionRow
          icon="trash-outline"
          label="Data Deletion Policy"
          onPress={() => openLink(LINKS.deletion)}
        />

        <ActionRow
          icon="mail-outline"
          label="Contact Support"
          onPress={() => openLink(LINKS.support)}
        />

        {!isGuest && (
          <ActionRow
            icon="warning-outline"
            label="Delete Account"
            danger
            onPress={handleDeleteAccount}
          />
        )}
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>FitNova App</Text>
        <Text style={styles.footerVersion}>v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 80,
    paddingBottom: 60,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerInner: { alignItems: "center" },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  cameraIcon: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: AppTheme.colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  name: { fontSize: 24, fontWeight: "800", color: "#fff" },
  email: { fontSize: 14, color: "#E0F2E9", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 20,
    marginHorizontal: 18,
    marginTop: 18,
  },
  floatCard: { elevation: 3 },
  cardTitle: { fontSize: 17, fontWeight: "700", marginBottom: 14 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  actionText: { flex: 1, fontSize: 15, fontWeight: "600" },
  footer: { alignItems: "center", paddingVertical: 30 },
  footerText: { fontSize: 14, fontWeight: "600" },
  footerVersion: { fontSize: 12, marginTop: 4 },
});
