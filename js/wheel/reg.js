/* TREND — العجلة — reg.js
   التسجيل والقفل اليومي: هوية الزائر، حفظ اللفّة، قفل العجلة، ونموذج التسجيل. */

let picked = null, spun = false, entry = {};
/* REAL = صار مسجّل ومسموح له بلفّة حقيقية وحدة.
   قبلها كل اللفّات تجريبية معلنة: بتدور وبتوقف بس بدون رمز. */
let REAL = false, realDone = false, demoCount = 0;

/* بيانات الزائر المسجّل - محفوظة بالجهاز حتى ما نطلب منه التسجيل كل مرة.
   بيسجّل مرة وحدة، وبعدها بيلف مباشرة (والحد اليومي بيتحقق بالسيرفر). */
const WHEEL_REG_KEY = 'trend_wheel_reg';
const MEMBER_KEY    = 'trend_member';   /* نفس المفتاح المستخدم بالموقع */
const VIP_KEY       = 'trend_vip';
/* هوية موحّدة: العجلة والموقع على نفس النطاق فبيتشاركوا التخزين.
   منقرا من الاثنين حتى لو سجّل بمكان واحد بس. */
function getReg(){
  try {
    const own = JSON.parse(localStorage.getItem(WHEEL_REG_KEY) || 'null');
    if (own && own.phone) return own;
    const site = JSON.parse(localStorage.getItem(MEMBER_KEY) || 'null');
    if (site && site.phone) return { name: site.name || '', phone: site.phone };
  } catch(e){}
  return null;
}

function saveReg(r){
  try {
    localStorage.setItem(WHEEL_REG_KEY, JSON.stringify(r));
    /* منسجّله بالموقع كمان - فلما يفتح الموقع بيلاقي حاله عضو بالنادي
       ويشوف نقاطه وقسم كبار العملاء بدون ما يسجّل مرة تانية */
    localStorage.setItem(MEMBER_KEY, JSON.stringify({ phone: r.phone, name: r.name || '' }));
    localStorage.setItem(VIP_KEY, '1');
  } catch(e){}
}

/* تاريخ آخر لفّة حقيقية بهاد الجهاز - بيقفل العجلة فورًا بعد أول لفّة
   حتى ما يرجع الزائر للخلف ويلف تاني لحتى تطلعله جائزة أحلى.
   (الحماية الحقيقية بالسيرفر، بس هاي بتمنعه يشوف جوائز ما رح ياخدها) */
const WHEEL_LAST_KEY = 'trend_wheel_last';
function todayStr(){
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function lastSpin(){
  try { return JSON.parse(localStorage.getItem(WHEEL_LAST_KEY) || 'null'); } catch(e){ return null; }
}
function spunToday(){
  const l = lastSpin();
  return !!(l && l.d === todayStr());
}
function markSpunToday(code, prize, expiry){
  try {
    localStorage.setItem(WHEEL_LAST_KEY, JSON.stringify({
      d: todayStr(), code: code || '', prize: prize || '', expiry: expiry || '',
    }));
  } catch(e){}
}
/* بيقفل العجلة ويوضّح السبب - بينادى عند الرجوع للصفحة بعد لفّة */
/* بيرجّع الزائر لصفحة الجائزة الكاملة (الرمز + الصلاحية + واتساب +
   خطوات التطبيق والنادي) من البيانات المحفوظة بجهازه - بدون ما نكرر
   عرض الرمز بمكانين. */
function showSavedPrize(){
  const l = lastSpin();
  if (!l || !l.code) return;
  const r = getReg() || {};

  $('prizeText').textContent = l.prize || '';
  $('codeText').textContent  = l.code;
  if (l.expiry) $('expiryText').textContent = 'صالح لغاية ' + l.expiry;

  const msg = 'مرحبا، بدي فعّل كود عجلة الحظ.' +
    (r.name ? '\nالاسم: ' + r.name : '') +
    (l.prize ? '\nالجائزة: ' + l.prize : '') +
    '\nالكود: ' + l.code;
  const wb = $('waBtn');
  if (wb) wb.onclick = () => window.open(
    'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg), '_blank');
  const ab = $('appBtn');
  if (ab) ab.href = CONFIG.siteUrl + '#club';

  $('stepWheel').classList.remove('on');
  $('stepForm').classList.remove('on');
  $('stepResult').classList.add('on');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function lockWheelForToday(){
  realDone = true;
  const sp = $('spin');
  if (sp){ sp.disabled = true; sp.textContent = 'خلصت محاولتك اليوم'; }
  const mb = $('modeBar');
  if (mb){
    mb.classList.remove('real');
    mb.classList.add('done');
    const l = lastSpin() || {};
    mb.innerHTML = '<b>محاولتك اليوم خلصت</b>' +
      (l.code ? '<button type="button" class="dbtn" id="showPrizeBtn">🎁 شوف رمزك وجائزتك</button>' : '') +
      '<span>جرّب حظك معنا بكرة 🌿</span>';
    const b = $('showPrizeBtn');
    if (b) b.onclick = showSavedPrize;
  }
  const gr = $('goReg');
  if (gr) gr.style.display = 'none';
  const dp = $('demoPrize');
  if (dp) dp.classList.remove('on');
  const sl = document.querySelector('.spinlimit');
  if (sl) sl.textContent = '⏱ محاولتك الجاية بكرة';
  const pulse = document.getElementById('hubPulse');
  if (pulse) pulse.remove();
}
/* الزر الثابت: قبل التسجيل بيوديه للنموذج، وبعده بيتحوّل لمدخل نادي ترند */
function paintRegFab(){
  const b = $('regFab');
  if (!b) return;
  if (REAL){
    b.textContent = 'نادي ترند ★';
    b.classList.add('member');
  } else {
    b.textContent = 'سجّل مجانًا';
    b.classList.remove('member');
  }
}
function showForm(){
  $('stepWheel').classList.remove('on');
  $('stepForm').classList.add('on');
  suggestName();
  $('phone').focus();
}

/* اسم مقترح تسلسلي لمين ما بدو يكتب اسمه - بينبني من آخر 3 أرقام
   من رقمه حتى يضل ثابت لنفس الشخص وما يتكرر كتير بين الزباين */
function suggestedFromPhone(phone){
  const tail = String(phone || '').replace(/\D/g, '').slice(-3) || '000';
  return 'ضيف ترند ' + tail;
}
function suggestName(){
  const h = $('nameHint');
  if (h) h.textContent = 'إذا تركته فاضي منسجّلك برمز تلقائي.';
}
