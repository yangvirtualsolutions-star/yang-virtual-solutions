
/* ── Niche toggle ── */
function tog(id,pill){
  var sec=document.getElementById('sec-'+id);
  var on=pill.classList.contains('on');
  if(on){pill.classList.remove('on');sec.classList.add('hidden');}
  else{pill.classList.add('on');sec.classList.remove('hidden');}
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
async function loadPhoto(){
  var names=['Image 1.jpeg','Image 1.jpg','Image1.jpg','image1.jpg','image_1.jpg','yang.jpg','yang_montesa.jpg','photo.jpg','headshot.jpg','profile.jpg'];
  for(var n of names){
    try{
      var data=await window.fs.readFile(n);
      var bytes=new Uint8Array(data);
      var binary='';
      for(var i=0;i<bytes.length;i++){binary+=String.fromCharCode(bytes[i]);}
      var b64=btoa(binary);
      var src='data:image/jpeg;base64,'+b64;
      // About section photo
      var ap=document.getElementById('aboutPhoto');
      if(ap){ap.src=src;ap.style.display='block';document.getElementById('aboutPlaceholder').style.display='none';}
      // Hero graphic avatar
      var hg=document.getElementById('hgPhoto');
      if(hg){hg.src=src;hg.style.display='block';document.getElementById('hgInitials').style.display='none';}
      return;
    }catch(e){}
  }
}
loadPhoto();

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

/* ══ EXPORT ZIP — globally declared on window ══ */
window.exportZip = function exportZip() {
  var btn = document.getElementById('exportZipBtn');
  if (btn) { btn.textContent = '⏳ Preparing…'; btn.disabled = true; }

  /* ── 1. Grab the full HTML of the current page ── */
  var rawHTML = document.documentElement.outerHTML;

  /* ── 2. Extract all <style> blocks → styles.css ── */
  var cssBlocks = [];
  var styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  var match;
  while ((match = styleRe.exec(rawHTML)) !== null) {
    cssBlocks.push(match[1]);
  }
  var cssContent = cssBlocks.join('\n\n');

  /* ── 3. Extract all inline <script> blocks → scripts.js ── */
  var jsBlocks = [];
  var scriptRe = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = scriptRe.exec(rawHTML)) !== null) {
    var code = match[1].trim();
    if (code) jsBlocks.push(code);
  }
  var jsContent = jsBlocks.join('\n\n');

  /* ── 4. Build a clean index.html that links the extracted files ── */
  var cleanHTML = rawHTML
    /* remove all style blocks */
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    /* remove all inline script blocks */
    .replace(/<script(?![^>]*src)[^>]*>[\s\S]*?<\/script>/gi, '')
    /* inject stylesheet link right before </head> */
    .replace('</head>', '  <link rel="stylesheet" href="styles.css">\n</head>')
    /* inject script tag right before </body> */
    .replace('</body>', '  <script src="scripts.js"><\/script>\n</body>');

  /* ── 5. Pack into ZIP via JSZip ── */
  var zip = new JSZip();
  zip.file('index.html', cleanHTML);
  zip.file('styles.css', cssContent);
  zip.file('scripts.js', jsContent);

  zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
    .then(function(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'yang-virtual-solutions-portfolio.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() { URL.revokeObjectURL(url); }, 5000);

      if (btn) {
        btn.innerHTML = '✅ Downloaded!';
        btn.disabled = false;
        setTimeout(function() {
          btn.innerHTML = '<span style="font-size:1rem">⬇</span> Download ZIP';
        }, 2500);
      }
    })
    .catch(function(err) {
      console.error('ZIP export failed:', err);
      if (btn) { btn.textContent = '⚠ Error — try again'; btn.disabled = false; }
    });
};
