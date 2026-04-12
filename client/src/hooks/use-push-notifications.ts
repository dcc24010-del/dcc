import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(userId?: number) {
  const queryClient = useQueryClient();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const subscriptionRef = useRef<PushSubscription | null>(null);

  useEffect(() => {
    if (!("Notification" in window)) return;
    setPermission(Notification.permission);
  }, []);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push not supported");
      }

      const { data: vapidData } = await fetch("/api/push/vapid-public-key").then(r => r.json()).then(d => ({ data: d }));
      const vapidKey = vapidData?.key;
      if (!vapidKey) throw new Error("No VAPID key");

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      subscriptionRef.current = sub;
      const json = sub.toJSON();
      await apiRequest("POST", "/api/push/subscribe", {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      });
      setIsSubscribed(true);
      return sub;
    },
  });

  const requestPermissionAndSubscribe = async (): Promise<boolean> => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") {
      setPermission("granted");
      await subscribeMutation.mutateAsync();
      return true;
    }
    if (Notification.permission === "denied") return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      await subscribeMutation.mutateAsync();
      return true;
    }
    return false;
  };

  return { permission, isSubscribed, requestPermissionAndSubscribe, isLoading: subscribeMutation.isPending };
}

export function useAppBadge(count: number) {
  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;
    if (count > 0) {
      (navigator as any).setAppBadge(count).catch(() => {});
    } else {
      (navigator as any).clearAppBadge().catch(() => {});
    }
  }, [count]);
}
