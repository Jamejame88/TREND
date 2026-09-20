/* TREND — ai.js
   المساعد الذكي: نافذة المحادثة، شريط الاقتراحات، إرسال السؤال،
   وبطاقات المنتجات المقترحة مع زر الإضافة للسلة. */

/* ————— المساعد الذكي ————— */
var AI_HIST = [];
function aiAdd(cls, text){
  var log = $('aiLog');
  var m = el('div', 'msg ' + cls, text);
  log.appendChild(m);
  log.scrollTop = log.scrollHeight;
  return m;
}
function aiOpen(){
  $('aiWrap').classList.add('on');
  if (!AI_HIST.length && !$('aiLog').children.length){
    aiAdd('a', 'أهلاً فيك 🌿 قلي لمين الهدية وشو ميزانيتك، وبرشحلك من بضاعتنا.');
  }
  setTimeout(function(){ $('aiInput').focus(); }, 100);
}
/* شريط المنتجات أثناء الانتظار — يبدأ بالعروض */
function buildStrip(){
  var pool = [];
  /* العروض أولاً */
  OFFERS.forEach(function(o){
    var price = money(o.priceNew) || money(o.priceOld);
    if (price > 0) pool.push({ name:o.name, price:String(price), img:o.img, deal:true });
  });
  /* ثم منتجات متوفرة، بدون تكرار ما ورد بالعروض */
  var seen = {};
  pool.forEach(function(p){ seen[p.name] = 1; });
  var rest = ALL.filter(function(p){
    return p.avail !== false && money(p.price) > 0 && !seen[p.name];
  }).sort(function(){ return Math.random() - 0.5; });
  pool = pool.concat(rest).slice(0, 8);
  if (pool.length < 3) return false;
  var t = $('sTrack');
  t.innerHTML = '';
  [0, 1].forEach(function(){
    pool.forEach(function(p){
      var c = el('div', 'scard');
      if (p.img){
        var im = new Image();
        im.src = p.img; im.alt = ''; im.loading = 'lazy';
        im.onerror = function(){ im.remove(); };
        c.appendChild(im);
      }
      if (p.deal) c.appendChild(el('div', 'sdeal', 'عرض'));
      c.appendChild(el('div', 'sn', p.name));
      c.appendChild(el('div', 'sp', fmt(money(p.price), p.cur)));
      c.onclick = function(){
        addToCart(p);
        var tt = $('sToast');
        tt.classList.add('on');
        setTimeout(function(){ tt.classList.remove('on'); }, 1800);
      };
      t.appendChild(c);
    });
  });
  return true;
}

/* ————— بطاقات المنتجات المقترحة —————
   النموذج بيرجّع أسماء بس. منطابقها مع البضاعة الحقيقية،
   وأي اسم ما بينطابق منرميه بصمت — هيك ما بيوعد الزبون بشي مو موجود. */

function aiNorm(s){
  return String(s || '').replace(/[\u0640\s]+/g, ' ').trim().toLowerCase();
}

/* بيدوّر على المنتج بالعروض أول (السعر المخفّض أهم)، وبعدين بالبضاعة */
function aiFind(name){
  var key = aiNorm(name);
  if (!key) return null;
  var i, o, p;
  for (i = 0; i < OFFERS.length; i++){
    o = OFFERS[i];
    if (aiNorm(o.name) === key){
      return { name:o.name, price:(o.priceNew || o.priceOld), cur:o.cur,
               img:o.img, imgs:o.imgs, deal:true };
    }
  }
  for (i = 0; i < ALL.length; i++){
    p = ALL[i];
    if (p.avail !== false && aiNorm(p.name) === key) return p;
  }
  return null;
}

function aiPicks(names){
  if (!names || !names.length) return;
  var wrap = el('div', 'picks');
  var shown = 0;
  names.forEach(function(nm){
    var p = aiFind(nm);
    if (!p || !(money(p.price) > 0)) return;
    var c = el('div', 'pick');
    if (p.img){
      var im = new Image();
      im.src = p.img; im.alt = ''; im.loading = 'lazy';
      im.onerror = function(){ im.remove(); };
      c.appendChild(im);
    }
    var info = el('div', 'pinfo');
    var nameRow = el('div', 'pn', p.name);
    if (p.deal) nameRow.appendChild(el('span', 'pdeal', 'عرض'));
    info.appendChild(nameRow);
    info.appendChild(el('div', 'pp', fmt(money(p.price), p.cur)));
    var b = el('button', 'pbtn', 'أضف للسلة');
    b.type = 'button';
    b.onclick = function(){
      addToCart(p);
      b.textContent = 'تمت الإضافة ✓';
      b.disabled = true;
    };
    info.appendChild(b);
    c.appendChild(info);
    wrap.appendChild(c);
    shown++;
  });
  if (!shown) return;
  var log = $('aiLog');
  log.appendChild(wrap);
  log.scrollTop = log.scrollHeight;
}

/* سياق الزبون الحالي — شو بسلته وأي قسم عم يتصفح */
function aiCtx(){
  var cart = [];
  for (var i = 0; i < CART.length && i < 6; i++) cart.push(CART[i].name);
  return JSON.stringify({ cart: cart, cat: CAT });
}

function aiSend(){
  var inp = $('aiInput');
  var q = inp.value.trim();
  if (!q) return;
  inp.value = '';
  $('aiQs').style.display = 'none';
  aiAdd('u', q);
  $('aiStat').classList.add('on');
  $('aiStatTxt').textContent = 'عم فكّر…';
  var slow = setTimeout(function(){
    $('aiStatTxt').textContent = 'لسا عم فكّر… شوي كمان';
  }, 6000);
  if (buildStrip()) $('aiStrip').classList.add('on');
  var hist = JSON.stringify(AI_HIST.slice(-4));
  jsonp('action=ask&q=' + encodeURIComponent(q) +
        '&h=' + encodeURIComponent(hist) +
        '&c=' + encodeURIComponent(aiCtx()), 55000)
    .then(function(r){
      clearTimeout(slow);
      $('aiStat').classList.remove('on');
      $('aiStrip').classList.remove('on');
      var reply = (r && r.reply) ? r.reply
        : 'ما وصلني رد. جرّب مرة تانية أو تواصل معنا على واتساب.';
      aiAdd('a', reply);
      if (r && r.picks) aiPicks(r.picks);
      AI_HIST.push({ r:'u', t:q }, { r:'a', t:reply });
      if (AI_HIST.length > 6) AI_HIST = AI_HIST.slice(-6);
    });
}
