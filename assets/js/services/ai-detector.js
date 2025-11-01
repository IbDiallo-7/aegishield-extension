// AegiShield AI-Powered PII Detection using Chrome Built-in AI
// This service uses Gemini Nano to detect contextual PII that regex patterns cannot catch

class AIDetector {
    constructor() {
        this.session = null;
        this.isAvailable = false;
        this.isInitializing = false;
        this.initializationError = null;
    }

    /**
     * Check if Chrome Built-in AI is available
     */
    async checkAvailability() {
        try {
            // console.log('AegiShield AI: Checking availability...');
            // console.log('AegiShield AI: LanguageModel exists?', typeof LanguageModel !== 'undefined');
            
            // Check if the LanguageModel API exists
            if (typeof LanguageModel === 'undefined' || !LanguageModel.availability) {
                console.warn('AegiShield AI: Built-in AI API not found. Chrome 127+ required with flags enabled.');
                console.warn('AegiShield AI: Enable flags at chrome://flags:');
                console.warn('  1. Prompt API for Gemini Nano → Enabled');
                console.warn('  2. Optimization Guide On Device Model → Enabled BypassPerfRequirement');
                return false;
            }

            console.log('AegiShield AI: API found, checking availability...');
            
            // Check availability with language specified
            const availability = await LanguageModel.availability({
                expectedInputs: [{ type: 'text', languages: ['en'] }],
                expectedOutputs: [{ type: 'text', languages: ['en'] }]
            });
            console.log('AegiShield AI: Availability status:', availability);
            
            if (availability === 'unavailable') {
                console.warn('AegiShield AI: Model not available on this device (unsupported)');
                return false;
            }

            if (availability === 'after-download' || availability === 'downloading') {
                console.warn('AegiShield AI: Model needs to be downloaded first');
                console.warn('AegiShield AI: Go to chrome://components and update "Optimization Guide On Device Model"');
                return false;
            }

            if (availability === 'available' || availability === 'downloadable' || availability === 'readily') {
                console.log('✅ AegiShield AI: Available and ready!');
                this.isAvailable = true;
                return true;
            }

            console.warn('AegiShield AI: Unknown availability status:', availability);
            return false;
        } catch (error) {
            console.error('AegiShield AI: Error checking availability:', error);
            return false;
        }
    }

    /**
     * Initialize AI session with optimized parameters for PII detection
     */
    async initialize() {
        if (this.session) {
            return true; // Already initialized
        }

        if (this.isInitializing) {
            // Wait for ongoing initialization
            while (this.isInitializing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.session !== null;
        }

        this.isInitializing = true;

        try {
            const available = await this.checkAvailability();
            if (!available) {
                this.isInitializing = false;
                return false;
            }

            // Create session with optimized parameters for PII detection (latest API)
            const params = await LanguageModel.params();
            
            this.session = await LanguageModel.create({
                temperature: Math.min(params.defaultTemperature * 0.5, 0.3), // Low temperature for deterministic detection
                topK: Math.max(Math.floor(params.defaultTopK * 0.5), 3), // Low topK for focused responses
                expectedInputs: [
                    { type: 'text', languages: ['en'] }
                ],
                expectedOutputs: [
                    { type: 'text', languages: ['en'] }
                ]
            });
            
            // Store system instructions to prepend to each prompt
            this.systemInstructions = `You are a privacy protection assistant. Your task is to find and extract Personal Identifiable Information (PII), Protected Health Information (PHI), and other sensitive data from the text.

Find the following data types:
- Names: Full names (first + last) AND single names found in context (e.g., "Hi John," or "Thanks, Alex").
- Contact Info: Phone numbers in any format, full physical addresses, and email addresses.
- Secrets: High-entropy alphanumeric strings (32+ chars) like API keys, SSH keys, or other credentials.
- IDs:
  - Government IDs (Passport numbers, driver's licenses).
  - Internal and External IDs (User IDs, Patient IDs, Ticket numbers like 'PROJ-1234').
- Financial Info: Credit card numbers, bank account numbers, or partial card info (e.g., "card ending in 4444").
- Healthcare Info (PHI): Specific medical conditions or diagnoses (e.g., "Type 2 Diabetes"), and specific medications (e.g., "Metformin").
- Any other sensitive information in complex context(like Passwords embedded in connection strings, etc.)

DO NOT flag:
- Generic terms, commit hashes, or numbers without personal context (e.g., "50,000 units").
- Redacted placeholders like [NAME_REDACTED].

CRITICAL: Respond with ONLY a JSON array. NO markdown or other text. If none found, respond with an empty array: [].

Format: [{"type":"TYPE_NAME","value":"extracted_value","reason":"A brief reason","confidence":0.9}]

Use these EXACT type names: name, phone, address, email, secret, government_id, internal_id, financial, medical_condition, medication`;

            // console.log('AegiShield AI: Session initialized successfully');
            this.isInitializing = false;
            return true;
        } catch (error) {
            console.error('AegiShield AI: Failed to initialize session:', error);
            this.initializationError = error;
            this.isInitializing = false;
            return false;
        }
    }

    /**
     * Detect PII using AI with streaming for better UX
     */
    async detectPII(text) {
        try {
            console.log('═══════════════════════════════════════════════════════');
            console.log('🤖 AegiShield AI: Starting PII Detection');
            console.log('═══════════════════════════════════════════════════════');
            console.log('📥 INPUT TEXT:', text);
            console.log('📏 Text length:', text.length, 'characters');
            console.log('───────────────────────────────────────────────────────');
            
            // Initialize if needed
            if (!this.session) {
                console.log('⚙️ Initializing AI session...');
                const initialized = await this.initialize();
                if (!initialized) {
                    console.warn('❌ AI initialization failed');
                    console.log('═══════════════════════════════════════════════════════\n');
                    return { success: false, detections: [], error: 'AI not available' };
                }
                console.log('✅ AI session ready');
            } else {
                console.log('✅ Using existing AI session');
            }

            // Limit text length to avoid quota issues (max ~2000 tokens)
            const maxChars = 8000;
            const truncatedText = text.length > maxChars ? text.substring(0, maxChars) : text;
            if (text.length > maxChars) {
                console.log(`⚠️ Text truncated from ${text.length} to ${maxChars} characters`);
            }

            const prompt = `${this.systemInstructions}\n\nAnalyze this text for PII:\n\n${truncatedText}`;
            console.log('📤 PROMPT SENT TO AI:');
            console.log(prompt);
            console.log('───────────────────────────────────────────────────────');
            console.log('⏳ Waiting for AI response (streaming)...');

            // Use streaming for better responsiveness
            // NOTE: Each chunk contains INCREMENTAL text, not the full accumulated response
            let fullResponse = '';
            const stream = this.session.promptStreaming(prompt);
            let chunkCount = 0;

            for await (const chunk of stream) {
                chunkCount++;
                fullResponse += chunk; // Concatenate each incremental chunk
                
                // Log first few chunks and progress
                if (chunkCount <= 3) {
                    console.log(`📦 Chunk ${chunkCount}: "${chunk}" (total accumulated: ${fullResponse.length} chars)`);
                } else if (chunkCount % 50 === 0) {
                    console.log(`📦 Chunk ${chunkCount}: Total ${fullResponse.length} chars accumulated...`);
                }
            }
            
            console.log(`✅ Streaming complete: ${chunkCount} chunks, final length: ${fullResponse.length} chars`);

            console.log('───────────────────────────────────────────────────────');
            console.log('📥 FULL AI RESPONSE:');
            console.log(fullResponse);
            console.log('───────────────────────────────────────────────────────');

            // Parse JSON response
            try {
                // Remove markdown code fences if present
                let cleanedResponse = fullResponse.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
                console.log('🧹 CLEANED RESPONSE (removed markdown):');
                console.log(cleanedResponse);
                console.log('📏 Cleaned response length:', cleanedResponse.length);
                
                // If response is empty or too short, the AI might be having issues
                if (cleanedResponse.length < 2) {
                    console.warn('⚠️ AI returned empty or invalid response, resetting session...');
                    // Destroy and reset session
                    if (this.session) {
                        try {
                            this.session.destroy();
                        } catch (e) {
                            // Ignore
                        }
                        this.session = null;
                    }
                    console.log('═══════════════════════════════════════════════════════\n');
                    return { success: false, detections: [], error: 'AI returned empty response' };
                }
                
                // Extract JSON from response (in case AI adds extra text)
                const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
                if (!jsonMatch) {
                    console.warn('⚠️ No JSON array found in response');
                    console.log('🔍 Tried to find JSON in:', cleanedResponse);
                    console.log('═══════════════════════════════════════════════════════\n');
                    return { success: true, detections: [] };
                }

                console.log('📋 EXTRACTED JSON:');
                console.log(jsonMatch[0]);
                
                const detections = JSON.parse(jsonMatch[0]);
                console.log('✅ Parsed detections:', detections);
                console.log('📊 Total AI detections:', detections.length);
                
                // Validate and normalize detections
                const validDetections = detections
                    .filter(d => {
                        if (!d.value || !d.type || d.confidence < 0.6) return false;
                        
                        // Filter out redacted placeholders (case-insensitive)
                        // Pattern: [ANYTHING_REDACTED] or [REDACTED]
                        const redactedPattern = /^\[.*REDACTED.*\]$/i;
                        if (redactedPattern.test(d.value.trim())) {
                            console.log(`  ⛔ Filtering out redacted placeholder: "${d.value}"`);
                            return false;
                        }
                        
                        return true;
                    })
                    .map(d => ({
                        type: d.type,
                        value: d.value.trim(),
                        reason: d.reason || 'AI detected',
                        confidence: d.confidence,
                        source: 'ai'
                    }));

                console.log('───────────────────────────────────────────────────────');
                console.log('🎯 VALID DETECTIONS (confidence ≥0.6, excluding redacted):');
                validDetections.forEach((d, i) => {
                    console.log(`  ${i + 1}. Type: ${d.type} | Value: "${d.value}" | Confidence: ${d.confidence} | Reason: ${d.reason}`);
                });
                console.log('📊 Valid detections count:', validDetections.length);
                console.log('═══════════════════════════════════════════════════════\n');

                return { success: true, detections: validDetections };

            } catch (parseError) {
                console.error('❌ Failed to parse AI response:', parseError);
                console.log('🔍 Response that failed:', fullResponse);
                console.log('═══════════════════════════════════════════════════════\n');
                return { success: false, detections: [], error: 'Failed to parse AI response' };
            }

        } catch (error) {
            console.error('❌ AegiShield AI: Detection error:', error);
            console.log('═══════════════════════════════════════════════════════\n');
            
            // Destroy session on error and allow retry
            if (this.session) {
                try {
                    this.session.destroy();
                } catch (e) {
                    // Ignore cleanup errors
                }
                this.session = null;
            }

            return { success: false, detections: [], error: error.message };
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.session) {
            try {
                this.session.destroy();
                console.log('AegiShield AI: Session destroyed');
            } catch (error) {
                console.error('AegiShield AI: Error destroying session:', error);
            }
            this.session = null;
        }
        this.isAvailable = false;
    }
}

// Export singleton instance
export const aiDetector = new AIDetector();

// Utility function for easy integration
export async function detectPIIWithAI(text) {
    return await aiDetector.detectPII(text);
}

