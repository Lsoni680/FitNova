// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  updateProfile,
} from "firebase/auth";

import { auth, db } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

// 🔑 YOUR GOOGLE WEB CLIENT ID
const GOOGLE_CLIENT_ID =
  "216757130978-f41gprhe9s4v2b4n66ijqpnjkfj1o7.apps.googleusercontent.com";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // ----- Google Auth Request (Expo SDK 54) -----
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
  });

  /* ---------------------------------------------------
     LISTEN TO AUTH CHANGES
  ----------------------------------------------------*/
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsGuest(false);
      } else {
        setUser(null);
        setIsGuest(true);
      }
      setLoadingAuth(false);
    });

    return unsub;
  }, []);

  /* ---------------------------------------------------
     SAVE USER TO FIRESTORE (ONLY IF NOT EXIST)
  ----------------------------------------------------*/
  const saveUserToDB = async (uid, data) => {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, data, { merge: true });
    }
  };

  /* ---------------------------------------------------
      EMAIL LOGIN
  ----------------------------------------------------*/
  const login = async (email, password) => {
    setLoadingAuth(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setLoadingAuth(false);
    }
  };

  /* ---------------------------------------------------
      EMAIL SIGNUP (SAVE NAME + AGE)
  ----------------------------------------------------*/
  const signup = async (email, password, name, age) => {
    setLoadingAuth(true);
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // set Firebase auth displayName also
      if (name) {
        await updateProfile(userCred.user, { displayName: name });
      }

      const uid = userCred.user.uid;

      await saveUserToDB(uid, {
        uid,
        email,
        name: name || "",
        age: Number(age) || 0,
        createdAt: new Date().toISOString(),
      });
    } finally {
      setLoadingAuth(false);
    }
  };

  /* ---------------------------------------------------
      GOOGLE LOGIN — using expo-auth-session/providers/google
  ----------------------------------------------------*/
  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === "success" && response.authentication?.idToken) {
        try {
          const idToken = response.authentication.idToken;
          const credential = GoogleAuthProvider.credential(idToken);

          const userCred = await signInWithCredential(auth, credential);

          await saveUserToDB(userCred.user.uid, {
            uid: userCred.user.uid,
            email: userCred.user.email || "",
            name: userCred.user.displayName || "",
            avatar: userCred.user.photoURL || "",
            createdAt: new Date().toISOString(),
          });
        } catch (err) {
          console.log("Google Login Error:", err);
        }
      }
    };
    handleGoogleResponse();
  }, [response]);

  const googleLogin = async () => {
    if (!request) {
      console.log("Google auth request not ready");
      return;
    }
    await promptAsync();
  };

  /* ---------------------------------------------------
      APPLE LOGIN (ONLY WHEN ENABLED IN FIREBASE)
  ----------------------------------------------------*/
  const appleLogin = async () => {
    try {
      const appleRes = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });

      const provider = new OAuthProvider("apple.com");

      const credential = provider.credential({
        idToken: appleRes.identityToken,
      });

      const userCred = await signInWithCredential(auth, credential);

      const fullName =
        (appleRes.fullName?.givenName || "") +
        (appleRes.fullName?.familyName ? " " + appleRes.fullName.familyName : "");

      await saveUserToDB(userCred.user.uid, {
        uid: userCred.user.uid,
        email: userCred.user.email || "",
        name: fullName || userCred.user.displayName || "",
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.log("Apple Login Error:", err);
      // If Apple not enabled in Firebase → auth/operation-not-allowed
    }
  };

  const resetPassword = async (email) =>
    await sendPasswordResetEmail(auth, email);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        loadingAuth,
        login,
        signup,
        resetPassword,
        googleLogin,
        appleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
