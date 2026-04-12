import webpush from "web-push";
import { db } from "./db";
import { pushSubscriptions, students } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_EMAIL = process.env.VAPID_EMAIL || "admin@dynamiccoachingcenter.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log("[Push] VAPID configured ✓ publicKey:", VAPID_PUBLIC_KEY.slice(0, 20) + "…");
} else {
  console.warn("[Push] WARNING: VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY is missing. Push notifications will NOT work.");
  console.warn("[Push] Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL in your environment variables.");
}

export { VAPID_PUBLIC_KEY };

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

export async function sendPushToUser(userId: number, payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[Push] Skipping push — VAPID keys not configured.");
    return;
  }

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  console.log(`[Push] sendPushToUser → userId=${userId}, subscriptions found=${subs.length}, title="${payload.title}"`);

  if (subs.length === 0) {
    console.log(`[Push] No subscriptions for userId=${userId}. User may not have granted permission yet.`);
    return;
  }

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        console.log(`[Push] Sending to endpoint: ${sub.endpoint.slice(0, 60)}…`);
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
        console.log(`[Push] ✓ Delivered to userId=${userId}`);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[Push] Subscription expired (${err.statusCode}), removing from DB.`);
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        } else {
          console.error(`[Push] ✗ Failed for userId=${userId}: ${err.statusCode} ${err.message}`);
        }
      }
    })
  );
}

export async function sendPushToBatch(batchId: number, payload: PushPayload): Promise<void> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("[Push] Skipping batch push — VAPID keys not configured.");
    return;
  }

  const batchStudents = await db
    .select()
    .from(students)
    .where(eq(students.batchId, batchId));

  const userIds = batchStudents.map((s) => s.userId).filter(Boolean) as number[];
  console.log(`[Push] sendPushToBatch → batchId=${batchId}, students=${batchStudents.length}, with accounts=${userIds.length}, title="${payload.title}"`);

  if (userIds.length === 0) {
    console.log(`[Push] No student accounts in batchId=${batchId}.`);
    return;
  }

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, userIds));

  console.log(`[Push] Found ${subs.length} push subscription(s) across ${userIds.length} student(s).`);

  if (subs.length === 0) {
    console.log(`[Push] No subscriptions found for batchId=${batchId}. Students may not have enabled notifications.`);
    return;
  }

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        console.log(`[Push] Sending to endpoint: ${sub.endpoint.slice(0, 60)}…`);
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
        console.log(`[Push] ✓ Delivered to subscription userId=${sub.userId}`);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[Push] Subscription expired (${err.statusCode}), removing.`);
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        } else {
          console.error(`[Push] ✗ Failed: ${err.statusCode} ${err.message}`);
        }
      }
    })
  );
}
