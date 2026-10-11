// src/app/admin/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, BookOpen, CreditCard, CheckCircle,
  Clock, XCircle, TrendingUp, Loader2,
  GraduationCap, FileText,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { useAuthStore } from "@/store/authStore";
import { backfillLeaderboardAndSubscriptions } from "@/lib/maintenance";
import { collection, getDocs, getCountFromServer, query, orderBy, limit, where } from "firebase/firestore";

export default function AdminDashboardPage() {
  const EMPTY_STATS = { totalStudents: 0, activeStudents: 0, pendingPay: 0, approvedPay: 0, totalContent: 0, pendingUsers: 0 };
  const [stats,       setStats]       = useState(EMPTY_STATS);
  const [loadError,   setLoadError]   = useState(null);
  const adminUser = useAuthStore((st) => st.user);
  const [migrating,   setMigrating]   = useState(false);
  const [migrateMsg,  setMigrateMsg]  = useState("");

  const runMigration = async () => {
    if (!confirm("تشغيل المزامنة لمرة واحدة؟ (تقرأ كل الحسابات المفعّلة)")) return;
    setMigrating(true); setMigrateMsg("");
    try {
      const r = await backfillLeaderboardAndSubscriptions();
      setMigrateMsg(`تمت: ${r.leaderboard} طالباً في المتصدرين، ${r.subscriptions} اشتراكاً (من ${r.scanned} حساباً)`);
    } catch (e) {
      setMigrateMsg(`فشلت: ${e?.code || e?.message}`);
    } finally { setMigrating(false); }
  };
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentPay,   setRecentPay]   = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // ─── العدّ بدون قراءة المستندات (قراءة واحدة تقريباً لكل 1000 مستند) ───
        const countOf = async (q) => (await getCountFromServer(q)).data().count;
        const users    = collection(db, "users");
        const payments = collection(db, "payments");

        const [
          activeStudents, activeMainAdmins,
          pendingPay, approvedPay, totalContent,
        ] = await Promise.all([
          countOf(query(users, where("status", "==", "active"))),
          countOf(query(users, where("status", "==", "active"), where("role", "==", "admin"))),
          countOf(query(payments, where("status", "==", "pending"))),
          countOf(query(payments, where("status", "==", "approved"))),
          countOf(collection(db, "content")),
        ]);

        // إجمالي الطلاب = المفعّلون غير الأدمن الرئيسي
        const totalStudents = activeStudents - activeMainAdmins;

        setStats({
          totalStudents, activeStudents,
          pendingPay, approvedPay, totalContent,
          // ✅ pendingUsers = طلبات الدفع المعلقة
          pendingUsers: pendingPay,
        });

        // ─── آخر المستخدمين ───────────────────────────────────────────────────
        const recentUsersQ = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const recentUsersSnap = await getDocs(recentUsersQ);
        setRecentUsers(recentUsersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        // ─── آخر طلبات الدفع ──────────────────────────────────────────────────
        const recentPayQ = query(
          collection(db, "payments"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const recentPaySnap = await getDocs(recentPayQ);
        setRecentPay(recentPaySnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      } catch (err) {
        console.error(err);
        setLoadError(
          err?.code === "resource-exhausted" || /quota/i.test(err?.message || "")
            ? "تم تجاوز حصة قراءات Firestore اليومية. ستعود البيانات بعد تجديد الحصة (منتصف الليل بتوقيت المحيط الهادئ) أو عند الترقية إلى خطة Blaze."
            : "تعذّر تحميل البيانات. حاول مرة أخرى."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const statCards = [
    // ✅ إجمالي الطلاب = المفعّلون فقط
    { label: "إجمالي الطلاب",     value: stats.totalStudents,  icon: Users,       color: "blue",    href: "/admin/users" },
    { label: "حسابات مفعّلة",      value: stats.activeStudents, icon: CheckCircle, color: "emerald", href: "/admin/users" },
    // ✅ بانتظار التفعيل = طلبات الدفع المعلقة من payments
    { label: "بانتظار التفعيل",    value: stats.pendingUsers,   icon: Clock,       color: "orange",  href: "/admin/payments" },
    { label: "طلبات دفع معلقة",    value: stats.pendingPay,     icon: CreditCard,  color: "yellow",  href: "/admin/payments" },
    { label: "مدفوعات مقبولة",     value: stats.approvedPay,    icon: TrendingUp,  color: "green",   href: "/admin/payments" },
    { label: "عناصر المحتوى",      value: stats.totalContent,   icon: BookOpen,    color: "purple",  href: "/admin/courses" },
  ];

  const STATUS_CONFIG = {
    active:               { label: "مفعّل",        bg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
    pending:              { label: "انتظار",        bg: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" },
    waiting_verification: { label: "بانتظار التحقق",bg: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" },
    suspended:            { label: "موقوف",         bg: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
  };

  const PAY_STATUS = {
    pending:  { label: "معلق",   bg: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" },
    approved: { label: "مقبول",  bg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
    rejected: { label: "مرفوض", bg: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
  };

  return (
    <div className="space-y-8" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">لوحة التحكم</h1>
        <p className="text-gray-500 mt-1">نظرة عامة على منصة Darsna</p>
      </div>

      {adminUser?.role === "admin" && (
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex flex-wrap items-center gap-3">
          <button onClick={runMigration} disabled={migrating}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50">
            {migrating ? "جاري المزامنة..." : "مزامنة المتصدرين والاشتراكات (مرة واحدة)"}
          </button>
          {migrateMsg && <span className="text-sm text-gray-600 dark:text-gray-300">{migrateMsg}</span>}
        </div>
      )}

      {loadError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-bold">
          {loadError}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Link href={s.href}>
              <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                <div className={`w-11 h-11 bg-${s.color}-50 dark:bg-${s.color}-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <s.icon className={`text-${s.color}-500`} size={22} />
                </div>
                <p className="text-3xl font-black text-gray-800 dark:text-white">{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* جدولان */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* آخر المستخدمين */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-black text-gray-800 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-primary" /> آخر المسجلين
            </h2>
            <Link href="/admin/users" className="text-xs text-primary hover:underline font-bold">
              عرض الكل
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {recentUsers.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">لا يوجد مستخدمون بعد</p>
            ) : recentUsers.map((u) => {
              const st = STATUS_CONFIG[u.status] || STATUS_CONFIG.pending;
              return (
                <div key={u.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {u.name?.[0] || "؟"}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{u.name} {u.surname}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[140px]">{u.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.bg}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* آخر طلبات الدفع */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-black text-gray-800 dark:text-white flex items-center gap-2">
              <CreditCard size={18} className="text-primary" /> آخر طلبات الدفع
            </h2>
            <Link href="/admin/payments" className="text-xs text-primary hover:underline font-bold">
              عرض الكل
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {recentPay.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">لا توجد طلبات بعد</p>
            ) : recentPay.map((p) => {
              const st = PAY_STATUS[p.status] || PAY_STATUS.pending;
              return (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{p.userName}</p>
                    <p className="text-xs text-gray-400">{p.amount} د.ج</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.bg}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* روابط سريعة */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/admin/payments", icon: CreditCard, label: "مراجعة طلبات الدفع", desc: `${stats.pendingPay} طلب معلق`, color: "orange" },
          { href: "/admin/courses",  icon: BookOpen,   label: "إضافة محتوى جديد",   desc: "دروس، تمارين، اختبارات", color: "blue" },
          { href: "/admin/users",    icon: Users,      label: "إدارة المستخدمين",    desc: `${stats.totalStudents} طالب مفعّل`, color: "purple" },
        ].map((item, i) => (
          <Link key={i} href={item.href}>
            <div className={`p-5 rounded-2xl border-2 border-${item.color}-200 dark:border-${item.color}-900 bg-${item.color}-50 dark:bg-${item.color}-900/20 hover:shadow-md transition-all cursor-pointer group`}>
              <item.icon className={`text-${item.color}-500 mb-3 group-hover:scale-110 transition-transform`} size={28} />
              <p className="font-black text-gray-800 dark:text-gray-200">{item.label}</p>
              <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}