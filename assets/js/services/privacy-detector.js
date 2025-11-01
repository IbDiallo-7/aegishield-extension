// assets/js/services/privacy-detector.js
// Hybrid privacy detection engine: regex-based + AI-powered

export const DetectionType = {
    EMAIL: 'email',
    PHONE: 'phone',
    SSN: 'ssn',
    CREDIT_CARD: 'credit_card',
    API_KEY: 'api_key',
    PASSWORD: 'password',
    IP_ADDRESS: 'ip_address',
    ADDRESS: 'address',
    NAME: 'name',
    URL: 'url',
    DATE: 'date',
    // AI-detected types
    AI_NAME: 'name',
    AI_ADDRESS: 'address',
    AI_USERNAME: 'username',
    AI_GOVERNMENT_ID: 'government_id',
    AI_FINANCIAL: 'financial',
    AI_HEALTHCARE: 'healthcare',
    AI_PERSONAL_INFO: 'personal_info'
};

export const DetectionSeverity = {
    HIGH: 'high',      // Credentials, API keys, SSN
    MEDIUM: 'medium',  // Email, phone, credit card
    LOW: 'low'         // Names, dates, addresses
};

// Detection patterns with severity levels
// ORDER MATTERS: More specific patterns should come BEFORE more general ones
const patterns = [
    // CRITICAL: Credit card MUST come before phone to avoid false positives
    {
        type: DetectionType.CREDIT_CARD,
        severity: DetectionSeverity.HIGH,
        regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
        label: 'Credit Card',
        icon: 'fa-credit-card',
        anonymize: (text) => '[CARD_REDACTED]'
    },
    {
        type: DetectionType.SSN,
        severity: DetectionSeverity.HIGH,
        regex: /\b\d{3}-\d{2}-\d{4}\b/g,
        label: 'SSN',
        icon: 'fa-id-card',
        anonymize: (text) => '[SSN_REDACTED]'
    },
    {
        type: DetectionType.EMAIL,
        severity: DetectionSeverity.MEDIUM,
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        label: 'Email Address',
        icon: 'fa-envelope',
        anonymize: (text) => '[EMAIL_REDACTED]'
    },
    {
        type: DetectionType.API_KEY,
        severity: DetectionSeverity.HIGH,
        regex: /\b(?:api[_-]?key|apikey|access[_-]?token|secret[_-]?key|private[_-]?key)[:\s=]+["\']?([A-Za-z0-9_\-]{20,})["\']?/gi,
        label: 'API Key/Token',
        icon: 'fa-key',
        anonymize: (text) => '[API_KEY_REDACTED]'
    },
    {
        type: DetectionType.API_KEY,
        severity: DetectionSeverity.HIGH,
        // Standalone API key pattern: 32+ alphanumeric chars that look like keys
        regex: /\b[A-Za-z0-9]{32,}\b/g,
        label: 'API Key/Token',
        icon: 'fa-key',
        anonymize: (text) => '[API_KEY_REDACTED]'
    },
    {
        type: DetectionType.IP_ADDRESS,
        severity: DetectionSeverity.MEDIUM,
        regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
        label: 'IP Address',
        icon: 'fa-network-wired',
        anonymize: (text) => '[IP_REDACTED]'
    },
    {
        type: DetectionType.URL,
        severity: DetectionSeverity.LOW,
        regex: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
        label: 'URL',
        icon: 'fa-link',
        anonymize: (text) => '[URL_REDACTED]'
    },
    {
        type: DetectionType.DATE,
        severity: DetectionSeverity.LOW,
        regex: /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/g,
        label: 'Date',
        icon: 'fa-calendar',
        anonymize: (text) => '[DATE_REDACTED]'
    }
];

// Map AI types to icons, severity, and anonymization
const aiTypeMapping = {
    'name': { icon: 'fa-user', severity: DetectionSeverity.MEDIUM, anonymize: () => '[NAME_REDACTED]' },
    'phone': { icon: 'fa-phone', severity: DetectionSeverity.MEDIUM, anonymize: () => '[PHONE_REDACTED]' },
    'email': { icon: 'fa-envelope', severity: DetectionSeverity.MEDIUM, anonymize: () => '[EMAIL_REDACTED]' },
    'address': { icon: 'fa-map-marker-alt', severity: DetectionSeverity.MEDIUM, anonymize: () => '[ADDRESS_REDACTED]' },
    'username': { icon: 'fa-key', severity: DetectionSeverity.HIGH, anonymize: () => '[API_KEY_REDACTED]' }, // AI often calls API keys "username"
    'api_key': { icon: 'fa-key', severity: DetectionSeverity.HIGH, anonymize: () => '[API_KEY_REDACTED]' },
    'government_id': { icon: 'fa-id-card', severity: DetectionSeverity.HIGH, anonymize: () => '[GOV_ID_REDACTED]' },
    'financial': { icon: 'fa-dollar-sign', severity: DetectionSeverity.HIGH, anonymize: () => '[FINANCIAL_REDACTED]' },
    'healthcare': { icon: 'fa-heartbeat', severity: DetectionSeverity.HIGH, anonymize: () => '[HEALTHCARE_REDACTED]' },
    'personal_info': { icon: 'fa-user-shield', severity: DetectionSeverity.MEDIUM, anonymize: () => '[INFO_REDACTED]' }
};

/**
 * Check if two detections overlap
 * @param {Object} det1 - First detection
 * @param {Object} det2 - Second detection
 * @returns {boolean} True if they overlap
 */
function detectionsOverlap(det1, det2) {
    return (det1.start >= det2.start && det1.start < det2.end) ||
           (det1.end > det2.start && det1.end <= det2.end) ||
           (det2.start >= det1.start && det2.start < det1.end) ||
           (det2.end > det1.start && det2.end <= det1.end);
}

/**
 * Remove duplicate/overlapping detections, prioritizing by source and specificity
 * Priority order: 
 * 1. Among custom patterns: longer/more specific match wins
 * 2. custom > regex > ai (between different sources)
 * @param {Array} detections - Array of detection objects
 * @returns {Array} Deduplicated array
 */
function deduplicateDetections(detections) {
    if (detections.length === 0) return [];
    
    // Sort by priority with special handling for custom patterns
    const priorityOrder = { custom: 0, regex: 1, ai: 2 };
    const sorted = [...detections].sort((a, b) => {
        const priorityDiff = priorityOrder[a.source] - priorityOrder[b.source];
        if (priorityDiff !== 0) return priorityDiff;
        
        // For same source type, prioritize by length (longer/more specific wins)
        if (a.source === b.source) {
            const lengthDiff = (b.end - b.start) - (a.end - a.start);
            if (lengthDiff !== 0) return lengthDiff;
        }
        
        // Finally sort by position
        return a.start - b.start;
    });
    
    const unique = [];
    
    for (const detection of sorted) {
        // Check if this detection overlaps with any already accepted detection
        const overlappingDetection = unique.find(accepted => detectionsOverlap(detection, accepted));
        
        if (!overlappingDetection) {
            unique.push(detection);
        } else {
            // Log with details about what was kept
            if (detection.source === 'custom' && overlappingDetection.source === 'custom') {
                // console.log(`AegiShield: Skipping custom pattern "${detection.label}" for "${detection.match}" (overlaps with "${overlappingDetection.label}" - keeping longer/more specific match)`);
            } else {
                // console.log(`AegiShield: Skipping ${detection.source} detection "${detection.match}" (overlaps with higher priority ${overlappingDetection.source} detection)`);
            }
        }
    }
    
    // Sort final result by position in text
    return unique.sort((a, b) => a.start - b.start);
}

/**
 * Scans text for sensitive information using regex patterns
 * @param {string} text - The text to scan
 * @param {Array} customPatterns - Optional custom patterns from user settings
 * @returns {Array} Array of detection objects
 */
export function scanText(text, customPatterns = []) {
    const detections = [];
    
    // Scan with custom patterns FIRST (highest priority)
    customPatterns.forEach(customPattern => {
        if (!customPattern.enabled) return;
        
        try {
            const regex = new RegExp(customPattern.pattern, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                detections.push({
                    type: 'custom',
                    severity: customPattern.severity,
                    label: customPattern.name,
                    icon: 'fa-user-shield',
                    match: match[0],
                    start: match.index,
                    end: match.index + match[0].length,
                    anonymize: () => `[${customPattern.name.toUpperCase().replace(/\s+/g, '_')}_REDACTED]`,
                    source: 'custom',
                    customId: customPattern.id
                });
            }
        } catch (error) {
            // console.error(`AegiShield: Invalid custom pattern "${customPattern.name}":`, error);
        }
    });
    
    // Scan with built-in patterns
    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(text)) !== null) {
            detections.push({
                type: pattern.type,
                severity: pattern.severity,
                label: pattern.label,
                icon: pattern.icon,
                match: match[0],
                start: match.index,
                end: match.index + match[0].length,
                anonymize: pattern.anonymize,
                source: 'regex'
            });
        }
    });
    
    // Deduplicate with custom patterns having highest priority
    return deduplicateDetections(detections);
}

/**
 * Hybrid scan: combines regex + AI detection
 * @param {string} text - The text to scan
 * @param {Object} options - Options for scanning
 * @returns {Promise<Object>} Object with detections and metadata
 */
export async function scanTextHybrid(text, options = {}) {
    const useAI = options.useAI !== false; // Default to true
    
    // console.log('AegiShield: scanTextHybrid called, useAI:', useAI, 'text length:', text.length);
    
    // Load custom patterns from storage
    let customPatterns = [];
    try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const settings = await chrome.storage.local.get(['aegishield_custom_patterns']);
            customPatterns = settings.aegishield_custom_patterns || [];
            console.log('AegiShield: Loaded', customPatterns.length, 'custom patterns');
        }
    } catch (error) {
        console.warn('AegiShield: Failed to load custom patterns:', error);
    }
    
    // Always run regex scan first (fast and reliable) with custom patterns
    const regexDetections = scanText(text, customPatterns);
    console.log('AegiShield: Regex scan found', regexDetections.length, 'items');
    
    const result = {
        detections: regexDetections,
        aiDetections: [],
        aiEnabled: false,
        aiError: null,
        usedAI: false
    };
    
    // Skip AI if disabled or text is too short
    if (!useAI || text.trim().length < 10) {
        console.log('AegiShield: Skipping AI scan (useAI:', useAI, ', text length:', text.trim().length, ')');
        return result;
    }
    
    try {
        console.log('AegiShield: Importing AI detector...');
        // Dynamically import AI detector
        const { detectPIIWithAI } = await import('./ai-detector.js');
        
        console.log('AegiShield: Running AI detection...');
        // Run AI detection
        const aiResult = await detectPIIWithAI(text);
        
        console.log('AegiShield: AI result:', aiResult);
        result.aiEnabled = aiResult.success;
        result.usedAI = aiResult.success;
        
        if (aiResult.success && aiResult.detections.length > 0) {
            console.log('───────────────────────────────────────────────────────');
            console.log('🔄 Converting AI detections to internal format...');
            console.log('AI returned', aiResult.detections.length, 'detections');
            
            // Convert AI detections to our format
            const aiDetections = aiResult.detections.map((aiDet, idx) => {
                console.log(`  Processing AI detection ${idx + 1}:`, aiDet);
                
                const mapping = aiTypeMapping[aiDet.type] || {
                    icon: 'fa-exclamation-circle',
                    label: 'PII (AI)',
                    severity: DetectionSeverity.MEDIUM
                };
                
                // Find position in text
                const start = text.indexOf(aiDet.value);
                if (start === -1) {
                    console.log(`    ❌ Value "${aiDet.value}" not found in text`);
                    return null; // Value not found
                }
                console.log(`    ✅ Found at position ${start}-${start + aiDet.value.length}`);
                
                return {
                    type: aiDet.type,
                    severity: mapping.severity,
                    label: `${aiDet.reason} (AI)`, // Use AI's reason as the label
                    icon: mapping.icon,
                    match: aiDet.value,
                    start: start,
                    end: start + aiDet.value.length,
                    anonymize: mapping.anonymize || (() => `[${aiDet.type.toUpperCase()}_REDACTED]`),
                    source: 'ai',
                    confidence: aiDet.confidence,
                    reason: aiDet.reason
                };
            }).filter(d => d !== null);
            
            console.log('───────────────────────────────────────────────────────');
            console.log('📊 AI DETECTIONS (before dedup):', aiDetections.length);
            console.log('📊 REGEX+CUSTOM DETECTIONS:', regexDetections.length);
            
            result.aiDetections = aiDetections;
            
            // Merge all detections and deduplicate (custom > regex > ai priority)
            const allDetections = [...regexDetections, ...aiDetections];
            result.detections = deduplicateDetections(allDetections);
            
            console.log('📊 TOTAL MERGED DETECTIONS (after dedup):', result.detections.length);
            console.log('═══════════════════════════════════════════════════════\n');
        } else if (!aiResult.success) {
            result.aiError = aiResult.error;
            console.log('⚠️ AI scan failed:', aiResult.error);
        }
        
    } catch (error) {
        console.error('AegiShield: AI detection failed:', error);
        result.aiError = error.message;
    }
    
    return result;
}

/**
 * Highlights detections in text with HTML markup
 * @param {string} text - Original text
 * @param {Array} detections - Array of detection objects
 * @returns {string} HTML string with highlighted detections
 */
export function highlightDetections(text, detections) {
    if (detections.length === 0) return escapeHtml(text);
    
    let result = '';
    let lastIndex = 0;
    
    detections.forEach((detection, idx) => {
        // Add text before this detection
        result += escapeHtml(text.substring(lastIndex, detection.start));
        
        // Add highlighted detection
        const severityClass = `detection-${detection.severity}`;
        result += `<span class="${severityClass}" data-detection-id="${idx}" title="${detection.label}">`;
        result += escapeHtml(detection.match);
        result += '</span>';
        
        lastIndex = detection.end;
    });
    
    // Add remaining text
    result += escapeHtml(text.substring(lastIndex));
    
    return result;
}

/**
 * Anonymizes all detections in text
 * @param {string} text - Original text
 * @param {Array} detections - Array of detection objects
 * @returns {string} Anonymized text
 */
export function anonymizeAll(text, detections) {
    if (detections.length === 0) return text;
    
    let result = text;
    // Process in reverse order to maintain correct indices
    const sortedDetections = [...detections].sort((a, b) => b.start - a.start);
    
    sortedDetections.forEach(detection => {
        const replacement = detection.anonymize(detection.match);
        result = result.substring(0, detection.start) + replacement + result.substring(detection.end);
    });
    
    return result;
}

/**
 * Anonymizes specific detections by their IDs
 * @param {string} text - Original text
 * @param {Array} detections - Array of all detection objects
 * @param {Array} detectionIds - Array of detection IDs to anonymize
 * @returns {string} Partially anonymized text
 */
export function anonymizeSelected(text, detections, detectionIds) {
    const selectedDetections = detections.filter((_, idx) => detectionIds.includes(idx));
    return anonymizeAll(text, selectedDetections);
}

/**
 * Gets summary statistics for detections
 * @param {Array} detections - Array of detection objects
 * @returns {Object} Summary statistics
 */
export function getDetectionSummary(detections) {
    const summary = {
        total: detections.length,
        byType: {},
        bySeverity: {
            high: 0,
            medium: 0,
            low: 0
        }
    };
    
    detections.forEach(detection => {
        // Count by type
        summary.byType[detection.type] = (summary.byType[detection.type] || 0) + 1;
        
        // Count by severity
        summary.bySeverity[detection.severity]++;
    });
    
    return summary;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export default {
    DetectionType,
    DetectionSeverity,
    scanText,
    scanTextHybrid,
    highlightDetections,
    anonymizeAll,
    anonymizeSelected,
    getDetectionSummary
};

