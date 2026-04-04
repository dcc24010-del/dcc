import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log("[v0] Dynamic Coaching Center - App initializing...");

const rootElement = document.getElementById("root");
if (rootElement) {
  console.log("[v0] Root element found, mounting React app");
  createRoot(rootElement).render(<App />);
} else {
  console.error("[v0] Root element not found!");
}
