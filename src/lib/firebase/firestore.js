// src/lib/firebase/firestore.js
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc,
  addDoc,
  serverTimestamp,
  query,
  where
} from "firebase/firestore";
import { db } from "./config";

// Collections names
const COLLECTIONS = {
  USERS: "users",
  PAYMENTS: "payments",
  COURSES: "courses",
  USER_PROGRESS: "user_progress",
  QUESTIONS: "questions"
};

// إنشاء ملف مستخدم جديد
export const createUserDocument = async (userId, userData) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    
    await setDoc(userRef, {
      ...userData,
      id: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "pending", // pending, active, suspended
      role: "student",   // student, admin
      points: 0,
      level: userData.level || "",
      specialty: userData.specialty || "",
      year: userData.year || "",
      branchType: userData.branchType || ""
    });
    
    console.log("✅ تم إنشاء مستند المستخدم:", userId);
    return { success: true, userId };
  } catch (error) {
    console.error("❌ خطأ في إنشاء مستند المستخدم:", error);
    return { success: false, error: error.message };
  }
};

// جلب بيانات مستخدم
export const getUserDocument = async (userId) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: "المستخدم غير موجود" };
    }
  } catch (error) {
    console.error("❌ خطأ في جلب بيانات المستخدم:", error);
    return { success: false, error: error.message };
  }
};

// إنشاء طلب دفع
export const createPaymentRequest = async (paymentData) => {
  try {
    const paymentRef = await addDoc(collection(db, COLLECTIONS.PAYMENTS), {
      ...paymentData,
      status: "pending", // pending, approved, rejected
      createdAt: serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null
    });
    
    console.log("✅ تم إنشاء طلب دفع:", paymentRef.id);
    return { success: true, paymentId: paymentRef.id };
  } catch (error) {
    console.error("❌ خطأ في إنشاء طلب الدفع:", error);
    return { success: false, error: error.message };
  }
};

// جلب جميع المواد
export const getAllCourses = async () => {
  try {
    const coursesRef = collection(db, COLLECTIONS.COURSES);
    const snapshot = await getDocs(coursesRef);
    
    const courses = [];
    snapshot.forEach(doc => {
      courses.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, courses };
  } catch (error) {
    console.error("❌ خطأ في جلب المواد:", error);
    return { success: false, error: error.message };
  }
};

// دالة مساعدة للتطوير
export const initializeSampleData = async () => {
  console.log("🚀 تهيئة بيانات تجريبية...");
  
  // ستنشئ بيانات تجريبية لاحقاً
  return { success: true, message: "جاهز لتهيئة البيانات" };
};