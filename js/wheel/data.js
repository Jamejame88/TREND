/* TREND — العجلة — data.js
   البيانات: الاتصال بدالة customer-portal بـSupabase، جلب الجوائز، والتحقق من الرقم. */

const SB_URL  = 'https://incloqbhtksnxqiohvaw.supabase.co';
const SB_ANON = 'sb_publishable_jfAFLXWXJpIrRfkd_CcWlw_xjGgEUEX';

function portal(action, extra){
  return fetch(SB_URL + '/functions/v1/customer-portal', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'apikey': SB_ANON, 'Authorization': 'Bearer ' + SB_ANON },
    body: JSON.stringify(Object.assign({ action }, extra || {})),
  }).then(r => r.json()).catch(() => null);
}

/* بيحوّل صف قاعدة البيانات لشكل الجائزة يلي بتفهمه العجلة */
function rowToPrize(r){
  return {
    label: r.label,
    lines: [r.line1 || r.label, r.line2 || ''].filter(x => x !== ''),
    weight: Number(r.weight) || 1,
    tag: String(r.tag || 'GEN').toUpperCase(),
  };
}

/* بيبدّل مجموعة الجوائز ويعيد رسم العجلة */
function setPrizes(list){
  if (!Array.isArray(list) || list.length < 3) return false;
  PRIZES = list;
  SEG = PRIZES.length;
  ARC = 360 / SEG;
  const w = $('wheel');
  if (w) w.innerHTML = '';
  drawWheel();
  return true;
}
/* التحقق من أن الرقم ما جرّب اليوم */
async function checkAllowed(phone){
  const res = await jsonp('phone=' + encodeURIComponent(phone));
  return !(res && res.allowed === false);
}
