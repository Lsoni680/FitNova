// components/AddTrackerEntrySheet.js
import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import AppTheme from "../constants/AppTheme";
import { useTracker } from "../context/TrackerContext";

export default function AddTrackerEntrySheet({ visible, onClose, tracker }) {
  const { addTrackerEntry } = useTracker();
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");

  // Reset inputs whenever we open / change tracker
  useEffect(() => {
    if (visible) {
      setValue("");
      setNote("");
    }
  }, [visible, tracker?.id]);

  if (!visible || !tracker) return null;

  const handleSave = async () => {
    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric <= 0) {
      return;
    }

    try {
      await addTrackerEntry({
        type: tracker.id,               // "water" | "steps" | "sleep" | "workout" | "weight"
        value: numeric,
        unit: tracker.unit || "",
        note: tracker.allowNote ? note.trim() : "",
      });
    } catch (e) {
      console.log("addTrackerEntry error:", e);
    } finally {
      onClose && onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.sheetWrapper}
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.sheet}>
                <View style={styles.handle} />

                <Text style={styles.title}>{tracker.title}</Text>
                {tracker.subtitle ? (
                  <Text style={styles.subtitle}>{tracker.subtitle}</Text>
                ) : null}

                <Text style={styles.label}>{tracker.label}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder={tracker.placeholder || ""}
                  placeholderTextColor="#9CA3AF"
                  value={value}
                  onChangeText={setValue}
                  returnKeyType="done"
                />

                {tracker.allowNote && (
                  <>
                    <Text style={[styles.label, { marginTop: 14 }]}>
                      Note (optional)
                    </Text>
                    <TextInput
                      style={[styles.input, styles.noteInput]}
                      placeholder="Add a short note..."
                      placeholderTextColor="#9CA3AF"
                      value={note}
                      onChangeText={setNote}
                      multiline
                    />
                  </>
                )}

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
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
  sheetWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    ...AppTheme.shadow.soft,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 10,
  },
  title: {
    ...AppTheme.text.h2,
    textAlign: "center",
    color: AppTheme.colors.text,
  },
  subtitle: {
    ...AppTheme.text.small,
    textAlign: "center",
    color: AppTheme.colors.subtext,
    marginTop: 4,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: AppTheme.colors.subtext,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: AppTheme.colors.text,
  },
  noteInput: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: AppTheme.colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    ...AppTheme.shadow.soft,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelBtn: {
    marginTop: 10,
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  cancelText: {
    color: AppTheme.colors.subtext,
    fontWeight: "600",
    fontSize: 13,
  },
});
