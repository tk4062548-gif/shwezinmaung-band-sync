import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { REMINDER_PRESETS, formatOffset } from "@/lib/reminder-options";

export function ReminderPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (next: number[]) => void;
}) {
  const { t, lang } = useI18n();
  const [days, setDays] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");

  const toggle = (m: number) =>
    onChange(value.includes(m) ? value.filter((v) => v !== m) : [...value, m].sort((a, b) => b - a));

  const custom = value.filter((v) => !REMINDER_PRESETS.some((p) => p.minutes === v));

  function addCustom() {
    const total =
      (Number(days) || 0) * 1440 + (Number(hours) || 0) * 60 + (Number(minutes) || 0);
    if (total <= 0 || value.includes(total)) return;
    onChange([...value, total].sort((a, b) => b - a));
    setDays("");
    setHours("");
    setMinutes("");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {REMINDER_PRESETS.map((preset) => {
          const active = value.includes(preset.minutes);
          return (
            <button
              key={preset.minutes}
              type="button"
              onClick={() => toggle(preset.minutes)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {preset[lang]}
            </button>
          );
        })}
      </div>

      {custom.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {custom.map((m) => (
            <Badge key={m} className="gap-1 pr-1">
              {formatOffset(m, lang)}
              <button type="button" onClick={() => toggle(m)} aria-label="remove">
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card/60 p-3">
        <Label className="text-xs text-muted-foreground">{t("customReminder")}</Label>
        <div className="mt-2 flex items-end gap-2">
          <div className="flex-1">
            <Label className="text-[11px]">{t("days")}</Label>
            <Input
              inputMode="numeric"
              value={days}
              onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
            />
          </div>
          <div className="flex-1">
            <Label className="text-[11px]">{t("hours")}</Label>
            <Input
              inputMode="numeric"
              value={hours}
              onChange={(e) => setHours(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
            />
          </div>
          <div className="flex-1">
            <Label className="text-[11px]">{t("minutes")}</Label>
            <Input
              inputMode="numeric"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
            />
          </div>
          <Button type="button" variant="secondary" size="icon" onClick={addCustom}>
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
