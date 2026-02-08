// src/app/dashboard/courses/page.jsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Search, Filter, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { getAllCourses } from "@/data/coursesData"; // أضف هذا الاستيراد

export default function CoursesPage() {
  const [user, setUser] = useState(null);
  const [displayCourses, setDisplayCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // قراءة البيانات من المفتاح الصحيح
    const savedData = localStorage.getItem('temp_user_data');
    if (savedData) {
      const userData = JSON.parse(savedData);
      setUser(userData);
      
      // الحصول على جميع المواد من قاعدة البيانات
      const allCourses = getAllCourses();
      
      // تصفية المواد حسب تخصص المستخدم (يمكن تطوير هذا المنطق لاحقاً)
      const filteredCourses = allCourses.filter(course => {
        if (userData.level === "middle") {
          // للمتوسط: جميع المواد الأساسية
          return [1, 3, 4, 5, 6, 7, 8, 10, 11, 12].includes(course.id);
        } else if (userData.level === "secondary") {
          // للثانوي: حسب التخصص
          if (userData.specialty === "tech") {
            return [1, 2, 3, 5, 6, 7, 8].includes(course.id);
          } else if (userData.specialty === "علوم تجريبية") {
            return [1, 3, 4, 5, 6, 7, 8].includes(course.id);
          } else {
            return allCourses;
          }
        }
        return allCourses;
      });
      
      setDisplayCourses(filteredCourses);
    } else {
      // إذا لم يكن هناك مستخدم، اعرض جميع المواد
      setDisplayCourses(getAllCourses());
    }
    setLoading(false);
  }, []);

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  return (
    <div className="space-y-8 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-gray-100">موادي الدراسية</h1>
          <p className="text-gray-500 mt-1">تصفح دروسك وابدأ التحصيل العلمي</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayCourses.map((course) => (
          <motion.div
            key={course.id}
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all"
          >
            <div className="p-8">
              <div className={`w-14 h-14 rounded-2xl bg-${course.color}-100 text-${course.color}-600 flex items-center justify-center mb-6`}>
                <BookOpen size={30} />
              </div>
              
              <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-2">{course.title}</h3>
              <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
                <GraduationCap size={16} /> {course.teacher}
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>نسبة الإنجاز</span>
                  <span>{course.stats.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${course.stats.progress}%` }}
                    className={`h-full bg-${course.color}-500`}
                  />
                </div>
              </div>

              {/* الربط مع الصفحة الديناميكية [id] */}
              <Link href={`/dashboard/courses/${course.id}`}>
                <button className="w-full py-4 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 group">
                  دخول المادة
                  <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                </button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}