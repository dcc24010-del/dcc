import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, UserPlus, Wallet, FileCheck, CheckCheck, RefreshCw, RotateCcw, Banknote, BellRing, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import type { Notification } from "@shared/schema";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { usePushNotifications } from "@/hooks/use-push-notifications";

const TYPE_CONFIG = {
  admission: {
    label: "Admission",
    icon: UserPlus,
    bg: "bg-green-50 border-green-200",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  payment: {
    label: "Payment",
    icon: Wallet,
    bg: "bg-blue-50 border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  result: {
    label: "Result",
    icon: FileCheck,
    bg: "bg-orange-50 border-orange-200",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
  },
};

type TeacherCollection = {
  teacher: { id: number; username: string; teacherId?: string | null };
  amount: number;
  lastUpdated: string;
};

function PushTestCard() {
  const { toast } = useToast();
  const { permission, requestPermissionAndSubscribe, isLoading: subLoading } = usePushNotifications();

  const testMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/push/test"),
    onSuccess: (data: any) => {
      toast({ title: "✅ Test Sent!", description: `Push delivered to ${data.subscriptions} subscription(s). Check your phone/browser.` });
    },
    onError: (err: any) => {
      const msg = err?.message || "Unknown error";
      toast({ title: "Push Failed", description: msg, variant: "destructive" });
    },
  });

  const { data: vapidData } = useQuery<{ key: string }>({ queryKey: ["/api/push/vapid-public-key"] });
  const vapidConfigured = !!(vapidData?.key);
  const swSupported = "serviceWorker" in navigator && "PushManager" in window;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <BellRing className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Push Notification Diagnostics</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold ${vapidConfigured ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {vapidConfigured ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          VAPID Keys: {vapidConfigured ? "Configured ✓" : "Missing ✗"}
        </div>
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold ${swSupported ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {swSupported ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          Service Worker: {swSupported ? "Supported ✓" : "Not Supported ✗"}
        </div>
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold ${permission === "granted" ? "bg-green-50 text-green-700" : permission === "denied" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-700"}`}>
          <Bell className="w-3.5 h-3.5" />
          Permission: {permission === "granted" ? "Granted ✓" : permission === "denied" ? "Denied ✗" : "Not Asked"}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {permission !== "granted" && (
          <Button
            size="sm"
            variant="outline"
            disabled={subLoading}
            onClick={requestPermissionAndSubscribe}
            data-testid="button-enable-push-admin"
            className="rounded-xl text-xs font-bold gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            {subLoading ? "Enabling…" : "Enable Push on This Device"}
          </Button>
        )}
        <Button
          size="sm"
          disabled={testMutation.isPending}
          onClick={() => testMutation.mutate()}
          data-testid="button-test-push"
          className="rounded-xl text-xs font-bold gap-1.5"
        >
          <BellRing className="w-3.5 h-3.5" />
          {testMutation.isPending ? "Sending…" : "Send Test Notification"}
        </Button>
      </div>

      {!vapidConfigured && (
        <div className="text-xs bg-red-50 text-red-700 rounded-xl px-3 py-2.5 border border-red-200">
          <strong>⚠ Vercel Config Required:</strong> Add <code className="bg-red-100 px-1 rounded">VAPID_PUBLIC_KEY</code>, <code className="bg-red-100 px-1 rounded">VAPID_PRIVATE_KEY</code>, and <code className="bg-red-100 px-1 rounded">VAPID_EMAIL</code> to your Vercel Environment Variables. See the chat for the exact values.
        </div>
      )}
    </div>
  );
}

export default function Notifications() {
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });

  const { data: collections = [], isLoading: collectionsLoading, refetch: refetchCollections } = useQuery<TeacherCollection[]>({
    queryKey: ["/api/collections"],
    enabled: user?.role === "admin",
  });

  const markAllRead = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: (teacherId: number) => apiRequest("POST", `/api/collections/${teacherId}/reset`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({ title: "Collection Reset", description: "The teacher's balance has been cleared." });
    },
    onError: () => {
      toast({ title: "Reset Failed", variant: "destructive" });
    },
  });

  function handleReset(teacherId: number, teacherName: string) {
    if (confirm(`Reset collection balance for ${teacherName} to ৳0? This confirms cash has been received.`)) {
      resetMutation.mutate(teacherId);
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const isAdmin = user?.role === "admin";

  const action = (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetchCollections()}
          className="flex items-center gap-2 rounded-xl text-xs font-bold"
          data-testid="button-refresh-collections"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      )}
      {unreadCount > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
          className="flex items-center gap-2 rounded-xl text-xs font-bold"
          data-testid="button-mark-all-read"
        >
          <CheckCheck className="w-4 h-4" />
          Mark all as read
        </Button>
      )}
    </div>
  );

  return (
    <Layout
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
      action={action}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Push Notification Diagnostics */}
        {isAdmin && <PushTestCard />}

        {/* Authority Only: Daily Collection Summary */}
        {isAdmin && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Daily Collection Summary</h2>
            </div>
            {collectionsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : collections.length === 0 ? (
              <div className="bg-muted/30 rounded-2xl border border-border p-6 text-center text-sm text-muted-foreground">
                No teachers found. Add teachers to track collections.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {collections.map(({ teacher, amount, lastUpdated }) => (
                  <div
                    key={teacher.id}
                    data-testid={`card-collection-${teacher.id}`}
                    className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          {teacher.teacherId ?? "Teacher"}
                        </p>
                        <p className="font-bold text-foreground text-sm leading-tight">{teacher.username}</p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-xl text-sm font-bold ${amount > 0 ? "bg-indigo-50 text-indigo-700" : "bg-muted text-muted-foreground"}`}>
                        ৳{amount.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {lastUpdated && amount > 0 ? (
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">No collections yet</span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={amount === 0 || resetMutation.isPending}
                        onClick={() => handleReset(teacher.id, teacher.username)}
                        data-testid={`button-reset-collection-${teacher.id}`}
                        className="h-7 text-[11px] gap-1 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 disabled:opacity-40"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications List */}
        <div>
          {isAdmin && (
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Activity Feed</h2>
            </div>
          )}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No notifications yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Activity such as admissions, payments, and results will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.result;
                const Icon = config.icon;
                return (
                  <div
                    key={notif.id}
                    data-testid={`notification-item-${notif.id}`}
                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${config.bg} ${
                      !notif.isRead ? "ring-1 ring-inset ring-current/10 shadow-sm" : "opacity-75"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}>
                      <Icon className={`w-5 h-5 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground leading-snug">{notif.message}</p>
                        {!notif.isRead && (
                          <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${config.dot}`} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${config.badge}`}>
                          {config.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
