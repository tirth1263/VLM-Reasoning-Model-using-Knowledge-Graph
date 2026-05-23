import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type AuthError,
  type User,
} from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { auth, googleProvider } from "../lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    void getRedirectResult(auth).catch((error: AuthError) => {
      setAuthError(readableAuthError(error));
    });

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  async function signIn() {
    setAuthError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const authError = error as AuthError;
      if (["auth/popup-blocked", "auth/cancelled-popup-request", "auth/operation-not-supported-in-this-environment"].includes(authError.code)) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      setAuthError(readableAuthError(authError));
    } finally {
      setLoading(false);
    }
  }

  async function logOut() {
    setAuthError("");
    await signOut(auth);
  }

  return useMemo(
    () => ({
      user,
      loading,
      authError,
      signIn,
      signOut: logOut,
      clearAuthError: () => setAuthError(""),
    }),
    [user, loading, authError],
  );
}

function readableAuthError(error: AuthError) {
  if (error.code === "auth/unauthorized-domain") {
    return "Google sign-in is blocked because this domain is not authorized in Firebase Authentication settings.";
  }
  if (error.code === "auth/operation-not-allowed") {
    return "Google sign-in is not enabled for this Firebase project.";
  }
  if (error.code === "auth/popup-closed-by-user") {
    return "The Google sign-in window was closed before authentication finished.";
  }
  return error.message || "Google sign-in failed. Please try again.";
}
