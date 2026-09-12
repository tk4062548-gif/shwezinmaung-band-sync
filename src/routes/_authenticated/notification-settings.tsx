import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ReminderPicker } from "@/components/ReminderPicker";
import { useI18n } from "@/lib/i18n";
import {
  playNotificationSound,
  usePushRegistration,
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@/lib/notifications";
import { sendTestPush } from "@/lib/notifications.functions";

export const Route = createFileRoute("/_authenticated/notification-settings")({
  head: () => ({
    meta: [
      { title: "အသိပေးချက် အပြင်အဆင် · ရွှေဇင်မောင်" },
      { name: "description", content: "Choose how band event reminders reach you." },
      { property: "og:title", content: "Notification settings · Shwe Zin Maung Band" },
      { property: "og:description", content: "Turn reminders, sound and push notifications on or off." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationSettingsPage,
});

function NotificationSettingsPage() {
  const { t } = useI18n();
  const settings = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const { enablePush, disablePush } = usePushRegistration();
  const [busy, setBusy] = useState(false);
  const data = settings.data;

  async function handlePush(next: boolean) {
    setBusy(true);
    try {
      if (!next) {
        await disablePush();
        return;
      }
      const state = await enablePush();
      if (state === "registered") toast.success(t("pushEnabled"));
      else if (state === "unsupported") toast.error(t("pushUnsupported"));
      else if (state === "open-in-new-tab") toast.error(t("pushOpenNewTab"));
      else if (state === "denied") toast.error(t("pushDenied"));
      else toast.error(t("pushNotConfigured"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> {t("backToList")}
        </Link>

        <h1 className="text-lg font-semibold">{t("notificationSettings")}</h1>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="notif">{t("notificationsOn")}</Label>
            <Switch
              id="notif"
              checked={data?.notifications_enabled ?? true}
              onCheckedChange={(v) => update.mutate({ notifications_enabled: v })}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="sound">{t("soundOn")}</Label>
            <Switch
              id="sound"
              checked={data?.sound_enabled ?? true}
              onCheckedChange={(v) => update.mutate({ sound_enabled: v })}
            />
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Label htmlFor="push">{t("pushOn")}</Label>
              <p className="mt-1 text-xs text-muted-foreground">{t("pushHint")}</p>
            </div>
            <Switch
              id="push"
              disabled={busy}
              checked={data?.push_enabled ?? false}
              onCheckedChange={handlePush}
            />
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <Button variant="secondary" size="sm" onClick={() => playNotificationSound()}>
              <Volume2 className="size-4" /> {t("testSound")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                const result = await sendTestPush();
                if (result.sent > 0) toast.success(t("testSent"));
                else toast.error(t("noDevice"));
              }}
            >
              {t("testNotification")}
            </Button>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <h2 className="text-sm font-semibold">{t("reminderPrefs")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t("reminderPrefsHint")}</p>
          </div>
          <ReminderPicker
            value={data?.default_offsets ?? []}
            onChange={(next) => update.mutate({ default_offsets: next })}
          />
        </section>
      </main>
    </div>
  );
}
