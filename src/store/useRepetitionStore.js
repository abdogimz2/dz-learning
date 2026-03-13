// src/store/useRepetitionStore.js
// نظام التكرار المتباعد — يحفظ الأسئلة الصعبة ويُذكّر بها
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useRepetitionStore = create(
  persist(
    (set, get) => ({
      // قائمة الأسئلة المجدولة
      // { id, userId, question, answer, qaType, questionImageUrl, answerImageUrl,
      //   subjectId, subjectName, dueDate (ISO string), snoozedUntil (ISO string | null) }
      scheduledCards: [],

      // ✅ جدولة سؤال صعب بعد N أيام
      scheduleCard: (card) => {
        const existing = get().scheduledCards.find(
          c => c.id === card.id && c.userId === card.userId
        );
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3);

        if (existing) {
          // تحديث الموعد إذا كان موجوداً
          set({
            scheduledCards: get().scheduledCards.map(c =>
              c.id === card.id && c.userId === card.userId
                ? { ...c, dueDate: dueDate.toISOString(), snoozedUntil: null }
                : c
            ),
          });
        } else {
          set({
            scheduledCards: [
              ...get().scheduledCards,
              { ...card, dueDate: dueDate.toISOString(), snoozedUntil: null },
            ],
          });
        }
      },

      // ✅ تأجيل السؤال ليوم إضافي ("لاحقاً")
      snoozeCard: (cardId, userId) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        set({
          scheduledCards: get().scheduledCards.map(c =>
            c.id === cardId && c.userId === userId
              ? { ...c, snoozedUntil: tomorrow.toISOString() }
              : c
          ),
        });
      },

      // ✅ حذف السؤال من الجدول (بعد "موافق" أو إتقانه)
      removeCard: (cardId, userId) => {
        set({
          scheduledCards: get().scheduledCards.filter(
            c => !(c.id === cardId && c.userId === userId)
          ),
        });
      },

      // ✅ جلب الأسئلة المستحقة الآن لمستخدم معين
      getDueCards: (userId) => {
        const now = new Date();
        return get().scheduledCards.filter(c => {
          if (c.userId !== userId) return false;
          const due     = new Date(c.dueDate);
          const snoozed = c.snoozedUntil ? new Date(c.snoozedUntil) : null;
          if (now < due)               return false; // لم يحن الموعد
          if (snoozed && now < snoozed) return false; // مؤجّل
          return true;
        });
      },
    }),
    {
      name: "dz-repetition-store",
    }
  )
);