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
    { id: "sc1", title: "لغة عربية", color: "yellow", icon: "📖" },
    { id: "sc2", title: "رياضيات", color: "blue", icon: "📐" },
    { id: "sc3", title: "فيزياء", color: "purple", icon: "⚡" },
    { id: "sc4", title: "علوم طبيعية", color: "green", icon: "🌿" },
    { id: "sc5", title: "إعلام آلي", color: "gray", icon: "💻" },
    { id: "sc6", title: "تكنولوجيا", color: "cyan", icon: "⚙️" },
    { id: "sc7", title: "فرنسية", color: "red", icon: "🇫🇷" },
    { id: "sc8", title: "إنجليزية", color: "blue", icon: "🇬🇧" },
    { id: "sc9", title: "تاريخ", color: "orange", icon: "🏛️" },
    { id: "sc10", title: "جغرافيا", color: "teal", icon: "🗺️" },
    { id: "sc11", title: "تربية إسلامية", color: "emerald", icon: "☪️" },
  ],

  "1sec_arts": [
    { id: "ac1", title: "لغة عربية", color: "yellow", icon: "📖" },
    { id: "ac2", title: "تاريخ", color: "orange", icon: "🏛️" },
    { id: "ac3", title: "جغرافيا", color: "teal", icon: "🗺️" },
    { id: "ac4", title: "فرنسية", color: "red", icon: "🇫🇷" },
    { id: "ac5", title: "إنجليزية", color: "blue", icon: "🇬🇧" },
    { id: "ac6", title: "رياضيات", color: "blue", icon: "📐" },
    { id: "ac7", title: "تربية إسلامية", color: "emerald", icon: "☪️" },
    { id: "ac8", title: "علوم طبيعية", color: "green", icon: "🌿" },
    { id: "ac9", title: "فيزياء", color: "purple", icon: "⚡" },
    { id: "ac10", title: "إعلام آلي", color: "gray", icon: "💻" },
  ],

  "2sec_science_exp": [
    { id: "se21", title: "علوم طبيعية", color: "green", icon: "🌿" },
    { id: "se22", title: "فيزياء", color: "purple", icon: "⚡" },
    { id: "se23", title: "رياضيات", color: "blue", icon: "📐" },
    { id: "se24", title: "لغة عربية", color: "yellow", icon: "📖" },
    { id: "se25", title: "فرنسية", color: "red", icon: "🇫🇷" },
    { id: "se26", title: "إنجليزية", color: "blue", icon: "🇬🇧" },
    { id: "se27", title: "تاريخ", color: "orange", icon: "🏛️" },
    { id: "se28", title: "جغرافيا", color: "teal", icon: "🗺️" },
    { id: "se29", title: "تربية إسلامية", color: "emerald", icon: "☪️" },
  ],

  "2sec_science_math": [
    { id: "sm21", title: "رياضيات", color: "blue", icon: "📐" },
    { id: "sm22", title: "فيزياء", color: "purple", icon: "⚡" },
    { id: "sm23", title: "علوم طبيعية", color: "green", icon: "🌿" },
    { id: "sm24", title: "لغة عربية", color: "yellow", icon: "📖" },
    { id: "sm25", title: "فرنسية", color: "red", icon: "🇫🇷" },
    { id: "sm26", title: "إنجليزية", color: "blue", icon: "🇬🇧" },
    { id: "sm27", title: "تاريخ", color: "orange", icon: "🏛️" },
    { id: "sm28", title: "جغرافيا", color: "teal", icon: "🗺️" },
    { id: "sm29", title: "تربية إسلامية", color: "emerald", icon: "☪️" },
  ],

  "2sec_science_tech": [
    { id: "st21", title: "رياضيات", color: "blue", icon: "📐" },
    { id: "st22", title: "فيزياء", color: "purple", icon: "⚡" },
    { id: "st23", title: "لغة عربية", color: "yellow", icon: "📖" },
    { id: "st24", title: "فرنسية", color: "red", icon: "🇫🇷" },
    { id: "st25", title: "إنجليزية", color: "blue", icon: "🇬🇧" },
    { id: "st26", title: "تاريخ", color: "orange", icon: "🏛️" },
    { id: "st27", title: "جغرافيا", color: "teal", icon: "🗺️" },
    { id: "st28", title: "تربية إسلامية", color: "emerald", icon: "☪️" },
  ],

  "2sec_science_eco": [
    { id: "seco21", title: "محاسبة", color: "pink", icon: "🧾" },
    { id: "seco22", title: "اقتصاد", color: "cyan", icon: "📊" },
    { id: "seco23", title: "قانون", color: "gray", icon: "⚖️" },
    { id: "seco24", title: "رياضيات", color: "blue", icon: "📐" },
    { id: "seco25", title: "لغة عربية", color: "yellow", icon: "📖" },
    { id: "seco26", title: "تاريخ", color: "orange", icon: "🏛️" },
    { id: "seco27", title: "جغرافيا", color: "teal", icon: "🗺️" },
    { id: "seco28", title: "فرنسية", color: "red", icon: "🇫🇷" },
    { id: "seco29", title: "إنجليزية", color: "blue", icon: "🇬🇧" },
    { id: "seco210", title: "تربية إسلامية", color: "emerald", icon: "☪️" },
  ],

  "2sec_arts_philo": [
    { id: "aph21", title: "لغة عربية", color: "yellow", icon: "📖" },
    { id: "aph22", title: "فلسفة", color: "purple", icon: "🧠" },
    { id: "aph23", title: "تاريخ", color: "orange", icon: "🏛️" },
    { id: "aph24", title: "جغرافيا", color: "teal", icon: "🗺️" },
    { id: "aph25", title: "فرنسية", color: "red", icon: "🇫🇷" },
    { id: "aph26", title: "إنجليزية", color: "blue", icon: "🇬🇧" },
    { id: "aph27", title: "تربية إسلامية", color: "emerald", icon: "☪️" },
    { id: "aph28", title: "رياضيات", color: "blue", icon: "📐" },
    { id: "aph29", title: "علوم طبيعية", color: "green", icon: "🌿" },
    { id: "aph210", title: "فيزياء", color: "purple", icon: "⚡" },
  ],

  "2sec_arts_lang": [
    { id: "alg21", title: "لغة عربية", color: "yellow", icon: "📖" },
    { id: "alg22", title: "فرنسية", color: "red", icon: "🇫🇷" },
    { id: "alg23", title: "إنجليزية", color: "blue", icon: "🇬🇧" },
    { id: "alg25", title: "تاريخ", color: "orange", icon: "🏛️" },
    { id: "alg26", title: "جغرافيا", color: "teal", icon: "🗺️" },
    { id: "alg27", title: "تربية إسلامية", color: "emerald", icon: "☪️" },
    { id: "alg28", title: "رياضيات", color: "blue", icon: "📐" },
  ],

  "science_exp": [
    { id: "se31", title: "علوم طبيعية", color: "green", icon: "🌿" },
    { id: "se32", title: "فيزياء", color: "purple", icon: "⚡" },
    { id: "se33", title: "رياضيات", color: "blue", icon: "📐" },
    { id: "se34", title: "تربية إسلامية", color: "emerald", icon: "☪️" },
    { id: "se35", title: "فلسفة", color: "purple", icon: "🧠" },
    { id: "se36", title: "لغة عربية", color: "yellow", icon: "📖" },
    { id: "se37", title: "تاريخ", color: "orange", icon: "🏛️" },
    { id: "se38", title: "جغرافيا", color: "teal", icon: "🗺️" },
    { id: "se39", title: "فرنسية", color: "red", icon: "🇫🇷" },
    { id: "se310", title: "إنجليزية", color: "blue", icon: "🇬🇧" },
  ],

  "science_math": [
    { id: "sm31", title: "رياضيات", color: "blue", icon: "📐" },
    { id: "sm32", title: "فيزياء", color: "purple", icon: "⚡" },
    { id: "sm33", title: "علوم طبيعية", color: "green", icon: "🌿" },
    { id: "sm34", title: "فلسفة", color: "purple", icon: "🧠" },
    { id: "sm35", title: "لغة عربية", color: "yellow", icon: "📖" },
    { id: "sm36", title: "تربية إسلامية", color: "emerald", icon: "☪️" },
    { id: "sm37", title: "تاريخ", color: "orange", icon: "🏛️" },
    { id: "sm38", title: "جغرافيا", color: "teal", icon: "🗺️" },
    { id: "sm39", title: "فرنسية", color: "red", icon: "🇫🇷" },
    { id: "sm310", title: "إنجليزية", color: "blue", icon: "🇬🇧" },
  ],

  "science_tech": [
    { id: "st31", title: "رياضيات", color: "blue", icon: "📐" },
    { id: "st32", title: "فيزياء", color: "purple", icon: "⚡" },
    { id: "st33", title: "فلسفة", color: "purple", icon: "🧠" },
    { id: "st34", title: "لغة عربية", color: "yellow", icon: "📖" },
    { id: "st35", title: "تربية إسلامية", color: "emerald", icon: "☪️" },
    { id: "st36", title: "تاريخ", color: "orange", icon: "🏛️" },
    { id: "st37", title: "جغرافيا", color: "teal", icon: "🗺️" },
    { id: "st38", title: "فرنسية", color: "red", icon: "🇫🇷" },
    { id: "st39", title: "إنجليزية", color: "blue", icon: "🇬🇧" },
  ],

  "science_eco": [
    { id: "seco31", title: "محاسبة", color: "pink", icon: "🧾" },
    { id: "seco32", title: "اقتصاد", color: "cyan", icon: "📊" },
    { id: "seco33", title: "قانون", color: "gray", icon: "⚖️" },
    { id: "seco34", title: "رياضيات", color: "blue", icon: "📐" },
    { id: "seco35", title: "فلسفة", color: "purple", icon: "🧠" },
    { id: "seco36", title: "تاريخ", color: "orange", icon: "🏛️" },
    { id: "seco37", title: "جغرافيا", color: "teal", icon: "🗺️" },
    { id: "seco38", title: "لغة عربية", color: "yellow", icon: "📖" },
    { id: "seco39", title: "تربية إسلامية", color: "emerald", icon: "☪️" },
    { id: "seco310", title: "فرنسية", color: "red", icon: "🇫🇷" },
    { id: "seco311", title: "إنجليزية", color: "blue", icon: "🇬🇧" },
  ],

  "arts_philo": [
    { id: "aph31", title: "فلسفة", color: "purple", icon: "🧠" },
    { id: "aph32", title: "لغة عربية", color: "yellow", icon: "📖" },
    { id: "aph33", title: "تاريخ", color: "orange", icon: "🏛️" },
    { id: "aph34", title: "جغرافيا", color: "teal", icon: "🗺️" },
    { id: "aph35", title: "فرنسية", color: "red", icon: "🇫🇷" },
    { id: "aph36", title: "إنجليزية", color: "blue", icon: "🇬🇧" },
    { id: "aph37", title: "تربية إسلامية", color: "emerald", icon: "☪️" },
    { id: "aph38", title: "رياضيات", color: "blue", icon: "📐" },
  ],

  "arts_lang": [
    { id: "alg31", title: "فرنسية", color: "red", icon: "🇫🇷" },
    { id: "alg32", title: "إنجليزية", color: "blue", icon: "🇬🇧" },
    { id: "alg33", title: "لغة عربية", color: "yellow", icon: "📖" },
    { id: "alg34", title: "فلسفة", color: "purple", icon: "🧠" },
    { id: "alg35", title: "تاريخ", color: "orange", icon: "🏛️" },
    { id: "alg36", title: "جغرافيا", color: "teal", icon: "🗺️" },
    { id: "alg37", title: "تربية إسلامية", color: "emerald", icon: "☪️" },
    { id: "alg38", title: "رياضيات", color: "blue", icon: "📐" },
  ],
};
;

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