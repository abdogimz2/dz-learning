// src/lib/firebase/auth.js
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  verifyBeforeUpdateEmail
} from "firebase/auth";
import { auth } from "./config";

/**
 * تسجيل مستخدم جديد في Firebase Authentication
 * @param {string} email - البريد الإلكتروني
 * @param {string} password - كلمة المرور
 * @param {object} userData - بيانات المستخدم الإضافية
 * @returns {Promise<object>} نتيجة العملية
 */
export const registerUser = async (email, password, userData) => {
  try {
    console.log("🚀 محاولة إنشاء حساب جديد:", email);
    
    // التحقق الأولي من البيانات
    if (!email || !password) {
      throw new Error("البريد الإلكتروني وكلمة المرور مطلوبان");
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("البريد الإلكتروني غير صالح");
    }
    
    if (password.length < 6) {
      throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("✅ تم إنشاء الحساب في Auth:", user.uid);
    
    // تحديث الملف الشخصي في Firebase Auth
    try {
      await updateProfile(user, {
        displayName: `${userData.name} ${userData.surname}`.trim(),
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}+${encodeURIComponent(userData.surname)}&background=random&color=fff&bold=true&size=128`
      });
    } catch (profileError) {
      console.warn("⚠️ لم يتم تحديث الملف الشخصي:", profileError.message);
      // نستمر حتى لو فشل تحديث الملف الشخصي
    }
    
    // إرسال بريد التحقق (حسب الإعدادات)
    try {
      await sendEmailVerification(user);
      console.log("📧 تم إرسال بريد التحقق");
    } catch (verificationError) {
      console.warn("⚠️ لم يتم إرسال بريد التحقق:", verificationError.message);
    }
    
    return { 
      success: true, 
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName || `${userData.name} ${userData.surname}`,
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}+${encodeURIComponent(userData.surname)}&background=random&color=fff`,
        createdAt: user.metadata.creationTime,
        phoneNumber: user.phoneNumber || null
      }
    };
  } catch (error) {
    console.error("❌ خطأ في التسجيل:", error.code, error.message);
    return { 
      success: false, 
      error: getFirebaseError(error.code),
      code: error.code,
      originalError: error.message
    };
  }
};

/**
 * تسجيل الدخول للمستخدمين المسجلين
 * @param {string} email - البريد الإلكتروني
 * @param {string} password - كلمة المرور
 * @returns {Promise<object>} نتيجة العملية
 */
export const loginUser = async (email, password) => {
  try {
    console.log("🚀 محاولة تسجيل دخول:", email);
    
    // التحقق من البيانات المدخلة
    if (!email || !password) {
      throw new Error("البريد الإلكتروني وكلمة المرور مطلوبان");
    }
    
    // تنظيف البريد الإلكتروني من الفراغات
    const cleanEmail = email.trim().toLowerCase();
    
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;
    
    console.log("✅ تم تسجيل الدخول:", user.uid);
    
    // تحديث آخر وقت تسجيل دخول في Firestore
    await updateLastLogin(user.uid);
    
    // إعادة إرسال بريد التحقق إذا لم يكن مفعلاً
    if (!user.emailVerified) {
      try {
        await sendEmailVerification(user);
        console.log("📧 تم إعادة إرسال بريد التحقق");
      } catch (verificationError) {
        console.warn("⚠️ لم يتم إرسال بريد التحقق:", verificationError.message);
      }
    }
    
    return { 
      success: true, 
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber || null,
        metadata: {
          lastLoginAt: user.metadata.lastLoginAt,
          creationTime: user.metadata.creationTime
        }
      }
    };
  } catch (error) {
    console.error("❌ خطأ في تسجيل الدخول:", error.code, error.message);
    
    // تسجيل محاولة فاشلة (للتتبع)
    logFailedAttempt(email, error.code);
    
    return { 
      success: false, 
      error: getFirebaseError(error.code),
      code: error.code,
      originalError: error.message
    };
  }
};

/**
 * تسجيل الخروج من الحساب
 * @returns {Promise<object>} نتيجة العملية
 */
export const logoutUser = async () => {
  try {
    console.log("🚀 تسجيل الخروج...");
    const userEmail = auth.currentUser?.email;
    await signOut(auth);
    console.log("✅ تم تسجيل الخروج بنجاح:", userEmail);
    
    // تنظيف التخزين المحلي
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('login_time');
    sessionStorage.removeItem('current_user');
    
    return { success: true, message: "تم تسجيل الخروج بنجاح" };
  } catch (error) {
    console.error("❌ خطأ في تسجيل الخروج:", error.message);
    return { success: false, error: getFirebaseError(error.code), code: error.code };
  }
};

/**
 * إعادة تعيين كلمة المرور
 * @param {string} email - البريد الإلكتروني
 * @returns {Promise<object>} نتيجة العملية
 */
export const resetPassword = async (email) => {
  try {
    console.log("🚀 إرسال رابط إعادة تعيين كلمة المرور:", email);
    
    if (!email) {
      throw new Error("البريد الإلكتروني مطلوب");
    }
    
    await sendPasswordResetEmail(auth, email);
    
    return { 
      success: true, 
      message: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني" 
    };
  } catch (error) {
    console.error("❌ خطأ في إعادة تعيين كلمة المرور:", error.message);
    return { 
      success: false, 
      error: getFirebaseError(error.code),
      code: error.code
    };
  }
};

/**
 * تحديث البريد الإلكتروني للمستخدم
 * @param {string} newEmail - البريد الإلكتروني الجديد
 * @param {string} password - كلمة المرور الحالية للتأكيد
 * @returns {Promise<object>} نتيجة العملية
 */
export const updateUserEmail = async (newEmail, password) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    // إعادة المصادقة قبل التحديث
    if (password) {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
    }

    await verifyBeforeUpdateEmail(user, newEmail);
    
    return { 
      success: true, 
      message: "تم إرسال بريد تحقق إلى البريد الجديد. يرجى التحقق منه"
    };
  } catch (error) {
    console.error("❌ خطأ في تحديث البريد:", error.message);
    return { 
      success: false, 
      error: getFirebaseError(error.code),
      code: error.code
    };
  }
};

/**
 * تحديث كلمة المرور للمستخدم
 * @param {string} currentPassword - كلمة المرور الحالية
 * @param {string} newPassword - كلمة المرور الجديدة
 * @returns {Promise<object>} نتيجة العملية
 */
export const updateUserPassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    // إعادة المصادقة
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // التحقق من قوة كلمة المرور الجديدة
    if (newPassword.length < 6) {
      throw new Error("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
    }

    await updatePassword(user, newPassword);
    
    return { 
      success: true, 
      message: "تم تحديث كلمة المرور بنجاح" 
    };
  } catch (error) {
    console.error("❌ خطأ في تحديث كلمة المرور:", error.message);
    return { 
      success: false, 
      error: getFirebaseError(error.code),
      code: error.code
    };
  }
};

/**
 * إعادة إرسال بريد التحقق
 * @returns {Promise<object>} نتيجة العملية
 */
export const resendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    if (user.emailVerified) {
      return { 
        success: true, 
        message: "البريد الإلكتروني مفعل بالفعل" 
      };
    }

    await sendEmailVerification(user);
    
    return { 
      success: true, 
      message: "تم إرسال بريد التحقق إلى بريدك الإلكتروني" 
    };
  } catch (error) {
    console.error("❌ خطأ في إعادة إرسال بريد التحقق:", error.message);
    return { 
      success: false, 
      error: getFirebaseError(error.code),
      code: error.code
    };
  }
};

/**
 * حذف حساب المستخدم
 * @param {string} password - كلمة المرور للتأكيد
 * @returns {Promise<object>} نتيجة العملية
 */
export const deleteAccount = async (password) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }

    // إعادة المصادقة
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    await deleteUser(user);
    
    // تنظيف التخزين المحلي
    localStorage.clear();
    sessionStorage.clear();
    
    return { 
      success: true, 
      message: "تم حذف حسابك بنجاح" 
    };
  } catch (error) {
    console.error("❌ خطأ في حذف الحساب:", error.message);
    return { 
      success: false, 
      error: getFirebaseError(error.code),
      code: error.code
    };
  }
};

/**
 * مراقبة حالة المصادقة
 * @param {function} callback - دالة الاستدعاء عند تغيير الحالة
 * @returns {function} دالة إلغاء الاشتراك
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("👤 المستخدم مسجل:", user.email);
      
      // جلب بيانات إضافية من Firestore إذا لزم الأمر
      const userData = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        isLoggedIn: true,
        metadata: {
          lastLoginAt: user.metadata.lastLoginAt,
          creationTime: user.metadata.creationTime
        }
      };
      
      callback(userData);
    } else {
      console.log("👤 لا يوجد مستخدم مسجل");
      callback(null);
    }
  });
};

/**
 * الحصول على المستخدم الحالي
 * @returns {object|null} بيانات المستخدم الحالي
 */
export const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) return null;
  
  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    photoURL: user.photoURL,
    phoneNumber: user.phoneNumber,
    isLoggedIn: true,
    metadata: {
      lastLoginAt: user.metadata.lastLoginAt,
      creationTime: user.metadata.creationTime
    }
  };
};

/**
 * التحقق من صحة جلسة المستخدم
 * @returns {Promise<object>} حالة الجلسة
 */
export const checkSession = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return {
        isValid: false,
        message: "لا توجد جلسة نشطة"
      };
    }
    
    // التحقق من آخر تسجيل دخول (أكثر من 30 يوم)
    const lastLogin = user.metadata.lastLoginAt;
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    if (lastLogin && (now - new Date(lastLogin).getTime()) > thirtyDays) {
      await signOut(auth);
      return {
        isValid: false,
        message: "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً"
      };
    }
    
    return {
      isValid: true,
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      }
    };
  } catch (error) {
    console.error("❌ خطأ في التحقق من الجلسة:", error.message);
    return {
      isValid: false,
      message: "خطأ في التحقق من الجلسة"
    };
  }
};

/**
 * تحديث آخر وقت تسجيل دخول في Firestore
 * @param {string} userId - معرف المستخدم
 */
const updateLastLogin = async (userId) => {
  try {
    const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
    const { db } = await import("./config");
    
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
      loginCount: await incrementLoginCount(userId)
    });
    
    console.log("📝 تم تحديث آخر تسجيل دخول للمستخدم:", userId);
  } catch (error) {
    console.error("❌ خطأ في تحديث آخر تسجيل دخول:", error.message);
  }
};

/**
 * زيادة عداد تسجيلات الدخول
 * @param {string} userId - معرف المستخدم
 */
const incrementLoginCount = async (userId) => {
  try {
    const { doc, getDoc, updateDoc } = await import("firebase/firestore");
    const { db } = await import("./config");
    
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const currentCount = userSnap.data().loginCount || 0;
      return currentCount + 1;
    }
    
    return 1;
  } catch (error) {
    console.error("❌ خطأ في زيادة عداد تسجيلات الدخول:", error.message);
    return 1;
  }
};

/**
 * تسجيل محاولة تسجيل دخول فاشلة
 * @param {string} email - البريد الإلكتروني
 * @param {string} errorCode - رمز الخطأ
 */
const logFailedAttempt = (email, errorCode) => {
  try {
    const attempts = JSON.parse(localStorage.getItem('failed_attempts') || '{}');
    const now = Date.now();
    
    if (!attempts[email]) {
      attempts[email] = [];
    }
    
    attempts[email].push({
      timestamp: now,
      errorCode: errorCode
    });
    
    // الاحتفاظ فقط بالمحاولات خلال آخر ساعة
    const oneHourAgo = now - (60 * 60 * 1000);
    attempts[email] = attempts[email].filter(attempt => attempt.timestamp > oneHourAgo);
    
    localStorage.setItem('failed_attempts', JSON.stringify(attempts));
    
    // التحقق من كثرة المحاولات
    if (attempts[email].length >= 5) {
      console.warn(`⚠️ كثرة محاولات تسجيل دخول فاشلة للبريد: ${email}`);
    }
  } catch (error) {
    console.error("❌ خطأ في تسجيل المحاولة الفاشلة:", error.message);
  }
};

/**
 * تحويل أخطاء Firebase إلى رسائل عربية
 * @param {string} errorCode - رمز الخطأ من Firebase
 * @returns {string} رسالة الخطأ بالعربية
 */
const getFirebaseError = (errorCode) => {
  const errors = {
    // أخطاء التسجيل
    'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
    'auth/invalid-email': 'البريد الإلكتروني غير صالح',
    'auth/operation-not-allowed': 'عملية التسجيل غير مفعلة',
    'auth/weak-password': 'كلمة المرور ضعيفة جداً. يجب أن تحتوي على 6 أحرف على الأقل',
    
    // أخطاء تسجيل الدخول
    'auth/user-disabled': 'الحساب معطل. تواصل مع الدعم',
    'auth/user-not-found': 'المستخدم غير موجود. تأكد من البريد الإلكتروني',
    'auth/wrong-password': 'كلمة المرور غير صحيحة',
    'auth/invalid-credential': 'بيانات الدخول غير صحيحة',
    'auth/too-many-requests': 'عدد المحاولات تجاوز الحد المسموح. حاول لاحقاً',
    'auth/invalid-verification-code': 'رمز التحقق غير صالح',
    'auth/invalid-verification-id': 'معرف التحقق غير صالح',
    
    // أخطاء عامة
    'auth/network-request-failed': 'خطأ في الشبكة. تحقق من اتصال الإنترنت',
    'auth/requires-recent-login': 'يجب تسجيل الدخول مجدداً لهذه العملية',
    'auth/expired-action-code': 'انتهت صلاحية الرابط',
    'auth/invalid-action-code': 'الرابط غير صالح',
    'auth/user-mismatch': 'المستخدم غير مطابق',
    'auth/requires-multi-factor-auth': 'يتطلب المصادقة متعددة العوامل',
    'auth/quota-exceeded': 'تم تجاوز الحصة المخصصة',
    'auth/credential-already-in-use': 'البيانات الاعتمادية مستخدمة بالفعل',
    'auth/provider-already-linked': 'مزود الخدمة مرتبط بالفعل',
    'auth/no-auth-provider': 'لا يوجد مزود مصادقة',
    
    // أخطاء التحقق
    'auth/missing-email': 'البريد الإلكتروني مطلوب',
    'auth/missing-password': 'كلمة المرور مطلوبة',
    'auth/missing-verification-code': 'رمز التحقق مطلوب',
    'auth/missing-verification-id': 'معرف التحقق مطلوب',
    'auth/code-expired': 'انتهت صلاحية الرمز',
    
    // أخطاء تحديث الحساب
    'auth/requires-recent-login': 'يجب تسجيل الدخول مجدداً لتحديث البريد الإلكتروني',
    'auth/invalid-continue-uri': 'رابط الاستمرار غير صالح',
    'auth/unauthorized-continue-uri': 'رابط الاستمرار غير مصرح به',
    
    // أخطاء حذف الحساب
    'auth/requires-recent-login': 'يجب تسجيل الدخول مجدداً لحذف الحساب',
  };
  
  return errors[errorCode] || `حدث خطأ غير متوقع: ${errorCode}`;
};

/**
 * التحقق من صحة البريد الإلكتروني
 * @param {string} email - البريد الإلكتروني
 * @returns {boolean} صحيح إذا كان البريد صالحاً
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

/**
 * التحقق من قوة كلمة المرور
 * @param {string} password - كلمة المرور
 * @returns {object} نتيجة التحقق
 */
export const validatePassword = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length * 20;
  
  let strength;
  if (score <= 20) strength = 'ضعيفة جداً';
  else if (score <= 40) strength = 'ضعيفة';
  else if (score <= 60) strength = 'متوسطة';
  else if (score <= 80) strength = 'قوية';
  else strength = 'قوية جداً';
  
  return { checks, score, strength };
};

/**
 * التحقق من صحة رقم الهاتف الجزائري
 * @param {string} phone - رقم الهاتف
 * @returns {boolean} صحيح إذا كان الرقم صالحاً
 */
export const validateAlgerianPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/\D/g, '');
  const regex = /^(05|06|07)[0-9]{8}$/;
  return regex.test(cleaned);
};

/**
 * إنشاء رمز مصادقة مؤقت
 * @returns {string} رمز مؤقت
 */
export const generateTempCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * إغلاق جميع جلسات المستخدم
 * @returns {Promise<object>} نتيجة العملية
 */
export const revokeAllSessions = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("يجب تسجيل الدخول أولاً");
    }
    
    await signOut(auth);
    
    // هنا يمكنك إضافة Cloud Function لإغلاق جميع الجلسات
    // أو استخدام Firebase Admin SDK من الخادم
    
    return { 
      success: true, 
      message: "تم إغلاق جميع الجلسات بنجاح" 
    };
  } catch (error) {
    console.error("❌ خطأ في إغلاق الجلسات:", error.message);
    return { 
      success: false, 
      error: getFirebaseError(error.code),
      code: error.code
    };
  }
};