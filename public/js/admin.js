// منطق لوحة تحكم الإدارة - شركة واجهة الرمال لقطع غيار السيارات
let adminCategories = [];
let adminBrands = [];
let adminInquiries = [];

// تطهير النصوص للحماية من هجمات XSS
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// عرض رسالة إشعار منبثقة (Toast Notification)
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast-message');
  if (!toast) return;

  toast.className = `fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-6 sm:bottom-6 sm:max-w-md z-50 p-4 rounded-xl shadow-2xl text-xs font-bold text-white transition-all text-center sm:text-right ${
    type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
  }`;
  toast.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

// نافذة تأكيد مخصصة للجوال والحواسيب تضمن استجابة 100% دون الاعتماد على confirm() الافتراضي
let confirmResolver = null;
function customConfirm(title, message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modal-confirm');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');

    if (!modal) {
      // احتياط في حال عدم وجود النافذة
      const ok = window.confirm(`${title}\n${message}`);
      return resolve(ok);
    }

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    confirmResolver = resolve;
    modal.classList.remove('hidden');
  });
}

function initConfirmModal() {
  const modal = document.getElementById('modal-confirm');
  const btnCancel = document.getElementById('confirm-modal-cancel');
  const btnSubmit = document.getElementById('confirm-modal-submit');

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      if (modal) modal.classList.add('hidden');
      if (confirmResolver) {
        confirmResolver(false);
        confirmResolver = null;
      }
    });
  }

  if (btnSubmit) {
    btnSubmit.addEventListener('click', () => {
      if (modal) modal.classList.add('hidden');
      if (confirmResolver) {
        confirmResolver(true);
        confirmResolver = null;
      }
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
        if (confirmResolver) {
          confirmResolver(false);
          confirmResolver = null;
        }
      }
    });
  }
}

// التحقق من صلاحية الجلسة
async function checkAuth() {
  try {
    const res = await fetch('/api/admin/me');
    const data = await res.json();
    if (!data.authenticated) {
      window.location.href = '/admin/login';
      return false;
    }
    const userSpan = document.getElementById('current-username');
    const mobileUserLabel = document.getElementById('mobile-user-label');
    if (data.user) {
      if (userSpan) userSpan.textContent = data.user.username;
      if (mobileUserLabel) mobileUserLabel.textContent = data.user.username;
    }
    return true;
  } catch (err) {
    window.location.href = '/admin/login';
    return false;
  }
}

// تسجيل الخروج
function initLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    const ok = await customConfirm('تسجيل الخروج', 'هل ترغب بتسجيل الخروج من لوحة تحكم واجهة الرمال؟');
    if (!ok) return;

    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (err) {
      window.location.href = '/admin/login';
    }
  });
}

// إدارة التبويبات المتجاوبة (Desktop Tabs + Drawer Tabs + Quick Mobile Tabs Strip)
function initTabs() {
  const desktopTabs = document.querySelectorAll('.desktop-tab-btn');
  const drawerTabs = document.querySelectorAll('.mobile-drawer-tab-btn');
  const quickTabs = document.querySelectorAll('.quick-mobile-tab-btn');

  function switchTab(target) {
    // 1. تحديث أزرار الشاشات الكبيرة
    desktopTabs.forEach((btn) => {
      if (btn.getAttribute('data-tab') === target) {
        btn.className = 'desktop-tab-btn active px-4 py-2.5 rounded-lg text-xs font-black bg-[#0f2942] text-white flex items-center gap-2 shadow-xs transition-colors';
      } else {
        btn.className = 'desktop-tab-btn px-4 py-2.5 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-2 transition-colors';
      }
    });

    // 2. تحديث قائمة الجوال المنبثقة
    drawerTabs.forEach((btn) => {
      if (btn.getAttribute('data-tab') === target) {
        btn.className = 'mobile-drawer-tab-btn touch-btn w-full text-right py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-between bg-red-600 text-white shadow-sm';
      } else {
        btn.className = 'mobile-drawer-tab-btn touch-btn w-full text-right py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-between text-slate-200 hover:bg-slate-800 hover:text-white';
      }
    });

    // 3. تحديث شريط التبويب السريع للجوال
    quickTabs.forEach((btn) => {
      if (btn.getAttribute('data-tab') === target) {
        btn.className = 'quick-mobile-tab-btn touch-btn flex-shrink-0 px-4 py-2 rounded-lg text-xs font-black transition-all bg-[#0f2942] text-white shadow-xs';
      } else {
        btn.className = 'quick-mobile-tab-btn touch-btn flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all text-gray-600 bg-gray-100 hover:bg-gray-200';
      }
    });

    // 4. إظهار المحتوى المختار
    document.querySelectorAll('.tab-content').forEach((sec) => {
      sec.classList.add('hidden');
    });
    const activeSec = document.getElementById(`tab-${target}-content`);
    if (activeSec) {
      activeSec.classList.remove('hidden');
    }

    // إغلاق قائمة الجوال إذا كانت مفتوحة
    closeMobileSidebar();
  }

  desktopTabs.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

  drawerTabs.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

  quickTabs.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });
}

// إدارة القائمة الجانبية للجوال
function initMobileSidebar() {
  const toggleBtn = document.getElementById('mobile-sidebar-toggle');
  const closeBtn = document.getElementById('close-sidebar-btn');
  const sidebar = document.getElementById('admin-mobile-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');

  if (toggleBtn && sidebar && backdrop) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.remove('closed');
      backdrop.classList.remove('hidden');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeMobileSidebar);
    }

    backdrop.addEventListener('click', closeMobileSidebar);
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('admin-mobile-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) sidebar.classList.add('closed');
  if (backdrop) backdrop.classList.add('hidden');
}

// جلب الإحصائيات وتحديث الشارات
async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    if (data.success && data.stats) {
      const catCount = data.stats.categories;
      const brandCount = data.stats.brands;
      const inqNewCount = data.stats.newInquiries;

      document.getElementById('stat-cat-count').textContent = catCount;
      document.getElementById('stat-brand-count').textContent = brandCount;
      document.getElementById('stat-inq-new').textContent = inqNewCount;

      const drawerBadgeCat = document.getElementById('drawer-badge-cat');
      if (drawerBadgeCat) drawerBadgeCat.textContent = catCount;

      const drawerBadgeInq = document.getElementById('drawer-badge-inq');
      if (drawerBadgeInq) drawerBadgeInq.textContent = inqNewCount;

      const quickBadgeInq = document.getElementById('quick-badge-inq');
      if (quickBadgeInq) {
        quickBadgeInq.textContent = inqNewCount;
        if (inqNewCount > 0) quickBadgeInq.classList.remove('hidden');
        else quickBadgeInq.classList.add('hidden');
      }

      if (Array.isArray(data.recentInquiries)) {
        adminInquiries = data.recentInquiries;
        renderInquiries();
      }
    }
  } catch (err) {
    console.error('خطأ تحميل الإحصائيات:', err);
  }
}

// ----------------------------------------------------
// 1. إدارة أقسام قطع الغيار (Categories CRUD)
// ----------------------------------------------------
async function loadCategories() {
  const tbody = document.getElementById('categories-table-body');
  const cardsContainer = document.getElementById('categories-cards-container');

  try {
    const res = await fetch('/api/admin/categories');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      adminCategories = json.data;
      renderCategories();
    }
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-red-600 font-bold">تعذر تحميل الأقسام.</td></tr>`;
    if (cardsContainer) cardsContainer.innerHTML = `<div class="p-4 rounded-xl bg-red-50 text-red-600 text-center text-xs font-bold">تعذر تحميل الأقسام.</div>`;
  }
}

function renderCategories() {
  renderCategoriesTable();
  renderCategoriesCards();
}

// عرض الجدول للشاشات الكبيرة
function renderCategoriesTable() {
  const tbody = document.getElementById('categories-table-body');
  if (!tbody) return;

  if (adminCategories.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-gray-400">لا توجد أقسام مسجلة.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminCategories.map((cat) => {
    const isAct = cat.is_active === 1;
    const imgUrl = cat.image_url ? escapeHTML(cat.image_url) : '/images/categories/engine.jpg';

    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="py-3 px-4 font-mono text-xs text-gray-500 font-bold">${cat.sort_order}</td>
        <td class="py-3 px-4">
          <div class="w-12 h-9 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
            <img src="${imgUrl}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='/images/categories/engine.jpg';" />
          </div>
        </td>
        <td class="py-3 px-4 font-bold text-gray-900">${escapeHTML(cat.name_ar)}</td>
        <td class="py-3 px-4 text-gray-600 font-medium">${escapeHTML(cat.name_en)}</td>
        <td class="py-3 px-4 font-mono text-[11px] text-gray-500">${escapeHTML(cat.slug)}</td>
        <td class="py-3 px-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${isAct ? 'badge-active' : 'badge-inactive'}">
            ${isAct ? 'نشط' : 'معطل'}
          </span>
        </td>
        <td class="py-3 px-4 text-center">
          <div class="inline-flex items-center gap-1.5">
            <button 
              type="button"
              data-action="edit-category" 
              data-id="${cat.id}" 
              class="touch-btn h-8 px-2.5 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-900 hover:text-white border border-blue-200 transition-colors text-xs font-bold flex items-center gap-1" 
              title="تعديل"
            >
              <i class="fa-solid fa-pen-to-square"></i>
              <span>تعديل</span>
            </button>
            <button 
              type="button"
              data-action="delete-category" 
              data-id="${cat.id}" 
              data-name="${escapeHTML(cat.name_ar)}" 
              class="touch-btn h-8 px-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 transition-colors text-xs font-bold flex items-center gap-1" 
              title="حذف"
            >
              <i class="fa-solid fa-trash"></i>
              <span>حذف</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// عرض البطاقات المتجاوبة للهواتف الذكية (iPhone & Android)
function renderCategoriesCards() {
  const container = document.getElementById('categories-cards-container');
  if (!container) return;

  if (adminCategories.length === 0) {
    container.innerHTML = `<div class="py-8 text-center text-gray-400 text-xs">لا توجد أقسام مسجلة.</div>`;
    return;
  }

  container.innerHTML = adminCategories.map((cat) => {
    const isAct = cat.is_active === 1;
    const imgUrl = cat.image_url ? escapeHTML(cat.image_url) : '/images/categories/engine.jpg';

    return `
      <div class="admin-mobile-card p-4">
        <!-- الرأس: الصورة والأسماء -->
        <div class="flex items-center gap-3 mb-3">
          <div class="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0">
            <img src="${imgUrl}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='/images/categories/engine.jpg';" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1">
              <h3 class="text-sm font-black text-gray-900 truncate">${escapeHTML(cat.name_ar)}</h3>
              <span class="text-[10px] font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600 flex-shrink-0">#${cat.sort_order}</span>
            </div>
            <p class="text-xs text-gray-500 truncate">${escapeHTML(cat.name_en)}</p>
            <div class="mt-1 flex items-center gap-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${isAct ? 'badge-active' : 'badge-inactive'}">
                ${isAct ? 'نشط بالمتجر' : 'معطل مؤقتاً'}
              </span>
              <span class="text-[10px] font-mono text-gray-400 truncate">${escapeHTML(cat.slug)}</span>
            </div>
          </div>
        </div>

        <!-- أزرار الإجراءات بمساحة لمس كبيرة ومريحة على الجوال (Touch Targets) -->
        <div class="grid grid-cols-2 gap-2 pt-2.5 border-t border-gray-100">
          <button 
            type="button" 
            data-action="edit-category" 
            data-id="${cat.id}"
            class="touch-btn h-11 w-full rounded-xl bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 active:bg-blue-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <i class="fa-solid fa-pen-to-square text-sm"></i>
            <span>تعديل القسم</span>
          </button>

          <button 
            type="button" 
            data-action="delete-category" 
            data-id="${cat.id}"
            data-name="${escapeHTML(cat.name_ar)}"
            class="touch-btn h-11 w-full rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:bg-red-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <i class="fa-solid fa-trash text-sm"></i>
            <span>حذف القسم</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openAddCategoryModal() {
  const modal = document.getElementById('modal-category');
  const form = document.getElementById('form-category');
  document.getElementById('modal-category-title').textContent = 'إضافة قسم جديد لقطع الغيار';
  form.reset();
  document.getElementById('cat-id').value = '';
  document.getElementById('cat-is-active').checked = true;
  modal.classList.remove('hidden');
}

function editCategory(id) {
  const cat = adminCategories.find((c) => c.id === id);
  if (!cat) {
    showToast('تعذر العثور على بيانات القسم', 'error');
    return;
  }

  const modal = document.getElementById('modal-category');
  document.getElementById('modal-category-title').textContent = 'تعديل قسم: ' + cat.name_ar;
  document.getElementById('cat-id').value = cat.id;
  document.getElementById('cat-name-ar').value = cat.name_ar;
  document.getElementById('cat-name-en').value = cat.name_en;
  document.getElementById('cat-slug').value = cat.slug || '';
  document.getElementById('cat-icon').value = cat.icon || '';
  document.getElementById('cat-image-url').value = cat.image_url || '';
  document.getElementById('cat-desc-ar').value = cat.description_ar || '';
  document.getElementById('cat-desc-en').value = cat.description_en || '';
  document.getElementById('cat-sort-order').value = cat.sort_order || 0;
  document.getElementById('cat-is-active').checked = cat.is_active === 1;

  modal.classList.remove('hidden');
}

async function saveCategory(e) {
  e.preventDefault();
  const form = e.target;
  const id = document.getElementById('cat-id').value;
  const isEdit = Boolean(id);

  const payload = {
    name_ar: form.name_ar.value.trim(),
    name_en: form.name_en.value.trim(),
    slug: form.slug.value.trim(),
    icon: form.icon.value.trim(),
    image_url: form.image_url.value.trim(),
    description_ar: form.description_ar.value.trim(),
    description_en: form.description_en.value.trim(),
    sort_order: parseInt(form.sort_order.value, 10) || 0,
    is_active: form.is_active.checked ? 1 : 0
  };

  try {
    const url = isEdit ? `/api/admin/categories/${id}` : '/api/admin/categories';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      showToast(isEdit ? 'تم تحديث القسم بنجاح' : 'تمت إضافة القسم بنجاح');
      document.getElementById('modal-category').classList.add('hidden');
      await loadCategories();
      await loadStats();
    } else {
      showToast(data.message || 'حدث خطأ أثناء حفظ القسم', 'error');
    }
  } catch (err) {
    showToast('فشل الاتصال بالخادم', 'error');
  }
}

async function deleteCategory(id, name) {
  const confirmed = await customConfirm(
    'حذف قسم من الكتالوج',
    `هل أنت متأكد من رغبتك في حذف قسم (${name || 'المحدد'}) نهائياً؟`
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showToast('تم حذف القسم بنجاح');
      await loadCategories();
      await loadStats();
    } else {
      showToast(data.message || 'تعذر حذف القسم', 'error');
    }
  } catch (err) {
    showToast('فشل الاتصال بالخادم', 'error');
  }
}

// ----------------------------------------------------
// 2. إدارة العلامات التجارية (Brands CRUD)
// ----------------------------------------------------
async function loadBrands() {
  const tbody = document.getElementById('brands-table-body');
  const cardsContainer = document.getElementById('brands-cards-container');

  try {
    const res = await fetch('/api/admin/brands');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      adminBrands = json.data;
      renderBrands();
    }
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-red-600 font-bold">تعذر تحميل العلامات التجارية.</td></tr>`;
    if (cardsContainer) cardsContainer.innerHTML = `<div class="p-4 rounded-xl bg-red-50 text-red-600 text-center text-xs font-bold">تعذر تحميل العلامات التجارية.</div>`;
  }
}

function renderBrands() {
  renderBrandsTable();
  renderBrandsCards();
}

function renderBrandsTable() {
  const tbody = document.getElementById('brands-table-body');
  if (!tbody) return;

  if (adminBrands.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-gray-400">لا توجد علامات مسجلة.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminBrands.map((brand) => {
    const isAct = brand.is_active === 1;
    const logo = brand.logo_url ? escapeHTML(brand.logo_url) : '';

    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="py-3 px-4 font-mono text-xs text-gray-500 font-bold">${brand.sort_order}</td>
        <td class="py-3 px-4">
          <div class="w-10 h-10 rounded-lg bg-gray-50 p-1 border border-gray-200 flex items-center justify-center">
            ${logo ? `<img src="${logo}" class="max-h-full max-w-full object-contain" onerror="this.parentElement.innerHTML='<span class=\'font-bold text-[10px]\'>${escapeHTML(brand.name_en.slice(0,3))}</span>';" />` : `<span class="font-bold text-[10px] text-gray-500">${escapeHTML(brand.name_en.slice(0,3))}</span>`}
          </div>
        </td>
        <td class="py-3 px-4 font-bold text-gray-900">${escapeHTML(brand.name_ar)}</td>
        <td class="py-3 px-4 text-gray-700 font-medium">${escapeHTML(brand.name_en)}</td>
        <td class="py-3 px-4 text-xs text-gray-500">${escapeHTML(brand.origin_ar || brand.origin_en || '-')}</td>
        <td class="py-3 px-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${isAct ? 'badge-active' : 'badge-inactive'}">
            ${isAct ? 'نشط' : 'معطل'}
          </span>
        </td>
        <td class="py-3 px-4 text-center">
          <div class="inline-flex items-center gap-1.5">
            <button 
              type="button"
              data-action="edit-brand" 
              data-id="${brand.id}" 
              class="touch-btn h-8 px-2.5 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-900 hover:text-white border border-blue-200 transition-colors text-xs font-bold flex items-center gap-1" 
              title="تعديل"
            >
              <i class="fa-solid fa-pen-to-square"></i>
              <span>تعديل</span>
            </button>
            <button 
              type="button"
              data-action="delete-brand" 
              data-id="${brand.id}" 
              data-name="${escapeHTML(brand.name_ar)}" 
              class="touch-btn h-8 px-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 transition-colors text-xs font-bold flex items-center gap-1" 
              title="حذف"
            >
              <i class="fa-solid fa-trash"></i>
              <span>حذف</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderBrandsCards() {
  const container = document.getElementById('brands-cards-container');
  if (!container) return;

  if (adminBrands.length === 0) {
    container.innerHTML = `<div class="py-8 text-center text-gray-400 text-xs">لا توجد علامات تجارية مسجلة.</div>`;
    return;
  }

  container.innerHTML = adminBrands.map((brand) => {
    const isAct = brand.is_active === 1;
    const logo = brand.logo_url ? escapeHTML(brand.logo_url) : '';

    return `
      <div class="admin-mobile-card p-4">
        <!-- الرأس: شعار الماركة والأسماء والبلد -->
        <div class="flex items-center gap-3 mb-3">
          <div class="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 p-1.5 flex items-center justify-center flex-shrink-0">
            ${logo ? `<img src="${logo}" class="max-h-full max-w-full object-contain" onerror="this.parentElement.innerHTML='<span class=\'font-bold text-xs\'>${escapeHTML(brand.name_en.slice(0,3))}</span>';" />` : `<span class="font-bold text-xs text-gray-500">${escapeHTML(brand.name_en.slice(0,3))}</span>`}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1">
              <h3 class="text-sm font-black text-gray-900 truncate">${escapeHTML(brand.name_ar)}</h3>
              <span class="text-[10px] font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600 flex-shrink-0">#${brand.sort_order}</span>
            </div>
            <p class="text-xs text-gray-500 truncate">${escapeHTML(brand.name_en)}</p>
            <div class="mt-1 flex items-center gap-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${isAct ? 'badge-active' : 'badge-inactive'}">
                ${isAct ? 'نشطة' : 'معطلة'}
              </span>
              <span class="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">${escapeHTML(brand.origin_ar || 'معتمد')}</span>
            </div>
          </div>
        </div>

        <!-- أزرار الإجراءات بمساحة لمس كبيرة على الجوال -->
        <div class="grid grid-cols-2 gap-2 pt-2.5 border-t border-gray-100">
          <button 
            type="button" 
            data-action="edit-brand" 
            data-id="${brand.id}"
            class="touch-btn h-11 w-full rounded-xl bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 active:bg-blue-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <i class="fa-solid fa-pen-to-square text-sm"></i>
            <span>تعديل الماركة</span>
          </button>

          <button 
            type="button" 
            data-action="delete-brand" 
            data-id="${brand.id}"
            data-name="${escapeHTML(brand.name_ar)}"
            class="touch-btn h-11 w-full rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:bg-red-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <i class="fa-solid fa-trash text-sm"></i>
            <span>حذف الماركة</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openAddBrandModal() {
  const modal = document.getElementById('modal-brand');
  const form = document.getElementById('form-brand');
  document.getElementById('modal-brand-title').textContent = 'إضافة علامة تجارية جديدة';
  form.reset();
  document.getElementById('brand-id').value = '';
  document.getElementById('brand-is-active').checked = true;
  modal.classList.remove('hidden');
}

function editBrand(id) {
  const brand = adminBrands.find((b) => b.id === id);
  if (!brand) {
    showToast('تعذر العثور على بيانات الماركة', 'error');
    return;
  }

  const modal = document.getElementById('modal-brand');
  document.getElementById('modal-brand-title').textContent = 'تعديل ماركة: ' + brand.name_ar;
  document.getElementById('brand-id').value = brand.id;
  document.getElementById('brand-name-ar').value = brand.name_ar;
  document.getElementById('brand-name-en').value = brand.name_en;
  document.getElementById('brand-slug').value = brand.slug || '';
  document.getElementById('brand-logo-url').value = brand.logo_url || '';
  document.getElementById('brand-origin-ar').value = brand.origin_ar || '';
  document.getElementById('brand-sort-order').value = brand.sort_order || 0;
  document.getElementById('brand-is-active').checked = brand.is_active === 1;

  modal.classList.remove('hidden');
}

async function saveBrand(e) {
  e.preventDefault();
  const form = e.target;
  const id = document.getElementById('brand-id').value;
  const isEdit = Boolean(id);

  const payload = {
    name_ar: form.name_ar.value.trim(),
    name_en: form.name_en.value.trim(),
    slug: form.slug.value.trim(),
    logo_url: form.logo_url.value.trim(),
    origin_ar: form.origin_ar.value.trim(),
    origin_en: form.origin_ar.value.trim(),
    sort_order: parseInt(form.sort_order.value, 10) || 0,
    is_active: form.is_active.checked ? 1 : 0
  };

  try {
    const url = isEdit ? `/api/admin/brands/${id}` : '/api/admin/brands';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      showToast(isEdit ? 'تم تحديث الماركة بنجاح' : 'تمت إضافة الماركة بنجاح');
      document.getElementById('modal-brand').classList.add('hidden');
      await loadBrands();
      await loadStats();
    } else {
      showToast(data.message || 'حدث خطأ أثناء حفظ الماركة', 'error');
    }
  } catch (err) {
    showToast('فشل الاتصال بالخادم', 'error');
  }
}

async function deleteBrand(id, name) {
  const confirmed = await customConfirm(
    'حذف علامة تجارية',
    `هل أنت متأكد من رغبتك في حذف ماركة (${name || 'المحددة'})؟`
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/admin/brands/${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showToast('تم حذف الماركة بنجاح');
      await loadBrands();
      await loadStats();
    } else {
      showToast(data.message || 'تعذر حذف الماركة', 'error');
    }
  } catch (err) {
    showToast('فشل الاتصال بالخادم', 'error');
  }
}

// ----------------------------------------------------
// 3. إدارة الطلبات الواردة (Inquiries)
// ----------------------------------------------------
function renderInquiries() {
  renderInquiriesTable();
  renderInquiriesCards();
}

function renderInquiriesTable() {
  const tbody = document.getElementById('inquiries-table-body');
  if (!tbody) return;

  if (adminInquiries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-gray-400">لا توجد طلبات تسعيرة مسجلة.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminInquiries.map((inq) => {
    const dateStr = inq.created_at ? new Date(inq.created_at).toLocaleDateString('ar-SA') : '-';
    const rawPhone = (inq.customer_phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.startsWith('0') ? '966' + rawPhone.slice(1) : rawPhone;
    const waReplyMsg = encodeURIComponent(`مرحباً أستاذ ${inq.customer_name}، نتواصل معك من شركة واجهة الرمال لقطع غيار السيارات بالرياض بخصوص طلبك لقطعة (${inq.part_name}).`);
    const waLink = `https://wa.me/${cleanPhone}?text=${waReplyMsg}`;

    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="py-3 px-4 font-mono text-xs text-gray-500">${dateStr}</td>
        <td class="py-3 px-4 font-bold text-gray-900">${escapeHTML(inq.customer_name)}</td>
        <td class="py-3 px-4 font-mono text-xs text-gray-700" dir="ltr">${escapeHTML(inq.customer_phone)}</td>
        <td class="py-3 px-4 text-xs text-gray-600">${escapeHTML(inq.car_make || '')} ${escapeHTML(inq.car_model || '')}</td>
        <td class="py-3 px-4 font-mono text-xs text-blue-900 font-semibold">${escapeHTML(inq.vin_number || '-')}</td>
        <td class="py-3 px-4 font-medium text-gray-800">${escapeHTML(inq.part_name)}</td>
        <td class="py-3 px-4">
          <select 
            data-action="update-inquiry-status" 
            data-id="${inq.id}" 
            class="text-xs bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-gray-800 focus:outline-none"
          >
            <option value="new" ${inq.status === 'new' ? 'selected' : ''}>جديد</option>
            <option value="contacted" ${inq.status === 'contacted' ? 'selected' : ''}>تم التواصل</option>
            <option value="completed" ${inq.status === 'completed' ? 'selected' : ''}>مكتمل</option>
          </select>
        </td>
        <td class="py-3 px-4 text-center">
          <div class="inline-flex items-center gap-1.5">
            <a 
              href="${waLink}" 
              target="_blank" 
              class="touch-btn h-8 px-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors text-xs font-bold flex items-center gap-1" 
              title="رد واتساب"
            >
              <i class="fa-brands fa-whatsapp text-sm"></i>
              <span>واتساب</span>
            </a>
            <button 
              type="button" 
              data-action="delete-inquiry" 
              data-id="${inq.id}" 
              class="touch-btn h-8 px-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 transition-colors text-xs font-bold flex items-center gap-1" 
              title="حذف"
            >
              <i class="fa-solid fa-trash"></i>
              <span>حذف</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderInquiriesCards() {
  const container = document.getElementById('inquiries-cards-container');
  if (!container) return;

  if (adminInquiries.length === 0) {
    container.innerHTML = `<div class="py-8 text-center text-gray-400 text-xs">لا توجد طلبات تسعيرة مسجلة.</div>`;
    return;
  }

  container.innerHTML = adminInquiries.map((inq) => {
    const dateStr = inq.created_at ? new Date(inq.created_at).toLocaleDateString('ar-SA') : '-';
    const rawPhone = (inq.customer_phone || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.startsWith('0') ? '966' + rawPhone.slice(1) : rawPhone;
    const waReplyMsg = encodeURIComponent(`مرحباً أستاذ ${inq.customer_name}، نتواصل معك من شركة واجهة الرمال لقطع غيار السيارات بالرياض بخصوص طلبك لقطعة (${inq.part_name}).`);
    const waLink = `https://wa.me/${cleanPhone}?text=${waReplyMsg}`;
    const telLink = `tel:${inq.customer_phone}`;

    let badgeClass = 'badge-new';
    let statusText = 'طلب جديد';
    if (inq.status === 'contacted') {
      badgeClass = 'badge-contacted';
      statusText = 'تم التواصل';
    } else if (inq.status === 'completed') {
      badgeClass = 'badge-completed';
      statusText = 'مكتمل';
    }

    return `
      <div class="admin-mobile-card p-4">
        <div class="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-3">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center font-bold text-xs">
              <i class="fa-solid fa-user"></i>
            </span>
            <div>
              <h4 class="text-sm font-black text-gray-900">${escapeHTML(inq.customer_name)}</h4>
              <span class="text-[10px] text-gray-400 font-mono">${dateStr}</span>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}">${statusText}</span>
        </div>

        <!-- تفاصيل الطلب والمركبة -->
        <div class="space-y-1.5 text-xs text-gray-700 mb-3.5">
          <div class="flex justify-between">
            <span class="text-gray-500 font-bold">القطعة:</span>
            <span class="font-black text-red-600">${escapeHTML(inq.part_name)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500 font-bold">المركبة:</span>
            <span class="font-medium">${escapeHTML(inq.car_make || '-')} ${escapeHTML(inq.car_model || '')} ${escapeHTML(inq.car_year || '')}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-500 font-bold">رقم الهيكل (VIN):</span>
            <span class="font-mono font-bold text-[11px] bg-blue-50 text-blue-900 px-2 py-0.5 rounded">${escapeHTML(inq.vin_number || 'غير متوفر')}</span>
          </div>
          ${inq.notes ? `
            <div class="p-2 bg-gray-50 rounded-lg text-[11px] text-gray-600 mt-2">
              <span class="font-bold block text-gray-700 mb-0.5">ملاحظات العميل:</span>
              ${escapeHTML(inq.notes)}
            </div>
          ` : ''}
        </div>

        <!-- تغيير الحالة وأزرار الإجراءات -->
        <div class="space-y-2 pt-2 border-t border-gray-100">
          <div>
            <label class="block text-[11px] font-bold text-gray-600 mb-1">تحديث حالة الطلب:</label>
            <select 
              data-action="update-inquiry-status" 
              data-id="${inq.id}" 
              class="touch-btn h-11 w-full text-xs font-bold bg-white border border-gray-300 rounded-xl px-3 text-gray-800 focus:outline-none"
            >
              <option value="new" ${inq.status === 'new' ? 'selected' : ''}>حالة الطلب: جديد 🔔</option>
              <option value="contacted" ${inq.status === 'contacted' ? 'selected' : ''}>حالة الطلب: تم التواصل 💬</option>
              <option value="completed" ${inq.status === 'completed' ? 'selected' : ''}>حالة الطلب: مكتمل ✅</option>
            </select>
          </div>

          <div class="grid grid-cols-12 gap-2 pt-1">
            <a 
              href="${waLink}" 
              target="_blank" 
              class="touch-btn col-span-5 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <i class="fa-brands fa-whatsapp text-sm"></i>
              <span>واتساب</span>
            </a>

            <a 
              href="${telLink}" 
              class="touch-btn col-span-4 h-11 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 active:bg-blue-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <i class="fa-solid fa-phone text-xs"></i>
              <span>اتصال</span>
            </a>

            <button 
              type="button" 
              data-action="delete-inquiry" 
              data-id="${inq.id}" 
              class="touch-btn col-span-3 h-11 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:bg-red-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
              title="حذف الطلب"
            >
              <i class="fa-solid fa-trash text-xs"></i>
              <span>حذف</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function updateInquiryStatus(id, status) {
  try {
    const res = await fetch(`/api/admin/inquiries/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      showToast('تم تحديث حالة الطلب بنجاح');
      await loadStats();
    } else {
      showToast(data.message || 'فشل تعديل الحالة', 'error');
    }
  } catch (err) {
    showToast('فشل تعديل الحالة', 'error');
  }
}

async function deleteInquiry(id) {
  const confirmed = await customConfirm(
    'حذف طلب التسعيرة',
    'هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً؟'
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/admin/inquiries/${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showToast('تم حذف الطلب بنجاح');
      await loadStats();
    } else {
      showToast(data.message || 'تعذر حذف الطلب', 'error');
    }
  } catch (err) {
    showToast('فشل الاتصال بالخادم', 'error');
  }
}

// إغلاق النوافذ المنبثقة
function initModalClose() {
  document.querySelectorAll('.btn-close-modal').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop-light').forEach((m) => m.classList.add('hidden'));
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop-light').forEach((m) => m.classList.add('hidden'));
      closeMobileSidebar();
    }
  });
}

// ----------------------------------------------------
// ربط الأحداث الموحد (Unified Event Delegation Architecture)
// يضمن استجابة جميع الأزرار المُولدة ديناميكياً 100% بدون أي مشاكل inline أو تداخل
// ----------------------------------------------------
function initEventDelegation() {
  // 1. مراقب النقر العام (Click Delegation)
  document.addEventListener('click', async (e) => {
    // زر تعديل قسم
    const editCatBtn = e.target.closest('[data-action="edit-category"]');
    if (editCatBtn) {
      e.preventDefault();
      const id = parseInt(editCatBtn.dataset.id, 10);
      if (id) editCategory(id);
      return;
    }

    // زر حذف قسم
    const deleteCatBtn = e.target.closest('[data-action="delete-category"]');
    if (deleteCatBtn) {
      e.preventDefault();
      const id = parseInt(deleteCatBtn.dataset.id, 10);
      const name = deleteCatBtn.dataset.name || '';
      if (id) await deleteCategory(id, name);
      return;
    }

    // زر تعديل ماركة
    const editBrandBtn = e.target.closest('[data-action="edit-brand"]');
    if (editBrandBtn) {
      e.preventDefault();
      const id = parseInt(editBrandBtn.dataset.id, 10);
      if (id) editBrand(id);
      return;
    }

    // زر حذف ماركة
    const deleteBrandBtn = e.target.closest('[data-action="delete-brand"]');
    if (deleteBrandBtn) {
      e.preventDefault();
      const id = parseInt(deleteBrandBtn.dataset.id, 10);
      const name = deleteBrandBtn.dataset.name || '';
      if (id) await deleteBrand(id, name);
      return;
    }

    // زر حذف استفسار/طلب
    const deleteInqBtn = e.target.closest('[data-action="delete-inquiry"]');
    if (deleteInqBtn) {
      e.preventDefault();
      const id = parseInt(deleteInqBtn.dataset.id, 10);
      if (id) await deleteInquiry(id);
      return;
    }
  });

  // 2. مراقب تغيير القوائم المنسدلة للطلبات (Change Delegation)
  document.addEventListener('change', async (e) => {
    const statusSelect = e.target.closest('[data-action="update-inquiry-status"]');
    if (statusSelect) {
      const id = parseInt(statusSelect.dataset.id, 10);
      const newStatus = statusSelect.value;
      if (id && newStatus) {
        await updateInquiryStatus(id, newStatus);
      }
    }
  });
}

// تصدير الدوال لنطاق window كإجراء أمان إضافي كامل
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.editBrand = editBrand;
window.deleteBrand = deleteBrand;
window.deleteInquiry = deleteInquiry;
window.updateInquiryStatus = updateInquiryStatus;
window.customConfirm = customConfirm;

// تهيئة لوحة التحكم عند اكتمال تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
  const isAuthed = await checkAuth();
  if (!isAuthed) return;

  initLogout();
  initTabs();
  initMobileSidebar();
  initModalClose();
  initConfirmModal();
  initEventDelegation();

  const btnAddCat = document.getElementById('btn-add-category');
  if (btnAddCat) btnAddCat.addEventListener('click', openAddCategoryModal);

  const btnAddBrand = document.getElementById('btn-add-brand');
  if (btnAddBrand) btnAddBrand.addEventListener('click', openAddBrandModal);

  const formCat = document.getElementById('form-category');
  if (formCat) formCat.addEventListener('submit', saveCategory);

  const formBrand = document.getElementById('form-brand');
  if (formBrand) formBrand.addEventListener('submit', saveBrand);

  await loadStats();
  await loadCategories();
  await loadBrands();
});
