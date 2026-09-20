/* TREND — cart.js
   السلة والأسعار: التنسيق، الإضافة والحذف، المجموع، ورابط طلب الواتساب. */

/* ————— السلة ————— */
function money(v){
  var s = String(v == null ? '' : v).trim();
  /* أرقام عربية/فارسية → إنكليزية */
  s = s.replace(/[٠-٩]/g, function(d){ return d.charCodeAt(0) - 0x0660; })
       .replace(/[۰-۹]/g, function(d){ return d.charCodeAt(0) - 0x06F0; });
  /* افصل فاصلة الآلاف عن الفاصلة العشرية */
  s = s.replace(/[٫]/g, '.').replace(/[,٬\s]/g, '');
  s = s.replace(/[^\d.]/g, '');
  var parts = s.split('.');
  if (parts.length > 2) s = parts[0] + '.' + parts.slice(1).join('');
  var n = parseFloat(s);
  return isFinite(n) ? n : 0;
}
function syp(n, cur){
  var step = Number(ROUND_TO) || 1;
  var rate = Number(SET && SET.rate) || 0;
  var v = (cur === 'usd' && rate > 0) ? n * rate : n;
  v = Number(v);
  if (!isFinite(v)) return 0;
  return Math.ceil(v / step) * step;
}
function oldStr(v){
  return SHOW_OLD ? (v * OLD_FACTOR).toLocaleString('en-US') + ' قديمة' : '';
}
function fmt(n, cur){
  return syp(n, cur).toLocaleString('en-US') + ' ل.س';
}
function addToCart(p, variant, variantImg){
  /* variant = رقم الموديل (اختياري) - بيخلي كل موديل سطر مستقل بالسلة
     عشان الزبونة تقدر تطلب موديلين مختلفين من نفس الصنف. */
  var label = variant ? (p.name + ' — ' + variant) : p.name;
  var i = -1;
  for (var k = 0; k < CART.length; k++) if (CART[k].name === label) i = k;
  if (i >= 0) CART[i].qty++;
  else {
    /* منحفظ صورة الموديل المختار تحديدًا (مو أول صورة بالمنتج) -
       عشان ترفق برابط الطلب ويعرف المحل شو بدها الزبونة بالضبط */
    var shot = variantImg || p.img || ((p.imgs && p.imgs[0]) || '');
    CART.push({ name: label, price: money(p.price), cur: p.cur, img: shot, qty: 1 });
    track('cart');
  }
  saveCart();
  showAddToast(label);
}

/* تنبيه عابر "أُضيف للسلة" - بينعمل لحاله أول مرة، ما بيحتاج عنصر بالصفحة */
function showAddToast(label){
  toast('✓ ' + (label || '') + ' — أُضيف للسلة', 2200);
}
/* تنبيه عابر عام أسفل الشاشة */
function toast(text, ms){
  var t = document.getElementById('addToast');
  if (!t){
    t = document.createElement('div');
    t.id = 'addToast';
    t.style.cssText =
      'position:fixed;bottom:86px;left:50%;transform:translateX(-50%) translateY(10px);' +
      'z-index:70;background:var(--panel);color:var(--gold);border:.5px solid var(--gold);' +
      'border-radius:22px;padding:10px 18px;font-size:12.5px;letter-spacing:.05em;' +
      'opacity:0;transition:opacity .3s,transform .3s;pointer-events:none;max-width:86vw;' +
      'text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.4)';
    document.body.appendChild(t);
  }
  t.textContent = text;
  requestAnimationFrame(function(){
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
  });
  clearTimeout(t._tm);
  t._tm = setTimeout(function(){
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(10px)';
  }, ms || 2200);
}
function priceNote(){
  var hasUsd = CART.some(function(c){ return c.cur === 'usd'; });
  return (hasUsd && SET.rate > 0)
    ? '\nسعر الصرف المعتمد اليوم: ' + SET.rate.toLocaleString('en-US') + ' ل.س للدولار'
    : '';
}
function setQty(name, d){
  for (var k = 0; k < CART.length; k++){
    if (CART[k].name === name){
      CART[k].qty += d;
      if (CART[k].qty < 1) CART.splice(k, 1);
      break;
    }
  }
  saveCart();
}
function cartTotal(){
  var t = 0;
  CART.forEach(function(c){ t += syp(c.price, c.cur) * c.qty; });
  return t;
}
function cartCount(){
  var n = 0;
  CART.forEach(function(c){ n += c.qty; });
  return n;
}
function qtyOf(name){
  for (var k = 0; k < CART.length; k++) if (CART[k].name === name) return CART[k].qty;
  return 0;
}
function saveCart(){
  paintCart();
  paintAllActions();
}
function paintCart(){
  var n = cartCount();
  $('cartBar').classList.toggle('on', n > 0);
  $('waBtn').style.display = n > 0 ? 'none' : 'flex';
  $('cbCount').textContent = String(n);
  $('cbTotal').textContent = cartTotal().toLocaleString('en-US') + ' ل.س';
  $('cartTotal').textContent = cartTotal().toLocaleString('en-US') + ' ل.س';
  $('cartOldCur').textContent = SHOW_OLD ? oldStr(cartTotal()) : '';
  if (!n) $('sheet').classList.remove('on');
  var box = $('cartItems');
  box.innerHTML = '';
  if (!CART.length){
    box.appendChild(el('div', 'cart-empty', 'السلة فاضية'));
    return;
  }
  CART.forEach(function(c){
    var row = el('div', 'ci');
    if (c.img){
      var im = new Image();
      im.src = c.img; im.alt = ''; im.loading = 'lazy';
      im.onerror = function(){ im.remove(); };
      row.appendChild(im);
    }
    var b = el('div', 'ci-b');
    b.appendChild(el('div', 'ci-n', c.name));
    b.appendChild(el('div', 'ci-p', fmt(c.price * c.qty, c.cur)));
    row.appendChild(b);
    var q = el('div', 'qty');
    var minus = el('button', null, '−');
    minus.onclick = function(){ setQty(c.name, -1); };
    var plus = el('button', null, '+');
    plus.onclick = function(){ setQty(c.name, 1); };
    q.appendChild(minus);
    q.appendChild(el('span', null, String(c.qty)));
    q.appendChild(plus);
    row.appendChild(q);
    box.appendChild(row);
  });
}
function orderLink(){
  var lines = ['مرحبا، بدي أطلب من TREND:', ''];
  CART.forEach(function(c){
    lines.push('• ' + c.name + ' ×' + c.qty + ' — ' + fmt(c.price * c.qty, c.cur));
    /* رابط صورة الصنف - الزبونة بتتأكد من طلبها والمحل بيعرف الموديل بالضبط.
       واتساب ما بيقبل إرفاق صور برابط wa.me، فالرابط النصي هو الحل العملي. */
    if (c.img) lines.push('   ' + c.img);
  });
  lines.push('');
  lines.push('المجموع: ' + cartTotal().toLocaleString('en-US') + ' ل.س'
    + (SHOW_OLD ? ' (' + oldStr(cartTotal()) + ')' : '') + priceNote());
  lines.push('');
  lines.push('الاسم:');
  lines.push('العنوان للتوصيل:');
  return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(lines.join('\n'));
}
