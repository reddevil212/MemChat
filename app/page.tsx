import ChatInterface from "@/components/chat-interface";
import AuthScreen from "@/components/auth-screen";
import { cookies } from "next/headers";

export default async function Home() {
  // Await cookies to get the resolved value
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has("user_session");

  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      {isLoggedIn ? <ChatInterface /> : <AuthScreen />}
    </main>
  );
}
