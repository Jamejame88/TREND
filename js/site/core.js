/* TREND — core.js
   الأساس: الإعدادات، الاختصار $، الاتصال بـApps Script (jsonp)، الحفظ المحلي، التتبّع.
   لازم ينحمّل أول — كل باقي الملفات بتستعمل دواله. */

/* ————— الإعدادات ————— */
var CONFIG = {
  whatsapp: "963934589893",
  phone:    "0934589893",
  address:  "دمشق — دمر البلد",
  hours:    "يوميًا 10:00 ص — 10:00 م",
  delivery: "توصيل داخل دمشق · اطلب عبر واتساب",
  mapUrl:   "https://maps.app.goo.gl/Dkkwvj5cxcqtWPFL9",
  wheelUrl: "https://jamejame88.github.io/TREND/",
  sheetUrl: "https://script.google.com/macros/s/AKfycbx4zwX9C0PqPvE215aF1AwVs5j8pn7mqzbEx961qYShZDct3dYm4nTvetl8VBAtm9sA/exec"
};
/* ———————————————————— */
var $ = function(id){ return document.getElementById(id); };
function jsonp(params, ms){
  return new Promise(function(res){
    if (!CONFIG.sheetUrl) return res(null);
    var cb = 'cb_' + Date.now() + Math.floor(Math.random() * 9999);
    var s  = document.createElement('script');
    var done = false;
    function end(v){ if (done) return; done = true; clearTimeout(t); window[cb] = function(){}; /* رد متأخر بعد انتهاء المهلة ما بيطلع خطأ */ s.remove(); res(v); }
    var t = setTimeout(function(){ end(null); }, ms || 9000);
    window[cb] = end;
    s.onerror = function(){ end(null); };
    s.src = CONFIG.sheetUrl + '?callback=' + cb + '&' + params;
    document.body.appendChild(s);
  });
}
/* ترتيب الطلبات: طلب المنتجات بيطلع أول لحاله، وباقي طلبات Apps Script
   (الفائزين، تسجيل الزيارة) بتستنى لحد ما يرجع - حتى ما تزاحمه وتبطّئه. */
var MAIN_DONE = false, AFTER_MAIN = [];
function afterMain(fn){ if (MAIN_DONE) fn(); else AFTER_MAIN.push(fn); }
function mainDone(){
  if (MAIN_DONE) return;
  MAIN_DONE = true;
  AFTER_MAIN.splice(0).forEach(function(f){ try { f(); } catch(e){} });
}
function el(tag, cls, txt){
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
}
/* حفظ محلي: يعرض آخر نسخة فورًا ثم يحدّث بالخلفية */
function memo(key){
  try { var v = localStorage.getItem('trend_' + key); return v ? JSON.parse(v) : null; }
  catch(e){ return null; }
}
function keep(key, val){
  try { localStorage.setItem('trend_' + key, JSON.stringify(val)); } catch(e){}
}
/* ————— التتبّع ————— */
function track(ev){
  try {
    var img = new Image();
    img.src = CONFIG.sheetUrl + '?action=track&ev=' + ev + '&callback=cb&_=' + Date.now();
  } catch(e){}
}
