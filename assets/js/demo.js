(function(){
  var D0 = '2026-10-24';
  var ROASTS = ['2026-10-28','2026-11-04','2026-11-11'];
  var DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function P(s){ return new Date(s + 'T00:00:00Z'); }
  function add(s, n){ var d = P(s); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function ix(s){ return Math.round((P(s) - P(D0)) / 864e5); }
  function at(i){ return add(D0, i); }
  function f(s){ var d = P(s); return DOW[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; }
  function chipTxt(s){ var d = P(s); return DOW[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; }
  function kg(n){ var r = Math.round(n * 100) / 100; return Math.abs(r * 10 - Math.round(r * 10)) < 1e-6 ? String(Math.round(r * 10) / 10) : r.toFixed(2); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function mins(t){ var m = t.match(/(\d+):(\d+)\s*(am|pm)/); var h = +m[1] % 12; if (m[3] === 'pm') h += 12; return h * 60 + (+m[2]); }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PRODUCTS = {
    ratnagiri: { name: 'Ratnagiri Peaberry', short: 'Ratnagiri', price: 700, color: '#6E4424', notes: 'Marzipan, sweet biscuit, creamy mouthfeel' },
    melkodige: { name: 'Melkodige Estate', short: 'Melkodige', price: 750, color: '#9C4A2A', notes: 'Dark cherry, mulberry, sweet finish' }
  };
  var NAMES = { lean: 'LEAN Blend', coldbrew: 'Cold Brew Blend BOLD', ratnagiri: 'Ratnagiri Peaberry', forte: 'Barista Forte Blend', gungegiri: 'Gungegiri Estate', melkodige: 'Melkodige Estate' };
  var BASE = {
    '2026-10-28': { lean: [0, 22], coldbrew: [2, 7], ratnagiri: [0, 6.5], forte: [3, 2], gungegiri: [0.5, 3.5], melkodige: [0, 3] },
    '2026-11-04': { lean: [0, 23], coldbrew: [0, 8], ratnagiri: [0, 6], forte: [0, 5], gungegiri: [0, 4], melkodige: [0, 3] },
    '2026-11-11': { lean: [0, 24], coldbrew: [0, 8], ratnagiri: [0, 6], forte: [0, 5], gungegiri: [0, 4], melkodige: [0, 3] }
  };
  var BG = {
    '2026-10-28': [{ d: '2026-10-26', t: '10:15 am', who: 'Bean There Cafe', c: 'lean', kg: 10 }, { d: '2026-10-27', t: '11:40 am', who: 'Kaapi Corner', c: 'ratnagiri', kg: 4 }],
    '2026-11-04': [{ d: '2026-11-02', t: '10:05 am', who: 'Bean There Cafe', c: 'lean', kg: 10 }, { d: '2026-11-03', t: '11:20 am', who: 'Kaapi Corner', c: 'ratnagiri', kg: 4 }],
    '2026-11-11': []
  };

  function fresh(){ return { day: 0, optin: null, cups: null, act: null, pick: null, paid: false, cafe: {}, tab: 'riya', view: 'phone', shown: { riya: 0, cafe: 0 }, seen: { riya: 0, cafe: 0 }, seenLog: 0 }; }
  var S = fresh();
  var typing = { riya: false, cafe: false };
  var timer = null;
  var lastDay = null, booted = false, pendingFly = null, prevStatus = null;
  var prevNum = {}, prevW = {};
  var coached = { reply: false, next: false };

  function plan(cups){
    var daily = 15 * cups, runIdx = Math.floor(250 / daily), runOut = at(runIdx), R = null, late = false;
    ROASTS.forEach(function(r){ if (add(r, 3) <= add(runOut, -1)) R = r; });
    if (!R){ late = true; R = ROASTS.filter(function(r){ return ix(r) - 2 >= 1; })[0]; }
    var remind = ix(R) - 2 >= 1 ? add(R, -2) : at(1);
    return { cups: cups, daily: daily, runIdx: runIdx, runOut: runOut, R: R, late: late, remind: remind, arrive: add(R, 3) };
  }

  function cupsLabel(c){ return c === 1 ? '1 cup' : c + ' cups'; }

  /* Riya's chat, built from her replies so far */
  function riya(){
    var m = [], out = { m: m, opts: null, P: plan(S.cups || 2), chosen: 'ratnagiri' };
    function bot(day, t, o){ m.push(Object.assign({ day: day, t: t, from: 'in' }, o)); }
    function me(day, t, text, log){ m.push({ day: day, t: t, from: 'out', text: text, log: log }); }
    var Pl = out.P;
    bot(0, '11:12 am', { kind: 'card', title: 'Delivered today. Enjoy your coffee.', p: 'ratnagiri', meta: '250 g, V60 grind', log: "Riya's 250 g of Ratnagiri delivered" });
    bot(0, '11:12 am', { text: "Want a message before this bag runs out? We time it to our roast days, so the next bag is fresh." });
    if (!S.optin){ out.opts = { day: 0, list: [['optin', 'yes', 'Yes please'], ['optin', 'no', 'No thanks']] }; return out; }
    if (S.optin === 'no'){
      me(0, '11:14 am', 'No thanks', 'Riya said no to reminders');
      bot(0, '11:14 am', { text: 'No problem. Reply REMIND any time and we will set it up.' });
      return out;
    }
    me(0, '11:14 am', 'Yes please', 'Riya turned on reminders');
    bot(0, '11:14 am', { text: 'How many cups a day do you brew with it?' });
    if (!S.cups){ out.opts = { day: 0, list: [['cups', 1, '1 cup'], ['cups', 2, '2 cups'], ['cups', 3, '3 cups']] }; return out; }
    me(0, '11:15 am', cupsLabel(S.cups), 'Riya brews ' + cupsLabel(S.cups) + ' a day. Reminder set for ' + f(Pl.remind));
    bot(0, '11:15 am', { kind: 'math', top: 'At 15 g a cup and ' + cupsLabel(S.cups) + ' a day, 250 g lasts', big: Pl.runIdx + ' days', foot: 'That takes you to ' + f(Pl.runOut) + '.' });
    if (Pl.late) bot(0, '11:15 am', { text: "Our next roast can't reach you before then. I'll message you " + f(Pl.remind) + ' so you get the first fresh bag. A 500 g bag would last you ' + Math.floor(500 / Pl.daily) + ' days next time.' });
    else bot(0, '11:15 am', { text: "I'll message you " + f(Pl.remind) + ', in time for the ' + f(Pl.R) + ' roast. It reaches you around ' + f(Pl.arrive) + ', before you run out.' });
    var rd = ix(Pl.remind);
    bot(rd, '9:00 am', { text: 'Hi Riya, your Ratnagiri runs out around ' + f(Pl.runOut) + '. Our next roast is ' + f(Pl.R) + '. Reorder by 6 pm tomorrow and it reaches you around ' + f(Pl.arrive) + '.', log: 'Reminder sent to Riya' });
    if (!S.act){ out.opts = { day: rd, list: [['act', 'same', 'Reorder same'], ['act', 'new', 'Try something new'], ['act', 'pause', 'Pause for 2 weeks']] }; return out; }
    if (S.act === 'pause'){
      me(rd, '9:06 am', 'Pause for 2 weeks', 'Riya paused reminders for 2 weeks');
      bot(rd, '9:06 am', { text: "Paused. I'll check in again on " + f(add(Pl.remind, 14)) + '.' });
      return out;
    }
    var chosen = 'ratnagiri', t1 = '9:06 am', t2 = '9:07 am';
    if (S.act === 'same') me(rd, '9:06 am', 'Reorder same');
    if (S.act === 'new'){
      me(rd, '9:06 am', 'Try something new');
      bot(rd, '9:06 am', { kind: 'card', title: 'You liked a sweet, nutty cup on your V60. Try this one:', p: 'melkodige', meta: 'Medium-light roast, 250 g', price: true });
      if (!S.pick){ out.opts = { day: rd, list: [['pick', 'take', 'Order Melkodige'], ['pick', 'stay', 'Stay with Ratnagiri']] }; return out; }
      me(rd, '9:08 am', S.pick === 'take' ? 'Order Melkodige' : 'Stay with Ratnagiri');
      if (S.pick === 'take') chosen = 'melkodige';
      t1 = '9:08 am'; t2 = '9:09 am';
    }
    out.chosen = chosen;
    var pr = PRODUCTS[chosen];
    bot(rd, t1, { kind: 'card', title: 'Your reorder', p: chosen, meta: '250 g, V60 grind. Roasts ' + f(Pl.R) + '.', price: true });
    if (!S.paid){ out.opts = { day: rd, list: [['paid', true, 'Pay ₹' + pr.price + ' with UPI']] }; return out; }
    me(rd, t2, 'Paid ₹' + pr.price, 'Riya paid ₹' + pr.price + ' for ' + pr.name);
    bot(rd, t2, { text: 'Thank you. Your ' + pr.short + ' is in the ' + f(Pl.R) + ' roast.' });
    var r = ix(Pl.R);
    bot(r, '3:40 pm', { text: 'Your ' + pr.short + ' was roasted this morning. It ships tomorrow.', log: "Riya's bag roasted" });
    bot(r + 1, '10:20 am', { text: 'On its way. It should reach you ' + f(Pl.arrive) + '.', log: "Riya's bag shipped" });
    bot(ix(Pl.arrive), '1:05 pm', { text: "Delivered. I'll message you again before this bag runs out.", log: "Riya's new bag delivered" });
    return out;
  }

  /* Third Wave Corner's chat */
  function cafe(lastIdx){
    var m = [], opts = null;
    function bot(day, t, o){ m.push(Object.assign({ day: day, t: t, from: 'in' }, o)); }
    function me(day, t, text, log){ m.push({ day: day, t: t, from: 'out', text: text, log: log }); }
    var ask = "Good morning, Third Wave Corner. Your usual 5 kg of LEAN Blend for Wednesday's roast?";
    bot(-5, '8:30 am', { text: ask });
    me(-5, '8:41 am', 'Yes, send it');
    bot(-5, '8:41 am', { text: 'Done. 5 kg of LEAN Blend for Wed 21 Oct. The invoice is on its way.' });
    ROASTS.forEach(function(R){
      var r = ix(R), a = r - 2;
      if (a > lastIdx) return;
      var rep = S.cafe[R];
      bot(a, '8:30 am', { text: ask, log: 'Weekly order check sent to Third Wave Corner' });
      if ((!rep || rep.day >= r - 1) && r - 1 <= lastIdx) bot(r - 1, '12:00 pm', { text: "Reminder: reply by 6 pm today to get into tomorrow's roast.", log: 'Second reminder sent to Third Wave Corner' });
      if (rep){
        var label = rep.v === 'yes' ? 'Yes, send it' : rep.v === 'more' ? 'Make it 7 kg' : 'Skip this week';
        var t = rep.day >= r - 1 ? '12:06 pm' : '8:44 am';
        me(rep.day, t, label, rep.v === 'skip' ? 'Third Wave Corner skipped this week' : 'Third Wave Corner confirmed ' + (rep.v === 'more' ? 7 : 5) + ' kg of LEAN Blend');
        bot(rep.day, t, { text: rep.v === 'skip' ? "Skipped. I'll ask again before " + f(add(R, 7)) + '.' : 'Done. ' + (rep.v === 'more' ? 7 : 5) + ' kg of LEAN Blend for ' + f(R) + '. The invoice is on its way.' });
        if (rep.v !== 'skip') bot(r, '4:20 pm', { text: 'Roasted this morning and packed. It ships tonight.' });
      } else {
        bot(r, '7:30 am', { text: "No reply by 6 pm, so your usual 5 kg is in today's roast. Reply SKIP any week you don't need it.", log: 'Third Wave Corner standing order kept' });
        bot(r, '4:20 pm', { text: 'Roasted this morning and packed. It ships tonight.' });
        if (S.day >= a && S.day < r) opts = { day: a, R: R, list: [['yes', 'Yes, send it'], ['more', 'Make it 7 kg'], ['skip', 'Skip this week']] };
      }
    });
    m.sort(function(x, y){ return x.day - y.day || mins(x.t) - mins(y.t); });
    return { m: m, opts: opts };
  }

  function planFor(R, rv){
    var b = {}, k;
    for (k in BASE[R]) b[k] = { c: BASE[R][k][0], e: BASE[R][k][1], notes: [] };
    BG[R].forEach(function(ev){ if (ix(ev.d) <= S.day){ b[ev.c].c += ev.kg; b[ev.c].e -= ev.kg; } });
    var r = ix(R), rep = S.cafe[R];
    if (rep){ if (rep.v !== 'skip'){ var q = rep.v === 'more' ? 7 : 5; b.lean.c += q; b.lean.notes.push('Third Wave Corner, +' + q + ' kg'); } }
    else if (S.day >= r){ b.lean.c += 5; b.lean.notes.push('Third Wave Corner, standing order'); }
    else b.lean.e += 5;
    if (S.optin === 'yes' && S.cups && rv.P.R === R && S.act !== 'pause'){
      if (S.paid){ b[rv.chosen].c += 0.25; b[rv.chosen].notes.push('Riya, +0.25 kg'); }
      else b.ratnagiri.e += 0.25;
    }
    var c = 0, e = 0;
    for (k in b){ c += b[k].c; e += b[k].e; }
    return { R: R, b: b, c: c, e: e, total: c + e };
  }

  function world(){
    var rv = riya(), Pl = rv.P, known = S.optin === 'yes' && !!S.cups;
    var last = known ? Math.max(Pl.runIdx, S.paid ? ix(Pl.arrive) : 0) : Pl.runIdx;
    if (S.day > last) S.day = last;
    var cv = cafe(last);
    return { rv: rv, cv: cv, Pl: Pl, known: known, last: last };
  }

  function grams(W, i){
    var Pl = W.Pl, g = Math.max(0, 250 - Pl.daily * i);
    if (S.paid && i >= ix(Pl.arrive)) g += 250;
    return g;
  }

  function tagsFor(W, i){
    var Pl = W.Pl, t = [];
    if (i === 0) t.push(['Delivered', 't-del']);
    if (W.known && i === ix(Pl.remind)) t.push(['Reminder', 't-rem']);
    ROASTS.forEach(function(R){ if (ix(R) === i) t.push(['Roast day', 't-roast']); });
    if (S.paid && i === ix(Pl.arrive)) t.push(['New bag', 't-new']);
    if (i === Pl.runIdx){ var saved = S.paid && !Pl.late; t.push([saved ? 'Would run out' : 'Runs out', saved ? 't-avoid' : 't-out']); }
    return t;
  }

  /* rendering */
  var $ = function(id){ return document.getElementById(id); };
  var pouch = function(color){ return '<svg viewBox="0 0 40 52" width="40" height="52" aria-hidden="true"><rect x="3" y="6" width="34" height="44" rx="4" fill="' + color + '"/><rect x="1" y="2" width="38" height="7" rx="2" fill="#111"/><rect x="9" y="19" width="22" height="17" rx="1" fill="#fff"/><rect x="12" y="23" width="16" height="2.6" fill="#111"/><rect x="12" y="28.5" width="10" height="2" fill="#9A9A9A"/></svg>'; };
  var ticks = '<svg width="16" height="11" viewBox="0 0 16 11" aria-label="Read"><path d="M1 6l3 3 6-7M6 9l1 1 7-8" fill="none" stroke="#53BDEB" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function bubble(m, first, isNew){
    var cls = 'b ' + m.from + (first ? ' first' : '') + (isNew ? ' new' : '');
    var time = '<span class="t num">' + esc(m.t) + (m.from === 'out' ? ticks : '') + '</span>';
    if (m.kind === 'card'){
      var p = PRODUCTS[m.p];
      return '<div class="' + cls + '">' + esc(m.title) + '<div class="pc">' + pouch(p.color) + '<span class="tx"><b>' + esc(p.name) + '</b><span>' + esc(m.meta) + '</span><span>' + esc(p.notes) + '</span>' + (m.price ? '<span class="pr">₹' + p.price + '</span>' : '') + '</span></div>' + time + '</div>';
    }
    if (m.kind === 'math'){
      return '<div class="' + cls + ' math">' + esc(m.top) + '<span class="big">' + esc(m.big) + '</span>' + esc(m.foot) + time + '</div>';
    }
    return '<div class="' + cls + '">' + esc(m.text) + time + '</div>';
  }

  var lastRendered = { riya: 0, cafe: 0 };

  function renderChat(W){
    var tab = S.tab, data = tab === 'riya' ? W.rv : W.cv;
    var vis = data.m.filter(function(m){ return m.day <= S.day; });
    var n = S.shown[tab];
    while (n < vis.length && (vis[n].from === 'out' || vis[n].day < S.day)) n++;
    if (n < vis.length && !typing[tab]){
      if (reduce){ n = vis.length; }
      else {
        typing[tab] = true;
        clearTimeout(timer);
        timer = setTimeout(function(){ typing[tab] = false; S.shown[tab] = Math.min(S.shown[tab] + 1, 999); render(); }, 700);
      }
    }
    S.shown[tab] = Math.max(S.shown[tab], n);
    if (S.shown[tab] > vis.length) S.shown[tab] = vis.length;
    var shown = vis.slice(0, S.shown[tab]);
    var html = '<div class="notice">Messages and orders here are sample data for this demo.</div>';
    var prevDay = null, prevFrom = null;
    shown.forEach(function(m, i){
      if (m.day !== prevDay){ html += '<div class="chip">' + chipTxt(at(m.day)) + '</div>'; prevFrom = null; }
      html += bubble(m, m.from !== prevFrom, i >= lastRendered[tab]);
      prevDay = m.day; prevFrom = m.from;
    });
    lastRendered[tab] = shown.length;
    var pending = typing[tab] || S.shown[tab] < vis.length;
    if (pending) html += '<div class="typing" aria-label="Corridor Seven is typing"><i></i><i></i><i></i></div>';
    else if (data.opts && data.opts.day <= S.day){
      var coach = tab === 'riya' && !coached.reply;
      if (coach) html += '<div class="coach-tip" aria-hidden="true">Tap a reply as Riya</div>';
      html += '<div class="qr' + (coach ? ' coach' : '') + '">' + data.opts.list.map(function(o, i){ return '<button type="button" data-reply="' + i + '">' + esc(o[o.length - 1]) + '</button>'; }).join('') + '</div>';
    }
    var box = $('chat');
    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
    var lastT = shown.length ? shown[shown.length - 1].t : '11:10 am';
    $('clock').textContent = lastT.replace(/\s*(am|pm)/, '');
    if (!pending) S.seen[tab] = vis.length;
    ['riya', 'cafe'].forEach(function(k){
      var d = k === 'riya' ? W.rv : W.cv;
      var v = d.m.filter(function(m){ return m.day <= S.day && m.day >= 0 && m.from === 'in'; }).length;
      var seenIn = k === S.tab ? v : d.m.slice(0, S.seen[k]).filter(function(m){ return m.from === 'in' && m.day <= S.day && m.day >= 0; }).length;
      var unread = Math.max(0, v - seenIn);
      var el = $('badge-' + k);
      el.hidden = !unread; el.textContent = unread;
    });
  }

  function renderDays(W){
    var html = '';
    for (var i = 0; i <= W.last; i++){
      var d = at(i), dt = P(d), g = grams(W, i);
      var cls = 'day' + (i < S.day ? ' past' : '') + (i === S.day ? ' now' : '') + (i === S.day && lastDay !== null && lastDay !== S.day ? ' arrive' : '') + (!booted ? ' boot' : '');
      var tags = tagsFor(W, i).map(function(t){ return '<span class="tag ' + t[1] + '">' + t[0] + '</span>'; }).join('');
      html += '<div class="' + cls + '" style="--i:' + i + '" role="listitem"' + (i === S.day ? ' aria-current="date"' : '') + '><span class="dow">' + (i === S.day ? 'Today, ' : '') + DOW[dt.getUTCDay()] + '</span><span class="date num">' + dt.getUTCDate() + '<small>' + MON[dt.getUTCMonth()] + '</small></span><span class="gauge"><i style="width:' + Math.min(100, g / 250 * 100) + '%"></i></span><span class="grams num">' + g + ' g in the bag</span><span class="tags">' + tags + '</span></div>';
    }
    var box = $('days');
    box.innerHTML = html;
    lastDay = S.day;
    var cur = box.children[S.day];
    if (cur){
      var left = cur.offsetLeft - box.offsetLeft, right = left + cur.offsetWidth;
      if (left < box.scrollLeft) box.scrollLeft = left - 8;
      else if (right > box.scrollLeft + box.clientWidth) box.scrollLeft = right - box.clientWidth + 8;
    }
  }

  function blocked(W){ var o = W.rv.opts; return !!(o && o.day <= S.day); }

  function renderControls(W){
    var b = blocked(W), end = S.day >= W.last, h;
    $('next').disabled = b || end;
    $('next2').disabled = b || end;
    $('skip').disabled = b || end;
    var cafePending = W.cv.opts && W.cv.opts.day <= S.day;
    if (end) h = '<b>That was the week.</b> Start over to try different replies.';
    else if (S.day === 0 && !S.optin) h = 'Her bag just arrived. <b>Reply in Riya\'s chat.</b>';
    else if (S.day === 0 && S.optin === 'yes' && !S.cups) h = '<b>Tell Corridor Seven</b> how much she drinks.';
    else if (b) h = '<b>A message is waiting</b> for Riya\'s reply.';
    else if (cafePending && S.tab === 'riya') h = 'Nothing for Riya now. <b>Third Wave Corner</b> has a message too.';
    else if (S.day === 0) h = 'All set. <b>Move the week forward.</b>';
    else h = 'Nothing for Riya today. <b>Keep going.</b>';
    $('hint').innerHTML = h;
    $('mhint').innerHTML = h;

    /* the three-step guide above the days: 1 reply, 2 next day, 3 result */
    var st = [b ? 'now' : (S.optin ? 'done' : ''), end ? 'done' : (b ? (S.day > 0 ? 'done' : '') : 'now'), end ? 'now done' : ''];
    document.querySelectorAll('#guide li').forEach(function(li, k){
      li.className = st[k];
      if (st[k].indexOf('now') > -1) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    var pulse = !b && !end && !coached.next;
    $('next').classList.toggle('coach', pulse);
    $('next2').classList.toggle('coach', pulse);
  }

  function renderResult(W){
    var box = $('result'), Pl = W.Pl;
    if (S.day < W.last){ box.innerHTML = ''; return; }
    var title, text, color;
    if (S.optin === 'no'){ title = 'Riya ran out on ' + f(Pl.runOut) + '.'; text = 'No reminder, so remembering to reorder was up to her. Start over and say yes to see the other week.'; color = 'var(--alert-lit)'; }
    else if (S.act === 'pause'){ title = 'Riya paused her reminders.'; text = 'She has other coffee for now. Corridor Seven checks in again on ' + f(add(Pl.remind, 14)) + '.'; color = 'var(--on-stage-muted)'; }
    else if (S.paid && !Pl.late){
      var taps = S.act === 'new' ? 3 : 2, gap = ix(Pl.runOut) - ix(Pl.arrive);
      title = 'Riya never ran out.'; text = 'Her new bag arrived ' + f(Pl.arrive) + ', ' + gap + (gap === 1 ? ' day' : ' days') + ' before the old one was empty. One reminder, ' + taps + ' taps, ₹' + PRODUCTS[W.rv.chosen].price + ' paid on WhatsApp.'; color = 'var(--ok-lit)';
    }
    else if (S.paid){ var lateBy = ix(Pl.arrive) - Pl.runIdx; title = 'The new bag arrived ' + f(Pl.arrive) + ', ' + lateBy + (lateBy === 1 ? ' day' : ' days') + ' after she ran out.'; text = 'At 3 cups a day no roast could reach her in time. The reminder already suggested a 500 g bag for next time.'; color = 'var(--orange)'; }
    else { box.innerHTML = ''; return; }
    box.innerHTML = '<div class="result"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="' + color + '" stroke-width="2"/><path d="M7.5 12.5l3 3 6-7" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><div><h2>' + esc(title) + '</h2><p>' + esc(text) + '</p></div></div>';
  }

  function logEntries(W){
    var out = [];
    function pushFrom(list, color){ list.forEach(function(m){ if (m.log && m.day <= S.day && m.day >= 0) out.push({ day: m.day, t: m.t, text: m.log, c: color }); }); }
    pushFrom(W.rv.m, 'var(--orange)');
    pushFrom(W.cv.m, 'var(--ink)');
    ROASTS.forEach(function(R){
      if (ix(R) - 2 > W.last) return;
      BG[R].forEach(function(ev){ if (ix(ev.d) <= S.day) out.push({ day: ix(ev.d), t: ev.t, text: ev.who + ' confirmed ' + ev.kg + ' kg of ' + NAMES[ev.c], c: '#B5B5B5' }); });
      var r = ix(R);
      if (S.day >= r){ var pf = planFor(R, W.rv); out.push({ day: r, t: '6:00 am', text: f(R) + ' roast started: ' + kg(pf.total) + ' kg', c: 'var(--ink)' }); }
    });
    out.sort(function(a, b){ return b.day - a.day || mins(b.t) - mins(a.t); });
    return out;
  }

  function renderConsole(W){
    var Pl = W.Pl, rv = W.rv, d = S.day;
    var status, sCls = '';
    if (S.optin === 'no'){ status = 'No reminders'; }
    else if (!S.optin){ status = 'New order'; }
    else if (!S.cups){ status = 'Asked about cups'; sCls = 'warm'; }
    else if (S.act === 'pause'){ status = 'Paused'; }
    else if (S.paid){ status = d >= ix(Pl.arrive) ? 'New bag delivered' : 'Reordered'; sCls = 'good'; }
    else if (d >= ix(Pl.remind)){ status = 'Reminder sent'; sCls = 'warm'; }
    else { status = 'Reminder scheduled'; }

    var popCls = prevStatus !== null && prevStatus !== status ? ' pop' : '';
    prevStatus = status;
    var leftHtml;
    if (W.known){
      var g = grams(W, d);
      leftHtml = '<div class="left"><span class="g num"><span data-roll="grams" data-int="1" data-val="' + g + '">' + (prevNum.grams != null ? prevNum.grams : g) + '</span><small>g left</small></span><span class="bar"><i data-w="' + Math.min(100, g / 250 * 100) + '%" data-w-id="left"></i></span></div>';
    } else {
      leftHtml = '<div class="left"><span class="unk">' + (S.optin === 'no' ? 'Riya did not share how much she drinks, so nobody knows when she runs out.' : 'Unknown until Riya says how much she drinks.') + '</span></div>';
    }
    var remindTxt = W.known ? f(Pl.remind) + ', 9:00 am' : 'None';
    var remindPill = W.known ? (S.act || S.paid ? '<span class="pill good">Answered</span>' : d >= ix(Pl.remind) ? '<span class="pill warm">Sent</span>' : '<span class="pill">Scheduled</span>') : '';
    var nextBag = S.paid ? (d >= ix(Pl.arrive) ? 'Delivered ' + f(Pl.arrive) : 'In the ' + f(Pl.R) + ' roast, arrives ' + f(Pl.arrive)) : (S.act === 'pause' ? 'Paused until ' + f(add(Pl.remind, 14)) : 'Not ordered yet');

    var log = logEntries(W);
    var newCount = log.length - S.seenLog;
    var logHtml = log.slice(0, 5).map(function(e, i){
      var when = e.day === d ? 'Today' : e.day === d - 1 ? 'Yesterday' : f(at(e.day)).replace(/^\w+ /, '');
      return '<li class="' + (i < newCount ? 'fresh' : '') + '" style="--c:' + e.c + '"><span class="when num">' + when + '<br>' + e.t + '</span><span class="what">' + esc(e.text) + '</span></li>';
    }).join('') || '<li><span class="when"></span><span class="what">Nothing yet.</span></li>';
    if (S.view === 'roastery' || window.innerWidth >= 900) S.seenLog = log.length;
    $('roastDot').hidden = !(log.length > S.seenLog && S.view === 'phone');

    var R = ROASTS.filter(function(x){ return ix(x) >= d; })[0] || ROASTS[ROASTS.length - 1];
    var pf = planFor(R, rv), r = ix(R);
    var pStatus = d < r - 1 ? ['Open until ' + f(add(R, -1)) + ', 6 pm', ''] : d === r - 1 ? ['Closes at 6 pm today', 'warm'] : ['Roasting today', 'dark'];
    var keys = Object.keys(pf.b).sort(function(a, b){ return (pf.b[b].c + pf.b[b].e) - (pf.b[a].c + pf.b[a].e); });
    var max = Math.max.apply(null, keys.map(function(k){ return pf.b[k].c + pf.b[k].e; }));
    var bars = keys.map(function(k){
      var x = pf.b[k];
      return '<li data-k="' + k + '"><span class="nm">' + NAMES[k] + '</span><span class="kg num">' + kg(x.c + x.e) + ' kg</span><span class="track"><i class="c" data-w="' + (x.c / max * 100) + '%" data-w-id="b-' + k + '-c"></i><i class="e" data-w="' + (x.e / max * 100) + '%" data-w-id="b-' + k + '-e"></i></span>' + (x.notes.length ? '<span class="note">' + esc(x.notes.join(', ')) + '</span>' : '') + '</li>';
    }).join('');
    var prevR = ROASTS.filter(function(x){ return ix(x) < d; }).pop();
    var prevHtml = '';
    if (prevR){
      var pp = planFor(prevR, rv), inIt = S.paid && rv.P.R === prevR;
      prevHtml = '<div class="prev"><b>' + f(prevR) + ' roast:</b> ' + kg(pp.total) + ' kg roasted' + (inIt ? ", including Riya's 0.25 kg." : '.') + '</div>';
    }

    $('console').innerHTML =
      '<div class="c-head"><h2>Roastery view</h2><span class="live">Live</span><span class="now">' + f(at(d)) + '</span><a class="open-dash" href="/dashboard">Open full dashboard</a></div>' +
      '<div class="col">' +
        '<section><div class="sec-h"><h3>Customer</h3><span class="pill ' + sCls + popCls + '">' + status + '</span></div>' +
        '<div class="rec-top"><span class="ava ava-r">R</span><span class="id"><b>Riya</b><span>Home subscriber, Nagpur</span></span></div>' +
        leftHtml +
        '<dl class="kv"><dt>Coffee</dt><dd>' + (S.paid && rv.chosen === 'melkodige' && d >= ix(Pl.arrive) ? 'Melkodige Estate, 250 g' : 'Ratnagiri Peaberry, 250 g') + '</dd>' +
        '<dt>Brews</dt><dd>' + (W.known ? 'V60, ' + cupsLabel(S.cups) + ' a day (' + Pl.daily + ' g)' : 'V60') + '</dd>' +
        '<dt>Runs out</dt><dd>' + (W.known ? f(Pl.runOut) : 'Unknown') + '</dd>' +
        '<dt>Reminder</dt><dd>' + remindTxt + remindPill + '</dd>' +
        '<dt>Next bag</dt><dd>' + nextBag + '</dd></dl></section>' +
        '<section><div class="sec-h"><h3>WhatsApp activity</h3></div><ul class="log">' + logHtml + '</ul></section>' +
      '</div>' +
      '<div class="col">' +
        '<section><div class="sec-h"><h3>' + f(R) + ' roast</h3><span class="pill ' + pStatus[1] + '">' + pStatus[0] + '</span></div>' +
        '<div class="plan-total"><span class="n num" data-roll="total" data-val="' + pf.total + '">' + kg(prevNum.total != null ? prevNum.total : pf.total) + '</span><span class="u">kg to roast</span></div>' +
        '<div class="legend"><span><i style="background:var(--conf)"></i><b class="num">' + kg(pf.c) + ' kg</b> confirmed</span><span><i style="background:var(--exp)"></i><b class="num">' + kg(pf.e) + ' kg</b> expected</span></div>' +
        '<ul class="bars">' + bars + '</ul>' + prevHtml + '</section>' +
      '</div>' +
      '<a class="dash-link" href="/dashboard"><span class="mini" aria-hidden="true"><i style="height:100%"></i><i style="height:62%"></i><i style="height:44%"></i><i style="height:30%"></i><i style="height:22%"></i></span><span class="tx"><b>Open the full roastery dashboard</b><span class="s">Every coffee, batch, customer and cafe for ' + f(R) + ', following this demo</span></span><span class="go" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="#000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></a>';
  }

  /* motion helpers: bars grow from their last width, numbers roll, an order chip flies into the roast plan */
  function grow(delay){
    var els = document.querySelectorAll('[data-w]');
    els.forEach(function(el){ var id = el.dataset.wId; el.style.width = prevW[id] != null ? prevW[id] : (booted ? el.dataset.w : '0%'); });
    void document.body.offsetWidth;
    els.forEach(function(el){
      var id = el.dataset.wId, set = function(){ el.style.width = el.dataset.w; };
      if (delay && delay[id]) setTimeout(set, delay[id]); else requestAnimationFrame(set);
      prevW[id] = el.dataset.w;
    });
  }
  function roll(){
    document.querySelectorAll('[data-roll]').forEach(function(el){
      var key = el.dataset.roll, to = +el.dataset.val, from = prevNum[key] != null ? prevNum[key] : to, isInt = !!el.dataset.int;
      prevNum[key] = to;
      function fmt(v){ return isInt ? String(Math.round(v)) : kg(v); }
      if (reduce || from === to){ el.textContent = fmt(to); return; }
      var t0 = performance.now();
      (function step(){ var p = Math.min(1, (performance.now() - t0) / 650), e = 1 - Math.pow(1 - p, 3); if (!el.isConnected) return; el.textContent = fmt(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); })();
    });
  }
  var toastEl = null, toastT = null;
  function showToast(fl){
    if (!toastEl){
      toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
      toastEl.addEventListener('click', function(e){ if (e.target.closest('button')){ S.view = 'roastery'; toastEl.classList.remove('show'); render(); } });
    }
    toastEl.innerHTML = '<span>' + esc(fl.label) + ' added to the roast plan</span><button type="button">See it</button>';
    requestAnimationFrame(function(){ toastEl.classList.add('show'); });
    clearTimeout(toastT); toastT = setTimeout(function(){ toastEl.classList.remove('show'); }, 3800);
  }
  function flyChip(fl){
    var tr0 = document.querySelector('#console .bars li[data-k="' + fl.k + '"] .track');
    if (!tr0) return;
    var tg = tr0.getBoundingClientRect(), chip = document.createElement('div');
    chip.className = 'fly'; chip.textContent = fl.label; document.body.appendChild(chip);
    var w = chip.offsetWidth / 2, h = chip.offsetHeight / 2;
    var sx = fl.from.left + fl.from.width / 2 - w, sy = fl.from.top + fl.from.height / 2 - h;
    var tx = tg.left + 24 - w, ty = tg.top + tg.height / 2 - h, mx = (sx + tx) / 2, my = Math.min(sy, ty) - 110;
    function tr(x, y, sc){ return 'translate(' + x + 'px,' + y + 'px) scale(' + sc + ')'; }
    var a = chip.animate([
      { transform: tr(sx, sy, .5), opacity: 0 },
      { transform: tr(sx, sy - 24, 1.05), opacity: 1, offset: .14 },
      { transform: tr(mx, my, 1), opacity: 1, offset: .55 },
      { transform: tr(tx, ty, .85), opacity: 1, offset: .9 },
      { transform: tr(tx, ty, .5), opacity: 0 }
    ], { duration: 1050, easing: 'cubic-bezier(.45,0,.25,1)' });
    a.onfinish = function(){ chip.remove(); var t = document.querySelector('#console .bars li[data-k="' + fl.k + '"]'); if (t){ t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash'); } };
  }
  function post(){
    var delay = {};
    if (pendingFly){
      var fl = pendingFly; pendingFly = null;
      var tgt = document.querySelector('#console .bars li[data-k="' + fl.k + '"]');
      var visible = !!(tgt && tgt.offsetParent !== null);
      if (visible && !reduce){ delay['b-' + fl.k + '-c'] = 900; delay['b-' + fl.k + '-e'] = 900; flyChip(fl); }
      else if (!visible) showToast(fl);
    }
    grow(delay);
    roll();
    /* the dashboard follows the demo once the visitor has played; an untouched demo leaves it on its sample Monday */
    try {
      if (S.optin || S.day > 0) localStorage.setItem('c7-demo', JSON.stringify({ day: S.day, optin: S.optin, cups: S.cups, act: S.act, pick: S.pick, paid: S.paid, cafe: S.cafe }));
      else localStorage.removeItem('c7-demo');
    } catch (e) {}
    booted = true;
  }

  function render(){
    var W = world();
    renderDays(W);
    renderChat(W);
    renderControls(W);
    renderResult(W);
    renderConsole(W);
    document.querySelectorAll('.contact').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.tab === S.tab)); });
    document.querySelectorAll('.switch button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.view === S.view)); });
    $('stage').dataset.view = S.view;
    post();
  }

  /* events */
  $('chat').addEventListener('click', function(e){
    var btn = e.target.closest('[data-reply]');
    if (!btn) return;
    var W = world(), i = +btn.dataset.reply;
    var fl = null;
    if (S.tab === 'riya'){
      coached.reply = true;
      var o = W.rv.opts.list[i];
      S[o[0]] = o[1];
      if (o[0] === 'paid') fl = { k: S.act === 'new' && S.pick === 'take' ? 'melkodige' : 'ratnagiri', label: '+0.25 kg' };
    } else {
      var co = W.cv.opts, v = co.list[i][0];
      S.cafe[co.R] = { v: v, day: S.day };
      if (v !== 'skip') fl = { k: 'lean', label: '+' + (v === 'more' ? 7 : 5) + ' kg' };
    }
    if (fl){ fl.from = btn.getBoundingClientRect(); pendingFly = fl; }
    render();
  });
  function nextDay(){ coached.next = true; S.day++; render(); }
  $('next').addEventListener('click', nextDay);
  $('next2').addEventListener('click', nextDay);

  /* keys: right arrow or N moves a day, 1 to 3 tap a quick reply */
  document.addEventListener('keydown', function(e){
    if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (document.querySelector('.drawer.open')) return;
    var st = $('stage').getBoundingClientRect();
    if (st.bottom < 80 || st.top > innerHeight - 80) return;
    if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N'){
      var nb = $('next').offsetParent ? $('next') : $('next2');
      if (!nb.disabled){ e.preventDefault(); nb.click(); flashBtn(nb); }
    } else if (/^[1-3]$/.test(e.key)){
      var qb = document.querySelector('#chat .qr button[data-reply="' + (+e.key - 1) + '"]');
      if (qb){ e.preventDefault(); flashBtn(qb); qb.click(); }
    }
  });
  function flashBtn(el){ el.classList.remove('key'); void el.offsetWidth; el.classList.add('key'); }
  $('skip').addEventListener('click', function(){
    coached.next = true;
    var W = world(), target = W.last;
    for (var d = S.day + 1; d <= W.last; d++){
      var hasMsg = W.rv.m.some(function(m){ return m.day === d; });
      if (hasMsg || tagsFor(W, d).length){ target = d; break; }
    }
    S.day = target; render();
  });
  $('restart').addEventListener('click', function(){ clearTimeout(timer); typing = { riya: false, cafe: false }; lastRendered = { riya: 0, cafe: 0 }; var v = S.view; S = fresh(); S.view = v; render(); });
  document.querySelectorAll('.contact').forEach(function(b){ b.addEventListener('click', function(){ clearTimeout(timer); typing[S.tab] = false; S.tab = b.dataset.tab; lastRendered[S.tab] = 1e9; render(); }); });
  document.querySelectorAll('.switch button').forEach(function(b){ b.addEventListener('click', function(){ S.view = b.dataset.view; render(); }); });

  render();
})();

/* run-out chart: sample customers stacked by the day their bag runs out */
(function(){
  var grid = document.getElementById('roGrid'), axis = document.getElementById('roAxis'), fig = document.getElementById('runout');
  if (!grid) return;
  var N = [9,12,15,11,12,12,15, 10,13,11,14,12,17,15, 12,10,13,15,11,16,13, 11,14,12,10,15,13,12];
  var D0 = new Date(2026, 9, 26), MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var total = 0, gh = '', ah = '';
  N.forEach(function(n, c){
    var d = new Date(D0); d.setDate(d.getDate() + c);
    var dow = d.getDay(), riya = c === 6;
    total += n;
    var dots = '';
    for (var r = 0; r < n; r++) dots += '<i style="--c:' + c + ';--r:' + r + '"' + (riya && r === n - 1 ? ' class="riya"' : '') + '></i>';
    gh += '<div class="ro-col' + (dow === 0 || dow === 6 ? ' we' : '') + '">' + dots + (riya ? '<span class="who">Riya, Sun 1 Nov</span>' : '') + '</div>';
    if (dow === 3) ah += '<b style="grid-column:' + (c + 1) + '"></b>';
    if (dow === 1) ah += '<span style="grid-column:' + (c + 1) + ' / span 7">' + d.getDate() + ' ' + MO[d.getMonth()] + '</span>';
  });
  grid.innerHTML = gh; axis.innerHTML = ah;
  document.getElementById('roN').textContent = total + ' sample customers';
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches){ fig.classList.add('ready'); return; }
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ fig.classList.add('ready'); io.disconnect(); } }); }, { threshold: .35 });
  io.observe(fig);
})();
