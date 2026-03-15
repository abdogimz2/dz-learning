// src/store/useFlashcardProgressStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * يحفظ تقدم جلسات سؤال وجواب لكل مستخدم وكل مجموعة بطاقات.
 *
 * مفتاح التخزين: `${userId}__${sessionKey}`
 * القيمة: رقم البطاقة الحالية (0-based index)
 *
 * - عند فتح الجلسة  → نقرأ الرقم المحفوظ ونبدأ منه
 * - عند إغلاق/توقف → نحفظ الرقم الحالي تلقائياً
 * - عند الإنهاء     → نمسح التقدم ليبدأ من الصفر المرة القادمة
 */

export const useFlashcardProgressStore = create(
  persist(
    (set, get) => ({
      // { "userId__sessionKey": currentIndex }
      progress: {},

      /** احفظ الرقم الحالي */
      saveProgress: (userId, sessionKey, currentIndex) => {
        if (!userId || !sessionKey) return;
        const key = `${userId}__${sessionKey}`;
        set((state) => ({
          progress: { ...state.progress, [key]: currentIndex },
        }));
      },

      /** اقرأ الرقم المحفوظ (يرجع 0 إذا لم يكن هناك شيء) */
      getProgress: (userId, sessionKey) => {
        if (!userId || !sessionKey) return 0;
        const key = `${userId}__${sessionKey}`;
        return get().progress[key] ?? 0;
      },

      /** امسح التقدم عند الإنهاء أو الإعادة */
      clearProgress: (userId, sessionKey) => {
        if (!userId || !sessionKey) return;
        const key = `${userId}__${sessionKey}`;
        set((state) => {
          const updated = { ...state.progress };
          delete updated[key];
          return { progress: updated };
        });
      },
    }),
    {
      name: "flashcard-progress", // اسم المفتاح في localStorage
    }
  )
);