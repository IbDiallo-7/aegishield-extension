// assets/js/components/SettingsView.js
import { navigate } from '../router.js';

const SettingsView = () => {
    let state = {
        domainMode: 'all', // 'all' or 'custom'
        allowedDomains: [],
        newDomain: '',
        customPatterns: [],
        newPattern: {
            name: '',
            pattern: '',
            patternType: 'simple', // 'simple', 'multiple', or 'advanced'
            severity: 'medium'
        },
        editingPattern: null
    };

    return {
        render: async () => {
            // Load settings from storage
            const settings = await chrome.storage.local.get(['aegishield_domain_mode', 'aegishield_allowed_domains', 'aegishield_custom_patterns']);
            state.domainMode = settings.aegishield_domain_mode || 'all';
            state.allowedDomains = settings.aegishield_allowed_domains || [];
            state.customPatterns = settings.aegishield_custom_patterns || [];

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
                                    <h1 class="text-lg font-semibold text-text-primary">Settings</h1>
                                    <p class="text-xs text-text-secondary">Configure AegiShield</p>
                                </div>
                            </div>
                            <button id="theme-switcher" class="p-2 text-text-secondary hover:text-text-primary rounded-md transition-colors">
                                <i class="fas fa-sun"></i>
                            </button>
                        </div>
                    </header>

                    <!-- Main Content -->
                    <main class="flex-1 overflow-y-auto p-6">
                        <div class="max-w-2xl mx-auto space-y-6">
                            
                            <!-- Domain Settings Card -->
                            <div class="bg-secondary-surface rounded-xl border border-border-structure p-6">
                                <div class="flex items-start space-x-3 mb-6">
                                    <div class="w-10 h-10 rounded-lg bg-cogni-blue/20 flex items-center justify-center flex-shrink-0">
                                        <i class="fas fa-globe text-cogni-blue"></i>
                                    </div>
                                    <div class="flex-1">
                                        <h2 class="text-base font-semibold text-text-primary mb-1">Active Domains</h2>
                                        <p class="text-sm text-text-secondary leading-relaxed">
                                            Choose which websites show the AegiShield privacy button
                                        </p>
                                    </div>
                                </div>

                                <!-- Domain Mode Selection -->
                                <div class="space-y-3 mb-6">
                                    <label class="flex items-center space-x-3 p-4 rounded-lg border border-border-structure cursor-pointer transition-all hover:border-cogni-blue ${state.domainMode === 'all' ? 'bg-cogni-blue/10 border-cogni-blue' : 'bg-surface'}">
                                        <input type="radio" name="domain-mode" value="all" ${state.domainMode === 'all' ? 'checked' : ''} class="w-5 h-5 text-cogni-blue accent-color-cogni-blue cursor-pointer">
                                        <div class="flex-1">
                                            <div class="font-medium text-text-primary text-sm">All Websites</div>
                                            <div class="text-xs text-text-secondary mt-0.5">Shield appears on every website you visit</div>
                                        </div>
                                        <i class="fas fa-check text-cogni-blue ${state.domainMode === 'all' ? '' : 'opacity-0'}"></i>
                                    </label>

                                    <label class="flex items-center space-x-3 p-4 rounded-lg border border-border-structure cursor-pointer transition-all hover:border-cogni-blue ${state.domainMode === 'custom' ? 'bg-cogni-blue/10 border-cogni-blue' : 'bg-surface'}">
                                        <input type="radio" name="domain-mode" value="custom" ${state.domainMode === 'custom' ? 'checked' : ''} class="w-5 h-5 text-cogni-blue accent-color-cogni-blue cursor-pointer">
                                        <div class="flex-1">
                                            <div class="font-medium text-text-primary text-sm">Custom Domains Only</div>
                                            <div class="text-xs text-text-secondary mt-0.5">Shield only appears on domains you specify</div>
                                        </div>
                                        <i class="fas fa-check text-cogni-blue ${state.domainMode === 'custom' ? '' : 'opacity-0'}"></i>
                                    </label>
                                </div>

                                <!-- Custom Domains List (shown when custom mode is selected) -->
                                <div id="custom-domains-section" class="${state.domainMode === 'custom' ? '' : 'hidden'}">
                                    <div class="border-t border-border-structure pt-6">
                                        <h3 class="text-sm font-medium text-text-primary mb-3">Allowed Domains</h3>
                                        
                                        <!-- Add Domain Input -->
                                        <div class="flex gap-2 mb-4">
                                            <input 
                                                type="text" 
                                                id="new-domain-input"
                                                class="input-field flex-1 text-sm"
                                                placeholder="example.com"
                                                value="${state.newDomain}"
                                            >
                                            <button id="add-domain-btn" class="px-4 py-2 rounded-md bg-cogni-blue text-white hover:bg-blue-600 transition-colors text-sm font-medium whitespace-nowrap">
                                                <i class="fas fa-plus mr-1"></i> Add
                                            </button>
                                        </div>

                                        <!-- Domain List -->
                                        <div class="space-y-2" id="domains-list">
                                            ${state.allowedDomains.length === 0 ? `
                                                <div class="text-center py-8 text-sm text-text-secondary">
                                                    <i class="fas fa-globe text-3xl mb-3 opacity-30"></i>
                                                    <p>No domains added yet</p>
                                                    <p class="text-xs mt-1">Add domains where you want the shield to appear</p>
                                                </div>
                                            ` : state.allowedDomains.map((domain, idx) => `
                                                <div class="flex items-center justify-between p-3 bg-surface rounded-lg border border-border-structure">
                                                    <div class="flex items-center space-x-3">
                                                        <i class="fas fa-globe text-text-secondary"></i>
                                                        <span class="text-sm text-text-primary font-mono">${domain}</span>
                                                    </div>
                                                    <button class="remove-domain-btn p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" data-domain="${domain}">
                                                        <i class="fas fa-trash text-sm"></i>
                                                    </button>
                                                </div>
                                            `).join('')}
                                        </div>

                                        <div class="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                            <div class="flex items-start space-x-2">
                                                <i class="fas fa-info-circle text-blue-400 text-sm mt-0.5"></i>
                                                <div class="text-xs text-text-secondary">
                                                    <strong class="text-blue-400">Tip:</strong> Enter just the domain name (e.g., "gmail.com", "reddit.com"). Subdomains are automatically included.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Custom Detection Patterns Card -->
                            <div class="bg-secondary-surface rounded-xl border border-border-structure p-6">
                                <div class="flex items-start space-x-3 mb-4">
                                    <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                        <i class="fas fa-search-plus text-purple-400"></i>
                                    </div>
                                    <div class="flex-1">
                                        <h2 class="text-base font-semibold text-text-primary mb-1">Custom Detection Patterns</h2>
                                        <p class="text-sm text-text-secondary">
                                            Detect company-specific terms like project names or internal IDs
                                        </p>
                                    </div>
                                </div>

                                <!-- Add/Edit Pattern Form -->
                                <div class="p-4 bg-surface rounded-lg border border-border-structure mb-4">
                                    <h3 class="text-sm font-medium text-text-primary mb-3">
                                        ${state.editingPattern !== null ? '<i class="fas fa-edit mr-2 text-purple-400"></i>Edit Pattern' : '<i class="fas fa-plus mr-2 text-purple-400"></i>Add New Pattern'}
                                    </h3>
                                    
                                    <div class="space-y-3">
                                        <div>
                                            <label class="block text-xs font-medium text-text-secondary mb-1.5">Pattern Name</label>
                                            <input 
                                                type="text" 
                                                id="pattern-name-input"
                                                class="input-field w-full text-sm"
                                                placeholder="e.g., Project Codename"
                                                value="${state.newPattern.name}"
                                            >
                                        </div>

                                        <div>
                                            <label class="block text-xs font-medium text-text-secondary mb-1.5">Pattern Type</label>
                                            <div class="flex gap-2 mb-3">
                                                <label class="flex-1 cursor-pointer" data-pattern-type="simple">
                                                    <input type="radio" name="pattern-type" value="simple" ${state.newPattern.patternType === 'simple' ? 'checked' : ''} class="hidden">
                                                    <div class="p-2 rounded-lg border-2 ${state.newPattern.patternType === 'simple' ? 'border-purple-400 bg-purple-500/10' : 'border-border-structure'} text-center transition-all hover:border-purple-400/50">
                                                        <div class="text-xs font-medium text-text-primary">Simple Term</div>
                                                        <div class="text-[10px] text-text-secondary mt-0.5">Single word/phrase</div>
                                                    </div>
                                                </label>
                                                <label class="flex-1 cursor-pointer" data-pattern-type="multiple">
                                                    <input type="radio" name="pattern-type" value="multiple" ${state.newPattern.patternType === 'multiple' ? 'checked' : ''} class="hidden">
                                                    <div class="p-2 rounded-lg border-2 ${state.newPattern.patternType === 'multiple' ? 'border-purple-400 bg-purple-500/10' : 'border-border-structure'} text-center transition-all hover:border-purple-400/50">
                                                        <div class="text-xs font-medium text-text-primary">Multiple Terms</div>
                                                        <div class="text-[10px] text-text-secondary mt-0.5">Several words/phrases</div>
                                                    </div>
                                                </label>
                                                <label class="flex-1 cursor-pointer" data-pattern-type="advanced">
                                                    <input type="radio" name="pattern-type" value="advanced" ${state.newPattern.patternType === 'advanced' ? 'checked' : ''} class="hidden">
                                                    <div class="p-2 rounded-lg border-2 ${state.newPattern.patternType === 'advanced' ? 'border-purple-400 bg-purple-500/10' : 'border-border-structure'} text-center transition-all hover:border-purple-400/50">
                                                        <div class="text-xs font-medium text-text-primary">Advanced</div>
                                                        <div class="text-[10px] text-text-secondary mt-0.5">Custom regex</div>
                                                    </div>
                                                </label>
                                            </div>

                                            <label class="block text-xs font-medium text-text-secondary mb-1.5">
                                                ${state.newPattern.patternType === 'simple' ? 'Term or Phrase' : 
                                                  state.newPattern.patternType === 'multiple' ? 'Terms (comma-separated)' : 
                                                  'Regex Pattern'}
                                            </label>
                                            <input 
                                                type="text" 
                                                id="pattern-input"
                                                class="input-field w-full text-sm ${state.newPattern.patternType === 'advanced' ? 'font-mono' : ''}"
                                                placeholder="${state.newPattern.patternType === 'simple' ? 'ProjectPhoenix' : 
                                                             state.newPattern.patternType === 'multiple' ? 'ProjectPhoenix, SecretLab, ACME-2024' : 
                                                             'PROJECT-\\d{4}'}"
                                                value="${state.newPattern.pattern}"
                                            >
                                        </div>

                                        <div>
                                            <label class="block text-xs font-medium text-text-secondary mb-1.5">Severity Level</label>
                                            <div class="flex gap-2">
                                                <label class="flex-1 cursor-pointer" data-severity="low">
                                                    <input type="radio" name="pattern-severity" value="low" ${state.newPattern.severity === 'low' ? 'checked' : ''} class="hidden">
                                                    <div class="p-3 rounded-lg border-2 ${state.newPattern.severity === 'low' ? 'border-blue-400 bg-blue-500/10' : 'border-border-structure'} text-center transition-all hover:border-blue-400/50">
                                                        <i class="fas fa-info-circle text-blue-400 mb-1"></i>
                                                        <div class="text-xs font-medium text-text-primary">Low</div>
                                                    </div>
                                                </label>
                                                <label class="flex-1 cursor-pointer" data-severity="medium">
                                                    <input type="radio" name="pattern-severity" value="medium" ${state.newPattern.severity === 'medium' ? 'checked' : ''} class="hidden">
                                                    <div class="p-3 rounded-lg border-2 ${state.newPattern.severity === 'medium' ? 'border-orange-400 bg-orange-500/10' : 'border-border-structure'} text-center transition-all hover:border-orange-400/50">
                                                        <i class="fas fa-exclamation-triangle text-orange-400 mb-1"></i>
                                                        <div class="text-xs font-medium text-text-primary">Medium</div>
                                                    </div>
                                                </label>
                                                <label class="flex-1 cursor-pointer" data-severity="high">
                                                    <input type="radio" name="pattern-severity" value="high" ${state.newPattern.severity === 'high' ? 'checked' : ''} class="hidden">
                                                    <div class="p-3 rounded-lg border-2 ${state.newPattern.severity === 'high' ? 'border-red-400 bg-red-500/10' : 'border-border-structure'} text-center transition-all hover:border-red-400/50">
                                                        <i class="fas fa-exclamation-circle text-red-400 mb-1"></i>
                                                        <div class="text-xs font-medium text-text-primary">High</div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        <div class="flex gap-2">
                                            ${state.editingPattern !== null ? `
                                                <button id="cancel-pattern-btn" class="flex-1 px-4 py-2 rounded-md bg-border-structure text-text-primary hover:bg-border-structure/80 transition-colors text-sm font-medium">
                                                    <i class="fas fa-times mr-1"></i> Cancel
                                                </button>
                                            ` : ''}
                                            <button id="save-pattern-btn" class="aegis-pattern-save-btn flex-1 px-4 py-2 rounded-md bg-purple-500 hover:bg-purple-600 transition-colors text-sm font-medium">
                                                <i class="fas fa-${state.editingPattern !== null ? 'save' : 'plus'} mr-1"></i> ${state.editingPattern !== null ? 'Update' : 'Add'} Pattern
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Patterns List -->
                                <div>
                                    <h3 class="text-sm font-medium text-text-primary mb-3">
                                        ${state.customPatterns.length > 0 ? `Your Patterns (${state.customPatterns.length})` : 'Your Patterns'}
                                    </h3>
                                    <div class="space-y-2" id="patterns-list">
                                        ${state.customPatterns.length === 0 ? `
                                            <div class="text-center py-6 text-sm text-text-secondary">
                                                <i class="fas fa-search-plus text-2xl mb-2 opacity-30"></i>
                                                <p>No patterns added yet</p>
                                            </div>
                                        ` : state.customPatterns.map((pattern, idx) => `
                                            <div class="flex items-start justify-between p-4 bg-surface rounded-lg border border-border-structure hover:border-purple-400/30 transition-all">
                                                <div class="flex-1 min-w-0 mr-3">
                                                    <div class="flex items-center gap-2 mb-1">
                                                        <span class="text-sm font-medium text-text-primary">${pattern.name}</span>
                                                        <span class="px-2 py-0.5 rounded text-xs font-semibold ${
                                                            pattern.severity === 'high' ? 'bg-red-500/20 text-red-400 border border-red-400/30' :
                                                            pattern.severity === 'medium' ? 'bg-orange-500/20 text-orange-400 border border-orange-400/30' :
                                                            'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                                                        }">${pattern.severity.toUpperCase()}</span>
                                                    </div>
                                                    <div class="text-xs text-text-secondary">
                                                        ${pattern.patternType === 'advanced' ? 
                                                            `<code class="font-mono bg-surface-hover px-2 py-1 rounded break-all">${pattern.userPattern || pattern.pattern}</code>` :
                                                            `<span class="bg-surface-hover px-2 py-1 rounded">${pattern.userPattern || pattern.pattern}</span>`
                                                        }
                                                    </div>
                                                </div>
                                                <div class="flex gap-1 flex-shrink-0">
                                                    <button class="edit-pattern-btn p-2 text-text-secondary hover:text-purple-400 hover:bg-purple-500/10 rounded-md transition-colors" data-index="${idx}">
                                                        <i class="fas fa-edit text-sm"></i>
                                                    </button>
                                                    <button class="remove-pattern-btn p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" data-index="${idx}">
                                                        <i class="fas fa-trash text-sm"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>

                            <!-- About Card -->
                            <div class="bg-secondary-surface rounded-xl border border-border-structure p-6">
                                <div class="flex items-start space-x-3">
                                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-cogni-blue to-blue-600 flex items-center justify-center flex-shrink-0">
                                        <img src="../icons/aegis-shield-logo-white.svg" alt="AegiShield" class="w-6 h-6">
                                    </div>
                                    <div>
                                        <h2 class="text-base font-semibold text-text-primary mb-2">About AegiShield AI</h2>
                                        <p class="text-sm text-text-secondary leading-relaxed mb-3">
                                            Your AI-powered privacy co-pilot that prevents accidental sharing of sensitive information.
                                        </p>
                                        <div class="flex items-center space-x-4 text-xs text-text-secondary">
                                            <span>Version 1.0.0</span>
                                            <span>•</span>
                                            <span>100% Local Processing</span>
                                            <span>•</span>
                                            <span>No Data Collection</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </main>
                </div>
            `;
        },

        addEventListeners: () => {
            // Back button
            document.getElementById('back-btn')?.addEventListener('click', () => {
                navigate('#/');
            });

            // Domain mode radio buttons
            document.querySelectorAll('input[name="domain-mode"]').forEach(radio => {
                radio.addEventListener('change', async (e) => {
                    state.domainMode = e.target.value;
                    await chrome.storage.local.set({ aegishield_domain_mode: state.domainMode });
                    
                    // Show/hide custom domains section
                    const customSection = document.getElementById('custom-domains-section');
                    if (customSection) {
                        customSection.classList.toggle('hidden', state.domainMode !== 'custom');
                    }
                    
                    // Update radio button styling
                    document.querySelectorAll('input[name="domain-mode"]').forEach(r => {
                        const label = r.closest('label');
                        const check = label.querySelector('.fa-check');
                        if (r.checked) {
                            label.classList.add('bg-cogni-blue/10', 'border-cogni-blue');
                            label.classList.remove('bg-surface');
                            check.classList.remove('opacity-0');
                        } else {
                            label.classList.remove('bg-cogni-blue/10', 'border-cogni-blue');
                            label.classList.add('bg-surface');
                            check.classList.add('opacity-0');
                        }
                    });

                    // Notify content scripts to update
                    notifyContentScripts();
                });
            });

            // Add domain button
            document.getElementById('add-domain-btn')?.addEventListener('click', async () => {
                const input = document.getElementById('new-domain-input');
                const domain = input.value.trim().toLowerCase();
                
                if (!domain) return;
                
                // Validate domain format
                if (!isValidDomain(domain)) {
                    alert('Please enter a valid domain name (e.g., example.com)');
                    return;
                }
                
                // Check for duplicates
                if (state.allowedDomains.includes(domain)) {
                    alert('This domain is already in your list');
                    return;
                }
                
                // Add domain
                state.allowedDomains.push(domain);
                await chrome.storage.local.set({ aegishield_allowed_domains: state.allowedDomains });
                
                // Clear input
                input.value = '';
                state.newDomain = '';
                
                // Rerender
                await rerenderDomainsList();
                notifyContentScripts();
            });

            // Remove domain buttons
            document.querySelectorAll('.remove-domain-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const domain = btn.dataset.domain;
                    state.allowedDomains = state.allowedDomains.filter(d => d !== domain);
                    await chrome.storage.local.set({ aegishield_allowed_domains: state.allowedDomains });
                    
                    // Rerender
                    await rerenderDomainsList();
                    notifyContentScripts();
                });
            });

            // Enter key on input
            document.getElementById('new-domain-input')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('add-domain-btn')?.click();
                }
            });

            // === Custom Patterns Event Listeners ===
            
            // Pattern form inputs
            document.getElementById('pattern-name-input')?.addEventListener('input', (e) => {
                state.newPattern.name = e.target.value;
            });

            document.getElementById('pattern-input')?.addEventListener('input', (e) => {
                state.newPattern.pattern = e.target.value;
            });

            // Pattern type selection - handle label clicks
            document.querySelectorAll('label[data-pattern-type]').forEach(label => {
                label.addEventListener('click', (e) => {
                    const type = label.dataset.patternType;
                    const radio = label.querySelector('input[type="radio"]');
                    
                    // Update state
                    state.newPattern.patternType = type;
                    radio.checked = true;
                    
                    // Update pattern type visual states
                    updatePatternTypeVisualState(type);
                    
                    // Update UI dynamically without full rerender
                    updatePatternInputUI();
                });
            });
            
            // Initialize pattern type visual state on page load
            updatePatternTypeVisualState(state.newPattern.patternType);

            // Severity level selection - handle label clicks
            document.querySelectorAll('label[data-severity]').forEach(label => {
                label.addEventListener('click', (e) => {
                    const severity = label.dataset.severity;
                    const radio = label.querySelector('input[type="radio"]');
                    
                    // Update state
                    state.newPattern.severity = severity;
                    radio.checked = true;
                    
                    // Update severity visual states
                    updateSeverityVisualState(severity);
                });
            });
            
            // Initialize severity visual state on page load
            updateSeverityVisualState(state.newPattern.severity);

            // Save pattern button
            document.getElementById('save-pattern-btn')?.addEventListener('click', async () => {
                // Get current values directly from inputs as fallback
                const nameInput = document.getElementById('pattern-name-input');
                const patternInputEl = document.getElementById('pattern-input');
                
                const name = (state.newPattern.name || nameInput?.value || '').trim();
                const userPattern = (state.newPattern.pattern || patternInputEl?.value || '').trim();
                const patternType = state.newPattern.patternType;
                const severity = state.newPattern.severity;

                // console.log('Save pattern clicked:', { name, userPattern, patternType, severity });

                if (!name) {
                    alert('Please enter a pattern name');
                    return;
                }

                if (!userPattern) {
                    alert('Please enter a detection pattern');
                    return;
                }

                // Convert to regex based on pattern type
                let regexPattern;
                try {
                    regexPattern = convertToRegex(userPattern, patternType);
                    // Test the regex
                    new RegExp(regexPattern, 'gi');
                } catch (e) {
                    alert('Invalid pattern: ' + e.message);
                    return;
                }

                const newPattern = {
                    id: state.editingPattern !== null ? state.customPatterns[state.editingPattern].id : Date.now(),
                    name,
                    pattern: regexPattern,
                    userPattern: userPattern, // Store original user input
                    patternType,
                    severity,
                    enabled: true
                };

                if (state.editingPattern !== null) {
                    // Update existing pattern
                    state.customPatterns[state.editingPattern] = newPattern;
                    state.editingPattern = null;
                } else {
                    // Add new pattern
                    state.customPatterns.push(newPattern);
                }

                await chrome.storage.local.set({ aegishield_custom_patterns: state.customPatterns });

                // Reset form
                state.newPattern = { name: '', pattern: '', patternType: 'simple', severity: 'medium' };
                
                // Update form inputs
                document.getElementById('pattern-name-input').value = '';
                document.getElementById('pattern-input').value = '';
                
                // Reset visual states
                updatePatternTypeVisualState('simple');
                updateSeverityVisualState('medium');
                
                // Update pattern input UI
                updatePatternInputUI();
                
                // Update only the patterns list without full rerender
                await rerenderPatternsList();
            });

            // Cancel edit button
            document.getElementById('cancel-pattern-btn')?.addEventListener('click', async () => {
                state.editingPattern = null;
                state.newPattern = { name: '', pattern: '', patternType: 'simple', severity: 'medium' };
                
                // Update form without full rerender
                document.getElementById('pattern-name-input').value = '';
                document.getElementById('pattern-input').value = '';
                updatePatternTypeVisualState('simple');
                updateSeverityVisualState('medium');
                updatePatternInputUI();
                
                // Update form header and button
                const formHeader = document.querySelector('.p-4.bg-surface h3');
                if (formHeader) {
                    formHeader.innerHTML = '<i class="fas fa-plus mr-2 text-purple-400"></i>Add New Pattern';
                }
                
                const saveBtn = document.getElementById('save-pattern-btn');
                if (saveBtn) {
                    saveBtn.innerHTML = '<i class="fas fa-plus mr-1"></i> Add Pattern';
                }
                
                // Hide cancel button
                const cancelBtn = document.getElementById('cancel-pattern-btn');
                if (cancelBtn) {
                    cancelBtn.style.display = 'none';
                }
            });

            // Edit pattern buttons
            document.querySelectorAll('.edit-pattern-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const idx = parseInt(btn.dataset.index);
                    const pattern = state.customPatterns[idx];
                    
                    state.editingPattern = idx;
                    state.newPattern = {
                        name: pattern.name,
                        pattern: pattern.userPattern || pattern.pattern, // Use stored user input if available
                        patternType: pattern.patternType || 'advanced', // Default to advanced if not set
                        severity: pattern.severity
                    };
                    
                    // Update form without full rerender
                    document.getElementById('pattern-name-input').value = state.newPattern.name;
                    document.getElementById('pattern-input').value = state.newPattern.pattern;
                    updatePatternTypeVisualState(state.newPattern.patternType);
                    updateSeverityVisualState(state.newPattern.severity);
                    updatePatternInputUI();
                    
                    // Update form header and button
                    const formHeader = document.querySelector('.p-4.bg-surface h3');
                    if (formHeader) {
                        formHeader.innerHTML = '<i class="fas fa-edit mr-2 text-purple-400"></i>Edit Pattern';
                    }
                    
                    const saveBtn = document.getElementById('save-pattern-btn');
                    if (saveBtn) {
                        saveBtn.innerHTML = '<i class="fas fa-save mr-1"></i> Update Pattern';
                    }
                    
                    // Show cancel button if hidden
                    const cancelBtn = document.getElementById('cancel-pattern-btn');
                    if (cancelBtn) {
                        cancelBtn.style.display = '';
                    }
                    
                    // Scroll to form
                    document.getElementById('pattern-name-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            });

            // Remove pattern buttons
            document.querySelectorAll('.remove-pattern-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const idx = parseInt(btn.dataset.index);
                    const pattern = state.customPatterns[idx];
                    
                    if (confirm(`Delete pattern "${pattern.name}"?`)) {
                        state.customPatterns.splice(idx, 1);
                        await chrome.storage.local.set({ aegishield_custom_patterns: state.customPatterns });
                        
                        // If we were editing this pattern, reset
                        if (state.editingPattern === idx) {
                            state.editingPattern = null;
                            state.newPattern = { name: '', pattern: '', patternType: 'simple', severity: 'medium' };
                            
                            // Reset form
                            document.getElementById('pattern-name-input').value = '';
                            document.getElementById('pattern-input').value = '';
                            updatePatternTypeVisualState('simple');
                            updateSeverityVisualState('medium');
                            updatePatternInputUI();
                            
                            // Update form header
                            const formHeader = document.querySelector('.p-4.bg-surface h3');
                            if (formHeader) {
                                formHeader.innerHTML = '<i class="fas fa-plus mr-2 text-purple-400"></i>Add New Pattern';
                            }
                            
                            const saveBtn = document.getElementById('save-pattern-btn');
                            if (saveBtn) {
                                saveBtn.innerHTML = '<i class="fas fa-plus mr-1"></i> Add Pattern';
                            }
                        } else if (state.editingPattern !== null && state.editingPattern > idx) {
                            state.editingPattern--;
                        }
                        
                        // Update only the patterns list
                        await rerenderPatternsList();
                    }
                });
            });
        }
    };

    async function rerenderPatternsList() {
        const patternsList = document.getElementById('patterns-list');
        if (!patternsList) return;

        // Update the count in the header
        const patternsHeader = patternsList.previousElementSibling;
        if (patternsHeader && patternsHeader.tagName === 'H3') {
            patternsHeader.textContent = state.customPatterns.length > 0 ? `Your Patterns (${state.customPatterns.length})` : 'Your Patterns';
        }

        if (state.customPatterns.length === 0) {
            patternsList.innerHTML = `
                <div class="text-center py-6 text-sm text-text-secondary">
                    <i class="fas fa-search-plus text-2xl mb-2 opacity-30"></i>
                    <p>No patterns added yet</p>
                </div>
            `;
        } else {
            patternsList.innerHTML = state.customPatterns.map((pattern, idx) => `
                <div class="flex items-start justify-between p-4 bg-surface rounded-lg border border-border-structure hover:border-purple-400/30 transition-all">
                    <div class="flex-1 min-w-0 mr-3">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-sm font-medium text-text-primary">${pattern.name}</span>
                            <span class="px-2 py-0.5 rounded text-xs font-semibold ${
                                pattern.severity === 'high' ? 'bg-red-500/20 text-red-400 border border-red-400/30' :
                                pattern.severity === 'medium' ? 'bg-orange-500/20 text-orange-400 border border-orange-400/30' :
                                'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                            }">${pattern.severity.toUpperCase()}</span>
                        </div>
                        <div class="text-xs text-text-secondary">
                            ${pattern.patternType === 'advanced' ? 
                                `<code class="font-mono bg-surface-hover px-2 py-1 rounded break-all">${pattern.userPattern || pattern.pattern}</code>` :
                                `<span class="bg-surface-hover px-2 py-1 rounded">${pattern.userPattern || pattern.pattern}</span>`
                            }
                        </div>
                    </div>
                    <div class="flex gap-1 flex-shrink-0">
                        <button class="edit-pattern-btn p-2 text-text-secondary hover:text-purple-400 hover:bg-purple-500/10 rounded-md transition-colors" data-index="${idx}">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                        <button class="remove-pattern-btn p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" data-index="${idx}">
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            // Re-attach listeners for new buttons
            patternsList.querySelectorAll('.edit-pattern-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const idx = parseInt(btn.dataset.index);
                    const pattern = state.customPatterns[idx];
                    
                    state.editingPattern = idx;
                    state.newPattern = {
                        name: pattern.name,
                        pattern: pattern.userPattern || pattern.pattern,
                        patternType: pattern.patternType || 'advanced',
                        severity: pattern.severity
                    };
                    
                    // Update form
                    document.getElementById('pattern-name-input').value = state.newPattern.name;
                    document.getElementById('pattern-input').value = state.newPattern.pattern;
                    updatePatternTypeVisualState(state.newPattern.patternType);
                    updateSeverityVisualState(state.newPattern.severity);
                    updatePatternInputUI();
                    
                    // Update form header and button
                    const formHeader = document.querySelector('.p-4.bg-surface h3');
                    if (formHeader) {
                        formHeader.innerHTML = '<i class="fas fa-edit mr-2 text-purple-400"></i>Edit Pattern';
                    }
                    
                    const saveBtn = document.getElementById('save-pattern-btn');
                    if (saveBtn) {
                        saveBtn.innerHTML = '<i class="fas fa-save mr-1"></i> Update Pattern';
                    }
                    
                    // Show cancel button
                    const cancelBtn = document.getElementById('cancel-pattern-btn');
                    if (cancelBtn) {
                        cancelBtn.style.display = '';
                    }
                    
                    // Scroll to form
                    document.getElementById('pattern-name-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            });

            patternsList.querySelectorAll('.remove-pattern-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const idx = parseInt(btn.dataset.index);
                    const pattern = state.customPatterns[idx];
                    
                    if (confirm(`Delete pattern "${pattern.name}"?`)) {
                        state.customPatterns.splice(idx, 1);
                        await chrome.storage.local.set({ aegishield_custom_patterns: state.customPatterns });
                        
                        if (state.editingPattern === idx) {
                            state.editingPattern = null;
                            state.newPattern = { name: '', pattern: '', patternType: 'simple', severity: 'medium' };
                            
                            document.getElementById('pattern-name-input').value = '';
                            document.getElementById('pattern-input').value = '';
                            updatePatternTypeVisualState('simple');
                            updateSeverityVisualState('medium');
                            updatePatternInputUI();
                            
                            const formHeader = document.querySelector('.p-4.bg-surface h3');
                            if (formHeader) {
                                formHeader.innerHTML = '<i class="fas fa-plus mr-2 text-purple-400"></i>Add New Pattern';
                            }
                            
                            const saveBtn = document.getElementById('save-pattern-btn');
                            if (saveBtn) {
                                saveBtn.innerHTML = '<i class="fas fa-plus mr-1"></i> Add Pattern';
                            }
                        } else if (state.editingPattern !== null && state.editingPattern > idx) {
                            state.editingPattern--;
                        }
                        
                        await rerenderPatternsList();
                    }
                });
            });
        }
    }

    /**
     * Convert user-friendly pattern to regex
     * @param {string} userPattern - User's input pattern
     * @param {string} patternType - Type of pattern ('simple', 'multiple', or 'advanced')
     * @returns {string} Regex pattern string
     */
    function convertToRegex(userPattern, patternType) {
        if (patternType === 'advanced') {
            // Return as-is for advanced users
            return userPattern;
        }
        
        if (patternType === 'simple') {
            // Escape special regex characters
            const escaped = userPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Add word boundaries for exact term matching
            return `\\b${escaped}\\b`;
        }
        
        if (patternType === 'multiple') {
            // Split by comma, trim, escape each term, and join with OR
            const terms = userPattern
                .split(',')
                .map(term => term.trim())
                .filter(term => term.length > 0)
                .map(term => {
                    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    return `\\b${escaped}\\b`;
                });
            
            if (terms.length === 0) {
                throw new Error('No valid terms found');
            }
            
            return `(${terms.join('|')})`;
        }
        
        throw new Error('Unknown pattern type');
    }

    function updatePatternInputUI() {
        const patternInput = document.getElementById('pattern-input');
        const patternLabel = patternInput?.previousElementSibling;
        const patternHelp = patternInput?.nextElementSibling;
        
        if (!patternInput || !patternLabel || !patternHelp) return;
        
        const type = state.newPattern.patternType;
        
        // Update label
        if (type === 'simple') {
            patternLabel.textContent = 'Enter Term or Phrase';
            patternInput.placeholder = 'e.g., ProjectPhoenix or ACME-2024';
            patternInput.classList.remove('font-mono');
            patternHelp.textContent = 'Enter a single term or phrase to detect (case-insensitive, with word boundaries)';
        } else if (type === 'multiple') {
            patternLabel.textContent = 'Enter Terms (comma-separated)';
            patternInput.placeholder = 'e.g., ProjectPhoenix, SecretLab, ACME-2024';
            patternInput.classList.remove('font-mono');
            patternHelp.textContent = 'Enter multiple terms separated by commas. Each will be detected independently.';
        } else {
            patternLabel.textContent = 'Enter Regex Pattern';
            patternInput.placeholder = 'e.g., PROJECT-\\d{4}';
            patternInput.classList.add('font-mono');
            patternHelp.textContent = 'Advanced: Enter a custom regex pattern for complex matching';
        }
    }
    
    function updatePatternTypeVisualState(selectedType) {
        document.querySelectorAll('label[data-pattern-type]').forEach(l => {
            const container = l.querySelector('div');
            const type = l.dataset.patternType;
            
            // Remove ALL classes that might be from template
            container.classList.remove('border-purple-400', 'bg-purple-500/10', 'border-border-structure');
            
            // Apply inline styles
            if (type === selectedType) {
                // Selected state with purple border
                container.style.borderColor = '#A78BFA';
                container.style.backgroundColor = 'rgba(167, 139, 250, 0.1)';
            } else {
                // Unselected state
                container.style.borderColor = '';
                container.style.backgroundColor = '';
            }
        });
    }
    
    function updateSeverityVisualState(selectedSeverity) {
        document.querySelectorAll('label[data-severity]').forEach(l => {
            const container = l.querySelector('div');
            const sev = l.dataset.severity;
            
            // Remove ALL classes that might be from template
            container.classList.remove(
                'border-blue-400', 'bg-blue-500/10',
                'border-orange-400', 'bg-orange-500/10', 
                'border-red-400', 'bg-red-500/10',
                'border-border-structure'
            );
            
            // Reset inline styles
            container.style.borderColor = '';
            container.style.backgroundColor = '';
            
            // Apply selection styling
            if (sev === selectedSeverity) {
                if (sev === 'low') {
                    container.style.borderColor = '#60A5FA'; // blue-400
                    container.style.backgroundColor = 'rgba(96, 165, 250, 0.1)';
                } else if (sev === 'medium') {
                    container.style.borderColor = '#FB923C'; // orange-400
                    container.style.backgroundColor = 'rgba(251, 146, 60, 0.1)';
                } else if (sev === 'high') {
                    container.style.borderColor = '#F87171'; // red-400
                    container.style.backgroundColor = 'rgba(248, 113, 113, 0.1)';
                }
            }
        });
    }

    async function rerenderView() {
        // Get the main element and re-render
        const appRoot = document.getElementById('app-root');
        if (appRoot) {
            const settingsView = SettingsView();
            appRoot.innerHTML = await settingsView.render();
            settingsView.addEventListeners();
        }
    }

    async function rerenderDomainsList() {
        const domainsList = document.getElementById('domains-list');
        if (!domainsList) return;

        if (state.allowedDomains.length === 0) {
            domainsList.innerHTML = `
                <div class="text-center py-8 text-sm text-text-secondary">
                    <i class="fas fa-globe text-3xl mb-3 opacity-30"></i>
                    <p>No domains added yet</p>
                    <p class="text-xs mt-1">Add domains where you want the shield to appear</p>
                </div>
            `;
        } else {
            domainsList.innerHTML = state.allowedDomains.map((domain, idx) => `
                <div class="flex items-center justify-between p-3 bg-surface rounded-lg border border-border-structure">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-globe text-text-secondary"></i>
                        <span class="text-sm text-text-primary font-mono">${domain}</span>
                    </div>
                    <button class="remove-domain-btn p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" data-domain="${domain}">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            `).join('');

            // Re-attach listeners
            domainsList.querySelectorAll('.remove-domain-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const domain = btn.dataset.domain;
                    state.allowedDomains = state.allowedDomains.filter(d => d !== domain);
                    await chrome.storage.local.set({ aegishield_allowed_domains: state.allowedDomains });
                    await rerenderDomainsList();
                    notifyContentScripts();
                });
            });
        }
    }

    function isValidDomain(domain) {
        // Remove protocol if present
        domain = domain.replace(/^https?:\/\//, '');
        // Remove path if present
        domain = domain.split('/')[0];
        // Basic domain validation
        const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
        return domainRegex.test(domain);
    }

    function notifyContentScripts() {
        // Send message to all tabs to update their shield visibility
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_SHIELD_SETTINGS' }).catch(() => {
                    // Ignore errors for tabs that don't have content script
                });
            });
        });
    }
};

export default SettingsView;

