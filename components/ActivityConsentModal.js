import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AppTheme from "../constants/AppTheme";
import { useSteps } from "../context/StepContext";

export default function ActivityConsentModal() {
  const {
    showConsent,
    allowActivityTracking,
    denyActivityTracking,
  } = useSteps();

  return (
    <Modal visible={showConsent} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Activity Tracking Permission</Text>

          <Text style={styles.text}>
            FitNova uses activity recognition to track your steps and movement
            to provide daily activity insights.
          </Text>

          <Text style={styles.text}>
            This data is used only inside the app and is never sold or shared.
          </Text>

          <TouchableOpacity
            style={styles.allowBtn}
            onPress={allowActivityTracking}
          >
            <Text style={styles.allowText}>Allow Activity Tracking</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.denyBtn}
            onPress={denyActivityTracking}
          >
            <Text style={styles.denyText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: AppTheme.colors.text,
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: AppTheme.colors.subtext,
    marginBottom: 10,
    lineHeight: 20,
  },
  allowBtn: {
    backgroundColor: AppTheme.colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  allowText: {
    color: "#fff",
    fontWeight: "700",
  },
  denyBtn: {
    alignItems: "center",
    marginTop: 10,
  },
  denyText: {
    color: AppTheme.colors.subtext,
    fontWeight: "600",
  },
});
