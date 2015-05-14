var geocoder;
var map;
var currentZoom;

var hoodDb = {
    "south-lake-union": {position: [47.6270, -122.3367], zoom: 14},
    "chucks-hop-shop": {position: [47.612702,-122.305753], zoom: 14},
    "downtown-seattle": {position: [47.6053841,-122.3355372], zoom: 14},
    "sodo": {position: [47.5896615,-122.3343165], zoom: 14},
    "ballard": {position: [47.6776213,-122.3871803], zoom: 13},
    "queen-anne": {position: [47.63747,-122.3578885], zoom: 13},
    "eastside": {position: [47.6452303,-122.1724149], zoom: 11},
    "south-end": {position: [47.385653,-122.205749], zoom: 10},
    "everywhere-else": {position: [47.614848,-122.3359058], zoom: 8}
};

var markersDb = {};

function initialize() {
  geocoder = new google.maps.Geocoder();
  var hood = (/neighborhoods\/(.*)\//).exec(window.location.href)[1];
  var hoodData = hoodDb[hood];
  currentZoom = hoodData.zoom;
  
  var mapOptions = {
    zoom: currentZoom,
    center: new google.maps.LatLng(hoodData.position[0], hoodData.position[1])
  };

  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);
      
      
}

function loadScript() {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp' +
      '&signed_in=true&callback=initialize';
  document.body.appendChild(script);
}

window.onload = loadScript;




var rows = document.getElementsByClassName("entry-content")[0].getElementsByTagName("tr");
var addressElements = document.getElementsByClassName("entry-content")[0].getElementsByTagName("tr")[0].getElementsByTagName("td");
for (var i = 0, length = rows.length; i < length; i++) {
    var addressElement = rows[i].getElementsByTagName("td")[1];
    addressElement.onclick = markAddress;
}

function markAddress() {
    var addressMarkup = this.innerHTML;
    var address;
    if (addressMarkup.indexOf("strong") !== 0) {
        address = (/(.+?)(,|<br>)/).exec(addressMarkup)[1];
    } else {
        address = (/<br>(.+?),/).exec(this.innerHTML)[1];
    }
    
    address = address + ", Seattle, WA";
    
    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
        map.setZoom(16);
        var marker = new google.maps.Marker({
            map: map,
            position: results[0].geometry.location
        });
      } else {
        alert("Geocode was not successful for the following reason: " + status);
      }
    });
    document.getElementById("map-canvas").scrollIntoView();
  }