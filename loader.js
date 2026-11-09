(function(){
  function hideLoader(){
    window.setTimeout(function(){
      document.body.classList.remove('loading');
      var loader=document.getElementById('siteLoader');
      if(loader){loader.classList.add('hide');window.setTimeout(function(){loader.remove();},320);}
    },800);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hideLoader,{once:true});
  else hideLoader();
})();
