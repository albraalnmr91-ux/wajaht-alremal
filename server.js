require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');

const { initDatabase } = require('./db/database');
const { apiLimiter } = require('./middleware/rateLimiter');
const { requireAdminAuth } = require('./middleware/auth');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// تمكين trust proxy لدعم أنفاق الاتصال العامة والبروكسي العكسي
app.set('trust proxy', 1);

// ----------------------------------------------------
// التدابير الأمنية ورؤوس الحماية (Helmet Security Headers)
// ----------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // مطلوب لتهيئة Tailwind CDN و i18n
          "https://cdn.tailwindcss.com",
          "https://cdnjs.cloudflare.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://images.unsplash.com",
          "https://www.carlogos.org",
          "https://via.placeholder.com"
        ],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// تعطيل الكشف عن تقنية الخادم
app.disable('x-powered-by');

// سياسة مشاركة الموارد (CORS)
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

// تحليل محتوى الطلبات مع ضبط الحد الأقصى للحجم لمنع هجمات حجب الخدمة
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ----------------------------------------------------
// إعداد جلسات المشرف الآمنة (Secure Session)
// ----------------------------------------------------
app.use(
  session({
    name: 'remal_sid',
    secret: process.env.SESSION_SECRET || 'remal_fallback_secret_key_8492041284',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // صلاحية يوم واحد
    }
  })
);

// خدمة الملفات الثابتة
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------
// توجيه صفحات الويب
// ----------------------------------------------------

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// صفحة تسجيل دخول الإدارة
app.get('/admin/login', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

// لوحة تحكم الإدارة (محمية بواسطة requireAdminAuth)
app.get('/admin/dashboard', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

// اختصار مسار الإدارة
app.get('/admin', (req, res) => {
  res.redirect('/admin/dashboard');
});

// ----------------------------------------------------
// مسارات واجهة البرمجة (APIs)
// ----------------------------------------------------
app.use('/api', apiLimiter, apiRoutes);
app.use('/api/admin', adminRoutes);

// ----------------------------------------------------
// معالجة الأخطاء والمسارات غير المعرفة (404 & Central Error Handler)
// ----------------------------------------------------
app.use((req, res) => {
  if (req.xhr || req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'المسار غير موجود.' });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// معالج الأخطاء العام دون تسريب تفاصيل التتبع في بيئة الإنتاج
app.use((err, req, res, next) => {
  console.error('خطأ غير معالج بالخادم:', err);
  res.status(err.status || 500).json({
    success: false,
    message: isProd ? 'حدث خطأ في النظام. يرجى المحاولة لاحقاً.' : err.message
  });
});

// ----------------------------------------------------
// بدء تشغيل الخادم
// ----------------------------------------------------
async function startServer() {
  await initDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 خادم واجهة الرمال لقطع غيار السيارات يعمل الآن بنجاح`);
    console.log(`🌐 الموقع الرئيسي: http://0.0.0.0:${PORT} (أو http://localhost:${PORT})`);
    console.log(`🔒 لوحة تحكم الإدارة: http://localhost:${PORT}/admin/login`);
    console.log(`====================================================`);
  });
}

startServer();
