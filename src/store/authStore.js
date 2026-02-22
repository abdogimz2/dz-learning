// store/authStore.js
import { createUserDocument, getUserDocument } from "@/lib/firebase/firestore";
import { loginUser, registerUser } from "@/lib/firebase/auth";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      isAuthenticated: false,
      loading: false,
      error: null,
      success: null,
      user: null,

      // ─── LOGIN ─────────────────────────────────────────────
      login: async (email, password) => {
        set({ loading: true, error: null, success: null });

        try {
          const authResult = await loginUser(email, password);

          if (!authResult.success) {
            const errorMap = {
              "auth/user-not-found":    "البريد الإلكتروني غير مسجل",
              "auth/wrong-password":    "كلمة المرور غير صحيحة",
              "auth/invalid-credential":"البريد أو كلمة المرور غير صحيحة",
              "auth/too-many-requests": "محاولات كثيرة. حاول لاحقاً",
              "auth/user-disabled":     "الحساب معطل",
            };
            throw new Error(errorMap[authResult.code] || authResult.error || "فشل في تسجيل الدخول");
          }

          const userDataResult = await getUserDocument(authResult.user.uid);
          if (!userDataResult.success) {
            throw new Error(userDataResult.error || "فشل في جلب بيانات المستخدم");
          }

          const userData = userDataResult.data;
          const sessionData = {
            id:           authResult.user.uid,
            uid:          authResult.user.uid,
            email:        authResult.user.email,
            name:         userData.name,
            surname:      userData.surname,
            photoURL:     authResult.user.photoURL || `https://ui-avatars.com/api/?name=${userData.name}+${userData.surname}&background=3a26a8&color=fff`,
            role:         userData.role || "student",
            level:        userData.level,
            status:       userData.status,
            points:       userData.points || 0,
            paymentStatus:userData.paymentStatus,
            phone:        userData.phone,
            wilaya:       userData.wilaya,
            specialty:    userData.specialty,
            subSpecialty: userData.subSpecialty,
            branchType:   userData.branchType,
            year:         userData.year,
            thirdLanguage:userData.thirdLanguage,
            lastLogin:    new Date().toISOString(),
          };

          set({
            isAuthenticated: true,
            user: sessionData,
            loading: false,
            success: `مرحباً بعودتك ${userData.name}!`,
          });

          return { success: true, user: sessionData };
        } catch (error) {
          set({ loading: false, error: error.message, success: null });
          return { success: false, error: error.message };
        }
      },

      // ─── REGISTER ──────────────────────────────────────────
      register: async (userData) => {
        set({ loading: true, error: null, success: null });

        try {
          const authResult = await registerUser(userData.email, userData.password, {
            name: userData.name,
            surname: userData.surname,
          });

          if (!authResult.success) {
            if (authResult.code === "auth/email-already-in-use")
              throw new Error("البريد الإلكتروني مستخدم بالفعل");
            throw new Error(authResult.error || "فشل في إنشاء الحساب");
          }

          const userId = authResult.user.uid;
          const { password, confirmPassword, ...safeUserData } = userData;

          const firestoreResult = await createUserDocument(userId, {
            ...safeUserData,
            id:            userId,
            uid:           userId,
            createdAt:     new Date().toISOString(),
            status:        "pending",
            role:          "student",
            points:        0,
            paymentStatus: "pending",
            isActive:      false,
          });

          if (!firestoreResult.success)
            throw new Error(firestoreResult.error || "فشل في تخزين بيانات المستخدم");

          const storeUser = {
            id:           userId,
            uid:          userId,
            name:         userData.name,
            surname:      userData.surname,
            email:        userData.email,
            phone:        userData.phone,
            wilaya:       userData.wilaya,
            level:        userData.level,
            year:         userData.year,
            branchType:   userData.branchType,
            specialty:    userData.specialty,
            subSpecialty: userData.subSpecialty,
            thirdLanguage:userData.thirdLanguage,
            status:       "pending",
            role:         "student",
            paymentStatus:"pending",
          };

          set({
            loading: false,
            success: "تم إنشاء الحساب بنجاح",
            user: storeUser,
            isAuthenticated: true,
          });

          return { success: true, userId };
        } catch (error) {
          set({ loading: false, error: error.message, success: null });
          return { success: false, error: error.message };
        }
      },

      // ─── LOGOUT ────────────────────────────────────────────
      logout: async () => {
        try {
          const { logoutUser } = await import("@/lib/firebase/auth");
          await logoutUser();
        } catch (e) {
          console.warn("Firebase logout:", e.message);
        }
        set({ isAuthenticated: false, user: null, error: null, success: null });
      },

      // ─── HELPERS ───────────────────────────────────────────
      clearError:   () => set({ error: null }),
      clearSuccess: () => set({ success: null }),
      setUser:      (u) => set({ user: u, isAuthenticated: true }),
      setLoading:   (l) => set({ loading: l }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      // ✅ نحفظ فقط isAuthenticated و user
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
      // ✅ onRehydrateStorage لمعرفة متى اكتمل التحميل
      onRehydrateStorage: () => (state) => {
        console.log("✅ Zustand rehydrated:", state?.user?.email);
      },
    }
  )
);