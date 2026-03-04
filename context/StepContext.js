import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Pedometer } from "expo-sensors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const StepContext = createContext();
export const useSteps = () => useContext(StepContext);

export function StepProvider({ children }) {
  const [steps, setSteps] = useState(0);
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  // 🔐 Check user consent
  useEffect(() => {
    AsyncStorage.getItem("activity_consent").then((v) => {
      if (v === "granted") {
        setHasConsent(true);
      } else {
        setShowConsent(true);
      }
    });
  }, []);

  // 🏃 Start step tracking ONLY after consent
  useEffect(() => {
    if (!hasConsent) return;

    let subscription;
    Pedometer.isAvailableAsync().then((available) => {
      if (available) {
        subscription = Pedometer.watchStepCount((result) => {
          setSteps(result.steps);
        });
      }
    });

    return () => subscription && subscription.remove();
  }, [hasConsent]);

  // ✅ User grants consent
  const allowActivityTracking = async () => {
    await AsyncStorage.setItem("activity_consent", "granted");
    setHasConsent(true);
    setShowConsent(false);
  };

  // ❌ User denies consent
  const denyActivityTracking = async () => {
    await AsyncStorage.setItem("activity_consent", "denied");
    setShowConsent(false);
  };

  return (
    <StepContext.Provider
      value={{
        steps,
        hasConsent,
        showConsent,
        allowActivityTracking,
        denyActivityTracking,
      }}
    >
      {children}
    </StepContext.Provider>
  );
}
