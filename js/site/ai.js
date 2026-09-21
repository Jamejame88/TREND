/* TREND — ai.js
   المساعد الذكي: نافذة المحادثة، أزرار الأقسام، شريط الاقتراحات، إرسال السؤال. */

/* ————— المساعد الذكي ————— */
var AI_HIST = [];

/* الأقسام كما هي بالشيت. الترتيب هون هو ترتيب الأزرار بالمحادثة. */
var AI_CATS = ['هدايا', 'عطر', 'إكسسوار', 'حقائب/جزدان', 'مكياج', 'ألعاب'];
var AI_CAT  = '';   /* القسم المختار حاليًا — فاضي يعني كل البضاعة */

function aiAdd(cls, text){
  var log = $('aiLog');
  var m = el('div', 'msg ' + cls, text);
  log.appendChild(m);
  log.scrollTop = log.scrollHeight;
  return m;
}

/* صف أزرار الأقسام — بيضل ظاهر فوق المحادثة، والزبون فيه يبدّل القسم بأي لحظة.
   ما بينادي النموذج أبدًا، فهو فوري وبدون أي استهلاك. */
function aiCatBar(){
  var row = el('div', 'qs');
  row.id = 'aiCatBar';
  var btns = [];

  function paint(){
    for (var i = 0; i < btns.length; i++){
      var on = (btns[i].getAttribute('data-cat') || '') === AI_CAT;
      btns[i].style.color       = on ? 'var(--gold-lt)' : '';
      btns[i].style.borderColor = on ? 'var(--gold)'    : '';
    }
  }

  function make(label, cat){
    var b = el('button', '', label);
    b.type = 'button';
    b.setAttribute('data-cat', cat);
    b.onclick = function(){
      AI_CAT = cat;
      paint();
      if (cat){
        aiAdd('a', 'تمام، قسم ' + label + '. قلّي لمين الهدية وشو ميزانيتك تقريبًا، وبرشّحلك.');
      } else {
        aiAdd('a', 'ولا يهمك. قلّي لمين الهدية وشو ميزانيتك، وبدوّرلك بكل البضاعة.');
      }
      $('aiInput').focus();
    };
    btns.push(b);
    row.appendChild(b);
  }

  for (var i = 0; i < AI_CATS.length; i++) make(AI_CATS[i], AI_CATS[i]);
  make('مو متأكد', '');
  paint();
  $('aiLog').appendChild(row);
}

function aiOpen(){
  $('aiWrap').classList.add('on');
  if (!AI_HIST.length && !$('aiLog').children.length){
    aiAdd('a', 'أهلاً فيك 🌿 اختار القسم يلي ببالك، أو اكتبلي مباشرة لمين الهدية وشو ميزانيتك.');
    aiCatBar();
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

  /* القسم بينبعت جوّا نص السؤال — بدون أي معامل جديد بالرابط */
  var sent = AI_CAT ? ('[قسم: ' + AI_CAT + '] ' + q) : q;
  var hist = JSON.stringify(AI_HIST.slice(-4));

  jsonp('action=ask&q=' + encodeURIComponent(sent) + '&h=' + encodeURIComponent(hist), 55000)
    .then(function(r){
      clearTimeout(slow);
      $('aiStat').classList.remove('on');
      $('aiStrip').classList.remove('on');
      var reply = (r && r.reply) ? r.reply
        : 'ما وصلني رد. جرّب مرة تانية أو تواصل معنا على واتساب.';
      aiAdd('a', reply);
      AI_HIST.push({ r:'u', t:q }, { r:'a', t:reply });
      if (AI_HIST.length > 6) AI_HIST = AI_HIST.slice(-6);
    });
}
