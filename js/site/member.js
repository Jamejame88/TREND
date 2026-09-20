/* TREND — member.js
   الهوية والبوابة: الاتصال بدالة customer-portal بـSupabase، وقراءة/حفظ بيانات العضو. */

/* ————— نادي ترند (كبار العملاء) —————
   القسم الخاص بالأعضاء. اسم القسم لازم يكون مطابق تمامًا لاسم التصنيف
   يلي بتحطه على المنتج (بشيت المنتجات أو بنقطة البيع) حتى ينخفي عن الزائر العادي. */
/* الجسر مع Supabase - الدالة الوسيطة customer-portal.
   المفتاح العام (anon) مصمّم أصلًا ليكون ظاهر بكود الصفحة، وما بيعطي أي وصول
   مباشر للبيانات - كل شي بيمر عبر الدالة الوسيطة يلي بترجّع نقاط الرقم المطلوب بس. */
var SB_URL = 'https://incloqbhtksnxqiohvaw.supabase.co';
var SB_ANON = 'sb_publishable_jfAFLXWXJpIrRfkd_CcWlw_xjGgEUEX';

function portal(action, phone, name){
  var url = SB_URL + '/functions/v1/customer-portal';
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SB_ANON,
      'Authorization': 'Bearer ' + SB_ANON
    },
    body: JSON.stringify({ action: action, phone: phone, name: name || null })
  }).then(function(r){
    return r.text().then(function(txt){
      if (!r.ok){
        /* رمز 401 غالبًا معناه إنه "Verify JWT" لسا مفعّل على الدالة بـSupabase */
        var hint = (r.status === 401 || r.status === 403)
          ? 'الدالة مقفلة (Verify JWT لسا شغّال) — أطفيه من إعدادات الدالة بـSupabase'
          : (r.status === 404 ? 'الدالة customer-portal مو منشورة بعد' : 'رد غير متوقع من الخدمة');
        return { ok: false, message: hint + ' [' + r.status + ']' };
      }
      try { return JSON.parse(txt); }
      catch(e){ return { ok: false, message: 'رد غير مفهوم من الخدمة' }; }
    });
  }).catch(function(err){
    /* هون بس فشل شبكة حقيقي أو حجب CORS */
    return { ok: false, message: 'ما قدرنا نوصل للخدمة (' + (err && err.message ? err.message : 'شبكة') + ')' };
  });
}

/* صورة صندوق الهدايا فوق مؤشر النقاط.
   ارفع الصورة على نفس مستودع الموقع باسم gift.jpg (أو غيّر الاسم/الرابط هون).
   إذا الصورة مو موجودة، بتختفي لحالها وما بتأثر على باقي الصفحة. */
var CLUB_IMG = 'gift.jpg';

var MEMBER_KEY = 'trend_member';
var WHEEL_REG_KEY = 'trend_wheel_reg';   /* اللي بتستخدمه صفحة العجلة */
var VIP_KEY = 'trend_vip';               /* لازم تتعرّف قبل getMember() يلي بتستخدمها */

/* هوية موحّدة: الموقع والعجلة على نفس النطاق فبيتشاركوا التخزين.
   لو الزبون سجّل بالعجلة، منعتبره عضو هون كمان بدون ما يعيد التسجيل. */
function getMember(){
  try {
    var m = JSON.parse(localStorage.getItem(MEMBER_KEY) || 'null');
    if (m && m.phone) return m;
    /* ما في تسجيل بالموقع - منشوف تسجيل العجلة */
    var w = JSON.parse(localStorage.getItem(WHEEL_REG_KEY) || 'null');
    if (w && w.phone){
      var unified = { phone: w.phone, name: w.name || '' };
      localStorage.setItem(MEMBER_KEY, JSON.stringify(unified));
      localStorage.setItem(VIP_KEY, '1');
      return unified;
    }
  } catch(e){}
  return null;
}
function setMember(m){
  try { m ? localStorage.setItem(MEMBER_KEY, JSON.stringify(m)) : localStorage.removeItem(MEMBER_KEY); } catch(e){}
}
