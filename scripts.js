/* ── Niche toggle ── */
function tog(id,pill){
  var sec=document.getElementById('sec-'+id);
  var wasOn=pill.classList.contains('on');

  // Close all other sections/pills first (accordion behavior)
  document.querySelectorAll('.pill').forEach(function(p){
    if(p!==pill){ p.classList.remove('on'); }
  });
  document.querySelectorAll('.psec').forEach(function(s){
    if(s!==sec){ s.classList.add('hidden'); }
  });

  // Toggle the clicked one
  if(wasOn){
    pill.classList.remove('on');
    sec.classList.add('hidden');
  } else {
    pill.classList.add('on');
    sec.classList.remove('hidden');
  }
}

/* ── Smooth scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    e.preventDefault();
    var t=document.querySelector(a.getAttribute('href'));
    if(t){window.scrollTo({top:t.getBoundingClientRect().top+window.pageYOffset-68,behavior:'smooth'});}
  });
});

/* ── Load profile photo ── */

/* ── Testimonial carousel ── */
var car=document.getElementById('tcarousel');
var cards=car.querySelectorAll('.tc');
var dotsEl=document.getElementById('carDots');
for(var i=0;i<cards.length;i++){
  (function(idx){
    var d=document.createElement('button');
    d.className='car-dot'+(idx===0?' active':'');
    d.addEventListener('click',function(){
      var w=cards[0].offsetWidth+22;
      car.scrollTo({left:idx*w,behavior:'smooth'});
    });
    dotsEl.appendChild(d);
  })(i);
}
function scrollTesti(dir){
  var w=cards[0].offsetWidth+22;
  car.scrollBy({left:dir*w,behavior:'auto'});
}
car.addEventListener('scroll',function(){
  var w=cards[0].offsetWidth+22;
  var idx=Math.round(car.scrollLeft/w);
  document.querySelectorAll('.car-dot').forEach(function(d,i){d.classList.toggle('active',i===idx);});
});
var isDragging=false,startX,scrollStart;
car.addEventListener('mousedown',function(e){isDragging=true;startX=e.pageX;scrollStart=car.scrollLeft;car.style.cursor='grabbing';});
document.addEventListener('mouseup',function(){isDragging=false;car.style.cursor='';});
document.addEventListener('mousemove',function(e){if(!isDragging)return;car.scrollLeft=scrollStart-(e.pageX-startX);});

/* ── Service tabs: Course/Website Launch vs GoHighLevel ── */
function svcTab(id, btn) {
  document.querySelectorAll('.svc-tab-btn').forEach(function(b){ b.classList.remove('active'); });
  document.querySelectorAll('.svc-panel').forEach(function(p){
    p.classList.remove('active');
    p.classList.remove('svc-panel-reveal');
  });
  document.querySelectorAll('.automate-panel').forEach(function(p){ p.classList.remove('active'); });
  btn.classList.add('active');
  var panel = document.getElementById('panel-' + id);
  if (panel) {
    panel.classList.add('active');
    if (!window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
      void panel.offsetWidth;
      panel.classList.add('svc-panel-reveal');
    }
  }
  if (id !== 'side') {
    var automate = document.getElementById('automate-' + id);
    if (automate) automate.classList.add('active');
  }
  if (window.lucide) { lucide.createIcons(); }
}

/* ── Pricing category switcher: Course & Website / GHL / Side Niche ── */
function priceTab(id, btn) {
  document.querySelectorAll('.pricing-tab-btn').forEach(function(b){ b.classList.remove('active'); });
  document.querySelectorAll('.pricing-panel').forEach(function(p){ p.classList.remove('active'); });
  btn.classList.add('active');
  var panel = document.getElementById('pricing-panel-' + id);
  if (panel) panel.classList.add('active');
}

/* ══════════════════════════════════════════
   LAUNCH ANIMATIONS
   ══════════════════════════════════════════ */

(function(){
  var reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ── Utility: reliably restart a CSS animation by class ── */
  function triggerAnim(el, cls, durationMs) {
    el.style.animation = 'none';
    void el.offsetWidth; // force reflow
    el.style.animation = '';
    el.style.animationDelay = '0ms';
    el.classList.remove(cls);
    void el.offsetWidth; // second reflow ensures clean state
    el.classList.add(cls);
  }

  /* ── Utility: animate a grid of cards together (no stagger) ── */
  function animateGrid(container, cls) {
    if (reducedMotion) return;
    container.querySelectorAll('.' + cls).forEach(function(card) {
      card.style.opacity = '0';
      card.style.animation = 'none';
      void card.offsetWidth;
      card.style.animation = 'svcCatIn .4s ease both 0ms';
    });
  }

  /* ── HERO: animate left-side elements on load ── */
  if (!reducedMotion) {
    var heroItems = [
      {sel:'.hero-badge',       delay:0},
      {sel:'#hero h1',          delay:100},
      {sel:'.hero-desc',        delay:180},
      {sel:'.hero-credibility', delay:260},
      {sel:'.hero-headline',    delay:340},
      {sel:'.hero-btns',        delay:440},
      {sel:'.hero-stats',       delay:520},
    ];
    heroItems.forEach(function(item){
      var el = document.querySelector(item.sel);
      if (!el) return;
      el.classList.add('anim-hero');
      el.style.setProperty('--d', item.delay + 'ms');
      requestAnimationFrame(function(){
        setTimeout(function(){ el.classList.add('anim-visible'); }, 50);
      });
    });

    /* ── HERO FEATURE CARDS ── */
    document.querySelectorAll('.hf-card').forEach(function(card, i){
      card.style.setProperty('--d', (580 + i * 120) + 'ms');
      setTimeout(function(){ card.classList.add('anim-visible'); }, 50);
    });

    /* ── HERO GRAPHIC CARDS: directional per position ── */
    var hdSelectors = [
      {sel:'.hd-c1',          delay:600,  anim:'fadeLeft'},
      {sel:'.hd-c2',          delay:700,  anim:'fadeRight'},
      {sel:'.hd-c3',          delay:800,  anim:'fadeLeft'},
      {sel:'.hd-c4',          delay:850,  anim:'fadeRight'},
      {sel:'.hd-c5',          delay:950,  anim:'fadeLeft'},
      {sel:'.hd-c6',          delay:1000, anim:'fadeRight'},
      {sel:'.hd-float-badge', delay:1100, anim:'fadeUpBadge'},
    ];
    hdSelectors.forEach(function(item){
      var el = document.querySelector(item.sel);
      if (!el) return;
      el.classList.add('anim-hero-graphic');
      el.style.setProperty('--d', item.delay + 'ms');
      el.dataset.animType = item.anim;
      setTimeout(function(){
        el.classList.add('anim-visible');
        el.style.animation = item.anim + ' .6s ease both ' + item.delay + 'ms';
      }, 50);
    });
  }

  /* ══ VIEWPORT OBSERVER (fires once per element) ══ */
  var observed = new Set();
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (!entry.isIntersecting) return;
      var el = entry.target;
      if (observed.has(el)) return;
      observed.add(el);
      el.classList.add('anim-visible');
      observer.unobserve(el);
    });
  }, {threshold: 0.1});

  function observeOnce(selector, delay) {
    if (reducedMotion) return;
    document.querySelectorAll(selector).forEach(function(el){
      el.classList.add('anim-once');
      el.style.setProperty('--d', (delay || 0) + 'ms');
      observer.observe(el);
    });
  }

  /* ── PORTFOLIO cards: all together ── */
  observeOnce('.wcard', 0);

  /* ── PRICING cards: ALL together, zero stagger ── */
  observeOnce('.pkg',  0);
  observeOnce('.spkg', 0);

  /* ── TESTIMONIALS: whole section fades in once ── */
  var testiSection = document.getElementById('testimonials');
  if (testiSection && !reducedMotion) {
    testiSection.classList.add('anim-once');
    testiSection.style.setProperty('--d', '0ms');
    observer.observe(testiSection);
  }

  /* ── GETTING STARTED: each step-card triggers when IT enters viewport ── */
  observeOnce('.step-card', 0);

  /* ── SERVICES: animate the active panel on first viewport entry ── */
  var svcSection = document.getElementById('services');
  if (svcSection && !reducedMotion) {
    var svcFired = false;
    var svcObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting || svcFired) return;
        svcFired = true;
        var activePanel = svcSection.querySelector('.svc-panel.active');
        if (activePanel) {
          void activePanel.offsetWidth;
          activePanel.classList.add('svc-panel-reveal');
        }
        svcObserver.disconnect();
      });
    }, {threshold: 0.15});
    svcObserver.observe(svcSection);
  }


  // About Me: image slides from right, body fades up — both on viewport entry
  if (!reducedMotion) {
    var aboutImg  = document.querySelector('.about-img-col');
    var aboutBody = document.querySelector('.about-body');
    if (aboutImg)  { aboutImg.classList.add('anim-about-img');   observer.observe(aboutImg);  }
    if (aboutBody) { aboutBody.classList.add('anim-about-body'); observer.observe(aboutBody); }
  }

})();