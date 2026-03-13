// src/app/dashboard/tasks/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Star, CheckCircle, Loader2, Trophy, Lock, AlertCircle, X } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useAuthStore } from "@/store/authStore";
import { useTaskStore } from "@/store/useTaskStore"; // ✅ ملف جديد — انظر التعليمات أدناه

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
        return specialty === "lang" ? "2sec_arts_lang" : "2sec_arts_philo";
      }
    }
    if (branch === "science_main" || branch === "science") {
      if (specialty === "tech")           return "science_tech";
      if (specialty === "تسيير واقتصاد") return "science_eco";
      if (specialty === "رياضيات")        return "science_math";
      return "science_exp";
    }
    if (branch === "arts_main" || branch === "arts") {
      return specialty === "lang" ? "arts_lang" : "arts_philo";
    }
  }
  return null;
}

function getTodayStr() { return new Date().toISOString().split("T")[0]; }

const TYPE_ICONS  = { qa: "❓", lesson: "📖", exercise: "📝", combined: "🎯" };
const TYPE_LABELS = { qa: "سؤال", lesson: "درس", exercise: "تمرين", combined: "مهمة مجمّعة" };

// ─── مغلّف يتتبع البطاقات المرئية ────────────────────────────────────────────
function AllTasksWrapper({ tasks, progMap, userId }) {
  const { isTaskClosed, countClosed, cleanOldTasks } = useTaskStore();

  // تنظيف المهام القديمة عند أول تحميل
  useEffect(() => {
    if (userId) cleanOldTasks(userId, tasks.map(t => t.id));
  }, [userId, tasks.length]);

  const closedCount = countClosed(userId, tasks.map(t => t.id));
  const allClosed   = tasks.length > 0 && closedCount >= tasks.length;

  if (allClosed) {
    return (
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
        <div className="text-6xl mb-4">🎉</div>
        <p className="text-emerald-500 font-black text-2xl">لقد أنهيت جميع مهامك اليوم!</p>
        <p className="text-gray-400 text-sm mt-2">أحسنت! تحقق غداً لمهام جديدة 🚀</p>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          initialProgress={progMap[task.id]}
          userId={userId}
        />
      ))}
    </AnimatePresence>
  );
}

// ─── بطاقة مهمة واحدة ────────────────────────────────────────────────────────
function TaskCard({ task, initialProgress, userId }) {
  const { isTaskClosed, closeTask } = useTaskStore();
  const [progress,  setProgress]  = useState(initialProgress || { count: 0, completed: false });
  const [rewarding, setRewarding] = useState(false);

  const hidden = isTaskClosed(userId, task.id);

  const done    = progress.completed === true;
  const target  = task.targetCount || 1;
  const count   = progress.count   || 0;
  const percent = Math.min(100, Math.round((count / target) * 100));

  // الاستماع فقط للأحداث الخاصة بهذه المهمة
  useEffect(() => {
    const onProgress = (e) => {
      if (e.detail.taskId !== task.id) return;
      setProgress(prev => ({ ...prev, ...e.detail }));
    };
    const onDone = (e) => {
      if (e.detail.taskId !== task.id) return;
      setRewarding(true);
      setTimeout(() => setRewarding(false), 3500);
    };
    window.addEventListener("taskProgress",  onProgress);
    window.addEventListener("taskCompleted", onDone);
    return () => {
      window.removeEventListener("taskProgress",  onProgress);
      window.removeEventListener("taskCompleted", onDone);
    };
  }, [task.id]);

  // ✅ إغلاق عبر Zustand persist — يبقى بعد الرفريش تلقائياً
  const handleClose = () => {
    closeTask(userId, task.id);
  };

  if (hidden) return null;

  return (
    <>
      <motion.div layout initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        exit={{ opacity:0, scale:0.95 }}
        className={`bg-white dark:bg-gray-900 rounded-3xl border-2 shadow-sm p-6 space-y-5 ${
          done ? "border-emerald-400" : "border-gray-100 dark:border-gray-800"
        }`}>

        {/* الرأس */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-4xl flex-shrink-0">{TYPE_ICONS[task.type] || "🎯"}</span>
            <div className="min-w-0">
              <p className="font-black text-gray-800 dark:text-white text-lg truncate">{task.description}</p>
              <p className="text-sm text-gray-400">
                {task.type === "combined"
                  ? `${task.qaCount||0} س.و.ج + ${task.lessonCount||0} درس + ${task.exerciseCount||0} تمرين`
                  : `${target} ${TYPE_LABELS[task.type] || ""}`
                }
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-3 flex-shrink-0">
            <Star className="text-yellow-500" size={20} fill="currentColor"/>
            <p className="font-black text-yellow-700 dark:text-yellow-400 text-lg leading-none mt-1">{task.points}</p>
            <p className="text-xs text-yellow-600">نقطة</p>
          </div>
        </div>

        {/* شريط تقدم المهمة العادية */}
        {task.type !== "combined" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-gray-600 dark:text-gray-400">التقدم</span>
              <span className={done ? "text-emerald-600" : "text-primary"}>{count} / {target}</span>
            </div>
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div className={`h-full rounded-full ${done ? "bg-emerald-500" : "bg-primary"}`}
                initial={{ width: 0 }} animate={{ width: `${percent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}/>
            </div>
            <p className="text-xs text-gray-400 text-center">{percent}% مكتمل</p>
          </div>
        )}

        {/* تقدم المهمة المجمّعة */}
        {task.type === "combined" && (
          <div className="space-y-3">
            {[
              { key: "qa",       icon: "❓", label: "سؤال وجواب", count: progress.qaCount||0,       target: task.qaCount||0 },
              { key: "lesson",   icon: "📖", label: "دروس",        count: progress.lessonCount||0,   target: task.lessonCount||0 },
              { key: "exercise", icon: "📝", label: "تمارين",      count: progress.exerciseCount||0, target: task.exerciseCount||0 },
            ].map(item => {
              const p      = Math.min(100, Math.round((item.count / Math.max(item.target, 1)) * 100));
              const isDone = item.count >= item.target;
              return (
                <div key={item.key}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-500">{item.icon} {item.label}</span>
                    <span className={isDone ? "text-emerald-600" : "text-primary"}>{item.count} / {item.target}</span>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div className={`h-full rounded-full ${isDone ? "bg-emerald-500" : "bg-primary"}`}
                      initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 0.5 }}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* الحالة */}
        {done ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-emerald-500 flex-shrink-0" size={26}/>
              <div>
                <p className="font-black text-emerald-700 dark:text-emerald-400">أحسنت! أنهيت هذه المهمة ✅</p>
                <p className="text-sm text-emerald-600">حصلت على {task.points} نقطة</p>
              </div>
            </div>
            <button onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all">
              <X size={16}/> إغلاق
            </button>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 space-y-2">
            <p className="text-sm font-black text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <AlertCircle size={16}/> كيف تنهي المهمة؟
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {task.type === "qa"
                ? `روح لموادي الدراسية ← اختر مادة ← سؤال وجواب ← أجب على ${target} سؤال.`
                : task.type === "lesson"
                ? `افتح ${target} درس من أي مادة في موادك الدراسية.`
                : task.type === "exercise"
                ? `افتح ${target} تمرين من أي مادة في موادك الدراسية.`
                : `أنهِ ${task.qaCount||0} س.و.ج + ${task.lessonCount||0} درس + ${task.exerciseCount||0} تمرين.`
              }
            </p>
            <p className="text-xs text-gray-400">✅ التقدم يُحسب تلقائياً</p>
          </div>
        )}
      </motion.div>

      {/* احتفال */}
      <AnimatePresence>
        {rewarding && (
          <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.8 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setRewarding(false)}>
            <motion.div animate={{ y:[0,-10,0] }} transition={{ repeat:Infinity, duration:1.5 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-10 text-center shadow-2xl">
              <Trophy className="mx-auto text-yellow-500 mb-4" size={56}/>
              <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-2">🎉 أحسنت!</h2>
              <p className="text-gray-500 mb-4">أنهيت المهمة</p>
              <div className="flex items-center justify-center gap-2 text-4xl font-black text-yellow-600">
                <Star size={32} fill="currentColor" className="text-yellow-500"/>
                +{task.points} نقطة
              </div>
              <p className="text-xs text-gray-400 mt-4">اضغط للإغلاق</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function DailyTasksPage() {
  const user      = useAuthStore((s) => s.user);
  const [tasks,   setTasks]   = useState([]);
  const [progMap, setProgMap] = useState({});
  const [loading, setLoading] = useState(true);

  const today     = getTodayStr();
  const userLevel = getUserLevel(user);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "dailyTasks"), where("date", "==", today))
      );
      if (snap.empty) { setTasks([]); setLoading(false); return; }

      const allTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // ✅ عرض كل المهام المناسبة (مستواه + جميع المستويات)
      const suitable = allTasks.filter(t =>
        !t.targetLevel || t.targetLevel === "all" || t.targetLevel === userLevel
      );
      setTasks(suitable);

      // ✅ key = userId_date_taskId لتجنب تعارض المهام القديمة
      const map = {};
      await Promise.all(suitable.map(async (task) => {
        try {
          const pSnap = await getDoc(doc(db, "taskProgress", `${user.id}_${today}_${task.id}`));
          map[task.id] = pSnap.exists() ? pSnap.data() : { count: 0, completed: false };
        } catch {
          map[task.id] = { count: 0, completed: false };
        }
      }));
      setProgMap(map);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [user?.id, today, userLevel]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40}/>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6" dir="rtl">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
          <Target className="text-primary" size={34}/>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">مهام اليوم</h1>
        <p className="text-gray-500 mt-1">
          {tasks.length > 0
            ? `لديك ${tasks.length} مهمة اليوم — أنهِها واكسب نقاطك!`
            : "أنهِ مهام اليوم واكسب نقاطك!"
          }
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
          <Lock className="mx-auto text-gray-300 mb-4" size={48}/>
          <p className="text-gray-500 font-bold text-xl">لا توجد مهام اليوم</p>
          <p className="text-gray-400 text-sm mt-2">تحقق غداً 🚀</p>
        </div>
      ) : (
        <AllTasksWrapper tasks={tasks} progMap={progMap} userId={user?.id}/>
      )}
    </div>
  );
}