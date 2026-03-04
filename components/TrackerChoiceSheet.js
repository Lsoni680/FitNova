// components/TrackerChoiceSheet.js
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppTheme from "../constants/AppTheme";

const OPTIONS = [
  {
    id: "food",
    label: "Food diary",
    description: "Log what you eat today",
    icon: "restaurant-outline",
  },
  {
    id: "water",
    label: "Water",
    description: "Track your daily hydration",
    icon: "water-outline",
  },
  {
    id: "steps",
    label: "Steps",
    description: "Count how much you move",
    icon: "walk-outline",
  },
  {
    id: "sleep",
    label: "Sleep",
    description: "Log your sleep duration",
    icon: "moon-outline",
  },
  {
    id: "workout",
    label: "Workout",
    description: "Track your training sessions",
    icon: "barbell-outline",
  },
  {
    id: "weight",
    label: "Weight",
    description: "Monitor your weight trend",
    icon: "body-outline",
  },
];

export default function TrackerChoiceSheet({ visible, onClose, onSelect }) {
  if (!visible) return null;

  const handleSelect = (id) => {
    onSelect && onSelect(id);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.title}>What do you want to track?</Text>
              <Text style={styles.subtitle}>
                Choose a tracker. Food entries are handled in your Food Diary.
              </Text>

              {OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={styles.row}
                  onPress={() => handleSelect(opt.id)}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons
                      name={opt.icon}
                      size={22}
                      color={AppTheme.colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{opt.label}</Text>
                    <Text style={styles.rowDesc}>{opt.description}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={AppTheme.colors.subtext}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 20,
    ...AppTheme.shadow.soft,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 10,
  },
  title: {
    ...AppTheme.text.h2,
    color: AppTheme.colors.text,
  },
  subtitle: {
    ...AppTheme.text.small,
    color: AppTheme.colors.subtext,
    marginTop: 4,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppTheme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: AppTheme.colors.text,
  },
  rowDesc: {
    fontSize: 12,
    color: AppTheme.colors.subtext,
    marginTop: 2,
  },
});
