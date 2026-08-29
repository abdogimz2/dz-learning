// src/app/dashboard/courses/page.jsx
"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

const ALL_SUBJECTS = {
  middle: [
    { id: "m1",  title: "رياضيات",       color: "blue",   icon: "📐" },
    { id: "m2",  title: "لغة عربية",      color: "yellow", icon: "📖" },
    { id: "m3",  title: "فيزياء",         color: "purple", icon: "⚡" },
    { id: "m4",  title: "علوم طبيعية",    color: "green",  icon: "🌿" },
    { id: "m5",  title: "فرنسية",         color: "red",    icon: "🇫🇷" },
    { id: "m6",  title: "إنجليزية",       color: "blue",   icon: "🇬🇧" },
    { id: "m7",  title: "تاريخ",          color: "orange", icon: "🏛️" },
    { id: "m8",  title: "جغرافيا",        color: "teal",   icon: "🗺️" },
    { id: "m9",  title: "تربية إسلامية",  color: "emerald",icon: "☪️" },
    { id: "m10", title: "تربية مدنية",    color: "cyan",   icon: "🏛️" },
  ],

  "1sec_science": [
    { id: "sc1",  title: "لغة عربية",     color: "yellow", icon: "📖" },
    { id: "sc2",  title: "فرنسية",        color: "red",    icon: "🇫🇷" },
    { id: "sc3",  title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "sc4",  title: "رياضيات",       color: "blue",   icon: "📐" },
    { id: "sc5",  title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "sc6",  title: "جغرافيا",       color: "teal",   icon: "🗺️" },
    { id: "sc7",  title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    { id: "sc8",  title: "فيزياء",        color: "purple", icon: "⚡" },
    { id: "sc9",  title: "علوم",          color: "green",  icon: "🌿" },
    { id: "sc10", title: "إعلام آلي",     color: "gray",   icon: "💻" },
    { id: "sc11", title: "تكنولوجيا",     color: "cyan",   icon: "⚙️" },
  ],

  "1sec_arts": [
    { id: "ac1",  title: "لغة عربية",     color: "yellow", icon: "📖" },
    { id: "ac2",  title: "فرنسية",        color: "red",    icon: "🇫🇷" },
    { id: "ac3",  title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "ac4",  title: "رياضيات",       color: "blue",   icon: "📐" },
    { id: "ac5",  title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "ac6",  title: "جغرافيا",       color: "teal",   icon: "🗺️" },
    { id: "ac7",  title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    { id: "ac8",  title: "فيزياء",        color: "purple", icon: "⚡" },
    { id: "ac9",  title: "علوم",          color: "green",  icon: "🌿" },
    { id: "ac10", title: "إعلام آلي",     color: "gray",   icon: "💻" },
  ],

  // ═══════════ السنة الثانية ثانوي (جديد بالكامل) ═══════════
  "2sec_science_exp": [
    { id: "b2se1",  title: "لغة عربية",     color: "yellow", icon: "📖" },
    { id: "b2se2",  title: "فرنسية",        color: "red",    icon: "🇫🇷" },
    { id: "b2se3",  title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "b2se4",  title: "رياضيات",       color: "blue",   icon: "📐" },
    { id: "b2se5",  title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "b2se6",  title: "جغرافيا",       color: "teal",   icon: "🗺️" },
    { id: "b2se7",  title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    { id: "b2se8",  title: "فيزياء",        color: "purple", icon: "⚡" },
    { id: "b2se9",  title: "علوم طبيعية",   color: "green",  icon: "🌿" },
    { id: "b2se10", title: "إعلام آلي",     color: "gray",   icon: "💻" },
    { id: "b2se11", title: "فلسفة",         color: "purple", icon: "🧠" },
  ],

  "2sec_science_math": [
    { id: "b2sm1",  title: "لغة عربية",     color: "yellow", icon: "📖" },
    { id: "b2sm2",  title: "فرنسية",        color: "red",    icon: "🇫🇷" },
    { id: "b2sm3",  title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "b2sm4",  title: "رياضيات",       color: "blue",   icon: "📐" },
    { id: "b2sm5",  title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "b2sm6",  title: "جغرافيا",       color: "teal",   icon: "🗺️" },
    { id: "b2sm7",  title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    { id: "b2sm8",  title: "فيزياء",        color: "purple", icon: "⚡" },
    { id: "b2sm9",  title: "علوم طبيعية",   color: "green",  icon: "🌿" },
    { id: "b2sm10", title: "إعلام آلي",     color: "gray",   icon: "💻" },
    { id: "b2sm11", title: "فلسفة",         color: "purple", icon: "🧠" },
  ],

  "2sec_science_tech": [
    { id: "b2st1",  title: "لغة عربية",     color: "yellow", icon: "📖" },
    { id: "b2st2",  title: "فرنسية",        color: "red",    icon: "🇫🇷" },
    { id: "b2st3",  title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "b2st4",  title: "رياضيات",       color: "blue",   icon: "📐" },
    { id: "b2st5",  title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "b2st6",  title: "جغرافيا",       color: "teal",   icon: "🗺️" },
    { id: "b2st7",  title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    { id: "b2st8",  title: "فيزياء",        color: "purple", icon: "⚡" },
    { id: "b2st9",  title: "إعلام آلي",     color: "gray",   icon: "💻" },
    { id: "b2st10", title: "فلسفة",         color: "purple", icon: "🧠" },
    // مادة الهندسة تُضاف ديناميكياً من subSpecialty
  ],

  "2sec_science_eco": [
    { id: "b2ec1",  title: "لغة عربية",     color: "yellow", icon: "📖" },
    { id: "b2ec2",  title: "فرنسية",        color: "red",    icon: "🇫🇷" },
    { id: "b2ec3",  title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "b2ec4",  title: "رياضيات",       color: "blue",   icon: "📐" },
    { id: "b2ec5",  title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "b2ec6",  title: "جغرافيا",       color: "teal",   icon: "🗺️" },
    { id: "b2ec7",  title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    { id: "b2ec8",  title: "محاسبة",        color: "pink",   icon: "🧾" },
    { id: "b2ec9",  title: "اقتصاد",        color: "cyan",   icon: "📊" },
    { id: "b2ec10", title: "قانون",         color: "gray",   icon: "⚖️" },
    { id: "b2ec11", title: "إعلام آلي",     color: "gray",   icon: "💻" },
    { id: "b2ec12", title: "فلسفة",         color: "purple", icon: "🧠" },
  ],

  "2sec_arts_philo": [
    { id: "b2ap1",  title: "لغة عربية",     color: "yellow", icon: "📖" },
    { id: "b2ap2",  title: "فرنسية",        color: "red",    icon: "🇫🇷" },
    { id: "b2ap3",  title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "b2ap4",  title: "رياضيات",       color: "blue",   icon: "📐" },
    { id: "b2ap5",  title: "فلسفة",         color: "purple", icon: "🧠" },
    { id: "b2ap6",  title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "b2ap7",  title: "جغرافيا",       color: "teal",   icon: "🗺️" },
    { id: "b2ap8",  title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    { id: "b2ap9",  title: "إعلام آلي",     color: "gray",   icon: "💻" },
    { id: "b2ap10", title: "علوم طبيعية",   color: "green",  icon: "🌿" },
  ],

  "2sec_arts_lang": [
    { id: "b2al1", title: "لغة عربية",     color: "yellow", icon: "📖" },
    { id: "b2al2", title: "فرنسية",        color: "red",    icon: "🇫🇷" },
    { id: "b2al3", title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "b2al4", title: "رياضيات",       color: "blue",   icon: "📐" },
    { id: "b2al5", title: "فلسفة",         color: "purple", icon: "🧠" },
    { id: "b2al6", title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "b2al7", title: "جغرافيا",       color: "teal",   icon: "🗺️" },
    { id: "b2al8", title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    // اللغة الثالثة تُضاف ديناميكياً
  ],

  // ═══════════ السنة الثالثة ثانوي (معدّلة حسب القرار الجديد) ═══════════
  science_exp: [
    { id: "se1", title: "لغة عربية",     color: "yellow", icon: "📖" },
    { id: "se2", title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "se3", title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    { id: "se4", title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "se5", title: "رياضيات",       color: "blue",   icon: "📐" },
    { id: "se6", title: "فيزياء",        color: "purple", icon: "⚡" },
    { id: "se7", title: "علوم طبيعية",   color: "green",  icon: "🌿" },
  ],

  science_math: [
    { id: "sm1", title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "sm2", title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    { id: "sm3", title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "sm4", title: "رياضيات",       color: "blue",   icon: "📐" },
    { id: "sm5", title: "فيزياء",        color: "purple", icon: "⚡" },
    { id: "sm6", title: "علوم طبيعية",   color: "green",  icon: "🌿" },
    { id: "sm7", title: "إعلام آلي",     color: "gray",   icon: "💻" },
  ],

  science_tech: [
    { id: "st1", title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "st2", title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    { id: "st3", title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "st4", title: "رياضيات",       color: "blue",   icon: "📐" },
    { id: "st5", title: "فيزياء",        color: "purple", icon: "⚡" },
    { id: "st6", title: "إعلام آلي",     color: "gray",   icon: "💻" },
    // مادة الهندسة تُضاف ديناميكياً من subSpecialty
  ],

  science_eco: [
    { id: "ec1", title: "لغة عربية",     color: "yellow", icon: "📖" },
    { id: "ec2", title: "محاسبة",        color: "pink",   icon: "🧾" },
    { id: "ec3", title: "اقتصاد",        color: "cyan",   icon: "📊" },
    { id: "ec4", title: "قانون",         color: "gray",   icon: "⚖️" },
    { id: "ec5", title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "ec6", title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    { id: "ec7", title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "ec8", title: "جغرافيا",       color: "teal",   icon: "🗺️" },
    { id: "ec9", title: "رياضيات",       color: "blue",   icon: "📐" },
  ],

  arts_philo: [
    { id: "ap1", title: "لغة عربية",     color: "yellow", icon: "📖" },
    { id: "ap2", title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "ap3", title: "فرنسية",        color: "red",    icon: "🇫🇷" },
    { id: "ap4", title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    { id: "ap5", title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "ap6", title: "جغرافيا",       color: "teal",   icon: "🗺️" },
    { id: "ap7", title: "فلسفة",         color: "purple", icon: "🧠" },
  ],

  arts_lang: [
    { id: "al1", title: "لغة عربية",     color: "yellow", icon: "📖" },
    { id: "al2", title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "al3", title: "فرنسية",        color: "red",    icon: "🇫🇷" },
    { id: "al4", title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    { id: "al5", title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "al6", title: "جغرافيا",       color: "teal",   icon: "🗺️" },
    // اللغة الثالثة تُضاف ديناميكياً
  ],
};

export const SUBJECT_TITLE_MAP = Object.values(ALL_SUBJECTS)
  .flat()
  .reduce((acc, s) => { acc[s.id] = s.title; return acc; }, {});

  function getUserLevel(user) {
    if (!user) return null;
    if (user.level === "middle") return "middle";
    if (user.level === "secondary") {
      const year      = user.year      || "";
      const branch    = user.branchType|| "";
      const specialty = user.specialty || "";
      if (year === "1sec") return branch === "arts" ? "1sec_arts" : "1sec_science";
      if (year === "2sec") {
        if (branch === "science_main" || branch === "science") {
          if (specialty === "tech")           return "2sec_science_tech";
          if (specialty === "تسيير واقتصاد") return "2sec_science_eco";
          if (specialty === "رياضيات")        return "2sec_science_math";
          return "2sec_science_exp";
        }
        if (branch === "arts_main" || branch === "arts") {
          if (specialty === "lang")           return "2sec_arts_lang";
          return "2sec_arts_philo";
        }
      }
      if (branch === "science_main" || branch === "science") {
        if (specialty === "tech")           return "science_tech";
        if (specialty === "تسيير واقتصاد") return "science_eco";
        if (specialty === "رياضيات")        return "science_math";
        return "science_exp";
      }
      if (branch === "arts_main" || branch === "arts") {
        if (specialty === "lang")           return "arts_lang";
        return "arts_philo";
      }
    }
    return null;
  }

  function getSubjectsForUser(user) {
    if (!user) return [];
  
    const userLevel = getUserLevel(user);
    if (!userLevel) return [];
  
    const base = [...(ALL_SUBJECTS[userLevel] || [])];
  
    if ((userLevel === "science_tech" || userLevel === "2sec_science_tech") && user.subSpecialty) {
      base.push({
        id:    "sub_specialty",
        title: user.subSpecialty,
        color: "indigo",
        icon:  "🔧",
      });
    }
  
    if ((userLevel === "arts_lang" || userLevel === "2sec_arts_lang") && user.thirdLanguage) {
      base.push({
        id:    "third_lang",
        title: `لغة ${user.thirdLanguage}`,
        color: "violet",
        icon:  "🌐",
      });
    }
  
    return base;
  }

function SubjectCard({ subject, index }) {
  const colorBg = {
    blue:    "bg-blue-50 dark:bg-blue-900/20",
    yellow:  "bg-yellow-50 dark:bg-yellow-900/20",
    purple:  "bg-purple-50 dark:bg-purple-900/20",
    green:   "bg-green-50 dark:bg-green-900/20",
    red:     "bg-red-50 dark:bg-red-900/20",
    orange:  "bg-orange-50 dark:bg-orange-900/20",
    teal:    "bg-teal-50 dark:bg-teal-900/20",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20",
    cyan:    "bg-cyan-50 dark:bg-cyan-900/20",
    gray:    "bg-gray-50 dark:bg-gray-800",
    pink:    "bg-pink-50 dark:bg-pink-900/20",
    indigo:  "bg-indigo-50 dark:bg-indigo-900/20",
    violet:  "bg-violet-50 dark:bg-violet-900/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all"
    >
      <div className="p-7">
        <div className={`w-14 h-14 rounded-2xl ${colorBg[subject.color] || colorBg.gray} flex items-center justify-center mb-5 text-3xl`}>
          {subject.icon}
        </div>

        <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-1">
          {subject.title}
        </h3>
        <p className="text-sm text-gray-400 mb-6 flex items-center gap-1">
          <GraduationCap size={14} />
          <span>3 فصول دراسية</span>
        </p>

        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs font-bold text-gray-400">
            <span>نسبة الإنجاز</span>
            <span>0%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full w-0 bg-primary" />
          </div>
        </div>

        <Link href={`/dashboard/courses/${subject.id}`}>
          <button className="w-full py-3.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 group">
            دخول المادة
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function CoursesPage() {
  const user = useAuthStore((state) => state.user);
  const subjects = useMemo(() => getSubjectsForUser(user), [user]);

  const levelLabel =
    !user                    ? "" :
    user.level === "middle"  ? "التعليم المتوسط" :
    user.year  === "1sec"    ? "السنة الأولى ثانوي" :
    user.year  === "2sec"    ? "السنة الثانية ثانوي" :
                               "السنة الثالثة ثانوي";

  const specialtyLabel =
    user?.subSpecialty ||
    (user?.specialty && user.specialty !== "tech" && user.specialty !== "lang" ? user.specialty : "") ||
    "";

  if (!user) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100">موادي الدراسية</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <GraduationCap size={16} />
            <span>{levelLabel}</span>
            {specialtyLabel && (
              <>
                <span className="text-gray-300">•</span>
                <span>{specialtyLabel}</span>
              </>
            )}
            <span className="text-gray-300">•</span>
            <span className="font-bold text-primary">{subjects.length} مادة</span>
          </p>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
          <BookOpen className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-500">لا توجد مواد متاحة حالياً</h3>
          <p className="text-gray-400 mt-2">تواصل مع الدعم إذا كانت هذه مشكلة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {subjects.map((subject, i) => (
            <SubjectCard key={subject.id} subject={subject} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}