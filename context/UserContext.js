// context/UserContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db, storage } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

const DEFAULT_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export function UserProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  /* -----------------------------------------------------------
      LOAD USER PROFILE
  ----------------------------------------------------------- */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUserData({
          avatar: DEFAULT_AVATAR,
        });
        setLoadingUser(false);
        return;
      }

      setLoadingUser(true);

      try {
        const refDoc = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(refDoc);

        if (snap.exists()) {
          setUserData(snap.data());
        } else {
          const defaultData = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            avatar: firebaseUser.photoURL || DEFAULT_AVATAR,

            age: 25,
            gender: "Male",
            height: 170,
            weight: 70,

            activity: "Moderate",
            diet: "Balanced",
            goal: "maintain",

            calories: 2000,
            protein: 80,
            carbs: 250,
            fat: 70,

            stepsGoal: 8000,
            waterGoal: 2000,
            sleepGoal: 7,
            weightGoal: 70,

            createdAt: new Date().toISOString(),
          };

          await setDoc(refDoc, defaultData);
          setUserData(defaultData);
        }
      } catch (error) {
        console.log("Error loading user profile:", error);
        setUserData({ avatar: DEFAULT_AVATAR });
      } finally {
        setLoadingUser(false);
      }
    });

    return unsubscribe;
  }, []);

  /* -----------------------------------------------------------
      UPDATE USER DATA
  ----------------------------------------------------------- */
  const updateUser = async (partial) => {
    try {
      setUserData((prev) => ({ ...(prev || {}), ...partial }));

      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const refDoc = doc(db, "users", currentUser.uid);
      await setDoc(refDoc, partial, { merge: true });
    } catch (error) {
      console.log("updateUser error:", error);
    }
  };

  /* -----------------------------------------------------------
      UPLOAD PROFILE PHOTO (✅ FIXED)
  ----------------------------------------------------------- */
  const uploadProfilePhoto = async (uri) => {
    try {
      if (!uri) return;

      // ✅ Update avatar instantly (guest + logged in)
      setUserData((prev) => ({
        ...(prev || {}),
        avatar: uri,
      }));

      const currentUser = auth.currentUser;

      // Guest user → preview only
      if (!currentUser) return uri;

      // Prevent re-uploading URLs
      if (uri.startsWith("http")) {
        await updateUser({ avatar: uri });
        return uri;
      }

      const response = await fetch(uri);
      const blob = await response.blob();

      const fileRef = ref(storage, `avatars/${currentUser.uid}.jpg`);

      await uploadBytes(fileRef, blob, {
        contentType: "image/jpeg",
      });

      const downloadURL = await getDownloadURL(fileRef);

      await updateUser({ avatar: downloadURL });

      blob.close?.();

      return downloadURL;
    } catch (error) {
      console.log("Profile Upload Error:", error);
    }
  };

  /* -----------------------------------------------------------
      REMOVE PROFILE PHOTO
  ----------------------------------------------------------- */
  const removeProfilePhoto = async () => {
    try {
      setUserData((prev) => ({
        ...(prev || {}),
        avatar: DEFAULT_AVATAR,
      }));

      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const fileRef = ref(storage, `avatars/${currentUser.uid}.jpg`);
        await deleteObject(fileRef);
      } catch (_) {}

      await updateUser({ avatar: DEFAULT_AVATAR });
    } catch (error) {
      console.log("Remove photo error:", error);
    }
  };

  /* -----------------------------------------------------------
      LOGOUT
  ----------------------------------------------------------- */
  const logout = async () => {
    try {
      await signOut(auth);
      setUserData({ avatar: DEFAULT_AVATAR });
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        userData,
        loadingUser,
        updateUser,
        uploadProfilePhoto,
        removeProfilePhoto,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
