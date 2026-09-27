// src/app/robots.js
// Next.js يولّد تلقائياً /robots.txt من هذا الملف
// يقول لمحركات البحث: افهرس الصفحات العمومية، وما تفهرسش لوحات التحكم/الدفع

export default function robots() {
  const baseUrl = "https://darsnadz.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/payment",
          "/waiting-verification",
          "/subscription-expired",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}