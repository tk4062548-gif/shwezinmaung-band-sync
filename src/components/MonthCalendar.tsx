import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { isSameDay, type BandEvent } from "@/lib/events";

export function MonthCalendar({
  events,
  selected,
  onSelect,
}: {
  events: BandEvent[];
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const { lang } = useI18n();
  const locale = lang === "mm" ? "my-MM" : "en-GB";
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const lead = first.getDay();
    const list: (Date | null)[] = Array.from({ length: lead }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      list.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    }
    return list;
  }, [cursor]);

  const shift = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => shift(-1)} aria-label="previous month">
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-semibold">
          {cursor.toLocaleDateString(locale, { month: "long", year: "numeric" })}
        </span>
        <Button variant="ghost" size="icon" onClick={() => shift(1)} aria-label="next month">
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />;
          const dayEvents = events.filter((e) => isSameDay(new Date(e.starts_at), day));
          const isSelected = selected ? isSameDay(day, selected) : false;
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : isToday
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-secondary/60"
              }`}
            >
              <span>{day.getDate()}</span>
              <span className="mt-0.5 flex h-1.5 gap-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    className={`size-1.5 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
