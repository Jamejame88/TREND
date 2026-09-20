/* TREND — app.js
   التشغيل: كل الأوامر التي تُنفَّذ عند فتح الصفحة، بنفس ترتيبها الأصلي.
   لازم ينحمّل آخر شي — بينادي دوال من كل الملفات السابقة. */

/* ————— نمط العرض (ليلي/نهاري) ————— */
(function(){
  var root = document.documentElement;
  var btn = $('themeToggle');
  var sun = $('iconSun'), moon = $('iconMoon');
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  function paint(theme){
    if (theme === 'light'){
      if (sun) sun.style.display = 'none';
      if (moon) moon.style.display = 'block';
      if (metaTheme) metaTheme.setAttribute('content', '#FAF6EF');
    } else {
      if (sun) sun.style.display = 'block';
      if (moon) moon.style.display = 'none';
      if (metaTheme) metaTheme.setAttribute('content', '#100D0C');
    }
  }
  paint(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  if (btn) btn.onclick = function(){
    var cur  = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    var next = cur === 'light' ? 'dark' : 'light';
    if (next === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem('trend_theme', next); } catch(e){}
    paint(next);
  };
})();
$('vAddr').textContent  = CONFIG.address;
$('vHours').textContent = CONFIG.hours;
$('vDeliv').textContent = CONFIG.delivery;
$('mapBtn').href   = CONFIG.mapUrl;
$('callBtn').href  = 'tel:' + CONFIG.phone;
$('wheelBtn').href = CONFIG.wheelUrl;
$('waBtn').href    = 'https://wa.me/' + CONFIG.whatsapp +
  '?text=' + encodeURIComponent('مرحبا، بدي استفسر عن منتجاتكم');
afterMain(function(){ track('view'); });
$('aiFab').onclick   = aiOpen;
$('aiClose').onclick = function(){ $('aiWrap').classList.remove('on'); };
$('aiWrap').onclick  = function(e){ if (e.target === this) this.classList.remove('on'); };
$('aiSend').onclick  = aiSend;
$('aiInput').addEventListener('keydown', function(e){ if (e.key === 'Enter') aiSend(); });
[].forEach.call($('aiQs').children, function(b){
  b.onclick = function(){ $('aiInput').value = b.textContent; aiSend(); };
});
(function initSave(){
  var stored = null;
  try { stored = localStorage.getItem(SAVE_KEY); } catch(e){}
  if (stored === '1'){ SAVE = true; return; }
  if (stored === '0'){ SAVE = false; return; }
  /* ما في اختيار محفوظ - منقرر حسب حالة الشبكة */
  var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (c){
    var t  = String(c.effectiveType || '');
    var dl = Number(c.downlink || 0);   /* السرعة التقديرية بالميغا */
    if (c.saveData === true || t === '2g' || t === 'slow-2g' || t === '3g' || (dl > 0 && dl < 1)){
      SAVE = true; saveAuto = true;
    }
  }
})();
$('saveBtn') && $('saveBtn').addEventListener('click', function(){
  SAVE = !SAVE; saveAuto = false;
  try { localStorage.setItem(SAVE_KEY, SAVE ? '1' : '0'); } catch(e){}
  paintSaveBtn(); render();
});
(function watchImgSpeed(){
  if (SAVE || !('PerformanceObserver' in window)) return;
  var times = [];
  try {
    var po = new PerformanceObserver(function(list){
      list.getEntries().forEach(function(en){
        if (times.length >= 3 || String(en.name).indexOf('i.ibb.co') === -1) return;
        times.push(en.duration);
        if (en.duration > VERY_SLOW_IMG_MS){ po.disconnect(); autoSave(); return; }
        if (times.length === 3){
          po.disconnect();
          times.sort(function(a, b){ return a - b; });
          if (times[1] > SLOW_IMG_MS) autoSave();
        }
      });
    });
    po.observe({ type: 'resource', buffered: true });
  } catch(e){}
})();
/* رابط الواتساب يلي بتبعتو للأعضاء لازم ينتهي بـ #vip - وهو يلي بيفعّل الشارة عندهم.
   الـQR يلي بالمحل بيوصل على #club (صفحة التعريف بالنادي، بدون تفعيل). */
(function clubRoute(){
  var h = String(location.hash || '').toLowerCase();
  var q = String(location.search || '').toLowerCase();
  if (h.indexOf('vip') !== -1 || q.indexOf('vip=1') !== -1) setVip(true);
})();
window.addEventListener('beforeinstallprompt', function(e){
  e.preventDefault();
  deferredPrompt = e;
  paintInstall();
});

$('instBtn') && $('instBtn').addEventListener('click', function(){
  var msg = $('instMsg');
  if (IOS){
    msg.textContent = 'اضغط زر المشاركة ⬆ تحت المتصفح، وبعدين "إضافة إلى الشاشة الرئيسية".';
    return;
  }
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(function(res){
    deferredPrompt = null;
    if (res && res.outcome === 'accepted') claimInstallBonus();
    else msg.textContent = 'تقدر تنزّله بأي وقت لاحق.';
  });
});

window.addEventListener('appinstalled', function(){ claimInstallBonus(); });
$('galClose') && $('galClose').addEventListener('click', closeGallery);
$('gal') && $('gal').addEventListener('click', function(e){ if (e.target === this) closeGallery(); });
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape' && $('gal') && $('gal').classList.contains('on')) closeGallery();
});

$('galAdd') && $('galAdd').addEventListener('click', function(){
  if (!galProduct) return;
  /* منمرّر رقم الموديل مع المنتج - بيظهر بنص طلب الواتساب */
  addToCart(galProduct, 'الموديل رقم ' + (galPick + 1), galImgs[galPick] || '');
  closeGallery();
});
try { localStorage.removeItem('trend_cart'); } catch(e){}
/* ═══ شريط الفائزين ═══ */
afterMain(function loadWins(){
  jsonp('action=wins', 25000).then(function(r){
    var w = (r && r.wins) ? r.wins : [];
    if (w.length < 2) return;
    var trail = document.getElementById('trail');
    function add(x){
      var d = document.createElement('div');
      d.className = 'tk';
      d.innerHTML = '<i></i><s></s> ربح <b></b>';
      d.querySelector('s').textContent = 'الزبون ' + x.n;
      d.querySelector('b').textContent = x.p;
      if (x.t){
        var sp = document.createElement('span');
        sp.textContent = '· ' + x.t;
        d.appendChild(sp);
      }
      trail.appendChild(d);
    }
    /* مرتين حتى يكون الدوران سلس بلا فراغ */
    w.forEach(add); w.forEach(add);
    document.getElementById('ticker').classList.add('on');
  });
});
paintOffers(memo('offers'));
if (cachedP && cachedP.length){ ALL = cachedP; buildFilters(); render(); }
paintClub();
paintInstall();
paintSaveBtn();

/* التطبيق مفتوح من الشاشة الرئيسية = مثبّت فعليًا.
   هي الحالة الوحيدة يلي بتغطي الآيفون (ما بيرسل إشارة تثبيت)،
   وكمان بتغطي اللي نزّل قبل ما يسجّل بالنادي. */
if (STANDALONE) setTimeout(claimInstallBonus, 1200);
/* رابط #install: بينزّل الزائر على زر تنزيل التطبيق ويلمّعه.
   موجود للتوافق مع الروابط القديمة يلي انبعتت أو انطبعت. */
(function installRoute(){
  var h = String(location.hash || '').toLowerCase();
  if (h.indexOf('install') === -1) return;
  setTimeout(function(){
    var wrap = $('instWrap'), btn = $('instBtn'), msg = $('instMsg');
    if (!wrap) return;
    if (STANDALONE){
      /* مثبّت أصلًا - منطمّنه بدل ما نفرجيه زر ما إله لزوم */
      var t = $('sToast');
      if (t){
        t.textContent = 'التطبيق مثبّت عندك أصلًا ✓';
        t.classList.add('on');
        setTimeout(function(){ t.classList.remove('on'); }, 4000);
      }
      return;
    }
    wrap.hidden = false;                 /* بيظهر حتى لو المتصفح ما أعطى إشارة التثبيت */
    wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (btn) btn.classList.add('spot');
    if (msg && !deferredPrompt && !IOS){
      msg.textContent = 'إذا ما فتحت نافذة التثبيت، من قائمة المتصفح (⋮) اختار "إضافة إلى الشاشة الرئيسية".';
    }
  }, 700);
})();

/* تسجيل الـService Worker - شرط لازم حتى يسمح المتصفح بتثبيت التطبيق */
if ('serviceWorker' in navigator){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').then(function(reg){
      /* بيدوّر عن نسخة أحدث عند كل فتحة، ولو لقى وحدة جاهزة بيستلمها فورًا
         ويعيد تحميل الصفحة مرة وحدة - فما بيعلق الزبون على نسخة قديمة */
      reg.update();
      function takeOver(w){
        if (!w) return;
        w.addEventListener('statechange', function(){
          if (w.state === 'installed' && navigator.serviceWorker.controller){
            w.postMessage('skipWaiting');
          }
        });
      }
      if (reg.waiting) reg.waiting.postMessage('skipWaiting');
      takeOver(reg.installing);
      reg.addEventListener('updatefound', function(){ takeOver(reg.installing); });
    }).catch(function(e){ console.log('SW:', e); });

    var reloaded = false;
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function(){
      /* أول زيارة ما في نسخة قديمة نبدّلها - إعادة التحميل هون كانت بتقطع
         طلب المنتجات وبتبلّشه من الصفر */
      if (!hadController) return;
      if (reloaded) return;   /* مرة وحدة بس - تفاديًا لحلقة إعادة تحميل */
      reloaded = true;
      location.reload();
    });
  });
}
loadMain(1);
$('openCart').onclick   = function(){ $('sheet').classList.add('on'); };
$('closeSheet').onclick = function(){ $('sheet').classList.remove('on'); };
$('sheet').onclick      = function(e){ if (e.target === this) this.classList.remove('on'); };
$('sendOrder').onclick  = function(){ if (CART.length){ track('order'); window.open(orderLink(), '_blank'); } };
$('sendOrder2').onclick = function(e){
  e.preventDefault();
  if (CART.length){ track('order'); window.open(orderLink(), '_blank'); }
};
paintCart();
