// assets/js/components/PrivacyCopilotView.js
import { navigate } from '../router.js';
import { scanText, highlightDetections, anonymizeAll, getDetectionSummary } from '../services/privacy-detector.js';

const PrivacyCopilotView = () => {
    let state = {
        originalText: '',
        currentText: '',
        detections: [],
        summary: null,
        isScanning: false,
        selectedDetectionIds: new Set()
    };

    return {
        render: async () => {
            // Fetch the text passed from the content script via session storage
            // console.log('PrivacyCopilotView: Fetching data from session storage...');
            const data = await chrome.storage.session.get('privacyCopilotData');
            // console.log('PrivacyCopilotView: Data retrieved:', data);
            
            if (data.privacyCopilotData) {
                state.originalText = data.privacyCopilotData.text;
                state.currentText = state.originalText;
                // console.log('PrivacyCopilotView: Text to analyze:', state.originalText);
                
                // Run privacy scan
                state.detections = scanText(state.originalText);
                state.summary = getDetectionSummary(state.detections);
                // console.log('PrivacyCopilotView: Detections found:', state.detections.length);
                
                // Select all high severity by default
                state.selectedDetectionIds = new Set(
                    state.detections
                        .map((d, idx) => d.severity === 'high' ? idx : null)
                        .filter(idx => idx !== null)
                );
            } else {
                // console.warn('PrivacyCopilotView: No privacyCopilotData found in session storage');
            }
            
            const highlightedText = highlightDetections(state.currentText, state.detections);
            const hasDetections = state.detections.length > 0;
            
            return `
                <div class="h-screen flex flex-col bg-surface">
                    <!-- Header -->
                    <header class="bg-secondary-surface border-b border-border-structure flex-shrink-0">
                        <div class="p-4 flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <button id="back-btn" class="p-2 text-text-secondary hover:text-text-primary hover:bg-border-structure/30 rounded-md transition-all duration-200">
                                    <i class="fas fa-arrow-left text-sm"></i>
                                </button>
                                <div>
                                    <h1 class="text-lg font-semibold text-text-primary flex items-center">
                                        <i class="fas fa-shield-alt mr-2 text-cogni-blue"></i>
                                        AegiShield
                                    </h1>
                                    <p class="text-xs text-text-secondary">Privacy Co-Pilot</p>
                                </div>
                            </div>
                            <button id="theme-switcher" class="p-2 text-text-secondary hover:text-text-primary rounded-md transition-colors">
                                <i class="fas fa-sun"></i>
                            </button>
                        </div>
                    </header>

                    <!-- Detection Summary Bar -->
                    ${hasDetections ? `
                        <div class="bg-secondary-surface border-b border-border-structure px-4 py-3 flex-shrink-0">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4">
                                    <div class="flex items-center space-x-2">
                                        <i class="fas fa-exclamation-triangle text-orange-400 text-sm"></i>
                                        <span class="text-sm font-medium text-text-primary">${state.summary.total} Issue${state.summary.total !== 1 ? 's' : ''} Found</span>
                                    </div>
                                    <div class="flex items-center space-x-3 text-xs">
                                        ${state.summary.bySeverity.high > 0 ? `
                                            <span class="flex items-center space-x-1">
                                                <span class="w-2 h-2 rounded-full bg-red-400"></span>
                                                <span class="text-text-secondary">${state.summary.bySeverity.high} High</span>
                                            </span>
                                        ` : ''}
                                        ${state.summary.bySeverity.medium > 0 ? `
                                            <span class="flex items-center space-x-1">
                                                <span class="w-2 h-2 rounded-full bg-orange-400"></span>
                                                <span class="text-text-secondary">${state.summary.bySeverity.medium} Medium</span>
                                            </span>
                                        ` : ''}
                                        ${state.summary.bySeverity.low > 0 ? `
                                            <span class="flex items-center space-x-1">
                                                <span class="w-2 h-2 rounded-full bg-blue-400"></span>
                                                <span class="text-text-secondary">${state.summary.bySeverity.low} Low</span>
                                            </span>
                                        ` : ''}
                                    </div>
                                </div>
                                <button id="select-all-btn" class="text-xs text-cogni-blue hover:underline">
                                    ${state.selectedDetectionIds.size === state.detections.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Main Content -->
                    <main class="flex-1 overflow-y-auto">
                        <div class="p-4 space-y-4">
                            <!-- Status Card -->
                            <div class="bg-secondary-surface rounded-lg border border-border-structure p-4">
                                ${hasDetections ? `
                                    <div class="flex items-start space-x-3">
                                        <div class="flex-shrink-0">
                                            <div class="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                                <i class="fas fa-shield-alt text-orange-400"></i>
                                            </div>
                                        </div>
                                        <div class="flex-1">
                                            <h2 class="text-base font-semibold text-text-primary mb-1">Sensitive Data Detected</h2>
                                            <p class="text-sm text-text-secondary leading-relaxed">
                                                We found ${state.summary.total} potential privacy ${state.summary.total !== 1 ? 'risks' : 'risk'} in your text. Review and anonymize them below before sharing.
                                            </p>
                                        </div>
                                    </div>
                                ` : `
                                    <div class="flex items-start space-x-3">
                                        <div class="flex-shrink-0">
                                            <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <i class="fas fa-check-circle text-green-400"></i>
                                            </div>
                                        </div>
                                        <div class="flex-1">
                                            <h2 class="text-base font-semibold text-text-primary mb-1">No Issues Found</h2>
                                            <p class="text-sm text-text-secondary leading-relaxed">
                                                Your text appears safe to share. No sensitive information detected.
                                            </p>
                                        </div>
                                    </div>
                                `}
                            </div>

                            <!-- Text Preview with Highlights -->
                            <div class="bg-secondary-surface rounded-lg border border-border-structure overflow-hidden">
                                <div class="border-b border-border-structure px-4 py-2 flex items-center justify-between">
                                    <h3 class="text-sm font-medium text-text-primary">Text Preview</h3>
                                    ${hasDetections ? `
                                        <span class="text-xs text-text-secondary selection-counter">${state.selectedDetectionIds.size} selected for anonymization</span>
                                    ` : ''}
                                </div>
                                <div id="text-preview" class="p-4 text-sm text-text-primary leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                                    ${highlightedText}
                                </div>
                            </div>

                            <!-- Detection List -->
                            ${hasDetections ? `
                                <div class="space-y-2">
                                    <h3 class="text-sm font-medium text-text-primary px-1">Detected Issues</h3>
                                    ${state.detections.map((detection, idx) => `
                                        <div class="detection-item bg-secondary-surface rounded-lg border border-border-structure p-3 hover:border-cogni-blue transition-colors cursor-pointer ${state.selectedDetectionIds.has(idx) ? 'selected-detection' : ''}" data-detection-id="${idx}">
                                            <div class="flex items-center justify-between">
                                                <div class="flex items-center space-x-3 flex-1">
                                                    <input type="checkbox" class="detection-checkbox" data-detection-id="${idx}" ${state.selectedDetectionIds.has(idx) ? 'checked' : ''}>
                                                    <div class="w-8 h-8 rounded-full bg-${getSeverityColor(detection.severity)}-500/20 flex items-center justify-center flex-shrink-0">
                                                        <i class="fas ${detection.icon} text-${getSeverityColor(detection.severity)}-400 text-xs"></i>
                                                    </div>
                                                    <div class="flex-1 min-w-0">
                                                        <div class="flex items-center space-x-2">
                                                            <span class="text-sm font-medium text-text-primary">${detection.label}</span>
                                                            <span class="px-2 py-0.5 rounded text-xs font-medium severity-badge-${detection.severity}">
                                                                ${detection.severity.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <p class="text-xs text-text-secondary truncate mt-0.5">${escapeHtml(detection.match)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}

                            <!-- Quick Actions -->
                            ${hasDetections ? `
                                <div class="bg-secondary-surface rounded-lg border border-border-structure p-4">
                                    <h3 class="text-sm font-medium text-text-primary mb-3">Quick Actions</h3>
                                    <div class="grid grid-cols-2 gap-2">
                                        <button id="anonymize-high-btn" class="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium">
                                            <i class="fas fa-exclamation-circle mr-1"></i>
                                            Anonymize High Risk
                                        </button>
                                        <button id="anonymize-all-btn" class="px-3 py-2 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-colors text-sm font-medium">
                                            <i class="fas fa-shield-alt mr-1"></i>
                                            Anonymize All
                                        </button>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </main>

                    <!-- Footer Actions -->
                    <footer class="px-4 py-4 bg-secondary-surface border-t border-border-structure flex-shrink-0">
                        <div class="flex space-x-2">
                            <button id="cancel-btn" class="flex-1 px-4 py-2.5 rounded-md border border-border-structure text-text-primary hover:bg-border-structure/30 transition-all font-medium">
                                <i class="fas fa-times mr-2"></i>Cancel
                            </button>
                            <button id="apply-btn" class="flex-1 px-4 py-2.5 rounded-md btn-primary">
                                <i class="fas fa-check mr-2"></i>${hasDetections ? 'Apply Changes' : 'Use Original Text'}
                            </button>
                        </div>
                    </footer>
                </div>
            `;
        },
        
        addEventListeners: () => {
            // Back/Cancel buttons
            document.getElementById('back-btn')?.addEventListener('click', handleCancel);
            document.getElementById('cancel-btn')?.addEventListener('click', handleCancel);
            
            // Apply button
            document.getElementById('apply-btn')?.addEventListener('click', handleApply);
            
            // Select all/deselect all
            document.getElementById('select-all-btn')?.addEventListener('click', () => {
                if (state.selectedDetectionIds.size === state.detections.length) {
                    state.selectedDetectionIds.clear();
                } else {
                    state.selectedDetectionIds = new Set(state.detections.map((_, idx) => idx));
                }
                rerenderView();
            });
            
            // Quick action buttons
            document.getElementById('anonymize-high-btn')?.addEventListener('click', () => {
                state.selectedDetectionIds = new Set(
                    state.detections
                        .map((d, idx) => d.severity === 'high' ? idx : null)
                        .filter(idx => idx !== null)
                );
                rerenderView();
            });
            
            document.getElementById('anonymize-all-btn')?.addEventListener('click', () => {
                state.selectedDetectionIds = new Set(state.detections.map((_, idx) => idx));
                rerenderView();
            });
            
            // Individual detection checkboxes
            document.querySelectorAll('.detection-checkbox').forEach(checkbox => {
                checkbox.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering item click
                });
                
                checkbox.addEventListener('change', (e) => {
                    const id = parseInt(e.target.dataset.detectionId);
                    if (e.target.checked) {
                        state.selectedDetectionIds.add(id);
                    } else {
                        state.selectedDetectionIds.delete(id);
                    }
                    updateSelectionUI();
                });
            });
            
            // Detection item clicks (toggle selection)
            document.querySelectorAll('.detection-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    // Don't toggle if clicking on checkbox or its label
                    if (e.target.classList.contains('detection-checkbox') || 
                        e.target.closest('input[type="checkbox"]')) {
                        return;
                    }
                    
                    const id = parseInt(item.dataset.detectionId);
                    const checkbox = item.querySelector('.detection-checkbox');
                    
                    if (state.selectedDetectionIds.has(id)) {
                        state.selectedDetectionIds.delete(id);
                        checkbox.checked = false;
                        item.classList.remove('selected-detection');
                    } else {
                        state.selectedDetectionIds.add(id);
                        checkbox.checked = true;
                        item.classList.add('selected-detection');
                    }
                    updateSelectionUI();
                });
            });
        }
    };
    
    async function handleCancel() {
        // Notify background script that copilot was canceled
        chrome.runtime.sendMessage({ type: 'COPILOT_CANCELED' });
        navigate('#/');
    }
    
    async function handleApply() {
        // Anonymize selected detections
        let finalText = state.currentText;
        if (state.selectedDetectionIds.size > 0) {
            const selectedDetections = state.detections.filter((_, idx) => 
                state.selectedDetectionIds.has(idx)
            );
            finalText = anonymizeAll(state.currentText, selectedDetections);
        }
        
        // Send the sanitized text back to the background script
        chrome.runtime.sendMessage({ type: 'TEXT_SANITIZED', text: finalText });
        
        // Navigate away
        navigate('#/');
    }
    
    function updateSelectionUI() {
        // Update visual state without full rerender
        document.querySelectorAll('.detection-item').forEach(item => {
            const id = parseInt(item.dataset.detectionId);
            const checkbox = item.querySelector('.detection-checkbox');
            if (state.selectedDetectionIds.has(id)) {
                item.classList.add('selected-detection');
                checkbox.checked = true;
            } else {
                item.classList.remove('selected-detection');
                checkbox.checked = false;
            }
        });
        
        // Update counter
        const counterEl = document.querySelector('.selection-counter');
        if (counterEl) {
            counterEl.textContent = `${state.selectedDetectionIds.size} selected for anonymization`;
        }
    }
    
    async function rerenderView() {
        const appRoot = document.getElementById('app-root');
        const component = PrivacyCopilotView();
        appRoot.innerHTML = await component.render();
        component.addEventListeners();
    }
};

function getSeverityColor(severity) {
    switch(severity) {
        case 'high': return 'red';
        case 'medium': return 'orange';
        case 'low': return 'blue';
        default: return 'gray';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export default PrivacyCopilotView;
