/* TREND — club.js
   نادي TREND: بطاقة النادي، نموذج الانضمام، ومؤشر النقاط بصناديق الهدايا. */

function paintClub(){
  var vip = isVip(), member = getMember();
  var sec = $('club'), card = $('clubCard');
  var btn = $('clubBtn'), btxt = $('clubBtnTxt');
  if (btn) btn.classList.toggle('on', vip);
  if (btxt) btxt.textContent = vip
    ? ('نادي ترند — ' + ((member && member.name) ? member.name : 'عضو') + ' ★')
    : 'نادي ترند — كبار العملاء';
  if (!sec || !card) return;
  sec.hidden = false;
  card.innerHTML = '';
  card.appendChild(el('div', 'cseal', 'TREND'));
  card.appendChild(el('h3', null, 'نادي عملاء TREND — VIP'));
  card.appendChild(el('div', 'clubmotto', 'شركاء البدايات هم شركاء النجاح'));

  var perks = [
    { t: 'أولوية على الوارد الجديد', d: 'بتشوف كل قطعة جديدة قبل ما تنزل لباقي الزباين.' },
    { t: 'امتيازات الأعضاء',         d: 'مميزات إضافية مخصّصة لأعضاء النادي، بتتجدد كل فترة.' },
    { t: 'نقاط على مشترياتك',        d: 'بتتجمّع مع كل فاتورة، وبتستبدلها بهدية من المحل.' }
  ];
  function perkList(){
    var box = el('div', 'clubperks');
    perks.forEach(function(k, i){
      var row = el('div', 'perk');
      row.appendChild(el('div', 'perk-n', String(i + 1)));
      var col = el('div');
      var t = el('div', 'perk-t', k.t);
      if (k.soon) t.appendChild(el('span', 'perk-soon', 'قريبًا'));
      col.appendChild(t);
      col.appendChild(el('div', 'perk-d', k.d));
      row.appendChild(col);
      box.appendChild(row);
    });
    return box;
  }

  if (vip && member){
    /* ——— عضو: مؤشر النقاط + مدخل القسم المقفل ——— */
    var pts = el('div', 'ptswrap');
    pts.innerHTML = '<div class="ptslbl">جارٍ تحديث نقاطك…</div>';
    card.appendChild(pts);
    loadPointsPanel(pts, member.phone);

    var has = ALL.some(function(p){ return (p.cat || '').trim() === VIP_CAT; });
    if (has){
      var go = el('div', 'cta', 'ادخل قسم كبار العملاء');
      go.style.cursor = 'pointer';
      go.onclick = function(){
        CAT = VIP_CAT;
        buildFilters(); render();
        var g = $('grid');
        if (g) window.scrollTo({ top: g.offsetTop - 80, behavior: 'smooth' });
      };
      card.appendChild(go);
    } else {
      card.appendChild(el('p', 'o-note', 'قسم كبار العملاء عم نجهّزه — أول ما ينزل بتشوفه هون قبل الكل.'));
    }
    card.appendChild(perkList());
    var out = el('div', 'ptscap', 'مو إنت؟ اضغط للخروج');
    out.style.cursor = 'pointer';
    out.style.marginTop = '14px';
    out.onclick = function(){ setMember(null); setVip(false); paintClub(); buildFilters(); render(); };
    card.appendChild(out);
  } else {
    /* ——— زائر: نموذج الانضمام ——— */
    card.appendChild(perkList());
    var form = el('div', 'clubform');
    var iName = document.createElement('input');
    iName.type = 'text'; iName.placeholder = 'اسمك';
    var iPhone = document.createElement('input');
    iPhone.type = 'tel'; iPhone.placeholder = 'رقم موبايلك';
    iPhone.setAttribute('dir', 'ltr');
    var go2 = document.createElement('button');
    go2.className = 'clubbtn'; go2.type = 'button'; go2.textContent = 'انضم للنادي';
    var msg = el('div', 'clubmsg');
    form.appendChild(iName); form.appendChild(iPhone); form.appendChild(go2); form.appendChild(msg);
    card.appendChild(form);

    go2.onclick = function(){
      var nm = iName.value.trim(), phv = iPhone.value.trim();
      if (!nm){ msg.style.color = '#d98c8c'; msg.textContent = 'اكتب اسمك أول'; return; }
      if (phv.replace(/\D/g, '').length < 9){ msg.style.color = '#d98c8c'; msg.textContent = 'الرقم مو مكتمل'; return; }
      go2.disabled = true; msg.style.color = ''; msg.textContent = 'لحظة…';
      portal('register', phv, nm).then(function(res){
        if (!res || !res.ok){
          msg.style.color = '#d98c8c';
          msg.textContent = (res && res.message) || 'ما زبطت — جرّب مرة تانية';
          go2.disabled = false; return;
        }
        setMember({ phone: res.phone, name: res.name || nm });
        setVip(true);
        paintClub(); buildFilters(); render();
        /* لو كان نزّل التطبيق قبل ما يسجّل، هلق صار عنده رقم - منعطيه نقاطه */
        if (STANDALONE) setTimeout(claimInstallBonus, 600);
        var s2 = $('club'); if (s2) s2.scrollIntoView({ behavior: 'smooth' });
      }).catch(function(err){
        msg.style.color = '#d98c8c';
        msg.textContent = (err && err.message) || 'ما زبطت — جرّب مرة تانية';
        go2.disabled = false;
      });
    };
  }
}

/* بيجيب نقاط العضو من الدالة الوسيطة ويرسم المحطات الأربع كصناديق هدايا */
/* صندوق هدية بمنظور ثلاثي الأبعاد: وجه أمامي + جانب مظلّل + غطاء علوي بمنظور،
   وشريط ذهبي فاتح يلتف على الوجهين + فيونكة. متدرّجات مختلفة لكل سطح
   عشان يبان الحجم والعمق بدون أي صورة خارجية. */
var GIFT_SVG = [
'<svg class="giftbox" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">',
  '<defs>',
    '<linearGradient id="gfront" x1="0" y1="0" x2="0" y2="1">',
      '<stop offset="0" stop-color="#8C6B2F"/><stop offset="1" stop-color="#4A3617"/></linearGradient>',
    '<linearGradient id="gside" x1="0" y1="0" x2="1" y2="0">',
      '<stop offset="0" stop-color="#3A2A12"/><stop offset="1" stop-color="#5C4520"/></linearGradient>',
    '<linearGradient id="glid" x1="0" y1="0" x2="1" y2="1">',
      '<stop offset="0" stop-color="#E8D5A0"/><stop offset=".5" stop-color="#C9A961"/>',
      '<stop offset="1" stop-color="#9A7B3A"/></linearGradient>',
    '<linearGradient id="glidside" x1="0" y1="0" x2="1" y2="0">',
      '<stop offset="0" stop-color="#8A6C33"/><stop offset="1" stop-color="#B08F4A"/></linearGradient>',
    '<linearGradient id="gribbon" x1="0" y1="0" x2="0" y2="1">',
      '<stop offset="0" stop-color="#F3E4B8"/><stop offset="1" stop-color="#C9A961"/></linearGradient>',
  '</defs>',
  /* ظل تحت الصندوق */
  '<ellipse cx="32" cy="58" rx="19" ry="3.2" fill="#000" opacity=".28"/>',
  /* جسم الصندوق: وجه أمامي + جانب أيمن بمنظور */
  '<path d="M12 26 L40 26 L40 54 L12 54 Z" fill="url(#gfront)"/>',
  '<path d="M40 26 L52 20 L52 48 L40 54 Z" fill="url(#gside)"/>',
  /* شريط عمودي على الوجه والجانب */
  '<path d="M23.5 26 L28.5 26 L28.5 54 L23.5 54 Z" fill="url(#gribbon)" opacity=".95"/>',
  '<path d="M40 26 L52 20 L52 26 L40 32 Z" fill="url(#gribbon)" opacity=".28"/>',
  /* الغطاء: سطح علوي بمنظور + واجهة الغطاء + جانبه */
  '<path d="M8 18 L36 18 L48 12 L20 12 Z" fill="url(#glid)"/>',
  '<path d="M8 18 L36 18 L36 26 L8 26 Z" fill="url(#glid)" opacity=".82"/>',
  '<path d="M36 18 L48 12 L48 20 L36 26 Z" fill="url(#glidside)"/>',
  /* الفيونكة */
  '<path d="M26 12 C20 4 12 8 18 12 Z" fill="url(#gribbon)"/>',
  '<path d="M26 12 C32 4 40 8 34 12 Z" fill="url(#gribbon)"/>',
  '<circle cx="26" cy="12.5" r="2.6" fill="#F3E4B8"/>',
'</svg>'].join('');

function loadPointsPanel(box, phone){
  portal('status', phone).then(function(res){
    if (!res || !res.ok){
      box.innerHTML = '<div class="ptslbl">' + ((res && res.message) || 'ما قدرنا نجيب نقاطك هلق') + '</div>';
      return;
    }
    var pts = Number(res.points) || 0;
    var tiers = (res.tiers || []).slice(0, 4);
    if (!tiers.length){
      box.innerHTML = '<div class="ptsnum">' + pts + '</div><div class="ptslbl">نقطة</div>';
      return;
    }

    var top = tiers[tiers.length - 1].points_required || 1;
    var pct = Math.max(0, Math.min(100, (pts / top) * 100));
    var next = null;
    for (var i = 0; i < tiers.length; i++){
      if (tiers[i].points_required > pts){ next = tiers[i]; break; }
    }

    var boxes = tiers.map(function(t, i){
      var done = pts >= t.points_required;
      return '<div class="gift' + (done ? ' done' : '') + '" data-i="' + i + '">' +
               GIFT_SVG +
               '<div class="giftpts">' + t.points_required + '</div>' +
               '<div class="giftval">نقطة</div>' +
             '</div>';
    }).join('');

    box.innerHTML =
      (CLUB_IMG
        ? '<img class="ptsimg" src="' + CLUB_IMG + '" alt="هدايا نادي ترند" ' +
          'onerror="this.style.display=\'none\'">'
        : '') +
      '<div class="ptsnum">' + pts + '</div>' +
      '<div class="ptslbl">نقطة</div>' +
      '<div class="ptshow">' +
        '<div class="ptshow-t">كيف بتجمّع نقاطك؟</div>' +
        '<div class="ptshow-s">' +
          '<span>عند كل عملية شراء، اعطي رقم موبايلك للكاشير — نقاطك بتنضاف تلقائيًا.</span></div>' +
      '</div>' +
      '<div class="ptstrack"><div class="ptsfill" style="width:' + pct + '%"></div></div>' +
      '<div class="giftrow">' + boxes + '</div>' +
      '<div id="giftPanelHost"></div>' +
      '<div class="ptsnext">' + (next
        ? ('باقي <b style="color:var(--gold)">' + (next.points_required - pts) + '</b> نقطة للهدية الجاية')
        : 'وصلت لأعلى محطة — اسأل عن هديتك بالمحل 🎁') + '</div>';

    /* ضغطة على صندوق: بيكبر ويغمق، وبيفتح تحته الأصناف يلي بياخدها بهاي المحطة */
    var host = box.querySelector('#giftPanelHost');
    var openIdx = null;
    box.querySelectorAll('.gift').forEach(function(g){
      g.addEventListener('click', function(){
        var i = Number(g.getAttribute('data-i'));
        box.querySelectorAll('.gift').forEach(function(x){ x.classList.remove('open'); });
        if (openIdx === i){ openIdx = null; host.innerHTML = ''; return; }
        openIdx = i;
        g.classList.add('open');
        var t = tiers[i];
        var done = pts >= t.points_required;
        var items = t.items || [];
        host.innerHTML =
          '<div class="giftpanel">' +
            '<h4>هدية بقيمة ' + Number(t.gift_value).toFixed(0) + ' ل.س</h4>' +
            '<div class="gp-state">' + (done
              ? '✓ مفتوحة — اطلبها من المحل'
              : 'باقي ' + (t.points_required - pts) + ' نقطة') + '</div>' +
            (items.length
              ? items.map(function(n){ return '<div class="gp-item">' + n + '</div>'; }).join('')
              : '<div class="gp-item">الأصناف بتنزل قريبًا</div>') +
          '</div>';
      });
    });
  }).catch(function(){
    box.innerHTML = '<div class="ptslbl">ما قدرنا نجيب نقاطك هلق</div>';
  });
}
