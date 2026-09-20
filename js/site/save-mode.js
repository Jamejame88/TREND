/* TREND — save-mode.js
   وضع توفير البيانات: التشغيل التلقائي على النت البطيء، وقياس سرعة تحميل الصور. */

/* ————— وضع توفير البيانات —————
   الصور هي 99% من وزن الصفحة. بهاد الوضع ما بتنحمّل ولا صورة تلقائيًا،
   والزائر بيضغط على يلي بدو يشوفه. بينفتح لحاله أول مرة إذا:
   - المتصفح مفعّل عنده "توفير البيانات"، أو
   - الشبكة بطيئة (2g / slow-2g)
   وبيقدر يطفيه بضغطة، والاختيار بينحفظ بالجهاز. */
var SAVE_KEY = 'trend_save';
var SAVE = false, saveAuto = false;


function paintSaveBtn(){
  var b = $('saveBtn'), n = $('saveNote');
  if (b){
    b.classList.toggle('on', SAVE);
    $('saveTxt').textContent = SAVE ? 'التوفير شغّال' : 'توفير';
    b.title = SAVE ? 'الصور ما بتنحمّل - اضغط لإطفاء التوفير' : 'وضع توفير البيانات';
  }
  if (n){
    if (SAVE && saveAuto){
      n.hidden = false;
      n.innerHTML = '⚡ شغّلنا <b>وضع التوفير</b> لأنه النت عندك بطيء — الصور بتنحمّل لما تضغط عليها. اضغط زر "التوفير" فوق لإطفائه.';
    } else { n.hidden = true; }
  }
}


/* ——— قياس فعلي لسرعة النت (بيشتغل على كل الأجهزة، حتى الآيفون) ———
   منراقب زمن تحميل أول 3 صور من imgbb. إذا الوسيط طوّل أكتر من 3 ثواني،
   أو صورة وحدة طوّلت أكتر من 8، منشغّل التوفير لحاله لباقي الصور.
   ما منقيس طلب المنتجات لأنه بطؤه ممكن يكون من Apps Script مو من نت الزبون.
   ولو الزبون طفّى التوفير بإيده من قبل، ما منرجع نشغّله. */
var SLOW_IMG_MS = 3000, VERY_SLOW_IMG_MS = 8000;

function autoSave(){
  if (SAVE) return;
  try { if (localStorage.getItem(SAVE_KEY) !== null) return; } catch(e){}
  SAVE = true; saveAuto = true;
  paintSaveBtn();
  applySaveToPending();
  toast('⚡ النت بطيء — شغّلنا وضع التوفير. اضغط "توفير" فوق لإطفائه', 5000);
}

/* الصور يلي لسا ما نزلت بتتحول لـ"اضغط لعرض الصورة"، ويلي نزلت بتضل */
function applySaveToPending(){
  var ims = document.querySelectorAll('#grid .thumb img');
  [].forEach.call(ims, function(im){
    if (im.complete && im.naturalWidth > 0) return;
    var src = im.getAttribute('src');
    if (!src) return;
    var ph = el('div', 'imgsave');
    ph.innerHTML = '<b>◆</b><span>اضغط لعرض الصورة</span>';
    ph.onclick = function(e){
      e.stopPropagation();
      var n = new Image();
      n.alt = im.alt || '';
      n.decoding = 'async';
      n.src = src;
      ph.replaceWith(n);
    };
    im.removeAttribute('src');   /* بيوقف التحميل الجاري */
    im.replaceWith(ph);
  });
}
