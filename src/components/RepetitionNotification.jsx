// src/components/RepetitionNotification.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence }      from "framer-motion";
import { useRouter }                    from "next/navigation";
import {
  Brain, Clock, CheckCircle, X,
  ChevronLeft, ChevronRight, Bell,
} from "lucide-react";
import { useAuthStore }       from "@/store/authStore";
import { useRepetitionStore } from "@/store/useRepetitionStore";

export default function RepetitionNotification() {
  const router  = useRouter();
  const user    = useAuthStore(s => s.user);
  const { getDueCards, snoozeCard, removeCard } = useRepetitionStore();

  const [dueCards,  setDueCards]  = useState([]);
  const [open,      setOpen]      = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped,   setFlipped]   = useState(false);
  const dropdownRef               = useRef(null);

  // تحميل الأسئلة + فتح تلقائي
  useEffect(() => {
    if (!user?.id) return;
    const due = getDueCards(user.id);
    setDueCards(due);
    if (due.length > 0) setTimeout(() => setOpen(true), 1200);
  }, [user?.id]);

  // إغلاق عند الضغط خارج الـ dropdown
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        const bell = document.getElementById("bell-btn");
        if (bell && bell.contains(e.target)) return;
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // كشف toggle للجرس
  useEffect(() => {
    window.__toggleBellNotification = () => {
      const due = getDueCards(user?.id);
      setDueCards(due);
      setCardIndex(0);
      setFlipped(false);
      setOpen(prev => !prev);
    };
    return () => { delete window.__toggleBellNotification; };
  }, [user?.id]);

  const card  = dueCards[cardIndex];
  const total = dueCards.length;

  // موافق — ينقل مباشرة للسؤال
  const handleAccept = () => {
    if (!card) return;
    removeCard(card.id, user.id);
    setOpen(false);
    router.push(
      `/dashboard/courses/${encodeURIComponent(card.subjectId || "")}?review=${card.id}&autoopen=true`
    );
  };

  // لاحقاً — تأجيل يوم
  const handleSnooze = () => {
    if (!card) return;
    snoozeCard(card.id, user.id);
    const remaining = dueCards.filter(c => c.id !== card.id);
    setDueCards(remaining);
    if (remaining.length === 0) { setOpen(false); return; }
    setCardIndex(Math.min(cardIndex, remaining.length - 1));
    setFlipped(false);
  };

  const goNext = () => { if (cardIndex < total-1) { setCardIndex(i=>i+1); setFlipped(false); } };
  const goPrev = () => { if (cardIndex > 0)        { setCardIndex(i=>i-1); setFlipped(false); } };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y:  0, scale: 1    }}
          exit={{    opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className="fixed top-20 left-4 md:left-64 z-50 w-[340px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          dir="rtl"
        >
          {/* رأس */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Bell size={17} className="text-primary"/>
              <span className="font-black text-gray-800 dark:text-white text-sm">الإشعارات</span>
              {total > 0 && (
                <span className="bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                  {total}
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              <X size={15} className="text-gray-500"/>
            </button>
          </div>

          {/* لا توجد إشعارات */}
          {total === 0 && (
            <div className="py-10 text-center text-gray-400">
              <Bell size={30} className="mx-auto mb-2 opacity-30"/>
              <p className="font-bold text-sm">لا توجد إشعارات</p>
              <p className="text-xs mt-1">ستظهر هنا تذكيرات المراجعة</p>
            </div>
          )}

          {/* البطاقة */}
          {total > 0 && card && (
            <div className="p-4 space-y-3">

              {/* شريط المادة + تنقل */}
              <div className="flex items-center gap-2 bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3">
                <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Brain size={17} className="text-violet-600"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-xs text-violet-700 dark:text-violet-300">وقت المراجعة! 🧠</p>
                  <p className="text-[11px] text-violet-500 truncate">
                    {card.subjectName || "سؤال وجواب"} · حدّدته صعباً قبل 3 أيام
                  </p>
                </div>
                {total > 1 && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={goPrev} disabled={cardIndex===0}
                      className="p-1 rounded-lg hover:bg-violet-100 disabled:opacity-30">
                      <ChevronRight size={13} className="text-violet-500"/>
                    </button>
                    <span className="text-[11px] text-violet-500 font-bold">{cardIndex+1}/{total}</span>
                    <button onClick={goNext} disabled={cardIndex===total-1}
                      className="p-1 rounded-lg hover:bg-violet-100 disabled:opacity-30">
                      <ChevronLeft size={13} className="text-violet-500"/>
                    </button>
                  </div>
                )}
              </div>

              {/* السؤال/الجواب */}
              <div
                onClick={() => setFlipped(f => !f)}
                className={`min-h-[72px] rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 ${
                  flipped
                    ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800"
                    : "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800"
                }`}
              >
                {!flipped ? (
                  <>
                    <p className="text-[10px] font-bold text-orange-500 mb-1.5">❓ اضغط لرؤية الجواب</p>
                    {card.qaType === "image" && card.questionImageUrl
                      ? <img src={card.questionImageUrl} alt="" className="max-h-16 object-contain rounded-lg"/>
                      : <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-relaxed">
                          {card.question || card.title}
                        </p>
                    }
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-bold text-emerald-500 mb-1.5">💡 الجواب</p>
                    {card.qaType === "image" && card.answerImageUrl
                      ? <img src={card.answerImageUrl} alt="" className="max-h-16 object-contain rounded-lg"/>
                      : <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {card.answer || card.description}
                        </p>
                    }
                  </>
                )}
              </div>

              {/* أزرار */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleSnooze}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-xs">
                  <Clock size={13}/> لاحقاً (غداً)
                </button>
                <button onClick={handleAccept}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-all text-xs shadow-md shadow-primary/20">
                  <CheckCircle size={13}/> مراجعة الآن
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}