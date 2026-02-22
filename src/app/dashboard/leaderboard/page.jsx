// src/app/dashboard/leaderboard/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Loader2, Users } from "lucide-react";
import { db } from "@/lib/firebase/config";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { useAuthStore } from "@/store/authStore";

const LEVEL_LABELS = {
  middle:        "المتوسط",
  "1sec_science":"سنة 1 — علوم",
  "1sec_arts":   "سنة 1 — آداب",
  science_exp:   "علوم تجريبية",
  science_math:  "رياضيات",
  science_tech:  "تقني رياضي",
  science_eco:   "تسيير واقتصاد",
  arts_philo:    "آداب وفلسفة",
  arts_lang:     "لغات أجنبية",
};

export default function LeaderboardPage() {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        // ✅ query بسيط بدون where — فقط orderBy و limit
        const q    = query(
          collection(db, "users"),
          orderBy("points", "desc"),
          limit(50)
        );
        const snap = await getDocs(q);
        const all  = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.role !== "admin" && u.status === "active"); // فلتر في الكود

        setStudents(all);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const myRank = students.findIndex((s) => s.id === user?.id) + 1;
  const top3   = students.slice(0, 3);
  const rest   = students.slice(3);

  return (
    <div className="space-y-8 max-w-3xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl mb-4">
          <Trophy className="text-yellow-500" size={36} />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">لوحة المتصدرين</h1>
        <p className="text-gray-500 mt-2">تنافس مع زملائك واحصل على أعلى النقاط</p>
      </div>

      {/* ترتيبك */}
      {user && (
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">ترتيبك الحالي</p>
            <p className="text-3xl font-black">{myRank > 0 ? `#${myRank}` : "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">نقاطك</p>
            <p className="text-3xl font-black flex items-center gap-2">
              <Star size={22} fill="currentColor" />
              {(user.points || 0).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* خطأ */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-red-600 dark:text-red-400 text-sm font-bold text-center">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <Users className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-bold">لا يوجد طلاب بعد</p>
        </div>
      ) : (
        <>
          {/* البوديوم */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-4 py-4">

              {/* المركز 2 */}
              {top3[1] && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">🥈</span>
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-black text-xl border-4 border-gray-300">
                    {top3[1].photoURL
                      ? <img src={top3[1].photoURL} className="w-full h-full rounded-full object-cover" />
                      : top3[1].name?.[0]
                    }
                  </div>
                  <p className="font-bold text-sm text-center max-w-[70px] truncate dark:text-gray-200">{top3[1].name}</p>
                  <div className="bg-gray-200 dark:bg-gray-700 h-16 w-20 rounded-t-2xl flex items-center justify-center">
                    <p className="font-black text-gray-700 dark:text-gray-300 text-sm">{(top3[1].points||0).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* المركز 1 */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">🥇</span>
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white font-black text-2xl border-4 border-yellow-400 shadow-lg shadow-yellow-200">
                  {top3[0].photoURL
                    ? <img src={top3[0].photoURL} className="w-full h-full rounded-full object-cover" />
                    : top3[0].name?.[0]
                  }
                </div>
                <p className="font-black text-center max-w-[90px] truncate dark:text-gray-200">{top3[0].name}</p>
                <div className="bg-yellow-400 h-24 w-24 rounded-t-2xl flex items-center justify-center shadow-lg shadow-yellow-200">
                  <p className="font-black text-white">{(top3[0].points||0).toLocaleString()}</p>
                </div>
              </div>

              {/* المركز 3 */}
              {top3[2] && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">🥉</span>
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full flex items-center justify-center text-white font-black text-xl border-4 border-orange-400">
                    {top3[2].photoURL
                      ? <img src={top3[2].photoURL} className="w-full h-full rounded-full object-cover" />
                      : top3[2].name?.[0]
                    }
                  </div>
                  <p className="font-bold text-sm text-center max-w-[70px] truncate dark:text-gray-200">{top3[2].name}</p>
                  <div className="bg-orange-200 dark:bg-orange-900/40 h-10 w-20 rounded-t-2xl flex items-center justify-center">
                    <p className="font-black text-orange-700 dark:text-orange-400 text-sm">{(top3[2].points||0).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* باقي القائمة */}
          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((s, i) => {
                const isMe = s.id === user?.id;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      isMe
                        ? "bg-primary/5 border-primary/30"
                        : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                    }`}
                  >
                    <span className="w-8 text-center font-black text-gray-400">#{i + 4}</span>
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {s.photoURL
                        ? <img src={s.photoURL} className="w-full h-full rounded-full object-cover" />
                        : s.name?.[0]
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate ${isMe ? "text-primary" : "dark:text-gray-200"}`}>
                        {s.name} {s.surname}
                        {isMe && <span className="text-xs mr-2 bg-primary text-white px-2 py-0.5 rounded-full">أنت</span>}
                      </p>
                      <p className="text-xs text-gray-400">{LEVEL_LABELS[s.level] || s.level}</p>
                    </div>
                    <div className="flex items-center gap-1 font-black text-gray-700 dark:text-gray-300">
                      <Star size={15} className="text-yellow-500" fill="currentColor" />
                      {(s.points || 0).toLocaleString()}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}