/* TREND — vip-install.js
   كبار العملاء + تثبيت التطبيق على الجوال ومنح النقطتين مرة وحدة لكل رقم. */

var VIP_CAT = 'كبار العملاء';
function isVip(){
  try {
    if (localStorage.getItem(VIP_KEY) === '1') return true;
    /* سجّل بالعجلة؟ إذن هو عضو - getMember() بتوحّد المفاتيح تلقائيًا */
    return !!(getMember() && getMember().phone);
  } catch(e){ return false; }
}
function setVip(v){
  try { if (v) localStorage.setItem(VIP_KEY, '1'); else localStorage.removeItem(VIP_KEY); } catch(e){}
}
/* ————— تثبيت التطبيق على الجوال + هدية النقطتين ————— */
var deferredPrompt = null;
var IOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
var STANDALONE = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function paintInstall(){
  var wrap = $('instWrap'), msg = $('instMsg');
  if (!wrap) return;
  if (STANDALONE){ wrap.hidden = true; return; }
  if (deferredPrompt || IOS){
    wrap.hidden = false;
    if (msg && IOS) msg.textContent = 'من زر المشاركة تحت ← "إضافة إلى الشاشة الرئيسية"';
  }
}


/* النقطتين بينضافوا مرة وحدة لكل رقم - التحقق بالسيرفر مو بالمتصفح */
/* بينادى من أربع حالات: موافقة على التثبيت (أندرويد)، اكتمال التثبيت،
   فتح التطبيق من الشاشة الرئيسية (وهي الحالة الوحيدة يلي بتغطي الآيفون)،
   وبعد التسجيل مباشرة لمين نزّل قبل ما يسجّل.
   السيرفر بيتأكد إنه الرقم ما أخد النقطتين قبل، فتكرار النداء ما بيضر. */
var bonusAsked = false;

function bonusSay(html){
  var msg = $('instMsg');
  if (msg && $('instWrap') && !$('instWrap').hidden){ msg.innerHTML = html; return; }
  /* لو زر التنزيل مخفي (متل حالة فتح التطبيق المثبّت)، منعرض تنبيه عائم */
  var t = $('sToast');
  if (t){
    t.innerHTML = html;
    t.classList.add('on');
    setTimeout(function(){ t.classList.remove('on'); }, 4500);
  }
}

function claimInstallBonus(){
  if (bonusAsked) return;          /* مرة وحدة بالجلسة - تفاديًا لرسائل متضاربة */
  var m = getMember();
  if (!m || !m.phone){
    bonusSay('تم التنزيل ✓ — سجّل بنادي ترند تحت حتى تاخد النقطتين.');
    return;                        /* ما منرفع العلم: لسا ما طلبناهن فعليًا */
  }
  bonusAsked = true;
  portal('install_bonus', m.phone).then(function(res){
    if (!res || !res.ok) return;
    if (res.bonusGranted){
      bonusSay('🎁 انضافت <b style="color:var(--gold)">نقطتين</b> لرصيدك!');
      var wrap = $('instWrap');
      if (wrap && !wrap.hidden) setTimeout(function(){ wrap.hidden = true; }, 6000);
      paintClub();
    }
    /* لو أخدهن من قبل ما منزعجه برسالة */
  }).catch(function(){ bonusAsked = false; });
}
