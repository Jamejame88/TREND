/* TREND — العجلة — spin.js
   اللفّة: صوت النقرة وكتمه، وما يصير بعد ما توقف العجلة. */

/* ——— محاكاة فيزيائية للعجلة ——— */

/* صوت النقرة — ضجيج قصير عبر مرشّح رنيني، أقرب لصوت الخشب من النغمة */
let AC = null, NOISE = null, SOUND = true;
try { SOUND = localStorage.getItem('trend_sound') !== '0'; } catch(e){}

function initAudio(){
  if (AC) return;
  AC = new (window.AudioContext || window.webkitAudioContext)();
  const len = Math.floor(AC.sampleRate * 0.06);
  NOISE = AC.createBuffer(1, len, AC.sampleRate);
  const d = NOISE.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
}

function peg(strength){
  if (!SOUND) return;
  try {
    initAudio();
    const t = AC.currentTime;

    const src = AC.createBufferSource();
    src.buffer = NOISE;
    src.playbackRate.value = 0.85 + strength * 0.5 + Math.random() * 0.12;

    const bp = AC.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1150 + strength * 950 + Math.random() * 160;
    bp.Q.value = 7 + strength * 4;

    const lp = AC.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5200;

    const g = AC.createGain();
    const vol = 0.03 + strength * 0.075;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035 + strength * 0.02);

    src.connect(bp); bp.connect(lp); lp.connect(g); g.connect(AC.destination);
    src.start(t); src.stop(t + 0.08);
  } catch(e){}
}
/* بعد ما توقف العجلة: باللفّة التجريبية منعرض الجائزة كعيّنة بدون رمز،
   وباللفّة الحقيقية منكمل لصفحة النتيجة والرمز. */
/* ما عاد في لفّة تجريبية - أي لفّة هي الحقيقية وبتاخد رمزها فورًا */
function afterSpin(){
  realDone = true;
  finish();
}
