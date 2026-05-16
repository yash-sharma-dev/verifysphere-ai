import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current session user
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          id: data.user.id,
          name:
            data.user.user_metadata.full_name ||
            data.user.email ||
            "User",
          email: data.user.email || "",
        });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user;

      if (currentUser) {
        setUser({
          id: currentUser.id,
          name:
            currentUser.user_metadata.full_name ||
            currentUser.email ||
            "User",
          email: currentUser.email || "",
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loginWithGoogle,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};