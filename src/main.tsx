import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "@/lib/supabase";

async function bootstrap() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    window.history.replaceState(null, "", window.location.pathname);
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();
