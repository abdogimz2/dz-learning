"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, Trophy, Zap, Clock, ArrowUpRight, 
  Star, PlayCircle, CheckCircle2 
} from "lucide-react";

export default function DashboardPage() {
  const [userName, setUserName] = useState("الطالب");

  useEffect(() => {
    const savedData = localStorage.getItem('payment_info');
    if (savedData) {
      const data = JSON.parse(savedData);
      setUserName(data.name);
    }
  }, []);

  const stats = [
    { label: "المواد المشترك بها", value: "12", icon: BookOpen, color: "blue" },
    { label: "رصيد النقاط", value: "1,250", icon: Star, color: "yellow" },
    { label: "المركز الحالي", value: "#5", icon: Trophy, color: "orange" },
    { label: "ساعات الدراسة", value: "24h", icon: Clock, color: "green" },
  ];

  const recentLessons = [
    { id: 1, title: "الدوال الأسية واللوغاريتمية", subject: "رياضيات", progress: 75 },
    { id: 2, title: "الوحدة الأولى: تركيب البروتين", subject: "علوم طبيعية", progress: 30 },
    { id: 3, title: "ثنائية القطب RC", subject: "فيزياء", progress: 90 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-primary via-primary to-secondary rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl shadow-primary/20"
      >
        <div className="relative z-10">
          <span className="inline-block px-4 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold mb-4">لوحة التحكم الذكية</span>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">مرحباً بك مجدداً، {userName}! 👋</h1>
          <p className="text-white/80 text-lg max-w-md leading-relaxed mb-8">
            جاهز لمواصلة رحلة التفوق؟ لديك دروس جديدة تنتظرك اليوم.
          </p>
          <div className="flex gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="bg-white text-primary font-bold px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg transition-all"
            >
              <Zap size={20} fill="currentColor" />
              ابدأ الدراسة
            </motion.button>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[100px]" />
        <Trophy className="absolute bottom-4 left-12 text-white/10 w-48 h-48 rotate-12 hidden md:block" />
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className={`p-4 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-900/10 text-${stat.color}-600`}>
                <stat.icon size={24} />
              </div>
              <span className="text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                +12% متطور
              </span>
            </div>
            <div className="mt-4 text-right">
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.label}</h3>
              <p className="text-3xl font-black text-gray-800 dark:text-gray-100 mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Continue Learning Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">واصل التعلم</h2>
            <button className="text-primary font-bold text-sm">عرض الجدول الدراسي</button>
          </div>
          <div className="grid gap-4">
            {recentLessons.map((lesson) => (
              <div key={lesson.id} className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center gap-4 group cursor-pointer hover:border-primary/40 transition-all">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <PlayCircle size={32} />
                </div>
                <div className="flex-1 text-right">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">{lesson.title}</h3>
                    <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-1 rounded-md font-bold">{lesson.subject}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${lesson.progress}%` }} className="h-full bg-primary" />
                    </div>
                    <span className="text-xs font-bold text-gray-500">{lesson.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Tasks */}
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-8">
          <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-gray-100">تحديات اليوم</h3>
          <div className="space-y-4">
            {[
              { t: "إنهاء درس الرياضيات", p: "+20", d: false },
              { t: "حل 5 تمارين فيزياء", p: "+50", d: false },
              { t: "مراجعة مصطلحات التاريخ", p: "+30", d: false },
            ].map((task, i) => (
              <div key={i} className={`p-4 rounded-2xl border ${task.d ? 'bg-green-50/50 border-green-100' : 'bg-gray-50 dark:bg-gray-800/50 border-transparent'} flex items-center justify-between`}>
                <span className={`text-sm font-medium ${task.d ? 'text-green-700 line-through' : 'text-gray-700 dark:text-gray-300'}`}>{task.t}</span>
                <span className="text-xs font-bold text-secondary">{task.p} ن</span>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <p className="text-xs text-primary font-bold mb-2">مستوى الإنجاز</p>
            <div className="h-2 bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-1/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}