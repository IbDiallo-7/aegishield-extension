// background.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: 'sidepanel/sidepanel.html',
    enabled: true
  });
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Listen for when side panel is opened and navigate to copilot if data exists
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sidepanel') {
    // console.log('BG: Side panel connected');
    // Check if there's pending copilot data
    chrome.storage.session.get('privacyCopilotData').then(({ privacyCopilotData }) => {
      if (privacyCopilotData) {
        // console.log('BG: Found pending copilot data, sending navigation message');
        setTimeout(() => {
          chrome.runtime.sendMessage({ type: 'NAVIGATE_TO_COPILOT' });
        }, 300);
      }
    });
  }
});

// --- Badge Management ---
// A helper to clear the action badge
async function clearActionBadge(tabId) {
    await chrome.action.setBadgeText({ tabId: tabId, text: '' });
    await chrome.action.setTitle({ tabId: tabId, title: 'Open AegiShield' });
}

// Clear the badge if the user switches to a different tab
chrome.tabs.onActivated.addListener(activeInfo => {
    clearActionBadge(activeInfo.tabId);
});


// --- Main Message Listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle messages from the content script (they will have a sender.tab)
  if (message.type === 'OPEN_PRIVACY_COPILOT' && sender.tab) {
    // console.log('BG: Received OPEN_PRIVACY_COPILOT from tab', sender.tab.id);
    
    // Use async IIFE to handle async operations
    (async () => {
      try {
        // 1. Store the text and sender tab ID in session storage
        await chrome.storage.session.set({ 
            privacyCopilotData: { text: message.text, tabId: sender.tab.id }
        });
        // console.log('BG: Data stored in session storage');
        
        // 2. Set the panel to show the privacy copilot view for this tab
        await chrome.sidePanel.setOptions({
          tabId: sender.tab.id,
          path: 'sidepanel/sidepanel.html',
          enabled: true
        });

        // 3. Show a notification badge prompting user to click
        await chrome.action.setBadgeText({ tabId: sender.tab.id, text: '!' });
        await chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: '#4A55FF' });
        await chrome.action.setTitle({ tabId: sender.tab.id, title: '🛡️ AegiShield: Click here to review detected privacy risks' });
        
        // console.log('BG: Badge updated, waiting for user to click extension icon');
        
        // 4. When panel eventually opens, send navigation message
        setTimeout(() => {
          chrome.runtime.sendMessage({ type: 'NAVIGATE_TO_COPILOT' });
        }, 500);
        
        sendResponse({ success: true });
      } catch (error) {
        // console.error('BG: Error in OPEN_PRIVACY_COPILOT handler:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // Keep message channel open for async response
  }

  // Handle messages from the side panel (they will NOT have a sender.tab)
  if (message.type === 'TEXT_SANITIZED') {
    // console.log('BG: Received TEXT_SANITIZED from side panel');
    
    (async () => {
      try {
        const { privacyCopilotData } = await chrome.storage.session.get('privacyCopilotData');
        if (privacyCopilotData && privacyCopilotData.tabId) {
          
          // Send the new text back to the correct content script
          await chrome.tabs.sendMessage(privacyCopilotData.tabId, {
            type: 'APPLY_SANITIZED_TEXT',
            text: message.text
          });

          // Clear the badge now that the action is complete
          await clearActionBadge(privacyCopilotData.tabId);
          
          // Clean up session storage
          await chrome.storage.session.remove('privacyCopilotData');
          
          sendResponse({ success: true });
        }
      } catch (error) {
        // console.error('BG: Error in TEXT_SANITIZED handler:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true;
  }

  // New message type from side panel to clear the badge on cancel
  if (message.type === 'COPILOT_CANCELED') {
      // console.log('BG: Received COPILOT_CANCELED');
      
      (async () => {
        try {
          const { privacyCopilotData } = await chrome.storage.session.get('privacyCopilotData');
          if (privacyCopilotData && privacyCopilotData.tabId) {
              await clearActionBadge(privacyCopilotData.tabId);
              await chrome.storage.session.remove('privacyCopilotData');
          }
          sendResponse({ success: true });
        } catch (error) {
          console.error('BG: Error in COPILOT_CANCELED handler:', error);
          sendResponse({ success: false, error: error.message });
        }
      })();
      
      return true;
  }
});

console.log("AegiShield background script loaded. Your privacy co-pilot is ready.");