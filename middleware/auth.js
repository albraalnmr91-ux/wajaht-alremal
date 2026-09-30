// التحقق من صحة جلسة المشرف
function requireAdminAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }

  // إذا كان الطلب موجهاً لواجهة برمجة التطبيقات (API)
  if (req.xhr || req.headers.accept?.includes('json') || req.path.startsWith('/api/')) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح لك بالوصول. يرجى تسجيل الدخول أولاً.',
      code: 'UNAUTHORIZED'
    });
  }

  // إعادة التوجيه لصفحة تسجيل الدخول للمتصفح
  return res.redirect('/admin/login');
}

module.exports = {
  requireAdminAuth
};
