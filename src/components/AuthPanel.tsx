import { LogIn, LogOut, Sparkles } from "lucide-react";
import type { User } from "firebase/auth";

type Props = {
  user: User | null;
  loading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
};

export function AuthPanel({ user, loading, onSignIn, onSignOut }: Props) {
  return (
    <div className="auth-panel">
      <div className="auth-copy">
        <Sparkles size={18} />
        <span>{user ? user.displayName ?? user.email : "Firebase workspace"}</span>
      </div>
      <button className="icon-text-button" type="button" onClick={user ? onSignOut : onSignIn} disabled={loading}>
        {user ? <LogOut size={17} /> : <LogIn size={17} />}
        <span>{user ? "Sign out" : "Google sign in"}</span>
      </button>
    </div>
  );
}
