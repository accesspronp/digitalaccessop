(function(){
  function hideLoader(){
    setTimeout(function(){
      document.body.classList.remove('loading');
      var loader = document.getElementById('siteLoader');
      if(loader){ loader.classList.add('hide'); setTimeout(function(){ loader.remove(); }, 350); }
    }, 300);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hideLoader);
  else hideLoader();
})();
