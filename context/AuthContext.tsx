import { eq } from "drizzle-orm";
import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "../db/client";
import { users } from "../db/schema";

type User = typeof users.$inferSelect;

interface AuthContextType {
  user: User | null;
  hasUsers: boolean; // <--- NEW FLAG
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<boolean>;
  signUp: (userData: typeof users.$inferInsert) => Promise<boolean>;
  signOut: () => void;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hasUsers, setHasUsers] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if ANY user exists on app start
  useEffect(() => {
    const checkUsers = async () => {
      try {
        const result = await db.select().from(users).limit(1);
        if (result.length > 0) {
          setHasUsers(true);
        } else {
          setHasUsers(false);
        }
      } catch (e) {
        console.error("Error checking users:", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkUsers();
  }, []);

  const signIn = async (email: string, pass: string) => {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      if (result.length > 0 && result[0].password === pass) {
        setUser(result[0]);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const signUp = async (userData: typeof users.$inferInsert) => {
    try {
      await db.insert(users).values(userData);

      // Auto-login the new user
      const newUser = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));
      if (newUser.length > 0) setUser(newUser[0]);

      setHasUsers(true); // Mark that the app now has an owner
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const signOut = () => {
    setUser(null);
  };

  const updateUser = async (updatedData: Partial<User>) => {
    if (!user) return;
    await db.update(users).set(updatedData).where(eq(users.id, user.id));
    const freshUser = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));
    if (freshUser[0]) setUser(freshUser[0]);
  };

  return (
    <AuthContext.Provider
      value={{ user, hasUsers, isLoading, signIn, signUp, signOut, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
