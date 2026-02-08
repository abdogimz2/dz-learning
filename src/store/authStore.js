// store/authStore.js
import {
  createUserDocument,
  getUserDocument,
  loginUser,
  registerUser,
} from "@/lib/firebase";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create(
    (set, get) => ({
      // Authentication state
      isAuthenticated: false,
      loading: false,
      error: null,
      success: null,

      // User details
      user: null,

      // Update the login action in authStore.js
      login: async (email, password) => {
        set({ loading: true, error: null, success: null });

        try {
          // Call your Firebase login function
          const authResult = await loginUser(email, password);

          if (!authResult.success) {
            // Handle specific Firebase errors
            if (authResult.code === "auth/user-not-found") {
              throw new Error("المستخدم غير موجود");
            } else if (authResult.code === "auth/wrong-password") {
              throw new Error("كلمة المرور غير صحيحة");
            } else if (authResult.code === "auth/too-many-requests") {
              throw new Error("محاولات تسجيل دخول كثيرة. حاول لاحقاً");
            } else if (authResult.code === "auth/user-disabled") {
              throw new Error("الحساب معطل");
            }
            throw new Error(authResult.error || "فشل في تسجيل الدخول");
          }

          console.log(
            "✅ تم تسجيل الدخول في Firebase Auth:",
            authResult.user.uid
          );

          // Get user document from Firestore
          const userDataResult = await getUserDocument(authResult.user.uid);

          if (!userDataResult.success) {
            throw new Error(
              userDataResult.error || "فشل في جلب بيانات المستخدم"
            );
          }

          const userData = userDataResult.data;
          console.log("📊 بيانات المستخدم من Firestore:", userData);

          // Create session data
          const sessionData = {
            id: authResult.user.uid,
            uid: authResult.user.uid,
            userId: authResult.user.uid,
            email: authResult.user.email,
            name: userData.name,
            surname: userData.surname,
            photoURL:
              authResult.user.photoURL ||
              `https://ui-avatars.com/api/?name=${userData.name}+${userData.surname}`,
            role: userData.role || "student",
            level: userData.level,
            status: userData.status,
            points: userData.points || 0,
            subscriptionType: userData.subscriptionType,
            paymentStatus: userData.paymentStatus,
            lastLogin: new Date().toISOString(),
            // Include other relevant fields
            phone: userData.phone,
            wilaya: userData.wilaya,
            specialty: userData.specialty,
            branchType: userData.branchType,
            year: userData.year,
          };

          // Update state
          set({
            isAuthenticated: true,
            user: sessionData,
            loading: false,
            success: `مرحباً بعودتك ${userData.name}!`,
          });

          return { success: true, user: sessionData };
        } catch (error) {
          console.error("❌ خطأ في تسجيل الدخول:", error);

          // تحسين رسائل الخطأ
          let errorMessage =
            error.message || "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى";

          if (error.message.includes("المستخدم غير موجود")) {
            errorMessage = "البريد الإلكتروني غير مسجل. يرجى إنشاء حساب جديد";
          } else if (error.message.includes("كلمة المرور غير صحيحة")) {
            errorMessage = "كلمة المرور غير صحيحة. حاول مرة أخرى";
          } else if (error.message.includes("كثيراً")) {
            errorMessage = "محاولات تسجيل دخول كثيرة. حاول لاحقاً";
          } else if (error.message.includes("معطل")) {
            errorMessage = "حسابك معطل. يرجى التواصل مع الدعم الفني";
          }

          set({
            loading: false,
            error: errorMessage,
            success: null,
          });
          return { success: false, error: errorMessage };
        }
      },

      // Update the register action in authStore.js
      // Update the register action in authStore.js
      register: async (userData) => {
        set({ loading: true, error: null, success: null });

        try {
          // Call your Firebase register function
          const authResult = await registerUser(
            userData.email,
            userData.password,
            {
              name: userData.name,
              surname: userData.surname,
            }
          );

          if (!authResult.success) {
            if (authResult.code === "auth/email-already-in-use") {
              throw new Error("البريد الإلكتروني مستخدم بالفعل");
            }
            throw new Error(authResult.error || "فشل في إنشاء الحساب");
          }

          const userId = authResult.user.uid;

          // Prepare data for Firestore
          const { password, confirmPassword, ...safeUserData } = userData;

          const userDocument = {
            ...safeUserData,
            id: userId, // Make sure id is set
            uid: userId, // Also set uid for compatibility
            userId: userId, // And userId for compatibility
            createdAt: new Date().toISOString(),
            status: "pending",
            role: "student",
            points: 0,
            emailVerified: false,
            lastLogin: null,
            subscriptionType: "pending_payment",
            paymentStatus: "pending",
            isActive: false,
          };

          // Store in Firestore
          const firestoreResult = await createUserDocument(
            userId,
            userDocument
          );

          if (!firestoreResult.success) {
            throw new Error(
              firestoreResult.error || "فشل في تخزين بيانات المستخدم"
            );
          }

          // Set user in Zustand store with ALL fields needed for payment
          const storeUserData = {
            id: userId,
            uid: userId,
            userId: userId,
            name: userData.name,
            surname: userData.surname,
            email: userData.email,
            phone: userData.phone,
            wilaya: userData.wilaya,
            level: userData.level,
            year: userData.year,
            branchType: userData.branchType,
            specialty: userData.specialty,
            subSpecialty: userData.subSpecialty,
            thirdLanguage: userData.thirdLanguage,
            status: "pending",
            role: "student",
            paymentStatus: "pending",
          };

          set({
            loading: false,
            success: "تم إنشاء الحساب بنجاح",
            user: storeUserData,
          });

          // Also store in localStorage for backward compatibility
          localStorage.setItem(
            "temp_user_data",
            JSON.stringify({
              userId: userId,
              id: userId,
              uid: userId,
              name: userData.name,
              surname: userData.surname,
              email: userData.email,
              phone: userData.phone,
              wilaya: userData.wilaya,
              level: userData.level,
              year: userData.year,
              branchType: userData.branchType,
              specialty: userData.specialty,
              subSpecialty: userData.subSpecialty,
              thirdLanguage: userData.thirdLanguage,
            })
          );

          return { success: true, userId };
        } catch (error) {
          set({
            loading: false,
            error: error.message,
            success: null,
          });
          return { success: false, error: error.message };
        }
      },

      // Logout action
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          error: null,
          success: "تم تسجيل الخروج بنجاح",
        });
      },

      // Clear errors
      clearError: () => set({ error: null }),

      // Clear success
      clearSuccess: () => set({ success: null }),

      // Set user data
      setUser: (userData) => set({ user: userData, isAuthenticated: true }),

      // Update loading state
      setLoading: (loading) => set({ loading }),
    })
);
