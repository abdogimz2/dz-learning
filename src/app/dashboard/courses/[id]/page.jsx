// src/app/dashboard/courses/[id]/page.jsx
"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ChevronDown, ArrowLeft, Award,
  FileText, PlayCircle, HelpCircle,
  CheckCircle2, Loader2, Download, Eye,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import FlashcardSession from "@/components/FlashcardSession";

// ─── قاموس المواد حسب level المحفوظ في Firestore ─────────────────────────────
const SUBJECTS_BY_LEVEL = {
  // المتوسط
  middle: ["رياضيات","لغة عربية","فيزياء","علوم طبيعية","فرنسية","إنجليزية","تاريخ","جغرافيا","تربية إسلامية","تربية مدنية"],

  // السنة أولى — جذع علوم وتكنولوجيا
  "1sec_science": ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم","إعلام آلي"],

  // السنة أولى — جذع آداب
  "1sec_arts": ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم","إعلام آلي"],

  // علوم تجريبية
  "science_exp": ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم طبيعية"],

  // رياضيات
  "science_math": ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم طبيعية"],

  // تقني رياضي — مواد مشتركة
  "science_tech": ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء"],

  // تسيير واقتصاد
  "science_eco": ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","محاسبة","اقتصاد","قانون"],

  // آداب وفلسفة
  "arts_philo": ["لغة عربية","فرنسية","إنجليزية","رياضيات","فلسفة","تاريخ","جغرافيا","تربية إسلامية"],

  // لغات أجنبية — مواد مشتركة (اللغة الثالثة تُضاف ديناميكياً)
  "arts_lang": ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية"],
};

// ─── تحديد level من بيانات المستخدم المحفوظة في Firestore ────────────────────
// البيانات المحفوظة:
//   level: "middle" | "secondary"
//   year:  "1sec" | "2sec" | "3sec"
//   branchType: "science" | "arts" | "science_main" | "arts_main"
//   specialty: "علوم تجريبية" | "رياضيات" | "tech" | "تسيير واقتصاد" | "آداب وفلسفة" | "lang"
//   subSpecialty: "هندسة كهربائية" | "هندسة ميكانيكية" | "هندسة مدنية" | "هندسة الطرائق"
function getUserLevel(user) {
  if (!user) return null;

  // متوسط
  if (user.level === "middle") return "middle";

  // ثانوي
  if (user.level === "secondary") {
    const year      = user.year;
    const branch    = user.branchType;
    const specialty = user.specialty || "";

    // السنة الأولى
    if (year === "1sec") {
      return branch === "arts" ? "1sec_arts" : "1sec_science";
    }

    // السنة الثانية أو الثالثة
    if (branch === "science_main" || branch === "science") {
      if (specialty === "tech")              return "science_tech";
      if (specialty === "تسيير واقتصاد")    return "science_eco";
      if (specialty === "رياضيات")           return "science_math";
      return "science_exp"; // علوم تجريبية أو افتراضي
    }

    if (branch === "arts_main" || branch === "arts") {
      if (specialty === "lang")              return "arts_lang";
      return "arts_philo"; // آداب وفلسفة أو افتراضي
    }
  }

  return null;
}

// ─── جلب قائمة مواد المستخدم ─────────────────────────────────────────────────
function getUserSubjects(user, userLevel) {
  const baseSubjects = [...(SUBJECTS_BY_LEVEL[userLevel] || [])];

  // تقني رياضي → أضف مادة الهندسة الخاصة بالمستخدم
  if (userLevel === "science_tech" && user?.subSpecialty) {
    baseSubjects.push(user.subSpecialty);
  }

  // لغات أجنبية → أضف اللغة الثالثة
  if (userLevel === "arts_lang" && user?.thirdLanguage) {
    baseSubjects.push(`لغة ${user.thirdLanguage}`);
  }

  return baseSubjects;
}

// ─── خريطة ID → اسم المادة (مطابقة لـ courses/page.jsx) ──────────────────────
const SUBJECT_TITLE_MAP = {
  // متوسط
  m1:"رياضيات", m2:"لغة عربية", m3:"فيزياء", m4:"علوم طبيعية", m5:"فرنسية",
  m6:"إنجليزية", m7:"تاريخ", m8:"جغرافيا", m9:"تربية إسلامية", m10:"تربية مدنية",
  // سنة أولى علوم
  sc1:"لغة عربية", sc2:"فرنسية", sc3:"إنجليزية", sc4:"رياضيات", sc5:"تاريخ",
  sc6:"جغرافيا", sc7:"تربية إسلامية", sc8:"فيزياء", sc9:"علوم", sc10:"إعلام آلي",
  // سنة أولى آداب
  ac1:"لغة عربية", ac2:"فرنسية", ac3:"إنجليزية", ac4:"رياضيات", ac5:"تاريخ",
  ac6:"جغرافيا", ac7:"تربية إسلامية", ac8:"فيزياء", ac9:"علوم", ac10:"إعلام آلي",
  // علوم تجريبية
  se1:"لغة عربية", se2:"فرنسية", se3:"إنجليزية", se4:"رياضيات", se5:"تاريخ",
  se6:"جغرافيا", se7:"تربية إسلامية", se8:"فيزياء", se9:"علوم طبيعية",
  // رياضيات
  sm1:"لغة عربية", sm2:"فرنسية", sm3:"إنجليزية", sm4:"رياضيات", sm5:"تاريخ",
  sm6:"جغرافيا", sm7:"تربية إسلامية", sm8:"فيزياء", sm9:"علوم طبيعية",
  // تقني رياضي
  st1:"لغة عربية", st2:"فرنسية", st3:"إنجليزية", st4:"رياضيات", st5:"تاريخ",
  st6:"جغرافيا", st7:"تربية إسلامية", st8:"فيزياء",
  // تسيير واقتصاد
  ec1:"لغة عربية", ec2:"فرنسية", ec3:"إنجليزية", ec4:"رياضيات", ec5:"تاريخ",
  ec6:"جغرافيا", ec7:"تربية إسلامية", ec8:"محاسبة", ec9:"اقتصاد", ec10:"قانون",
  // آداب وفلسفة
  ap1:"لغة عربية", ap2:"فرنسية", ap3:"إنجليزية", ap4:"رياضيات", ap5:"فلسفة",
  ap6:"تاريخ", ap7:"جغرافيا", ap8:"تربية إسلامية",
  // لغات أجنبية
  al1:"لغة عربية", al2:"فرنسية", al3:"إنجليزية", al4:"رياضيات",
  al5:"تاريخ", al6:"جغرافيا", al7:"تربية إسلامية",
};

// ─── استخراج اسم المادة من الـ id ────────────────────────────────────────────
function getSubjectName(subjectId, userLevel, user) {
  if (subjectId === "third_lang")   return user?.thirdLanguage ? `لغة ${user.thirdLanguage}` : "اللغة الثالثة";
  if (subjectId === "sub_specialty") return user?.subSpecialty || "الهندسة";
  return SUBJECT_TITLE_MAP[subjectId] || decodeURIComponent(subjectId);
}

// ─── أنواع المحتوى ────────────────────────────────────────────────────────────
const SECTION_TYPES = [
  { id: "lesson",   label: "الدروس",         icon: BookOpen,    color: "blue" },
  { id: "exercise", label: "التمارين",        icon: FileText,    color: "emerald" },
  { id: "solution", label: "حلول التمارين",  icon: CheckCircle2,color: "green" },
  { id: "exam",     label: "الاختبارات",      icon: Award,       color: "purple" },
  { id: "qa",       label: "سؤال وجواب",     icon: HelpCircle,  color: "orange" },
];

const SEMESTERS = [
  { id: "s1",    label: "الفصل الأول" },
  { id: "s2",    label: "الفصل الثاني" },
  { id: "s3",    label: "الفصل الثالث" },
  { id: "final", label: "الفصل النهائي (بكالوريا)" },
];

// ─── مكون عنصر المحتوى ───────────────────────────────────────────────────────
function ContentItem({ item }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 flex items-center justify-between gap-4 hover:border-primary/30 hover:shadow-md transition-all">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {item.type === "lesson"
          ? <PlayCircle className="text-blue-500 flex-shrink-0" size={22} />
          : <FileText className="text-emerald-500 flex-shrink-0" size={22} />
        }
        <div className="min-w-0">
          <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{item.title}</p>
          {item.description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {item.fileUrl && (
          <>
            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all">
              <Eye size={14} /> عرض
            </a>
            <a href={item.fileUrl} download
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-all shadow-sm">
              <Download size={14} /> تحميل
            </a>
          </>
        )}
        {item.solutionUrl && (
          <a href={item.solutionUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all">
            <CheckCircle2 size={14} /> الحل
          </a>
        )}
      </div>
    </div>
  );
}

// ─── مكون القسم ──────────────────────────────────────────────────────────────
function SectionAccordion({ section, items, loading }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;
  const colorMap = {
    blue: "bg-blue-500", emerald: "bg-emerald-500",
    green: "bg-green-500", purple: "bg-purple-500", orange: "bg-orange-500",
  };

  const handleToggle = () => {
    const opening = !open;
    setOpen(opening);
    // ✅ إبلاغ نظام المهام عند فتح درس أو تمرين لأول مرة
    if (opening && items.length > 0) {
      if (section.id === "lesson"   && window.__reportTaskAction) window.__reportTaskAction("lesson");
      if (section.id === "exercise" && window.__reportTaskAction) window.__reportTaskAction("exercise");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
      <button
        onClick={handleToggle}
        className="w-full p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${colorMap[section.color]} text-white`}>
            <Icon size={20} />
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-800 dark:text-gray-200">{section.label}</p>
            <p className="text-xs text-gray-400">
              {loading ? "جاري التحميل..." : `${items.length} عنصر`}
            </p>
          </div>
        </div>
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 dark:border-gray-800"
          >
            <div className="p-4 space-y-3">
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-primary" size={28} />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">لا يوجد محتوى متاح حالياً</p>
                  <p className="text-gray-300 text-xs mt-1">سيتم الإضافة قريباً</p>
                </div>
              ) : (
                items.map((item) => <ContentItem key={item.id} item={item} />)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function CourseDetailPage() {
  const params    = useParams();
  const subjectId = params.id?.toString() || "";

  const user = useAuthStore((state) => state.user);

  const [activeSemester, setActiveSemester] = useState("s1");
  const [content,  setContent]  = useState({});
  const [loading,  setLoading]  = useState(false);
  const [fetched,  setFetched]  = useState({});
  const [flashcardCards, setFlashcardCards] = useState(null);

  const userLevel   = getUserLevel(user);
  const subjectName = getSubjectName(subjectId, userLevel, user);

  useEffect(() => {
    if (!user || !userLevel || !subjectName) return;
    if (fetched[activeSemester]) return;

    const fetchContent = async () => {
      setLoading(true);
      try {
        console.log("🔍 جلب:", { userLevel, subjectName, activeSemester });

        const q = query(
          collection(db, "content"),
          where("level",       "==", userLevel),
          where("subject",     "==", subjectName),
          where("semester",    "==", activeSemester),
          where("isPublished", "==", true),
          orderBy("createdAt", "asc")
        );

        const snap = await getDocs(q);
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        console.log(`✅ وجدنا ${docs.length} عنصر`);

        setContent((prev) => ({
          ...prev,
          [activeSemester]: {
            lesson:   docs.filter((d) => d.type === "lesson"),
            exercise: docs.filter((d) => d.type === "exercise"),
            solution: docs.filter((d) => d.type === "solution"),
            exam:     docs.filter((d) => d.type === "exam"),
            qa:       docs.filter((d) => d.type === "qa"),
          },
        }));
        setFetched((prev) => ({ ...prev, [activeSemester]: true }));
      } catch (err) {
        console.error("❌ خطأ:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [activeSemester, userLevel, subjectName]);

  if (!user) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  const isThirdYear    = user.year === "3sec";
  const allSemesters   = isThirdYear ? SEMESTERS : SEMESTERS.filter((s) => s.id !== "final");
  const currentContent = content[activeSemester] || {};

  const yearLabel =
    user.level === "middle"      ? "التعليم المتوسط" :
    user.year   === "1sec"       ? "السنة الأولى ثانوي" :
    user.year   === "2sec"       ? "السنة الثانية ثانوي" :
                                   "السنة الثالثة ثانوي";

  return (
    <div className="space-y-8" dir="rtl">

      {flashcardCards && (
        <FlashcardSession
          cards={flashcardCards}
          onClose={() => setFlashcardCards(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/courses">
          <button className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100">{subjectName}</h1>
            <p className="text-sm text-gray-500">
              {yearLabel}
              {user.subSpecialty ? ` • ${user.subSpecialty}` :
               user.specialty && user.specialty !== "tech" && user.specialty !== "lang"
                 ? ` • ${user.specialty}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: BookOpen, label: "الدروس",    count: currentContent.lesson?.length   || 0, color: "blue" },
          { icon: FileText, label: "التمارين",   count: currentContent.exercise?.length || 0, color: "emerald" },
          { icon: Award,    label: "الاختبارات", count: currentContent.exam?.length     || 0, color: "purple" },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-center shadow-sm">
            <div className={`w-9 h-9 bg-${s.color}-50 dark:bg-${s.color}-900/20 rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <s.icon className={`text-${s.color}-500`} size={18} />
            </div>
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className="font-black text-gray-700 dark:text-gray-300 text-lg">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Semester Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {allSemesters.map((sem) => (
          <button
            key={sem.id}
            onClick={() => setActiveSemester(sem.id)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeSemester === sem.id
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-primary/40"
            }`}
          >
            {sem.label}
          </button>
        ))}
      </div>

      {/* Sections */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSemester}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {SECTION_TYPES.map((section) => {
            if (section.id === "qa") {
              const qaItems = currentContent.qa || [];
              return (
                <div
                  key={`${activeSemester}-qa`}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-orange-500 text-white">
                      <HelpCircle size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-200">سؤال وجواب</p>
                      <p className="text-xs text-gray-400">
                        {loading ? "جاري التحميل..." : `${qaItems.length} سؤال`}
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={loading || qaItems.length === 0}
                    onClick={() => setFlashcardCards(qaItems)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                  >
                    <Eye size={16} />
                    {qaItems.length === 0 ? "لا توجد أسئلة" : "ابدأ الجلسة"}
                  </button>
                </div>
              );
            }

            return (
              <SectionAccordion
                key={`${activeSemester}-${section.id}`}
                section={section}
                items={currentContent[section.id] || []}
                loading={loading}
              />
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}