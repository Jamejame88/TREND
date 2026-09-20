/* TREND — العجلة — app.js
   التشغيل: كل الأوامر التي تُنفَّذ عند فتح الصفحة، بنفس ترتيبها الأصلي.
   لازم ينحمّل آخر شي. */

$('brandName').textContent = CONFIG.shopName;
$('footAddr').textContent = CONFIG.address;
['shopBtn', 'shopBtn2', 'shopBtn3'].forEach(function(id){
  var b = $(id);
  if (b) b.href = CONFIG.siteUrl;
});

/* ═══ شريط الفائزين ═══ */
(function loadWins(){
  if (!CONFIG.sheetUrl) return;
  const cb = 'wcb_' + Date.now();
  const s = document.createElement('script');
  let done = false;
  const end = () => { if (done) return; done = true; try{ delete window[cb]; }catch(e){} s.remove(); };
  const timer = setTimeout(end, 9000);

  window[cb] = res => {
    clearTimeout(timer); end();
    const w = (res && res.wins) ? res.wins : [];
    if (w.length < 2) return;
    const trail = $('trail');
    const add = x => {
      const d = document.createElement('div');
      d.className = 'tk';
      d.innerHTML = '<i></i><s></s> ربح <b></b>';
      d.querySelector('s').textContent = 'الزبون ' + x.n;
      d.querySelector('b').textContent = x.p;
      if (x.t){ const sp = document.createElement('span'); sp.textContent = '· ' + x.t; d.appendChild(sp); }
      trail.appendChild(d);
    };
    w.forEach(add); w.forEach(add);
    $('ticker').classList.add('on');
  };
  s.onerror = () => { clearTimeout(timer); end(); };
  s.src = CONFIG.sheetUrl + '?callback=' + cb + '&action=wins';
  document.body.appendChild(s);
})();
drawWheel();

/* جلب الجوائز من قاعدة البيانات - لو نجح منعيد الرسم، ولو فشل منضل
   على الجوائز المكتوبة بـCONFIG فوق (فالصفحة ما بتتعطّل أبدًا) */
portal('wheel_prizes').then(res => {
  if (!res || !res.ok) return;
  const free = (res.free || []).map(rowToPrize);
  if (free.length >= 3) setPrizes(free);   /* العجلة العامة = الجوائز المجانية بس */
});

/* نبضة خفيفة على المحور تدل الزائر إنه فيه يضغط - بتوقف أول ما يلف */
(function hubHint(){
  try {
    const sp = $('spin');
    const ring = document.querySelector('#wheel');
    if (!sp || !ring) return;

    /* ملاحظة: el() معرّفة جوا drawWheel() فما بتوصلها من هون -
       منبني العنصر بـcreateElementNS مباشرة. */
    const NS = 'http://www.w3.org/2000/svg';
    const pulse = document.createElementNS(NS, 'circle');
    const attrs = { id:'hubPulse', cx:175, cy:175, r:28, fill:'none',
      stroke:'#C6A44E', 'stroke-width':1.2, opacity:0.7, 'pointer-events':'none' };
    for (const k in attrs) pulse.setAttribute(k, attrs[k]);
    pulse.innerHTML =
      '<animate attributeName="r" values="26;38;26" dur="2.2s" repeatCount="indefinite"/>' +
      '<animate attributeName="opacity" values="0.55;0;0.55" dur="2.2s" repeatCount="indefinite"/>';
    ring.appendChild(pulse);

    sp.addEventListener('click', () => {
      const p = document.getElementById('hubPulse');
      if (p) p.remove();
    }, { once: true });
  } catch (err) {
    /* النبضة زخرفة بحتة - لو فشلت ما لازم توقف باقي الصفحة أبدًا */
    console.log('hubHint:', err);
  }
})();
/* عروض اليوم — شريط متحرك */
(async function loadOffers(){
  const res = await jsonp('action=all', 9000);
  if (res && res.set) RATE = Number(res.set.rate) || 0;
  if (!res || !res.offers || !res.offers.length) return;

  const list = res.offers.slice(0, 8);
  const wrap = $('offerList');

  /* نكرّرها مرتين ليبدو الدوران متصلاً */
  [0, 1].forEach(() => {
    list.forEach(o => {
      const c = document.createElement('div');
      c.className = 'ocard';

      if (o.img){
        const im = new Image();
        im.src = o.img; im.alt = o.name || ''; im.loading = 'lazy';
        im.onerror = () => im.remove();
        c.appendChild(im);
      }

      const bd = document.createElement('div');
      bd.className = 'obadge';
      bd.textContent = o.note || 'عرض';
      c.appendChild(bd);

      const nm = document.createElement('div');
      nm.className = 'on'; nm.textContent = o.name || '';
      c.appendChild(nm);

      if (o.priceNew || o.priceOld){
        const pr = document.createElement('div');
        pr.className = 'op';
        if (o.priceNew){
          const n = document.createElement('span');
          n.className = 'o-new'; n.textContent = fmtPrice(o.priceNew, o.cur);
          pr.appendChild(n);
        }
        if (o.priceOld){
          const d = document.createElement('span');
          d.className = 'o-old'; d.textContent = fmtPrice(o.priceOld, o.cur);
          pr.appendChild(d);
        }
        c.appendChild(pr);
      }

      wrap.appendChild(c);
    });
  });

  $('offers').hidden = false;
})();
/* زر الكتم */
(function soundToggle(){
  const b = $('sndBtn');
  if (!b) return;
  const paint = () => { b.textContent = SOUND ? '♪' : '✕'; b.setAttribute('aria-label', SOUND ? 'كتم الصوت' : 'تشغيل الصوت'); };
  paint();
  b.onclick = () => {
    SOUND = !SOUND;
    try { localStorage.setItem('trend_sound', SOUND ? '1' : '0'); } catch(e){}
    paint();
  };
})();
/* ١ — اللفّة */
$('spin').addEventListener('click', () => {
  if (!REAL){ showForm(); return; }   /* ما سجّل بعد - منوديه للتسجيل */
  if (spun) return;
  if (REAL && realDone) return;       /* اللفّة الحقيقية مرة وحدة بس */
  if (REAL && spunToday()){ lockWheelForToday(); return; }   /* حماية أخيرة */
  $('demoPrize').classList.remove('on');
  spun = true;
  $('spin').disabled = true;
  $('spin').textContent = 'جارٍ الدوران';

  const i = pickPrize();
  picked = PRIZES[i];

  const grp     = document.getElementById('spinGroup');
  const pointer = document.querySelector('.pointer');
  const reduce  = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* الزاوية النهائية المطلوبة */
  const landing = 360 * 7 - (i * ARC + ARC / 2);

  if (reduce){
    grp.style.transition = 'transform 1.1s ease-out';
    grp.style.transform  = `rotate(${360 * 2 - (i * ARC + ARC / 2)}deg)`;
    setTimeout(afterSpin, 1300);
    return;
  }

  /* نموذج الاحتكاك: السرعة تتناقص أسّيًا حتى التوقف التام */
  const T   = 8;                          /* زمن الدوران بالثواني */
  const TAU = 2.3;                        /* معامل الاحتكاك — أكبر = تباطؤ أنعم وأطول */
  const K   = 1 / (1 - Math.exp(-T / TAU));

  const t0 = performance.now();
  let lastPeg = null;

  function frame(now){
    const t = Math.min((now - t0) / 1000, T);

    /* الزاوية الأساسية — تصل للهدف بالضبط عند t = T */
    let ang = landing * K * (1 - Math.exp(-t / TAU));

    grp.style.transform = `rotate(${ang}deg)`;

    /* السرعة اللحظية — تتحكم بقوة الصوت وميل المؤشر */
    const w    = (landing * K / TAU) * Math.exp(-t / TAU);
    const norm = Math.min(1, w / 900);

    /* ارتداد المؤشر عند كل مسمار */
    const idx = Math.floor(((ang % 360) + 360) % 360 / ARC);
    if (lastPeg !== null && idx !== lastPeg){
      peg(norm);
      if (pointer){
        const tilt = 6 + norm * 16;
        pointer.style.transform =
          `translateX(-50%) rotate(${-tilt * 0.85}deg)`;
        setTimeout(() => {
          pointer.style.transform = 'translateX(-50%) rotate(0deg)';
        }, 75);
      }
    }
    lastPeg = idx;

    if (t < T) requestAnimationFrame(frame);
    else {
      grp.style.transform = `rotate(${landing}deg)`;
      hilite(i);
      setTimeout(afterSpin, 1100);
    }
  }
  requestAnimationFrame(frame);
});

/* ٢ — الانتقال لصفحة التسجيل */
$('goReg').addEventListener('click', showForm);
$('regFab').addEventListener('click', () => {
  if (REAL){ window.open(CONFIG.siteUrl + '#club', '_blank'); return; }
  if ($('stepForm').classList.contains('on')) return;   /* هو أصلًا بصفحة التسجيل */
  showForm();
});
/* زائر مسجّل من قبل: منتخطى نموذج التسجيل كليًا ومنخليه يلف مباشرة.
   الحد اليومي محميّ بالسيرفر، فما في خطر من تخطي النموذج. */
(function resumeReg(){
  const r = getReg();
  if (!r || !r.phone) return;
  REAL = true; realDone = false; entry = r;
  /* لف اليوم أصلًا؟ منقفل العجلة قبل ما يشوفها */
  if (spunToday()){ setTimeout(lockWheelForToday, 0); return; }
  const mb = $('modeBar');
  if (mb){
    mb.classList.add('real');
    mb.innerHTML = '<b>أهلاً ' + (r.name || '') +
      '</b><span>لِف، والجائزة يلي بتوقف عليها بتاخد رمزها فورًا</span>';
  }
  const gr = $('goReg');
  if (gr) gr.style.display = 'none';
  const sp = $('spin');
  if (sp){ sp.style.display = 'block'; sp.textContent = 'لِف العجلة'; }
})();

/* الرجوع للصفحة من كاش المتصفح (زر الرجوع) ما بيعيد تشغيل السكربت -
   فمنفحص من جديد عند كل ظهور للصفحة. */
window.addEventListener('pageshow', function(){
  if (REAL && spunToday()) lockWheelForToday();
});
document.addEventListener('visibilitychange', function(){
  if (!document.hidden && REAL && spunToday()) lockWheelForToday();
});

paintRegFab();

/* حقل الاسم صار اختياري وما عاد إله عنصر خطأ - منخفي التلميح بس.
   (السطر القديم كان بينادي $('errName') المحذوف، فبيرمي خطأ وقت التحميل
   وبيوقف كل الكود بعده - وفيه ربط زر اللف، فالعجلة بطّلت تلف.) */
$('name').addEventListener('input', () => {
  const h = $('nameHint');
  if (h && $('name').value.trim()) h.textContent = '';
});
$('phone').addEventListener('input', () => {
  $('errPhone').classList.remove('on');
  $('errDaily').classList.remove('on');
});
/* ٣ — التفعيل والتحقق */
$('claim').addEventListener('click', async () => {
  const btn   = $('claim');
  let   name  = $('name').value.trim();
  const phone = $('phone').value.replace(/\D/g, '');
  const okPhone = /^09\d{8}$/.test(phone);
  $('errPhone').classList.toggle('on', !okPhone);
  $('errDaily').classList.remove('on');
  if (!okPhone) return;

  if (name.length < 2) name = suggestedFromPhone(phone);   /* الاسم اختياري */

  btn.disabled = true;
  btn.textContent = 'جارٍ التحقق';
  const allowed = await checkAllowed(phone);
  btn.disabled = false;
  btn.textContent = 'سجّل ولِف';

  if (!allowed){ $('errDaily').classList.add('on'); return; }

  entry = { name, phone, occasion: $('occasion').value, occDate: $('occDate').value };
  saveReg({ name, phone, occasion: entry.occasion, occDate: entry.occDate });

  /* التسجيل نجح - منرجّعه للعجلة للفّته الحقيقية الوحيدة */
  REAL = true; realDone = false; spun = false;
  paintRegFab();

  $('stepForm').classList.remove('on');
  $('stepWheel').classList.add('on');
  $('demoPrize').classList.remove('on');
  $('goReg').style.display = 'none';
  $('spin').style.display = 'block';
  const mb = $('modeBar');
  mb.classList.add('real');
  mb.innerHTML = '<b>أهلاً ' + name + '</b><span>لِف، والجائزة يلي بتوقف عليها بتاخد رمزها فورًا</span>';
  const sl = document.querySelector('.spinlimit');
  if (sl) sl.textContent = '⏱ محاولتك الجاية بكرة';
  const sp = $('spin');
  sp.disabled = false;
  sp.textContent = 'لِف العجلة';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
