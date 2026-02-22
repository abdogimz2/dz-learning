// src/app/admin/courses/page.jsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, FileText, HelpCircle, Upload, CheckCircle,
  AlertCircle, Loader2, ChevronDown, Plus, X, Award,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// ─── الثوابت ─────────────────────────────────────────────────────────────────

const LEVELS = [
  { value: "middle", label: "التعليم المتوسط" },
  { value: "1sec_science", label: "السنة الأولى — علوم وتكنولوجيا" },
  { value: "1sec_arts",    label: "السنة الأولى — آداب" },
  { value: "science_exp",  label: "السنة 2/3 — علوم تجريبية" },
  { value: "science_math", label: "السنة 2/3 — رياضيات" },
  { value: "science_tech", label: "السنة 2/3 — تقني رياضي" },
  { value: "science_eco",  label: "السنة 2/3 — تسيير واقتصاد" },
  { value: "arts_philo",   label: "السنة 2/3 — آداب وفلسفة" },
  { value: "arts_lang",    label: "السنة 2/3 — لغات أجنبية" },
];

const SUBJECTS_BY_LEVEL = {
  middle:        ["رياضيات","لغة عربية","فيزياء","علوم طبيعية","فرنسية","إنجليزية","تاريخ","جغرافيا","تربية إسلامية","تربية مدنية"],
  "1sec_science":["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم","إعلام آلي"],
  "1sec_arts":   ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم","إعلام آلي"],
  science_exp:   ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم"],
  science_math:  ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم"],
  science_tech:  ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","هندسة كهربائية","هندسة ميكانيكية","هندسة مدنية","هندسة الطرائق"],
  science_eco:   ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","محاسبة","اقتصاد","قانون"],
  arts_philo:    ["رياضيات","لغة عربية","إنجليزية","فرنسية","فلسفة","تاريخ","جغرافيا","تربية إسلامية"],
  arts_lang:     ["رياضيات","لغة عربية","إنجليزية","فرنسية","تاريخ","جغرافيا","تربية إسلامية","لغة ألمانية","لغة إسبانية","لغة إيطالية"],
};

const SEMESTERS = [
  { value: "s1", label: "الفصل الأول" },
  { value: "s2", label: "الفصل الثاني" },
  { value: "s3", label: "الفصل الثالث" },
  { value: "final", label: "الفصل النهائي (بكالوريا)" },
];

const CONTENT_TYPES = [
  { value: "lesson",   label: "درس",           icon: BookOpen,   color: "blue" },
  { value: "exercise", label: "تمرين",          icon: FileText,   color: "emerald" },
  { value: "solution", label: "حل التمرين",     icon: CheckCircle,color: "green" },
  { value: "exam",     label: "اختبار شامل",    icon: Award,      color: "purple" },
  { value: "qa",       label: "سؤال وجواب",     icon: HelpCircle, color: "orange" },
];

const CLOUDINARY_CLOUD_NAME  = "dm2hx997l";
const CLOUDINARY_UPLOAD_PRESET = "dz_learning";

// ─── رفع ملف لـ Cloudinary ────────────────────────────────────────────────────
async function uploadToCloudinary(file) {
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res  = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: "POST", body: form }
  );
  const data = await res.json();
  if (!data.secure_url) throw new Error("فشل رفع الملف");
  return data.secure_url;
}

// ─── مكون Select مخصص ────────────────────────────────────────────────────────
function Select({ label, value, onChange, options, placeholder, required }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none text-gray-800 dark:text-gray-200"
        >
          <option value="">{placeholder || "اختر..."}</option>
          {options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
      </div>
    </div>
  );
}

// ─── مكون رفع ملف ────────────────────────────────────────────────────────────
function FileUpload({ label, file, onChange, onRemove, accept, hint }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      {file ? (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="text-primary flex-shrink-0" size={18} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {file.name}
            </span>
          </div>
          <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 flex-shrink-0 mr-2">
            <X size={18} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 cursor-pointer hover:border-primary transition-colors bg-gray-50 dark:bg-gray-800/50">
          <Upload className="text-gray-400 mb-2" size={28} />
          <span className="text-sm font-bold text-gray-500">اضغط لرفع الملف</span>
          {hint && <span className="text-xs text-gray-400 mt-1">{hint}</span>}
          <input type="file" className="hidden" accept={accept} onChange={(e) => onChange(e.target.files[0])} />
        </label>
      )}
    </div>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function AdminCoursesPage() {
  const [activeType, setActiveType] = useState("lesson");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState(null); // { type: "success"|"error", msg }

  // الحقول المشتركة
  const [level,    setLevel]    = useState("");
  const [subject,  setSubject]  = useState("");
  const [semester, setSemester] = useState("");
  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");

  // ملفات
  const [mainFile,     setMainFile]     = useState(null); // PDF أو صورة
  const [solutionFile, setSolutionFile] = useState(null); // حل التمرين

  // سؤال وجواب
  const [question, setQuestion] = useState("");
  const [answer,   setAnswer]   = useState("");

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const resetForm = () => {
    setLevel(""); setSubject(""); setSemester("");
    setTitle(""); setDesc("");
    setMainFile(null); setSolutionFile(null);
    setQuestion(""); setAnswer("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // تحقق من الحقول الأساسية
    if (!level || !subject || !semester) {
      showToast("error", "يرجى اختيار المستوى والمادة والفصل");
      return;
    }
    if (activeType !== "qa" && !title.trim()) {
      showToast("error", "يرجى إدخال العنوان");
      return;
    }
    if (activeType === "qa" && (!question.trim() || !answer.trim())) {
      showToast("error", "يرجى إدخال السؤال والجواب");
      return;
    }

    setSubmitting(true);
    try {
      let fileUrl     = null;
      let solutionUrl = null;

      // رفع الملف الرئيسي
      if (mainFile) {
        fileUrl = await uploadToCloudinary(mainFile);
      }

      // رفع ملف الحل إذا وُجد
      if (solutionFile) {
        solutionUrl = await uploadToCloudinary(solutionFile);
      }

      // بناء document حسب نوع المحتوى
      const docData = {
        type:        activeType,
        level,
        subject,
        semester,
        title:       activeType === "qa" ? question : title,
        description: activeType === "qa" ? answer   : desc,
        fileUrl,
        solutionUrl,
        // حقول خاصة بسؤال وجواب
        ...(activeType === "qa" && { question, answer }),
        createdAt:   serverTimestamp(),
        updatedAt:   serverTimestamp(),
        isPublished: true,
      };

      await addDoc(collection(db, "content"), docData);

      showToast("success", `تم إضافة ${CONTENT_TYPES.find(t => t.value === activeType)?.label} بنجاح!`);
      resetForm();
    } catch (err) {
      console.error(err);
      showToast("error", err.message || "حدث خطأ. حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  const currentType   = CONTENT_TYPES.find((t) => t.value === activeType);
  const subjectOptions = (SUBJECTS_BY_LEVEL[level] || []).map((s) => ({ value: s, label: s }));

  return (
    <div className="space-y-8" dir="rtl">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-white ${
              toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
            }`}
          >
            {toast.type === "success"
              ? <CheckCircle size={22} />
              : <AlertCircle size={22} />
            }
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">إدارة المحتوى</h1>
        <p className="text-gray-500 mt-1">أضف دروساً، تمارين، حلولاً، اختبارات، وأسئلة لكل مادة ومستوى</p>
      </div>

      {/* نوع المحتوى */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {CONTENT_TYPES.map((type) => {
          const Icon    = type.icon;
          const active  = activeType === type.value;
          const colorMap = {
            blue:    active ? "bg-blue-500 text-white shadow-blue-200"    : "bg-blue-50 text-blue-600 hover:bg-blue-100",
            emerald: active ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
            green:   active ? "bg-green-500 text-white shadow-green-200"  : "bg-green-50 text-green-600 hover:bg-green-100",
            purple:  active ? "bg-purple-500 text-white shadow-purple-200": "bg-purple-50 text-purple-600 hover:bg-purple-100",
            orange:  active ? "bg-orange-500 text-white shadow-orange-200": "bg-orange-50 text-orange-600 hover:bg-orange-100",
          };
          return (
            <button
              key={type.value}
              onClick={() => { setActiveType(type.value); resetForm(); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl font-bold transition-all shadow-sm ${colorMap[type.color]} ${active ? "shadow-lg scale-105" : ""}`}
            >
              <Icon size={26} />
              <span className="text-sm">{type.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-8 space-y-6">

        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
          {currentType && <currentType.icon size={24} className="text-primary" />}
          <h2 className="text-xl font-black text-gray-800 dark:text-white">
            إضافة {currentType?.label}
          </h2>
        </div>

        {/* المستوى والمادة والفصل */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="المستوى الدراسي"
            value={level}
            onChange={(v) => { setLevel(v); setSubject(""); }}
            options={LEVELS}
            placeholder="اختر المستوى"
            required
          />
          <Select
            label="المادة"
            value={subject}
            onChange={setSubject}
            options={subjectOptions}
            placeholder={level ? "اختر المادة" : "اختر المستوى أولاً"}
            required
          />
          <Select
            label="الفصل الدراسي"
            value={semester}
            onChange={setSemester}
            options={SEMESTERS}
            placeholder="اختر الفصل"
            required
          />
        </div>

        {/* محتوى سؤال وجواب */}
        {activeType === "qa" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                السؤال <span className="text-red-500">*</span>
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                placeholder="اكتب السؤال هنا..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-gray-800 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                الجواب <span className="text-red-500">*</span>
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={4}
                placeholder="اكتب الجواب الكامل هنا..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
        ) : (
          /* محتوى باقي الأنواع */
          <div className="space-y-4">
            {/* العنوان */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                العنوان <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  activeType === "lesson"   ? "مثال: الوحدة الأولى — المعادلات التفاضلية" :
                  activeType === "exercise" ? "مثال: تمارين الوحدة الأولى"                :
                  activeType === "solution" ? "مثال: حل تمارين الوحدة الأولى"             :
                  "مثال: اختبار الفصل الأول 2024"
                }
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-800 dark:text-gray-200"
              />
            </div>

            {/* الوصف */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                الوصف (اختياري)
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                placeholder="وصف مختصر عن المحتوى..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-gray-800 dark:text-gray-200"
              />
            </div>

            {/* رفع الملف */}
            <FileUpload
              label={
                activeType === "lesson"   ? "ملف الدرس (PDF)" :
                activeType === "exercise" ? "ملف التمارين (PDF)" :
                activeType === "solution" ? "ملف الحل (PDF)" :
                "ملف الاختبار (PDF)"
              }
              file={mainFile}
              onChange={setMainFile}
              onRemove={() => setMainFile(null)}
              accept=".pdf,image/*"
              hint="PDF أو صورة — الحد الأقصى 10MB"
            />

            {/* ملف الحل للتمارين */}
            {activeType === "exercise" && (
              <FileUpload
                label="ملف الحل (اختياري)"
                file={solutionFile}
                onChange={setSolutionFile}
                onRemove={() => setSolutionFile(null)}
                accept=".pdf,image/*"
                hint="يمكنك إضافة الحل لاحقاً"
              />
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-blue-600 text-white font-black rounded-2xl hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {submitting ? (
              <><Loader2 size={20} className="animate-spin" /> جاري الحفظ...</>
            ) : (
              <><Plus size={20} /> إضافة {currentType?.label}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}