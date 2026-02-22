// src/lib/points.js
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";

export const POINTS = {
  flashcard_easy:  10,
  flashcard_good:   7,
  flashcard_hard:   3,
  flashcard_again:  0,
  open_lesson:      2,
  download_file:    1,
  complete_exam:   15,
};

export async function addPoints(userId, action) {
  const pts = POINTS[action];
  if (!pts || pts === 0) return 0;

  try {
    // تحديث نقاط المستخدم مباشرة
    await updateDoc(doc(db, "users", userId), {
      points: increment(pts),
      updatedAt: serverTimestamp(),
    });

    // تحديث Zustand
    const { useAuthStore } = await import("@/store/authStore");
    useAuthStore.setState((state) => ({
      user: {
        ...state.user,
        points: (state.user?.points || 0) + pts,
      },
    }));

    return pts;
  } catch (err) {
    console.error("خطأ في النقاط:", err);
    return 0;
  }
}