function tog(id,pill){
  var sec=document.getElementById('sec-'+id);
  var on=pill.classList.contains('on');
  if(on){pill.classList.remove('on');sec.classList.add('hidden');}
  else{pill.classList.add('on');sec.classList.remove('hidden');}
}
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    e.preventDefault();
    var t=document.querySelector(a.getAttribute('href'));
    if(t){window.scrollTo({top:t.getBoundingClientRect().top+window.pageYOffset-75,behavior:'smooth'});}
  });
});
