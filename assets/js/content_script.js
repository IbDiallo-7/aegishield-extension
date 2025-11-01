// assets/js/content_script.js - AegiShield Privacy Protection with In-Page Dialog
// console.log("AegiShield: Privacy protection active on this page.");

let activeShieldIcon = null;
let lastFocusedElement = null;
let domainSettings = { mode: 'all', domains: [] };
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let hasCustomPosition = false;

// Load privacy detector module
const privacyDetectorModule = import(chrome.runtime.getURL('assets/js/services/privacy-detector.js'));

// Load domain settings
async function loadDomainSettings() {
    const settings = await chrome.storage.local.get(['aegishield_domain_mode', 'aegishield_allowed_domains']);
    domainSettings.mode = settings.aegishield_domain_mode || 'all';
    domainSettings.domains = settings.aegishield_allowed_domains || [];
    // console.log("AegiShield: Domain settings loaded:", domainSettings);
}

// Check if shield should be shown on current domain
function shouldShowShield() {
    if (domainSettings.mode === 'all') {
        return true;
    }
    
    // Custom mode - check if current domain is in allowed list
    const currentDomain = window.location.hostname;
    return domainSettings.domains.some(domain => {
        // Match exact domain or subdomain
        return currentDomain === domain || currentDomain.endsWith('.' + domain);
    });
}

// Initialize settings
loadDomainSettings();

// Load local Font Awesome immediately
(function() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const faLink = document.createElement('link');
        faLink.rel = 'stylesheet';
        faLink.href = chrome.runtime.getURL('assets/fontawesome/css/all.min.css');
        document.head.appendChild(faLink);
    }
})();

// Check for auto-focused fields on page load
window.addEventListener('load', () => {
    setTimeout(() => {
        const activeElement = document.activeElement;
        if (activeElement && isEditable(activeElement)) {
            lastFocusedElement = activeElement;
            showShieldIcon(activeElement);
        }
    }, 100);
});

function isEditable(element) {
    if (!element) return false;
    const tagName = element.tagName ? element.tagName.toLowerCase() : '';
    if (!tagName) return false;
    return (
        (tagName === 'textarea' || (tagName === 'input' && /^(text|email|search|tel|url|password)$/.test(element.type))) &&
        !element.disabled && !element.readOnly
    ) || element.isContentEditable;
}

function showShieldIcon(targetElement) {
    // Check if shield should be shown on this domain
    if (!shouldShowShield()) {
        // console.log("AegiShield: Shield disabled for this domain");
        return;
    }
    
    // Check if field has content
    const text = targetElement.isContentEditable ? targetElement.innerText : targetElement.value;
    if (!text || text.trim().length === 0) {
        hideShieldIcon();
        return;
    }
    
    // If shield already exists for this element, don't recreate it
    if (activeShieldIcon && lastFocusedElement === targetElement) {
        return;
    }
    
    hideShieldIcon(); // Remove any existing icon

    const shieldButton = document.createElement('button');
    shieldButton.id = 'cognispace-shield-button';
    
    // Use white variant of AegiShield logo (looks great on blue background)
    // Wrap in try-catch to handle extension context invalidation
    try {
        shieldButton.innerHTML = `<img src="${chrome.runtime.getURL('icons/aegis-shield-logo-white.svg')}" alt="AegiShield">`;
    } catch (error) {
        // console.log("AegiShield: Extension context invalidated, skipping shield icon");
        return;
    }

    shieldButton.addEventListener('click', async (e) => {
        // Only process click if not dragging
        if (isDragging) {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        // console.log("AegiShield: Shield button clicked!");
        
        const text = targetElement.isContentEditable ? targetElement.innerText : targetElement.value;
        // console.log("AegiShield: Text length:", text ? text.length : 0);
        
        if (!text || text.trim().length === 0) {
            // console.log("AegiShield: No text to analyze.");
            return;
        }
        
        // Open the dialog with the text
        await openPrivacyDialog(text, targetElement);
    });

    // Make the button draggable
    shieldButton.addEventListener('mousedown', (e) => {
        // Only start drag with left mouse button
        if (e.button !== 0) return;
        
        e.preventDefault(); // Prevent text selection and default drag behavior
        e.stopPropagation(); // Prevent event from reaching other elements
        
        isDragging = false; // Will be set to true if mouse moves
        const startX = e.clientX;
        const startY = e.clientY;
        
        const rect = shieldButton.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        
        // Disable transitions for smooth dragging
        shieldButton.style.transition = 'none';
        
        const onMouseMove = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Start dragging immediately on any movement (removed 3px threshold for smoothness)
            if (!isDragging) {
                const distanceMoved = Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY);
                if (distanceMoved > 2) {
                    isDragging = true;
                    hasCustomPosition = true;
                }
            }
            
            // Always update position if mouse is down (even before isDragging flag)
            const x = e.clientX - dragOffset.x;
            const y = e.clientY - dragOffset.y;
            
            // Keep button within viewport
            const maxX = window.innerWidth - shieldButton.offsetWidth;
            const maxY = window.innerHeight - shieldButton.offsetHeight;
            
            shieldButton.style.left = `${Math.max(0, Math.min(x, maxX)) + window.scrollX}px`;
            shieldButton.style.top = `${Math.max(0, Math.min(y, maxY)) + window.scrollY}px`;
        };
        
        const onMouseUp = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            // Re-enable transitions after dragging
            shieldButton.style.transition = '';
            
            // Reset dragging state after a short delay to prevent click from firing
            setTimeout(() => {
                isDragging = false;
            }, 100);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    document.body.appendChild(shieldButton);
    activeShieldIcon = shieldButton;
    positionShieldIcon(targetElement);
}

function positionShieldIcon(targetElement) {
    if (!activeShieldIcon) return;
    
    // Don't reposition if user has manually moved the button
    if (hasCustomPosition) return;
    
    const rect = targetElement.getBoundingClientRect();
    activeShieldIcon.style.top = `${window.scrollY + rect.top + 5}px`;
    activeShieldIcon.style.left = `${window.scrollX + rect.right - 35}px`;
}

function hideShieldIcon() {
    if (activeShieldIcon) {
        activeShieldIcon.remove();
        activeShieldIcon = null;
        hasCustomPosition = false;
    }
}

async function openPrivacyDialog(text, targetElement) {
    try {
        // console.log('AegiShield: Opening privacy dialog...');
        
        // Check if extension context is still valid
        if (!chrome.runtime?.id) {
            // console.log('AegiShield: Extension context invalidated, cannot open dialog');
            return;
        }
        
        // Hide the shield button when dialog opens
        hideShieldIcon();
        
        // Dynamically import the privacy dialog module (which includes AI support)
        const { showPrivacyDialog } = await import(chrome.runtime.getURL('assets/js/privacy-dialog.js'));
        
        // console.log('AegiShield: Privacy dialog module loaded');
        
        // Show the dialog with AI-enhanced detection
        showPrivacyDialog(text, async (sanitizedText) => {
            if (sanitizedText !== null) {
                // User confirmed - update the text
                if (targetElement.isContentEditable) {
                    targetElement.innerText = sanitizedText;
                } else {
                    targetElement.value = sanitizedText;
                }
                // Dispatch input event to notify the page
                targetElement.dispatchEvent(new Event('input', { bubbles: true }));
                // console.log('AegiShield: Text sanitized and replaced');
            } else {
                // console.log('AegiShield: Dialog canceled, no changes applied');
            }
            // Keep shield hidden after dialog closes (user can re-focus if needed)
        });
        
    } catch (error) {
        // Handle extension context invalidation gracefully
        if (error.message?.includes('Extension context invalidated')) {
            console.log('AegiShield: Extension was reloaded or updated, please refresh the page');
        } else {
            console.error("AegiShield: Error opening dialog:", error);
        }
        // Show shield again if there was an error
        if (targetElement === lastFocusedElement && targetElement === document.activeElement) {
            showShieldIcon(targetElement);
        }
    }
}

// Old showDialog function removed - now using privacy-dialog.js module with AI support

// Main listeners
document.addEventListener('focusin', (event) => {
    if (isEditable(event.target)) {
        lastFocusedElement = event.target;
        showShieldIcon(lastFocusedElement);
    }
});

document.addEventListener('focusout', (event) => {
    // Don't hide if we're interacting with the shield button
    if (event.relatedTarget === activeShieldIcon) {
        return;
    }
    
    // Hide the icon with a small delay to allow clicking/dragging on it
    setTimeout(() => {
        if (document.activeElement !== lastFocusedElement && !isDragging) {
             hideShieldIcon();
        }
    }, 200);
});

// Listen for input changes to show/hide shield based on content
document.addEventListener('input', (event) => {
    if (isEditable(event.target) && event.target === lastFocusedElement) {
        showShieldIcon(lastFocusedElement);
    }
});

// Listen for paste events to show shield
document.addEventListener('paste', (event) => {
    if (isEditable(event.target)) {
        lastFocusedElement = event.target;
        // Small delay to let paste complete before checking content
        setTimeout(() => {
            showShieldIcon(lastFocusedElement);
        }, 50);
    }
});

// Listen for settings updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'UPDATE_SHIELD_SETTINGS') {
        console.log("AegiShield: Settings updated, reloading...");
        loadDomainSettings().then(() => {
            // Hide shield if current domain is no longer allowed
            if (!shouldShowShield() && activeShieldIcon) {
                hideShieldIcon();
            }
        });
    }
});
