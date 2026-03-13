// src/app/dashboard/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen, Star, Trophy, Target, ArrowLeft,
  Zap, CheckCircle, Clock, TrendingUp, Flame,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuthStore } from "@/store/authStore";

// ─── نفس دالة getUserLevel من courses-page-v2 حرفياً ────────────────────────
function getUserLevel(user) {
  if (!user) return null;
  if (user.level === "middle") return "middle";
  if (user.level === "secondary") {
    const year      = user.year      || "";
    const branch    = user.branchType|| "";
    const specialty = user.specialty || "";
    if (year === "1sec") return branch === "arts" ? "1sec_arts" : "1sec_science";
    // السنة الثانية والثالثة — نفس المنطق (courses-page-v2 لا تفرّق بينهما)
    if (branch === "science_main") {
      if (specialty === "tech")           return "science_tech";
      if (specialty === "تسيير واقتصاد") return "science_eco";
      if (specialty === "رياضيات")        return "science_math";
      return "science_exp";
    }
    if (branch === "arts_main") return specialty === "lang" ? "arts_lang" : "arts_philo";
  }
  return null;
}

// عدد المواد — مطابق تماماً لـ ALL_SUBJECTS في courses-page-v2
const SUBJECTS_COUNT = {
  middle:       10, // m1→m10
  "1sec_science":10, // sc1→sc10
  "1sec_arts":  10, // ac1→ac10
  science_exp:   9, // se1→se9
  science_math:  9, // sm1→sm9
  science_tech:  8, // st1→st8 (+ subSpecialty ديناميكياً)
  science_eco:  10, // ec1→ec10
  arts_philo:    8, // ap1→ap8
  arts_lang:     7, // al1→al7 (+ thirdLanguage ديناميكياً)
};

function getSubjectsCount(user) {
  const level = getUserLevel(user);
  if (!level) return 0;
  let count = SUBJECTS_COUNT[level] || 0;
  if (level === "science_tech" && user?.subSpecialty) count += 1;
  if (level === "arts_lang"    && user?.thirdLanguage) count += 1;
  return count;
}

function getLevelLabel(user) {
  if (!user) return "";
  if (user.level === "middle") return "التعليم المتوسط";
  if (user.level === "secondary") {
    const year      = user.year       || "";
    const branch    = user.branchType || "";
    const specialty = user.specialty  || "";
    const specLabels = {
      tech:               "تقني رياضي",
      "تسيير واقتصاد":   "تسيير واقتصاد",
      "رياضيات":          "رياضيات",
      lang:               "لغات أجنبية",
    };
    const specLabel = specLabels[specialty] ||
      (branch === "arts_main" || branch === "arts" ? "آداب وفلسفة" : "علوم تجريبية");

    if (year === "1sec") return branch === "arts" ? "السنة الأولى ثانوي — آداب" : "السنة الأولى ثانوي — علوم";
    if (year === "2sec") return `السنة الثانية ثانوي — ${specLabel}`;
    return `السنة الثالثة ثانوي — ${specLabel}`;
  }
  return "";
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

// ─── الصفحة الرئيسية ─────────────────────────────────────────────────────────
export default function DashboardHome() {
  const router = useRouter();
  const user   = useAuthStore(s => s.user);

  const [stats, setStats] = useState({
    points:           0,
    rank:             null,
    subscribedCourses:0,
    tasksCompleted:   0,
    tasksTotal:       0,
    loading:          true,
  });

  // ─── تحميل الإحصائيات ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    loadStats();
  }, [user?.id]);

  const loadStats = async () => {
    try {
      const today = getTodayStr();

      // ✅ 1. عدد المواد = نفس منطق صفحة "موادي الدراسية"
      const subscribedCourses = getSubjectsCount(user);

      // ✅ 2. المهام المنجزة اليوم
      let tasksCompleted = 0, tasksTotal = 0;
      try {
        const tSnap = await getDocs(
          query(collection(db, "taskProgress"),
            where("userId", "==", user.id),
            where("date",   "==", today)
          )
        );
        tasksTotal     = tSnap.size;
        tasksCompleted = tSnap.docs.filter(d => d.data().completed).length;
      } catch {}

      // ✅ 3. الترتيب
      let rank = null;
      try {
        const allUsersSnap = await getDocs(
          query(collection(db, "users"), where("points", ">", user.points || 0))
        );
        rank = allUsersSnap.size + 1;
      } catch {}

      setStats({
        points:            user.points || 0,
        rank,
        subscribedCourses,
        tasksCompleted,
        tasksTotal,
        loading:           false,
      });
    } catch {
      setStats(s => ({ ...s, loading: false }));
    }
  };

  const taskPercent = stats.tasksTotal > 0
    ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100)
    : 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "صباح الخير";
    if (h < 17) return "مساء الخير";
    return "مساء النور";
  };

  // ─── بطاقات الإحصائيات ──────────────────────────────────────────────────────
  const statCards = [
    {
      label: "المواد المشترك بها",
      value: stats.loading ? "..." : stats.subscribedCourses,
      icon:  BookOpen,
      color: "blue",
      sub:   "مادة دراسية",
    },
    {
      label: "رصيد النقاط",
      value: stats.loading ? "..." : stats.points.toLocaleString("ar"),
      icon:  Star,
      color: "yellow",
      sub:   "نقطة مكتسبة",
    },
    {
      label: "المركز الحالي",
      value: stats.loading ? "..." : stats.rank ? `#${stats.rank}` : "—",
      icon:  Trophy,
      color: "orange",
      sub:   "في لوحة المتصدرين",
    },
    {
      label: "مهام اليوم",
      value: stats.loading ? "..." : `${stats.tasksCompleted}/${stats.tasksTotal || 0}`,
      icon:  Target,
      color: "emerald",
      sub:   stats.tasksTotal === 0 ? "لا توجد مهام اليوم" : `${taskPercent}% مكتملة`,
    },
  ];

  const colorMap = {
    blue:    { bg: "bg-blue-50 dark:bg-blue-900/20",    icon: "text-blue-500",    border: "border-blue-100 dark:border-blue-800"    },
    yellow:  { bg: "bg-yellow-50 dark:bg-yellow-900/20",icon: "text-yellow-500",  border: "border-yellow-100 dark:border-yellow-800"  },
    orange:  { bg: "bg-orange-50 dark:bg-orange-900/20",icon: "text-orange-500",  border: "border-orange-100 dark:border-orange-800"  },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/20",icon: "text-emerald-500",border: "border-emerald-100 dark:border-emerald-800"},
  };

  return (
    <div className="space-y-6" dir="rtl">

      {/* ─── البانر الترحيبي ─── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y:  0  }}
        className="relative overflow-hidden bg-gradient-to-l from-primary via-blue-600 to-violet-600 rounded-3xl p-6 md:p-8 text-white"
      >
        {/* خلفية زخرفية */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-white"/>
          <div className="absolute bottom-0 right-8 w-48 h-48 rounded-full bg-white"/>
        </div>

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
              لوحة التحكم الذكية
            </span>
            <h1 className="text-2xl md:text-3xl font-black mt-3">
              {greeting()}، {user?.name || "طالب"} 👋
            </h1>
            <p className="text-white/80 mt-1 text-sm">
              {getLevelLabel(user)
                ? `${getLevelLabel(user)} — جاهز لمواصلة رحلة التفوق؟`
                : "جاهز لمواصلة رحلة التفوق؟"}
            </p>

            {/* شريط تقدم المهام */}
            {stats.tasksTotal > 0 && (
              <div className="mt-4 max-w-xs">
                <div className="flex justify-between text-xs text-white/80 mb-1">
                  <span>مهام اليوم</span>
                  <span>{stats.tasksCompleted}/{stats.tasksTotal}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${taskPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* زر ابدأ الدراسة */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/dashboard/courses")}
            className="flex items-center gap-3 bg-white text-primary font-black px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all text-sm flex-shrink-0"
          >
            <Zap size={20} className="text-yellow-500"/>
            ابدأ الدراسة
            <ArrowLeft size={16}/>
          </motion.button>
        </div>
      </motion.div>

      {/* ─── بطاقات الإحصائيات ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const c    = colorMap[card.color];
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y:  0 }}
              transition={{ delay: i * 0.08 }}
              className={`bg-white dark:bg-gray-900 rounded-2xl border ${c.border} p-5 space-y-3`}
            >
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                <Icon className={c.icon} size={20}/>
              </div>
              <div>
                <p className="text-2xl font-black text-gray-800 dark:text-white">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
                <p className="text-xs text-gray-400">{card.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── روابط سريعة ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title:  "موادي الدراسية",
            desc:   "استعرض دروسك وتمارينك",
            icon:   BookOpen,
            color:  "blue",
            href:   "/dashboard/courses",
          },
          {
            title:  "مهمة اليوم",
            desc:   stats.tasksCompleted === stats.tasksTotal && stats.tasksTotal > 0
              ? "✅ أنهيت مهام اليوم!"
              : "أنهِ مهامك واكسب نقاطاً",
            icon:   Target,
            color:  "orange",
            href:   "/dashboard/tasks",
          },
          {
            title:  "لوحة المتصدرين",
            desc:   stats.rank ? `مركزك الحالي #${stats.rank}` : "تحقق من مركزك",
            icon:   Trophy,
            color:  "yellow",
            href:   "/dashboard/leaderboard",
          },
        ].map((item, i) => {
          const Icon = item.icon;
          const c    = colorMap[item.color] || colorMap.blue;
          return (
            <motion.button
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y:  0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              whileHover={{ y: -3 }}
              onClick={() => router.push(item.href)}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 text-right hover:shadow-md transition-all w-full"
            >
              <div className={`w-11 h-11 rounded-2xl ${c.bg} flex items-center justify-center mb-3`}>
                <Icon className={c.icon} size={22}/>
              </div>
              <p className="font-black text-gray-800 dark:text-white text-sm">{item.title}</p>
              <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
            </motion.button>
          );
        })}
      </div>

    </div>
  );
}