import { createFileRoute } from "@tanstack/react-router";
import { formatOffset } from "@/lib/reminder-options";

const TZ = "Asia/Yangon";

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("my-MM", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("my-MM", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildMessage(event: {
  title: string;
  starts_at: string;
  arrive_at: string | null;
  location: string | null;
  notes: string | null;
}, offsetMinutes: number | null) {
  const lead = offsetMinutes ? ` (${formatOffset(offsetMinutes, "mm")})` : "";
  const lines = [
    `${dateLabel(event.starts_at)} ${timeLabel(event.starts_at)} တွင် ပွဲရှိသည်။`,
  ];
  if (event.arrive_at) {
    lines.push(`ရောက်ရှိရမည့်အချိန်: ${timeLabel(event.arrive_at)}`);
  }
  if (event.location) lines.push(`နေရာ: ${event.location}`);
  return {
    title: `သတိပေးချက်${lead}: ${event.title}`,
    body: lines.join(" · "),
  };
}

async function dispatch() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendPush } = await import("@/lib/push.server");

  const nowIso = new Date().toISOString();
  const floorIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: due, error } = await supabaseAdmin
    .from("event_reminders")
    .select("id,event_id,remind_at,offset_minutes")
    .is("sent_at", null)
    .lte("remind_at", nowIso)
    .gte("remind_at", floorIso)
    .order("remind_at", { ascending: true })
    .limit(50);
  if (error) throw error;
  if (!due || due.length === 0) return { due: 0, notifications: 0, pushed: 0 };

  const { data: members } = await supabaseAdmin.from("profiles").select("id");
  const { data: settings } = await supabaseAdmin
    .from("notification_settings")
    .select("user_id,notifications_enabled,push_enabled,sound_enabled");
  const settingsByUser = new Map((settings ?? []).map((s) => [s.user_id, s]));

  let notifications = 0;
  let pushed = 0;

  for (const reminder of due) {
    const { data: event } = await supabaseAdmin
      .from("events")
      .select("id,title,starts_at,arrive_at,location,notes,completed")
      .eq("id", reminder.event_id)
      .maybeSingle();

    if (!event || event.completed) {
      await supabaseAdmin
        .from("event_reminders")
        .update({ sent_at: nowIso })
        .eq("id", reminder.id);
      continue;
    }

    const { data: chosen } = await supabaseAdmin
      .from("event_recipients")
      .select("user_id")
      .eq("event_id", event.id);

    const audience =
      chosen && chosen.length > 0
        ? chosen.map((c) => c.user_id)
        : (members ?? []).map((m) => m.id);

    const recipients = audience.filter((userId) => {
      const pref = settingsByUser.get(userId);
      return pref ? pref.notifications_enabled : true;
    });

    const message = buildMessage(event, reminder.offset_minutes);

    if (recipients.length > 0) {
      const { error: insertError } = await supabaseAdmin.from("notifications").insert(
        recipients.map((userId) => ({
          user_id: userId,
          event_id: event.id,
          reminder_id: reminder.id,
          title: message.title,
          body: message.body,
        })),
      );
      if (insertError) throw insertError;
      notifications += recipients.length;

      const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("id,user_id,endpoint,p256dh,auth")
        .in("user_id", recipients);

      for (const sub of subs ?? []) {
        const pref = settingsByUser.get(sub.user_id);
        const result = await sendPush(sub, {
          title: message.title,
          body: message.body,
          url: "/notifications",
          tag: reminder.id,
          silent: pref ? !pref.sound_enabled : false,
        });
        if (result === "sent") pushed += 1;
        if (result === "gone") {
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }

    await supabaseAdmin.from("event_reminders").update({ sent_at: nowIso }).eq("id", reminder.id);
  }

  return { due: due.length, notifications, pushed };
}

async function handle({ request }: { request: Request }) {
  const expected = process.env["REMINDER_CRON_TOKEN"];
  const header = request.headers.get("authorization") ?? "";
  if (!expected || header !== `Bearer ${expected}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const result = await dispatch();
    return Response.json(result);
  } catch (error) {
    console.error("Reminder dispatch failed", error);
    return new Response("Dispatch failed", { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/reminders/dispatch")({
  server: { handlers: { POST: handle, GET: handle } },
});
