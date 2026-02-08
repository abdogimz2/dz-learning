// src/app/dashboard/courses/[id]/page.jsx
"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PlayCircle, FileText, ChevronDown, MessageCircle, Video, BookOpen, Clock,
  Download, ExternalLink, BarChart3, Users, Award, Lock, CheckCircle2,
  FileVideo, BookMarked, MessageSquare, Calendar, Zap, User
} from "lucide-react";
import Link from "next/link";
import { getCourseInfo } from "@/data/coursesData"; // أضف هذا الاستيراد

// مكون بطاقة الإحصائيات في الأعلى
const StatCard = ({ stat, idx }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.1 }}
    className={`${stat.bg} rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
        <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
      </div>
      <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
        <stat.icon size={24} />
      </div>
    </div>
  </motion.div>
);

// مكون العنصر داخل القسم
const SectionItem = ({ item, idx }) => {
  const Icon = item.type === "video" ? PlayCircle : item.type === "pdf" ? FileText : item.type === "chat" ? MessageCircle : Award;
  const colorClass = item.type === "video" ? "text-blue-500" : item.type === "pdf" ? "text-orange-500" : "text-purple-500";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.1 }}
      className={`group relative p-5 rounded-2xl border transition-all duration-300 ${
        item.locked ? 'bg-gray-50/50 dark:bg-gray-800/50 border-gray-200' : 'bg-white/50 dark:bg-gray-800/30 border-gray-200/50 hover:border-blue-300 hover:shadow-lg'
      }`}
    >
      {item.completed && <CheckCircle2 className="absolute top-4 left-4 text-emerald-500" size={20} />}
      {item.locked && (
        <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-20">
          <Lock className="text-gray-400" size={24} />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Icon className={colorClass} size={20} />
            <h4 className={`font-bold ${item.locked ? 'text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{item.title}</h4>
          </div>
          <p className="text-sm text-gray-500 mb-3">{item.description}</p>
          <div className="flex gap-4 text-xs text-gray-400">
            {item.duration && <span className="flex items-center gap-1"><Clock size={14}/> {item.duration}</span>}
            {item.size && <span className="flex items-center gap-1"><FileText size={14}/> {item.size}</span>}
          </div>
        </div>
        <button className={`px-5 py-2.5 rounded-xl font-bold transition-all ${item.locked ? 'bg-gray-200 text-gray-400' : 'bg-primary text-white hover:shadow-lg'}`}>
          {item.type === "pdf" ? "تحميل" : "دخول"}
        </button>
      </div>
    </motion.div>
  );
};

// المكون الرئيسي
export default function CourseContentPage() {
  const params = useParams();
  const id = params.id;
  
  // الحصول على معلومات المادة من قاعدة البيانات
  const courseInfo = getCourseInfo(parseInt(id) || 1);
  const courseStats = courseInfo.stats;
  
  console.log("✅ معلومات المادة:", courseInfo);
  
  // إذا كان id غير موجود، اعرض رسالة
  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500">❌ خطأ: لم يتم تحديد المادة</h2>
          <p className="text-gray-600">يرجى اختيار مادة من صفحة المواد</p>
          <Link href="/dashboard/courses" className="mt-4 inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover">
            العودة إلى المواد
          </Link>
        </div>
      </div>
    );
  }

  const [activeSections, setActiveSections] = useState(["lessons"]);
  const [courseProgress] = useState(courseStats.progress);

  const toggleSection = (sectionId) => {
    setActiveSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(i => i !== sectionId) 
        : [...prev, sectionId]
    );
  };

  // إحصائيات المادة
  const courseStatsCards = [
    { icon: Clock, label: "الساعات المكتملة", value: `${courseStats.hours} ساعة`, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { icon: BarChart3, label: "نسبة التقدم", value: `${courseStats.progress}%`, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { icon: Users, label: "الطلاب النشطين", value: courseStats.students.toLocaleString(), color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { icon: Award, label: "المستوى", value: courseStats.difficulty, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  ];

  // أقسام المادة
  const sections = [
    {
      id: "lessons",
      title: "الدروس المسجلة",
      subtitle: "سلسلة دروس كاملة بالترتيب المنهجي",
      count: `${courseStats.completedLessons}/${courseStats.totalLessons} درس`,
      icon: FileVideo,
      color: "bg-blue-500",
      completed: courseStats.completedLessons,
      total: courseStats.totalLessons,
      items: [
        { type: "video", title: `مقدمة في ${courseInfo.title}`, duration: "15:00", description: "المفاهيم الأساسية للمادة", completed: true },
        { type: "video", title: "الوحدة الأولى: المبادئ الأساسية", duration: "25:30", description: "شرح تفصيلي للوحدة الأولى", locked: false },
        { type: "pdf", title: "ملخص الوحدة الأولى", size: "2.4 MB", description: "ملف PDF شامل للوحدة", completed: true },
        { type: "chat", title: "مناقشة الأسئلة الصعبة", description: "جلسة حوارية مع الأساتذة", locked: false },
      ]
    },
    {
      id: "exercises",
      title: "التمارين والتطبيقات",
      subtitle: "تمارين عملية مع حلول مفصلة",
      count: "35 تمرين",
      icon: BookMarked,
      color: "bg-emerald-500",
      completed: 12,
      total: 35,
      items: [
        { type: "pdf", title: "تمارين الوحدة الأولى", size: "1.8 MB", description: "مجموعة تمارين محلولة", completed: true },
        { type: "pdf", title: "تمارين الوحدة الثانية", size: "2.1 MB", description: "تمارين معقدة للمستوى المتقدم", locked: false },
      ]
    },
    {
      id: "exams",
      title: "الاختبارات الشاملة",
      subtitle: "اختبارات سابقة مع التصحيح الآلي",
      count: "8 اختبارات",
      icon: Award,
      color: "bg-purple-500",
      completed: 3,
      total: 8,
      items: [
        { type: "pdf", title: "اختبار الفصل الأول 2024", size: "3.2 MB", description: "اختبار رسمي مع الإجابات النموذجية", completed: true },
        { type: "pdf", title: "اختبار الفصل الثاني 2024", size: "3.5 MB", description: "اختبار تجريبي شامل", locked: true },
      ]
    },
    {
      id: "qa",
      title: "سؤال وجواب",
      subtitle: "أسئلة الطلاب وإجابات الأساتذة",
      count: "47 سؤال",
      icon: MessageSquare,
      color: "bg-amber-500",
      completed: 15,
      total: 47,
      items: [
        { type: "chat", title: `كيف أحل مسائل ${courseInfo.title}؟`, description: `إجابة مفصلة من ${courseInfo.teacher}`, completed: true },
        { type: "chat", title: "الفرق بين المفاهيم الأساسية", description: "مقارنة شاملة بين المصطلحات الرئيسية", locked: false },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-3xl bg-primary text-white shadow-xl shadow-primary/20">
              <BookOpen size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black dark:text-white">{courseInfo.fullTitle}</h1>
              <p className="text-gray-500">
                <User size={16} className="inline mr-1" />
                {courseInfo.teacher} • المادة #{id}
              </p>
            </div>
          </div>
          
          {/* Progress Circle */}
          <div className="relative w-24 h-24 flex items-center justify-center bg-white dark:bg-gray-900 rounded-full shadow-inner border-4 border-emerald-500/20">
            <span className="text-xl font-black text-emerald-500">{courseStats.progress}%</span>
          </div>
        </div>

        {/* وصف المادة */}
        <div className="mb-8 p-6 bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
            {courseInfo.description}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {courseStatsCards.map((stat, idx) => (
            <StatCard key={idx} stat={stat} idx={idx} />
          ))}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Course Sections (Accordions) */}
          <div className="lg:col-span-2 space-y-4">
            {sections.map((section) => (
              <div key={section.id} className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <button 
                  onClick={() => toggleSection(section.id)} 
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4 text-right">
                    <div className={`p-3 rounded-2xl ${section.color} text-white`}>
                      <section.icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg dark:text-white">{section.title}</h3>
                      <p className="text-xs text-gray-500">{section.subtitle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-emerald-600 font-bold">{section.completed}/{section.total}</span>
                        <span className="text-xs text-gray-400">مكتمل</span>
                      </div>
                    </div>
                  </div>
                  <ChevronDown size={20} className={`transition-transform ${activeSections.includes(section.id) ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeSections.includes(section.id) && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-50 dark:border-gray-800 p-4 space-y-3"
                    >
                      {section.items.map((item, i) => (
                        <SectionItem key={i} item={item} idx={i} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800">
              <h3 className="font-black mb-4 dark:text-white">إجراءات سريعة</h3>
              <div className="space-y-2">
                <button className="w-full p-4 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold flex items-center gap-3 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all">
                  <Zap size={20}/> استمر بالتعلم
                </button>
                <button className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-500 font-bold flex items-center gap-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                  <Download size={20}/> تحميل الكل
                </button>
                <button className="w-full p-4 rounded-2xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary/80 font-bold flex items-center gap-3 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all">
                  <Calendar size={20}/> جدولي الدراسي
                </button>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 border border-primary/20 dark:border-primary/30 p-6 rounded-[2rem]">
              <h3 className="font-bold mb-4 dark:text-white flex items-center gap-2">
                <Calendar className="text-primary" size={20}/>
                الأحداث القادمة
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">اختبار تجريبي في {courseInfo.title}</p>
                  <p className="text-xs text-gray-500">غداً، 10:00 صباحاً</p>
                </div>
                <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">بث مباشر مع {courseInfo.teacher}</p>
                  <p className="text-xs text-gray-500">الجمعة، 4:00 مساءً</p>
                </div>
              </div>
            </div>

            {/* Course Info */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[2rem] border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold mb-4 dark:text-white">معلومات المادة</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>المادة:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{courseInfo.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>المستوى:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{courseInfo.level}</span>
                </div>
                <div className="flex justify-between">
                  <span>رقم المادة:</span>
                  <span className="font-mono font-bold text-primary">#{id}</span>
                </div>
                <div className="flex justify-between">
                  <span>المستوى التعليمي:</span>
                  <span className={`font-bold ${courseStats.difficulty === 'سهل' ? 'text-emerald-600' : courseStats.difficulty === 'متوسط' ? 'text-amber-600' : 'text-red-600'}`}>
                    {courseStats.difficulty}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>تاريخ الإضافة:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">15 سبتمبر 2024</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Link 
            href="/dashboard/courses" 
            className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            ← العودة إلى المواد
          </Link>
          <button className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors flex items-center gap-2">
            الدرس التالي →
          </button>
        </div>
      </div>
    </div>
  );
}