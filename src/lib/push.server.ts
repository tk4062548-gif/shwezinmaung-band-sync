import { buildPushPayload, type PushSubscription } from "@block65/webcrypto-web-push";

export type PushRow = { id: string; endpoint: string; p256dh: string; auth: string };

export type PushContent = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  silent?: boolean;
};

/** Sends one web-push message. Returns "gone" when the subscription is dead. */
export async function sendPush(
  row: PushRow,
  content: PushContent,
): Promise<"sent" | "gone" | "failed"> {
  const vapid = {
    subject: process.env["VAPID_SUBJECT"] ?? "mailto:noreply@example.com",
    publicKey: process.env["VAPID_PUBLIC_KEY"],
    privateKey: process.env["VAPID_PRIVATE_KEY"],
  };
  if (!vapid.publicKey || !vapid.privateKey) return "failed";

  const subscription: PushSubscription = {
    endpoint: row.endpoint,
    expirationTime: null,
    keys: { p256dh: row.p256dh, auth: row.auth },
  };

  try {
    const payload = await buildPushPayload(
      { data: content, options: { ttl: 60 * 60 * 12, urgency: "high" } },
      subscription,
      vapid,
    );
    const res = await fetch(row.endpoint, {
      method: payload.method,
      headers: payload.headers,
      body: payload.body as unknown as BodyInit,
    });
    if (res.status === 404 || res.status === 410) return "gone";
    if (!res.ok) {
      console.error(`Push failed [${res.status}]: ${await res.text()}`);
      return "failed";
    }
    return "sent";
  } catch (error) {
    console.error("Push error", error);
    return "failed";
  }
}
