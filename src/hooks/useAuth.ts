import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { auth, googleProvider } from "../lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
  }, []);

  return useMemo(
    () => ({
      user,
      loading,
      signIn: () => signInWithPopup(auth, googleProvider),
      signOut: () => signOut(auth),
    }),
    [user, loading],
  );
}
