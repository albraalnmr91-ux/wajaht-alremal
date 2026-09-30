const rateLimit = require('express-rate-limit');

// محدد معدل الطلبات للواجهات البرمجية العامة
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 150, // أقصى حد 150 طلب لكل IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة بعد قليل.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

// محدد تسجيل الدخول
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 50, // 50 محاولة لكل IP
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم حظر محاولات الدخول مؤقتاً بسبب تجاوز الحد المسموح. يرجى الانتظار 15 دقيقة.',
    code: 'TOO_MANY_LOGIN_ATTEMPTS'
  }
});

// محدد إرسال طلبات التسعير لمنع السبام
const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ساعة
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم تجاوز حد إرسال الطلبات للساعة الحالية.',
    code: 'INQUIRY_LIMIT_EXCEEDED'
  }
});

module.exports = {
  apiLimiter,
  loginLimiter,
  inquiryLimiter
};
