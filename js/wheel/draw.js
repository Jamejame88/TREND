/* TREND — العجلة — draw.js
   رسم العجلة: بناء الخانات والنصوص، وإبراز الخانة الفائزة. */

/* رسم العجلة - صارت دالة حتى نقدر نعيد الرسم لما تتبدل الجوائز */
function drawWheel(){
  const c = 175, R = 143, ns = 'http://www.w3.org/2000/svg';
  const wheel = $('wheel');
  wheel.setAttribute('viewBox', '0 0 350 350');

  const el = (t, a) => { const n = document.createElementNS(ns, t); for (const k in a) n.setAttribute(k, a[k]); return n; };
  const rad = d => (d - 90) * Math.PI / 180;
  const pt  = (d, r) => [c + r * Math.cos(rad(d)), c + r * Math.sin(rad(d))];

  const defs = el('defs');
  defs.innerHTML =
    '<radialGradient id="hub" cx="34%" cy="26%" r="80%">' +
      '<stop offset="0%" stop-color="#FDF8EA"/><stop offset="40%" stop-color="#C6A44E"/>' +
      '<stop offset="76%" stop-color="#8A7031"/><stop offset="100%" stop-color="#4E3E1B"/>' +
    '</radialGradient>' +
    '<radialGradient id="jew" cx="30%" cy="26%">' +
      '<stop offset="0%" stop-color="#FFFDF5"/><stop offset="55%" stop-color="#DCC176"/>' +
      '<stop offset="100%" stop-color="#6B5526"/>' +
    '</radialGradient>' +
    '<radialGradient id="ao" cx="50%" cy="50%" r="50%">' +
      '<stop offset="72%" stop-color="#000" stop-opacity="0"/>' +
      '<stop offset="100%" stop-color="#000" stop-opacity=".78"/>' +
    '</radialGradient>' +
    '<radialGradient id="glass" cx="32%" cy="20%" r="62%">' +
      '<stop offset="0%" stop-color="#fff" stop-opacity=".16"/>' +
      '<stop offset="42%" stop-color="#fff" stop-opacity=".04"/>' +
      '<stop offset="70%" stop-color="#fff" stop-opacity="0"/>' +
    '</radialGradient>' +
    '<radialGradient id="vig" cx="50%" cy="50%" r="50%">' +
      '<stop offset="55%" stop-color="#000" stop-opacity="0"/>' +
      '<stop offset="100%" stop-color="#000" stop-opacity=".5"/>' +
    '</radialGradient>' +
    '<filter id="drop" x="-45%" y="-45%" width="190%" height="190%">' +
      '<feDropShadow dx="0" dy="6" stdDeviation="9" flood-color="#000" flood-opacity=".7"/>' +
    '</filter>';
  wheel.appendChild(defs);

  /* ═══ الإطار المعدني — ثابت لا يدور، فتبقى انعكاساته مكانها ═══ */
  const rim = el('g', { filter:'url(#drop)' });
  wheel.appendChild(rim);

  const R1 = R + 8, R2 = R + 24, STEPS = 144, SW = 360 / STEPS;

  /* انعكاس معدني بفصّين — يحاكي المعدن المصقول */
  function metal(a){
    const t1 = Math.abs(Math.cos(rad(a - 38)));
    const t2 = Math.abs(Math.cos(rad(a - 218)));
    let v = 0.18 + 0.72 * Math.pow(t1, 3.2) + 0.42 * Math.pow(t2, 7);
    v = Math.max(0, Math.min(1, v));
    const lo = [74, 58, 26], hi = [253, 246, 224];
    const ch = i => Math.round(lo[i] + (hi[i] - lo[i]) * v);
    return `rgb(${ch(0)},${ch(1)},${ch(2)})`;
  }

  for (let k = 0; k < STEPS; k++){
    const a0 = k * SW, a1 = a0 + SW + 0.35;
    const [ax, ay] = pt(a0, R2), [bx, by] = pt(a1, R2);
    const [cx2, cy2] = pt(a1, R1), [dx, dy] = pt(a0, R1);
    rim.appendChild(el('path', {
      d:`M${ax} ${ay} A${R2} ${R2} 0 0 1 ${bx} ${by} L${cx2} ${cy2} A${R1} ${R1} 0 0 0 ${dx} ${dy} Z`,
      fill: metal(a0 + SW / 2)
    }));
  }

  /* حزّ داخلي وخارجي يعطي حدّة الحافة */
  rim.appendChild(el('circle', { cx:c, cy:c, r:R2, fill:'none', stroke:'#3A2E14', 'stroke-width':1.2, opacity:.9 }));
  rim.appendChild(el('circle', { cx:c, cy:c, r:R1 + 1, fill:'none', stroke:'#2A2110', 'stroke-width':1.6, opacity:.85 }));

  /* براغي مثبّتة على الإطار */
  for (let k = 0; k < 12; k++){
    const [sx, sy] = pt(k * 30 + 15, (R1 + R2) / 2);
    rim.appendChild(el('circle', { cx:sx, cy:sy, r:3.1, fill:'#33280F', opacity:.8 }));
    rim.appendChild(el('circle', { cx:sx, cy:sy, r:2.4, fill:'url(#jew)' }));
    rim.appendChild(el('circle', { cx:sx - .6, cy:sy - .7, r:.8, fill:'#FFFDF4', opacity:.8 }));
  }

  /* تجويف داكن يحيط بالقرص الدوّار */
  wheel.appendChild(el('circle', { cx:c, cy:c, r:R1, fill:'#0B0908' }));

  /* ═══ القرص الدوّار ═══ */
  const g = el('g', { id:'spinGroup' });
  wheel.appendChild(g);

  PRIZES.forEach((p, i) => {
    const a0 = i * ARC, a1 = a0 + ARC;
    const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R);
    const d = `M${c} ${c} L${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} Z`;

    g.appendChild(el('path', { d, fill: i % 2 ? '#150F0E' : '#2C221C' }));
    g.appendChild(el('path', { id:'seg' + i, d, fill:'#EBD9A8', opacity:0, style:'transition:opacity .45s ease' }));

    /* ضلع مرتفع بين الخانات: ظل ثم لمعة */
    const [sx, sy] = pt(a0, R);
    g.appendChild(el('path', { d:`M${c} ${c} L${sx} ${sy}`, stroke:'#0A0706', 'stroke-width':2.4, opacity:.9 }));
    const [hx, hy] = pt(a0 + .55, R);
    g.appendChild(el('path', { d:`M${c} ${c} L${hx} ${hy}`, stroke:'#C6A44E', 'stroke-width':.8, opacity:.55 }));

    const mid = a0 + ARC / 2;
    const lines = p.lines || [p.label];
    const t = el('text', {
      x:c, y:c - 100, 'text-anchor':'middle', fill:'#F2E5BE',
      'font-size':12.5, 'font-family':'IBM Plex Sans Arabic, sans-serif',
      'font-weight':300, 'letter-spacing':'.02em',
      transform:`rotate(${mid} ${c} ${c})`
    });
    lines.forEach((ln, k) => {
      const sp = el('tspan', { x:c, dy: k === 0 ? 0 : 16 });
      sp.textContent = ln;
      if (k === 0) sp.setAttribute('font-weight', '500');
      t.appendChild(sp);
    });
    g.appendChild(t);
  });

  /* المسامير على حافة القرص */
  PRIZES.forEach((p, i) => {
    const [px, py] = pt(i * ARC, R + 3);
    g.appendChild(el('circle', { cx:px, cy:py + 1, r:5, fill:'#000', opacity:.5 }));
    g.appendChild(el('circle', { cx:px, cy:py, r:4.4, fill:'url(#jew)' }));
    g.appendChild(el('circle', { cx:px - 1.1, cy:py - 1.3, r:1.2, fill:'#FFFDF4', opacity:.85 }));
  });

  /* المحور */
  g.appendChild(el('circle', { cx:c, cy:c, r:36, fill:'#0A0706', opacity:.6 }));
  g.appendChild(el('circle', { cx:c, cy:c, r:33, fill:'url(#hub)' }));
  g.appendChild(el('circle', { cx:c, cy:c, r:25, fill:'#100D0C' }));
  g.appendChild(el('circle', { cx:c, cy:c, r:25, fill:'none', stroke:'#C6A44E', 'stroke-width':.7, opacity:.45 }));
  g.appendChild(el('circle', { cx:c, cy:c, r:18, fill:'none', stroke:'#C6A44E', 'stroke-width':.4, opacity:.25 }));
  g.appendChild(el('circle', { cx:c, cy:c, r:6,  fill:'url(#jew)' }));
  g.setAttribute('style', 'transform-origin:' + c + 'px ' + c + 'px');

  /* ═══ طبقات ثابتة فوق القرص ═══ */
  wheel.appendChild(el('circle', { cx:c, cy:c, r:R1, fill:'url(#ao)',    'pointer-events':'none' }));
  wheel.appendChild(el('circle', { cx:c, cy:c, r:R1, fill:'url(#vig)',   'pointer-events':'none' }));
  wheel.appendChild(el('circle', { cx:c, cy:c, r:R1, fill:'url(#glass)', 'pointer-events':'none' }));

  /* منطقة ضغط شفافة على المحور (ثابتة، ما بتلف مع القرص) -
     الضغط عليها = نفس ضغط زر "لِف". نصف قطرها 36 ليسهل ضغطها بالإصبع. */
  const hubBtn = el('circle', { cx:c, cy:c, r:36, fill:'transparent', cursor:'pointer' });
  hubBtn.setAttribute('role', 'button');
  hubBtn.setAttribute('tabindex', '0');
  hubBtn.setAttribute('aria-label', 'لِف العجلة');
  hubBtn.addEventListener('click', () => {
    if (!REAL){ showForm(); return; }   /* ضغطة المحور قبل التسجيل = تسجيل */
    const sp = $('spin');
    if (sp && !sp.disabled) sp.click();
  });
  hubBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hubBtn.dispatchEvent(new Event('click')); }
  });
  wheel.appendChild(hubBtn);
}
/* إبراز الخانة الفائزة بعد التوقف */
function hilite(i){
  const seg = document.getElementById('seg' + i);
  if (!seg) return;
  let n = 0;
  const pulse = () => {
    seg.style.opacity = (n % 2 ? 0.06 : 0.20);
    if (++n < 6) setTimeout(pulse, 260);
    else seg.style.opacity = 0.10;
  };
  pulse();
}
