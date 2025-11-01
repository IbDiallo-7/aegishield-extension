// AegiShield Privacy Dialog - Injected into page
// This runs in the content script context

import { scanText, scanTextHybrid, highlightDetections, anonymizeAll, getDetectionSummary } from './services/privacy-detector.js';

class AegiShieldDialog {
    constructor(text, targetElement) {
        this.originalText = text;
        this.currentText = text;
        this.targetElement = targetElement;
        this.detections = []; // Will be populated after loading custom patterns
        this.summary = { total: 0, byType: {}, bySeverity: { high: 0, medium: 0, low: 0 } };
        this.selectedIds = new Set();
        this.dialogElement = null;
        this.aiScanComplete = false;
        this.aiEnabled = false;
        this.customPatterns = [];
        this.theme = 'dark'; // Default theme
    }
    
    async initialize() {
        // Load custom patterns and theme from storage
        try {
            const settings = await chrome.storage.local.get(['aegishield_custom_patterns', 'aegishield-theme']);
            this.customPatterns = settings.aegishield_custom_patterns || [];
            this.theme = settings['aegishield-theme'] || 'dark';
            // console.log('AegiShield Dialog: Theme loaded:', this.theme);
        } catch (error) {
            console.warn('AegiShield Dialog: Failed to load settings:', error);
        }
        
        // Initial regex scan with custom patterns
        this.detections = scanText(this.originalText, this.customPatterns);
        this.summary = getDetectionSummary(this.detections);
        
        // Auto-select high severity
        this.selectedIds = new Set(
            this.detections
                .map((d, idx) => d.severity === 'high' ? idx : null)
                .filter(idx => idx !== null)
        );
    }

    async render() {
        // console.log('AegiShield Dialog: Rendering dialog');
        // console.log('AegiShield Dialog: aiScanComplete =', this.aiScanComplete);
        console.log('AegiShield Dialog: aiEnabled =', this.aiEnabled);
        
        const hasDetections = this.detections.length > 0;
        const highlightedText = highlightDetections(this.currentText, this.detections);

        const html = `
            <div id="aegishield-dialog-backdrop" data-theme="${this.theme}">
                <div id="aegishield-dialog" data-theme="${this.theme}">
                    <div class="aegis-dialog-header">
                        <h2>
                            <span class="aegis-shield-icon">
                                <img src="${chrome.runtime.getURL('icons/aegis-shield-logo-white.svg')}" alt="" style="width: 24px; height: 24px; vertical-align: middle;">
                            </span>
                            AegiShield Privacy Check
                            ${!this.aiScanComplete ? `<span class="aegis-ai-badge scanning"><i class="fas fa-spinner fa-spin"></i> AI Scanning...</span>` : ''}
                            ${this.aiScanComplete && this.aiEnabled ? `<span class="aegis-ai-badge complete"><i class="fas fa-check-circle"></i> AI Enhanced</span>` : ''}
                        </h2>
                        <button class="aegis-close-btn" data-action="close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="aegis-dialog-content">
                        ${hasDetections ? this.renderDetections(highlightedText) : this.renderNoIssues()}
                    </div>

                    <div class="aegis-dialog-footer">
                        <button class="aegis-footer-btn cancel" data-action="cancel">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button class="aegis-footer-btn apply" data-action="apply">
                            <i class="fas fa-check"></i> ${hasDetections ? 'Apply Changes' : 'Use Original'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Create and inject
        const container = document.createElement('div');
        container.innerHTML = html;
        this.dialogElement = container.firstElementChild;
        document.body.appendChild(this.dialogElement);

        // Attach event listeners
        this.attachListeners();

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Start AI scan in background
        this.runAIScan();
    }

    renderDetections(highlightedText) {
        return `
            <div class="aegis-summary-bar">
                <div class="aegis-summary-left">
                    <i class="fas fa-exclamation-triangle" style="color: #FB923C;"></i>
                    <strong class="aegis-summary-count">${this.summary.total} Issue${this.summary.total !== 1 ? 's' : ''} Found</strong>
                    ${this.summary.bySeverity.high > 0 ? `
                        <span class="aegis-severity-badge">
                            <span class="aegis-severity-dot" style="background: #F87171;"></span>
                            ${this.summary.bySeverity.high} High
                        </span>
                    ` : ''}
                    ${this.summary.bySeverity.medium > 0 ? `
                        <span class="aegis-severity-badge">
                            <span class="aegis-severity-dot" style="background: #FB923C;"></span>
                            ${this.summary.bySeverity.medium} Medium
                        </span>
                    ` : ''}
                    ${this.summary.bySeverity.low > 0 ? `
                        <span class="aegis-severity-badge">
                            <span class="aegis-severity-dot" style="background: #60A5FA;"></span>
                            ${this.summary.bySeverity.low} Low
                        </span>
                    ` : ''}
                </div>
                <span style="font-size: 12px; color: #8A8B9E;" class="selection-counter">
                    ${this.selectedIds.size} selected
                </span>
            </div>

            <div class="aegis-section">
                <h3>Text Preview</h3>
                <div class="aegis-text-preview">${highlightedText}</div>
            </div>

            ${this.detections.length > 0 ? `
                <div class="aegis-quick-actions">
                    <button class="aegis-quick-btn high" data-action="select-high">
                        <i class="fas fa-exclamation-circle"></i> Anonymize High Risk
                    </button>
                    <button class="aegis-quick-btn all" data-action="select-all">
                        <i class="fas fa-shield-alt"></i> Anonymize All
                    </button>
                </div>

                <div class="aegis-section">
                    <h3>Detected Issues</h3>
                    ${this.detections.map((detection, idx) => this.renderDetectionItem(detection, idx)).join('')}
                </div>
            ` : ''}
        `;
    }

    renderDetectionItem(detection, idx) {
        const isSelected = this.selectedIds.has(idx);
        const severityColor = this.getSeverityColor(detection.severity);
        const isAIDetection = detection.source === 'ai';
        const isCustomDetection = detection.source === 'custom';
        
        return `
            <div class="aegis-detection-item ${isSelected ? 'selected' : ''} ${isAIDetection ? 'ai-detection' : ''} ${isCustomDetection ? 'custom-detection' : ''}" data-id="${idx}">
                <input type="checkbox" class="aegis-detection-checkbox" ${isSelected ? 'checked' : ''} data-id="${idx}">
                <div class="aegis-detection-icon" style="background: rgba(${severityColor}, 0.15);">
                    <i class="fas ${detection.icon}" style="color: rgb(${severityColor}); font-size: 14px;"></i>
                </div>
                <div class="aegis-detection-info">
                    <div class="aegis-detection-label">
                        ${detection.label}
                        ${isAIDetection ? '<span class="aegis-ai-chip"><i class="fas fa-robot"></i> AI</span>' : ''}
                        ${isCustomDetection ? '<span class="aegis-custom-chip"><i class="fas fa-user-cog"></i> Custom</span>' : ''}
                        <span class="aegis-severity-tag ${detection.severity}">${detection.severity}</span>
                    </div>
                    <div class="aegis-detection-match">${this.escapeHtml(detection.match)}</div>
                    ${isAIDetection && detection.reason ? `<div class="aegis-detection-reason">${this.escapeHtml(detection.reason)}</div>` : ''}
                </div>
            </div>
        `;
    }

    renderNoIssues() {
        // Show loading state if AI scan is still running
        if (!this.aiScanComplete) {
            return `
                <div class="aegis-no-issues">
                    <div class="aegis-no-issues-icon">
                        <i class="fas fa-spinner fa-spin" style="color: #60A5FA;"></i>
                    </div>
                    <h3>Scanning with AI...</h3>
                    <p>Running advanced privacy checks. This may take a few seconds.</p>
                </div>
            `;
        }
        
        return `
            <div class="aegis-no-issues">
                <div class="aegis-no-issues-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>No Issues Found</h3>
                <p>Your text appears safe to share. No sensitive information detected.</p>
            </div>
        `;
    }

    attachListeners() {
        // Close button and backdrop
        this.dialogElement.querySelector('[data-action="close"]').addEventListener('click', () => this.close());
        this.dialogElement.querySelector('[data-action="cancel"]').addEventListener('click', () => this.close());
        this.dialogElement.addEventListener('click', (e) => {
            if (e.target.id === 'aegishield-dialog-backdrop') this.close();
        });

        // Apply button
        this.dialogElement.querySelector('[data-action="apply"]').addEventListener('click', () => this.apply());

        // Quick actions
        const selectHighBtn = this.dialogElement.querySelector('[data-action="select-high"]');
        if (selectHighBtn) {
            selectHighBtn.addEventListener('click', () => {
                this.selectedIds = new Set(
                    this.detections
                        .map((d, idx) => d.severity === 'high' ? idx : null)
                        .filter(idx => idx !== null)
                );
                this.updateUI();
            });
        }

        const selectAllBtn = this.dialogElement.querySelector('[data-action="select-all"]');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                if (this.selectedIds.size === this.detections.length) {
                    this.selectedIds.clear();
                } else {
                    this.selectedIds = new Set(this.detections.map((_, idx) => idx));
                }
                this.updateUI();
            });
        }

        // Detection items
        this.dialogElement.querySelectorAll('.aegis-detection-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('aegis-detection-checkbox')) return;
                const id = parseInt(item.dataset.id);
                const checkbox = item.querySelector('.aegis-detection-checkbox');
                
                if (this.selectedIds.has(id)) {
                    this.selectedIds.delete(id);
                } else {
                    this.selectedIds.add(id);
                }
                this.updateUI();
            });
        });

        // Checkboxes
        this.dialogElement.querySelectorAll('.aegis-detection-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => e.stopPropagation());
            checkbox.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    this.selectedIds.add(id);
                } else {
                    this.selectedIds.delete(id);
                }
                this.updateUI();
            });
        });

        // ESC key to close
        this.escHandler = (e) => {
            if (e.key === 'Escape') this.close();
        };
        document.addEventListener('keydown', this.escHandler);
    }

    updateUI() {
        // Update checkboxes and selection state
        this.dialogElement.querySelectorAll('.aegis-detection-item').forEach(item => {
            const id = parseInt(item.dataset.id);
            const checkbox = item.querySelector('.aegis-detection-checkbox');
            
            if (this.selectedIds.has(id)) {
                item.classList.add('selected');
                checkbox.checked = true;
            } else {
                item.classList.remove('selected');
                checkbox.checked = false;
            }
        });

        // Update counter
        const counter = this.dialogElement.querySelector('.selection-counter');
        if (counter) {
            counter.textContent = `${this.selectedIds.size} selected`;
        }

        // Update "select all" button text
        const selectAllBtn = this.dialogElement.querySelector('[data-action="select-all"]');
        if (selectAllBtn) {
            const icon = this.selectedIds.size === this.detections.length ? 'fa-minus-circle' : 'fa-shield-alt';
            const text = this.selectedIds.size === this.detections.length ? 'Deselect All' : 'Anonymize All';
            selectAllBtn.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
        }
    }

    async runAIScan() {
        try {
            console.log('AegiShield Dialog: Starting hybrid AI scan...');
            console.log('AegiShield Dialog: Text length:', this.originalText.length);
            console.log('AegiShield Dialog: AI badge should be visible now');
            
            // Run hybrid scan with AI
            const result = await scanTextHybrid(this.originalText, { useAI: true });
            
            console.log('AegiShield Dialog: AI scan completed');
            console.log('AegiShield Dialog: Result:', result);
            
            this.aiScanComplete = true;
            this.aiEnabled = result.aiEnabled;
            
            // Update AI badge in header
            const header = this.dialogElement.querySelector('.aegis-dialog-header h2');
            const existingBadge = header.querySelector('.aegis-ai-badge');
            if (existingBadge) {
                existingBadge.remove();
            }
            
            if (result.aiEnabled && result.aiDetections.length > 0) {
                const badge = document.createElement('span');
                badge.className = 'aegis-ai-badge complete';
                badge.innerHTML = `<i class="fas fa-check-circle"></i> AI Enhanced (+${result.aiDetections.length})`;
                header.appendChild(badge);
                
                // Update detections with AI results
                this.detections = result.detections;
                this.summary = getDetectionSummary(this.detections);
                
                // Auto-select high-severity AI detections
                result.aiDetections.forEach((detection, idx) => {
                    const detectionIdx = this.detections.indexOf(detection);
                    if (detection.severity === 'high' && detectionIdx !== -1) {
                        this.selectedIds.add(detectionIdx);
                    }
                });
                
                // Re-render the content area
                const contentArea = this.dialogElement.querySelector('.aegis-dialog-content');
                const hasDetections = this.detections.length > 0;
                const highlightedText = highlightDetections(this.currentText, this.detections);
                contentArea.innerHTML = hasDetections ? this.renderDetections(highlightedText) : this.renderNoIssues();
                
                // Update footer button text
                const applyBtn = this.dialogElement.querySelector('[data-action="apply"]');
                if (applyBtn && hasDetections) {
                    applyBtn.innerHTML = '<i class="fas fa-check"></i> Apply Changes';
                }
                
                // Re-attach listeners for new elements
                this.attachDetectionListeners();
                
                console.log(`AegiShield: AI scan complete. Found ${result.aiDetections.length} additional PII items.`);
            } else {
                const badge = document.createElement('span');
                badge.className = 'aegis-ai-badge complete';
                badge.innerHTML = `<i class="fas fa-check-circle"></i> AI Checked`;
                header.appendChild(badge);
                
                // If we had no detections initially (showing loading), re-render to show "No Issues Found"
                if (this.detections.length === 0) {
                    const contentArea = this.dialogElement.querySelector('.aegis-dialog-content');
                    contentArea.innerHTML = this.renderNoIssues();
                }
                
                if (result.aiError) {
                    console.warn('AegiShield: AI scan completed with error:', result.aiError);
                } else {
                    console.log('AegiShield: AI scan complete. No additional PII found.');
                }
            }
            
        } catch (error) {
            console.error('AegiShield: AI scan failed:', error);
            this.aiScanComplete = true;
            
            // Update badge to show error
            const header = this.dialogElement.querySelector('.aegis-dialog-header h2');
            const existingBadge = header.querySelector('.aegis-ai-badge');
            if (existingBadge) {
                existingBadge.remove();
            }
        }
    }

    attachDetectionListeners() {
        // Quick actions
        const selectHighBtn = this.dialogElement.querySelector('[data-action="select-high"]');
        if (selectHighBtn) {
            selectHighBtn.addEventListener('click', () => {
                this.selectedIds = new Set(
                    this.detections
                        .map((d, idx) => d.severity === 'high' ? idx : null)
                        .filter(idx => idx !== null)
                );
                this.updateUI();
            });
        }

        const selectAllBtn = this.dialogElement.querySelector('[data-action="select-all"]');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                if (this.selectedIds.size === this.detections.length) {
                    this.selectedIds.clear();
                } else {
                    this.selectedIds = new Set(this.detections.map((_, idx) => idx));
                }
                this.updateUI();
            });
        }

        // Detection items
        this.dialogElement.querySelectorAll('.aegis-detection-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('aegis-detection-checkbox')) return;
                const id = parseInt(item.dataset.id);
                if (this.selectedIds.has(id)) {
                    this.selectedIds.delete(id);
                } else {
                    this.selectedIds.add(id);
                }
                this.updateUI();
            });
        });

        // Checkboxes
        this.dialogElement.querySelectorAll('.aegis-detection-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    this.selectedIds.add(id);
                } else {
                    this.selectedIds.delete(id);
                }
                this.updateUI();
            });
        });
    }

    apply() {
        let finalText = this.currentText;
        
        if (this.selectedIds.size > 0) {
            const selectedDetections = this.detections.filter((_, idx) => this.selectedIds.has(idx));
            finalText = anonymizeAll(this.currentText, selectedDetections);
        }

        // Update the target element
        if (this.targetElement) {
            if (this.targetElement.isContentEditable) {
                this.targetElement.innerText = finalText;
            } else {
                this.targetElement.value = finalText;
            }
            // Trigger input event
            this.targetElement.dispatchEvent(new Event('input', { bubbles: true }));
        }

        this.close();
    }

    close() {
        if (this.dialogElement) {
            this.dialogElement.style.opacity = '0';
            setTimeout(() => {
                this.dialogElement.remove();
                document.body.style.overflow = '';
                document.removeEventListener('keydown', this.escHandler);
            }, 200);
        }
    }

    getSeverityColor(severity) {
        switch(severity) {
            case 'high': return '248, 113, 113';
            case 'medium': return '251, 146, 60';
            case 'low': return '96, 165, 250';
            default: return '138, 139, 158';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export function for use in content script
export async function showPrivacyDialog(text, callback) {
    const dialog = new AegiShieldDialog(text, null);
    
    // Initialize (loads custom patterns and runs scan)
    await dialog.initialize();
    
    // Store callback for when user confirms or cancels
    dialog.callback = callback;
    
    // Override the apply method to use the callback
    const originalApply = dialog.apply.bind(dialog);
    dialog.apply = function() {
        let finalText = this.currentText;
        
        if (this.selectedIds.size > 0) {
            const selectedDetections = this.detections.filter((_, idx) => this.selectedIds.has(idx));
            finalText = anonymizeAll(this.currentText, selectedDetections);
        }
        
        // Call the callback with the sanitized text
        if (this.callback) {
            this.callback(finalText);
        }
        
        // Close dialog
        this.close();
    };
    
    // Override close to call callback with null
    const originalClose = dialog.close.bind(dialog);
    dialog.close = function() {
        if (this.callback && !this._callbackCalled) {
            this._callbackCalled = true;
            this.callback(null);
        }
        originalClose();
    };
    
    // Render the dialog
    dialog.render();
}

// Also export the class for backwards compatibility
window.AegiShieldDialog = AegiShieldDialog;
