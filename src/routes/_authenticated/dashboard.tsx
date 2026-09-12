import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, List, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { EventCard } from "@/components/EventCard";
import { EventFormDialog } from "@/components/EventFormDialog";
import { MonthCalendar } from "@/components/MonthCalendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import {
  isSameDay,
  startOfDay,
  useDeleteEvent,
  useEvents,
  useEventsRealtime,
  useReminders,
  useToggleCompleted,
  type BandEvent,
} from "@/lib/events";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Band schedule · Shwe Zin Maung" },
      {
        name: "description",
        content: "Today's, upcoming and past shows for the Shwe Zin Maung band, with reminders.",
      },
      { property: "og:title", content: "Band schedule · Shwe Zin Maung" },
      {
        property: "og:description",
        content: "Every Shwe Zin Maung show with date, time, place and reminders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t, lang } = useI18n();
  const { isAdmin } = useAuth();
  useEventsRealtime();
  const events = useEvents();
  const reminders = useReminders();
  const toggle = useToggleCompleted();
  const remove = useDeleteEvent();

  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BandEvent | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BandEvent | null>(null);

  const locale = lang === "mm" ? "my-MM" : "en-GB";
  const all = events.data ?? [];

  const reminderCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reminders.data ?? []) {
      map.set(r.event_id, (map.get(r.event_id) ?? 0) + 1);
    }
    return map;
  }, [reminders.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((e) => {
      const date = new Date(e.starts_at);
      const haystack = [
        e.title,
        e.location ?? "",
        e.notes ?? "",
        date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }),
        date.toISOString().slice(0, 10),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [all, query, locale]);

  const today = startOfDay(new Date());
  const todays = filtered.filter((e) => isSameDay(new Date(e.starts_at), today));
  const upcoming = filtered.filter((e) => startOfDay(new Date(e.starts_at)) > today);
  const past = filtered
    .filter((e) => startOfDay(new Date(e.starts_at)) < today)
    .slice()
    .reverse();

  const daySelected = selectedDay
    ? filtered.filter((e) => isSameDay(new Date(e.starts_at), selectedDay))
    : [];

  function renderCard(event: BandEvent) {
    return (
      <EventCard
        key={event.id}
        event={event}
        reminderCount={reminderCounts.get(event.id) ?? 0}
        isAdmin={isAdmin}
        onEdit={(e) => {
          setEditing(e);
          setFormOpen(true);
        }}
        onToggle={(e) => toggle.mutate({ id: e.id, completed: !e.completed })}
        onDelete={(e) => setPendingDelete(e)}
      />
    );
  }

  function section(label: string, list: BandEvent[]) {
    if (list.length === 0) return null;
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">{label}</h2>
        {list.map(renderCard)}
      </section>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <AppHeader />
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            className="pl-9"
            aria-label={t("search")}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "secondary"}
            size="sm"
            className="flex-1"
            onClick={() => setView("list")}
          >
            <List className="size-4" /> {t("listView")}
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "secondary"}
            size="sm"
            className="flex-1"
            onClick={() => setView("calendar")}
          >
            <CalendarDays className="size-4" /> {t("calendarView")}
          </Button>
        </div>

        {!isAdmin ? (
          <p className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
            {t("viewerNotice")}
          </p>
        ) : null}

        {events.isLoading ? <p className="text-sm text-muted-foreground">{t("loading")}</p> : null}

        {view === "calendar" ? (
          <div className="space-y-4">
            <MonthCalendar events={filtered} selected={selectedDay} onSelect={setSelectedDay} />
            {selectedDay ? (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
                  {selectedDay.toLocaleDateString(locale, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                {daySelected.length > 0 ? (
                  daySelected.map(renderCard)
                ) : (
                  <p className="text-sm text-muted-foreground">{t("noEvents")}</p>
                )}
              </section>
            ) : null}
          </div>
        ) : (
          <div className="space-y-6">
            {section(t("today"), todays)}
            {section(t("upcoming"), upcoming)}
            {section(t("past"), past)}
            {!events.isLoading && filtered.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {query ? t("noResults") : t("noEvents")}
              </p>
            ) : null}
          </div>
        )}
      </main>

      {isAdmin ? (
        <Button
          size="lg"
          className="fixed bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full shadow-lg"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-5" /> {t("addEvent")}
        </Button>
      ) : null}

      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editing}
        {...(selectedDay ? { defaultDate: selectedDay } : {})}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!pendingDelete) return;
                await remove.mutateAsync(pendingDelete.id);
                setPendingDelete(null);
                toast.success(t("deleted"));
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
