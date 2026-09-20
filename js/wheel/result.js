/* TREND — العجلة — result.js
   النتيجة: اختيار الجائزة، توليد الرمز، صفحة الجائزة، وحفظها بالسيرفر. */

function pickPrize(){
  /* باللفّة التجريبية كل الخانات بنفس الاحتمال (لو الإعداد مفعّل)،
     وباللفّة الحقيقية منستخدم الأوزان الفعلية. */
  if (!REAL && CONFIG.demoEqualWeights){
    return Math.floor(Math.random() * SEG);
  }
  const total = PRIZES.reduce((s, p) => s + p.weight, 0);
  let n = Math.random() * total;
  for (let i = 0; i < SEG; i++){ n -= PRIZES[i].weight; if (n <= 0) return i; }
  return 0;
}
function makeCode(tag){
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return tag + '-' + s;
}

/* نفس الحساب الموجود بـ Apps Script — لازم يبقوا متطابقين */
function idFromCode(code){
  const s = String(code || '');
  if (!s) return '#0000';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return '#' + (1000 + (h % 9000));
}
function finish(){
  const code = makeCode(picked.tag);
  const pid  = idFromCode(code);
  const exp  = new Date(Date.now() + CONFIG.expiryDays * 864e5);
  const expStr = exp.toLocaleDateString('ar-SY', { day:'numeric', month:'long' });

  /* تقفل العجلة فورًا وبتحفظ النتيجة كاملة - حتى لو رجع للخلف */
  markSpunToday(code, picked.label, expStr);
  entry.prize = picked.label;
  entry.code  = code;
  entry.expiry = exp.toISOString().slice(0, 10);
  entry.at = new Date().toISOString();

  $('prizeText').textContent  = picked.label;
  $('codeText').textContent   = code;
  $('expiryText').textContent = 'صالح لغاية ' + expStr;
  const pidEl = $('pidText');
  if (pidEl) pidEl.textContent = 'رقمك على الشريط: ' + pid;

  const msg = `مرحبا، بدي فعّل رمز عجلة الحظ.
الاسم: ${entry.name}
الجائزة: ${entry.prize}
الرمز: ${entry.code}
رقم التعريف: ${pid}`;
  $('waBtn').onclick = () => window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
  const appB = $('appBtn');
  if (appB) appB.href = CONFIG.siteUrl + '#club';   /* بيفتح الموقع على قسم النادي وزر التنزيل */
  $('copyBtn').onclick = async () => {
    try { await navigator.clipboard.writeText(code); $('copied').classList.add('on'); } catch(e){}
  };

  save(entry);

  /* تُحتسب اللفّة هنا فقط — بعد تسجيل ناجح */
  try {
    const t = new Image();
    t.src = CONFIG.sheetUrl + '?action=track&ev=spin&callback=cb&_=' + Date.now();
  } catch(e){}

  $('stepForm').classList.remove('on');
  $('stepResult').classList.add('on');
}

function save(data){
  if (!CONFIG.sheetUrl) return;
  fetch(CONFIG.sheetUrl, {
    method:'POST', mode:'no-cors',
    headers:{ 'Content-Type':'text/plain;charset=utf-8' },
    body: JSON.stringify(data)
  }).catch(() => {});
}
