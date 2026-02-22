// src/components/FlashcardSession.jsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle, Eye, RotateCcw, X, Trophy, Star,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const RATING_POINTS = {
  easy:  10,
  good:   7,
  hard:   3,
  again:  0,
};

export default function FlashcardSession({ cards, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped,      setFlipped]      = useState(false);
  const [results,      setResults]      = useState([]);
  const [finished,     setFinished]     = useState(false);
  const [totalEarned,  setTotalEarned]  = useState(0);

  const user    = useAuthStore((state) => state.user);
  const current = cards[currentIndex];
  const total   = cards.length;
  const progress = (currentIndex / total) * 100;

  const handleRating = async (rating) => {
    const pts = RATING_POINTS[rating] || 0;

    // ✅ إضافة النقاط
    if (pts > 0 && user?.id) {
      try {
        const { addPoints } = await import("@/lib/points");
        await addPoints(user.id, `flashcard_${rating}`);
        setTotalEarned((prev) => prev + pts);
      } catch (err) {
        console.error("خطأ في النقاط:", err);
      }
    }

    setResults((prev) => [...prev, { cardId: current.id, rating, pts }]);

    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      setFlipped(false);
      setTimeout(() => setCurrentIndex((i) => i + 1), 300);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setResults([]);
    setFinished(false);
    setTotalEarned(0);
  };

  // ─── شاشة النتائج ─────────────────────────────────────────────────────────
  if (finished) {
    const easy  = results.filter((r) => r.rating === "easy").length;
    const good  = results.filter((r) => r.rating === "good").length;
    const hard  = results.filter((r) => r.rating === "hard").length;
    const again = results.filter((r) => r.rating === "again").length;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        dir="rtl"
      >
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="text-primary" size={40} />
          </div>

          <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">
            انتهت الجلسة! 🎉
          </h2>
          <p className="text-gray-500 mb-4">لقد أجبت على {total} سؤال</p>

          {/* النقاط المكتسبة */}
          {totalEarned > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4 mb-6 flex items-center justify-center gap-2">
              <Star className="text-yellow-500" size={22} fill="currentColor" />
              <p className="font-black text-yellow-700 dark:text-yellow-400 text-xl">
                +{totalEarned} نقطة مكتسبة!
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { label: "سهل",       count: easy,  color: "emerald", pts: easy  * 10 },
              { label: "جيد",       count: good,  color: "blue",    pts: good  * 7  },
              { label: "صعب",       count: hard,  color: "orange",  pts: hard  * 3  },
              { label: "مرة أخرى", count: again, color: "red",     pts: 0          },
            ].map((r) => (
              <div
                key={r.label}
                className={`p-4 rounded-2xl bg-${r.color}-50 dark:bg-${r.color}-900/20 border border-${r.color}-200 dark:border-${r.color}-800`}
              >
                <p className={`text-2xl font-black text-${r.color}-600 dark:text-${r.color}-400`}>
                  {r.count}
                </p>
                <p className={`text-sm font-bold text-${r.color}-600 dark:text-${r.color}-400`}>
                  {r.label}
                </p>
                {r.pts > 0 && (
                  <p className={`text-xs text-${r.color}-400 mt-1`}>+{r.pts} نقطة</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={restart}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-hover transition-all"
            >
              <RotateCcw size={18} /> إعادة
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              إغلاق
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── الـ Flashcard ─────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="text-orange-500" size={22} />
            <span className="font-black text-gray-800 dark:text-white">سؤال وجواب</span>
          </div>
          <div className="flex items-center gap-3">
            {totalEarned > 0 && (
              <span className="flex items-center gap-1 text-sm font-black text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full">
                <Star size={13} fill="currentColor" className="text-yellow-500" />
                +{totalEarned}
              </span>
            )}
            <span className="text-sm font-bold text-gray-500">
              {currentIndex + 1} / {total}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 dark:bg-gray-800">
          <motion.div
            className="h-full bg-orange-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Card */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIndex}-${flipped}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className={`min-h-48 rounded-2xl p-6 flex flex-col items-center justify-center text-center ${
                flipped
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800"
                  : "bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800"
              }`}
            >
              {!flipped ? (
                <>
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">السؤال</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200 leading-relaxed">
                    {current.title}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4">الإجابة</p>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                    {current.description}
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* أزرار */}
          <div className="mt-5 space-y-3">
            {!flipped ? (
              <button
                onClick={() => setFlipped(true)}
                className="w-full py-3.5 bg-orange-500 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 dark:shadow-orange-900/20"
              >
                <Eye size={20} /> إظهار الإجابة
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "مرة أخرى", rating: "again", color: "red",     pts: 0  },
                  { label: "صعب",       rating: "hard",  color: "orange",  pts: 3  },
                  { label: "جيد",       rating: "good",  color: "blue",    pts: 7  },
                  { label: "سهل",       rating: "easy",  color: "emerald", pts: 10 },
                ].map((btn) => (
                  <button
                    key={btn.rating}
                    onClick={() => handleRating(btn.rating)}
                    className={`py-3 rounded-2xl font-black text-sm border-2 transition-all hover:scale-105 active:scale-95
                      border-${btn.color}-400 text-${btn.color}-600 dark:text-${btn.color}-400
                      hover:bg-${btn.color}-50 dark:hover:bg-${btn.color}-900/20`}
                  >
                    {btn.label}
                    {btn.pts > 0 && (
                      <span className="block text-[10px] opacity-70 mt-0.5">+{btn.pts} نقطة</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}