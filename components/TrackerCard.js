// components/TrackerCard.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppTheme from "../constants/AppTheme";

export default function TrackerCard({
  title,
  subtitle,
  icon,
  color,
  value,
  unit,
  badge,
  onPress,
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={icon || "stats-chart-outline"}
            size={20}
            color={color || AppTheme.colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.valueText}>{value}</Text>
        {unit ? <Text style={styles.unitText}>{unit}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 12,
    ...AppTheme.shadow.soft,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AppTheme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: AppTheme.colors.text,
  },
  subtitle: {
    fontSize: 11,
    color: AppTheme.colors.subtext,
    marginTop: 2,
  },
  badge: {
    fontSize: 11,
    fontWeight: "600",
    color: AppTheme.colors.subtext,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 10,
  },
  valueText: {
    fontSize: 20,
    fontWeight: "800",
    color: AppTheme.colors.primary,
  },
  unitText: {
    fontSize: 12,
    color: AppTheme.colors.subtext,
    marginLeft: 4,
    marginBottom: 2,
  },
});
