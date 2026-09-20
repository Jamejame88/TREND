/* TREND — العجلة — core.js
   الأساس: الإعدادات والجوائز، الاختصار $، نداء Apps Script (jsonp)، وتحويل الأسعار.
   لازم ينحمّل أول. */

/* ————————————————————————————————
   عدّل هالقسم بس — الباقي ما بدو تعديل
———————————————————————————————— */
const CONFIG = {
  shopName:    "TREND",
  address:     "دمشق — دمر البلد",
  siteUrl:     "https://jamejame88.github.io/TREND/site.html",
  whatsapp:    "963934589893",
  sheetUrl:    "https://script.google.com/macros/s/AKfycbx4zwX9C0PqPvE215aF1AwVs5j8pn7mqzbEx961qYShZDct3dYm4nTvetl8VBAtm9sA/exec",
  expiryDays:  14,
  prizes: [
    { label: "حسم 10% على قسم المكياج",  lines: ["حسم 10%", "المكياج"],      weight: 40, tag: "MKP" },
    { label: "حسم 15% على قسم العطور",   lines: ["حسم 15%", "العطور"],       weight: 25, tag: "PRF" },
    { label: "حسم 20% على قسم الألعاب",  lines: ["حسم 20%", "الألعاب"],      weight: 25, tag: "TOY" },
    { label: "عطر 35مل بنصف السعر",      lines: ["عطر 35مل", "بنصف السعر"],  weight: 10, tag: "P35" },
    { label: "حسم 50% على قسم الإكسسوار",lines: ["حسم 50%", "الإكسسوار"],    weight:  5, tag: "ACC" },
    { label: "طقم إكسسوار ستيل",         lines: ["طقم إكسسوار", "ستيل"],     weight:  1, tag: "STL" }
  ],
  /* أوزان اللفّة التجريبية: كل الجوائز بنفس الاحتمال، عشان الزائر يشوف
     كل الخانات (خصوصًا النادرة) ويعرف شو ممكن يربح. الأوزان الحقيقية فوق
     ما بتتأثر - هي وحدها يلي بتحدد الجائزة بعد التسجيل.
     خلي القيمة false لو بدك التجريبي يستخدم نفس الأوزان الحقيقية. */
  demoEqualWeights: true
};


/* ———————————————————————————————— */

/* PRIZES = الجوائز الفعّالة حاليًا. بتنجلب من قاعدة البيانات عند التحميل،
   وبترجع للمكتوبة بـCONFIG لو فشل الاتصال - فالعجلة بتشتغل بكل الحالات. */
let PRIZES = CONFIG.prizes.slice();
let SEG = PRIZES.length;
let ARC = 360 / SEG;
const $ = id => document.getElementById(id);
/* نداء JSONP عام */
function jsonp(params, timeoutMs){
  return new Promise(resolve => {
    if (!CONFIG.sheetUrl) return resolve(null);
    const cb = 'cb_' + Date.now() + Math.floor(Math.random() * 1e4);
    const s  = document.createElement('script');
    let done = false;
    const cleanup = () => {
      if (done) return; done = true;
      clearTimeout(timer);
      try { delete window[cb]; } catch(e){ window[cb] = undefined; }
      s.remove();
    };
    const timer = setTimeout(() => { cleanup(); resolve(null); }, timeoutMs || 7000);
    window[cb] = res => { cleanup(); resolve(res); };
    s.onerror = () => { cleanup(); resolve(null); };
    s.src = CONFIG.sheetUrl + '?callback=' + cb + '&' + params;
    document.body.appendChild(s);
  });
}
/* تحويل السعر لليرة تمامًا كما يعرضه الموقع */
let RATE = 0;
function money(v){
  let t = String(v == null ? '' : v).trim()
    .replace(/[٠-٩]/g, d => d.charCodeAt(0) - 0x0660)
    .replace(/[۰-۹]/g, d => d.charCodeAt(0) - 0x06F0)
    .replace(/[٫]/g, '.').replace(/[,٬\s]/g, '')
    .replace(/[^\d.]/g, '');
  const parts = t.split('.');
  if (parts.length > 2) t = parts[0] + '.' + parts.slice(1).join('');
  const n = parseFloat(t);
  return isFinite(n) ? n : 0;
}
function fmtPrice(v, cur){
  let n = money(v);
  if (!n) return '';
  if (cur === 'usd' && RATE > 0) n = n * RATE;
  return (Math.ceil(n / 10) * 10).toLocaleString('en-US') + ' ل.س';
}
