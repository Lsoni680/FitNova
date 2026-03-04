import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AppTheme from "../constants/AppTheme";

export default function HealthDisclaimerModal({ visible, onAccept }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Health Disclaimer</Text>

          <Text style={styles.text}>
            FitNova is not a medical application.
          </Text>

          <Text style={styles.text}>
            All nutrition, fitness, activity, and AI-generated insights are
            provided for informational purposes only and should not be
            considered medical advice.
          </Text>

          <Text style={styles.text}>
            Always consult a qualified healthcare professional before making
            health-related decisions.
          </Text>

          <TouchableOpacity style={styles.btn} onPress={onAccept}>
            <Text style={styles.btnText}>I Understand & Agree</Text>
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
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
    color: AppTheme.colors.text,
  },
  text: {
    fontSize: 14,
    color: AppTheme.colors.subtext,
    marginBottom: 10,
    lineHeight: 20,
  },
  btn: {
    marginTop: 10,
    backgroundColor: AppTheme.colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
