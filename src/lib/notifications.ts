import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPushPublicKey } from "@/lib/notifications.functions";

export type AppNotification = {
  id: string;
  event_id: string | null;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type NotificationSettings = {
  user_id: string;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  push_enabled: boolean;
  default_offsets: number[];
};

export const notificationsKey = ["notifications"] as const;
export const settingsKey = ["notification-settings"] as const;

export function useNotifications() {
  return useQuery({
    queryKey: notificationsKey,
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,event_id,title,body,read_at,created_at")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as AppNotification[];
    },
  });
}

export function useUnreadCount() {
  const notifications = useNotifications();
  return (notifications.data ?? []).filter((n) => !n.read_at).length;
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return;
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: async (): Promise<NotificationSettings | null> => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return null;
      const { data, error } = await supabase
        .from("notification_settings")
        .select("user_id,notifications_enabled,sound_enabled,push_enabled,default_offsets")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as NotificationSettings;
      const { data: created, error: insertError } = await supabase
        .from("notification_settings")
        .insert({ user_id: user.id })
        .select("user_id,notifications_enabled,sound_enabled,push_enabled,default_offsets")
        .single();
      if (insertError) throw insertError;
      return created as NotificationSettings;
    },
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Omit<NotificationSettings, "user_id">>) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("not signed in");
      const { error } = await supabase
        .from("notification_settings")
        .update(patch)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: settingsKey }),
  });
}

/** Short chime played when a new reminder lands while the app is open. */
export function playNotificationSound() {
  try {
    const audio = new Audio("/notify.mp3");
    audio.volume = 0.7;
    void audio.play();
  } catch {
    /* ignored: browsers may block audio before the first interaction */
  }
}

/** Live inbox: refreshes the bell and plays the chime on new rows. */
export function useNotificationsRealtime() {
  const queryClient = useQueryClient();
  const settings = useNotificationSettings();
  const soundOn = settings.data?.sound_enabled ?? true;
  const enabled = settings.data?.notifications_enabled ?? true;
  const soundRef = useRef(soundOn);
  const enabledRef = useRef(enabled);
  soundRef.current = soundOn;
  enabledRef.current = enabled;

  useEffect(() => {
    const channel = supabase
      .channel("notifications-inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
        queryClient.invalidateQueries({ queryKey: notificationsKey });
        if (enabledRef.current && soundRef.current) playNotificationSound();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = window.atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export type PushState =
  | "registered"
  | "unsupported"
  | "open-in-new-tab"
  | "denied"
  | "not-configured";

/** Registers this device for real push notifications. Must run from a click. */
export function usePushRegistration() {
  const queryClient = useQueryClient();

  const enablePush = useCallback(async (): Promise<PushState> => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window))
      return "unsupported";
    if (window.top !== window.self) return "open-in-new-tab";

    const { publicKey } = await getPushPublicKey();
    if (!publicKey) return "not-configured";

    const permission =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();
    if (permission !== "granted") return "denied";

    const registration = await navigator.serviceWorker.register("/push-sw.js");
    await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    const json = subscription.toJSON();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user || !json.keys) return "denied";

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      { onConflict: "endpoint" },
    );
    if (error) throw error;

    await supabase
      .from("notification_settings")
      .update({ push_enabled: true })
      .eq("user_id", user.id);
    queryClient.invalidateQueries({ queryKey: settingsKey });
    return "registered";
  }, [queryClient]);

  const disablePush = useCallback(async () => {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration("/push-sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        await subscription.unsubscribe();
      }
    }
    const user = (await supabase.auth.getUser()).data.user;
    if (user) {
      await supabase
        .from("notification_settings")
        .update({ push_enabled: false })
        .eq("user_id", user.id);
    }
    queryClient.invalidateQueries({ queryKey: settingsKey });
  }, [queryClient]);

  return { enablePush, disablePush };
}
