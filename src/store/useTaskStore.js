// src/store/useTaskStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * يخزّن معرّفات المهام التي أغلقها المستخدم
 * closedTasks: { [userId]: Set<taskId> }
 * نستخدم persist لحفظها في localStorage تلقائياً
 */
export const useTaskStore = create(
  persist(
    (set, get) => ({
      // { userId: [taskId, taskId, ...] }
      closedTasks: {},

      // إغلاق مهمة لمستخدم معين
      closeTask: (userId, taskId) => {
        const prev = get().closedTasks[userId] || [];
        if (prev.includes(taskId)) return; // مغلقة مسبقاً
        set({
          closedTasks: {
            ...get().closedTasks,
            [userId]: [...prev, taskId],
          },
        });
      },

      // هل المهمة مغلقة لهذا المستخدم؟
      isTaskClosed: (userId, taskId) => {
        if (!userId || !taskId) return false;
        return (get().closedTasks[userId] || []).includes(taskId);
      },

      // عدد المهام المغلقة لمستخدم معين من قائمة محددة
      countClosed: (userId, taskIds) => {
        const closed = get().closedTasks[userId] || [];
        return taskIds.filter(id => closed.includes(id)).length;
      },

      // تنظيف المهام القديمة (اختياري — يُستدعى عند تحميل الصفحة)
      cleanOldTasks: (userId, validTaskIds) => {
        const closed = get().closedTasks[userId] || [];
        const cleaned = closed.filter(id => validTaskIds.includes(id));
        set({
          closedTasks: {
            ...get().closedTasks,
            [userId]: cleaned,
          },
        });
      },
    }),
    {
      name: "dz-task-store", // مفتاح localStorage
    }
  )
);