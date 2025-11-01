// assets/js/components/WelcomeView.js
// Welcome/Home view for AegiShield

const WelcomeView = () => {
    return {
        render: async () => {
            return `
                <div class="h-screen flex flex-col bg-surface">
                    <!-- Header -->
                    <header class="bg-secondary-surface border-b border-border-structure flex-shrink-0">
                        <div class="p-4 flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 flex items-center justify-center">
                                    <img src="../icons/aegis-shield-logo.svg" alt="AegiShield" class="w-10 h-10">
                                </div>
                                <div>
                                    <h1 class="text-lg font-semibold text-text-primary">AegiShield AI</h1>
                                    <p class="text-xs text-text-secondary">Privacy Co-Pilot</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button id="settings-btn" class="p-2 text-text-secondary hover:text-text-primary rounded-md transition-colors" title="Settings">
                                    <i class="fas fa-cog"></i>
                                </button>
                                <button id="theme-switcher" class="p-2 text-text-secondary hover:text-text-primary rounded-md transition-colors">
                                    <i class="fas fa-sun"></i>
                                </button>
                            </div>
                        </div>
                    </header>

                    <!-- Main Content -->
                    <main class="flex-1 overflow-y-auto p-6">
                        <div class="max-w-2xl mx-auto space-y-6">
                            <!-- Hero Section -->
                            <div class="text-center py-8">
                                <div class="w-20 h-20 flex items-center justify-center mx-auto mb-6">
                                    <img src="../icons/aegis-shield-logo.svg" alt="AegiShield" class="w-20 h-20 drop-shadow-2xl">
                                </div>
                                <h2 class="text-2xl font-bold text-text-primary mb-3">
                                    Your Privacy Guardian
                                </h2>
                                <p class="text-text-secondary leading-relaxed max-w-md mx-auto">
                                    AegiShield prevents accidental sharing of sensitive information by detecting and anonymizing PII, credentials, and other private data before you post.
                                </p>
                            </div>

                            <!-- How It Works -->
                            <div class="bg-secondary-surface rounded-xl border border-border-structure p-6">
                                <h3 class="text-lg font-semibold text-text-primary mb-4 flex items-center">
                                    <i class="fas fa-magic mr-2 text-cogni-blue"></i>
                                    How It Works
                                </h3>
                                <div class="space-y-4">
                                    <div class="flex items-start space-x-4">
                                        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-cogni-blue/20 flex items-center justify-center">
                                            <span class="text-sm font-semibold text-cogni-blue">1</span>
                                        </div>
                                        <div class="flex-1">
                                            <h4 class="text-sm font-medium text-text-primary mb-1">Type Anywhere</h4>
                                            <p class="text-sm text-text-secondary leading-relaxed">
                                                Start typing in any text field. AegiShield's shield icon will appear automatically.
                                            </p>
                                        </div>
                                    </div>
                                    <div class="flex items-start space-x-4">
                                        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-cogni-blue/20 flex items-center justify-center">
                                            <span class="text-sm font-semibold text-cogni-blue">2</span>
                                        </div>
                                        <div class="flex-1">
                                            <h4 class="text-sm font-medium text-text-primary mb-1">Click to Scan</h4>
                                            <p class="text-sm text-text-secondary leading-relaxed">
                                                Click the shield to scan your text for sensitive information like emails, phone numbers, API keys, and more.
                                            </p>
                                        </div>
                                    </div>
                                    <div class="flex items-start space-x-4">
                                        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-cogni-blue/20 flex items-center justify-center">
                                            <span class="text-sm font-semibold text-cogni-blue">3</span>
                                        </div>
                                        <div class="flex-1">
                                            <h4 class="text-sm font-medium text-text-primary mb-1">Review & Anonymize</h4>
                                            <p class="text-sm text-text-secondary leading-relaxed">
                                                Review detected risks and click to anonymize them with a single click. Your changes apply instantly.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Privacy First -->
                            <div class="bg-gradient-to-br from-cogni-blue/10 to-blue-600/10 rounded-xl border border-cogni-blue/30 p-6">
                                <div class="flex items-start space-x-3">
                                    <div class="flex-shrink-0">
                                        <div class="w-10 h-10 rounded-full bg-cogni-blue/20 flex items-center justify-center">
                                            <i class="fas fa-lock text-cogni-blue"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 class="text-base font-semibold text-text-primary mb-2">
                                            Privacy-First Design
                                        </h3>
                                        <p class="text-sm text-text-secondary leading-relaxed">
                                            All scanning happens locally in your browser. Your data never leaves your device. 
                                            No servers, no tracking, no data collection—just pure privacy protection.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div class="text-center py-4">
                                <p class="text-xs text-text-secondary">
                                    Ready to protect your privacy? Just start typing in any text field!
                                </p>
                            </div>
                        </div>
                    </main>
                </div>
            `;
        },
        addEventListeners: () => {
            // Theme switcher is handled globally in main.js
            
            // Settings button
            document.getElementById('settings-btn')?.addEventListener('click', () => {
                window.location.hash = '#/settings';
            });
        }
    };
};

export default WelcomeView;

