/* Shared by every page: the site menu, section markers, the in-page nav and reveal-on-scroll. */
(function(){
  'use strict';
  var path = location.pathname.replace(/\/+$/, '') || '/';
  var cur = /\/dashboard(\.html)?$/.test(path) ? 'dash' : /\/dev(\.html)?$/.test(path) ? 'dev' : /^\/(index(\.html)?)?$/.test(path) ? 'demo' : '';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* 1. Site menu */
  var PAGES = [
    { id: 'demo', href: '/', name: 'Live demo', sub: "Play one customer's week on WhatsApp" },
    { id: 'dash', href: '/dashboard', name: 'Roastery dashboard', sub: 'Roast plan, batches, customers and cafes' },
    { id: 'dev', href: '/dev', name: 'Under the hood', sub: 'How it runs, for your developers' },
    { id: 'how', href: '/#how', name: 'How it would run', sub: 'What going live takes' }
  ];
  var btn = document.getElementById('menuBtn');
  if (btn){
    var scrim = document.createElement('div');
    scrim.className = 'scrim'; scrim.hidden = true;
    var dr = document.createElement('nav');
    dr.className = 'drawer'; dr.id = 'siteMenu'; dr.hidden = true;
    dr.setAttribute('aria-label', 'Demo pages');
    dr.innerHTML =
      '<div class="drawer-top"><span class="mark">Corridor Seven</span>' +
      '<button class="drawer-close" type="button" aria-label="Close menu"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div>' +
      '<ol>' + PAGES.map(function(p, i){
        var here = p.id === cur;
        return '<li style="--i:' + i + '"><a class="item" href="' + p.href + '"' + (here ? ' aria-current="page"' : '') + '><span class="d-ix">0' + (i + 1) + '</span><span class="d-nm">' + p.name + '</span>' + (here ? '<span class="d-here">You are here</span>' : '') + '<span class="d-sub">' + p.sub + '</span></a></li>';
      }).join('') + '</ol>' +
      '<div class="foot-note"><span>A working concept by Akshit Sharma. Every customer, cafe and order here is sample data.</span><a class="btn btn-main" href="/#ask">Book a 20-minute call</a></div>';
    document.body.appendChild(scrim);
    document.body.appendChild(dr);
    btn.setAttribute('aria-controls', 'siteMenu');
    btn.setAttribute('aria-expanded', 'false');

    var closeT = null;
    var open = function(){
      clearTimeout(closeT);
      scrim.hidden = false; dr.hidden = false;
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ scrim.classList.add('open'); dr.classList.add('open'); }); });
      btn.setAttribute('aria-expanded', 'true');
      document.documentElement.style.overflow = 'hidden';
      setTimeout(function(){ (dr.querySelector('[aria-current]') || dr.querySelector('a.item')).focus(); }, 60);
    };
    var close = function(refocus){
      scrim.classList.remove('open'); dr.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      closeT = setTimeout(function(){ scrim.hidden = true; dr.hidden = true; }, 260);
      if (refocus !== false) btn.focus();
    };
    btn.addEventListener('click', function(){ dr.hidden ? open() : close(); });
    scrim.addEventListener('click', close);
    dr.querySelector('.drawer-close').addEventListener('click', close);
    dr.addEventListener('click', function(e){
      var a = e.target.closest('a');
      if (a && a.getAttribute('href').indexOf('/#') === 0 && cur === 'demo') close(false);
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && !dr.hidden) close();
      if (e.key === 'Tab' && !dr.hidden){
        var f = dr.querySelectorAll('a,button'), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    });
  }

  /* 2. Section markers on the right edge: sections marked data-rail="Label" data-tone="dark|light|orange" */
  var railSecs = [].slice.call(document.querySelectorAll('[data-rail]'));
  if (railSecs.length > 1){
    var rail = document.createElement('nav');
    rail.className = 'srail'; rail.setAttribute('aria-label', 'Sections on this page');
    rail.innerHTML = '<ol>' + railSecs.map(function(s, i){
      return '<li><a href="#' + s.id + '"><span>' + s.dataset.rail + '</span><i></i></a></li>';
    }).join('') + '</ol><span class="count num" aria-hidden="true"></span>';
    document.body.appendChild(rail);
    var links = rail.querySelectorAll('a'), count = rail.querySelector('.count');
    var setRail = function(i){
      links.forEach(function(a, k){ if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      rail.dataset.tone = railSecs[i].dataset.tone || 'dark';
      count.textContent = '0' + (i + 1) + ' / 0' + railSecs.length;
    };
    setRail(0);
    var railTick = function(){
      var mid = innerHeight / 2, best = 0;
      railSecs.forEach(function(s, i){ if (s.getBoundingClientRect().top <= mid) best = i; });
      setRail(best);
    };
    addEventListener('scroll', function(){ requestAnimationFrame(railTick); }, { passive: true });
    railTick();
  }

  /* 3. In-page nav: a .subnav placeholder fills itself from sections marked data-subnav="Label" */
  var sub = document.querySelector('.subnav');
  var subSecs = [].slice.call(document.querySelectorAll('[data-subnav]'));
  if (sub && subSecs.length){
    sub.innerHTML = '<div class="wrap"><span class="lbl">On this page</span>' + subSecs.map(function(s, i){
      return '<a href="#' + s.id + '"><b>0' + (i + 1) + '</b>' + s.dataset.subnav + '</a>';
    }).join('') + '</div>';
    var sLinks = sub.querySelectorAll('a'), sWrap = sub.querySelector('.wrap');
    var lastSub = -1;
    var subTick = function(){
      var line = sub.getBoundingClientRect().bottom + 24, best = -1;
      subSecs.forEach(function(s, i){ if (s.getBoundingClientRect().top <= line) best = i; });
      if (best !== lastSub){
        sLinks.forEach(function(a, k){ if (k === best) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
        if (best > -1){
          var a = sLinks[best], l = a.offsetLeft, r = l + a.offsetWidth;
          if (l < sWrap.scrollLeft + 40 || r > sWrap.scrollLeft + sWrap.clientWidth - 40) sWrap.scrollTo({ left: l - 60, behavior: reduce ? 'auto' : 'smooth' });
        }
        lastSub = best;
      }
    };
    addEventListener('scroll', function(){ requestAnimationFrame(subTick); }, { passive: true });
    addEventListener('resize', subTick);
    subTick();
  }

  /* 4. Reveal on scroll: [data-reveal] fades up once; children with data-reveal-step stagger */
  var rev = document.querySelectorAll('[data-reveal]');
  if (!hasIO || reduce){ rev.forEach(function(el){ el.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .18, rootMargin: '0px 0px -40px 0px' });
    rev.forEach(function(el){ io.observe(el); });
  }

  /* 5. Copy buttons: <button data-copy="#id"> */
  document.addEventListener('click', function(e){
    var b = e.target.closest('[data-copy]');
    if (!b) return;
    var src = document.querySelector(b.dataset.copy), txt = src ? src.textContent : '';
    var done = function(){ b.textContent = 'Copied'; setTimeout(function(){ b.textContent = 'Copy'; }, 1600); };
    var pick = function(){ var r = document.createRange(); r.selectNodeContents(src); var s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(txt).then(done, pick); } catch (err) { pick(); }
  });
})();
