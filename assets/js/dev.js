(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(id){ return document.getElementById(id); };
  var SRC = { shopify: ['Shopify', 's-shopify'], wa: ['WhatsApp', 's-wa'], svc: ['Service', 's-svc'], pay: ['Razorpay', 's-pay'] };
  var EV = [
    { src: 'shopify', name: 'Order delivered', when: 'Sat 24 Oct, 11:10 am', edges: ['p1'], nodes: ['n-shop', 'n-svc'], why: 'Shopify tells the service the order is delivered. The bag size and grind come from the line item.',
      json: { topic: 'fulfillment_events/create', status: 'delivered', order: { id: 'gid://shopify/Order/5904123', name: '#C7-10482', customer: { first_name: 'Riya', phone: '+91 98•••• ••21' }, line_items: [{ sku: 'RATNAGIRI-250-V60', title: 'Ratnagiri Peaberry', grams: 250, grind: 'V60' }] } } },
    { src: 'wa', name: 'delivery_optin sent', when: 'Sat 24 Oct, 11:12 am', edges: ['p2', 'p3'], nodes: ['n-svc', 'n-wa', 'n-cust'], why: 'First message, sent with an approved Utility template.',
      json: { messaging_product: 'whatsapp', to: '9198••••••21', type: 'template', template: { name: 'delivery_optin', language: { code: 'en' }, components: [{ type: 'body', parameters: [{ type: 'text', text: 'Riya' }, { type: 'text', text: 'Ratnagiri Peaberry' }] }] } } },
    { src: 'wa', name: 'Riya replies "2 cups"', when: 'Sat 24 Oct, 11:15 am', edges: ['p4', 'p5'], nodes: ['n-cust', 'n-wa', 'n-svc'], why: 'WhatsApp posts each reply to the service as a webhook.',
      json: { object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: { messages: [{ from: '9198••••••21', type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: 'cups_2', title: '2 cups' } } }] } }] }] } },
    { src: 'svc', name: 'Reminder scheduled', when: 'Sat 24 Oct, 11:15 am', edges: [], nodes: ['n-svc'], why: 'The rules engine works out the run-out date and the roast to aim for, then stores one reminder.',
      json: { customer: 'riya', grams_a_day: 30, run_out: '2026-11-01', target_roast: '2026-10-28', arrives: '2026-10-31', remind_at: '2026-10-26T09:00:00+05:30', status: 'scheduled' } },
    { src: 'wa', name: 'reorder_reminder sent', when: 'Mon 26 Oct, 9:00 am', edges: ['p2', 'p3'], nodes: ['n-svc', 'n-wa', 'n-cust'], why: 'The scheduler fires at 9 am and fills in the dates.',
      json: { type: 'template', template: { name: 'reorder_reminder', components: [{ type: 'body', parameters: ['Riya', 'Ratnagiri', 'Sun 1 Nov', 'Wed 28 Oct', 'Tue 27 Oct', 'Sat 31 Oct'] }, { type: 'button', sub_type: 'quick_reply', index: 0, parameters: [{ type: 'payload', payload: 'reorder_same' }] }] } } },
    { src: 'wa', name: 'Riya taps "Reorder same"', when: 'Mon 26 Oct, 9:06 am', edges: ['p4', 'p5'], nodes: ['n-cust', 'n-wa', 'n-svc'], why: 'The quick reply carries a payload, so no text parsing is needed.',
      json: { messages: [{ from: '9198••••••21', type: 'button', button: { payload: 'reorder_same', text: 'Reorder same' }, context: { id: 'wamid.HBgM…' } }] } },
    { src: 'pay', name: 'UPI payment link created', when: 'Mon 26 Oct, 9:06 am', edges: ['p6'], nodes: ['n-svc', 'n-pay'], why: 'The service asks Razorpay for a payment link and sends it back in the chat.',
      json: { amount: 70000, currency: 'INR', description: 'Ratnagiri Peaberry 250 g, V60', upi_link: true, reference_id: 'c7-reorder-10483', expire_by: 1793104200 } },
    { src: 'pay', name: 'payment.captured', when: 'Mon 26 Oct, 9:07 am', edges: ['p7'], nodes: ['n-pay', 'n-svc'], why: 'Razorpay confirms the payment with a signed webhook.',
      json: { event: 'payment_link.paid', payload: { payment: { entity: { amount: 70000, method: 'upi', status: 'captured' } }, payment_link: { entity: { reference_id: 'c7-reorder-10483' } } } } },
    { src: 'shopify', name: 'Order created in Shopify', when: 'Mon 26 Oct, 9:07 am', edges: ['p8'], nodes: ['n-svc', 'n-shop'], why: 'A normal paid order, tagged so your team can filter WhatsApp reorders.',
      json: { mutation: 'orderCreate', order: { name: '#C7-10483', financialStatus: 'PAID', tags: ['whatsapp-reorder'], lineItems: [{ sku: 'RATNAGIRI-250-V60', quantity: 1 }], note: 'Roast Wed 28 Oct' } } },
    { src: 'svc', name: 'Roast plan updated', when: 'Mon 26 Oct, 9:07 am', edges: ['p9'], nodes: ['n-svc', 'n-dash'], why: "Riya's 0.25 kg moves from expected to confirmed in the Wed 28 Oct roast.",
      json: { roast: '2026-10-28', coffee: 'ratnagiri', confirmed_kg: '+0.25', expected_kg: '-0.25', total_kg: 54.75 } }
  ];

  var cur = 0, playing = null;

  function hl(obj){
    var s = JSON.stringify(obj, null, 2);
    s = s.replace(/[&<>]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; });
    return s.replace(/("(?:\\.|[^"\\])*")(\s*:)?|\b(-?\d+(?:\.\d+)?)\b|([{}\[\],])/g, function(m, str, colon, num, p){
      if (str) return colon ? '<span class="j-k">' + str + '</span><span class="j-p">' + colon + '</span>' : '<span class="j-s">' + str + '</span>';
      if (num) return '<span class="j-n">' + num + '</span>';
      return '<span class="j-p">' + p + '</span>';
    });
  }

  function lightMap(e){
    document.querySelectorAll('.map .edge').forEach(function(p){ p.classList.remove('hot'); p.setAttribute('marker-end', 'url(#ar)'); });
    document.querySelectorAll('.map .lab').forEach(function(l){ l.classList.remove('hot'); });
    document.querySelectorAll('.map .node').forEach(function(n){ n.classList.remove('on'); });
    if (!e) return;
    e.edges.forEach(function(id){ var p = $(id); p.classList.add('hot'); p.setAttribute('marker-end', 'url(#arh)'); var l = $('l' + id.slice(1)); if (l) l.classList.add('hot'); });
    e.nodes.forEach(function(id){ $(id).classList.add('on'); });
  }

  function render(){
    $('events').innerHTML = EV.map(function(e, i){
      var s = SRC[e.src];
      return '<li class="' + (i < cur ? 'done' : '') + '"><button type="button" data-i="' + i + '" aria-current="' + (i === cur) + '"><span class="k">' + (i + 1) + '</span><span class="n"><span class="src ' + s[1] + '">' + s[0] + '</span>' + e.name + '</span><span class="m">' + e.when + '</span></button></li>';
    }).join('');
    var e = EV[cur];
    $('vh').innerHTML = '<span class="src ' + SRC[e.src][1] + '">' + SRC[e.src][0] + '</span><b>' + e.name + '</b><span>' + e.when + '</span>';
    $('json').innerHTML = hl(e.json);
    $('why').textContent = e.why;
    lightMap(e);
    var btn = document.querySelector('#events [aria-current="true"]');
    if (btn && playing){ var box = $('events'); box.scrollTop = btn.offsetTop - box.clientHeight / 2; }
  }

  function stop(){ clearInterval(playing); playing = null; $('play').textContent = 'Play the order'; }
  $('play').addEventListener('click', function(){
    if (playing){ stop(); return; }
    if (cur >= EV.length - 1) cur = 0;
    $('play').textContent = 'Pause';
    playing = setInterval(function(){
      if (cur >= EV.length - 1){ stop(); return; }
      cur++; render();
    }, reduce ? 1600 : 1400);
    render();
  });
  $('reset').addEventListener('click', function(){ stop(); cur = 0; render(); });
  $('events').addEventListener('click', function(e){ var b = e.target.closest('[data-i]'); if (!b) return; stop(); cur = +b.dataset.i; render(); });

  /* moving packets on the map */
  if (!reduce){
    var g = $('packets'), NS = 'http://www.w3.org/2000/svg';
    [['p1', 3.2, 0], ['p2', 2.2, .6], ['p3', 2.4, 1.2], ['p4', 2.4, 2.4], ['p5', 2.2, 3.0], ['p6', 2.8, 1.6], ['p7', 2.8, 3.1], ['p8', 3.6, 2.2], ['p9', 2.0, .9]].forEach(function(d){
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', '4.5'); c.setAttribute('class', 'pk');
      var a = document.createElementNS(NS, 'animateMotion');
      a.setAttribute('dur', d[1] + 's'); a.setAttribute('begin', d[2] + 's'); a.setAttribute('repeatCount', 'indefinite');
      a.setAttribute('keyPoints', '0;1'); a.setAttribute('keyTimes', '0;1'); a.setAttribute('calcMode', 'linear');
      var mp = document.createElementNS(NS, 'mpath');
      mp.setAttribute('href', '#' + d[0]);
      a.appendChild(mp); c.appendChild(a); g.appendChild(c);
    });
  }

  render();
})();
