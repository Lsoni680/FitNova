// navigation/AppNavigator.js
import React from "react";
import {
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  View,
} from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import AppTheme from "../constants/AppTheme";

// Screens
import HomeScreen from "../screens/HomeScreen";
import NutritionScreen from "../screens/NutritionScreen";
import ScanScreen from "../screens/ScanScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import FoodDiaryScreen from "../screens/FoodDiaryScreen";
import FoodInputHubScreen from "../screens/FoodInputHubScreen";
import HealthGoalsScreen from "../screens/HealthGoalsScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import LoginScreen from "../screens/LoginScreen";

import { useAuth } from "../context/AuthContext";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* -------------------------------------------
    MAIN TABS
------------------------------------------- */
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: AppTheme.colors.primary,
        tabBarInactiveTintColor: "#94A3B8",
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = "home-outline";

          switch (route.name) {
            case "Home":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Nutrition":
              iconName = focused ? "nutrition" : "nutrition-outline";
              break;
            case "FoodDiary":
              iconName = focused ? "fast-food" : "fast-food-outline";
              break;
            case "Analytics":
              iconName = focused ? "stats-chart" : "stats-chart-outline";
              break;
            case "Profile":
              iconName = focused ? "person" : "person-outline";
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="Nutrition"
        component={NutritionScreen}
        options={{ title: "Nutrition" }}
      />
      <Tab.Screen
        name="FoodDiary"
        component={FoodDiaryScreen}
        options={{ title: "Diary" }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ title: "Analytics" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

/* -------------------------------------------
    ROOT NAVIGATION
------------------------------------------- */
export default function AppNavigator() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? DarkTheme : DefaultTheme;

  const { loadingAuth } = useAuth();

  if (loadingAuth) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={AppTheme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        {/* Main App */}
        <Stack.Screen name="MainTabs" component={MainTabs} />

        {/* Food / Nutrition flow */}
        <Stack.Screen name="FoodInputHub" component={FoodInputHubScreen} />
        <Stack.Screen name="ScanScreen" component={ScanScreen} />
        <Stack.Screen name="NutritionScreen" component={NutritionScreen} />

        {/* Profile flow */}
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="HealthGoalsScreen" component={HealthGoalsScreen} />

        {/* Food Diary deep link */}
        <Stack.Screen name="FoodDiary" component={FoodDiaryScreen} />

        {/* Optional login screen (from Profile) */}
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/* -------------------------------------------
    STYLES
------------------------------------------- */
const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 12,
    height: 64,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    paddingBottom: 6,
    borderTopWidth: 0,
    ...AppTheme.shadow.soft,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: AppTheme.colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
});
