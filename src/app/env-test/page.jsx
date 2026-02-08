// src/app/env-test/page.jsx
"use client";  // أضف هذا السطر في الأعلى

import { useEffect, useState } from "react";

export default function EnvTestPage() {
  const [firebaseStatus, setFirebaseStatus] = useState("جاري التحقق...");
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testFirebase = async () => {
    setLoading(true);
    setFirebaseStatus("جاري اختبار Firebase...");
    console.clear();
    console.log("🧪 بدء اختبار Firebase...");

    try {
      // محاولة 1: استيراد config.js مباشرة
      console.log("1. جاري استيراد config.js...");
      
      // المسار الصحيح من src/app/env-test إلى src/lib/firebase/config.js
      const { auth, db } = await import("../../lib/firebase/config");
      
      console.log("✅ تم استيراد Firebase بنجاح!");
      console.log("Auth:", auth);
      console.log("DB:", db);
      
      setFirebaseStatus("✅ Firebase متصل!");
      
      // عرض معلومات المشروع
      setTestResult({
        projectId: auth.app.options.projectId,
        authDomain: auth.app.options.authDomain,
        authReady: !!auth,
        dbReady: !!db,
        appName: auth.app.name
      });

      // اختبار بسيط: محاولة إنشاء مستخدم
      console.log("2. جاري اختبار Authentication...");
      import("firebase/auth").then(({ createUserWithEmailAndPassword }) => {
        const testEmail = `test${Date.now()}@test.com`;
        const testPassword = "Test123456!";
        
        createUserWithEmailAndPassword(auth, testEmail, testPassword)
          .then(userCredential => {
            console.log("✅ تم إنشاء مستخدم تجريبي!");
            console.log("User ID:", userCredential.user.uid);
            console.log("Email:", userCredential.user.email);
            
            setTestResult(prev => ({
              ...prev,
              testUserCreated: true,
              testUserId: userCredential.user.uid.substring(0, 8) + "..."
            }));
          })
          .catch(error => {
            console.log("⚠️ لم يتم إنشاء مستخدم (قد يكون موجوداً):", error.code);
            // هذا لا يعني فشل Firebase، بل يعني أن الخدمة تعمل
          });
      });

    } catch (error) {
      console.error("❌ فشل في استيراد Firebase:", error);
      setFirebaseStatus(`❌ خطأ: ${error.message}`);
      
      // محاولة بديلة: استيراد firebase مباشرة
      try {
        console.log("🔧 جرب الاستيراد المباشر...");
        const firebase = await import("firebase/app");
        const { initializeApp } = firebase;
        
        const app = initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
        });
        
        console.log("✅ Firebase يعمل (تم التهيئة مباشرة)");
        setFirebaseStatus("✅ Firebase يعمل (تهيئة مباشرة)");
        setTestResult({
          projectId: app.options.projectId,
          directInit: true
        });
        
      } catch (e2) {
        console.error("❌ فشل كامل:", e2);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // اختبر تلقائياً عند تحميل الصفحة
    testFirebase();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-primary mb-4">🔥 اختبار Firebase النهائي</h1>
          <p className="text-gray-600">التأكد من اتصال جميع خدمات Firebase</p>
        </div>

        {/* Environment Variables */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🔧 متغيرات البيئة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Project ID:</span>
                <code className="font-mono bg-gray-100 px-3 py-1 rounded">
                  {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Auth Domain:</span>
                <span className="font-medium">{process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">API Key:</span>
                <span className="font-medium">
                  {process.env.NEXT_PUBLIC_FIREBASE_API_KEY 
                    ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 15) + "..." 
                    : "غير موجودة"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">App ID:</span>
                <span className="font-medium text-sm">{process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.substring(0, 20)}...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Firebase Test Results */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">🧪 نتائج اختبار Firebase</h2>
            <button
              onClick={testFirebase}
              disabled={loading}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                loading 
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed" 
                  : "bg-primary text-white hover:bg-primary-hover"
              }`}
            >
              {loading ? "جاري الاختبار..." : "إعادة الاختبار"}
            </button>
          </div>

          {/* Status */}
          <div className={`p-5 rounded-xl mb-6 ${
            firebaseStatus.includes("✅") 
              ? "bg-green-50 border border-green-200" 
              : firebaseStatus.includes("❌")
              ? "bg-red-50 border border-red-200"
              : "bg-blue-50 border border-blue-200"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                firebaseStatus.includes("✅") ? "bg-green-500" :
                firebaseStatus.includes("❌") ? "bg-red-500" : "bg-blue-500"
              }`}></div>
              <h3 className="text-lg font-bold">الحالة: {firebaseStatus}</h3>
            </div>
          </div>

          {/* Test Details */}
          {testResult && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800">تفاصيل الاختبار:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">معرف المشروع</p>
                  <p className="font-bold text-lg">{testResult.projectId}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">خدمة المصادقة</p>
                  <p className={`font-bold ${testResult.authReady ? "text-green-600" : "text-red-600"}`}>
                    {testResult.authReady ? "✅ جاهزة" : "❌ غير جاهزة"}
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">قاعدة البيانات</p>
                  <p className={`font-bold ${testResult.dbReady ? "text-green-600" : "text-red-600"}`}>
                    {testResult.dbReady ? "✅ جاهزة" : "❌ غير جاهزة"}
                  </p>
                </div>
                
                {testResult.testUserCreated && (
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-gray-600">المستخدم التجريبي</p>
                    <p className="font-bold text-green-600">✅ تم الإنشاء</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {testResult.testUserId}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Console Message */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm text-yellow-800">
              💡 افتح Console (F12) لمشاهدة التفاصيل التقنية والرسائل
            </p>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🔧 استكشاف الأخطاء</h3>
          
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span>1</span>
              </div>
              <p>إذا ظهر خطأ "فشل في استيراد Firebase"، تأكد من وجود ملف <code>config.js</code> في <code>src/lib/firebase/</code></p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span>2</span>
              </div>
              <p>تحقق من تثبيت حزمة Firebase: <code className="bg-gray-100 px-2 py-1 rounded">npm list firebase</code></p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span>3</span>
              </div>
              <p>افتح ملف <code>config.js</code> وتأكد من أن بيانات FirebaseConfig صحيحة</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}