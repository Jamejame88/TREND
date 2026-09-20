/* TREND — catalog.js
   الكتالوج: حالة الأسعار والسلة، العروض، جلب المنتجات، الفلاتر، ورسم الشبكة. */

/* ——— الأسعار وسعر الصرف — لازم تتعرّف قبل أي رسم ——— */
var SET = memo('set') || { rate: 0, mode: 'syp' };
var ROUND_TO   = 10;    /* التقريب لفوق لأقرب 10 ل.س */
var SHOW_OLD   = true;  /* عرض السعر بالعملة القديمة */
var OLD_FACTOR = 100;   /* كم صفر انحذف: 100 = صفرين */
/* حالة السلة — بالذاكرة فقط، بتنمسح لما يطلع الزبون من الصفحة */
var CART = [];
var OFFERS = [];
/* ——— العروض ——— */
function paintOffers(list){
  if (!list || !list.length) return;
  OFFERS = list;
  var box = $('offerList');
  box.innerHTML = '';
  list.slice(0, 8).forEach(function(o){
    var row = el('div', 'offer');
    if (o.img){
      var im = new Image();
      im.src = o.img; im.alt = o.name || ''; im.loading = 'lazy'; im.decoding = 'async';
      im.onerror = function(){ im.remove(); };
      row.appendChild(im);
    }
    var b = el('div');
    b.style.flex = '1'; b.style.minWidth = '0';
    b.appendChild(el('div', 'o-name', o.name || ''));
    if (o.note) b.appendChild(el('div', 'o-note', o.note));
    if (o.priceNew || o.priceOld){
      var p = el('div', 'o-price');
      if (o.priceNew) p.appendChild(el('span', 'o-new', fmt(money(o.priceNew), o.cur)));
      if (o.priceOld) p.appendChild(el('span', 'o-old', fmt(money(o.priceOld), o.cur)));
      b.appendChild(p);
      if (SHOW_OLD && o.priceNew) b.appendChild(el('div', 'p-old-cur', oldStr(syp(money(o.priceNew), o.cur))));
    }
    row.appendChild(b);
    box.appendChild(row);
  });
  $('offersSec').hidden = false;
}
var ALL = [], CAT = 'الكل';
var DEFAULT_CAT_SET = false; /* أول ما توصل التصنيفات، بنحاول نفتح على "هدايا" تلقائيًا - مرة وحدة بس */
var cachedP = memo('products');
/* نداء واحد يجيب العروض والمنتجات معًا.
   Apps Script ممكن يتأخر كتير بأول طلب، فمنستنى لحد 30 ثانية، ولو فشل
   ولسا ما في منتجات معروضة منعيد المحاولة مرة وحدة قبل ما نستسلم. */
function gridNote(txt, withRetry){
  var g = $('grid');
  g.innerHTML = '';
  var e = el('div', 'empty', txt);
  e.style.gridColumn = '1 / -1';
  if (withRetry){
    var b = el('button', 'p-add', 'حاول مرة تانية');
    b.style.cssText = 'display:block;margin:12px auto 0;max-width:200px';
    b.onclick = function(){ loadMain(1); };
    e.appendChild(b);
  }
  g.appendChild(e);
}
var SLOW_TIMER = null;
function loadMain(attempt){
  if (!ALL.length){
    /* ما في نسخة محفوظة: منخلي الهيكل الرمادي، ومنطمّن الزبون إذا طوّل */
    clearTimeout(SLOW_TIMER);
    SLOW_TIMER = setTimeout(function(){
      if (!ALL.length){
        var h = document.querySelector('#grid .empty.slow');
        if (!h){
          h = el('div', 'empty slow', 'عم نجهّز المنتجات… لحظات ✨');
          h.style.gridColumn = '1 / -1';
          $('grid').insertBefore(h, $('grid').firstChild);
        }
      }
    }, 4000);
  }
  jsonp('action=all', 30000).then(function(r){
    clearTimeout(SLOW_TIMER);
    if (!(r && r.products) && !ALL.length && attempt < 2){
      loadMain(attempt + 1);
      return;
    }
    onMain(r);
    mainDone();
  });
}
function onMain(r){
  if (r && r.set){ SET = r.set; keep('set', r.set); }
  if (r && r.offers){ keep('offers', r.offers); paintOffers(r.offers); }
  if (r && r.products){
    keep('products', r.products);
    ALL = r.products;
    buildFilters();
    render();
  } else if (!ALL.length){
    buildFilters();
    gridNote('الاتصال بطيء حاليًا وما قدرنا نحمّل المنتجات.', true);
  }
  paintClub();
  paintCart();
}
function buildFilters(){
  var seen = {}, cats = ['الكل'];
  var vip = isVip();
  if (!vip && CAT === VIP_CAT) CAT = 'الكل';
  ALL.forEach(function(p){
    var c = (p.cat || '').trim();
    if (c === VIP_CAT && !vip) return;   /* قسم كبار العملاء ما بيظهر لغير الأعضاء */
    if (c && !seen[c]){ seen[c] = 1; cats.push(c); }
  });
  /* فتح الموقع افتراضيًا على تصنيف "هدايا" (مرة وحدة بس، أول ما توصل التصنيفات الحقيقية) */
  if (!DEFAULT_CAT_SET){
    DEFAULT_CAT_SET = true;
    for (var gi = 0; gi < cats.length; gi++){
      if (cats[gi].indexOf('هدايا') !== -1){ CAT = cats[gi]; break; }
    }
  }
  var f = $('filters');
  f.innerHTML = '';
  if (cats.length < 3) return;
  cats.forEach(function(c){
    var ch = el('div', 'chip' + (c === CAT ? ' on' : ''), c);
    ch.onclick = function(){
      CAT = c;
      [].forEach.call(f.children, function(x){ x.classList.remove('on'); });
      ch.classList.add('on');
      render();
    };
    f.appendChild(ch);
  });
}
var ACTIONS = [];
function paintAction(slot){
  var p = slot.p, q = qtyOf(p.name);
  slot.node.innerHTML = '';
  if (p.avail === false){
    slot.node.appendChild(el('div', 'p-out', 'غير متوفر حاليًا'));
    return;
  }
  if (money(p.price) <= 0){
    var ask = el('a', 'p-ask', 'اسأل عنه');
    ask.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' +
      encodeURIComponent('مرحبا، بدي استفسر عن: ' + (p.name || ''));
    ask.target = '_blank'; ask.rel = 'noopener';
    slot.node.appendChild(ask);
    return;
  }
  if (q === 0){
    var add = el('button', 'p-add', 'أضف للسلة');
    add.onclick = function(){ addToCart(p); };
    slot.node.appendChild(add);
    return;
  }
  var st = el('div', 'stepper');
  var minus = el('button', null, q === 1 ? '×' : '−');
  minus.setAttribute('aria-label', 'إنقاص');
  minus.onclick = function(){ setQty(p.name, -1); };
  var plus = el('button', null, '+');
  plus.setAttribute('aria-label', 'زيادة');
  plus.onclick = function(){ setQty(p.name, 1); };
  st.appendChild(minus);
  st.appendChild(el('span', null, String(q)));
  st.appendChild(plus);
  slot.node.appendChild(st);
}
function paintAllActions(){
  ACTIONS.forEach(paintAction);
}
function render(){
  var g = $('grid');
  g.innerHTML = '';
  ACTIONS = [];
  var list = ALL.filter(function(p){
    var c = (p.cat || '').trim();
    /* قسم كبار العملاء: للأعضاء بس، ولما يختاروه صراحةً (ما بينخلط مع "الكل") */
    if (c === VIP_CAT) return isVip() && CAT === VIP_CAT;
    return CAT === 'الكل' || c === CAT;
  });
  if (!list.length){
    var e = el('div', 'empty', 'لسا ما في منتجات معروضة — تواصل معنا على واتساب.');
    e.style.gridColumn = '1 / -1';
    g.appendChild(e);
    return;
  }
  list.forEach(function(p){
    var out  = (p.avail === false);
    var card = el('div', 'prod' + (out ? ' out' : ''));
    var th = el('div', 'thumb');
    /* عدة صور لنفس المنتج (p.imgs) - نقاط + عدّاد + ضغطة عالصورة تنقّل للتالية */
    var imgs = (p.imgs && p.imgs.length) ? p.imgs : (p.img ? [p.img] : []);
    if (imgs.length && SAVE){
      /* وضع التوفير: ما منحمّل ولا صورة - الزائر بيضغط على يلي بدو يشوفه */
      var ph = el('div', 'imgsave');
      ph.innerHTML = '<b>◆</b><span>اضغط لعرض الصورة</span>';
      ph.onclick = function(e){
        e.stopPropagation();
        var im2 = new Image();
        im2.alt = p.name || '';
        im2.decoding = 'async';
        im2.onerror = function(){ th.innerHTML = '<div class="noimg">◆</div>'; };
        im2.src = imgs[0];
        th.innerHTML = '';
        th.appendChild(im2);
      };
      th.appendChild(ph);
    } else if (imgs.length){
      var idx = 0;
      var im = new Image();
      /* مهم: loading و decoding لازم ينحطوا قبل src - لو انحطوا بعده
         بيكون المتصفح بلّش التحميل والتأجيل ما بيشتغل */
      im.loading = 'lazy'; im.decoding = 'async';
      im.alt = p.name || '';
      im.onerror = function(){ th.innerHTML = '<div class="noimg">◆</div>'; };
      im.src = imgs[0];
      th.appendChild(im);
      if (imgs.length > 1){
        var dots = el('div', 'tdots');
        imgs.forEach(function(_, di){ dots.appendChild(el('i', di === 0 ? 'on' : null)); });
        th.appendChild(dots);
        th.appendChild(el('div', 'tcount', '1/' + imgs.length));
        th.appendChild(el('div', 'tmodels', '◈ ' + imgs.length + ' موديل'));
        th.appendChild(el('div', 'tmhint', 'اضغط لرؤية جميع الموديلات'));
        th.style.cursor = 'pointer';
        /* ضغطة على الصورة = يفتح معرض كل الموديلات مع بعض (بدل التنقّل
           صورة صورة، يلي بيصير مرهق لما يكونوا 10 موديلات) */
        th.onclick = function(){ openGallery(p, imgs); };
      }
    } else th.innerHTML = '<div class="noimg">◆</div>';
    if (out) th.appendChild(el('span', 'badge out', 'نفد'));
    else if (p.note) th.appendChild(el('span', 'badge', p.note));
    card.appendChild(th);
    var b = el('div', 'pbody');
    b.appendChild(el('div', 'p-name', p.name || ''));
    if (money(p.price) > 0){
      b.appendChild(el('div', 'p-price', fmt(money(p.price), p.cur)));
      if (SHOW_OLD) b.appendChild(el('div', 'p-old-cur', oldStr(syp(money(p.price), p.cur))));
    }
    var act = el('div', 'p-act');
    act.style.marginTop = 'auto';
    b.appendChild(act);
    ACTIONS.push({ p: p, node: act });
    card.appendChild(b);
    g.appendChild(card);
  });
  paintAllActions();
}
