// src/app/subscription-expired/page.jsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GraduationCap, RefreshCw, Calendar, ArrowLeft } from "lucide-react";

export default function SubscriptionExpiredPage() {
  // حساب بداية الموسم القادم (1 سبتمبر)
  const now          = new Date();
  const nextSeason   = now.getMonth() >= 8
    ? now.getFullYear() + 1
    : now.getFullYear();
  const nextSeasonStart = `1 سبتمبر ${nextSeason}`;
  const nextSeasonEnd   = `30 جوان ${nextSeason + (now.getMonth() >= 8 ? 1 : 0) }`;

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-l from-red-500 to-orange-500 p-8 text-white text-center">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-24 h-24 rounded-full bg-white" />
            <div className="absolute bottom-0 right-6 w-36 h-36 rounded-full bg-white" />
          </div>
          <div className="relative">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full backdrop-blur-sm mb-4">
              <GraduationCap size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-black mb-1">انتهى الموسم الدراسي</h1>
            <p className="text-white/80 text-sm">تم إلغاء اشتراكك تلقائياً</p>
          </div>
        </div>

        <div className="p-8 space-y-6">

          {/* رسالة */}
          <div className="text-center space-y-2">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              لقد انتهى الموسم الدراسي وتم حذف حسابك تلقائياً.
              للاستمرار في الاستفادة من منصة <span className="font-black text-primary">Mindly</span>،
              يرجى إنشاء حساب جديد للموسم القادم.
            </p>
          </div>

          {/* معلومات الموسم القادم */}
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-primary font-black">
              <Calendar size={18} />
              الموسم الدراسي القادم
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700">
                <p className="text-gray-400 text-xs mb-1">يبدأ في</p>
                <p className="font-black text-gray-800 dark:text-white">{nextSeasonStart}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700">
                <p className="text-gray-400 text-xs mb-1">ينتهي في</p>
                <p className="font-black text-gray-800 dark:text-white">{nextSeasonEnd}</p>
              </div>
            </div>
          </div>

          {/* أزرار */}
          <div className="space-y-3">
            <Link href="/register">
              <button className="w-full py-4 bg-gradient-to-l from-primary to-blue-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                <RefreshCw size={20} />
                إنشاء حساب جديد للموسم القادم
              </button>
            </Link>
            <Link href="/">
              <button className="w-full py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm">
                <ArrowLeft size={16} />
                العودة للصفحة الرئيسية
              </button>
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400">
            للاستفسار: <a href="mailto:contact@mindly.dz" className="text-primary hover:underline">contact@mindly.dz</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}