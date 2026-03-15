// src/hooks/useSubscriptionGuard.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { auth } from "@/lib/firebase/config";
import { deleteUser } from "firebase/auth";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export function useSubscriptionGuard() {
  const router  = useRouter();
  const user    = useAuthStore((s) => s.user);
  const logout  = useAuthStore((s) => s.logout);
  const [checking, setChecking] = useState(true);
  const [expired,  setExpired]  = useState(false);

  useEffect(() => {
    if (!user?.id) { setChecking(false); return; }

    const checkSubscription = async () => {
      try {
        // ─── تحقق من subscriptionEnd ─────────────────────────────────────
        if (!user.subscriptionEnd) { setChecking(false); return; }

        const endDate = new Date(user.subscriptionEnd);
        const now     = new Date();

        if (now <= endDate) {
          // الاشتراك لا يزال ساري
          setChecking(false);
          return;
        }

        // ─── الاشتراك انتهى — احذف الحساب ────────────────────────────────
        setExpired(true);

        try {
          // 1. حاول حذف Firebase Auth مباشرة
          const currentUser = auth.currentUser;
          if (currentUser) {
            try {
              await deleteUser(currentUser);
              // نجح الحذف — احذف من Firestore أيضاً
              await deleteDoc(doc(db, "users", user.id));
            } catch (authErr) {
              if (authErr.code === "auth/requires-recent-login") {
                // ─── جلسة قديمة — ضع علامة للحذف عند تسجيل الدخول القادم
                await updateDoc(doc(db, "users", user.id), {
                  status:           "subscription_expired",
                  pendingDelete:    true,
                  subscriptionNote: "انتهى الموسم الدراسي — سيُحذف عند تسجيل الدخول التالي",
                });
              } else {
                // خطأ آخر — ضع علامة فقط
                await updateDoc(doc(db, "users", user.id), {
                  status:        "subscription_expired",
                  pendingDelete: true,
                }).catch(() => {});
              }
            }
          }
        } catch { /* تجاهل الأخطاء الكاملة */ }

        // 2. امسح الـ store وجّهه لصفحة انتهاء الاشتراك
        await logout();
        router.replace("/subscription-expired");

      } catch {
        setChecking(false);
      } finally {
        setChecking(false);
      }
    };

    checkSubscription();
  }, [user?.id, user?.subscriptionEnd]);

  return { checking, expired };
}