// src/app/dashboard/courses/[id]/page.jsx
"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ChevronDown, ArrowLeft, Award,
  FileText, PlayCircle, HelpCircle,
  CheckCircle2, Loader2, Download, Eye, X,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import FlashcardSession from "@/components/FlashcardSession";

// ─── قاموس المواد حسب level ───────────────────────────────────────────────────
const SUBJECTS_BY_LEVEL = {
  middle:               ["رياضيات","لغة عربية","فيزياء","علوم طبيعية","فرنسية","إنجليزية","تاريخ","جغرافيا","تربية إسلامية","تربية مدنية"],
  "1sec_science":       ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم","إعلام آلي"],
  "1sec_arts":          ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم","إعلام آلي"],
  "2sec_science_exp":   ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم طبيعية"],
  "2sec_science_math":  ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم طبيعية"],
  "2sec_science_tech":  ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء"],
  "2sec_science_eco":   ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","محاسبة","اقتصاد","قانون"],
  "2sec_arts_philo":    ["لغة عربية","فرنسية","إنجليزية","رياضيات","فلسفة","تاريخ","جغرافيا","تربية إسلامية"],
  "2sec_arts_lang":     ["لغة عربية","فرنسية","إنجليزية","رياضيات","فلسفة","تاريخ","جغرافيا","تربية إسلامية","لغة ألمانية","لغة إسبانية","لغة إيطالية"],
  science_exp:          ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم طبيعية","فلسفة"],
  science_math:         ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم طبيعية","فلسفة"],
  science_tech:         ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","فلسفة"],
  science_eco:          ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","محاسبة","اقتصاد","قانون","فلسفة"],
  arts_philo:           ["لغة عربية","فرنسية","إنجليزية","رياضيات","فلسفة","تاريخ","جغرافيا","تربية إسلامية"],
  arts_lang:            ["لغة عربية","فرنسية","إنجليزية","رياضيات","فلسفة","تاريخ","جغرافيا","تربية إسلامية","لغة ألمانية","لغة إسبانية","لغة إيطالية"],
};

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

function getUserSubjects(user, userLevel) {
  const baseSubjects = [...(SUBJECTS_BY_LEVEL[userLevel] || [])];
  if ((userLevel === "science_tech" || userLevel === "2sec_science_tech") && user?.subSpecialty) {
    baseSubjects.push(user.subSpecialty);
  }
  if ((userLevel === "arts_lang" || userLevel === "2sec_arts_lang") && user?.thirdLanguage) {
    baseSubjects.push(`لغة ${user.thirdLanguage}`);
  }
  return baseSubjects;
}

// ─── خريطة ID → اسم المادة (مُحدَّثة بالـ IDs الجديدة) ──────────────────────
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
  // علوم تجريبية (سنة 3)
  se1:"لغة عربية", se2:"فرنسية", se3:"إنجليزية", se4:"رياضيات", se5:"تاريخ",
  se6:"جغرافيا", se7:"تربية إسلامية", se8:"فيزياء", se9:"علوم طبيعية", se10:"فلسفة",
  // رياضيات (سنة 3)
  sm1:"لغة عربية", sm2:"فرنسية", sm3:"إنجليزية", sm4:"رياضيات", sm5:"تاريخ",
  sm6:"جغرافيا", sm7:"تربية إسلامية", sm8:"فيزياء", sm9:"علوم طبيعية", sm10:"فلسفة",
  // تقني رياضي (سنة 3)
  st1:"لغة عربية", st2:"فرنسية", st3:"إنجليزية", st4:"رياضيات", st5:"تاريخ",
  st6:"جغرافيا", st7:"تربية إسلامية", st8:"فيزياء", st9:"فلسفة",
  // تسيير واقتصاد (سنة 3)
  ec1:"لغة عربية", ec2:"فرنسية", ec3:"إنجليزية", ec4:"رياضيات", ec5:"تاريخ",
  ec6:"جغرافيا", ec7:"تربية إسلامية", ec8:"محاسبة", ec9:"اقتصاد", ec10:"قانون", ec11:"فلسفة",
  // آداب وفلسفة (سنة 3)
  ap1:"لغة عربية", ap2:"فرنسية", ap3:"إنجليزية", ap4:"رياضيات", ap5:"فلسفة",
  ap6:"تاريخ", ap7:"جغرافيا", ap8:"تربية إسلامية",
  // لغات أجنبية (سنة 2 و 3)
  al1:"لغة عربية", al2:"فرنسية", al3:"إنجليزية", al4:"رياضيات",
  al5:"تاريخ", al6:"جغرافيا", al7:"تربية إسلامية", al8:"فلسفة",
};

function getSubjectName(subjectId, userLevel, user) {
  if (subjectId === "third_lang")    return user?.thirdLanguage ? `لغة ${user.thirdLanguage}` : "اللغة الثالثة";
  if (subjectId === "sub_specialty") return user?.subSpecialty || "الهندسة";
  return SUBJECT_TITLE_MAP[subjectId] || decodeURIComponent(subjectId);
}

const SECTION_TYPES = [
  { id: "lesson",   label: "الدروس",         icon: BookOpen,     color: "blue"    },
  { id: "exercise", label: "التمارين",        icon: FileText,     color: "emerald" },
  { id: "solution", label: "حلول التمارين",   icon: CheckCircle2, color: "green"   },
  { id: "exam",     label: "الاختبارات",      icon: Award,        color: "purple"  },
  { id: "qa",       label: "سؤال وجواب",      icon: HelpCircle,   color: "orange"  },
];

const SEMESTERS = [
  { id: "s1",    label: "الفصل الأول" },
  { id: "s2",    label: "الفصل الثاني" },
  { id: "s3",    label: "الفصل الثالث" },
  { id: "final", label: "الفصل النهائي (بكالوريا)" },
];

function FileViewer({ urls, title, onClose }) {
  const [current, setCurrent] = useState(0);
  const [zoom,    setZoom]    = useState(1);

  const url   = urls[current];
  const total = urls.length;
  const isPdf = url?.toLowerCase().includes(".pdf") || url?.includes("/raw/");

  useEffect(() => { setZoom(1); }, [current]);

  const openFullPage = () => window.open(url, "_blank");
  const zoomIn  = () => setZoom(z => Math.min(3, parseFloat((z + 0.25).toFixed(2))));
  const zoomOut = () => setZoom(z => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))));
  const resetZoom = () => setZoom(1);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col" dir="rtl">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-950 border-b border-gray-800 flex-shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button onClick={onClose}
            className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-red-600 hover:text-white transition-all flex-shrink-0">
            <X size={16}/>
          </button>
          <p className="font-bold text-white text-sm truncate">{title}</p>
          {total > 1 && (
            <span className="text-xs text-gray-400 flex-shrink-0 bg-gray-800 px-2 py-1 rounded-lg">
              {current + 1}/{total}
            </span>
          )}
        </div>
        {!isPdf && (
          <div className="flex items-center gap-1 bg-gray-800 rounded-xl px-2 py-1 flex-shrink-0">
            <button onClick={zoomOut} disabled={zoom <= 0.5}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-30 transition-all font-black text-lg">−</button>
            <button onClick={resetZoom}
              className="px-2 py-1 text-xs font-black text-gray-300 hover:text-white min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={zoomIn} disabled={zoom >= 3}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-30 transition-all font-black text-lg">+</button>
          </div>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={openFullPage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 text-gray-200 rounded-lg text-xs font-bold hover:bg-gray-600 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
            فتح كاملاً
          </button>
          <a href={url} download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-hover transition-all">
            <Download size={13}/> تحميل
          </a>
        </div>
      </div>

      {total > 1 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-800 overflow-x-auto flex-shrink-0">
          <button onClick={() => setCurrent(i => Math.max(0, i - 1))} disabled={current === 0}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 text-xs font-bold transition-all">
            ‹ السابق
          </button>
          <div className="flex gap-1.5 flex-1 overflow-x-auto">
            {urls.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  current === i ? "bg-primary text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}>
                ملف {i + 1}
              </button>
            ))}
          </div>
          <button onClick={() => setCurrent(i => Math.min(total - 1, i + 1))} disabled={current === total - 1}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 text-xs font-bold transition-all">
            التالي ›
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {isPdf ? (
          <iframe src={url} className="w-full h-full border-0 min-h-[600px]"
            title={`${title} - ملف ${current + 1}`}/>
        ) : (
          <div className="w-full h-full flex items-start justify-center p-4 overflow-auto"
            style={{ cursor: zoom > 1 ? "grab" : "default" }}>
            <img src={url} alt={`${title} - ملف ${current + 1}`}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                transition: "transform 0.2s ease",
                maxWidth: "100%",
                borderRadius: "12px",
                boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
              }}
            />
          </div>
        )}
      </div>

      {!isPdf && (
        <div className="flex items-center justify-center gap-4 py-2 bg-gray-950 border-t border-gray-800 flex-shrink-0">
          <input type="range" min="50" max="300" value={zoom * 100}
            onChange={(e) => setZoom(Number(e.target.value) / 100)}
            className="w-40 accent-primary cursor-pointer"/>
          <span className="text-xs text-gray-400 font-bold w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={resetZoom} className="text-xs text-gray-400 hover:text-white transition-colors">إعادة</button>
        </div>
      )}
    </div>
  );
}

function ContentItem({ item }) {
  const [viewerOpen,   setViewerOpen]   = useState(false);
  const [viewerUrls,   setViewerUrls]   = useState([]);
  const [viewerTitle,  setViewerTitle]  = useState("");
  const [solutionOpen, setSolutionOpen] = useState(false);

  const mainUrls = item.fileUrls?.length > 0
    ? item.fileUrls
    : item.fileUrl ? [item.fileUrl] : [];

  const solUrls = item.solutionUrls?.length > 0
    ? item.solutionUrls
    : item.solutionUrl ? [item.solutionUrl] : [];

  const openViewer = (urls, title) => {
    setViewerUrls(urls);
    setViewerTitle(title);
    setViewerOpen(true);
  };

  return (
    <>
      {viewerOpen && (
        <FileViewer urls={viewerUrls} title={viewerTitle} onClose={() => setViewerOpen(false)}/>
      )}
      {solutionOpen && (
        <FileViewer urls={solUrls} title={`حل — ${item.title}`} onClose={() => setSolutionOpen(false)}/>
      )}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 hover:border-primary/30 hover:shadow-md transition-all">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {item.type === "lesson"
              ? <PlayCircle className="text-blue-500 flex-shrink-0" size={22}/>
              : <FileText   className="text-emerald-500 flex-shrink-0" size={22}/>
            }
            <div className="min-w-0">
              <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{item.title}</p>
              {item.description && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
              )}
              {mainUrls.length > 1 && (
                <p className="text-xs text-primary font-bold mt-0.5">{mainUrls.length} ملفات</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            {mainUrls.length > 0 && (
              <button onClick={() => openViewer(mainUrls, item.title)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all">
                <Eye size={14}/>
                {mainUrls.length > 1 ? `عرض (${mainUrls.length})` : "عرض"}
              </button>
            )}
            {mainUrls.length > 0 && (
              <a href={mainUrls[0]} download
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-all shadow-sm">
                <Download size={14}/> تحميل
              </a>
            )}
            {solUrls.length > 0 && (
              <button onClick={() => setSolutionOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all">
                <CheckCircle2 size={14}/>
                {solUrls.length > 1 ? `الحل (${solUrls.length})` : "الحل"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

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
    if (opening && items.length > 0) {
      if (section.id === "lesson"   && window.__reportTaskAction) window.__reportTaskAction("lesson");
      if (section.id === "exercise" && window.__reportTaskAction) window.__reportTaskAction("exercise");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
      <button onClick={handleToggle}
        className="w-full p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
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
            className="border-t border-gray-100 dark:border-gray-800">
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

export default function CourseDetailPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const subjectId    = params.id?.toString() || "";
  const reviewCardId = searchParams.get("review");
  const autoOpen     = searchParams.get("autoopen");

  const user = useAuthStore((state) => state.user);

  const [activeSemester, setActiveSemester] = useState("s1");
  const [content,  setContent]  = useState({});
  const [loading,  setLoading]  = useState(false);
  const [fetched,  setFetched]  = useState({});
  const [flashcardCards,      setFlashcardCards]      = useState(null);
  const [flashcardStartIndex, setFlashcardStartIndex] = useState(0);

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

  useEffect(() => {
    if (!reviewCardId || !userLevel || !subjectName) return;
    const SEMS = ["s1", "s2", "final"];
    SEMS.forEach(sem => {
      if (!fetched[sem]) setActiveSemester(sem);
    });
  }, [reviewCardId, userLevel, subjectName]);

  useEffect(() => {
    if (!autoOpen || !reviewCardId) return;
    for (const sem of Object.values(content)) {
      const qaList = sem?.qa || [];
      if (qaList.length === 0) continue;
      const idx = qaList.findIndex(c => c.id === reviewCardId);
      if (idx !== -1) {
        setFlashcardStartIndex(idx);
        setFlashcardCards(qaList);
        return;
      }
    }
  }, [content, reviewCardId, autoOpen]);

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
    user.level === "middle"  ? "التعليم المتوسط" :
    user.year  === "1sec"    ? "السنة الأولى ثانوي" :
    user.year  === "2sec"    ? "السنة الثانية ثانوي" :
                               "السنة الثالثة ثانوي";

  return (
    <div className="space-y-8" dir="rtl">

      {flashcardCards && (
        <FlashcardSession
          cards={flashcardCards}
          startIndex={flashcardStartIndex}
          onClose={() => { setFlashcardCards(null); setFlashcardStartIndex(0); }}
        />
      )}

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

      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: BookOpen, label: "الدروس",    count: currentContent.lesson?.length   || 0, color: "blue"   },
          { icon: FileText, label: "التمارين",   count: currentContent.exercise?.length || 0, color: "emerald"},
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

      <div className="flex gap-2 overflow-x-auto pb-1">
        {allSemesters.map((sem) => (
          <button key={sem.id} onClick={() => setActiveSemester(sem.id)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeSemester === sem.id
                ? "bg-primary text-white shadow-lg shadow-primary/20"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-primary/40"
            }`}>
            {sem.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSemester}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4">
          {SECTION_TYPES.map((section) => {
            if (section.id === "qa") {
              const qaItems = currentContent.qa || [];
              return (
                <div key={`${activeSemester}-qa`}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex items-center justify-between">
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
                    onClick={() => { setFlashcardStartIndex(0); setFlashcardCards(qaItems); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed text-sm">
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