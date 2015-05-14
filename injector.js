

  var mapCanvas = document.createElement('div')
  mapCanvas.id = 'map-canvas';
  
  var content = document.getElementsByClassName("entry-content")[0];
  content.parentNode.insertBefore(mapCanvas, content);

var js = document.createElement('script');
js.src = chrome.extension.getURL('script.js');
js.onload = function() {
    this.parentNode.removeChild(this);
};
(document.head||document.documentElement).appendChild(js);

var css = document.createElement('link');
css.href = chrome.extension.getURL('style.css');
css.onload = function() {
    this.parentNode.removeChild(this);
};
(document.head||document.documentElement).appendChild(css);