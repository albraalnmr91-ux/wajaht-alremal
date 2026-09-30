const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// مسار حفظ ملف قاعدة البيانات
const dbDir = path.resolve(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'autoparts.db');

let query, get, run;

// فحص محرك SQLite المتاح
let isNodeSqlite = false;
try {
  const { DatabaseSync } = require('node:sqlite');
  const dbSync = new DatabaseSync(dbPath);
  dbSync.exec('PRAGMA journal_mode = WAL;');
  dbSync.exec('PRAGMA foreign_keys = ON;');
  isNodeSqlite = true;

  query = async (sql, params = []) => {
    const stmt = dbSync.prepare(sql);
    return stmt.all(...params);
  };

  get = async (sql, params = []) => {
    const stmt = dbSync.prepare(sql);
    return stmt.get(...params);
  };

  run = async (sql, params = []) => {
    const stmt = dbSync.prepare(sql);
    const result = stmt.run(...params);
    return { lastID: result.lastInsertRowid, changes: result.changes };
  };

  console.log('[DB] تم تفعيل محرك SQLite المدمج عالي الأداء (node:sqlite WAL mode).');
} catch (e) {
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('خطأ في فتح قاعدة البيانات:', err.message);
    else {
      db.run('PRAGMA journal_mode = WAL;');
      db.run('PRAGMA foreign_keys = ON;');
    }
  });

  query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };

  run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  };

  console.log('[DB] تم تفعيل محرك sqlite3 التقليدي.');
}

// قائمة الماركات العشرين المعتمدة بدقة حسب المتطلبات وتصنيفاتها
const officialBrands = [
  // 1. فئة (أمريكي) - 6 ماركات
  {
    name_ar: 'فورد',
    name_en: 'Ford',
    slug: 'ford',
    logo_url: '/images/brands/ford.png',
    origin_ar: 'أمريكي',
    origin_en: 'American',
    category: 'american',
    sort_order: 1
  },
  {
    name_ar: 'شيفروليه',
    name_en: 'Chevrolet',
    slug: 'chevrolet',
    logo_url: '/images/brands/chevrolet.png',
    origin_ar: 'أمريكي',
    origin_en: 'American',
    category: 'american',
    sort_order: 2
  },
  {
    name_ar: 'جي إم سي',
    name_en: 'GMC',
    slug: 'gmc',
    logo_url: '/images/brands/gmc.png',
    origin_ar: 'أمريكي',
    origin_en: 'American',
    category: 'american',
    sort_order: 3
  },
  {
    name_ar: 'كاديلاك',
    name_en: 'Cadillac',
    slug: 'cadillac',
    logo_url: '/images/brands/cadillac.png',
    origin_ar: 'أمريكي',
    origin_en: 'American',
    category: 'american',
    sort_order: 4
  },
  {
    name_ar: 'موتوركرافت',
    name_en: 'Motorcraft',
    slug: 'motorcraft',
    logo_url: '/images/brands/motorcraft.png',
    origin_ar: 'أمريكي',
    origin_en: 'American',
    category: 'american',
    sort_order: 5
  },
  {
    name_ar: 'إيه سي ديلكو',
    name_en: 'ACDelco',
    slug: 'acdelco',
    logo_url: '/images/brands/acdelco.png',
    origin_ar: 'أمريكي',
    origin_en: 'American',
    category: 'american',
    sort_order: 6
  },

  // 2. فئة (ياباني وكوري) - 8 ماركات
  {
    name_ar: 'تويوتا',
    name_en: 'Toyota',
    slug: 'toyota',
    logo_url: '/images/brands/toyota.png',
    origin_ar: 'ياباني',
    origin_en: 'Japanese',
    category: 'japanese-korean',
    sort_order: 7
  },
  {
    name_ar: 'نيسان',
    name_en: 'Nissan',
    slug: 'nissan',
    logo_url: '/images/brands/nissan.png',
    origin_ar: 'ياباني',
    origin_en: 'Japanese',
    category: 'japanese-korean',
    sort_order: 8
  },
  {
    name_ar: 'هوندا',
    name_en: 'Honda',
    slug: 'honda',
    logo_url: '/images/brands/honda.png',
    origin_ar: 'ياباني',
    origin_en: 'Japanese',
    category: 'japanese-korean',
    sort_order: 9
  },
  {
    name_ar: 'مازدا',
    name_en: 'Mazda',
    slug: 'mazda',
    logo_url: '/images/brands/mazda.png',
    origin_ar: 'ياباني',
    origin_en: 'Japanese',
    category: 'japanese-korean',
    sort_order: 10
  },
  {
    name_ar: 'ميتسوبيشي',
    name_en: 'Mitsubishi',
    slug: 'mitsubishi',
    logo_url: '/images/brands/mitsubishi.png',
    origin_ar: 'ياباني',
    origin_en: 'Japanese',
    category: 'japanese-korean',
    sort_order: 11
  },
  {
    name_ar: 'لكزس',
    name_en: 'Lexus',
    slug: 'lexus',
    logo_url: '/images/brands/lexus.png',
    origin_ar: 'ياباني',
    origin_en: 'Japanese',
    category: 'japanese-korean',
    sort_order: 12
  },
  {
    name_ar: 'هيونداي',
    name_en: 'Hyundai',
    slug: 'hyundai',
    logo_url: '/images/brands/hyundai.png',
    origin_ar: 'كوري',
    origin_en: 'Korean',
    category: 'japanese-korean',
    sort_order: 13
  },
  {
    name_ar: 'كيا',
    name_en: 'Kia',
    slug: 'kia',
    logo_url: '/images/brands/kia.png',
    origin_ar: 'كوري',
    origin_en: 'Korean',
    category: 'japanese-korean',
    sort_order: 14
  },

  // 3. فئة (صيني) - 6 ماركات
  {
    name_ar: 'شانجان',
    name_en: 'Changan',
    slug: 'changan',
    logo_url: '/images/brands/changan.png',
    origin_ar: 'صيني',
    origin_en: 'Chinese',
    category: 'chinese',
    sort_order: 15
  },
  {
    name_ar: 'جيلي',
    name_en: 'Geely',
    slug: 'geely',
    logo_url: '/images/brands/geely.png',
    origin_ar: 'صيني',
    origin_en: 'Chinese',
    category: 'chinese',
    sort_order: 16
  },
  {
    name_ar: 'هافال',
    name_en: 'Haval',
    slug: 'haval',
    logo_url: '/images/brands/haval.png',
    origin_ar: 'صيني',
    origin_en: 'Chinese',
    category: 'chinese',
    sort_order: 17
  },
  {
    name_ar: 'إم جي',
    name_en: 'MG',
    slug: 'mg',
    logo_url: '/images/brands/mg.png',
    origin_ar: 'صيني',
    origin_en: 'Chinese',
    category: 'chinese',
    sort_order: 18
  },
  {
    name_ar: 'شيري',
    name_en: 'Chery',
    slug: 'chery',
    logo_url: '/images/brands/chery.png',
    origin_ar: 'صيني',
    origin_en: 'Chinese',
    category: 'chinese',
    sort_order: 19
  },
  {
    name_ar: 'بي واي دي',
    name_en: 'BYD',
    slug: 'byd',
    logo_url: '/images/brands/byd.png',
    origin_ar: 'صيني',
    origin_en: 'Chinese',
    category: 'chinese',
    sort_order: 20
  }
];

// قائمة الأقسام الرسمية مع مسارات الصور المحلية
const officialCategories = [
  {
    name_ar: 'المحركات ومكوناتها',
    name_en: 'Engines & Components',
    slug: 'engines-and-components',
    icon: 'fa-gears',
    image_url: '/images/categories/engine.jpg',
    desc_ar: 'بساتم، سبايك، طرمبات زيت وماء، وجيه رأس، وسيور توقيت وسير مكينة كامل.',
    desc_en: 'Pistons, engine bearings, oil/water pumps, head gaskets, and timing belts.',
    sort_order: 1
  },
  {
    name_ar: 'منظومة الفرامل والمكابح',
    name_en: 'Brake System',
    slug: 'brake-system',
    icon: 'fa-circle-stop',
    image_url: '/images/categories/brakes.jpg',
    desc_ar: 'أقمشة فرامل سيراميك، هوبات أصلية ومخرمة، كليبرات، وليات باكم متطورة.',
    desc_en: 'Ceramic brake pads, OEM/drilled rotors, calipers, and vacuum brake boosters.',
    sort_order: 2
  },
  {
    name_ar: 'المساعدات ونظام التعليق',
    name_en: 'Suspension & Shocks',
    slug: 'suspension-shocks',
    icon: 'fa-shield-halved',
    image_url: '/images/categories/suspension.jpg',
    desc_ar: 'مساعدات هيدروليك وهوائية، مقصات، أذرعة دركسون، وجلود عكوس.',
    desc_en: 'Hydraulic and air shock absorbers, control arms, tie rods, and CV boots.',
    sort_order: 3
  },
  {
    name_ar: 'الفلاتر والزيوت وسوائل التشغيل',
    name_en: 'Filters & Lubricants',
    slug: 'filters-and-lubricants',
    icon: 'fa-filter',
    image_url: '/images/categories/filters.jpg',
    desc_ar: 'فلاتر زيت وهواء ومكيف، زيوت محركات تخليقية بالكامل وسوائل تبريد أصلية.',
    desc_en: 'Oil, air and cabin filters, full-synthetic motor oils, and genuine fluids.',
    sort_order: 4
  },
  {
    name_ar: 'الأنظمة الكهربائية والإضاءة',
    name_en: 'Electrical & Lighting',
    slug: 'electrical-and-lighting',
    icon: 'fa-bolt',
    image_url: '/images/categories/electrical.jpg',
    desc_ar: 'دينامو شحن، سلف تشغيل، بواجي ليزر إيريديوم، شمعات إضاءة LED وزنون.',
    desc_en: 'Alternators, starter motors, iridium laser spark plugs, and LED/Xenon headlights.',
    sort_order: 5
  },
  {
    name_ar: 'أجزاء الهيكل والبودي',
    name_en: 'Body & Exterior Parts',
    slug: 'body-exterior-parts',
    icon: 'fa-car-side',
    image_url: '/images/categories/body.jpg',
    desc_ar: 'صدامات، رفارف، كبوت، مرايا جانبية، وشبوك أمامية أصلية وتجارية.',
    desc_en: 'Bumpers, fenders, hoods, side mirrors, and OEM/aftermarket grilles.',
    sort_order: 6
  },
  {
    name_ar: 'نظام التبريد والتكييف',
    name_en: 'Cooling & AC System',
    slug: 'cooling-ac-system',
    icon: 'fa-snowflake',
    image_url: '/images/categories/cooling.jpg',
    desc_ar: 'كمبروسرات مكيف، رديترات ماء، ثلاجات مكيف، ومراوح تبريد عالية الكفاءة.',
    desc_en: 'AC compressors, radiators, evaporators, and high-efficiency cooling fans.',
    sort_order: 7
  },
  {
    name_ar: 'ناقل الحركة والدفرنس',
    name_en: 'Transmission & Drivetrain',
    slug: 'transmission-drivetrain',
    icon: 'fa-gears',
    image_url: '/images/categories/transmission.jpg',
    desc_ar: 'كلتشات كاملة، كراسي قير، طناجر قير، وعكوس دفع أمامي وخلفي ورباعي.',
    desc_en: 'Clutch kits, transmission mounts, torque converters, and drive shafts.',
    sort_order: 8
  }
];

// تهيئة الجداول والبيانات
async function initDatabase() {
  try {
    // جدول المشرفين
    await run(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // جدول أقسام قطع الغيار
    await run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        icon TEXT DEFAULT 'fa-cogs',
        image_url TEXT,
        description_ar TEXT,
        description_en TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // جدول العلامات التجارية
    await run(`
      CREATE TABLE IF NOT EXISTS brands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name_ar TEXT NOT NULL,
        name_en TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        logo_url TEXT,
        origin_ar TEXT,
        origin_en TEXT,
        category TEXT DEFAULT 'american',
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ترقية جدول العلامات التجارية لدعم حقل التصنيف category إذا لم يكن موجوداً
    try {
      await run('ALTER TABLE brands ADD COLUMN category TEXT DEFAULT "american"');
    } catch (e) {
      // الحقل موجود بالفعل
    }

    // جدول طلبات واستفسارات العملاء
    await run(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        car_make TEXT,
        car_model TEXT,
        car_year TEXT,
        vin_number TEXT,
        part_name TEXT NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // إنشاء حساب المشرف الافتراضي
    const defaultUser = process.env.ADMIN_USERNAME || 'admin';
    const defaultPass = process.env.ADMIN_PASSWORD || 'Remal@Auto2026!';
    const existingAdmin = await get('SELECT id FROM admins WHERE username = ?', [defaultUser]);

    if (!existingAdmin) {
      const salt = bcrypt.genSaltSync(12);
      const hash = bcrypt.hashSync(defaultPass, salt);
      await run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [defaultUser, hash]);
      console.log(`[DB] تم إنشاء حساب المشرف الافتراضي: ${defaultUser}`);
    }

    // تحديث ومزامنة الأقسام بمسارات الصور المحلية الجديدة
    const catCount = await get('SELECT COUNT(*) as count FROM categories');
    if (catCount.count === 0) {
      for (const cat of officialCategories) {
        await run(
          `INSERT INTO categories (name_ar, name_en, slug, icon, image_url, description_ar, description_en, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [cat.name_ar, cat.name_en, cat.slug, cat.icon, cat.image_url, cat.desc_ar, cat.desc_en, cat.sort_order]
        );
      }
      console.log('[DB] تم زرع الأقسام الافتراضية بنجاح.');
    } else {
      for (const cat of officialCategories) {
        await run(
          `UPDATE categories SET image_url = ?, description_ar = ?, description_en = ? WHERE slug = ?`,
          [cat.image_url, cat.desc_ar, cat.desc_en, cat.slug]
        );
      }
    }

    // مزامنة الماركات العشرين المعتمدة وضمان تحديث امتداد الشعارات إلى .png
    console.log('[DB] جاري ضبط وتحديث قائمة الماركات العشرين والتأكد من صيغة PNG لكافة الشعارات...');
    await run("UPDATE brands SET logo_url = REPLACE(logo_url, '.svg', '.png') WHERE logo_url LIKE '%.svg'");
    for (const brand of officialBrands) {
      const existing = await get('SELECT id FROM brands WHERE slug = ?', [brand.slug]);
      if (existing) {
        await run(
          `UPDATE brands SET name_ar = ?, name_en = ?, logo_url = ?, origin_ar = ?, origin_en = ?, category = ?, sort_order = ? WHERE slug = ?`,
          [brand.name_ar, brand.name_en, brand.logo_url, brand.origin_ar, brand.origin_en, brand.category, brand.sort_order, brand.slug]
        );
      } else {
        await run(
          `INSERT INTO brands (name_ar, name_en, slug, logo_url, origin_ar, origin_en, category, sort_order, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [brand.name_ar, brand.name_en, brand.slug, brand.logo_url, brand.origin_ar, brand.origin_en, brand.category, brand.sort_order]
        );
      }
    }
    console.log('[DB] تم تحديث ومزامنة العلامات التجارية العشرين بصيغة PNG بنجاح.');

  } catch (err) {
    console.error('خطأ أثناء تهيئة قاعدة البيانات:', err);
  }
}

module.exports = {
  query,
  get,
  run,
  initDatabase
};
