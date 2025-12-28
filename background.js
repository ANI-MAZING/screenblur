// Clean up storage when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove([`blurActive_${tabId}`]);
});

// Clean up storage when tabs are navigated
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    chrome.storage.local.remove([`blurActive_${tabId}`]);
  }
});