import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously, User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const mainframeConfig = {
  apiKey: "AIzaSyB-PCtfyvVk4jgKR3fwK78vhqPC0W_0lqA",
  authDomain: "gen-lang-client-0653546461.firebaseapp.com",
  projectId: "gen-lang-client-0653546461",
};

const mainframeDatabaseId = "ai-studio-b01f7cc1-a387-4e70-ac1f-092def9e2753";

// Initialize secondary Firebase app
const mainframeApp = !getApps().find(app => app.name === "mainframe")
  ? initializeApp(mainframeConfig, "mainframe")
  : getApp("mainframe");

const mainframeAuth = getAuth(mainframeApp);
const mainframeDb = getFirestore(mainframeApp, mainframeDatabaseId);

export async function syncWithMainframe(user: FirebaseUser) {
  try {
    // Sign in anonymously to the mainframe
    await signInAnonymously(mainframeAuth);

    // Upsert user profile into mainframe Firestore
    const profileRef = doc(mainframeDb, "profiles", user.uid);
    await setDoc(profileRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      app_source: "ExplainerX",
      last_login: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Failed to sync with StarVortex Mainframe:", error);
  }
}
