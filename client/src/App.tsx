import { Switch, Route, Redirect, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import Income from "@/pages/Income";
import Admission from "@/pages/Admission";
import Expenses from "@/pages/Expenses";
import ManageData from "@/pages/ManageData";
import EntryMarks from "@/pages/EntryMarks";
import Marksheet from "@/pages/Marksheet";
import LoginPage from "@/pages/Login";
import Notifications from "@/pages/Notifications";
import NotFound from "@/pages/not-found";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { type User } from "@/lib/schemas";
import { Bell, BellRing, X } from "lucide-react";
import { usePushNotifications, useAppBadge } from "@/hooks/use-push-notifications";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

function NotificationHeader({ user }: { user: User }) {
  const [, setLocation] = useLocation();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: user?.role === "admin",
    refetchInterval: 30000,
  });

  const { data: studentUnreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/student-notifications/unread-count"],
    enabled: user?.role === "student",
    refetchInterval: 30000,
  });

  const adminUnread = unreadData?.count ?? 0;
  const studentUnread = studentUnreadData?.count ?? 0;
  const unreadCount = user?.role === "admin" ? adminUnread : studentUnread;

  useAppBadge(unreadCount);

  const handleBellClick = async () => {
    if (user?.role === "admin") {
      setLocation("/notifications");
    } else if (user?.role === "student") {
      await apiRequest("PATCH", "/api/student-notifications/read-all", {});
      queryClient.invalidateQueries({ queryKey: ["/api/student-notifications/unread-count"] });
      setLocation("/marksheet");
    }
  };

  const showBell = user?.role === "admin" || user?.role === "student";

  return (
    <header className="flex items-center justify-between px-4 h-16 shrink-0 bg-white backdrop-blur-md border-b z-20">
      <div className="flex items-center gap-4">
        <SidebarTrigger data-testid="button-sidebar-toggle" className="md:flex" />
        <div className="font-display font-black text-primary truncate tracking-tight hidden sm:block text-xl uppercase">
          Dynamic Coaching Center
        </div>
      </div>
      {showBell && (
        <button
          data-testid="button-notification-bell"
          onClick={handleBellClick}
          className="relative p-2 rounded-xl hover:bg-primary/5 transition-colors"
        >
          <Bell className="w-6 h-6 text-primary" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}
    </header>
  );
}

function NotificationPermissionBanner({ user }: { user: User }) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("push-banner-dismissed") === "true";
  });
  const { permission, requestPermissionAndSubscribe, isLoading } = usePushNotifications(user.id);

  if (dismissed) return null;
  if (permission === "granted" || permission === "denied") return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;

  const handleAllow = async () => {
    const granted = await requestPermissionAndSubscribe();
    if (granted) {
      localStorage.setItem("push-banner-dismissed", "true");
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("push-banner-dismissed", "true");
    setDismissed(true);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 border-b border-primary/20 text-sm">
      <BellRing className="w-4 h-4 text-primary shrink-0" />
      <span className="flex-1 text-primary font-medium">
        Enable notifications to get instant alerts for results and payments.
      </span>
      <button
        data-testid="button-allow-notifications"
        onClick={handleAllow}
        disabled={isLoading}
        className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-bold shrink-0 hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {isLoading ? "Enabling…" : "Allow"}
      </button>
      <button
        data-testid="button-dismiss-notifications"
        onClick={handleDismiss}
        className="p-1 rounded-lg hover:bg-primary/10 text-primary/60 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function Router() {
  const { data: user, isLoading } = useQuery<User>({ 
    queryKey: ["/api/user"],
    retry: false
  });
  const [location] = useLocation();

  if (isLoading) return null;

  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-svh w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden relative">
          <NotificationHeader user={user} />
          {(user.role === "student" || user.role === "teacher") && (
            <NotificationPermissionBanner user={user} />
          )}

          <main className="flex-1 overflow-auto bg-muted/30 px-2 py-3 md:p-6 pb-28 md:pb-28 w-full">
            <Switch>
              {user.role === 'admin' ? (
                <Route path="/" component={Dashboard} />
              ) : user.role === 'student' ? (
                <Route path="/" component={Dashboard} />
              ) : (
                <Route path="/">
                  <Redirect to="/admission" />
                </Route>
              )}
              <Route path="/income" component={Income} />
              <Route path="/results" component={EntryMarks} />
              <Route path="/marksheet" component={Marksheet} />
              <Route path="/admission">
                {user.role === 'teacher' ? <Admission /> : <Redirect to="/" />}
              </Route>
              {user.role === 'admin' && (
                <>
                  <Route path="/expenses" component={Expenses} />
                  <Route path="/manage" component={ManageData} />
                  <Route path="/notifications" component={Notifications} />
                </>
              )}
              <Route path="/login">
                <Redirect to="/" />
              </Route>
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
