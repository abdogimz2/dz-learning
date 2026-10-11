// src/lib/maintenance.js — أداة لمرة واحدة (للأدمن الرئيسي فقط)
import { db } from "@/lib/firebase/config";
import {
  collection, getDocs, query, where, writeBatch, doc, serverTimestamp,
} from "firebase/firestore";

export async function backfillLeaderboardAndSubscriptions() {
  const snap = await getDocs(query(collection(db, "users"), where("status", "==", "active")));
  const ops = [];
  let lb = 0, sub = 0;

  snap.docs.forEach((d) => {
    const u = d.data();
    if (u.role === "student") {
      ops.push((b) => b.set(doc(db, "leaderboard", d.id), {
        name:      u.name     ?? "",
        surname:   u.surname  ?? "",
        photoURL:  u.photoURL ?? null,
        level:     u.level    ?? null,
        points:    u.points   ?? 0,
        updatedAt: serverTimestamp(),
      }));
      lb++;
    }
    if (u.subscriptionEnd && u.subscriptionEndMs == null) {
      const ms = new Date(u.subscriptionEnd).getTime();
      if (!Number.isNaN(ms)) {
        ops.push((b) => b.update(doc(db, "users", d.id), { subscriptionEndMs: ms }));
        sub++;
      }
    }
  });

  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    ops.slice(i, i + 400).forEach((fn) => fn(batch));
    await batch.commit();
  }
  return { leaderboard: lb, subscriptions: sub, scanned: snap.size };
}