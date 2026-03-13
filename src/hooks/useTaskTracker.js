// src/hooks/useTaskTracker.js
"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { db } from "@/lib/firebase/config";
import {
  collection, query, where, getDocs,
  doc, getDoc, setDoc, updateDoc, increment,
} from "firebase/firestore";

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

export function useTaskTracker() {
  const user    = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // tasksRef: مصفوفة كل مهام اليوم المناسبة للمستخدم
  // progressRef: map من taskId → progress
  const tasksRef    = useRef([]);
  const progressRef = useRef({});
  const userRef     = useRef(user);
  const todayRef    = useRef(getTodayStr());

  useEffect(() => { userRef.current = user; }, [user]);

  // ─── جلب المهام والتقدم ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const today     = getTodayStr();
    todayRef.current = today;
    const userLevel = getUserLevel(user);

    const fetchAll = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "dailyTasks"), where("date", "==", today))
        );
        if (snap.empty) { tasksRef.current = []; return; }

        const allTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const suitable = allTasks.filter(t =>
          !t.targetLevel || t.targetLevel === "all" || t.targetLevel === userLevel
        );
        tasksRef.current = suitable;

        // جلب التقدم لكل مهمة — key: userId_date_taskId
        const progMap = {};
        await Promise.all(suitable.map(async (task) => {
          try {
            const pSnap = await getDoc(
              doc(db, "taskProgress", `${user.id}_${today}_${task.id}`)
            );
            progMap[task.id] = pSnap.exists()
              ? pSnap.data()
              : { count: 0, completed: false };
          } catch {
            progMap[task.id] = { count: 0, completed: false };
          }
        }));
        progressRef.current = progMap;
      } catch (err) {
        console.error("useTaskTracker fetchAll:", err);
      }
    };

    fetchAll();
  }, [user?.id]);

  // ─── window.__reportTaskAction ────────────────────────────────────────────
  useEffect(() => {
    window.__reportTaskAction = async (type) => {
      const currentUser = userRef.current;
      const today       = todayRef.current;
      if (!currentUser?.id) return;

      // ابحث عن كل المهام التي تقبل هذا النوع ولم تكتمل بعد
      const matchingTasks = tasksRef.current.filter(task => {
        const prog = progressRef.current[task.id] || {};
        if (prog.completed) return false;
        if (task.type === type) return true;
        if (task.type === "combined" && ["qa", "lesson", "exercise"].includes(type)) return true;
        return false;
      });

      if (matchingTasks.length === 0) return;

      // حدّث كل مهمة مناسبة
      for (const task of matchingTasks) {
        const currentProg = progressRef.current[task.id] || { count: 0, completed: false };
        let newProgress;

        if (task.type === "combined") {
          const counts = {
            qa:       (currentProg.qaCount       || 0),
            lesson:   (currentProg.lessonCount   || 0),
            exercise: (currentProg.exerciseCount || 0),
          };
          counts[type] = counts[type] + 1;

          const completed =
            counts.qa       >= (task.qaCount       || 0) &&
            counts.lesson   >= (task.lessonCount   || 0) &&
            counts.exercise >= (task.exerciseCount || 0);

          newProgress = {
            ...currentProg,
            qaCount:       counts.qa,
            lessonCount:   counts.lesson,
            exerciseCount: counts.exercise,
            count:         counts.qa + counts.lesson + counts.exercise,
            completed,
          };
        } else {
          const newCount  = (currentProg.count || 0) + 1;
          const completed = newCount >= task.targetCount;
          newProgress = { ...currentProg, count: newCount, completed };
        }

        // تحديث ref فوراً
        progressRef.current[task.id] = newProgress;

        try {
          const ref = doc(db, "taskProgress", `${currentUser.id}_${today}_${task.id}`);
          await setDoc(ref, {
            userId:        currentUser.id,
            taskId:        task.id,
            taskType:      task.type,
            date:          today,
            ...newProgress,
            pointsAwarded: newProgress.completed ? task.points : 0,
          }, { merge: true });

          // إطلاق حدث التقدم مع taskId
          window.dispatchEvent(new CustomEvent("taskProgress", {
            detail: { ...newProgress, taskId: task.id }
          }));

          if (newProgress.completed) {
            await updateDoc(doc(db, "users", currentUser.id), {
              points: increment(task.points),
            });
            const freshUser = userRef.current;
            setUser({ ...freshUser, points: (freshUser.points || 0) + task.points });

            // إطلاق حدث الإكمال مع taskId
            window.dispatchEvent(new CustomEvent("taskCompleted", {
              detail: { points: task.points, taskId: task.id }
            }));
          }
        } catch (err) {
          console.error("خطأ في تسجيل التقدم للمهمة", task.id, err);
          progressRef.current[task.id] = currentProg; // rollback
        }
      }
    };

    return () => { delete window.__reportTaskAction; };
  }, [setUser]);
}