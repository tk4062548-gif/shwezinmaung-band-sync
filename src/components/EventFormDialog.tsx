import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
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
import { useI18n } from "@/lib/i18n";
import { useReminders, useSaveEvent, type BandEvent } from "@/lib/events";

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [reminders, setReminders] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setTitle(event?.title ?? "");
    setStartsAt(
      event ? toLocalInput(event.starts_at) : toLocalInput((defaultDate ?? new Date()).toISOString()),
    );
    setLocation(event?.location ?? "");
    setNotes(event?.notes ?? "");
    setReminders([]);
  }, [open, event, defaultDate]);

  useEffect(() => {
    if (open && event && existingReminders.data) {
      setReminders(existingReminders.data.map((r) => toLocalInput(r.remind_at)));
    }
  }, [open, event, existingReminders.data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startsAt) return;
    try {
      await save.mutateAsync({
        ...(event ? { id: event.id } : {}),
        values: {
          title: title.trim(),
          starts_at: new Date(startsAt).toISOString(),
          location: location.trim() || null,
          notes: notes.trim() || null,
        },
        reminders: reminders.filter(Boolean).map((r) => new Date(r).toISOString()),
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
          <div className="space-y-1.5">
            <Label htmlFor="startsAt">{t("dateTime")}</Label>
            <Input
              id="startsAt"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
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
            <Label>{t("extraReminders")}</Label>
            {reminders.map((value, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="datetime-local"
                  value={value}
                  onChange={(e) =>
                    setReminders((prev) => prev.map((r, i) => (i === index ? e.target.value : r)))
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setReminders((prev) => prev.filter((_, i) => i !== index))}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setReminders((prev) => [...prev, startsAt])}
            >
              <Plus className="size-4" /> {t("addReminder")}
            </Button>
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
