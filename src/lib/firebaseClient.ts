import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  Auth
} from "firebase/auth";

let appInstance: any = null;
let authInstance: Auth | null = null;

export async function getFirebaseConfig() {
  try {
    const res = await fetch("/api/config/firebase");
    if (!res.ok) {
      throw new Error("Could not load Firebase client configuration from server");
    }
    return await res.json();
  } catch (err) {
    console.warn("[Firebase Client] Error loading config:", err);
    return null;
  }
}

export async function initFirebaseClient() {
  if (authInstance) return { app: appInstance, auth: authInstance };
  
  const config = await getFirebaseConfig();
  if (!config) {
    console.warn("[Firebase Client] Config was null, client-side Firebase Auth/Firestore not initialized.");
    return { app: null, auth: null };
  }

  try {
    if (getApps().length === 0) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }
    authInstance = getAuth(appInstance);
    console.log("[Firebase Client] Auth connected successfully.");
    return { app: appInstance, auth: authInstance };
  } catch (err) {
    console.error("[Firebase Client] Initialization failed:", err);
    return { app: null, auth: null };
  }
}

export function getVirtualEmail(name: string, id: string) {
  const cleanId = id.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const cleanName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  return `leader-${cleanId || cleanName}@rodiziosystem.com`;
}

export async function authenticateLeaderOnFirebase(leaderId: string, name: string, passcode: string) {
  const { auth } = await initFirebaseClient();
  if (!auth) {
    console.warn("[Firebase Auth] Auth not initialized, skipping Firebase Auth sync.");
    return null;
  }

  const email = getVirtualEmail(name, leaderId);
  // Ensure passcode is at least 6 characters (Firebase Auth requirement)
  const securePassword = passcode.trim().length >= 6 ? passcode.trim() : `${passcode.trim()}12345`;

  try {
    // Attempt login
    console.log(`[Firebase Auth] Authenticating leader: ${email}...`);
    const cred = await signInWithEmailAndPassword(auth, email, securePassword);
    console.log("[Firebase Auth] Authentication successful for leader:", email);
    return cred.user;
  } catch (loginErr: any) {
    if (loginErr.code === "auth/operation-not-allowed") {
      console.warn(
        "[Firebase Auth] ERROR: Email/Password sign-in provider is disabled in this Firebase project. " +
        "Please go to the Firebase Console -> Authentication -> Sign-in Method, and enable 'Email/Password' to resolve auth/operation-not-allowed."
      );
      return null;
    }

    // If user does not exist, or credential fails on first create, register them dynamically on Firebase Auth
    // Firebase auth returns 'auth/user-not-found' when user doesn't exist. Sometimes 'auth/invalid-credential' is returned.
    if (loginErr.code === "auth/user-not-found" || loginErr.code === "auth/invalid-credential") {
      try {
        console.log(`[Firebase Auth] User not found/First login. Registering new leader: ${email}...`);
        const cred = await createUserWithEmailAndPassword(auth, email, securePassword);
        console.log("[Firebase Auth] Dynamic signup successful for leader:", email);
        return cred.user;
      } catch (signupErr: any) {
        if (signupErr.code === "auth/operation-not-allowed") {
          console.warn(
            "[Firebase Auth] ERROR: Email/Password dynamic signup/sign-in provider is disabled in this Firebase project. " +
            "Please go to the Firebase Console -> Authentication -> Sign-in Method, and enable 'Email/Password' to resolve auth/operation-not-allowed."
          );
          return null;
        }
        console.error("[Firebase Auth] Error registering leader:", signupErr.message);
        throw signupErr;
      }
    } else {
      console.error("[Firebase Auth] Login error code:", loginErr.code, loginErr.message);
      throw loginErr;
    }
  }
}

export async function signOutLeader() {
  try {
    const { auth } = await initFirebaseClient();
    if (auth) {
      await firebaseSignOut(auth);
      console.log("[Firebase Auth] Signout successful on client.");
    }
  } catch (err) {
    console.warn("[Firebase Auth] Logout error:", err);
  }
}
