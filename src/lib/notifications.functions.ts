import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** The public VAPID key the browser needs to create a push subscription. */
export const getPushPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  return { publicKey: process.env["VAPID_PUBLIC_KEY"] ?? null };
});

/** Sends a test push to every device the signed-in user has registered. */
export const sendTestPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("user_id", context.userId);
    if (error) throw error;
    if (!data || data.length === 0) return { sent: 0 };

    const { sendPush } = await import("@/lib/push.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let sent = 0;
    for (const row of data) {
      const result = await sendPush(row, {
        title: "ရွှေဇင်မောင် တီးဝိုင်း",
        body: "သတိပေးချက် စမ်းသပ်မှု — အသိပေးချက်များ အလုပ်လုပ်နေပါသည်။",
        url: "/notifications",
      });
      if (result === "sent") sent += 1;
      if (result === "gone") {
        await supabaseAdmin.from("push_subscriptions").delete().eq("id", row.id);
      }
    }
    return { sent };
  });
