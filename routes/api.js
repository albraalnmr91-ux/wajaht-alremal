const express = require('express');
const router = express.Router();
const { query, run } = require('../db/database');
const { inquiryLimiter } = require('../middleware/rateLimiter');

// دالة لتطهير النصوص من أي وسوم ضارة
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 500); // تحديد الحد الأقصى للأمان
}

// جلب أقسام قطع الغيار النشطة
router.get('/categories', async (req, res) => {
  try {
    const categories = await query(
      `SELECT id, name_ar, name_en, slug, icon, image_url, description_ar, description_en, sort_order 
       FROM categories 
       WHERE is_active = 1 
       ORDER BY sort_order ASC, id ASC`
    );

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('فشل جلب الأقسام:', error.message);
    res.status(500).json({
      success: false,
      message: 'تعذر تحميل أقسام قطع الغيار حالياً.'
    });
  }
});

// جلب العلامات التجارية المتاحة
router.get('/brands', async (req, res) => {
  try {
    const brands = await query(
      `SELECT id, name_ar, name_en, slug, logo_url, origin_ar, origin_en, category, sort_order 
       FROM brands 
       WHERE is_active = 1 
       ORDER BY sort_order ASC, id ASC`
    );

    res.json({
      success: true,
      data: brands
    });
  } catch (error) {
    console.error('فشل جلب العلامات التجارية:', error.message);
    res.status(500).json({
      success: false,
      message: 'تعذر تحميل العلامات التجارية حالياً.'
    });
  }
});

// بيانات الشركة ورقم الواتساب الرسمي
router.get('/company-info', (req, res) => {
  res.json({
    success: true,
    data: {
      name_ar: 'شركة واجهة الرمال لقطع غيار السيارات',
      name_en: 'Wajaht Al-Remal Auto Parts Co.',
      whatsapp: process.env.WHATSAPP_NUMBER || '966508576768',
      phone: process.env.COMPANY_PHONE || '+966508576768',
      email: process.env.COMPANY_EMAIL || 'Wjh.remal@gmail.com',
      location_ar: 'السعودية، الرياض، حي الرمال الصناعية',
      location_en: 'Saudi Arabia, Riyadh, Al-Remal Industrial Area',
      working_hours_ar: 'السبت - الخميس: 9:00 ص - 10:00 م | الجمعة: 10:00 ص - 9:00 م',
      working_hours_en: 'Sat - Thu: 9:00 AM - 10:00 PM | Fri: 10:00 AM - 9:00 PM'
    }
  });
});

// استقبال طلب تسعير أو استفسار جديد مع التطهير والحد من التكرار
router.post('/inquiry', inquiryLimiter, async (req, res) => {
  try {
    const customer_name = sanitizeText(req.body.customer_name);
    const customer_phone = sanitizeText(req.body.customer_phone);
    const car_make = sanitizeText(req.body.car_make);
    const car_model = sanitizeText(req.body.car_model);
    const car_year = sanitizeText(req.body.car_year);
    const vin_number = sanitizeText(req.body.vin_number);
    const part_name = sanitizeText(req.body.part_name);
    const notes = sanitizeText(req.body.notes);

    // التحقق من الحقول الإجبارية
    if (!customer_name || !customer_phone || !part_name) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تزويدنا بالاسم ورقم الجوال والقطعة المطلوبة.'
      });
    }

    // إدخال آمن باستخدام استعلام مجهز
    const result = await run(
      `INSERT INTO inquiries (customer_name, customer_phone, car_make, car_model, car_year, vin_number, part_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_name, customer_phone, car_make, car_model, car_year, vin_number, part_name, notes]
    );

    // توليد رسالة واتساب جاهزة مباشرة لتسهيل تواصل العميل
    const targetPhone = process.env.WHATSAPP_NUMBER || '966508576768';
    const waText = encodeURIComponent(
      `مرحباً شركة واجهة الرمال لقطع غيار السيارات 🚗\n` +
      `أود الاستفسار عن توفر قطعة غيار:\n` +
      `الاسم: ${customer_name}\n` +
      `الجوال: ${customer_phone}\n` +
      `القطعة: ${part_name}\n` +
      (car_make ? `نوع السيارة: ${car_make} ${car_model || ''} موديل ${car_year || ''}\n` : '') +
      (vin_number ? `رقم الهيكل (VIN): ${vin_number}\n` : '') +
      (notes ? `ملاحظات: ${notes}` : '')
    );

    const whatsappUrl = `https://wa.me/${targetPhone}?text=${waText}`;

    res.status(201).json({
      success: true,
      message: 'تم استلام طلبكم بنجاح وسيتواصل معكم فريق المبيعات فوراً.',
      inquiryId: result.lastID,
      whatsappUrl
    });
  } catch (error) {
    console.error('خطأ حفظ طلب التسعير:', error.message);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء معالجة الطلب. يرجى المحاولة لاحقاً.'
    });
  }
});

module.exports = router;
