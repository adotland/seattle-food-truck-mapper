var weekdays = new Array(7);
weekdays[0] = "Sunday";
weekdays[1] = "Monday";
weekdays[2] = "Tuesday";
weekdays[3] = "Wednesday";
weekdays[4] = "Thursday";
weekdays[5] = "Friday";
weekdays[6] = "Saturday";

var now = new Date();

var dayOfWeek = weekdays[now.getDay()];

var clearCache = function () {
	if (typeof(chrome.browsingData) !== 'undefined') {
		clearRunning = true;
		var millisecondsPerDay = 1000 * 60 * 60 * 24;
		var today = now.getTime() - millisecondsPerDay;

		chrome.browsingData.removeCache({
			"since" : today
		}, function () {
			clearRunning = false;
		});
	} else {
		alert("Your browser does not support 'chrome.browsingData.removeCache'.");
	}
};

chrome.tabs.onUpdated.addListener(function (tabId, props) {
	if (props.status === "complete")
		//clearCache(); //load issue may be correct fix
});

chrome.runtime.onInstalled.addListener(function (details){
    if(details.reason === "install"){
        chrome.tabs.create({url: "http://www.seattlefoodtruck.com/index.php/by-day/" + dayOfWeek + "/"});
    }
});
