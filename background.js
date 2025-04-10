// background.js
function filterHistoryItems(results, keywords) {
    return results.filter(item => {
        const url = (item.url || '').toLowerCase();
        const title = (item.title || '').toLowerCase();
        return keywords.some(k => url.includes(k) || title.includes(k));
    });
}

function getAllHistoryWithPagination(startTime = 0, allResults = [], callback) {
    chrome.history.search({
        text: '',
        startTime: startTime,
        maxResults: 10000
    }, function(results) {
        if (chrome.runtime.lastError) {
            console.error('History search error:', chrome.runtime.lastError.message);
            callback(allResults);
            return;
        }
        allResults = allResults.concat(results);
        results.length === 10000 ? 
            getAllHistoryWithPagination(results[results.length - 1].lastVisitTime, allResults, callback) :
            callback(allResults);
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'searchHistory') {
        const rawKeywords = message.keyword || '';
        const keywords = [...new Set(rawKeywords.toLowerCase().split(/\s+/).filter(k => k))];
        
        getAllHistoryWithPagination(0, [], allHistory => {
            sendResponse(filterHistoryItems(allHistory, keywords));
        });
        return true;
    }
    
    if (message.action === 'deleteHistory') {
        const rawKeywords = message.keyword || '';
        const keywords = [...new Set(rawKeywords.toLowerCase().split(/\s+/).filter(k => k))];
        
        getAllHistoryWithPagination(0, [], allHistory => {
            filterHistoryItems(allHistory, keywords).forEach(item => {
                chrome.history.deleteUrl({ url: item.url });
            });
        });
    }
});
