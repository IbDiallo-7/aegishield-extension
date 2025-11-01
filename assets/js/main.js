// assets/js/main.js - AegiShield main application entry point
import { registerRoute, handleRouting, navigate } from './router.js';
import WelcomeView from './components/WelcomeView.js';
import PrivacyCopilotView from './components/PrivacyCopilotView.js';
import SettingsView from './components/SettingsView.js';

// --- THEME SWITCHER LOGIC ---
const THEME_KEY = 'aegishield-theme';
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const switcherIcon = document.querySelector('#theme-switcher i');
    if (switcherIcon) switcherIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}
async function initializeTheme() {
    const { [THEME_KEY]: savedTheme } = await chrome.storage.local.get(THEME_KEY);
    applyTheme(savedTheme || 'dark');
}
function toggleTheme() {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    chrome.storage.local.set({ [THEME_KEY]: newTheme });
}
// --- END THEME SWITCHER LOGIC ---

async function main() {
    // console.log("AegiShield Privacy Co-Pilot Initializing...");
    await initializeTheme();

    // Register routes - focused on privacy functionality
    registerRoute('#/', WelcomeView); 
    registerRoute('#/privacy-copilot', PrivacyCopilotView);
    registerRoute('#/settings', SettingsView);

    handleRouting(); // Initial render

    // Global event listeners
    document.body.addEventListener('click', (event) => {
        if (event.target.closest('#theme-switcher')) {
            toggleTheme();
        }
    });

    // Listen for messages from the background script to trigger navigation
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // console.log("AegiShield main.js: Received message:", message);
        if (message.type === 'NAVIGATE_TO_COPILOT') {
            // console.log("AegiShield: Navigating to privacy co-pilot view.");
            navigate('#/privacy-copilot');
            sendResponse({ success: true });
        }
        return true; // Keep channel open for async response
    });
}

document.addEventListener('DOMContentLoaded', main);