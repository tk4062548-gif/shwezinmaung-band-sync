import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BellRing, Settings2, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  useDeleteNotification,
  useMarkRead,
  useNotifications,
  useNotificationsRealtime,
} from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "အသိပေးချက်များ · ရွှေဇင်မောင် တီးဝိုင်း" },
      { name: "description", content: "Band event reminders delivered to you, newest first." },
      { property: "og:title", content: "Notifications · Shwe Zin Maung Band" },
      { property: "og:description", content: "Every band event reminder you received." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { t, lang } = useI18n();
  useNotificationsRealtime();
  const list = useNotifications();
  const markRead = useMarkRead();
  const remove = useDeleteNotification();
  const locale = lang === "mm" ? "my-MM" : "en-GB";
  const items = list.data ?? [];
  const unreadIds = items.filter((n) => !n.read_at).map((n) => n.id);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        <div className="flex items-center justify-between gap-2">
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="size-4" /> {t("backToList")}
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/notification-settings">
              <Settings2 className="size-4" /> {t("notificationSettings")}
            </Link>
          </Button>
        </div>

        {unreadIds.length > 0 ? (
          <Button variant="secondary" size="sm" onClick={() => markRead.mutate(unreadIds)}>
            {t("markAllRead")}
          </Button>
        ) : null}

        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t("noNotifications")}
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((n) => (
              <li
                key={n.id}
                className={`rounded-2xl border p-4 ${
                  n.read_at ? "border-border bg-card" : "border-primary/50 bg-primary/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <BellRing className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold leading-snug">{n.title}</h2>
                    <p className="mt-1 whitespace-pre-line text-sm text-foreground/80">{n.body}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {new Date(n.created_at).toLocaleString(locale, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {n.read_at ? "" : ` · ${t("unread")}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("delete")}
                    onClick={() => remove.mutate(n.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
