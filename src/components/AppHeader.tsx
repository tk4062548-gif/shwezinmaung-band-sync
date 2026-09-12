import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Music4, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader() {
  const { t } = useI18n();
  const { session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
        <Link to="/dashboard" className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Music4 className="size-5" />
          </span>
          <span className="truncate text-sm font-semibold leading-tight">{t("appName")}</span>
        </Link>
        {session ? <NotificationBell /> : null}
        <Button variant="ghost" size="icon" asChild aria-label={t("settings")}>
          <Link to="/settings">
            <Settings className="size-5" />
          </Link>
        </Button>
        {session ? (
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            {t("signOut")}
          </Button>
        ) : null}
      </div>
    </header>
  );
}
