/* TREND — gallery.js
   معرض موديلات المنتج: فتح، تنقّل بين الصور، إغلاق. */

/* ————— معرض الموديلات —————
   كل الموديلات بنفس السعر (قرار صاحب المحل: سعر واحد لكل قسم)،
   فالإضافة للسلة بتضيف نفس المنتج مهما كان الموديل المختار.
   الموديل المحدد بينكتب بملاحظة الطلب حتى يعرف المحل شو بدها الزبونة. */
var galProduct = null, galImgs = [], galPick = 0;

function openGallery(p, imgs){
  galProduct = p; galImgs = imgs || []; galPick = 0;
  $('galName').textContent = p.name || '';
  $('galCount').textContent = galImgs.length + ' موديل — اضغط على الموديل يلي بيعجبك';
  $('galPrice').textContent = (typeof money === 'function' && money(p.price) > 0)
    ? fmt(money(p.price), p.cur) : '';
  renderGallery();
  $('gal').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function renderGallery(){
  var big = $('galBig');
  big.innerHTML = galImgs.length
    ? '<img src="' + galImgs[galPick] + '" alt="">' +
      '<div>الموديل رقم ' + (galPick + 1) + '</div>'
    : '';
  var grid = $('galGrid');
  grid.innerHTML = '';
  galImgs.forEach(function(src, i){
    var im = new Image();
    im.src = src; im.loading = 'lazy'; im.decoding = 'async';
    if (i === galPick) im.className = 'sel';
    im.onclick = function(){
      galPick = i;
      renderGallery();
      $('galBig').scrollIntoView({ behavior:'smooth', block:'nearest' });
    };
    grid.appendChild(im);
  });
}

function closeGallery(){
  $('gal').classList.remove('on');
  document.body.style.overflow = '';
}
