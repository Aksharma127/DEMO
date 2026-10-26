(function(){
  var D0 = '2026-10-24';
  var DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function P(s){ return new Date(s + 'T00:00:00Z'); }
  function add(s, n){ var d = P(s); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function ix(s){ return Math.round((P(s) - P(D0)) / 864e5); }
  function at(i){ return add(D0, i); }
  function f(s){ var d = P(s); return DOW[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; }
  function fd(s){ var d = P(s); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; }
  function kg(n){ var r = Math.round(n * 100) / 100; return Math.abs(r * 10 - Math.round(r * 10)) < 1e-6 ? (Math.round(r * 10) / 10).toFixed(Math.round(r * 10) % 10 ? 1 : 0) : r.toFixed(2); }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(id){ return document.getElementById(id); };

  /* state handed over from the demo page, if this viewer played it */
  var demo = null;
  try { demo = JSON.parse(localStorage.getItem('c7-demo') || 'null'); } catch (e) { demo = null; }
  var synced = !!(demo && typeof demo.day === 'number');
  var DS = synced ? demo : { day: 2, optin: 'yes', cups: 2, act: null, pick: null, paid: false, cafe: {} };
  DS.cafe = DS.cafe || {};
  var T = Math.max(0, Math.min(18, DS.day));
  var TODAY = at(T);

  var COFFEES = {
    lean: { name: 'LEAN Blend', profile: 'Espresso', sw: '#3E2614' },
    coldbrew: { name: 'Cold Brew Blend BOLD', profile: 'Espresso', sw: '#3E2614' },
    ratnagiri: { name: 'Ratnagiri Peaberry', profile: 'Espresso', sw: '#6E4424' },
    forte: { name: 'Barista Forte Blend', profile: 'Espresso', sw: '#6E4424' },
    gungegiri: { name: 'Gungegiri Estate', profile: 'Filter', sw: '#C9A27E' },
    melkodige: { name: 'Melkodige Estate', profile: 'Filter', sw: '#9C4A2A' }
  };
  var LOSS = { Espresso: .16, Filter: .14 }, BATCH = 12;
  var ROASTS = ['2026-10-21', '2026-10-28', '2026-11-04'];
  var CUST_ROASTS = ['2026-10-14', '2026-10-21', '2026-10-28', '2026-11-04', '2026-11-11'];

  function plan(delivered, bag, cups){
    var daily = 15 * cups, runOut = add(delivered, Math.floor(bag / daily)), R = null, late = false;
    CUST_ROASTS.forEach(function(r){ if (add(r, 3) <= add(runOut, -1) && add(r, -2) >= add(delivered, 1)) R = r; });
    if (!R){ late = true; R = CUST_ROASTS.filter(function(r){ return add(r, -2) >= add(delivered, 1); })[0]; }
    return { daily: daily, runOut: runOut, R: R, remind: add(R, -2), arrive: add(R, 3), late: late, delivered: delivered, bag: bag, cups: cups };
  }

  /* Riya, from the demo */
  var riyaOn = DS.optin === 'yes' && !!DS.cups;
  var RP = riyaOn ? plan(D0, 250, DS.cups) : null;
  var riyaChosen = DS.act === 'new' && DS.pick === 'take' ? 'melkodige' : 'ratnagiri';

  /* cafe answers: demo answers for Third Wave Corner plus local actions here */
  function twFor(R){
    var rep = DS.cafe[R], r = ix(R);
    if (rep) return rep.v === 'skip' ? { skip: true } : { kg: rep.v === 'more' ? 7 : 5, firm: true, when: rep.day };
    if (T >= r) return { kg: 5, firm: true, kept: true };
    return { kg: 5, firm: false };
  }

  function ordersFor(R){
    var r = ix(R), o = {};
    if (R === '2026-10-21'){
      o.lean = [['7 cafes','cafe',24,1],['26 subscribers','group',6,1]];
      o.coldbrew = [['2 cafes','cafe',6,1],['8 subscribers','group',2,1]];
      o.ratnagiri = [['Kaapi Corner','cafe',4,1],['12 subscribers','group',3,1]];
      o.forte = [['Brew Room','cafe',4,1],['8 subscribers','group',2,1]];
      o.gungegiri = [['Slow Pour','cafe',2,1],['10 subscribers','group',2.5,1]];
      o.melkodige = [['14 subscribers','group',3.5,1]];
    } else if (R === '2026-10-28'){
      o.lean = [['Bean There Cafe','cafe',10,T >= 2],['Morning Ritual','cafe',8,0],['18 subscribers','group',4,0]];
      o.coldbrew = [['Summer House','cafe',2,1],['Cold Press Co.','cafe',5,0],['9 subscribers','group',2,0]];
      o.ratnagiri = [['Kaapi Corner','cafe',4,T >= 3],['11 subscribers','group',2.5,0]];
      o.forte = [['Brew Room','cafe',3,1],['7 subscribers','group',2,0]];
      o.gungegiri = [['2 subscribers','group',.5,1],['Slow Pour','cafe',2,0],['6 subscribers','group',1.5,0]];
      o.melkodige = [['12 subscribers','group',3,0]];
    } else {
      o.lean = [['Bean There Cafe','cafe',10,T >= 9],['2 cafes','cafe',8,0],['Subscribers','group',5,0]];
      o.coldbrew = [['2 cafes','cafe',6,0],['Subscribers','group',2,0]];
      o.ratnagiri = [['Kaapi Corner','cafe',4,T >= 10],['Subscribers','group',2,0]];
      o.forte = [['Brew Room','cafe',3,0],['Subscribers','group',2,0]];
      o.gungegiri = [['1 cafe','cafe',2,0],['Subscribers','group',2,0]];
      o.melkodige = [['Subscribers','group',3,0]];
    }
    if (R !== '2026-10-21'){
      var tw = twFor(R);
      if (!tw.skip) o.lean.unshift(['Third Wave Corner','cafe',tw.kg,tw.firm ? 1 : 0, true]);
    }
    if (riyaOn && RP.R === R && DS.act !== 'pause'){
      if (DS.paid) o[riyaChosen].unshift(['Riya','home',.25,1,true]);
      else o.ratnagiri.push(['Riya','home',.25,0,true]);
    }
    if (r <= T) Object.keys(o).forEach(function(k){ o[k].forEach(function(x){ x[3] = 1; }); });
    return o;
  }

  var U = { R: ROASTS.filter(function(r){ return ix(r) >= T; })[0] || ROASTS[2], tab: 'plan', profile: 'All', expected: true, open: { ratnagiri: true }, locked: {}, done: {}, nudged: {}, needsDone: {} };

  function compute(R){
    var o = ordersFor(R), r = ix(R), past = r < T, rows = [];
    var withExp = U.expected && !past;
    Object.keys(COFFEES).forEach(function(k){
      var c = COFFEES[k], conf = 0, exp = 0;
      o[k].forEach(function(x){ if (x[3]) conf += x[2]; else exp += x[2]; });
      var used = conf + (withExp ? exp : 0), green = used / (1 - LOSS[c.profile]);
      rows.push({ k: k, c: c, orders: o[k], conf: conf, exp: exp, used: used, green: green, batches: green > 0 ? Math.ceil(green / BATCH - 1e-9) : 0 });
    });
    var cafes = {};
    Object.keys(o).forEach(function(k){ o[k].forEach(function(x){ if (x[1] === 'cafe') cafes[x[0]] = 1; }); });
    var tot = { conf: 0, exp: 0, used: 0, green: 0, batches: 0 };
    rows.forEach(function(x){ tot.conf += x.conf; tot.exp += x.exp; tot.used += x.used; tot.green += x.green; tot.batches += x.batches; });
    tot.cafes = R === '2026-10-21' ? 12 : Object.keys(cafes).reduce(function(n, name){ return n + (/^(\d+) cafes?$/.test(name) ? +name.match(/^\d+/)[0] : 1); }, 0);
    return { R: R, r: r, past: past, withExp: withExp, rows: rows, tot: tot };
  }

  /* animation helpers */
  var prevNum = {}, prevW = {};
  function roll(el, to, isInt){
    var key = el.dataset.roll, from = prevNum[key] == null ? 0 : prevNum[key];
    prevNum[key] = to;
    function fmt(v){ return isInt ? String(Math.round(v)) : (key === 'green' ? v.toFixed(1) : kg(v)); }
    if (reduce || from === to){ el.textContent = fmt(to); return; }
    var t0 = performance.now(), dur = 700;
    function step(t){ var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to); }
    requestAnimationFrame(step);
  }
  function grow(scope){
    var els = (scope || document).querySelectorAll('[data-w]');
    els.forEach(function(el){ var id = el.dataset.wId; el.style.width = prevW[id] != null ? prevW[id] : '0%'; });
    void document.body.offsetWidth;
    requestAnimationFrame(function(){ els.forEach(function(el){ el.style.width = el.dataset.w; prevW[el.dataset.wId] = el.dataset.w; }); });
  }

  var ICON = {
    cafe: '<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6zM17 10.5h1.5a2.5 2.5 0 0 1 0 5H17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    home: '<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    group: '<svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.7 3 2.5 3.5 5.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    chev: '<svg class="chev" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="#56616B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  /* header, sync note, band */
  function renderTop(X){
    $('today').innerHTML = '<span class="wd">Today </span><b>' + f(TODAY) + '</b>';
    var s = $('sync');
    if (synced){
      s.className = 'sync';
      s.innerHTML = '<div class="wrap"><span class="dot"></span><span><b>Following your demo.</b> ' + (riyaOn ? 'Riya brews ' + DS.cups + (DS.cups > 1 ? ' cups' : ' cup') + ' a day' + (DS.paid ? ' and has reordered.' : '.') : 'Riya has not set up reminders.') + ' Change her replies in the <a href="/">demo</a> and come back.</span></div>';
    } else {
      s.className = 'sync sample';
      s.innerHTML = '<div class="wrap"><span class="dot"></span><span>Showing a sample Monday. Play the <a href="/">demo</a> and this dashboard follows your replies.</span></div>';
    }
    $('roastDays').innerHTML = ROASTS.map(function(R){
      var r = ix(R), st = r < T ? 'Roasted' : r === T ? 'Roasting today' : U.locked[R] ? 'Locked' : 'Open';
      return '<button type="button" data-r="' + R + '" aria-pressed="' + (R === U.R) + '"><span>' + st + '</span><b>' + f(R) + '</b></button>';
    }).join('');
    var r = X.r, st, cls, closes = '';
    if (X.past){ st = 'Roasted ' + f(X.R); cls = ''; }
    else if (r === T){ st = 'Roasting today'; cls = 'dark'; }
    else if (U.locked[X.R]){ st = 'Locked'; cls = 'good'; }
    else if (r === T + 1){ st = 'Closes 6 pm today'; cls = 'warm'; closes = 'Plan closes in <b>' + (18 - 10) + ' h</b>'; }
    else { st = 'Open'; cls = ''; closes = 'Plan closes in <b>' + ((r - 1 - T) * 24 + 8) + ' h</b>, ' + f(add(X.R, -1)) + ', 6 pm'; }
    var stEl = $('status'), old = stEl.dataset.v;
    stEl.className = 'pill ' + cls + (old && old !== st ? ' pop' : '');
    stEl.textContent = st; stEl.dataset.v = st;
    $('closes').innerHTML = closes;
    var lock = $('lock');
    lock.hidden = X.past || r === T;
    lock.setAttribute('aria-pressed', String(!!U.locked[X.R]));
    lock.textContent = U.locked[X.R] ? 'Unlock plan' : 'Lock plan';

    document.querySelectorAll('[data-roll]').forEach(function(el){
      var k = el.dataset.roll, v = k === 'total' ? X.tot.used : k === 'green' ? X.tot.green : k === 'batches' ? X.tot.batches : X.tot.cafes;
      roll(el, v, !!el.dataset.int);
    });
    var ci = document.querySelector('[data-w-id="band-c"]'), ei = document.querySelector('[data-w-id="band-e"]');
    ci.dataset.w = (X.tot.used ? X.tot.conf / X.tot.used * 100 : 0) + '%';
    ei.dataset.w = (X.tot.used ? (X.withExp ? X.tot.exp : 0) / X.tot.used * 100 : 0) + '%';
    $('legend').innerHTML = '<span><i class="c-roast"></i><b class="num">' + kg(X.tot.conf) + ' kg</b> ' + (X.past ? 'roasted and shipped' : 'confirmed on WhatsApp') + '</span>' +
      (X.past ? '' : '<span style="opacity:' + (X.withExp ? 1 : .45) + '"><i class="c-bean"></i><b class="num">' + kg(X.tot.exp) + ' kg</b> expected from usual orders and reminders' + (X.withExp ? '' : ', left out') + '</span>');
  }

  /* tabs */
  function customers(){
    var L = [
      { id: 'arjun', name: 'Arjun M.', coffee: 'LEAN Blend', bag: 500, cups: 2, del: '2026-10-20', out: null },
      { id: 'meera', name: 'Meera S.', coffee: 'Gungegiri Estate', bag: 250, cups: 1, del: '2026-10-16', out: 'paused', t: '9:31 am' },
      { id: 'farhan', name: 'Farhan A.', coffee: 'Ratnagiri Peaberry', bag: 500, cups: 2, del: '2026-10-19', out: 'reordered', t: '9:48 am' },
      { id: 'ishita', name: 'Ishita K.', coffee: 'Melkodige Estate', bag: 250, cups: 2, del: '2026-10-21', out: null },
      { id: 'rohan', name: 'Rohan D.', coffee: 'Barista Forte Blend', bag: 500, cups: 2, del: '2026-10-15', out: 'reordered', t: '9:12 am' },
      { id: 'neha', name: 'Neha G.', coffee: 'Gungegiri Estate', bag: 250, cups: 2, del: '2026-10-18', out: 'reordered', t: '10:02 am' },
      { id: 'kabir', name: 'Kabir R.', coffee: 'Cold Brew Blend BOLD', bag: 1000, cups: 3, del: '2026-10-22', out: null },
      { id: 'ananya', name: 'Ananya P.', coffee: 'Ratnagiri Peaberry', bag: 250, cups: 1, del: '2026-10-24', out: null },
      { id: 'vikram', name: 'Vikram S.', coffee: 'LEAN Blend', bag: 250, cups: 1, del: '2026-10-23', out: null }
    ].map(function(c){ c.p = plan(c.del, c.bag, c.cups); return c; });
    if (riyaOn) L.push({ id: 'riya', me: true, name: 'Riya', coffee: DS.paid ? COFFEES[riyaChosen].name : 'Ratnagiri Peaberry', bag: 250, cups: DS.cups, del: D0, out: DS.paid ? 'reordered' : DS.act === 'pause' ? 'paused' : null, p: RP });
    L.forEach(function(c){
      var rem = ix(c.p.remind);
      if (rem > T){ c.st = ['Reminder ' + fd(c.p.remind), '']; c.note = 'Runs out ' + fd(c.p.runOut); c.showArr = false; }
      else if (c.out === 'reordered'){ c.st = ['Reordered', 'good']; c.note = 'Arrives ' + fd(c.p.arrive); c.showArr = true; }
      else if (c.out === 'paused'){ c.st = ['Paused 2 weeks', '']; c.note = 'Checks in ' + fd(add(c.p.remind, 14)); c.showArr = false; }
      else if (rem === T){ c.st = ['Reminder sent today', 'warm']; c.note = 'Waiting for a reply'; c.showArr = false; }
      else { c.st = ['No reply yet', 'alert']; c.note = 'Follow-up goes tomorrow'; c.showArr = false; }
      if (c.p.late && c.out !== 'paused') { c.lateBy = ix(c.p.arrive) - ix(c.p.runOut); }
    });
    L.sort(function(a, b){ return ix(a.p.runOut) - ix(b.p.runOut); });
    return L;
  }

  function cafesList(R){
    var r = ix(R), ask = add(R, -2);
    var tw = twFor(R);
    var L = [
      { id: 'tw', name: 'Third Wave Corner', city: 'Pune', ini: 'TW', usual: 'LEAN Blend, 5 kg', me: true },
      { id: 'bt', name: 'Bean There Cafe', city: 'Nagpur', ini: 'BT', usual: 'LEAN Blend, 10 kg', confAt: R === '2026-10-28' ? 2 : 9, t: '10:15 am' },
      { id: 'mr', name: 'Morning Ritual', city: 'Indore', ini: 'MR', usual: 'LEAN Blend, 8 kg' },
      { id: 'sh', name: 'Summer House', city: 'Nagpur', ini: 'SH', usual: 'Cold Brew Blend BOLD, 2 kg', confAt: R === '2026-10-28' ? -1 : 99, t: 'Sat 24 Oct' },
      { id: 'cp', name: 'Cold Press Co.', city: 'Pune', ini: 'CP', usual: 'Cold Brew Blend BOLD, 5 kg' },
      { id: 'kc', name: 'Kaapi Corner', city: 'Hyderabad', ini: 'KC', usual: 'Ratnagiri Peaberry, 4 kg', confAt: R === '2026-10-28' ? 3 : 10, t: '11:40 am' },
      { id: 'br', name: 'Brew Room', city: 'Nagpur', ini: 'BR', usual: 'Barista Forte Blend, 3 kg', confAt: R === '2026-10-28' ? -1 : 99, t: 'Sat 24 Oct' },
      { id: 'sp', name: 'Slow Pour', city: 'Bengaluru', ini: 'SP', usual: 'Gungegiri Estate, 2 kg' }
    ];
    L.forEach(function(c){
      if (r < T || (r === T)){ c.st = ['In the roast', 'good']; c.sub = c.me && tw.kept ? 'Usual order kept, no reply' : ''; c.btn = null; return; }
      if (c.me){
        if (tw.skip){ c.st = ['Skipped', '']; c.sub = 'Replied on WhatsApp'; c.btn = null; }
        else if (tw.firm){ c.st = ['Confirmed ' + tw.kg + ' kg', 'good']; c.sub = 'Replied on WhatsApp'; c.btn = null; }
        else if (T >= ix(ask)){ c.st = ['Waiting', 'warm']; c.sub = 'Asked ' + f(ask) + ', 8:30 am'; c.btn = 1; }
        else { c.st = ['Asks ' + f(ask), '']; c.sub = ''; c.btn = null; }
        return;
      }
      if (c.confAt != null && T >= c.confAt){ c.st = ['Confirmed', 'good']; c.sub = c.t; c.btn = null; }
      else if (T >= ix(ask)){ c.st = ['Waiting', 'warm']; c.sub = 'Asked ' + f(ask) + ', 8:30 am'; c.btn = 1; }
      else { c.st = ['Asks ' + f(ask), '']; c.sub = ''; c.btn = null; }
    });
    return L;
  }

  /* underline that slides from the old tab to the new one */
  var lastTab = null, ink = { l: null, w: 0 };
  function moveInk(){
    var tabs = $('tabs'), sel = tabs.querySelector('[aria-selected="true"]');
    if (!sel) return;
    var el = document.createElement('span');
    el.className = 'ink'; el.setAttribute('aria-hidden', 'true');
    var l = sel.offsetLeft, w = sel.offsetWidth;
    el.style.width = (ink.l === null ? w : ink.w) + 'px';
    el.style.transform = 'translateX(' + (ink.l === null ? l : ink.l) + 'px)';
    tabs.appendChild(el);
    if (ink.l !== null && (ink.l !== l || ink.w !== w)){
      void el.offsetWidth;
      el.style.width = w + 'px'; el.style.transform = 'translateX(' + l + 'px)';
    }
    ink = { l: l, w: w };
  }
  addEventListener('resize', function(){ ink.l = null; var o = document.querySelector('#tabs .ink'); if (o) o.remove(); moveInk(); });

  function renderTabs(X){
    var cust = customers(), cafes = cafesList(X.R);
    var tickets = 0; X.rows.forEach(function(r){ tickets += r.batches; });
    var tabs = [['plan', 'Roast plan', X.rows.filter(function(r){ return r.used > 0; }).length], ['batches', 'Batches', tickets], ['customers', 'Customers', cust.length], ['cafes', 'Cafes', cafes.length]];
    $('tabs').innerHTML = tabs.map(function(t){ return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (U.tab === t[0]) + '">' + t[1] + '<span class="ct num">' + t[2] + '</span></button>'; }).join('');
    var p = $('panel'), html = '';
    if (U.tab === 'plan') html = planPanel(X);
    else if (U.tab === 'batches') html = batchPanel(X);
    else if (U.tab === 'customers') html = custPanel(cust);
    else html = cafePanel(X, cafes);
    p.innerHTML = '<div class="panel' + (lastTab !== null && lastTab !== U.tab ? ' swap' : '') + '" role="tabpanel">' + html + '</div>';
    lastTab = U.tab;
    moveInk();
    return { cust: cust, cafes: cafes };
  }

  function planPanel(X){
    var rows = X.rows.filter(function(r){ return U.profile === 'All' || r.c.profile === U.profile; }).sort(function(a, b){ return (b.conf + b.exp) - (a.conf + a.exp); });
    var max = Math.max.apply(null, rows.map(function(r){ return r.conf + r.exp; }).concat([1]));
    var h = '<div class="bar-tools"><div class="chips" role="group" aria-label="Coffee type">' + ['All', 'Espresso', 'Filter'].map(function(x){ return '<button type="button" data-prof="' + x + '" aria-pressed="' + (U.profile === x) + '">' + x + '</button>'; }).join('') + '</div>' +
      '<button class="switch" type="button" role="switch" id="expSw" aria-checked="' + X.withExp + '"' + (X.past ? ' disabled' : '') + '><span class="sw" aria-hidden="true"></span>Count expected orders</button></div>';
    h += '<ul class="coffees">' + rows.map(function(r){
      var open = !!U.open[r.k];
      var cw = r.conf / max * 100, ew = (X.withExp ? r.exp : 0) / max * 100;
      var det = '';
      if (open){
        det = '<div class="detail"><div class="orders">' + r.orders.map(function(x){
          var cls = 'ord' + (x[3] ? '' : ' exp') + (!x[3] && !X.withExp ? ' off' : '');
          return '<span class="' + cls + '">' + ICON[x[1]] + '<b>' + esc(x[0]) + '</b><span>' + kg(x[2]) + ' kg' + (x[4] ? ', from the demo' : '') + '</span></span>';
        }).join('') + '</div><div class="facts"><span><b>' + r.green.toFixed(1) + ' kg</b> green coffee</span><span><b>' + r.batches + '</b> ' + (r.batches === 1 ? 'batch' : 'batches') + '</span><span>' + Math.round(LOSS[r.c.profile] * 100) + '% roast loss</span></div></div>';
      }
      return '<li><button class="row" type="button" data-k="' + r.k + '" aria-expanded="' + open + '"><span class="nm"><span>' + r.c.name + '<small>' + r.c.profile + '</small></span></span>' +
        '<span class="tr" aria-hidden="true"><i class="c-roast" data-w="' + cw + '%" data-w-id="r-' + r.k + '-c"></i><i class="c-bean" data-w="' + ew + '%" data-w-id="r-' + r.k + '-e"></i></span>' +
        '<span class="ce num"><b>' + kg(r.conf) + '</b> + <em style="opacity:' + (X.withExp ? 1 : .4) + '">' + kg(r.exp) + '</em></span>' +
        '<span class="tot num">' + kg(r.used) + '<small> kg</small></span>' + ICON.chev + '</button>' + det + '</li>';
    }).join('') + '</ul>';
    return h;
  }

  function batchPanel(X){
    var list = [];
    X.rows.slice().sort(function(a, b){ return b.green - a.green; }).forEach(function(r){
      for (var i = 0; i < r.batches; i++){
        var g = i < r.batches - 1 ? BATCH : r.green - BATCH * (r.batches - 1);
        list.push({ key: X.R + ':' + r.k + ':' + i, name: r.c.name, g: g, out: g * (1 - LOSS[r.c.profile]) });
      }
    });
    if (!list.length) return '<div class="empty">Nothing to roast yet. Turn on expected orders to plan batches ahead.</div>';
    var done = 0;
    list.forEach(function(b){ b.done = X.past || !!U.done[b.key]; if (b.done) done++; });
    return '<div class="prog"><span class="t" aria-hidden="true"><i data-w="' + (done / list.length * 100) + '%" data-w-id="prog"></i></span><b class="num">' + done + ' of ' + list.length + ' roasted</b></div>' +
      '<div class="tickets">' + list.map(function(b, i){
        return '<label class="ticket' + (b.done ? ' done' : '') + '"><span class="hd"><span class="no">#' + String(i + 1).padStart(2, '0') + '</span><input type="checkbox" data-batch="' + b.key + '"' + (b.done ? ' checked' : '') + (X.past ? ' disabled' : '') + ' aria-label="Mark batch ' + (i + 1) + ' roasted"></span><span class="cf">' + b.name + '</span><span class="kg num">' + b.g.toFixed(1) + '<small> kg green</small></span><span class="out">About ' + b.out.toFixed(1) + ' kg roasted</span>' + (b.done ? '<span class="stamp" aria-hidden="true">Roasted</span>' : '') + '</label>';
      }).join('') + '</div>';
  }

  function custPanel(L){
    var W0 = '2026-10-14', W1 = '2026-11-14', span = ix(W1) - ix(W0) + 1;
    function x(s){ return ((ix(s) - ix(W0)) / span * 100); }
    var head = '';
    for (var i = 0; i < span; i++){
      var d = add(W0, i), dt = P(d);
      if (dt.getUTCDate() === 1 || i === 0) head += '<span class="mo" style="left:' + x(d) + '%">' + MON[dt.getUTCMonth()] + '</span>';
      if (dt.getUTCDay() === 3) head += '<span style="left:' + (x(d) + 50 / span) + '%">' + dt.getUTCDate() + '</span>';
    }
    var roastCols = CUST_ROASTS.map(function(R){ return '<span class="roastcol" style="left:' + x(R) + '%;width:' + (100 / span) + '%"></span>'; }).join('');
    var todayL = '<span class="todayline" style="left:' + (x(TODAY) + 50 / span) + '%"></span>';
    var rows = L.map(function(c){
      var s = c.p.delivered < W0 ? W0 : c.p.delivered;
      var left = x(s), w = x(add(c.p.runOut, 1)) - left;
      var used = Math.max(0, Math.min(1, (ix(TODAY) - ix(c.p.delivered)) / (ix(c.p.runOut) - ix(c.p.delivered))));
      var bagStyle = 'left:' + left + '%;background-size:' + ((1 - used) * 100) + '% 100%;background-position:right;';
      var marks = '<span class="mk rem" title="Reminder" style="left:' + (x(c.p.remind) + 50 / span) + '%"></span>' +
        '<span class="mk out' + (c.lateBy ? ' late' : '') + '" style="left:' + x(add(c.p.runOut, 1)) + '%"></span>' +
        (c.showArr ? '<span class="mk arr" style="left:' + (x(c.p.arrive) + 50 / span) + '%"></span>' : '');
      return '<div class="tl-row' + (c.me ? ' me' : '') + '"><div class="tl-who"><b>' + esc(c.name) + '</b><span>' + esc(c.coffee) + ', ' + (c.bag >= 1000 ? c.bag / 1000 + ' kg' : c.bag + ' g') + ', ' + c.cups + (c.cups > 1 ? ' cups' : ' cup') + '</span></div>' +
        '<div class="tl-lane">' + roastCols + '<span class="bag" style="' + bagStyle + '" data-w="' + w + '%" data-w-id="bag-' + c.id + '"></span>' + marks + todayL + '</div>' +
        '<div class="tl-st"><span class="pill ' + c.st[1] + '">' + c.st[0] + '</span>' + (c.lateBy ? '<span class="pill alert">' + c.lateBy + (c.lateBy > 1 ? ' days' : ' day') + ' short</span>' : '<small>' + c.note + '</small>') + '</div></div>';
    }).join('');
    return '<div class="tl-box"><div class="tl"><div class="tl-row head"><div class="tl-who">Customer</div><div class="tl-head">' + head + todayL + '</div><div class="tl-st">Status</div></div>' + rows + '</div></div>' +
      '<div class="tl-key"><span><span class="bag" style="position:static;display:inline-block;width:28px;margin:0"></span>Coffee left in the bag</span><span><span class="mk rem"></span>Reminder</span><span><span class="mk arr"></span>New bag arrives</span><span><span class="mk out"></span>Runs out</span><span><span class="roastcol" style="position:static;display:inline-block;width:14px;height:14px"></span>Roast day</span><span><span class="todayline" style="position:static;display:inline-block;height:14px;margin:0"></span>Today</span></div>';
  }

  function cafePanel(X, L){
    return '<ul class="cafes">' + L.map(function(c){
      var sent = !!U.nudged[X.R + ':' + c.id];
      var btn = c.btn ? '<button class="act" type="button" data-nudge="' + c.id + '"' + (sent ? ' disabled' : '') + '>' + (sent ? 'Reminder sent' : 'Send reminder') + '</button>' : '<span></span>';
      return '<li><span class="ava">' + c.ini + '</span><span class="who"><b>' + c.name + (c.me ? ' <span class="pill" style="height:20px;font-size:11px">In the demo</span>' : '') + '</b><span>' + c.city + '</span></span><span class="ord-txt">Usual: <b>' + c.usual + '</b></span><span class="st"><span class="pill ' + c.st[1] + '">' + c.st[0] + '</span>' + (c.sub ? '<small>' + c.sub + '</small>' : '') + '</span>' + btn + '</li>';
    }).join('') + '</ul><p class="policy">No reply by 6 pm the day before the roast keeps the cafe\'s usual order. Cafes reply SKIP to leave a week out.</p>';
  }

  /* rail */
  function renderRail(X, D){
    var items = [];
    if (!X.past && X.r > T && !U.locked[X.R]){
      var waiting = D.cafes.filter(function(c){ return c.btn && !U.nudged[X.R + ':' + c.id]; });
      if (waiting.length) items.push({ id: 'cafes', hot: true, html: '<b>' + waiting.length + (waiting.length > 1 ? ' cafes have' : ' cafe has') + ' not confirmed</b> for the ' + f(X.R) + ' roast. Their usual orders count as expected until they reply.', btn: 'Remind them on WhatsApp' });
    }
    D.cust.forEach(function(c){
      if (c.lateBy && ix(c.p.remind) >= T - 1) items.push({ id: 'late-' + c.id, html: '<b>' + c.name + '</b> runs out ' + c.lateBy + (c.lateBy > 1 ? ' days' : ' day') + ' before the next roast can reach her. A 500 g bag would last ' + Math.floor(500 / c.p.daily) + ' days.', btn: 'Suggest 500 g in her reminder' });
      if (c.st[1] === 'alert') items.push({ id: 'nr-' + c.id, html: '<b>' + c.name + '</b> has not replied since ' + f(c.p.remind) + '.', btn: 'Send a follow-up' });
    });
    if (!X.past && X.r === T + 1 && !U.locked[X.R]) items.push({ id: 'lock', html: 'The <b>' + f(X.R) + '</b> plan closes at 6 pm today.', btn: 'Lock plan now' });
    var open = items.filter(function(i){ return !U.needsDone[i.id]; }).length;
    $('needCount').textContent = open; $('needCount').className = 'pill' + (open ? ' warm' : '');
    $('needs').innerHTML = items.length ? items.map(function(i){
      var done = !!U.needsDone[i.id];
      return '<li class="need' + (i.hot && !done ? ' hot' : '') + (done ? ' done' : '') + '"><p>' + i.html + '</p><button class="act" type="button" data-need="' + i.id + '"' + (done ? ' disabled' : '') + '>' + (done ? 'Done' : i.btn) + '</button></li>';
    }).join('') : '<li class="empty">Nothing needs you right now.</li>';

    var ev = [];
    function push(t, who, what, kind){ ev.push({ t: t, who: who, what: what, kind: kind }); }
    D.cust.forEach(function(c){
      if (ix(c.p.remind) === T){
        if (c.id !== 'riya') push('9:00 am', 'Reminder', 'sent to ' + c.name, 'send');
        if (c.out === 'paused' && c.t) push(c.t, c.name, 'paused for 2 weeks', 'pause');
        if (c.out === 'reordered' && c.t) push(c.t, c.name, 'reordered ' + c.coffee, 'reorder');
      }
    });
    if (riyaOn && ix(RP.remind) === T){
      push('9:00 am', 'Reminder', 'sent to Riya', 'send');
      if (DS.paid) push('9:07 am', 'Riya', 'paid ₹' + (riyaChosen === 'melkodige' ? 750 : 700) + ' for ' + COFFEES[riyaChosen].name, 'reorder');
      if (DS.act === 'pause') push('9:06 am', 'Riya', 'paused for 2 weeks', 'pause');
    }
    ROASTS.forEach(function(R){
      if (ix(R) - 2 === T) push('8:30 am', 'Weekly check', 'sent to 8 cafes for ' + f(R), 'send');
      var rep = DS.cafe[R];
      if (rep && rep.day === T) push(rep.day === ix(R) - 1 ? '12:06 pm' : '8:44 am', 'Third Wave Corner', rep.v === 'skip' ? 'skipped this week' : 'confirmed ' + (rep.v === 'more' ? 7 : 5) + ' kg', 'confirm');
      if (ix(R) === T) push('6:00 am', f(R) + ' roast', 'started', 'roast');
    });
    if (T === 2) push('10:15 am', 'Bean There Cafe', 'confirmed 10 kg of LEAN Blend', 'confirm');
    if (T === 3) push('11:40 am', 'Kaapi Corner', 'confirmed 4 kg of Ratnagiri', 'confirm');
    function mins(t){ var m = t.match(/(\d+):(\d+)\s*(am|pm)/); var h = +m[1] % 12; if (m[3] === 'pm') h += 12; return h * 60 + (+m[2]); }
    ev.sort(function(a, b){ return mins(b.t) - mins(a.t); });
    var IC = {
      send: ['#E6EBF0', '#304557', '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>'],
      pause: ['#F1F1EF', '#56616B', '<path d="M9 6v12M15 6v12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'],
      reorder: ['#FFE6D3', '#8A3B00', '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'],
      confirm: ['#E2F4E8', '#17663A', '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'],
      roast: ['#000', '#fff', '<path d="M12 3c1 3 4.5 4.6 4.5 9a4.5 4.5 0 0 1-9 0c0-2.2 1.1-3.5 2.2-4.4 0 2 .9 3.2 2.1 3.4.3-3-.8-5.2.2-8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>']
    };
    $('feed').innerHTML = ev.length ? ev.slice(0, 7).map(function(e){
      var ic = IC[e.kind];
      return '<li><span class="ic" style="background:' + ic[0] + ';color:' + ic[1] + '"><svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">' + ic[2] + '</svg></span><span><span class="who">' + esc(e.who) + '</span> ' + esc(e.what) + '</span><span class="tm num">' + e.t + '</span></li>';
    }).join('') : '<li class="empty">Quiet day so far.</li>';
  }

  function render(){
    var X = compute(U.R);
    renderTop(X);
    var D = renderTabs(X);
    renderRail(X, D);
    grow();
  }

  /* events */
  document.addEventListener('click', function(e){
    var t;
    if ((t = e.target.closest('#roastDays button'))){ U.R = t.dataset.r; render(); return; }
    if ((t = e.target.closest('#tabs button'))){ U.tab = t.dataset.tab; render(); return; }
    if ((t = e.target.closest('[data-prof]'))){ U.profile = t.dataset.prof; render(); return; }
    if ((t = e.target.closest('#expSw'))){ U.expected = !U.expected; render(); return; }
    if ((t = e.target.closest('.row'))){ U.open[t.dataset.k] = !U.open[t.dataset.k]; render(); return; }
    if ((t = e.target.closest('[data-nudge]'))){ U.nudged[U.R + ':' + t.dataset.nudge] = true; render(); return; }
    if ((t = e.target.closest('[data-need]'))){
      var id = t.dataset.need;
      U.needsDone[id] = true;
      if (id === 'cafes') cafesList(U.R).forEach(function(c){ if (c.btn) U.nudged[U.R + ':' + c.id] = true; });
      if (id === 'lock') U.locked[U.R] = true;
      render(); return;
    }
    if ((t = e.target.closest('#lock'))){ U.locked[U.R] = !U.locked[U.R]; render(); return; }
  });
  document.addEventListener('change', function(e){
    var t = e.target.closest('[data-batch]');
    if (t){ U.done[t.dataset.batch] = t.checked; render(); }
  });
  document.addEventListener('keydown', function(e){
    var t = e.target.closest('#tabs button');
    if (!t || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    var list = Array.prototype.slice.call(document.querySelectorAll('#tabs button')), i = list.indexOf(t);
    var n = list[(i + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length];
    U.tab = n.dataset.tab; render(); document.querySelector('#tabs button[data-tab="' + U.tab + '"]').focus();
  });

  render();
  setTimeout(function(){ $('donutArc').setAttribute('stroke-dasharray', (163.4 * .62).toFixed(1) + ' 163.4'); }, reduce ? 0 : 250);
})();
