// كود الواجهة الرئيسية - شركة واجهة الرمال لقطع غيار السيارات
let categoriesCache = [];
let brandsCache = [];
let companyData = {
  whatsapp: '966508576768',
  phone: '+966508576768'
};
let currentBrandFilter = 'all';

// دالة أمان لمنع هجمات XSS وتطهير البيانات النصية
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// دالة توليد أيقونات SVG مخصصة واحترافية لكل قسم من أقسام قطع الغيار
function getCategoryIconSvg(slug, name) {
  const s = (slug || '').toLowerCase();
  
  if (s.includes('engine') || s.includes('محرك')) {
    return `
      <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 8V6a2 2 0 0 1 2-2h2"></path>
        <path d="M20 8V6a2 2 0 0 0-2-2h-2"></path>
        <path d="M3 10h18v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-7z"></path>
        <circle cx="9" cy="15" r="2"></circle>
        <circle cx="15" cy="15" r="2"></circle>
        <path d="M9 10V7h6v3"></path>
      </svg>
    `;
  }

  if (s.includes('brake') || s.includes('فرامل') || s.includes('مكابح')) {
    return `
      <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9"></circle>
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 3v3m0 12v3M3 12h3m12 0h3"></path>
        <path d="M18 9a9 9 0 0 1 0 6h2a11 11 0 0 0 0-6h-2z" fill="currentColor" opacity="0.2"></path>
      </svg>
    `;
  }

  if (s.includes('suspension') || s.includes('shock') || s.includes('تعليق') || s.includes('مساعد')) {
    return `
      <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v3m0 14v3"></path>
        <path d="M8 5h8"></path>
        <path d="M8 19h8"></path>
        <path d="M8 8l8 2-8 2 8 2-8 2 8 2"></path>
      </svg>
    `;
  }

  if (s.includes('filter') || s.includes('lubricant') || s.includes('زيت') || s.includes('فلتر')) {
    return `
      <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
        <path d="M9 13a3 3 0 0 0 6 0"></path>
      </svg>
    `;
  }

  if (s.includes('electric') || s.includes('light') || s.includes('كهرب') || s.includes('إضاءة')) {
    return `
      <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="7" width="20" height="13" rx="2"></rect>
        <path d="M6 7V4h3v3M15 7V4h3v3"></path>
        <path d="M7 13h4M15 13h2M16 11v4"></path>
      </svg>
    `;
  }

  if (s.includes('body') || s.includes('هيكل') || s.includes('بودي')) {
    return `
      <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 17h14M3 11l2-5h14l2 5M3 11v6h2m16 0v-6h-2"></path>
        <circle cx="7" cy="17" r="2"></circle>
        <circle cx="17" cy="17" r="2"></circle>
      </svg>
    `;
  }

  if (s.includes('cooling') || s.includes('ac') || s.includes('تبريد') || s.includes('مكيف')) {
    return `
      <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v20M2 12h20"></path>
        <path d="M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
  }

  if (s.includes('transmission') || s.includes('gear') || s.includes('قير') || s.includes('حركة')) {
    return `
      <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    `;
  }

  return `
    <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  `;
}

// دالة مساعدة للحصول على رابط صورة القسم المحلي
function getCategoryLocalImage(slug) {
  const s = (slug || '').toLowerCase();
  if (s.includes('engine')) return '/images/categories/engine.jpg';
  if (s.includes('brake')) return '/images/categories/brakes.jpg';
  if (s.includes('suspension')) return '/images/categories/suspension.jpg';
  if (s.includes('filter')) return '/images/categories/filters.jpg';
  if (s.includes('electric')) return '/images/categories/electrical.jpg';
  if (s.includes('body')) return '/images/categories/body.jpg';
  if (s.includes('cooling')) return '/images/categories/cooling.jpg';
  if (s.includes('transmission')) return '/images/categories/transmission.jpg';
  return '/images/categories/engine.jpg';
}

// تهيئة الترويسة الثابتة وقائمة الجوال
function initHeader() {
  const header = document.getElementById('main-header');
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }
  });

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }
}

// جلب وتحديث معلومات الشركة
async function loadCompanyInfo() {
  try {
    const res = await fetch('/api/company-info');
    const result = await res.json();
    if (result.success && result.data) {
      companyData = result.data;
      updateWhatsAppLinks();
    }
  } catch (err) {
    console.error('تعذر جلب معلومات الشركة:', err);
  }
}

// تحديث روابط الواتساب بالرقم الجديد
function updateWhatsAppLinks() {
  const lang = getCurrentLang();
  const defaultText = lang === 'ar'
    ? 'مرحباً شركة واجهة الرمال لقطع غيار السيارات، أود الاستفسار عن توفر قطع غيار لسيارتي.'
    : 'Hello Wajaht Al-Remal Auto Parts Co., I would like to inquire about parts for my car.';

  const waNumber = companyData.whatsapp || '966508576768';
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultText)}`;

  const floatingWa = document.getElementById('floating-wa-btn');
  if (floatingWa) {
    floatingWa.href = waUrl;
  }

  const heroWa = document.getElementById('hero-wa-btn');
  if (heroWa) {
    heroWa.href = waUrl;
  }
}

// جلب وعرض الأقسام
async function loadCategories() {
  const container = document.getElementById('categories-grid');
  if (!container) return;

  try {
    const res = await fetch('/api/categories');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      categoriesCache = json.data;
      renderCategories();
    }
  } catch (err) {
    console.error('فشل تحميل الأقسام:', err);
    container.innerHTML = `
      <div class="col-span-full text-center py-10 text-gray-500">
        <p>تعذر تحميل الأقسام حالياً. يرجى إعادة المحاولة لاحقاً.</p>
      </div>
    `;
  }
}

// تصيير بطاقات الأقسام بتصميم مسطح ونظيف
function renderCategories() {
  const container = document.getElementById('categories-grid');
  if (!container || !categoriesCache.length) return;

  const lang = getCurrentLang();
  const isAr = lang === 'ar';

  container.innerHTML = categoriesCache.map((cat) => {
    const name = escapeHTML(isAr ? cat.name_ar : (cat.name_en || cat.name_ar));
    const desc = escapeHTML(isAr ? (cat.description_ar || '') : (cat.description_en || cat.description_ar || ''));
    
    const localImg = getCategoryLocalImage(cat.slug);
    const imgUrl = (cat.image_url && cat.image_url.startsWith('/images/')) ? cat.image_url : localImg;
    const iconSvg = getCategoryIconSvg(cat.slug, name);
    const orderBtnText = isAr ? 'استفسار عن القسم' : 'Inquire Availability';

    const catWaMsg = encodeURIComponent(
      isAr
        ? `مرحباً شركة واجهة الرمال، أود الاستفسار عن توفر قطع غيار في قسم: (${name})`
        : `Hello Wajaht Al-Remal, I am inquiring about parts in category: (${name})`
    );
    const catWaLink = `https://wa.me/${companyData.whatsapp || '966508576768'}?text=${catWaMsg}`;

    return `
      <div class="card-clean flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        
        <div class="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden border-b border-gray-100">
          <img 
            src="${imgUrl}" 
            alt="${name}" 
            loading="lazy" 
            class="img-ratio-cover transition-transform duration-300 hover:scale-105"
            onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&q=80';"
          />
          <div class="absolute top-3 ${isAr ? 'right-3' : 'left-3'} bg-white/95 p-2 rounded-lg shadow-sm border border-gray-200">
            ${iconSvg}
          </div>
        </div>

        <div class="p-5 flex flex-col flex-grow justify-between">
          <div>
            <h3 class="text-lg font-bold text-gray-900 mb-2 leading-tight">${name}</h3>
            <p class="text-gray-600 text-xs sm:text-sm leading-relaxed mb-5 line-clamp-3">${desc}</p>
          </div>

          <a 
            href="${catWaLink}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gray-100 hover:bg-red-600 text-gray-800 hover:text-white font-bold text-xs sm:text-sm transition-colors duration-200"
          >
            <i class="fa-brands fa-whatsapp text-base text-emerald-600 group-hover:text-white"></i>
            <span>${orderBtnText}</span>
          </a>
        </div>

      </div>
    `;
  }).join('');
}

// ----------------------------------------------------
// قسم العلامات التجارية والشركات المدعومة مع الفلترة الديناميكية
// ----------------------------------------------------

async function loadBrands() {
  const container = document.getElementById('brands-grid');
  if (!container) return;

  try {
    const res = await fetch('/api/brands');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      brandsCache = json.data;
      renderBrands();
      initBrandsFilter();
    }
  } catch (err) {
    console.error('فشل تحميل الماركات:', err);
  }
}

// دالة مساعدة لتوفير شعار SVG بديل أنيق في حال كانت صورة الماركة غير متوفرة
function getBrandFallbackSvg(name) {
  return `
    <div class="w-16 h-16 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center font-black text-sm uppercase border border-blue-100 shadow-inner">
      ${escapeHTML((name || '').substring(0, 3))}
    </div>
  `;
}

// تصيير بطاقات الماركات مع تكبير الشعارات وتخصيص أرقام الواتساب وفلترة الفئات بنظام السوفت يو آي
function renderBrands() {
  const container = document.getElementById('brands-grid');
  if (!container || !brandsCache.length) return;

  const lang = getCurrentLang();
  const isAr = lang === 'ar';
  const inquireLabel = isAr ? 'طلب قطع' : 'Inquire Parts';

  container.innerHTML = brandsCache.map((brand, index) => {
    const name = escapeHTML(isAr ? brand.name_ar : (brand.name_en || brand.name_ar));
    const origin = escapeHTML(isAr ? (brand.origin_ar || '') : (brand.origin_en || brand.origin_ar || ''));
    let logo = brand.logo_url ? escapeHTML(brand.logo_url) : '';
    // الاعتماد الصارم على امتداد PNG لصور شعارات السيارات
    if (logo) {
      logo = logo.replace(/\.svg$/i, '.png');
    } else if (brand.slug) {
      logo = `/images/brands/${brand.slug}.png`;
    }
    const category = brand.category || 'american';

    // تخصيص رقم الواتساب ورابط المحادثة المخصص لكل فئة بدقة حسب التعليمات
    let targetPhone = companyData.whatsapp || '966508576768';
    if (category === 'japanese-korean') {
      targetPhone = '966558172128';
    } else if (category === 'chinese') {
      targetPhone = '966531168070';
    }

    const brandWaMsg = encodeURIComponent(
      isAr
        ? `مرحباً، أود الاستفسار عن توفر قطع غيار لسيارات (${name}).`
        : `Hello, I would like to inquire about spare parts for (${name}) vehicles.`
    );
    const brandWaLink = `https://wa.me/${targetPhone}?text=${brandWaMsg}`;

    const isHidden = (currentBrandFilter !== 'all' && category !== currentBrandFilter) ? 'hidden' : '';
    const delayClass = `delay-${((index % 4) + 1) * 100}`;

    return `
      <div 
        class="brand-card-item card-clean soft-card p-4 sm:p-5 flex flex-col justify-between items-center text-center group bg-white border border-gray-200 rounded-2xl hover:border-red-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${isHidden} reveal-on-scroll ${delayClass}"
        data-category="${category}"
      >
        <!-- حاوية الشعار المكبرة والبارزة لملء البطاقة بشكل أنيق ومريح للنظر -->
        <div class="w-full h-24 sm:h-28 mb-3.5 px-3 py-2 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-red-50/50 transition-colors duration-300 overflow-hidden shadow-inner">
          ${logo ? `
            <img 
              src="${logo}" 
              alt="${name}" 
              loading="lazy" 
              class="max-h-16 sm:max-h-20 max-w-full object-contain filter transition-transform duration-300 group-hover:scale-110" 
              onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
            />
            <div class="hidden">
              ${getBrandFallbackSvg(name)}
            </div>
          ` : getBrandFallbackSvg(name)}
        </div>

        <!-- تفاصيل الماركة -->
        <div class="w-full mb-3 flex-1 flex flex-col justify-center">
          <h4 class="text-gray-900 font-extrabold text-sm sm:text-base group-hover:text-red-600 transition-colors leading-tight">${name}</h4>
          ${origin ? `<span class="inline-block mt-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">${origin}</span>` : ''}
        </div>

        <!-- زر طلب قطع الكبسولي المستقل برقم الواتساب المخصص -->
        <a 
          href="${brandWaLink}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="btn-pill touch-btn mt-2 w-full h-10 rounded-full bg-slate-100 group-hover:bg-red-600 text-gray-800 group-hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 shadow-xs"
        >
          <i class="fa-brands fa-whatsapp text-sm text-emerald-600 group-hover:text-white transition-colors"></i>
          <span>${inquireLabel}</span>
        </a>
      </div>
    `;
  }).join('');

  // إعادة تهيئة تأثيرات الظهور التتابعي للبطاقات الجديدة
  initScrollReveal();
}

// برمجة شريط أزرار التصفية الفورية الكبسولية بدون إعادة تحميل الصفحة
function initBrandsFilter() {
  const filterBtns = document.querySelectorAll('.brand-filter-btn');
  if (!filterBtns.length) return;

  filterBtns.forEach((btn) => {
    btn.onclick = () => {
      const filter = btn.getAttribute('data-filter') || 'all';
      currentBrandFilter = filter;

      // تحديث مظهر الزر النشط (Active State) بالأسلوب الكبسولي الأنيق
      filterBtns.forEach((b) => {
        if (b === btn) {
          b.className = 'brand-filter-btn active btn-pill touch-btn px-5 sm:px-7 py-2.5 rounded-full font-black text-xs sm:text-sm transition-all duration-200 bg-[#0f2942] text-white shadow-md ring-2 ring-blue-900/20';
        } else {
          b.className = 'brand-filter-btn btn-pill touch-btn px-5 sm:px-7 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all duration-200 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 shadow-xs';
        }
      });

      // فلترة البطاقات بحركة انسيابية وسريعة
      const cards = document.querySelectorAll('.brand-card-item');
      cards.forEach((card) => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.classList.remove('hidden');
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          });
        } else {
          card.classList.add('hidden');
        }
      });
    };
  });
}

// ----------------------------------------------------
// تفاعل بطاقات الأقسام الرئيسية الثلاثة حسب المنشأ
// ----------------------------------------------------
function initOriginCategoriesInteraction() {
  const cards = document.querySelectorAll('.origin-category-card');
  if (!cards.length) return;

  cards.forEach((card) => {
    const triggerFilterAndScroll = (filter) => {
      if (!filter) return;

      // 1. تفعيل زر الفلترة في قسم الماركات
      const filterBtn = document.querySelector(`.brand-filter-btn[data-filter="${filter}"]`);
      if (filterBtn) {
        filterBtn.click();
      }

      // 2. التمرير الانسيابي الفوري إلى قسم الماركات مع مراعاة ارتفاع الترويسة
      const brandsSection = document.getElementById('brands');
      if (brandsSection) {
        const headerOffset = 80;
        const elementPosition = brandsSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    };

    // النقر على البطاقة ككل
    card.addEventListener('click', (e) => {
      const filter = card.getAttribute('data-target-filter');
      triggerFilterAndScroll(filter);
    });

    // دعم إمكانية الوصول عبر لوحة المفاتيح
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const filter = card.getAttribute('data-target-filter');
        triggerFilterAndScroll(filter);
      }
    });

    // النقر على زر الإجراء داخل البطاقة
    const btn = card.querySelector('button[data-target-filter]');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const filter = btn.getAttribute('data-target-filter');
        triggerFilterAndScroll(filter);
      });
    }
  });
}

// ----------------------------------------------------
// تتبع أقسام الصفحة وتحديث الكبسولة المتوهجة النشطة (Header Scrollspy)
// ----------------------------------------------------
function initHeaderScrollspy() {
  const sections = document.querySelectorAll('section[id]');
  const desktopNavLinks = document.querySelectorAll('#desktop-nav .nav-pill');
  const mobileNavLinks = document.querySelectorAll('#mobile-menu .mobile-nav-pill');

  if (!sections.length) return;

  // دعم النقر الانسيابي لجميع روابط القائمة مع احتساب هامش الترويسة
  const allNavLinks = [...desktopNavLinks, ...mobileNavLinks];
  allNavLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('#')) return;

      const targetId = href.replace('#', '');
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        e.preventDefault();
        const headerOffset = 76;
        const elementPosition = targetSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // مراقبة الأقسام عبر IntersectionObserver
  if (!('IntersectionObserver' in window)) return;

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        setActiveNav(id);
      }
    });
  }, observerOptions);

  sections.forEach((sec) => observer.observe(sec));

  function setActiveNav(id) {
    if (!id) return;

    desktopNavLinks.forEach((link) => {
      const target = link.getAttribute('data-nav-target') || (link.getAttribute('href') || '').replace('#', '');
      if (target === id) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    mobileNavLinks.forEach((link) => {
      const target = link.getAttribute('data-nav-target') || (link.getAttribute('href') || '').replace('#', '');
      if (target === id) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}

// ----------------------------------------------------
// تأثيرات الظهور والانسيابية عند التمرير (Scroll Reveal)
// ----------------------------------------------------
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll:not(.is-revealed)');
  if (!revealElements.length) return;

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach((el) => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.08
  });

  revealElements.forEach((el) => observer.observe(el));
}

// معالجة نموذج طلب التسعيرة عبر واتساب
function initInquiryForm() {
  const form = document.getElementById('inquiry-form');
  const alertBox = document.getElementById('inquiry-alert');
  const submitBtn = document.getElementById('inquiry-submit-btn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isAr = getCurrentLang() === 'ar';
    const formData = {
      customer_name: form.customer_name.value.trim(),
      customer_phone: form.customer_phone.value.trim(),
      car_make: form.car_make.value.trim(),
      car_model: form.car_model.value.trim(),
      car_year: form.car_year ? form.car_year.value.trim() : '',
      vin_number: form.vin_number.value.trim(),
      part_name: form.part_name.value.trim(),
      notes: form.notes.value.trim()
    };

    if (!formData.customer_name || !formData.customer_phone || !formData.part_name) {
      showAlert(
        alertBox,
        isAr ? 'يرجى تعبئة الاسم ورقم الجوال والقطعة المطلوبة.' : 'Please fill in Name, Phone, and Required Part.',
        'error'
      );
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${isAr ? 'جاري الإرسال...' : 'Sending...'}</span>`;

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        showAlert(
          alertBox,
          isAr
            ? 'تم حفظ طلبكم بنجاح! جاري فتح محادثة واتساب للتأكيد الفوري...'
            : 'Request saved! Opening WhatsApp for immediate confirmation...',
          'success'
        );
        form.reset();

        if (data.whatsappUrl) {
          setTimeout(() => {
            window.open(data.whatsappUrl, '_blank');
          }, 1200);
        }
      } else {
        showAlert(alertBox, data.message || 'حدث خطأ أثناء حفظ الطلب.', 'error');
      }
    } catch (err) {
      console.error('خطأ إرسال التسعيرة:', err);
      showAlert(alertBox, isAr ? 'حدث خطأ في الاتصال بالخادم.' : 'Connection error.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <i class="fa-brands fa-whatsapp text-lg"></i>
        <span>${isAr ? 'إرسال طلب التسعيرة عبر واتساب' : 'Send Quote Request via WhatsApp'}</span>
      `;
    }
  });
}

function showAlert(box, message, type) {
  if (!box) return;
  box.className = `p-4 rounded-xl text-sm font-medium mb-4 ${
    type === 'success'
      ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
      : 'bg-red-50 border border-red-300 text-red-800'
  }`;
  box.textContent = message;
  box.classList.remove('hidden');

  setTimeout(() => {
    box.classList.add('hidden');
  }, 6000);
}

// الاستماع لتغيير اللغة
window.addEventListener('languageChanged', () => {
  renderBrands();
  updateWhatsAppLinks();
  initScrollReveal();
});

// تهيئة الصفحة بالكامل عند اكتمال تحميل الـ DOM
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initHeaderScrollspy();
  initOriginCategoriesInteraction();
  initScrollReveal();
  loadCompanyInfo();
  loadBrands();
  initInquiryForm();
});
