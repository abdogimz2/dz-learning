// src/app/admin/tasks/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Plus, Trash2, Calendar, CheckCircle,
  AlertCircle, Loader2, ChevronDown, Star, X, Users,
} from "lucide-react";
import { db } from "@/lib/firebase/config";
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, serverTimestamp, query, orderBy,
} from "firebase/firestore";

// ─── أنواع المهام ─────────────────────────────────────────────────────────────
const TASK_TYPES = [
  { value: "qa",       label: "إنهاء X سؤال وجواب",         icon: "❓" },
  { value: "lesson",   label: "إنهاء X درس",                 icon: "📖" },
  { value: "exercise", label: "إنهاء X تمرين",               icon: "📝" },
  { value: "combined", label: "مهمة مجمّعة (س.و.ج + درس + تمرين)", icon: "🎯" },
];

// ─── المستويات الدراسية (تطابق getUserLevel) ─────────────────────────────────
const LEVELS = [
  { value: "all",               label: "🌍 جميع المستويات" },
  { value: "middle",            label: "📚 التعليم المتوسط" },
  { value: "1sec_science",      label: "🔬 السنة الأولى — علوم وتكنولوجيا" },
  { value: "1sec_arts",         label: "📖 السنة الأولى — آداب" },
  { value: "2sec_science_exp",  label: "🧪 السنة الثانية — علوم تجريبية" },
  { value: "2sec_science_math", label: "📐 السنة الثانية — رياضيات" },
  { value: "2sec_science_tech", label: "⚙️ السنة الثانية — تقني رياضي" },
  { value: "2sec_science_eco",  label: "💼 السنة الثانية — تسيير واقتصاد" },
  { value: "2sec_arts_philo",   label: "🧠 السنة الثانية — آداب وفلسفة" },
  { value: "2sec_arts_lang",    label: "🌐 السنة الثانية — لغات أجنبية" },
  { value: "science_exp",       label: "🧪 السنة الثالثة — علوم تجريبية" },
  { value: "science_math",      label: "📐 السنة الثالثة — رياضيات" },
  { value: "science_tech",      label: "⚙️ السنة الثالثة — تقني رياضي" },
  { value: "science_eco",       label: "💼 السنة الثالثة — تسيير واقتصاد" },
  { value: "arts_philo",        label: "🧠 السنة الثالثة — آداب وفلسفة" },
  { value: "arts_lang",         label: "🌐 السنة الثالثة — لغات أجنبية" },
];

// ─── مساعدات ──────────────────────────────────────────────────────────────────
function getTaskStatus(dateStr) {
  const today    = new Date(); today.setHours(0,0,0,0);
  const taskDate = new Date(dateStr); taskDate.setHours(0,0,0,0);
  if (taskDate < today) return "منتهية";
  if (taskDate.getTime() === today.getTime()) return "اليوم";
  return "قادمة";
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("ar-DZ", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function getLevelLabel(val) {
  return LEVELS.find(l => l.value === val)?.label || val;
}

// ─── الصفحة ───────────────────────────────────────────────────────────────────
export default function AdminTasksPage() {
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast,      setToast]      = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [deleting,   setDeleting]   = useState(null);

  // حقول النموذج
  const [taskType,    setTaskType]    = useState("qa");
  const [targetLevel, setTargetLevel] = useState("all");
  const [targetCount, setTargetCount] = useState(10);
  // حقول المهمة المجمّعة
  const [qaCount,       setQaCount]       = useState(5);
  const [lessonCount,   setLessonCount]   = useState(3);
  const [exerciseCount, setExerciseCount] = useState(2);
  const [points,      setPoints]      = useState(20);
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [description, setDescription] = useState("");

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const q    = query(collection(db, "dailyTasks"), orderBy("date", "asc"));
      const snap = await getDocs(q);
      const allTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // ✅ حذف المهام المنتهية تلقائياً
      const today = new Date(); today.setHours(0,0,0,0);
      const expired = allTasks.filter(t => {
        const d = new Date(t.date); d.setHours(0,0,0,0);
        return d < today;
      });
      if (expired.length > 0) {
        await Promise.all(expired.map(t => deleteDoc(doc(db, "dailyTasks", t.id))));
      }

      // عرض فقط المهام الحالية والقادمة
      setTasks(allTasks.filter(t => {
        const d = new Date(t.date); d.setHours(0,0,0,0);
        return d >= today;
      }));
    } catch { showToast("error", "فشل تحميل المهام"); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate) { showToast("error", "حدد تاريخ البداية"); return; }
    setSubmitting(true);
    try {
      const start = new Date(startDate);
      const end   = endDate ? new Date(endDate) : new Date(startDate);

      if (end < start) { showToast("error", "تاريخ النهاية يجب أن يكون بعد البداية"); setSubmitting(false); return; }

      const dates = [];
      const cur   = new Date(start);
      while (cur <= end) {
        dates.push(cur.toISOString().split("T")[0]);
        cur.setDate(cur.getDate() + 1);
      }

      const taskLabel = TASK_TYPES.find(t => t.value === taskType)?.label || "";
      for (const dateStr of dates) {
        await addDoc(collection(db, "dailyTasks"), {
          type:         taskType,
          targetLevel,
          // للمهمة المجمّعة نحفظ عدد كل نوع
          ...(taskType === "combined"
            ? { qaCount: Number(qaCount), lessonCount: Number(lessonCount), exerciseCount: Number(exerciseCount), targetCount: Number(qaCount) + Number(lessonCount) + Number(exerciseCount) }
            : { targetCount: Number(targetCount) }
          ),
          points:       Number(points),
          date:         dateStr,
          description:  description.trim() || taskLabel,
          createdAt:    serverTimestamp(),
        });
      }

      showToast("success", `تم إضافة ${dates.length} مهمة بنجاح ✅`);
      setShowForm(false);
      setStartDate(""); setEndDate(""); setDescription("");
      setTaskType("qa"); setTargetLevel("all"); setTargetCount(10);
      setQaCount(5); setLessonCount(3); setExerciseCount(2); setPoints(20);
      fetchTasks();
    } catch { showToast("error", "حدث خطأ أثناء الإضافة"); }
    finally  { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteDoc(doc(db, "dailyTasks", id));
      setTasks(prev => prev.filter(t => t.id !== id));
      showToast("success", "تم حذف المهمة");
    } catch { showToast("error", "فشل الحذف"); }
    finally  { setDeleting(null); }
  };

  const todayTasks    = tasks.filter(t => getTaskStatus(t.date) === "اليوم");
  const upcomingTasks = tasks.filter(t => getTaskStatus(t.date) === "قادمة");

  const daysCount = startDate && endDate
    ? Math.max(0, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000) + 1)
    : startDate ? 1 : 0;

  return (
    <div className="space-y-8" dir="rtl">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-bold text-white ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
            {toast.type === "success" ? <CheckCircle size={22}/> : <AlertCircle size={22}/>}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">المهام اليومية</h1>
          <p className="text-gray-500 mt-1">أضف مهام يومية لكل المستويات أو لمستوى محدد</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
          <Plus size={20}/> إضافة مهام
        </button>
      </div>

      {/* نموذج الإضافة */}
      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-6">

            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                <Target className="text-primary" size={22}/> إضافة مهام جديدة
              </h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-500">
                <X size={22}/>
              </button>
            </div>

            {/* نوع المهمة */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">نوع المهمة *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TASK_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => setTaskType(t.value)}
                    className={`p-4 rounded-2xl border-2 font-bold transition-all text-center ${
                      taskType === t.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary/40"
                    }`}>
                    <span className="text-2xl block mb-1">{t.icon}</span>
                    <span className="text-xs">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* المستوى المستهدف */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Users size={16} className="text-primary"/> المستوى المستهدف *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {LEVELS.map(l => (
                  <button key={l.value} type="button" onClick={() => setTargetLevel(l.value)}
                    className={`px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all text-center ${
                      targetLevel === l.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary/30"
                    }`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* العدد والنقاط والوصف */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* حقول المهمة العادية */}
              {taskType !== "combined" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">العدد المطلوب *</label>
                  <input type="number" min="1" max="100" value={targetCount}
                    onChange={e => setTargetCount(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 dark:text-gray-200 font-bold text-center text-lg"/>
                </div>
              )}

              {/* حقول المهمة المجمّعة */}
              {taskType === "combined" && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">❓ عدد أسئلة س.و.ج *</label>
                    <input type="number" min="0" max="50" value={qaCount}
                      onChange={e => setQaCount(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 dark:text-gray-200 font-bold text-center text-lg"/>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">📖 عدد الدروس *</label>
                    <input type="number" min="0" max="20" value={lessonCount}
                      onChange={e => setLessonCount(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 dark:text-gray-200 font-bold text-center text-lg"/>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">📝 عدد التمارين *</label>
                    <input type="number" min="0" max="20" value={exerciseCount}
                      onChange={e => setExerciseCount(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 dark:text-gray-200 font-bold text-center text-lg"/>
                  </div>
                  {/* إجمالي المجمّعة */}
                  <div className="md:col-span-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 text-sm text-primary font-bold">
                    المجموع: {Number(qaCount) + Number(lessonCount) + Number(exerciseCount)} عمل مطلوب
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">النقاط عند الإنهاء *</label>
                <div className="relative">
                  <input type="number" min="1" max="1000" value={points}
                    onChange={e => setPoints(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 dark:text-gray-200 font-bold text-center text-lg pl-20"/>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500 font-black flex items-center gap-1 text-sm">
                    <Star size={14} fill="currentColor"/> نقطة
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">وصف مخصص (اختياري)</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder={taskType === "combined" ? "مثال: أنهِ 5 أسئلة + 3 دروس + 2 تمارين" : "مثال: أجب على 10 أسئلة اليوم"}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 dark:text-gray-200"/>
              </div>
            </div>

            {/* التواريخ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">تاريخ البداية *</label>
                <input type="date" value={startDate}
                  onChange={e => { setStartDate(e.target.value); setEndDate(""); }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 dark:text-gray-200"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  تاريخ النهاية
                  <span className="text-gray-400 font-normal text-xs mr-2">(فارغ = يوم واحد)</span>
                </label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 dark:text-gray-200"/>
              </div>
            </div>

            {/* معاينة */}
            {daysCount > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
                <Calendar className="text-primary flex-shrink-0" size={20}/>
                <div>
                  <p className="font-bold text-primary">
                    سيتم إنشاء <span className="text-lg">{daysCount}</span> مهمة
                  </p>
                  <p className="text-sm text-gray-500">
                    للمستوى: <span className="font-bold text-gray-700 dark:text-gray-300">{getLevelLabel(targetLevel)}</span>
                    {" · "}
                    {taskType !== "login" ? `${targetCount} ${taskType === "qa" ? "سؤال" : taskType === "lesson" ? "درس" : "ملف"}` : "تسجيل دخول"}
                    {" مقابل "}{points} نقطة
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-black rounded-2xl hover:bg-primary-hover transition-all disabled:opacity-50">
                {submitting
                  ? <><Loader2 size={18} className="animate-spin"/> جاري الحفظ...</>
                  : <><Plus size={18}/> إضافة {daysCount > 1 ? `${daysCount} مهام` : "المهمة"}</>
                }
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* القائمة */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40}/></div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
          <Target className="mx-auto text-gray-300 mb-4" size={48}/>
          <p className="text-gray-500 font-bold text-xl">لا توجد مهام بعد</p>
          <p className="text-gray-400 text-sm mt-1">اضغط "إضافة مهام" للبدء</p>
        </div>
      ) : (
        <div className="space-y-6">
          {todayTasks.length > 0    && <TaskGroup title="مهام اليوم 🔥"    tasks={todayTasks}    colorClass="emerald" onDelete={handleDelete} deleting={deleting}/>}
          {upcomingTasks.length > 0 && <TaskGroup title="المهام القادمة 📅" tasks={upcomingTasks} colorClass="blue"    onDelete={handleDelete} deleting={deleting}/>}
          {todayTasks.length === 0 && upcomingTasks.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-bold">لا توجد مهام حالية أو قادمة</p>
              <p className="text-sm mt-1">أضف مهمة جديدة من الزر أعلاه</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── مجموعة مهام ──────────────────────────────────────────────────────────────
function TaskGroup({ title, tasks, colorClass, onDelete, deleting, collapsed = false }) {
  const [open, setOpen] = useState(!collapsed);
  const badge = { emerald: "bg-emerald-100 text-emerald-700", blue: "bg-blue-100 text-blue-700", gray: "bg-gray-100 text-gray-500" };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
      <button onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-black ${badge[colorClass]}`}>{tasks.length}</span>
          <h2 className="text-lg font-black text-gray-800 dark:text-white">{title}</h2>
        </div>
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}/>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0 }} animate={{ height:"auto" }} exit={{ height:0 }}
            className="overflow-hidden border-t border-gray-100 dark:border-gray-800">
            <div className="p-4 space-y-3">
              {tasks.map(task => <TaskCard key={task.id} task={task} onDelete={onDelete} deleting={deleting}/>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── بطاقة مهمة ───────────────────────────────────────────────────────────────
function TaskCard({ task, onDelete, deleting }) {
  const status     = getTaskStatus(task.date);
  const taskType   = TASK_TYPES.find(t => t.value === task.type);
  const levelLabel = getLevelLabel(task.targetLevel || "all");
  const statusColors = {
    "اليوم":  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "قادمة":  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "منتهية": "bg-gray-100 text-gray-500 dark:bg-gray-800",
  };

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-2xl flex-shrink-0">{taskType?.icon}</span>
        <div className="min-w-0">
          <p className="font-bold text-gray-800 dark:text-gray-200 truncate">{task.description}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar size={11}/> {formatDate(task.date)}
            </span>
            {task.targetCount > 1 && (
              <span className="text-xs text-gray-500 font-bold">× {task.targetCount}</span>
            )}
            <span className="flex items-center gap-1 text-xs font-black text-yellow-600">
              <Star size={11} fill="currentColor"/> {task.points} نقطة
            </span>
            {/* المستوى المستهدف */}
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
              {levelLabel}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`px-3 py-1 rounded-full text-xs font-black ${statusColors[status]}`}>{status}</span>
        <button onClick={() => onDelete(task.id)} disabled={deleting === task.id}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all disabled:opacity-50">
          {deleting === task.id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}
        </button>
      </div>
    </div>
  );
}