var c = function() {
            if (typeof(chrome.browsingData) !== 'undefined') {
                clearRunning = true;
                var millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
                var aboutAWeekAgo = (new Date()).getTime() - millisecondsPerWeek;
                
                chrome.browsingData.removeCache({
                      "since": aboutAWeekAgo
                    }, function() {
                    clearRunning = false;
                });
            } else {
                alert("Your browser does not support 'chrome.browsingData.removeCache'.");
            }
        
    };

chrome.tabs.onUpdated.addListener(function(tabId, props) {
  if (props.status == "complete")
    c();
});