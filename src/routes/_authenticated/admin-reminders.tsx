import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ReminderPicker } from "@/components/ReminderPicker";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import {
  useEventRecipients,
  useEvents,
  useMembers,
  useReminders,
  useSaveRecipients,
  useSaveReminders,
} from "@/lib/events";

export const Route = createFileRoute("/_authenticated/admin-reminders")({
  head: () => ({
    meta: [
      { title: "သတိပေးချက် စီမံခြင်း · ရွှေဇင်မောင်" },
      { name: "description", content: "Admin tools for band event reminders and recipients." },
      { property: "og:title", content: "Manage reminders · Shwe Zin Maung Band" },
      { property: "og:description", content: "Set reminder times and choose which members are notified." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminRemindersPage,
});

function AdminRemindersPage() {
  const { t, lang } = useI18n();
  const { isAdmin } = useAuth();
  const events = useEvents();
  const members = useMembers();
  const [eventId, setEventId] = useState<string>("");
  const reminders = useReminders(eventId || undefined);
  const recipients = useEventRecipients(eventId || undefined);
  const saveReminders = useSaveReminders();
  const saveRecipients = useSaveRecipients();
  const [offsets, setOffsets] = useState<number[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const locale = lang === "mm" ? "my-MM" : "en-GB";

  const upcoming = (events.data ?? []).filter((e) => new Date(e.starts_at) >= new Date());
  const current = (events.data ?? []).find((e) => e.id === eventId);

  useEffect(() => {
    if (!eventId && upcoming[0]) setEventId(upcoming[0].id);
  }, [eventId, upcoming]);

  useEffect(() => {
    setOffsets(
      (reminders.data ?? [])
        .map((r) => r.offset_minutes)
        .filter((m): m is number => typeof m === "number")
        .sort((a, b) => b - a),
    );
  }, [reminders.data]);

  useEffect(() => {
    setSelected((recipients.data ?? []).map((r) => r.user_id));
  }, [recipients.data]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-6">
          <p className="text-sm text-muted-foreground">{t("viewerNotice")}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> {t("backToList")}
        </Link>
        <h1 className="text-lg font-semibold">{t("manageReminders")}</h1>

        <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <Label htmlFor="event">{t("selectEvent")}</Label>
          <select
            id="event"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background p-2 text-sm"
          >
            {upcoming.map((e) => (
              <option key={e.id} value={e.id}>
                {new Date(e.starts_at).toLocaleDateString(locale, {
                  day: "numeric",
                  month: "short",
                })}{" "}
                — {e.title}
              </option>
            ))}
          </select>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">{t("reminderTimes")}</h2>
          <ReminderPicker value={offsets} onChange={setOffsets} />
          <Button
            size="sm"
            disabled={!current || saveReminders.isPending}
            onClick={async () => {
              if (!current) return;
              await saveReminders.mutateAsync({
                eventId: current.id,
                startsAt: current.starts_at,
                offsets,
              });
              toast.success(t("saved"));
            }}
          >
            {t("save")}
          </Button>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <h2 className="text-sm font-semibold">{t("recipients")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t("recipientsHint")}</p>
          </div>
          <ul className="space-y-2">
            {(members.data ?? []).map((m) => (
              <li key={m.id} className="flex items-center gap-3 text-sm">
                <Checkbox
                  id={`m-${m.id}`}
                  checked={selected.includes(m.id)}
                  onCheckedChange={(v) =>
                    setSelected((prev) =>
                      v === true ? [...prev, m.id] : prev.filter((id) => id !== m.id),
                    )
                  }
                />
                <Label htmlFor={`m-${m.id}`} className="font-normal">
                  {m.display_name ?? m.id.slice(0, 8)}
                </Label>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            {selected.length === 0 ? t("everyone") : `${selected.length}`}
          </p>
          <Button
            size="sm"
            disabled={!current || saveRecipients.isPending}
            onClick={async () => {
              if (!current) return;
              await saveRecipients.mutateAsync({ eventId: current.id, userIds: selected });
              toast.success(t("saved"));
            }}
          >
            {t("save")}
          </Button>
        </section>
      </main>
    </div>
  );
}
