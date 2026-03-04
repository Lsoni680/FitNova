// 🔄 Required for Reanimated (keep at top)
import "react-native-reanimated";

import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AppNavigator from "./navigation/AppNavigator";

// Context providers
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/UserContext";
import { AppDataProvider } from "./context/AppDataContext";
import { TrackerProvider } from "./context/TrackerContext";
import { StepProvider } from "./context/StepContext";

// ✅ Modals
import HealthDisclaimerModal from "./components/HealthDisclaimerModal";
import ActivityConsentModal from "./components/ActivityConsentModal";

export default function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // 🔐 Check if user already accepted health disclaimer
  useEffect(() => {
    const checkDisclaimer = async () => {
      try {
        const accepted = await AsyncStorage.getItem(
          "health_disclaimer_accepted"
        );
        if (!accepted) {
          setShowDisclaimer(true);
        }
      } catch (e) {
        console.log("Disclaimer check failed:", e);
      }
    };

    checkDisclaimer();
  }, []);

  const handleAcceptDisclaimer = async () => {
    try {
      await AsyncStorage.setItem("health_disclaimer_accepted", "true");
      setShowDisclaimer(false);
    } catch (e) {
      console.log("Disclaimer save failed:", e);
    }
  };

  return (
    <AuthProvider>
      <UserProvider>
        <AppDataProvider>
          <TrackerProvider>
            <StepProvider>
              {/* ✅ Health Disclaimer (one-time) */}
              <HealthDisclaimerModal
                visible={showDisclaimer}
                onAccept={handleAcceptDisclaimer}
              />

              {/* ✅ Activity / Steps Consent (Google required) */}
              <ActivityConsentModal />

              {/* Status bar & navigation remain unchanged */}
              <StatusBar style="auto" />
              <AppNavigator />
            </StepProvider>
          </TrackerProvider>
        </AppDataProvider>
      </UserProvider>
    </AuthProvider>
  );
}
