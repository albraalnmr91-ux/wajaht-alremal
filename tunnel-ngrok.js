const ngrok = require('@ngrok/ngrok');

const token = process.argv[2] || process.env.NGROK_AUTHTOKEN;

(async () => {
  try {
    const options = { addr: 3000 };
    if (token) {
      options.authtoken = token;
    }
    console.log('جاري فتح نفق ngrok للمنفذ 3000...');
    const listener = await ngrok.forward(options);
    console.log('====================================================');
    console.log('🚀 تم فتح الرابط العام بنجاح عبر ngrok:');
    console.log(listener.url());
    console.log('====================================================');
  } catch (err) {
    console.error('خطأ في تشغيل ngrok:', err.message);
    if (err.message.includes('ERR_NGROK_4018') || err.message.includes('authtoken')) {
      console.log('\n⚠️ تنبيه من ngrok: تتطلب الأداة ربط رمز التوثيق المجاني (Authtoken).');
      console.log('1. أنشئ حساباً مجانياً من: https://dashboard.ngrok.com/signup');
      console.log('2. انسخ الـ Authtoken الخاص بك من: https://dashboard.ngrok.com/get-started/your-authtoken');
      console.log('3. شغّل الأمر: node tunnel-ngrok.js <رمز_التوثيق_الخاص_بك>\n');
    }
  }
})();
