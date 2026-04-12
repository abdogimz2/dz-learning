// src/app/admin/courses/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, FileText, HelpCircle, Upload, CheckCircle,
  AlertCircle, Loader2, ChevronDown, Plus, X, Award, Trash2,
  Search, Pencil, RefreshCw, Copy,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, updateDoc, query, orderBy, doc } from "firebase/firestore";

const LEVELS = [
  { value: "middle",            label: "التعليم المتوسط" },
  { value: "1sec_science",      label: "السنة الأولى — علوم وتكنولوجيا" },
  { value: "1sec_arts",         label: "السنة الأولى — آداب" },
  { value: "2sec_science_exp",  label: "السنة الثانية — علوم تجريبية" },
  { value: "2sec_science_math", label: "السنة الثانية — رياضيات" },
  { value: "2sec_science_tech", label: "السنة الثانية — تقني رياضي" },
  { value: "2sec_science_eco",  label: "السنة الثانية — تسيير واقتصاد" },
  { value: "2sec_arts_philo",   label: "السنة الثانية — آداب وفلسفة" },
  { value: "2sec_arts_lang",    label: "السنة الثانية — لغات أجنبية" },
  { value: "science_exp",       label: "السنة الثالثة — علوم تجريبية" },
  { value: "science_math",      label: "السنة الثالثة — رياضيات" },
  { value: "science_tech",      label: "السنة الثالثة — تقني رياضي" },
  { value: "science_eco",       label: "السنة الثالثة — تسيير واقتصاد" },
  { value: "arts_philo",        label: "السنة الثالثة — آداب وفلسفة" },
  { value: "arts_lang",         label: "السنة الثالثة — لغات أجنبية" },
];

// ─── تجميع المستويات حسب المرحلة ─────────────────────────────────────────────
const LEVEL_GROUPS = [
  {
    label: "التعليم المتوسط",
    levels: ["middle"],
  },
  {
    label: "السنة الأولى ثانوي",
    levels: ["1sec_science", "1sec_arts"],
  },
  {
    label: "السنة الثانية ثانوي",
    levels: ["2sec_science_exp","2sec_science_math","2sec_science_tech","2sec_science_eco","2sec_arts_philo","2sec_arts_lang"],
  },
  {
    label: "السنة الثالثة ثانوي",
    levels: ["science_exp","science_math","science_tech","science_eco","arts_philo","arts_lang"],
  },
];

const SUBJECTS_BY_LEVEL = {
  middle:               ["رياضيات","لغة عربية","فيزياء","علوم طبيعية","فرنسية","إنجليزية","تاريخ","جغرافيا","تربية إسلامية","تربية مدنية"],
  "1sec_science":       ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم","إعلام آلي"],
  "1sec_arts":          ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم","إعلام آلي"],
  "2sec_science_exp":   ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم"],
  "2sec_science_math":  ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم"],
  "2sec_science_tech":  ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","هندسة كهربائية","هندسة ميكانيكية","هندسة مدنية","هندسة الطرائق"],
  "2sec_science_eco":   ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","محاسبة","اقتصاد","قانون"],
  "2sec_arts_philo":    ["رياضيات","لغة عربية","إنجليزية","فرنسية","فلسفة","تاريخ","جغرافيا","تربية إسلامية"],
  "2sec_arts_lang":     ["رياضيات","لغة عربية","إنجليزية","فرنسية","فلسفة","تاريخ","جغرافيا","تربية إسلامية","لغة ألمانية","لغة إسبانية","لغة إيطالية"],
  science_exp:          ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم","فلسفة"],
  science_math:         ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","علوم","فلسفة"],
  science_tech:         ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","فيزياء","هندسة كهربائية","هندسة ميكانيكية","هندسة مدنية","هندسة الطرائق","فلسفة"],
  science_eco:          ["لغة عربية","فرنسية","إنجليزية","رياضيات","تاريخ","جغرافيا","تربية إسلامية","محاسبة","اقتصاد","قانون","فلسفة"],
  arts_philo:           ["رياضيات","لغة عربية","إنجليزية","فرنسية","فلسفة","تاريخ","جغرافيا","تربية إسلامية"],
  arts_lang:            ["رياضيات","لغة عربية","إنجليزية","فرنسية","فلسفة","تاريخ","جغرافيا","تربية إسلامية","لغة ألمانية","لغة إسبانية","لغة إيطالية"],
};

const SEMESTERS = [
  { value: "s1",    label: "الفصل الأول" },
  { value: "s2",    label: "الفصل الثاني" },
  { value: "s3",    label: "الفصل الثالث" },
  { value: "final", label: "الفصل النهائي (بكالوريا)" },
];

const CONTENT_TYPES = [
  { value: "lesson",   label: "درس",         icon: BookOpen,   color: "blue"   },
  { value: "exercise", label: "تمرين",        icon: FileText,   color: "emerald"},
  { value: "exam",     label: "اختبار شامل",  icon: Award,      color: "purple" },
  { value: "qa",       label: "سؤال وجواب",   icon: HelpCircle, color: "orange" },
];

const CLOUDINARY_CLOUD_NAME    = "dm2hx997l";
const CLOUDINARY_UPLOAD_PRESET = "dz_learning";

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

// ─── مكون تحديد الشعب المتعددة ───────────────────────────────────────────────
function MultiLevelSelector({ selectedLevels, onChange, subject, onSubjectChange }) {

  // جلب المواد المشتركة بين جميع الشعب المختارة
  const commonSubjects = selectedLevels.length === 0 ? [] :
    selectedLevels.reduce((common, lvl) => {
      const subjects = SUBJECTS_BY_LEVEL[lvl] || [];
      return common.filter(s => subjects.includes(s));
    }, SUBJECTS_BY_LEVEL[selectedLevels[0]] || []);

  const toggleLevel = (lvl) => {
    if (selectedLevels.includes(lvl)) {
      const next = selectedLevels.filter(l => l !== lvl);
      onChange(next);
      // إذا المادة الحالية غير موجودة في الشعب الجديدة امسحها
      if (subject && next.length > 0) {
        const newCommon = next.reduce((common, l) => {
          return common.filter(s => (SUBJECTS_BY_LEVEL[l] || []).includes(s));
        }, SUBJECTS_BY_LEVEL[next[0]] || []);
        if (!newCommon.includes(subject)) onSubjectChange("");
      }
    } else {
      const next = [...selectedLevels, lvl];
      onChange(next);
      // إذا المادة الحالية غير مشتركة امسحها
      if (subject) {
        const newCommon = next.reduce((common, l) => {
          return common.filter(s => (SUBJECTS_BY_LEVEL[l] || []).includes(s));
        }, SUBJECTS_BY_LEVEL[next[0]] || []);
        if (!newCommon.includes(subject)) onSubjectChange("");
      }
    }
  };

  const getLevelLabel = (val) => LEVELS.find(l => l.value === val)?.label || val;

  return (
    <div className="space-y-4">
      {/* الشعب المختارة */}
      {selectedLevels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLevels.map(lvl => (
            <span key={lvl}
              className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/20">
              {getLevelLabel(lvl).replace(/.*—\s*/, "")}
              <button type="button" onClick={() => toggleLevel(lvl)}
                className="hover:text-red-500 transition-colors">
                <X size={12}/>
              </button>
            </span>
          ))}
          {selectedLevels.length > 1 && (
            <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Copy size={11}/> {selectedLevels.length} شعب — محتوى مشترك
            </span>
          )}
        </div>
      )}

      {/* مجموعات الشعب */}
      <div className="space-y-3">
        {LEVEL_GROUPS.map(group => {
          const groupLevels = group.levels.filter(lvl => LEVELS.find(l => l.value === lvl));
          if (groupLevels.length === 0) return null;

          // تحقق إذا كل شعب المجموعة محددة
          const allSelected = groupLevels.every(lvl => selectedLevels.includes(lvl));
          const someSelected = groupLevels.some(lvl => selectedLevels.includes(lvl));

          return (
            <div key={group.label}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
              {/* رأس المجموعة */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {group.label}
                </p>
                {groupLevels.length > 1 && (
                  <button type="button"
                    onClick={() => {
                      if (allSelected) {
                        onChange(selectedLevels.filter(l => !groupLevels.includes(l)));
                        onSubjectChange("");
                      } else {
                        const next = [...new Set([...selectedLevels, ...groupLevels])];
                        onChange(next);
                        if (subject) {
                          const newCommon = next.reduce((common, l) => {
                            return common.filter(s => (SUBJECTS_BY_LEVEL[l] || []).includes(s));
                          }, SUBJECTS_BY_LEVEL[next[0]] || []);
                          if (!newCommon.includes(subject)) onSubjectChange("");
                        }
                      }
                    }}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${
                      allSelected
                        ? "bg-primary/10 text-primary hover:bg-red-50 hover:text-red-500"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-primary/10 hover:text-primary"
                    }`}>
                    {allSelected ? "إلغاء الكل" : "تحديد الكل"}
                  </button>
                )}
              </div>

              {/* الشعب */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {groupLevels.map(lvl => {
                  const isSelected = selectedLevels.includes(lvl);
                  const shortLabel = getLevelLabel(lvl).replace(/.*—\s*/, "");
                  return (
                    <button key={lvl} type="button" onClick={() => toggleLevel(lvl)}
                      className={`relative px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all text-right ${
                        isSelected
                          ? "border-primary bg-primary/5 dark:bg-primary/10 text-primary"
                          : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary/40 bg-white dark:bg-gray-800"
                      }`}>
                      {isSelected && (
                        <span className="absolute top-1 left-1 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center">
                          <CheckCircle size={9} className="text-white" strokeWidth={3}/>
                        </span>
                      )}
                      {shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* المواد المشتركة */}
      {selectedLevels.length > 0 && (
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            المادة <span className="text-red-500">*</span>
            {selectedLevels.length > 1 && (
              <span className="mr-2 text-xs font-normal text-gray-400">
                (المواد المشتركة بين {selectedLevels.length} شعب)
              </span>
            )}
          </label>
          {commonSubjects.length === 0 ? (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
                ⚠️ لا توجد مواد مشتركة بين الشعب المختارة
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                اختر شعباً متقاربة أو قلل عدد الشعب المختارة
              </p>
            </div>
          ) : (
            <div className="relative">
              <select value={subject} onChange={e => onSubjectChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none text-gray-800 dark:text-gray-200">
                <option value="">اختر المادة...</option>
                {commonSubjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18}/>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Select({ label, value, onChange, options, placeholder, required }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} required={required}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none text-gray-800 dark:text-gray-200">
          <option value="">{placeholder || "اختر..."}</option>
          {options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
          ))}
        </select>
        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18}/>
      </div>
    </div>
  );
}

function MultiFileUpload({ label, files, onAdd, onRemove, accept, hint, required }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {files.length > 0 && (
        <div className="space-y-2 mb-3">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="text-primary flex-shrink-0" size={16}/>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">({(file.size/1024/1024).toFixed(1)} MB)</span>
              </div>
              <button type="button" onClick={() => onRemove(idx)}
                className="text-red-400 hover:text-red-600 flex-shrink-0 mr-2 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <Trash2 size={16}/>
              </button>
            </div>
          ))}
        </div>
      )}
      <label className="flex items-center justify-center gap-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 cursor-pointer hover:border-primary transition-colors bg-gray-50 dark:bg-gray-800/50">
        <Upload className="text-gray-400 flex-shrink-0" size={22}/>
        <div className="text-center">
          <span className="text-sm font-bold text-gray-500 block">
            {files.length > 0 ? "➕ إضافة ملف آخر" : "اضغط لرفع الملف"}
          </span>
          {hint && <span className="text-xs text-gray-400">{hint}</span>}
        </div>
        <input type="file" className="hidden" accept={accept}
          onChange={(e) => { if (e.target.files[0]) { onAdd(e.target.files[0]); e.target.value = ""; } }}/>
      </label>
    </div>
  );
}

function ManageContent({ showToast }) {
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [editItem,   setEditItem]   = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const [filterType,    setFilterType]    = useState("all");
  const [filterLevel,   setFilterLevel]   = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [searchText,    setSearchText]    = useState("");

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const q    = query(collection(db, "content"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch { showToast("error", "فشل تحميل المحتوى"); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => { fetchContent(); }, []);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "content", id));
      setItems(prev => prev.filter(i => i.id !== id));
      showToast("success", "تم الحذف بنجاح ✅");
    } catch { showToast("error", "فشل الحذف"); }
    finally { setDeleting(null); setConfirmDel(null); }
  };

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const { id, createdAt, ...rest } = editItem;
      await updateDoc(doc(db, "content", id), { ...rest, updatedAt: serverTimestamp() });
      setItems(prev => prev.map(i => i.id === id ? editItem : i));
      showToast("success", "تم الحفظ بنجاح ✅");
      setEditItem(null);
    } catch { showToast("error", "فشل الحفظ"); }
    finally { setSaving(false); }
  };

  const subjectOptions = (SUBJECTS_BY_LEVEL[filterLevel] || []);

  const filtered = items.filter(item => {
    if (filterType    !== "all" && item.type    !== filterType)    return false;
    if (filterLevel   && item.level   !== filterLevel)             return false;
    if (filterSubject && item.subject !== filterSubject)           return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      if (!item.title?.toLowerCase().includes(q) &&
          !item.question?.toLowerCase().includes(q) &&
          !item.subject?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}}
              className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center space-y-5">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="text-red-500" size={28}/>
              </div>
              <p className="font-black text-gray-800 dark:text-white text-xl">تأكيد الحذف</p>
              <p className="text-gray-500 text-sm">هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDel(null)}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all">
                  إلغاء
                </button>
                <button onClick={() => handleDelete(confirmDel)} disabled={deleting === confirmDel}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {deleting === confirmDel ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}
                  حذف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editItem && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
            <motion.div initial={{scale:0.95,y:20}} animate={{scale:1,y:0}} exit={{scale:0.95}}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl w-full max-w-2xl space-y-4 my-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xl text-gray-800 dark:text-white">تعديل المحتوى</h3>
                <button onClick={() => setEditItem(null)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                  <X size={20}/>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Select label="المستوى" value={editItem.level}
                  onChange={v => setEditItem(p => ({...p, level: v, subject: ""}))}
                  options={LEVELS} placeholder="اختر"/>
                <Select label="المادة" value={editItem.subject}
                  onChange={v => setEditItem(p => ({...p, subject: v}))}
                  options={(SUBJECTS_BY_LEVEL[editItem.level]||[]).map(s=>({value:s,label:s}))}
                  placeholder="اختر"/>
                <Select label="الفصل" value={editItem.semester}
                  onChange={v => setEditItem(p => ({...p, semester: v}))}
                  options={SEMESTERS} placeholder="اختر"/>
              </div>
              {editItem.type !== "qa" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">العنوان</label>
                  <input value={editItem.title || ""} onChange={e => setEditItem(p=>({...p,title:e.target.value}))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-gray-200"/>
                </div>
              )}
              {editItem.type === "qa" && editItem.qaType !== "image" && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">السؤال</label>
                    <textarea rows={3} value={editItem.question || editItem.title || ""}
                      onChange={e => setEditItem(p=>({...p, question: e.target.value, title: e.target.value}))}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-gray-200 resize-none"/>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الجواب</label>
                    <textarea rows={3} value={editItem.answer || editItem.description || ""}
                      onChange={e => setEditItem(p=>({...p, answer: e.target.value, description: e.target.value}))}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-gray-200 resize-none"/>
                  </div>
                </>
              )}
              {editItem.type !== "qa" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الوصف (اختياري)</label>
                  <textarea rows={2} value={editItem.description || ""}
                    onChange={e => setEditItem(p=>({...p, description: e.target.value}))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-gray-800 dark:text-gray-200 resize-none"/>
                </div>
              )}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <button onClick={() => setEditItem(p=>({...p, isPublished: !p.isPublished}))}
                  className={`relative w-12 h-6 rounded-full transition-all ${editItem.isPublished ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${editItem.isPublished ? "right-1" : "left-1"}`}/>
                </button>
                <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">
                  {editItem.isPublished ? "منشور — يظهر للطلاب" : "مخفي — لا يظهر للطلاب"}
                </span>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditItem(null)}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all">
                  إلغاء
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold hover:bg-primary-hover transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>}
                  {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-gray-800 dark:text-white text-lg">
            {loading ? "جاري التحميل..." : `${filtered.length} عنصر`}
          </h2>
          <button onClick={fetchContent} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-all disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
            تحديث
          </button>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
          <input value={searchText} onChange={e => setSearchText(e.target.value)}
            placeholder="ابحث بالعنوان أو السؤال أو المادة..."
            className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm text-gray-800 dark:text-gray-200"
            dir="rtl"/>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm appearance-none text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary/20">
              <option value="all">كل الأنواع</option>
              {CONTENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14}/>
          </div>
          <div className="relative">
            <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value); setFilterSubject(""); }}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm appearance-none text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">كل المستويات</option>
              {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14}/>
          </div>
          <div className="relative">
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
              disabled={!filterLevel}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm appearance-none text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50">
              <option value="">كل المواد</option>
              {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14}/>
          </div>
          <button onClick={() => { setFilterType("all"); setFilterLevel(""); setFilterSubject(""); setSearchText(""); }}
            className="px-3 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200 transition-all">
            مسح الفلاتر ✕
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={32}/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
          <p className="font-bold text-lg">لا توجد نتائج</p>
          <p className="text-sm mt-1">جرّب تغيير الفلاتر أو كلمة البحث</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => {
            const TypeIcon  = CONTENT_TYPES.find(t => t.value === item.type)?.icon || HelpCircle;
            const typeColor = { lesson:"blue", exercise:"emerald", exam:"purple", qa:"orange" }[item.type] || "gray";
            const displayTitle = item.type === "qa" && item.qaType === "image"
              ? "🖼️ سؤال بصورة"
              : item.title || item.question || "—";
            return (
              <motion.div key={item.id} layout
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all">
                <div className={`p-2.5 rounded-xl flex-shrink-0 bg-${typeColor}-50 dark:bg-${typeColor}-900/20`}>
                  <TypeIcon className={`text-${typeColor}-500`} size={18}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{displayTitle}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {LEVELS.find(l=>l.value===item.level)?.label?.replace(/.*—\s*/,"")||item.level}
                    {item.subject && ` · ${item.subject}`}
                    {item.semester && ` · ${SEMESTERS.find(s=>s.value===item.semester)?.label||""}`}
                  </p>
                </div>
                <span className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg ${
                  item.isPublished
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                }`}>
                  {item.isPublished ? "منشور" : "مخفي"}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setEditItem({...item})}
                    className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100 transition-all">
                    <Pencil size={15}/>
                  </button>
                  <button onClick={() => setConfirmDel(item.id)} disabled={deleting === item.id}
                    className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 transition-all disabled:opacity-50">
                    {deleting === item.id ? <Loader2 size={15} className="animate-spin"/> : <Trash2 size={15}/>}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminCoursesPage() {
  const [activeType, setActiveType] = useState("lesson");
  const [submitting, setSubmitting] = useState(false);
  const [toast,      setToast]      = useState(null);
  const [uploading,  setUploading]  = useState(false);

  // ✅ شعب متعددة بدل level واحد
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [subject,        setSubject]        = useState("");
  const [semester,       setSemester]       = useState("");
  const [title,          setTitle]          = useState("");
  const [desc,           setDesc]           = useState("");

  const [mainFiles,     setMainFiles]     = useState([]);
  const [solutionFiles, setSolutionFiles] = useState([]);

  const [qaText,   setQaText]   = useState("");
  const [qaMode,   setQaMode]   = useState("text");
  const [imageQAs, setImageQAs] = useState([{ questionFile: null, answerFile: null, questionPreview: null, answerPreview: null }]);

  const parsedQA = qaText
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.includes(":"))
    .map(line => {
      const idx = line.indexOf(":");
      return { question: line.slice(0, idx).trim(), answer: line.slice(idx + 1).trim() };
    })
    .filter(qa => qa.question && qa.answer);

  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const resetForm = () => {
    setSelectedLevels([]); setSubject(""); setSemester("");
    setTitle(""); setDesc("");
    setMainFiles([]); setSolutionFiles([]);
    setQaText(""); setQaMode("text");
    setImageQAs([{ questionFile: null, answerFile: null, questionPreview: null, answerPreview: null }]);
    setUploadProgress({ current: 0, total: 0 });
  };

  const uploadFiles = async (files, startIndex = 0) => {
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      setUploadProgress({ current: startIndex + i + 1, total: uploadProgress.total });
      const url = await uploadToCloudinary(files[i]);
      urls.push(url);
    }
    return urls;
  };

  // ─── حفظ المحتوى لكل شعبة محددة ─────────────────────────────────────────
  const saveForLevel = async (level, fileUrls, solutionUrls, savedQAs) => {
    if (activeType === "qa" && qaMode === "image") {
      return Promise.all(savedQAs.map(({ questionUrl, answerUrl }) =>
        addDoc(collection(db, "content"), {
          type: "qa", qaType: "image",
          level, subject, semester,
          title: "image_question", description: "image_answer",
          question: "image_question", answer: "image_answer",
          questionImageUrl: questionUrl, answerImageUrl: answerUrl,
          fileUrl: null, solutionUrl: null, fileUrls: [], solutionUrls: [],
          createdAt: serverTimestamp(), updatedAt: serverTimestamp(), isPublished: true,
        })
      ));
    } else if (activeType === "qa" && qaMode === "text") {
      return Promise.all(parsedQA.map(qa =>
        addDoc(collection(db, "content"), {
          type: "qa", qaType: "text",
          level, subject, semester,
          title: qa.question, description: qa.answer,
          question: qa.question, answer: qa.answer,
          fileUrl: null, solutionUrl: null, fileUrls: [], solutionUrls: [],
          createdAt: serverTimestamp(), updatedAt: serverTimestamp(), isPublished: true,
        })
      ));
    } else {
      return addDoc(collection(db, "content"), {
        type: activeType, level, subject, semester,
        title, description: desc,
        fileUrl: fileUrls[0] || null, solutionUrl: solutionUrls[0] || null,
        fileUrls, solutionUrls,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(), isPublished: true,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedLevels.length === 0) { showToast("error", "يرجى اختيار شعبة واحدة على الأقل"); return; }
    if (!subject)                     { showToast("error", "يرجى اختيار المادة"); return; }
    if (!semester)                    { showToast("error", "يرجى اختيار الفصل الدراسي"); return; }
    if (activeType !== "qa" && !title.trim()) { showToast("error", "يرجى إدخال العنوان"); return; }
    if (activeType === "qa" && qaMode === "text" && parsedQA.length === 0) {
      showToast("error", "يرجى إدخال سؤال واحد على الأقل بصيغة: السؤال : الجواب");
      return;
    }
    if (activeType === "qa" && qaMode === "image") {
      const valid = imageQAs.filter(qa => qa.questionFile);
      if (valid.length === 0) { showToast("error", "يرجى إضافة صورة سؤال واحدة على الأقل"); return; }
    }

    const totalFiles = activeType === "qa" && qaMode === "image"
      ? imageQAs.filter(qa => qa.questionFile).reduce((acc, qa) => acc + 1 + (qa.answerFile ? 1 : 0), 0)
      : mainFiles.length + solutionFiles.length;

    setSubmitting(true);
    setUploading(totalFiles > 0);
    setUploadProgress({ current: 0, total: totalFiles });

    try {
      let fileUrls = [], solutionUrls = [], savedQAs = [];

      // ✅ رفع الملفات مرة واحدة فقط — ثم نشاركها لكل الشعب
      if (activeType === "qa" && qaMode === "image") {
        const validQAs = imageQAs.filter(qa => qa.questionFile);
        let uploadCount = 0;
        for (const qa of validQAs) {
          uploadCount++;
          setUploadProgress({ current: uploadCount, total: totalFiles });
          const questionUrl = await uploadToCloudinary(qa.questionFile);
          let answerUrl = null;
          if (qa.answerFile) {
            uploadCount++;
            setUploadProgress({ current: uploadCount, total: totalFiles });
            answerUrl = await uploadToCloudinary(qa.answerFile);
          }
          savedQAs.push({ questionUrl, answerUrl });
        }
      } else if (activeType !== "qa") {
        fileUrls     = mainFiles.length     > 0 ? await uploadFiles(mainFiles, 0) : [];
        solutionUrls = solutionFiles.length > 0 ? await uploadFiles(solutionFiles, mainFiles.length) : [];
      }

      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });

      // ✅ حفظ لكل شعبة محددة
      await Promise.all(
        selectedLevels.map(level => saveForLevel(level, fileUrls, solutionUrls, savedQAs))
      );

      const levelsCount   = selectedLevels.length;
      const contentLabel  = CONTENT_TYPES.find(t => t.value === activeType)?.label || "";

      if (activeType === "qa" && qaMode === "text") {
        showToast("success", `تم إضافة ${parsedQA.length} سؤال لـ ${levelsCount} شعبة ✅`);
      } else if (activeType === "qa" && qaMode === "image") {
        showToast("success", `تم إضافة ${savedQAs.length} سؤال بصورة لـ ${levelsCount} شعبة ✅`);
      } else {
        showToast("success", levelsCount > 1
          ? `تم إضافة ${contentLabel} لـ ${levelsCount} شعب ✅`
          : `تم إضافة ${contentLabel} بنجاح ✅`
        );
      }

      resetForm();
    } catch (err) {
      console.error("❌ خطأ:", err);
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      showToast("error", err.message || "حدث خطأ. حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  const [activeTab, setActiveTab] = useState("add");

  const currentType = CONTENT_TYPES.find((t) => t.value === activeType);

  // الفصول — إذا كان فيه شعبة سنة ثالثة نُظهر الفصل النهائي
  const hasThirdYear = selectedLevels.some(l =>
    !l.startsWith("2sec") && !l.startsWith("1sec") && l !== "middle"
  );
  const semesterOptions = hasThirdYear
    ? SEMESTERS
    : SEMESTERS.filter(s => s.value !== "final");

  return (
    <div className="space-y-8" dir="rtl">

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-white ${
              toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
            }`}>
            {toast.type === "success" ? <CheckCircle size={22}/> : <AlertCircle size={22}/>}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">إدارة المحتوى</h1>
        <p className="text-gray-500 mt-1">أضف دروساً، تمارين، اختبارات، وأسئلة لكل مادة ومستوى</p>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
        {[
          { id: "add",    label: "➕ إضافة محتوى" },
          { id: "manage", label: "⚙️ إدارة المحتوى" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-900 text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "manage" && <ManageContent showToast={showToast}/>}

      {activeTab === "add" && (<>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CONTENT_TYPES.map((type) => {
          const Icon   = type.icon;
          const active = activeType === type.value;
          const colorMap = {
            blue:    active ? "bg-blue-500 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30"          : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100",
            emerald: active ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100",
            purple:  active ? "bg-purple-500 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/30"    : "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100",
            orange:  active ? "bg-orange-500 text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/30"    : "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100",
          };
          return (
            <button key={type.value} onClick={() => { setActiveType(type.value); resetForm(); }}
              className={`flex flex-col items-center gap-2 p-5 rounded-2xl font-bold transition-all ${colorMap[type.color]} ${active ? "scale-105" : ""}`}>
              <Icon size={28}/>
              <span className="text-sm">{type.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-8 space-y-6">

        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
          {currentType && <currentType.icon size={24} className="text-primary"/>}
          <h2 className="text-xl font-black text-gray-800 dark:text-white">إضافة {currentType?.label}</h2>
        </div>

        {/* ✅ تحديد الشعب */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
            الشعب المستهدفة <span className="text-red-500">*</span>
            <span className="mr-2 text-xs font-normal text-gray-400">(يمكن تحديد أكثر من شعبة للمحتوى المشترك)</span>
          </label>
          <MultiLevelSelector
            selectedLevels={selectedLevels}
            onChange={setSelectedLevels}
            subject={subject}
            onSubjectChange={setSubject}
          />
        </div>

        {/* الفصل */}
        {selectedLevels.length > 0 && subject && (
          <Select
            label="الفصل الدراسي"
            value={semester}
            onChange={setSemester}
            options={semesterOptions}
            placeholder="اختر الفصل"
            required
          />
        )}

        {/* باقي الفورم — يظهر فقط بعد اختيار الشعبة والمادة والفصل */}
        {selectedLevels.length > 0 && subject && semester && (<>

          {/* معاينة الشعب المختارة */}
          {selectedLevels.length > 1 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-start gap-3">
              <Copy className="text-emerald-500 flex-shrink-0 mt-0.5" size={18}/>
              <div>
                <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                  محتوى مشترك — سيُضاف لـ {selectedLevels.length} شعب
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                  مادة {subject} · {SEMESTERS.find(s => s.value === semester)?.label}
                </p>
              </div>
            </div>
          )}

          {activeType === "qa" ? (
            <div className="space-y-5">
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                {[
                  { value: "text",  label: "✏️ نص",   desc: "كتابة السؤال والجواب" },
                  { value: "image", label: "🖼️ صورة", desc: "رفع صور للسؤال والجواب" },
                ].map(m => (
                  <button key={m.value} type="button" onClick={() => setQaMode(m.value)}
                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
                      qaMode === m.value
                        ? "bg-white dark:bg-gray-900 text-orange-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}>
                    {m.label} <span className="font-normal text-xs hidden sm:inline">— {m.desc}</span>
                  </button>
                ))}
              </div>

              {qaMode === "text" && (
                <>
                  <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-2xl p-4">
                    <p className="text-sm font-black text-orange-700 dark:text-orange-400 mb-1">📝 طريقة الكتابة</p>
                    <p className="text-sm text-orange-600 dark:text-orange-300">كل سطر = سؤال وجواب. اكتب <strong>السؤال : الجواب</strong></p>
                    <div className="mt-2 bg-white dark:bg-gray-900 rounded-xl p-3 text-xs text-gray-500 font-mono border border-orange-100 dark:border-orange-900 leading-relaxed">
                      من هو ابو نواس : شاعر عباسي اشتهر بشعر الخمر<br/>
                      متى استقلت الجزائر : 5 جويلية 1962
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">الأسئلة والأجوبة <span className="text-red-500">*</span></label>
                      {parsedQA.length > 0 && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">✅ {parsedQA.length} سؤال</span>
                      )}
                    </div>
                    <textarea value={qaText} onChange={(e) => setQaText(e.target.value)} rows={8}
                      placeholder={"من هو ابو نواس : شاعر عباسي\nما عاصمة الجزائر : مدينة الجزائر"}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all resize-y font-mono text-sm text-gray-800 dark:text-gray-200" dir="rtl"/>
                  </div>
                  {parsedQA.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {parsedQA.map((qa, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">❓ {qa.question}</p>
                          <p className="text-sm text-gray-500 mt-0.5">💡 {qa.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {qaMode === "image" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
                    <p className="text-sm font-black text-blue-700 dark:text-blue-400 mb-1">🖼️ كيف يعمل وضع الصور</p>
                    <p className="text-sm text-blue-600 dark:text-blue-300">ارفع صورة للسؤال (مطلوبة) وصورة للجواب (اختيارية). مثالي للرموز الرياضية.</p>
                  </div>
                  {imageQAs.map((qa, idx) => (
                    <div key={idx} className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">سؤال {idx + 1}</p>
                        {imageQAs.length > 1 && (
                          <button type="button"
                            onClick={() => setImageQAs(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-all">
                            <Trash2 size={15}/>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">❓ صورة السؤال <span className="text-red-500">*</span></p>
                          {qa.questionPreview ? (
                            <div className="relative group">
                              <img src={qa.questionPreview} alt="سؤال" className="w-full h-28 object-contain bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"/>
                              <button type="button"
                                onClick={() => setImageQAs(prev => prev.map((q, i) => i === idx ? {...q, questionFile: null, questionPreview: null} : q))}
                                className="absolute top-1 left-1 bg-red-500 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-all">
                                <X size={12}/>
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-orange-400 transition-colors bg-gray-50 dark:bg-gray-800/50">
                              <Upload className="text-gray-400 mb-1" size={20}/>
                              <span className="text-xs text-gray-400 font-bold">ارفع صورة</span>
                              <input type="file" className="hidden" accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  const preview = URL.createObjectURL(file);
                                  setImageQAs(prev => prev.map((q, i) => i === idx ? {...q, questionFile: file, questionPreview: preview} : q));
                                  e.target.value = "";
                                }}/>
                            </label>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">💡 صورة الجواب <span className="text-gray-400">(اختياري)</span></p>
                          {qa.answerPreview ? (
                            <div className="relative group">
                              <img src={qa.answerPreview} alt="جواب" className="w-full h-28 object-contain bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"/>
                              <button type="button"
                                onClick={() => setImageQAs(prev => prev.map((q, i) => i === idx ? {...q, answerFile: null, answerPreview: null} : q))}
                                className="absolute top-1 left-1 bg-red-500 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-all">
                                <X size={12}/>
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-emerald-400 transition-colors bg-gray-50 dark:bg-gray-800/50">
                              <Upload className="text-gray-400 mb-1" size={20}/>
                              <span className="text-xs text-gray-400 font-bold">ارفع صورة</span>
                              <input type="file" className="hidden" accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  const preview = URL.createObjectURL(file);
                                  setImageQAs(prev => prev.map((q, i) => i === idx ? {...q, answerFile: file, answerPreview: preview} : q));
                                  e.target.value = "";
                                }}/>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => setImageQAs(prev => [...prev, { questionFile: null, answerFile: null, questionPreview: null, answerPreview: null }])}
                    className="w-full py-3 border-2 border-dashed border-orange-300 dark:border-orange-700 rounded-2xl text-orange-500 font-bold text-sm hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all flex items-center justify-center gap-2">
                    <Plus size={18}/> إضافة سؤال آخر
                  </button>
                  {imageQAs.filter(qa => qa.questionFile).length > 0 && (
                    <div className="text-center text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 py-2 rounded-xl">
                      ✅ {imageQAs.filter(qa => qa.questionFile).length} سؤال جاهز للرفع
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  العنوان <span className="text-red-500">*</span>
                </label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    activeType === "lesson"   ? "مثال: الوحدة الأولى — المعادلات التفاضلية" :
                    activeType === "exercise" ? "مثال: تمارين الوحدة الأولى" :
                    "مثال: اختبار الفصل الأول 2024"
                  }
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-800 dark:text-gray-200"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">الوصف (اختياري)</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
                  placeholder="وصف مختصر عن المحتوى..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-gray-800 dark:text-gray-200"/>
              </div>
              <MultiFileUpload
                label={
                  activeType === "lesson"   ? "ملفات الدرس (PDF أو صورة)" :
                  activeType === "exercise" ? "ملفات التمارين (PDF أو صورة)" :
                  "ملفات الاختبار (PDF أو صورة)"
                }
                files={mainFiles}
                onAdd={(f)    => setMainFiles(prev => [...prev, f])}
                onRemove={(i) => setMainFiles(prev => prev.filter((_, idx) => idx !== i))}
                accept=".pdf,image/*"
                hint="PDF أو صورة — يمكن إضافة أكثر من ملف"
              />
              {activeType === "exercise" && (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4">
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                    <CheckCircle size={16}/> ملفات الحل (اختياري)
                  </p>
                  <MultiFileUpload
                    label=""
                    files={solutionFiles}
                    onAdd={(f)    => setSolutionFiles(prev => [...prev, f])}
                    onRemove={(i) => setSolutionFiles(prev => prev.filter((_, idx) => idx !== i))}
                    accept=".pdf,image/*"
                    hint="يمكنك إضافة الحل الآن أو لاحقاً"
                  />
                </div>
              )}
            </div>
          )}

          {uploading && (
            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
              <Loader2 className="animate-spin text-blue-500 flex-shrink-0" size={18}/>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                  جاري رفع الملفات... ({uploadProgress.current} / {uploadProgress.total})
                </p>
                {uploadProgress.total > 0 && (
                  <div className="h-1.5 bg-blue-100 dark:bg-blue-900 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}/>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
            <button type="submit" disabled={submitting}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-blue-600 text-white font-black rounded-2xl hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0">
              {submitting
                ? <><Loader2 size={20} className="animate-spin"/> {uploading ? `جاري الرفع (${uploadProgress.current}/${uploadProgress.total})...` : "جاري الحفظ..."}</>
                : activeType === "qa" && qaMode === "text"
                  ? <><Plus size={20}/> إضافة {parsedQA.length > 0 ? `${parsedQA.length} سؤال` : "الأسئلة"} {selectedLevels.length > 1 ? `لـ ${selectedLevels.length} شعب` : ""}</>
                  : activeType === "qa" && qaMode === "image"
                    ? <><Plus size={20}/> رفع {imageQAs.filter(q=>q.questionFile).length} سؤال {selectedLevels.length > 1 ? `لـ ${selectedLevels.length} شعب` : ""}</>
                    : <><Plus size={20}/> إضافة {currentType?.label} {selectedLevels.length > 1 ? `لـ ${selectedLevels.length} شعب` : ""}</>
              }
            </button>
          </div>
        </>)}
      </form>
      </>)}
    </div>
  );
}