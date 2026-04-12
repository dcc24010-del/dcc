import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerInstallPrompt } from "@/hooks/use-pwa-install";

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  registerInstallPrompt(e);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
      console.warn("[SW] Registration failed:", err);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
