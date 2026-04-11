import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerInstallPrompt } from "@/hooks/use-pwa-install";

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  registerInstallPrompt(e);
});

createRoot(document.getElementById("root")!).render(<App />);
