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

  science_exp: [
    { id: "se1",  title: "لغة عربية",     color: "yellow", icon: "📖" },
    { id: "se2",  title: "فرنسية",        color: "red",    icon: "🇫🇷" },
    { id: "se3",  title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "se4",  title: "رياضيات",       color: "blue",   icon: "📐" },
    { id: "se5",  title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "se6",  title: "جغرافيا",       color: "teal",   icon: "🗺️" },
    { id: "se7",  title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    { id: "se8",  title: "فيزياء",        color: "purple", icon: "⚡" },
    { id: "se9",  title: "علوم طبيعية",   color: "green",  icon: "🌿" },
    { id: "se10", title: "فلسفة",         color: "purple", icon: "🧠" },
  ],

  science_math: [
    { id: "sm1",  title: "لغة عربية",     color: "yellow", icon: "📖" },
    { id: "sm2",  title: "فرنسية",        color: "red",    icon: "🇫🇷" },
    { id: "sm3",  title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "sm4",  title: "رياضيات",       color: "blue",   icon: "📐" },
    { id: "sm5",  title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "sm6",  title: "جغرافيا",       color: "teal",   icon: "🗺️" },
    { id: "sm7",  title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    { id: "sm8",  title: "فيزياء",        color: "purple", icon: "⚡" },
    { id: "sm9",  title: "علوم طبيعية",   color: "green",  icon: "🌿" },
    { id: "sm10", title: "فلسفة",         color: "purple", icon: "🧠" },
  ],

  science_tech: [
    { id: "st1", title: "لغة عربية",      color: "yellow", icon: "📖" },
    { id: "st2", title: "فرنسية",         color: "red",    icon: "🇫🇷" },
    { id: "st3", title: "إنجليزية",       color: "blue",   icon: "🇬🇧" },
    { id: "st4", title: "رياضيات",        color: "blue",   icon: "📐" },
    { id: "st5", title: "تاريخ",          color: "orange", icon: "🏛️" },
    { id: "st6", title: "جغرافيا",        color: "teal",   icon: "🗺️" },
    { id: "st7", title: "تربية إسلامية",  color: "emerald",icon: "☪️" },
    { id: "st8", title: "فيزياء",         color: "purple", icon: "⚡" },
    { id: "st9", title: "فلسفة",          color: "purple", icon: "🧠" },
    // مادة الهندسة تُضاف ديناميكياً من subSpecialty
  ],

  science_eco: [
    { id: "ec1",  title: "لغة عربية",     color: "yellow", icon: "📖" },
    { id: "ec2",  title: "فرنسية",        color: "red",    icon: "🇫🇷" },
    { id: "ec3",  title: "إنجليزية",      color: "blue",   icon: "🇬🇧" },
    { id: "ec4",  title: "رياضيات",       color: "blue",   icon: "📐" },
    { id: "ec5",  title: "تاريخ",         color: "orange", icon: "🏛️" },
    { id: "ec6",  title: "جغرافيا",       color: "teal",   icon: "🗺️" },
    { id: "ec7",  title: "تربية إسلامية", color: "emerald",icon: "☪️" },
    { id: "ec8",  title: "محاسبة",        color: "pink",   icon: "🧾" },
    { id: "ec9",  title: "اقتصاد",        color: "cyan",   icon: "📊" },
    { id: "ec10", title: "قانون",         color: "gray",   icon: "⚖️" },
    { id: "ec11", title: "فلسفة",         color: "purple", icon: "🧠" },
  ],

  arts_philo: [
    { id: "ap1", title: "لغة عربية",      color: "yellow", icon: "📖" },
    { id: "ap2", title: "فرنسية",         color: "red",    icon: "🇫🇷" },
    { id: "ap3", title: "إنجليزية",       color: "blue",   icon: "🇬🇧" },
    { id: "ap4", title: "رياضيات",        color: "blue",   icon: "📐" },
    { id: "ap5", title: "فلسفة",          color: "purple", icon: "🧠" },
    { id: "ap6", title: "تاريخ",          color: "orange", icon: "🏛️" },
    { id: "ap7", title: "جغرافيا",        color: "teal",   icon: "🗺️" },
    { id: "ap8", title: "تربية إسلامية",  color: "emerald",icon: "☪️" },
  ],

  arts_lang: [
    { id: "al1", title: "لغة عربية",      color: "yellow", icon: "📖" },
    { id: "al2", title: "فرنسية",         color: "red",    icon: "🇫🇷" },
    { id: "al3", title: "إنجليزية",       color: "blue",   icon: "🇬🇧" },
    { id: "al4", title: "رياضيات",        color: "blue",   icon: "📐" },
    { id: "al5", title: "تاريخ",          color: "orange", icon: "🏛️" },
    { id: "al6", title: "جغرافيا",        color: "teal",   icon: "🗺️" },
    { id: "al7", title: "تربية إسلامية",  color: "emerald",icon: "☪️" },
    { id: "al8", title: "فلسفة",          color: "purple", icon: "🧠" },
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

    if (year === "1sec") {
      return branch === "arts" ? "1sec_arts" : "1sec_science";
    }

    if (branch === "science_main") {
      if (specialty === "tech")           return "science_tech";
      if (specialty === "تسيير واقتصاد") return "science_eco";
      if (specialty === "رياضيات")        return "science_math";
      return "science_exp";
    }

    if (branch === "arts_main") {
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

  if (userLevel === "science_tech" && user.subSpecialty) {
    base.push({
      id:    "sub_specialty",
      title: user.subSpecialty,
      color: "indigo",
      icon:  "🔧",
    });
  }

  if (userLevel === "arts_lang" && user.thirdLanguage) {
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