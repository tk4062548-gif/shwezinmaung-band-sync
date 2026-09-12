import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BandEvent = {
  id: string;
  title: string;
  starts_at: string;
  arrive_at: string | null;
  location: string | null;
  notes: string | null;
  completed: boolean;
  created_by: string | null;
};

export type Reminder = {
  id: string;
  event_id: string;
  remind_at: string;
  offset_minutes: number | null;
  label: string | null;
  sent_at: string | null;
};

const EVENT_COLUMNS = "id,title,starts_at,arrive_at,location,notes,completed,created_by";

export const eventsKey = ["events"] as const;

export function useEvents() {
  return useQuery({
    queryKey: eventsKey,
    queryFn: async (): Promise<BandEvent[]> => {
      const { data, error } = await supabase
        .from("events")
        .select(EVENT_COLUMNS)
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
      let query = supabase
        .from("event_reminders")
        .select("id,event_id,remind_at,offset_minutes,label,sent_at");
      if (eventId) query = query.eq("event_id", eventId);
      const { data, error } = await query.order("remind_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Reminder[];
    },
  });
}

/** Members that receive reminders for an event (empty list = everyone). */
export function useEventRecipients(eventId?: string) {
  return useQuery({
    queryKey: ["event-recipients", eventId ?? "all"],
    queryFn: async (): Promise<{ event_id: string; user_id: string }[]> => {
      let query = supabase.from("event_recipients").select("event_id,user_id");
      if (eventId) query = query.eq("event_id", eventId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMembers() {
  return useQuery({
    queryKey: ["members"],
    queryFn: async (): Promise<{ id: string; display_name: string | null }[]> => {
      const { data, error } = await supabase.from("profiles").select("id,display_name");
      if (error) throw error;
      return data ?? [];
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
  arrive_at: string | null;
  location: string | null;
  notes: string | null;
};

export type ReminderInput = { remind_at: string; offset_minutes: number | null };

export function useSaveEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
      reminders,
      recipients,
    }: {
      id?: string;
      values: EventInput;
      reminders: ReminderInput[];
      recipients?: string[];
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
        .filter((r) => r.remind_at)
        .map((r) => ({
          event_id: eventId as string,
          remind_at: r.remind_at,
          offset_minutes: r.offset_minutes,
        }));
      if (rows.length > 0) {
        const { error } = await supabase.from("event_reminders").insert(rows);
        if (error) throw error;
      }

      if (recipients) {
        const { error: clearError } = await supabase
          .from("event_recipients")
          .delete()
          .eq("event_id", eventId);
        if (clearError) throw clearError;
        if (recipients.length > 0) {
          const { error } = await supabase
            .from("event_recipients")
            .insert(recipients.map((user_id) => ({ event_id: eventId as string, user_id })));
          if (error) throw error;
        }
      }

      return eventId as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsKey });
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      queryClient.invalidateQueries({ queryKey: ["event-recipients"] });
    },
  });
}

/** Replaces the reminder list of one event (used by the admin reminder page). */
export function useSaveReminders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      startsAt,
      offsets,
    }: {
      eventId: string;
      startsAt: string;
      offsets: number[];
    }) => {
      const { error: delError } = await supabase
        .from("event_reminders")
        .delete()
        .eq("event_id", eventId);
      if (delError) throw delError;
      if (offsets.length === 0) return;
      const rows = offsets.map((offset_minutes) => ({
        event_id: eventId,
        offset_minutes,
        remind_at: new Date(new Date(startsAt).getTime() - offset_minutes * 60_000).toISOString(),
      }));
      const { error } = await supabase.from("event_reminders").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders"] }),
  });
}

export function useSaveRecipients() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, userIds }: { eventId: string; userIds: string[] }) => {
      const { error: delError } = await supabase
        .from("event_recipients")
        .delete()
        .eq("event_id", eventId);
      if (delError) throw delError;
      if (userIds.length === 0) return;
      const { error } = await supabase
        .from("event_recipients")
        .insert(userIds.map((user_id) => ({ event_id: eventId, user_id })));
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event-recipients"] }),
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
