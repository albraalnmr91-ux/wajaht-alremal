const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query, get, run } = require('../db/database');
const { requireAdminAuth } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

// دالة مساعدة لتنظيف النصوص وتوليد الرابط الدائم (Slug)
function cleanStr(input, maxLen = 250) {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

function makeSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || ('item-' + Date.now());
}

// ----------------------------------------------------
// مسارات المصادقة وتسجيل الدخول
// ----------------------------------------------------

// تسجيل الدخول مع حماية ضد القوة الغاشمة
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال اسم المستخدم وكلمة المرور.'
      });
    }

    // استعلام مجهز للبحث عن المشرف
    const admin = await get('SELECT id, username, password_hash FROM admins WHERE username = ?', [username.trim()]);

    if (!admin) {
      // رسالة موحدة لمنع استكشاف أسماء المستخدمين (User Enumeration Defense)
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة.'
      });
    }

    // مطابقة التجزئة المشفرة لكلمة المرور عبر bcrypt
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة.'
      });
    }

    // تسجيل الجلسة في المتصفح
    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح.',
      user: {
        username: admin.username
      }
    });
  } catch (error) {
    console.error('خطأ تسجيل الدخول:', error.message);
    res.status(500).json({
      success: false,
      message: 'تعذر إتمام عملية الدخول في الوقت الحالي.'
    });
  }
});

// التحقق من حالة الجلسة الحالية
router.get('/me', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.json({
      authenticated: true,
      user: {
        id: req.session.adminId,
        username: req.session.adminUsername
      }
    });
  }
  return res.json({ authenticated: false });
});

// تسجيل الخروج وإتلاف الجلسة
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'تعذر إنهاء الجلسة.' });
    }
    res.clearCookie('remal_sid');
    res.json({ success: true, message: 'تم تسجيل الخروج بنجاح.' });
  });
});

// ----------------------------------------------------
// كل المسارات التالية تتطلب مصادقة المشرف
// ----------------------------------------------------
router.use(requireAdminAuth);

// إحصائيات لوحة التحكم
router.get('/stats', async (req, res) => {
  try {
    const totalCategories = await get('SELECT COUNT(*) as count FROM categories');
    const totalBrands = await get('SELECT COUNT(*) as count FROM brands');
    const totalInquiries = await get('SELECT COUNT(*) as count FROM inquiries');
    const newInquiries = await get('SELECT COUNT(*) as count FROM inquiries WHERE status = ?', ['new']);

    const recentInquiries = await query(
      'SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 10'
    );

    res.json({
      success: true,
      stats: {
        categories: totalCategories.count,
        brands: totalBrands.count,
        totalInquiries: totalInquiries.count,
        newInquiries: newInquiries.count
      },
      recentInquiries
    });
  } catch (error) {
    console.error('خطأ جلب الإحصائيات:', error.message);
    res.status(500).json({ success: false, message: 'تعذر جلب الإحصائيات.' });
  }
});

// ----------------------------------------------------
// إدارة أقسام قطع الغيار (Categories CRUD)
// ----------------------------------------------------

// جلب جميع الأقسام للإدارة
router.get('/categories', async (req, res) => {
  try {
    const categories = await query('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في جلب الأقسام.' });
  }
});

// إضافة قسم جديد
router.post('/categories', async (req, res) => {
  try {
    const name_ar = cleanStr(req.body.name_ar, 100);
    const name_en = cleanStr(req.body.name_en, 100);
    const icon = cleanStr(req.body.icon, 50) || 'fa-cogs';
    const image_url = cleanStr(req.body.image_url, 400);
    const description_ar = cleanStr(req.body.description_ar, 400);
    const description_en = cleanStr(req.body.description_en, 400);
    const sort_order = parseInt(req.body.sort_order, 10) || 0;
    const is_active = req.body.is_active === 0 || req.body.is_active === false ? 0 : 1;

    if (!name_ar || !name_en) {
      return res.status(400).json({ success: false, message: 'اسم القسم بالعربية والإنجليزية مطلوب.' });
    }

    const slug = cleanStr(req.body.slug, 80) || makeSlug(name_en);

    const result = await run(
      `INSERT INTO categories (name_ar, name_en, slug, icon, image_url, description_ar, description_en, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name_ar, name_en, slug, icon, image_url, description_ar, description_en, sort_order, is_active]
    );

    res.status(201).json({
      success: true,
      message: 'تمت إضافة القسم بنجاح.',
      categoryId: result.lastID
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed: categories.slug')) {
      return res.status(400).json({ success: false, message: 'المعرّف اللطيف (Slug) مستخدم بالفعل.' });
    }
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء حفظ القسم.' });
  }
});

// تحديث قسم قائم
router.put('/categories/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    const name_ar = cleanStr(req.body.name_ar, 100);
    const name_en = cleanStr(req.body.name_en, 100);
    const icon = cleanStr(req.body.icon, 50) || 'fa-cogs';
    const image_url = cleanStr(req.body.image_url, 400);
    const description_ar = cleanStr(req.body.description_ar, 400);
    const description_en = cleanStr(req.body.description_en, 400);
    const sort_order = parseInt(req.body.sort_order, 10) || 0;
    const is_active = req.body.is_active === 0 || req.body.is_active === false ? 0 : 1;

    if (!name_ar || !name_en) {
      return res.status(400).json({ success: false, message: 'اسم القسم بالعربية والإنجليزية مطلوب.' });
    }

    const slug = cleanStr(req.body.slug, 80) || makeSlug(name_en);

    const result = await run(
      `UPDATE categories 
       SET name_ar = ?, name_en = ?, slug = ?, icon = ?, image_url = ?, description_ar = ?, description_en = ?, sort_order = ?, is_active = ?
       WHERE id = ?`,
      [name_ar, name_en, slug, icon, image_url, description_ar, description_en, sort_order, is_active, categoryId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'القسم غير موجود.' });
    }

    res.json({ success: true, message: 'تم تحديث بيانات القسم بنجاح.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء تعديل القسم.' });
  }
});

// حذف قسم
router.delete('/categories/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id, 10);
    const result = await run('DELETE FROM categories WHERE id = ?', [categoryId]);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'القسم المطلوب غير موجود.' });
    }

    res.json({ success: true, message: 'تم حذف القسم بنجاح.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'فشل حذف القسم.' });
  }
});

// ----------------------------------------------------
// إدارة العلامات التجارية (Brands CRUD)
// ----------------------------------------------------

// جلب جميع العلامات التجارية للإدارة
router.get('/brands', async (req, res) => {
  try {
    const brands = await query('SELECT * FROM brands ORDER BY sort_order ASC, id ASC');
    res.json({ success: true, data: brands });
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في جلب العلامات التجارية.' });
  }
});

// إضافة علامة تجارية
router.post('/brands', async (req, res) => {
  try {
    const name_ar = cleanStr(req.body.name_ar, 100);
    const name_en = cleanStr(req.body.name_en, 100);
    let logo_url = cleanStr(req.body.logo_url, 400);
    const origin_ar = cleanStr(req.body.origin_ar, 50);
    const origin_en = cleanStr(req.body.origin_en, 50);
    const category = cleanStr(req.body.category, 50) || 'american';
    const sort_order = parseInt(req.body.sort_order, 10) || 0;
    const is_active = req.body.is_active === 0 || req.body.is_active === false ? 0 : 1;

    if (!name_ar || !name_en) {
      return res.status(400).json({ success: false, message: 'اسم الشركة المصنعة مطلوب باللغتين.' });
    }

    const slug = cleanStr(req.body.slug, 80) || makeSlug(name_en);
    if (logo_url) {
      logo_url = logo_url.replace(/\.svg$/i, '.png');
    } else {
      logo_url = `/images/brands/${slug}.png`;
    }

    const result = await run(
      `INSERT INTO brands (name_ar, name_en, slug, logo_url, origin_ar, origin_en, category, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name_ar, name_en, slug, logo_url, origin_ar, origin_en, category, sort_order, is_active]
    );

    res.status(201).json({
      success: true,
      message: 'تمت إضافة العلامة التجارية بنجاح.',
      brandId: result.lastID
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed: brands.slug')) {
      return res.status(400).json({ success: false, message: 'المعرّف اللطيف للعلامة مستخدم بالفعل.' });
    }
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء حفظ العلامة التجارية.' });
  }
});

// تعديل علامة تجارية
router.put('/brands/:id', async (req, res) => {
  try {
    const brandId = parseInt(req.params.id, 10);
    const name_ar = cleanStr(req.body.name_ar, 100);
    const name_en = cleanStr(req.body.name_en, 100);
    let logo_url = cleanStr(req.body.logo_url, 400);
    const origin_ar = cleanStr(req.body.origin_ar, 50);
    const origin_en = cleanStr(req.body.origin_en, 50);
    const category = cleanStr(req.body.category, 50) || 'american';
    const sort_order = parseInt(req.body.sort_order, 10) || 0;
    const is_active = req.body.is_active === 0 || req.body.is_active === false ? 0 : 1;

    if (!name_ar || !name_en) {
      return res.status(400).json({ success: false, message: 'اسم الشركة المصنعة مطلوب باللغتين.' });
    }

    const slug = cleanStr(req.body.slug, 80) || makeSlug(name_en);
    if (logo_url) {
      logo_url = logo_url.replace(/\.svg$/i, '.png');
    } else {
      logo_url = `/images/brands/${slug}.png`;
    }

    const result = await run(
      `UPDATE brands 
       SET name_ar = ?, name_en = ?, slug = ?, logo_url = ?, origin_ar = ?, origin_en = ?, category = ?, sort_order = ?, is_active = ?
       WHERE id = ?`,
      [name_ar, name_en, slug, logo_url, origin_ar, origin_en, category, sort_order, is_active, brandId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'العلامة التجارية غير موجودة.' });
    }

    res.json({ success: true, message: 'تم تحديث العلامة التجارية بنجاح.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'فشل تعديل العلامة التجارية.' });
  }
});

// حذف علامة تجارية
router.delete('/brands/:id', async (req, res) => {
  try {
    const brandId = parseInt(req.params.id, 10);
    const result = await run('DELETE FROM brands WHERE id = ?', [brandId]);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'العلامة التجارية غير موجودة.' });
    }

    res.json({ success: true, message: 'تم حذف العلامة التجارية بنجاح.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'فشل حذف العلامة التجارية.' });
  }
});

// ----------------------------------------------------
// إدارة الطلبات والاستفسارات
// ----------------------------------------------------
router.patch('/inquiries/:id/status', async (req, res) => {
  try {
    const inquiryId = parseInt(req.params.id, 10);
    const status = cleanStr(req.body.status, 20);

    const validStatuses = ['new', 'contacted', 'completed', 'canceled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'حالة الطلب غير صالحة.' });
    }

    await run('UPDATE inquiries SET status = ? WHERE id = ?', [status, inquiryId]);
    res.json({ success: true, message: 'تم تحديث حالة الطلب.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'تعذر تعديل حالة الطلب.' });
  }
});

router.delete('/inquiries/:id', async (req, res) => {
  try {
    const inquiryId = parseInt(req.params.id, 10);
    await run('DELETE FROM inquiries WHERE id = ?', [inquiryId]);
    res.json({ success: true, message: 'تم حذف الطلب.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'تعذر حذف الطلب.' });
  }
});

module.exports = router;
