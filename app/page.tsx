"use client"

import { useState, useEffect } from "react";
import ChatInterface from "@/components/chat-interface";
import AuthScreen from "@/components/auth-screen";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/lib_firebase";
import { Card, CardContent, CardTitle, CardDescription } from "../components/ui/card";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage first for faster initial render
    const storedAuthState = localStorage.getItem("auth_state");
    if (storedAuthState) {
      setIsLoggedIn(storedAuthState === "true");
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const newAuthState = !!user;
      setIsLoggedIn(newAuthState);
      localStorage.setItem("auth_state", newAuthState.toString());
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="h-screen w-screen overflow-hidden bg-black flex items-center justify-center">
        <Card className="flex items-center justify-center min-h-screen bg-black animate-fadeIn border-0">
          <CardContent className="text-center bg-black relative w-full">
            <div className="absolute inset-0 bg-background blur-lg opacity-50"></div>
            <CardTitle className="text-4xl font-semibold text-foreground mb-4 animate-pulse">
              Be patient, your conversations are loading...
            </CardTitle>
            <div className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
            <CardDescription className="mt-4">
              This might take a few moments. Thanks for your patience!
            </CardDescription>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      {isLoggedIn ? <ChatInterface /> : <AuthScreen />}
    </main>
  );
}