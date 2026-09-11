// src/store/useRepetitionStore.js
// نظام التكرار المتباعد — يحفظ الأسئلة الصعبة ويُذكّر بها
// ✅ مخزّن في Firestore (مربوط بالحساب) بدل localStorage — يشتغل من أي جهاز/متصفح
import { create } from "zustand";
import { db } from "@/lib/firebase/config";
import {
  collection, doc, getDocs, query, where,
  setDoc, updateDoc, deleteDoc, serverTimestamp,
} from "firebase/firestore";

const COLLECTION_NAME = "repetitionCards";
const docId = (userId, cardId) => `${userId}_${cardId}`;

export const useRepetitionStore = create((set, get) => ({
  // قائمة الأسئلة المجدولة (كاش محلي مرآة لـ Firestore بعد hydrate)
  scheduledCards: [],
  hydratedForUserId: null,

  // ✅ يجيب كل البطاقات المجدولة للمستخدم من Firestore — استدعيها عند تسجيل الدخول
  hydrate: async (userId) => {
    if (!userId) return;
    if (get().hydratedForUserId === userId) return; // تفادي إعادة الجلب لنفس المستخدم
    try {
      const q = query(collection(db, COLLECTION_NAME), where("userId", "==", userId));
      const snap = await getDocs(q);
      set({
        scheduledCards: snap.docs.map((d) => d.data()),
        hydratedForUserId: userId,
      });
    } catch (e) {
      console.error("❌ خطأ في جلب الأسئلة المجدولة:", e);
    }
  },

  // ✅ جدولة سؤال صعب بعد 3 أيام
  scheduleCard: async (card) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const id   = docId(card.userId, card.id);
    const data = { ...card, dueDate: dueDate.toISOString(), snoozedUntil: null };

    // تحديث محلي فوري (متفائل) لتحديث الواجهة بدون انتظار الشبكة
    set((state) => {
      const exists = state.scheduledCards.some(c => c.id === card.id && c.userId === card.userId);
      return {
        scheduledCards: exists
          ? state.scheduledCards.map(c => (c.id === card.id && c.userId === card.userId) ? { ...c, ...data } : c)
          : [...state.scheduledCards, data],
      };
    });

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), { ...data, updatedAt: serverTimestamp() });
    } catch (e) {
      console.error("❌ خطأ في حفظ السؤال المجدول:", e);
    }
  },

  // ✅ تأجيل السؤال ليوم إضافي ("لاحقاً")
  snoozeCard: async (cardId, userId) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const snoozedUntil = tomorrow.toISOString();
    const id = docId(userId, cardId);

    set((state) => ({
      scheduledCards: state.scheduledCards.map(c =>
        (c.id === cardId && c.userId === userId) ? { ...c, snoozedUntil } : c
      ),
    }));

    try {
      await updateDoc(doc(db, COLLECTION_NAME, id), { snoozedUntil });
    } catch (e) {
      console.error("❌ خطأ في تأجيل السؤال:", e);
    }
  },

  // ✅ حذف السؤال من الجدول (بعد "موافق" أو إتقانه)
  removeCard: async (cardId, userId) => {
    const id = docId(userId, cardId);

    set((state) => ({
      scheduledCards: state.scheduledCards.filter(c => !(c.id === cardId && c.userId === userId)),
    }));

    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (e) {
      console.error("❌ خطأ في حذف السؤال المجدول:", e);
    }
  },

  // ✅ جلب الأسئلة المستحقة الآن لمستخدم معين (من الكاش المحلي المحدّث)
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
}));