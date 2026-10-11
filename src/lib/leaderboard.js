// src/lib/leaderboard.js
// لوحة المتصدرين تقرأ من مجموعة leaderboard (الاسم + النقاط فقط)
// بدل قراءة مستندات users التي فيها البريد والهاتف.
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// ينسخ من مستند المستخدم الحقيقي بدقة — القواعد ترفض أي قيمة لا تطابقه
export async function syncLeaderboardNow(userId) {
  if (!userId) return;
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (!snap.exists()) return;
    const u = snap.data();
    if (u.role !== "student" || u.status !== "active") return;
    await setDoc(doc(db, "leaderboard", userId), {
      name:      u.name     ?? "",
      surname:   u.surname  ?? "",
      photoURL:  u.photoURL ?? null,
      level:     u.level    ?? null,
      points:    u.points   ?? 0,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("leaderboard sync:", err?.code || err?.message);
  }
}

// تأجيل 30 ثانية: النقاط تتغير مع كل بطاقة، فنجمع التحديثات في كتابة واحدة
let timer = null;
let pendingId = null;
export function scheduleLeaderboardSync(userId) {
  if (typeof window === "undefined" || !userId) return;
  pendingId = userId;
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    const id = pendingId;
    pendingId = null;
    syncLeaderboardNow(id);
  }, 30000);
}