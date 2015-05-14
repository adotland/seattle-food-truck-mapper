var clearCache = function () {
	if (typeof(chrome.browsingData) !== 'undefined') {
		clearRunning = true;
		var millisecondsPerDay = 1000 * 60 * 60 * 24;
		var today = (new Date()).getTime() - millisecondsPerDay;

		chrome.browsingData.removeCache({
			"since" : aboutAWeekAgo
		}, function () {
			clearRunning = false;
		});
	} else {
		alert("Your browser does not support 'chrome.browsingData.removeCache'.");
	}

};

chrome.tabs.onUpdated.addListener(function (tabId, props) {
	if (props.status == "complete")
		clearCache();
});