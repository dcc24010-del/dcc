import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let _deferredPrompt: BeforeInstallPromptEvent | null = null;
const _listeners: Set<(prompt: BeforeInstallPromptEvent | null) => void> = new Set();

export function registerInstallPrompt(event: Event) {
  _deferredPrompt = event as BeforeInstallPromptEvent;
  _listeners.forEach((fn) => fn(_deferredPrompt));
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(_deferredPrompt);

  useEffect(() => {
    const handler = (prompt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(prompt);
    };
    _listeners.add(handler);
    return () => {
      _listeners.delete(handler);
    };
  }, []);

  const isInstalled =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true);

  const handleInstall = async (): Promise<"accepted" | "dismissed" | "already_installed" | "unavailable"> => {
    if (isInstalled) {
      return "already_installed";
    }
    if (!deferredPrompt) {
      return "unavailable";
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      _deferredPrompt = null;
      setDeferredPrompt(null);
      _listeners.forEach((fn) => fn(null));
    }
    return outcome;
  };

  return { handleInstall, isInstalled, canInstall: !!deferredPrompt };
}
