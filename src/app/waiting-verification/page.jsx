// src/app/waiting-verification/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, Mail, Home, Shield, RefreshCw, AlertTriangle, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function WaitingVerificationPage() {
  const [countdown, setCountdown] = useState(24 * 60 * 60);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);

  // انتظر hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    // ✅ مش مسجل → login مباشرة
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    // ✅ أدمين → لوحة الأدمين
    if (user.role === "admin") {
      router.replace("/admin");
      return;
    }

    // ✅ حساب مفعل → داشبورد
    if (user.status === "active") {
      router.replace("/dashboard");
      return;
    }

    // العد التنازلي
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [hydrated, isAuthenticated, user, router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // ✅ لما يسجل خروج → user يصير null → نوجهه فوراً
  if (hydrated && !isAuthenticated) {
    return null; // الـ useEffect سيوجهه لـ /login
  }

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const levelLabel = user.level === "middle" ? "التعليم المتوسط" : "التعليم الثانوي";

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
      >
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-secondary" />
          <div className="relative p-8 md:p-10 text-white text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 rounded-full backdrop-blur-sm mb-6">
              <Shield size={48} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">طلبك قيد المراجعة</h1>
            <p className="text-white/90 text-lg">نحن نعمل على تفعيل حسابك بأسرع وقت ممكن</p>
          </div>
        </div>

        <div className="p-6 md:p-8 lg:p-10">
          <div className="text-center space-y-8">

            {/* Timer */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 border border-primary/20 rounded-2xl p-6 md:p-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Clock className="text-primary" size={28} />
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">تتبع حالة الطلب</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">الوقت المتبقي للتفعيل</p>
              <div className="text-5xl md:text-6xl font-mono font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {formatTime(countdown)}
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-3">
                سيتم تفعيل حسابك خلال 24 ساعة كحد أقصى
              </p>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                معلومات حسابك
              </h3>
              <div className="space-y-3 text-right">
                {[
                  { label: "الاسم الكامل", value: `${user.name} ${user.surname}` },
                  { label: "البريد الإلكتروني", value: user.email },
                  { label: "المستوى الدراسي", value: levelLabel },
                  user.specialty ? { label: "التخصص", value: user.specialty } : null,
                  { label: "حالة الطلب", value: "قيد المراجعة", isStatus: true },
                ]
                  .filter(Boolean)
                  .map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className="text-gray-500 dark:text-gray-400">{item.label}:</span>
                      <span className={`font-bold ${item.isStatus ? "text-secondary flex items-center gap-2" : "text-gray-800 dark:text-gray-200"}`}>
                        {item.isStatus && <Clock size={16} />}
                        {item.value}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Note */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={22} />
                <p className="text-gray-600 dark:text-gray-400 text-sm text-right">
                  ستصلك رسالة تأكيد على{" "}
                  <span className="font-bold text-secondary">{user.email}</span>{" "}
                  عند اكتمال التفعيل. تحقق من مجلد البريد العشوائي إذا لم تصلك.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 border-t border-gray-200 dark:border-gray-800">
              <Link href="/">
                <button className="w-full sm:w-auto px-7 py-3 bg-gray-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition-all">
                  <Home size={18} /> الرئيسية
                </button>
              </Link>

              <button
                onClick={() => window.location.reload()}
                className="px-7 py-3 border-2 border-secondary text-secondary hover:bg-secondary/5 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw size={18} /> تحديث
              </button>

              {/* ✅ زر تسجيل الخروج للدخول بحساب آخر */}
              <button
                onClick={handleLogout}
                className="px-7 py-3 border-2 border-red-400 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <LogOut size={18} /> تسجيل الخروج
              </button>
            </div>

            <p className="text-gray-400 text-sm">
              للاستفسار:{" "}
              <a href="mailto:support@dz-learning.dz" className="text-secondary hover:underline">
                support@dz-learning.dz
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}