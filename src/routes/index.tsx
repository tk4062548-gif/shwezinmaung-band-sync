import { createFileRoute, Link } from "@tanstack/react-router";
import { BellRing, CalendarDays, Music4 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import bandHero from "@/assets/band-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ရွှေဇင်မောင် တီးဝိုင်းပွဲချီစာရင်း | Band Schedule" },
      {
        name: "description",
        content:
          "Shwe Zin Maung band show schedule: upcoming shows, today's events and past gigs with places, times and reminders.",
      },
      { property: "og:title", content: "ရွှေဇင်မောင် တီးဝိုင်းပွဲချီစာရင်း | Band Schedule" },
      {
        property: "og:description",
        content: "The band's shows in one place, in Myanmar or English, synced for every member.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useI18n();
  const { session } = useAuth();

  return (
    <main className="min-h-screen">
      <div className="relative">
        <img
          src={bandHero}
          alt="Shwe Zin Maung band performing under golden stage lights"
          width={1280}
          height={800}
          className="h-72 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl px-5 pb-6">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <Music4 className="size-6" />
          </span>
          <h1 className="mt-3 text-2xl font-bold leading-snug">{t("appName")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("tagline")}</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-5 py-6">
        <Button asChild size="lg" className="w-full">
          <Link to={session ? "/dashboard" : "/auth"}>
            {session ? t("dashboard") : t("signIn")}
          </Link>
        </Button>

        <ul className="space-y-3">
          <li className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <CalendarDays className="mt-0.5 size-5 text-primary" />
            <span className="text-sm">
              {t("today")} · {t("upcoming")} · {t("past")}
            </span>
          </li>
          <li className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <BellRing className="mt-0.5 size-5 text-primary" />
            <span className="text-sm">{t("reminderTomorrow")}</span>
          </li>
        </ul>
      </div>
    </main>
  );
}
