
function loadGmapScript() {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp' +
        '&signed_in=true&callback=initialize';
    document.body.appendChild(script);
}

window.addEventListener("load", loadGmapScript);

var geocoder,
    map,
    currentZoom,
    currentMarker,
    currentInfoWindow,
    addressDataObj = {}, // address string -> {marker: Marker, title: String, days: String}
    addressObj = {}; // mark if address has already been geocoded,
    retries = 0;

var hoodOjb = {
    "south-lake-union" : {
        position : [47.6270, -122.3367],
        zoom : 14
    },
    "chucks-hop-shop" : {
        position : [47.612702, -122.305753],
        zoom : 11
    },
    "downtown-seattle" : {
        position : [47.6053841, -122.3355372],
        zoom : 14
    },
    "sodo" : {
        position : [47.5896615, -122.3343165],
        zoom : 14
    },
    "ballard" : {
        position : [47.6776213, -122.3871803],
        zoom : 13
    },
    "queen-anne" : {
        position : [47.63747, -122.3578885],
        zoom : 13
    },
    "eastside" : {
        position : [47.6452303, -122.1724149],
        zoom : 11
    },
    "south-end" : {
        position : [47.385653, -122.205749],
        zoom : 10
    },
    "everywhere-else" : {
        position : [47.614848, -122.3359058],
        zoom : 9
    }
};

var initialize = function () {    
    geocoder = new google.maps.Geocoder();
    var hood;
    try {
        hood = (/neighborhoods\/(.*)\//).exec(window.location.href)[1];
    } catch(err) {
        hood = "everywhere-else"; // if not viewing by neighborhood
    }
    var hoodData = hoodOjb[hood];
    currentZoom = hoodData.zoom;

    var mapOptions = {
        zoom : currentZoom,
        center : new google.maps.LatLng(hoodData.position[0], hoodData.position[1])
    };

    map = new google.maps.Map(document.getElementById('map-canvas'),
            mapOptions);

    // draw markers and associate with address td/p element
    setInitalMarkers();
}
    
var setInitalMarkers = function () {
    var addressElements,
    tdNotp = true;

    // some pages use tables, others use paragraphs...
    var rows = document.getElementsByClassName("entry-content")[0].getElementsByTagName("tr");
    if (!rows.length) {
        tdNotp = false;
        rows = document.getElementsByClassName("entry-content")[0].getElementsByTagName("p");
    }
    for (var i = 0, length = rows.length; i < length; i++) {
        var addressElement;
        if (tdNotp) {
            addressElement = rows[i].getElementsByTagName("td")[1];
        } else {
            addressElement = rows[i];
        }
        var address = getAddress(addressElement);
        addressElement.setAttribute("onClick", "selectMarker(event, '" + address + "')");
        if (this.addressObj[address] === undefined) {
            setMarker(addressElement, address, /*isInit*/ true);
        }
    }
};

var getAddress = function (addressElement) {

    var addressMarkup = addressElement.innerHTML,
        rawAddress;

    if (addressMarkup.indexOf("strong") === -1) {
        rawAddress = /^[^,<(]*/.exec(addressMarkup)[0]; // just look at the markup...
    } else {
        rawAddress = /<br>(.*?[^,]*)/m.exec(addressMarkup)[0];
    }

    return formatAddress(rawAddress);
};

var formatAddress = function (address) {
   var tmp = document.createElement("div");
   tmp.innerHTML = address;
   var text = tmp.textContent || tmp.innerText || "";
   return text.trim() + ", Seattle, WA";
}

var setMarker = function (addressElement, address, isInit) {
    instance = this;

    geocoder.geocode({
        'address' : address
    }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            console.log("geocoding: " + address);

            var marker = new google.maps.Marker({
                map : map,
                position : results[0].geometry.location
            });

            // don't look this address up again
            instance.addressObj[address] = 1

            // save marker for address link clicks
            instance.addressDataObj[address] = getAddressData(addressElement, marker);

            addressElement.className = addressElement.className.replace(/\bfailInit\b/, "");

            google.maps.event.addListener(marker, 'click', function() {
                zoomToMarker(address);
            });

            // on Init, want to show all markers, otherwise zoom to marker
            if (!isInit) {
                zoomToMarker(address);
            }
        } else {
            console.log("Geocode was not successful on [" + address + "] for the following reason: " + status);
            setFail(addressElement, isInit);
            while(++instance.retries < 3) { //TODO: figure out how to get around quota limit
                setTimeout(setInitalMarkers, instance.retries * 7000);
            }
        }
    });
};

var getAddressData = function (addressElement, marker) {
    var addressData = {};
    addressData.marker = marker;
    addressData.title = addressElement.previousElementSibling.innerText;
    
    try {
        addressData.day = getClosest(addressElement, "table").previousElementSibling.innerText; //TODO: get list, maybe account for nested tables :( smh
    } catch(err) {
        console.log(err);
    }

    return addressData;
};

function getClosest(el, tag) {
  tag = tag.toUpperCase();
  do {
    if (el.nodeName === tag) {
      return el;
    }
  } while (el = el.parentNode);

  return null;
}
var zoomToMarker = function (address){
    // clear previous marker behavior
    if (this.currentInfoWindow !== undefined) {
        this.currentInfoWindow.close();
    }
    if (this.currentMarker !== undefined) {
        this.currentMarker.setAnimation(null);
    }
    var marker = this.addressDataObj[address].marker;
    
    //create popup with info
    var infoWindow = new google.maps.InfoWindow({
        content: getInfoWindowContent(address)
    });
    // display
    infoWindow.open(map, marker);
    marker.setAnimation(google.maps.Animation.BOUNCE);
    this.currentMarker = marker;
    this.currentInfoWindow = infoWindow;

    map.setCenter(marker.position);
    map.setZoom(15);
    document.getElementById("map-canvas").scrollIntoView();
};

var getInfoWindowContent = function (address) {
    return '<span class="sft_title">' + this.addressDataObj[address].title + 
        '</span><br><span class="sft_day">' + this.addressDataObj[address].day + 
        '</span>';
};

var setFail = function (addressElement, isInit) {
    var parent = addressElement.parentNode,
    classes = parent.className,
    failName = "fail" + (isInit ? "Init" : "Twice");
    if (classes.indexOf(failName) === -1) {
        addressElement.className += failName;
    }
};

var selectMarker = function (event, address) {
    var element = getCorrectElement(event.target);
    var classes = event.target.className;

    // if geocoding for this address failed on page load only, try again
    if (classes.indexOf("failInit") !== -1 && classes.indexOf("failTwice") === -1) { //TODO: a state here would be better
        setMarker(event.target, address, /*isInit*/ false);
    } else if (classes.indexOf("failTwice") === -1) {
        // try centering and zooming to existing marker for address
        zoomToMarker(address);
    }
};

var getCorrectElement = function (element) {
    var returnElement;
    switch (element.tagName) {
    case "td", "P":
        returnElement = element;
        break;
    default: //strong, ...
        returnElement = element.parentNode;
        break;
    }
    return returnElement;
};
