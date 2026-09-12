import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReminderPicker } from "@/components/ReminderPicker";
import { useI18n } from "@/lib/i18n";
import { useReminders, useSaveEvent, type BandEvent } from "@/lib/events";
import { useNotificationSettings } from "@/lib/notifications";
import { remindAtFor } from "@/lib/reminder-options";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInput(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: BandEvent | null;
  defaultDate?: Date;
}) {
  const { t } = useI18n();
  const save = useSaveEvent();
  const existingReminders = useReminders(event?.id);
  const settings = useNotificationSettings();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [arriveTime, setArriveTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [offsets, setOffsets] = useState<number[]>([]);

  useEffect(() => {
    if (!open) return;
    const base = event ? new Date(event.starts_at) : (defaultDate ?? new Date());
    setTitle(event?.title ?? "");
    setDate(toDateInput(base));
    setTime(event ? toTimeInput(new Date(event.starts_at)) : "19:00");
    setArriveTime(event?.arrive_at ? toTimeInput(new Date(event.arrive_at)) : "");
    setLocation(event?.location ?? "");
    setNotes(event?.notes ?? "");
    setOffsets(event ? [] : (settings.data?.default_offsets ?? [1440, 60]));
  }, [open, event, defaultDate, settings.data]);

  useEffect(() => {
    if (open && event && existingReminders.data) {
      setOffsets(
        existingReminders.data
          .map((r) => r.offset_minutes)
          .filter((m): m is number => typeof m === "number")
          .sort((a, b) => b - a),
      );
    }
  }, [open, event, existingReminders.data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;
    const startsAt = new Date(`${date}T${time}`).toISOString();
    const arriveAt = arriveTime ? new Date(`${date}T${arriveTime}`).toISOString() : null;
    try {
      await save.mutateAsync({
        ...(event ? { id: event.id } : {}),
        values: {
          title: title.trim(),
          starts_at: startsAt,
          arrive_at: arriveAt,
          location: location.trim() || null,
          notes: notes.trim() || null,
        },
        reminders: offsets.map((offset_minutes) => ({
          offset_minutes,
          remind_at: remindAtFor(startsAt, offset_minutes),
        })),
      });
      toast.success(t("saved"));
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event ? t("editEvent") : t("addEvent")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">{t("title")}</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="date">{t("eventDate")}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="w-28 space-y-1.5">
              <Label htmlFor="time">{t("eventTime")}</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="arrive">{t("arriveAt")}</Label>
            <Input
              id="arrive"
              type="time"
              value={arriveTime}
              onChange={(e) => setArriveTime(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">{t("location")}</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{t("reminderTimes")}</Label>
            <ReminderPicker value={offsets} onChange={setOffsets} />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
