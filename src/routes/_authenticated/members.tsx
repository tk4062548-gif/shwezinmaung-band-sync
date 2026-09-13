import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({
    meta: [
      { title: "အဖွဲ့ဝင် စံခြင်း · ရွှေဇင်မောင်" },
      { name: "description", content: "Admin tools for managing band member roles." },
      { property: "og:title", content: "Manage members · Shwe Zin Maung Band" },
      { property: "og:description", content: "Promote members to admin or set them back to viewer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MembersPage,
});

type MemberRow = { id: string; display_name: string | null; role: "admin" | "viewer" | null };

function useMemberRoles() {
  return useQuery({
    queryKey: ["member-roles"],
    queryFn: async (): Promise<MemberRow[]> => {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("id,display_name"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      const roleByUser = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
      return (profiles ?? [])
        .map((p) => ({ id: p.id, display_name: p.display_name, role: roleByUser.get(p.id) ?? null }))
        .sort((a, b) => (a.display_name ?? "").localeCompare(b.display_name ?? ""));
    },
  });
}

function MembersPage() {
  const { t } = useI18n();
  const { isAdmin, session } = useAuth();
  const queryClient = useQueryClient();
  const members = useMemberRoles();

  const setRole = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      if (makeAdmin) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-roles"] });
      toast.success(t("saved"));
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-4 py-5">
          <p className="text-sm text-muted-foreground">{t("viewerNotice")}</p>
        </main>
      </div>
    );
  }

  const rows = members.data ?? [];
  const adminCount = rows.filter((r) => r.role === "admin").length;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        <Link to="/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> {t("settings")}
        </Link>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">{t("manageMembers")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("manageMembersHint")}</p>

          <ul className="mt-4 space-y-2">
            {rows.map((m) => {
              const isSelf = m.id === session?.user.id;
              const isLastAdmin = m.role === "admin" && adminCount <= 1;
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 p-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {m.role === "admin" ? (
                      <ShieldCheck className="size-4 shrink-0 text-primary" />
                    ) : (
                      <User className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate text-sm">
                      {m.display_name || t("unnamedMember")}
                      {isSelf ? ` (${t("you")})` : ""}
                    </span>
                    <Badge variant={m.role === "admin" ? "default" : "secondary"}>
                      {m.role === "admin" ? t("adminShort") : t("viewerShort")}
                    </Badge>
                  </div>
                  {m.role === "admin" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={setRole.isPending || isLastAdmin}
                      title={isLastAdmin ? t("lastAdminHint") : undefined}
                      onClick={() => setRole.mutate({ userId: m.id, makeAdmin: false })}
                    >
                      {t("makeViewer")}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={setRole.isPending}
                      onClick={() => setRole.mutate({ userId: m.id, makeAdmin: true })}
                    >
                      {t("makeAdmin")}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
          {members.isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("loading")}</p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
