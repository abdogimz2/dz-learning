// src/store/useFlashcardProgressStore.js
// ✅ مخزّن في Firestore (مربوط بالحساب) بدل localStorage — يشتغل من أي جهاز/متصفح
import { create } from "zustand";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

/**
 * يحفظ تقدم جلسات سؤال وجواب لكل مستخدم وكل مجموعة بطاقات.
 *
 * معرف المستند في Firestore: `${userId}__${sessionKey}`
 *
 * - قبل فتح الجلسة   → استدعِ loadProgress() (async) لجلب الرقم المحفوظ من Firestore
 * - عند تغيّر البطاقة → saveProgress() تحفظ محلياً فوراً + Firestore في الخلفية
 * - عند الإنهاء       → clearProgress() تمسح التقدم ليبدأ من الصفر المرة القادمة
 */

const COLLECTION_NAME = "flashcardProgress";
const keyOf = (userId, sessionKey) => `${userId}__${sessionKey}`;

export const useFlashcardProgressStore = create((set, get) => ({
  // { "userId__sessionKey": currentIndex } — كاش محلي بعد الجلب من Firestore
  progress: {},

  /** يجيب التقدم المحفوظ من Firestore ويرجعه — استعملها قبل فتح الجلسة */
  loadProgress: async (userId, sessionKey) => {
    if (!userId || !sessionKey) return 0;
    const key = keyOf(userId, sessionKey);
    if (key in get().progress) return get().progress[key];
    try {
      const snap  = await getDoc(doc(db, COLLECTION_NAME, key));
      const value = snap.exists() ? (snap.data().currentIndex ?? 0) : 0;
      set((state) => ({ progress: { ...state.progress, [key]: value } }));
      return value;
    } catch (e) {
      console.error("❌ خطأ في جلب تقدم الأسئلة:", e);
      return 0;
    }
  },

  /** اقرأ الرقم من الكاش المحلي (استعملها بعد loadProgress، يرجع 0 إذا غير محمّل) */
  getProgress: (userId, sessionKey) => {
    if (!userId || !sessionKey) return 0;
    return get().progress[keyOf(userId, sessionKey)] ?? 0;
  },

  /** احفظ الرقم الحالي — محلياً فوراً، و Firestore في الخلفية */
  saveProgress: (userId, sessionKey, currentIndex) => {
    if (!userId || !sessionKey) return;
    const key = keyOf(userId, sessionKey);
    set((state) => ({ progress: { ...state.progress, [key]: currentIndex } }));
    setDoc(doc(db, COLLECTION_NAME, key), {
      userId, sessionKey, currentIndex, updatedAt: serverTimestamp(),
    }).catch((e) => console.error("❌ خطأ في حفظ تقدم الأسئلة:", e));
  },

  /** امسح التقدم عند الإنهاء أو الإعادة */
  clearProgress: (userId, sessionKey) => {
    if (!userId || !sessionKey) return;
    const key = keyOf(userId, sessionKey);
    set((state) => {
      const updated = { ...state.progress };
      delete updated[key];
      return { progress: updated };
    });
    deleteDoc(doc(db, COLLECTION_NAME, key))
      .catch((e) => console.error("❌ خطأ في مسح تقدم الأسئلة:", e));
  },
}));