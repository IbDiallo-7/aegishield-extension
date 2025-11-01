// assets/js/services/chrome-api-service.js

/**
 * Fetches all tabs in the current window, excluding the extension's own side panel.
 * @returns {Promise<chrome.tabs.Tab[]>} A promise that resolves with an array of tab objects.
 */
export async function getCurrentWindowTabs() {
    try {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        // Filter out the extension's own UI to prevent it from being added as a source
        return tabs.filter(tab => !tab.url.startsWith('chrome-extension://'));
    } catch (error) {
        console.error("Error fetching current window tabs:", error);
        return [];
    }
}

/**
 * Fetches the currently active tab.
 * @returns {Promise<chrome.tabs.Tab|null>} A promise that resolves with the active tab object or null.
 */
export async function getActiveTab() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        return tabs[0] || null;
    } catch (error) {
        console.error("Error fetching active tab:", error);
        return null;
    }
}

// In future steps, we will add functions here to interact with chrome.ai APIs.