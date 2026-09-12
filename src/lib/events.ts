import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BandEvent = {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
  notes: string | null;
  completed: boolean;
  created_by: string | null;
};

export type Reminder = {
  id: string;
  event_id: string;
  remind_at: string;
  label: string | null;
};

export const eventsKey = ["events"] as const;

export function useEvents() {
  return useQuery({
    queryKey: eventsKey,
    queryFn: async (): Promise<BandEvent[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("id,title,starts_at,location,notes,completed,created_by")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BandEvent[];
    },
  });
}

export function useReminders(eventId?: string) {
  return useQuery({
    queryKey: ["reminders", eventId ?? "all"],
    queryFn: async (): Promise<Reminder[]> => {
      let query = supabase.from("event_reminders").select("id,event_id,remind_at,label");
      if (eventId) query = query.eq("event_id", eventId);
      const { data, error } = await query.order("remind_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Reminder[];
    },
  });
}

/** Keeps every open app in sync with the cloud database. */
export function useEventsRealtime() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("events-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        queryClient.invalidateQueries({ queryKey: eventsKey });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "event_reminders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["reminders"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export type EventInput = {
  title: string;
  starts_at: string;
  location: string | null;
  notes: string | null;
};

export function useSaveEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
      reminders,
    }: {
      id?: string;
      values: EventInput;
      reminders: string[];
    }) => {
      let eventId = id;
      if (eventId) {
        const { error } = await supabase.from("events").update(values).eq("id", eventId);
        if (error) throw error;
        const { error: delError } = await supabase
          .from("event_reminders")
          .delete()
          .eq("event_id", eventId);
        if (delError) throw delError;
      } else {
        const user = (await supabase.auth.getUser()).data.user;
        const { data, error } = await supabase
          .from("events")
          .insert({ ...values, created_by: user?.id ?? null })
          .select("id")
          .single();
        if (error) throw error;
        eventId = data.id;
      }
      const rows = reminders
        .filter((r) => r)
        .map((remind_at) => ({ event_id: eventId as string, remind_at }));
      if (rows.length > 0) {
        const { error } = await supabase.from("event_reminders").insert(rows);
        if (error) throw error;
      }
      return eventId as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsKey });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}

export function useToggleCompleted() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("events").update({ completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventsKey }),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventsKey }),
  });
}

export function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function isTomorrow(d: Date) {
  const tomorrow = startOfDay(new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(d, tomorrow);
}
