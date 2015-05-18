var DEBUG = false;
var LOG = function (msg) {
    if (DEBUG === true) {
        console.log(msg);
    }
};

function loadGmapScript() {
	LOG("loadGmapScript");
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp' +
        '&signed_in=true&callback=initialize';
    document.body.appendChild(script);
}

LOG("addEventListener");
//window.addEventListener("load", loadGmapScript, false);
setTimeout(loadGmapScript, 500); //TODO: ...

var geocoder,
    map,
    currentZoom,
    currentMarker,
    currentInfoWindow,
    addressToMarkerMap = {}, // address string -> {marker: Marker}
    addressObj = {}, // mark if address has already been geocoded,
    retries = 0,
    pageType = (/php\/([^\/]+)\//).exec(window.location.href)[1];

var hoodOjb = {
    "south-lake-union": {
        position: [47.6270, -122.3367],
        zoom: 14
    },
    "chucks-hop-shop": {
        position: [47.612702, -122.305753],
        zoom: 11
    },
    "downtown-seattle": {
        position: [47.6053841, -122.3355372],
        zoom: 14
    },
    "sodo": {
        position: [47.5896615, -122.3343165],
        zoom: 14
    },
    "ballard": {
        position: [47.6776213, -122.3871803],
        zoom: 13
    },
    "queen-anne": {
        position: [47.63747, -122.3578885],
        zoom: 13
    },
    "eastside": {
        position: [47.6452303, -122.1724149],
        zoom: 11
    },
    "south-end": {
        position: [47.385653, -122.205749],
        zoom: 10
    },
    "everywhere-else": {
        position: [47.614848, -122.3359058],
        zoom: 9
    }
};

var initialize = function () {
	LOG("initialize");
    geocoder = new google.maps.Geocoder();
    var hood,
        hoodData,
        mapOptions;


    try {
        hood = (/neighborhoods\/(.*)\//).exec(window.location.href)[1];
    } catch (err) {
        hood = "everywhere-else"; // if not viewing by neighborhood
    }
    hoodData = hoodOjb[hood];
    currentZoom = hoodData.zoom;

    mapOptions = {
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
        address,
        tdNotp = true;

    // some pages use tables, others use paragraphs...
    var rows = document.getElementsByClassName("entry-content")[0].getElementsByTagName("tr");
    if (pageType === "trucks") {
        rows = document.getElementsByClassName("entry-content")[0].getElementsByTagName("table")[1]
            .getElementsByTagName("tr");
    }
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
        try {
            address = getAddress(addressElement);
        } catch(err) {
        }
        if (address !== undefined && addressElement !== undefined) {
            addressElement.setAttribute("onClick", "selectMarker(event, '" + address + "')");
            if (this.addressObj[address] === undefined) {
                // don't look this address up again
                this.addressObj[address] = 1
                setMarker(addressElement, address, /*isInit*/ true);
            } else {
                LOG("already geocoded address:" + address);
            }
        }
    }
};

var getAddress = function (addressElement) {

    var addressMarkup = addressElement.innerHTML,
        rawAddress,
        result,
        city = "Seattle";

    if (addressMarkup.indexOf("strong") === -1) {
        rawAddress = /^[^,<(]*/.exec(addressMarkup)[0]; // take a look at the markup...
    } else {
        result = /<strong>(.+)<\/strong><br>(.*?[^,]*)/m.exec(addressMarkup);
        rawAddress = result[2];
        city = result[1];
    }

    return formatAddress(rawAddress, city);
};

var formatAddress = function (address, city) {
   var tmp = document.createElement("div");
   tmp.innerHTML = address;
   var text = tmp.textContent || tmp.innerText || "";
   return text.trim() + ", " + city + ", WA";
}

var setMarker = function (addressElement, address, isInit) {
    instance = this;

    geocoder.geocode({
        'address' : address
    }, function (results, status) {

        if (status == google.maps.GeocoderStatus.OK) {

            //TODO: better validation check
            if (results[0].formatted_address !== "Seattle, WA, USA") { // default invalid address
                LOG("geocoded: " + address);

                var marker = new google.maps.Marker({
                    map : map,
                    position : results[0].geometry.location
                });

                // save marker for address link clicks
                instance.addressToMarkerMap[address] = marker;

                addressElement.className = addressElement.className.replace(/\bfailInit\b/, "");

                google.maps.event.addListener(marker, 'click', function() {
                    zoomToMarker(addressElement, address);
                });

                // on Init, want to show all markers, otherwise zoom to marker
                if (!isInit) {
                    zoomToMarker(addressElement, address);
                }
            } else {
                LOG("not setting marker for invalid address: " + address);
            }
        } else {
            instance.addressObj[address] = undefined;
            var msg = "Geocode was not successful on [" + address + "] for the following reason: "
                + status;
            LOG(msg);
            setFail(addressElement, isInit);
            while(++instance.retries < 3) { //TODO: figure out how to get around quota limit
                setTimeout(setInitalMarkers, instance.retries * 7000);
            }
        }
    });
};

var getAddressData = function (addressElement) {
    var addressData = {};
    addressData.url =  "javascript:void(0);";

    if (pageType === "trucks") {
        addressData.title = addressElement.previousElementSibling.innerText.replace(":", "");
    } else {
        if (addressElement.nodeName === "P") {
            addressData.title = addressElement.getElementsByTagName("strong")[0].innerText;
        } else {
            addressData.url = addressElement.previousElementSibling.getElementsByTagName("a")[0].href;
            addressData.title = addressElement.previousElementSibling.innerText;
        }
    }

    try {
        //TODO: get list, maybe account for nested tables :( smh
        addressData.day = getClosest(addressElement, "table")
            .previousElementSibling.innerText;
    } catch(err) {
        LOG(err);
    }

    return addressData;
};

var getClosest = function (element, tagName) {
    tagName = tagName.toUpperCase();
    do {
        if (element.nodeName === tagName) {
            return element;
        }
    } while (element = element.parentNode);

    return null;
};

var zoomToMarker = function (addressElement, address){
    // clear previous marker behavior
    if (currentInfoWindow !== undefined) {
        currentInfoWindow.close();
    }
    if (currentMarker !== undefined) {
        currentMarker.setAnimation(null);
    }

    var marker = this.addressToMarkerMap[address],
        data = getAddressData(addressElement);

    //create popup with info
    var infoWindow = new google.maps.InfoWindow({
        content: getInfoWindowContent(data)
    });

    // display
    infoWindow.open(map, marker);
    marker.setAnimation(google.maps.Animation.BOUNCE);
    currentMarker = marker;
    currentInfoWindow = infoWindow;

    map.panTo(marker.position);

    if (map.getZoom() < 15) {
        map.setZoom(15);
    }

    document.getElementById("map-canvas").scrollIntoView();
};

var getInfoWindowContent = function (data) {
    return '<span class="sft_title">'
        + '<a href="' + data.url + '">'
        + data.title 
        + '</span></a><br><span class="sft_day">' + data.day
        + '</span>';
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
    var classes = element.className;

    // if geocoding for this address failed on page load only, try again
    //TODO: a state here would be better
    if (classes.indexOf("failInit") !== -1 && classes.indexOf("failTwice") === -1) {
        setMarker(element, address, /*isInit*/ false);
    } else if (classes.indexOf("failTwice") === -1) {
        // try centering and zooming to existing marker for address
        zoomToMarker(element, address);
    }
};

var getCorrectElement = function (element) {
    var returnElement;
    switch (element.tagName) {
    case "TD":
    case "P":
        returnElement = element;
        break;
    default: //strong, ...
        returnElement = element.parentNode;
        break;
    }
    return returnElement;
};
