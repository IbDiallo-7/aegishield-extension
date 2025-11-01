// popup.js
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    chrome.sidePanel.open({ windowId: tabs[0].windowId });
  }
});