import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Platform,
  Alert,
  Linking,
  AppState,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import * as ExpoCamera from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

import AppTheme from "../constants/AppTheme";
import { getDefaultUnitForFood } from "../services/nutritionEngine";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebaseConfig";

console.log("✅ ScanScreen UPDATED & FIXED (FINAL v3)");

export default function ScanScreen() {
  const navigation = useNavigation();
  const cameraRef = useRef(null);

  // 🔥 KEEPING your imports (not used but kept as requested)
  const functions = getFunctions(app, "us-central1");
  const analyzeFood = httpsCallable(functions, "analyzeFoodNutrition");

  // ✅ YOUR REAL HTTP FUNCTION URL (Cloud Run)
  const FUNCTION_URL = "https://analyzefoodnutritionhttp-zridd3wcvq-uc.a.run.app";

  const [hasPermission, setHasPermission] = useState(null);

  const [facing, setFacing] = useState("back");
  const [torchOn, setTorchOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [scanMode, setScanMode] = useState("food"); // food | barcode

  /* ---------------- CAMERA PERMISSION (STANDARD) ---------------- */
  // Standard Expo pattern:
  // 1) Check current status (no popup)
  // 2) If undetermined, request (popup)
  // 3) If denied + can't ask again, show UI that opens Settings
  const syncCameraPermission = async () => {
    try {
      // Prefer "get" first (NO popup)
      let current = null;

      if (typeof ExpoCamera.getCameraPermissionsAsync === "function") {
        current = await ExpoCamera.getCameraPermissionsAsync();
      } else if (
        ExpoCamera.Camera &&
        typeof ExpoCamera.Camera.getCameraPermissionsAsync === "function"
      ) {
        current = await ExpoCamera.Camera.getCameraPermissionsAsync();
      }

      const status = current?.status;
      const granted =
        current?.granted === true || status === "granted" ? true : false;

      // If already granted/denied, just set it
      if (status && status !== "undetermined") {
        setHasPermission(granted);
        return granted;
      }

      // If undetermined, request (popup)
      let requested = null;
      if (typeof ExpoCamera.requestCameraPermissionsAsync === "function") {
        requested = await ExpoCamera.requestCameraPermissionsAsync();
      } else if (
        ExpoCamera.Camera &&
        typeof ExpoCamera.Camera.requestCameraPermissionsAsync === "function"
      ) {
        requested = await ExpoCamera.Camera.requestCameraPermissionsAsync();
      } else {
        // If API not found, treat as denied
        requested = { status: "denied", granted: false, canAskAgain: false };
      }

      const reqGranted =
        requested?.granted === true || requested?.status === "granted";

      setHasPermission(!!reqGranted);
      return !!reqGranted;
    } catch (e) {
      console.log("Camera permission error:", e);
      setHasPermission(false);
      return false;
    }
  };

  const requestPermissionAgain = async () => {
    try {
      let requested = null;

      if (typeof ExpoCamera.requestCameraPermissionsAsync === "function") {
        requested = await ExpoCamera.requestCameraPermissionsAsync();
      } else if (
        ExpoCamera.Camera &&
        typeof ExpoCamera.Camera.requestCameraPermissionsAsync === "function"
      ) {
        requested = await ExpoCamera.Camera.requestCameraPermissionsAsync();
      }

      const granted =
        requested?.granted === true || requested?.status === "granted";

      setHasPermission(!!granted);
    } catch (e) {
      console.log("requestPermissionAgain error:", e);
      setHasPermission(false);
    }
  };

  const openAppSettings = async () => {
    try {
      if (Linking?.openSettings) {
        await Linking.openSettings();
        return;
      }
      if (Platform.OS === "ios") {
        await Linking.openURL("app-settings:");
      } else {
        Alert.alert("Open Settings", "Please open Settings and allow Camera.");
      }
    } catch (e) {
      console.log("openAppSettings error:", e);
      Alert.alert("Settings", "Please open Settings and allow Camera.");
    }
  };

  // Ask once when screen mounts
  useEffect(() => {
    syncCameraPermission();
  }, []);

  // Re-check when coming back from Settings
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncCameraPermission();
      }
    });
    return () => sub?.remove?.();
  }, []);

  /* ---------------- CACHE ---------------- */
  const loadCachedScans = async () => {
    try {
      const data = await AsyncStorage.getItem("cached_scans");
      const parsed = data ? JSON.parse(data) : [];
      const safe = Array.isArray(parsed) ? parsed : [];
      setRecentScans(safe);
      return safe;
    } catch (e) {
      console.log("Cache load error:", e);
      setRecentScans([]);
      return [];
    }
  };

  const saveToCache = async (foodName, thumbUri) => {
    try {
      const old = (await loadCachedScans()) || [];
      const now = Date.now();

      const cleanName = (foodName || "Food (Edit)").trim() || "Food (Edit)";

      const updated = [
        { foodName: cleanName, thumbUri, timestamp: now },
        ...old.filter((i) => i?.foodName !== cleanName),
      ].slice(0, 3);

      await AsyncStorage.setItem("cached_scans", JSON.stringify(updated));
      setRecentScans(updated);
    } catch (e) {
      console.log("Cache save error:", e);
    }
  };

  useEffect(() => {
    loadCachedScans();
  }, []);

  /* ---------------- SAFE BACK ---------------- */
  const safeGoBack = () => {
    try {
      if (navigation?.canGoBack?.()) navigation.goBack();
      else navigation.navigate("Home");
    } catch (e) {
      console.log("safeGoBack error:", e);
    }
  };

  /* ---------------- ✅ HTTP CALL ---------------- */
  const callFoodDetectionHttp = async (payload) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      console.log("🔥 Calling backend:", FUNCTION_URL);
      console.log("🔥 Payload keys:", Object.keys(payload || {}));

      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const text = await res.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { raw: text };
      }

      console.log("🔥 Backend status:", res.status);
      console.log("🔥 Backend response:", data);

      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      console.log("❌ Backend error:", e);
      return { ok: false, status: 0, data: null, networkError: true };
    } finally {
      clearTimeout(timeout);
    }
  };

  /* ---------------- ✅ OPENAI DETECT (BASE64 + foodName fallback) ---------------- */
  const detectViaOpenAI = async ({ imageUri, base64 }) => {
    try {
      console.log("🔥 Sending image to backend");

      const payload = {
        imageBase64: base64 || null,
        imageUri: imageUri || null,
        foodName: "Food (Edit)", // compatibility with your backend validation
      };

      const result = await callFoodDetectionHttp(payload);
      const data = result?.data;

      if (data?.error) {
        const msg = String(data.error || "").toLowerCase();
        console.log("⚠ Backend error:", data?.error);

        if (msg.includes("food name required")) {
          // backend still expects text
          return null;
        } else if (msg.includes("usda key missing")) {
          // backend env missing
          return null;
        }

        return null;
      }

      const name =
        data?.foodName ||
        data?.food ||
        data?.name ||
        data?.detectedFood ||
        data?.result?.foodName ||
        null;

      return typeof name === "string" && name.trim() ? name.trim() : null;
    } catch (e) {
      console.log("❌ OpenAI detect error:", e);
      return null;
    }
  };

  /* ---------------- BARCODE ---------------- */
  const detectBarcodeViaFirebase = async (barcode) => {
    try {
      console.log("🔥 Sending barcode:", barcode);

      const result = await callFoodDetectionHttp({
        barcode,
        foodName: "Food (Edit)",
      });

      const data = result?.data;
      if (data?.error) return null;

      const name =
        data?.foodName ||
        data?.productName ||
        data?.name ||
        data?.result?.foodName ||
        null;

      return typeof name === "string" && name.trim() ? name.trim() : null;
    } catch (e) {
      console.log("❌ Barcode detect error:", e);
      return null;
    }
  };

  /* ---------------- ML FALLBACK (SAFE for Expo Go) ---------------- */
  const normalizePath = (uri) => {
    if (
      Platform.OS === "android" &&
      typeof uri === "string" &&
      uri.startsWith("file://")
    ) {
      return uri.replace("file://", "");
    }
    return uri;
  };

  const detectViaML = async (uri) => {
    try {
      if (!ImageLabeler || typeof ImageLabeler.labelImage !== "function") {
        console.log("⚠ ML Kit not available in Expo Go. Skipping ML fallback.");
        return "Food (Edit)";
      }

      if (!labels?.length) return "Food (Edit)";

      const best = labels.sort(
        (a, b) => (b?.confidence || 0) - (a?.confidence || 0)
      )[0];

      return (best?.text || "Food (Edit)")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    } catch (e) {
      console.log("ML error:", e);
      return "Food (Edit)";
    }
  };

  /* ---------------- MAIN SCAN ---------------- */
  const handleScan = async ({ uri, base64 }) => {
    setLoading(true);

    try {
      let thumb = uri;
      try {
        const t = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 320 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        thumb = t.uri;
      } catch (e) {
        console.log("Thumb error:", e);
      }

      let food = await detectViaOpenAI({ imageUri: uri, base64 });

      if (!food) {
        Alert.alert(
          "Scan Failed",
          "Food recognition service is not responding. Please try again."
        );
        setLoading(false);
        return;
      }

      console.log("✅ Final food:", food);

      await saveToCache(food, thumb);

      navigation.replace("NutritionScreen", {
        food,
        quantity: "1",
        unit: getDefaultUnitForFood(food),
        imageUri: uri,
        source: "scan",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- GALLERY (BASE64 + DEPRECATION SAFE) ---------------- */
  const pickFromGallery = async () => {
    try {
      console.log("📂 Opening gallery");

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Gallery permission:", perm.status);

      if (perm.status !== "granted") {
        Alert.alert("Permission needed", "Allow gallery access");
        return;
      }

      const mediaTypesSafe =
        ImagePicker?.MediaType?.Images ?? ImagePicker.MediaTypeOptions.Images;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypesSafe,
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      console.log("Gallery result:", result);

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        await handleScan({ uri: asset.uri, base64: asset.base64 || null });
      }
    } catch (e) {
      console.log("Gallery error:", e);
    }
  };

  /* ---------------- BARCODE HANDLER ---------------- */
  const onBarcodeScanned = async (result) => {
    if (!result?.data) return;

    setLoading(true);
    try {
      const foodName = await detectBarcodeViaFirebase(result.data);

      if (!foodName) {
        Alert.alert("Not Found", "Barcode not recognized");
        return;
      }

      navigation.replace("NutritionScreen", {
        food: foodName,
        quantity: "1",
        unit: "pack",
        source: "barcode",
      });
    } catch (e) {
      console.log("Barcode scan error:", e);
      Alert.alert("Not Found", "Barcode not recognized");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- CAMERA ---------------- */
  const capturePhoto = async () => {
    if (!cameraRef.current) return;

    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      if (photo?.uri) {
        await handleScan({ uri: photo.uri, base64: photo.base64 || null });
      }
    } catch (e) {
      console.log("Capture error:", e);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- PERMISSION UI ---------------- */
  if (hasPermission === null) {
    return (
      <View
        style={[
          styles.root,
          { alignItems: "center", justifyContent: "center", padding: 20 },
        ]}
      >
        <ActivityIndicator color="#fff" />
        <Text style={{ color: "#fff", marginTop: 10, fontWeight: "700" }}>
          Checking camera permission...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View
        style={[
          styles.root,
          { alignItems: "center", justifyContent: "center", padding: 20 },
        ]}
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 16,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          FitNova needs camera access to scan food.
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: AppTheme.colors.primary,
            padding: 14,
            borderRadius: 10,
            width: "80%",
            marginBottom: 10,
          }}
          onPress={requestPermissionAgain}
        >
          <Text style={{ color: "#fff", fontWeight: "800", textAlign: "center" }}>
            Allow Camera
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: "#E5E7EB",
            padding: 14,
            borderRadius: 10,
            width: "80%",
            marginBottom: 10,
          }}
          onPress={openAppSettings}
        >
          <Text style={{ color: "#111827", fontWeight: "800", textAlign: "center" }}>
            Open Settings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={safeGoBack} style={{ marginTop: 6 }}>
          <Text style={{ color: "#aaa" }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
        }}
        onBarcodeScanned={scanMode === "barcode" ? onBarcodeScanned : undefined}
        onMountError={(e) => console.log("❌ Camera mount error:", e)}
      />

      <LinearGradient
        colors={["rgba(0,0,0,0.8)", "transparent"]}
        style={styles.topOverlay}
      >
        <TouchableOpacity onPress={safeGoBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>
          {scanMode === "barcode" ? "Scan Barcode" : "Snap Food"}
        </Text>

        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => setTorchOn((p) => !p)}>
            <Ionicons
              name={torchOn ? "flash" : "flash-off"}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginLeft: 12 }}
            onPress={() =>
              setScanMode((p) => (p === "food" ? "barcode" : "food"))
            }
          >
            <Ionicons name="barcode-outline" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginLeft: 12 }}
            onPress={() => setFacing((p) => (p === "back" ? "front" : "back"))}
          >
            <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.bottomOverlay}>
        <TouchableOpacity onPress={pickFromGallery}>
          <Ionicons name="images-outline" size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shutterOuter} onPress={capturePhoto}>
          <View style={styles.shutterInner}>
            {loading && <ActivityIndicator />}
          </View>
        </TouchableOpacity>

        <View style={{ width: 26 }} />
      </View>

      {recentScans.length > 0 && (
        <View style={styles.recentWrap}>
          <Text style={styles.recentTitle}>Recent</Text>
          <ScrollView horizontal>
            {recentScans.map((item) => (
              <TouchableOpacity
                key={`${item?.timestamp || ""}-${item?.foodName || ""}`}
                style={styles.recentCard}
                onPress={() =>
                  navigation.navigate("NutritionScreen", {
                    food: item.foodName,
                    quantity: "1",
                    unit: getDefaultUnitForFood(item.foodName),
                    imageUri: item.thumbUri,
                    source: "scan_recent",
                  })
                }
              >
                <Image source={{ uri: item.thumbUri }} style={styles.recentImg} />
                <Text numberOfLines={1} style={styles.recentLabel}>
                  {item.foodName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "black" },
  camera: { flex: 1 },

  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 44,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  bottomOverlay: {
    position: "absolute",
    bottom: 160,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  recentWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AppTheme.colors.bg,
    padding: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  recentCard: {
    marginRight: 10,
    width: 80,
  },
  recentImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  recentLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
});
