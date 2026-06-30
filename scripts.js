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
  car.scrollBy({left:dir*w,behavior:'smooth'});
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
  document.querySelectorAll('.svc-panel').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.automate-panel').forEach(function(p){ p.classList.remove('active'); });
  btn.classList.add('active');
  var panel = document.getElementById('panel-' + id);
  if (panel) panel.classList.add('active');
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
