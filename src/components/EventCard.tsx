import { BellRing, Check, MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { isTomorrow, type BandEvent } from "@/lib/events";

export function EventCard({
  event,
  reminderCount,
  isAdmin,
  onEdit,
  onToggle,
  onDelete,
}: {
  event: BandEvent;
  reminderCount: number;
  isAdmin: boolean;
  onEdit: (e: BandEvent) => void;
  onToggle: (e: BandEvent) => void;
  onDelete: (e: BandEvent) => void;
}) {
  const { t, lang } = useI18n();
  const date = new Date(event.starts_at);
  const locale = lang === "mm" ? "my-MM" : "en-GB";
  const dateLabel = date.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeLabel = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-primary/12 px-2 py-2 text-primary">
          <span className="text-xl font-bold leading-none">{date.getDate()}</span>
          <span className="mt-1 text-[11px] uppercase">
            {date.toLocaleDateString(locale, { month: "short" })}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={`text-base font-semibold leading-snug ${event.completed ? "line-through opacity-60" : ""}`}
          >
            {event.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {dateLabel} · {timeLabel}
          </p>
          {event.location ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5" /> {event.location}
            </p>
          ) : null}
          {event.notes ? (
            <p className="mt-2 whitespace-pre-line text-sm text-foreground/80">{event.notes}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-2">
            {isTomorrow(date) && !event.completed ? (
              <Badge className="gap-1 bg-primary text-primary-foreground">
                <BellRing className="size-3" /> {t("reminderTomorrow")}
              </Badge>
            ) : null}
            {reminderCount > 0 ? (
              <Badge variant="outline" className="gap-1">
                <BellRing className="size-3" /> {reminderCount}
              </Badge>
            ) : null}
            {event.completed ? <Badge variant="secondary">{t("completed")}</Badge> : null}
          </div>
        </div>
      </div>

      {isAdmin ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          <Button size="sm" variant="secondary" onClick={() => onToggle(event)}>
            <Check className="size-4" /> {event.completed ? t("markPending") : t("markCompleted")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onEdit(event)}>
            <Pencil className="size-4" /> {t("editEvent")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => onDelete(event)}
          >
            <Trash2 className="size-4" /> {t("delete")}
          </Button>
        </div>
      ) : null}
    </article>
  );
}
