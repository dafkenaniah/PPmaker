// Utility functions for validating data and user input
class Validators {
    /**
     * Validate notes input
     * @param {string} notes - Notes text to validate
     * @returns {Object} - Validation result
     */
    static validateNotes(notes) {
        const result = {
            isValid: false,
            errors: [],
            warnings: [],
            suggestions: []
        };

        // Check if notes exist
        if (!notes || typeof notes !== 'string') {
            result.errors.push('Notes are required');
            return result;
        }

        const trimmedNotes = notes.trim();
        const length = trimmedNotes.length;

        // Check minimum length
        if (length < 20) {
            result.errors.push(`Notes must be at least 20 characters long (currently ${length})`);
        }

        // Check maximum length
        if (length > CONFIG.APP.MAX_NOTES_LENGTH) {
            result.errors.push(`Notes must not exceed ${CONFIG.APP.MAX_NOTES_LENGTH} characters (currently ${length})`);
        }

        // Check for meaningful content
        if (length >= CONFIG.APP.MIN_NOTES_LENGTH) {
            const wordCount = this.countWords(trimmedNotes);
            if (wordCount < 20) {
                result.warnings.push('Notes seem very brief. Consider adding more detail for better results.');
            }

            // Check for structure indicators
            const hasHeaders = /^#+\s/m.test(trimmedNotes);
            const hasBullets = /^[-*•]\s/m.test(trimmedNotes);
            const hasNumbers = /^\d+\.\s/m.test(trimmedNotes);

            if (!hasHeaders && !hasBullets && !hasNumbers) {
                result.suggestions.push('Consider using headers (#), bullet points (-), or numbered lists for better structure.');
            }

            // Check for very long paragraphs
            const paragraphs = trimmedNotes.split(/\n\s*\n/);
            const longParagraphs = paragraphs.filter(p => p.length > 500);
            if (longParagraphs.length > 0) {
                result.suggestions.push('Consider breaking up very long paragraphs for better slide generation.');
            }
        }

        // Set validity
        result.isValid = result.errors.length === 0;

        return result;
    }

    /**
     * Validate slide outline structure
     * @param {Object} outline - Slide outline to validate
     * @returns {Object} - Validation result
     */
    static validateSlideOutline(outline) {
        const result = {
            isValid: false,
            errors: [],
            warnings: []
        };

        // Check if outline exists
        if (!outline || typeof outline !== 'object') {
            result.errors.push('Invalid outline structure');
            return result;
        }

        // Check required fields
        if (!outline.slides || !Array.isArray(outline.slides)) {
            result.errors.push('Outline must contain a slides array');
            return result;
        }

        if (outline.slides.length === 0) {
            result.errors.push('Outline must contain at least one slide');
            return result;
        }

        // Validate each slide
        outline.slides.forEach((slide, index) => {
            const slideErrors = this.validateSlide(slide, index + 1);
            result.errors.push(...slideErrors.errors);
            result.warnings.push(...slideErrors.warnings);
        });

        // Check slide count
        if (outline.slides.length > 15) {
            result.warnings.push('Presentation has many slides. Consider condensing for better audience engagement.');
        }

        // Validate metadata
        if (outline.totalSlides && outline.totalSlides !== outline.slides.length) {
            result.warnings.push('Total slides count does not match actual slides array length');
        }

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * Validate individual slide
     * @param {Object} slide - Slide to validate
     * @param {number} slideNumber - Slide number for error reporting
     * @returns {Object} - Validation result
     */
    static validateSlide(slide, slideNumber) {
        const result = {
            errors: [],
            warnings: []
        };

        // Check slide structure
        if (!slide || typeof slide !== 'object') {
            result.errors.push(`Slide ${slideNumber}: Invalid slide structure`);
            return result;
        }

        // Check title
        if (!slide.title || typeof slide.title !== 'string' || slide.title.trim().length === 0) {
            result.errors.push(`Slide ${slideNumber}: Missing or invalid title`);
        } else if (slide.title.length > 100) {
            result.warnings.push(`Slide ${slideNumber}: Title is very long (${slide.title.length} characters)`);
        }

        // Check content arrays
        if (slide.content && !Array.isArray(slide.content)) {
            result.errors.push(`Slide ${slideNumber}: Content must be an array`);
        }

        if (slide.bullets && !Array.isArray(slide.bullets)) {
            result.errors.push(`Slide ${slideNumber}: Bullets must be an array`);
        }

        // Check for empty slides
        const hasContent = (slide.content && slide.content.length > 0) ||
                          (slide.bullets && slide.bullets.length > 0);
        
        if (!hasContent && slide.slideType !== 'title') {
            result.warnings.push(`Slide ${slideNumber}: Slide appears to have no content`);
        }

        // Check bullet point count
        if (slide.bullets && slide.bullets.length > 7) {
            result.warnings.push(`Slide ${slideNumber}: Too many bullet points (${slide.bullets.length}). Consider splitting into multiple slides.`);
        }

        // Validate slide type
        const validSlideTypes = ['title', 'content', 'conclusion', 'section'];
        if (slide.slideType && !validSlideTypes.includes(slide.slideType)) {
            result.warnings.push(`Slide ${slideNumber}: Unknown slide type "${slide.slideType}"`);
        }

        return result;
    }

    /**
     * Validate file for import
     * @param {File} file - File to validate
     * @param {Array<string>} allowedTypes - Allowed MIME types
     * @param {number} maxSize - Maximum file size in bytes
     * @returns {Object} - Validation result
     */
    static validateFile(file, allowedTypes = ['application/json'], maxSize = 5 * 1024 * 1024) {
        const result = {
            isValid: false,
            errors: [],
            warnings: []
        };

        // Check if file exists
        if (!file) {
            result.errors.push('No file selected');
            return result;
        }

        // Check file size
        if (file.size > maxSize) {
            result.errors.push(`File size (${Formatters.formatFileSize(file.size)}) exceeds maximum allowed size (${Formatters.formatFileSize(maxSize)})`);
        }

        // Check file type
        const isValidType = allowedTypes.some(type => 
            file.type.includes(type) || file.name.toLowerCase().endsWith(type.split('/')[1])
        );

        if (!isValidType) {
            result.errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
        }

        // Check file name
        if (file.name.length > 255) {
            result.warnings.push('File name is very long');
        }

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @returns {boolean} - Whether email is valid
     */
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate URL
     * @param {string} url - URL to validate
     * @returns {boolean} - Whether URL is valid
     */
    static validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate Python script for basic security
     * @param {string} script - Python script to validate
     * @returns {Object} - Validation result
     */
    static validatePythonScript(script) {
        const result = {
            isValid: false,
            errors: [],
            warnings: [],
            securityIssues: []
        };

        if (!script || typeof script !== 'string') {
            result.errors.push('Invalid script content');
            return result;
        }

        // Check for dangerous patterns
        const dangerousPatterns = [
            { pattern: /import\s+os\s*;.*(?:system|popen|exec)/, message: 'Potentially dangerous OS system calls' },
            { pattern: /subprocess/, message: 'Subprocess module usage detected' },
            { pattern: /eval\s*\(/, message: 'Use of eval() function' },
            { pattern: /exec\s*\(/, message: 'Use of exec() function' },
            { pattern: /__import__/, message: 'Dynamic import usage' },
            { pattern: /open\s*\([^)]*['"][^'"]*\.\./, message: 'Potential path traversal' },
            { pattern: /urllib|requests|http/, message: 'Network request capabilities' }
        ];

        dangerousPatterns.forEach(({ pattern, message }) => {
            if (pattern.test(script)) {
                result.securityIssues.push(message);
            }
        });

        // Check for required imports
        if (!script.includes('pptx') && !script.includes('python-pptx')) {
            result.warnings.push('Script does not appear to use python-pptx library');
        }

        // Check script length
        if (script.length > 50000) {
            result.warnings.push('Script is very long');
        }

        // Basic syntax check (very simple)
        const lines = script.split('\n');
        let indentLevel = 0;
        let hasErrors = false;

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed.length === 0 || trimmed.startsWith('#')) return;

            // Very basic indentation check
            const currentIndent = line.length - line.trimStart().length;
            if (currentIndent % 4 !== 0) {
                result.warnings.push(`Line ${index + 1}: Inconsistent indentation`);
            }
        });

        result.isValid = result.errors.length === 0 && result.securityIssues.length === 0;
        return result;
    }

    /**
     * Count words in text
     * @param {string} text - Text to count words in
     * @returns {number} - Word count
     */
    static countWords(text) {
        if (!text || typeof text !== 'string') return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * Count sentences in text
     * @param {string} text - Text to count sentences in
     * @returns {number} - Sentence count
     */
    static countSentences(text) {
        if (!text || typeof text !== 'string') return 0;
        return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
    }

    /**
     * Check if text contains profanity or inappropriate content
     * @param {string} text - Text to check
     * @returns {boolean} - Whether text contains inappropriate content
     */
    static containsInappropriateContent(text) {
        if (!text || typeof text !== 'string') return false;
        
        // Basic profanity filter (extend as needed)
        const inappropriateWords = [
            // Add inappropriate words here
            // This is a basic implementation
        ];
        
        const lowerText = text.toLowerCase();
        return inappropriateWords.some(word => lowerText.includes(word));
    }

    /**
     * Validate presentation settings
     * @param {Object} settings - Settings to validate
     * @returns {Object} - Validation result
     */
    static validatePresentationSettings(settings) {
        const result = {
            isValid: false,
            errors: [],
            warnings: []
        };

        if (!settings || typeof settings !== 'object') {
            result.errors.push('Invalid settings object');
            return result;
        }

        // Validate theme
        if (settings.theme) {
            const validThemes = ['professional', 'modern', 'creative', 'minimal'];
            if (!validThemes.includes(settings.theme)) {
                result.warnings.push(`Unknown theme: ${settings.theme}`);
            }
        }

        // Validate slide dimensions
        if (settings.dimensions) {
            const validDimensions = ['16:9', '4:3', 'custom'];
            if (!validDimensions.includes(settings.dimensions)) {
                result.warnings.push(`Invalid slide dimensions: ${settings.dimensions}`);
            }
        }

        // Validate font settings
        if (settings.fontSize && (settings.fontSize < 8 || settings.fontSize > 72)) {
            result.warnings.push('Font size should be between 8 and 72 points');
        }

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * Sanitize user input
     * @param {string} input - Input to sanitize
     * @returns {string} - Sanitized input
     */
    static sanitizeInput(input) {
        if (!input || typeof input !== 'string') return '';
        
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: URLs
            .replace(/on\w+=/gi, '') // Remove event handlers
            .substring(0, 10000); // Limit length
    }

    /**
     * Check if input is safe for processing
     * @param {string} input - Input to check
     * @returns {boolean} - Whether input is safe
     */
    static isSafeInput(input) {
        if (!input || typeof input !== 'string') return false;
        
        // Check for potentially dangerous patterns
        const dangerousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+=/i,
            /data:text\/html/i,
            /vbscript:/i
        ];
        
        return !dangerousPatterns.some(pattern => pattern.test(input));
    }
}

// Make globally available
window.Validators = Validators;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validators;
}
