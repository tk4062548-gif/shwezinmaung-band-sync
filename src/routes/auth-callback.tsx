import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth-callback")({
  head: () => ({
    meta: [
      { title: "Email verified · Shwe Zin Maung Band Schedule" },
      { name: "description", content: "Your email is verified. Sign in to the band schedule." },
      { property: "og:title", content: "Email verified · Shwe Zin Maung Band Schedule" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthCallback,
});

type Status = "working" | "verified" | "failed";

function AuthCallback() {
  const [status, setStatus] = useState<Status>("working");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      // PKCE / token_hash style link: ?token_hash=...&type=signup
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      try {
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as never,
          });
          if (error) throw error;
        } else {
          // Older email-style links carry tokens in the URL hash; the client
          // picks them up automatically. Wait briefly for a session.
          const { data } = await supabase.auth.getSession();
          if (!data.session) throw new Error("missing-token");
        }
        // Verification creates a session automatically; end it so the member
        // reaches the sign-in screen as expected.
        await supabase.auth.signOut();
        if (!cancelled) setStatus("verified");
      } catch {
        if (!cancelled) setStatus("failed");
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        {status === "working" ? (
          <Loader2 className="mx-auto size-10 animate-spin text-primary" />
        ) : null}
        {status === "verified" ? (
          <>
            <CheckCircle2 className="mx-auto size-10 text-primary" />
            <h1 className="mt-4 text-lg font-semibold">
              Email verified successfully. Please sign in.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              အီးမေးလ် အတည်ပြုပြီး — အကောင့်ဝင်နိုင်ပါပြီ
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/auth">Sign in / အကောင့်ဝင်ရန်</Link>
            </Button>
          </>
        ) : null}
        {status === "failed" ? (
          <>
            <XCircle className="mx-auto size-10 text-destructive" />
            <h1 className="mt-4 text-lg font-semibold">This link has expired</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The verification link is no longer valid. Please sign up again.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/auth">Back to sign in</Link>
            </Button>
          </>
        ) : null}
      </div>
    </main>
  );
}
