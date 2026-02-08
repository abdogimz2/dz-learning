"use client";

import { motion } from "framer-motion";
import { 
  Users, 
  CreditCard, 
  BookOpen, 
  MessageSquare, 
  ArrowUpRight,
  Clock,
  CheckCircle,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  
  const stats = [
    { label: "إجمالي الطلاب", value: "0", icon: Users, color: "blue" },
    { label: "طلبات معلقة", value: "0", icon: Clock, color: "orange" },
    { label: "الدروس المتاحة", value: "10", icon: BookOpen, color: "green" },
    { label: "رصيد المنصة", value: "0", icon: TrendingUp, color: "purple" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* قسم الترحيب */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">الإحصائيات العامة</h1>
          <p className="text-gray-500 mt-2 text-lg text-right">إليك نظرة سريعة على أداء موقعك التعليمي.</p>
        </div>
        <Link href="/admin/payments">
          <button className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-primary/20 transition-all active:scale-95">
            <CheckCircle size={20} /> مراجعة طلبات الدفع
          </button>
        </Link>
      </div>

      {/* كروت الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow text-right"
          >
            <div className="flex items-center justify-between mb-4 flex-row-reverse">
              <div className={`p-3 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600`}>
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
                تحديث تلقائي
              </span>
            </div>
            <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
            <p className="text-3xl font-black text-gray-800 dark:text-gray-100 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* الشبكة الرئيسية للأفعال */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* النشاط الأخير */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm text-right">
          <h3 className="text-xl font-black mb-6 flex items-center gap-3 dark:text-white flex-row-reverse">
            <Clock className="text-orange-500" /> آخر طلبات التسجيل
          </h3>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <Users size={32} />
            </div>
            <p className="text-gray-500">لا توجد طلبات جديدة حالياً، بمجرد تسجيل الطلاب ستظهر هنا.</p>
          </div>
        </div>

        {/* كروت سريعة للإدارة */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-secondary to-blue-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-secondary/20 relative overflow-hidden group">
            <div className="relative z-10 text-right">
              <h3 className="text-2xl font-black mb-2 text-white">إدارة الدروس</h3>
              <p className="text-white/70 mb-6 text-sm">أضف دروساً أو تمارين جديدة لطلابك.</p>
              <button className="bg-white text-secondary font-black px-6 py-3 rounded-xl flex items-center gap-2 group-hover:scale-105 transition-transform">
                إضافة درس <ArrowUpRight size={18} />
              </button>
            </div>
            <BookOpen className="absolute -bottom-4 -left-4 text-white/10 w-40 h-40 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between flex-row-reverse">
            <div className="text-right">
              <h3 className="font-black text-gray-800 dark:text-gray-200">نظام الأسئلة</h3>
              <p className="text-sm text-gray-500">بنك سؤال وجواب</p>
            </div>
            <button className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-primary transition-colors">
              <ArrowUpRight size={24} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}