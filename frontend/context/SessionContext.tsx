"use client";

import { getToken } from "@/utils/auth";
import axiosInstance from "@/utils/axios";
import { User } from "@/schema/user";
import { useRouter } from "next/navigation";
import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";

type SessionContextType = {
  profile: User | null;
  setProfile: (user: User) => void;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<User | null>(null);
  const router = useRouter();
  const token = getToken();

  useEffect(() => {

    if (token) {
      localStorage.setItem(btoa('token'), btoa(token));
      axiosInstance.get('/api/auth/profile').then((resp) => {
        if (resp.data.id) {
          setProfile(resp.data)
        }
      })
    }
    else {
      router.push('/login')
    }

  }, [token]);

  return (
    <SessionContext.Provider value={{ profile, setProfile }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
