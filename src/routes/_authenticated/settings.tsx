import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { session, role, isAdmin } = useAuth();

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> {t("backToList")}
        </Link>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">{t("language")}</h2>
          <div className="mt-3 flex gap-2">
            <Button
              variant={lang === "mm" ? "default" : "secondary"}
              size="sm"
              onClick={() => setLang("mm")}
            >
              {t("myanmar")}
            </Button>
            <Button
              variant={lang === "en" ? "default" : "secondary"}
              size="sm"
              onClick={() => setLang("en")}
            >
              {t("english")}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">{t("role")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{session?.user.email}</p>
          <Badge className="mt-2" variant={isAdmin ? "default" : "secondary"}>
            {isAdmin ? t("admin") : t("viewer")}
          </Badge>
          {role === "viewer" ? (
            <p className="mt-3 text-xs text-muted-foreground">{t("viewerNotice")}</p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
