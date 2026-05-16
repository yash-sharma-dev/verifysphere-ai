import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "@/lib/supabase";

async function bootstrap() {
  console.log("[auth] URL:", window.location.href);
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (accessToken && refreshToken) {
    console.log("[auth] tokens found in hash, calling setSession");
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    console.log("[auth] setSession result:", data.session?.user?.email, "error:", error?.message);
    window.history.replaceState(null, "", window.location.pathname);
  } else {
    console.log("[auth] no tokens in hash");
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();
