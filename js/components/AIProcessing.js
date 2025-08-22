// AI Processing Component - Handles AI outline generation
class AIProcessing {
    constructor() {
        this.generateButton = null;
        this.processingStatus = null;
        this.statusText = null;
        this.isProcessing = false;
        this.currentRequest = null;
        this.minNotesLength = 100;
        this.promptTemplate = `You are a presentation expert. Convert these notes into a structured PowerPoint outline.

Return a JSON object with this exact structure:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "content": ["Main content points"],
      "bullets": ["Bullet point 1", "Bullet point 2"],
      "presenterNotes": "Speaker notes",
      "slideType": "title|content|conclusion"
    }
  ],
  "totalSlides": number,
  "estimatedDuration": "X minutes"
}

Focus on:
- Clear, concise slide titles
- Logical flow and organization  
- Appropriate bullet point breakdown
- Professional presentation structure`;
    }

    /**
     * Initialize the component
     */
    init() {
        this.generateButton = document.getElementById('generate-outline-btn');
        this.processingStatus = document.getElementById('processing-status');
        this.statusText = document.getElementById('status-text');

        if (!this.generateButton || !this.processingStatus || !this.statusText) {
            console.error('AIProcessing: Required elements not found');
            return;
        }

        this.setupEventListeners();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Add click listener
        this.generateButton.addEventListener('click', this.handleGenerateOutline.bind(this));

        // Listen for notes input changes to update button state
        const notesElement = document.getElementById('notes-input');
        if (notesElement) {
            notesElement.addEventListener('input', () => this.updateButtonState());
        }

        // Also listen for custom events from NotesInput component
        document.addEventListener('notesChanged', () => this.updateButtonState());

        // Initial button state update
        this.updateButtonState();
    }

    /**
     * Handle generate outline button click
     */
    async handleGenerateOutline() {
        console.log('[AIProcessing] handleGenerateOutline called');
        console.log('[AIProcessing] Current processing state:', this.isProcessing);
        
        if (this.isProcessing) {
            console.log('[AIProcessing] Already processing, cancelling...');
            this.cancelProcessing();
            return;
        }

        try {
            console.log('[AIProcessing] Starting outline generation process...');
            
            // Get notes safely
            const notesElement = document.getElementById('notes-input');
            const notes = notesElement ? notesElement.value : '';
            console.log('[AIProcessing] Notes retrieved, length:', notes.length);
            console.log('[AIProcessing] Notes preview:', notes.substring(0, 100) + '...');
            
            // Validate notes with fallback
            let validation;
            if (typeof Validators !== 'undefined') {
                console.log('[AIProcessing] Using Validators for validation');
                validation = Validators.validateNotes(notes);
            } else {
                console.log('[AIProcessing] Using fallback validation');
                validation = {
                    isValid: notes.length >= 100,
                    errors: notes.length < 100 ? ['Please enter at least 100 characters'] : []
                };
            }
            
            console.log('[AIProcessing] Validation result:', validation);

            if (!validation.isValid) {
                console.log('[AIProcessing] Validation failed, showing error');
                this.showError(validation.errors.join(', '));
                return;
            }

            console.log('[AIProcessing] Validation passed, proceeding to generate outline');
            await this.generateOutline(notes);
            
        } catch (error) {
            console.error('[AIProcessing] Error in handleGenerateOutline:', error);
            console.error('[AIProcessing] Error stack:', error.stack);
            const errorMessage = typeof Formatters !== 'undefined' ? 
                Formatters.formatErrorMessage(error) : 
                error.message || 'An error occurred';
            console.log('[AIProcessing] Formatted error message:', errorMessage);
            this.showError(errorMessage);
        }
    }

    /**
     * Generate slide outline using real AI gateway
     * @param {string} notes - User notes
     */
    async generateOutline(notes) {
        console.log('[AIProcessing] generateOutline called with notes length:', notes.length);
        
        try {
            console.log('[AIProcessing] Starting processing state...');
            this.startProcessing();
            
            // Update status
            console.log('[AIProcessing] Updating status: Analyzing your notes...');
            this.updateStatus('Analyzing your notes...');
            
            // Generate outline using real AI gateway
            console.log('[AIProcessing] Updating status: Generating slide outline...');
            this.updateStatus('Generating slide outline...');
            
            console.log('[AIProcessing] Calling generateRealOutline...');
            const outline = await this.generateRealOutline(notes);
            console.log('[AIProcessing] Outline generated successfully:', outline);
            
            // Save the outline
            if (window.fileService) {
                console.log('[AIProcessing] Saving outline to fileService...');
                fileService.saveOutline(outline);
            } else {
                console.log('[AIProcessing] fileService not available, skipping save');
            }
            
            // Show success and display outline
            console.log('[AIProcessing] Showing success message...');
            this.showSuccess(outline);
            if (window.timeSavingsService) {
                window.timeSavingsService.trackTimeSaved('generate_outline');
            }
            
            // Show the outline preview section
            console.log('[AIProcessing] Showing outline section...');
            this.showOutlineSection(outline);

            // Automatically generate pre-built charts
            if (window.chartGeneration) {
                console.log('[AIProcessing] Triggering automatic chart generation...');
                window.chartGeneration.generatePreBuiltCharts(outline);
            }
            
            console.log('[AIProcessing] Outline generation completed successfully');
            
        } catch (error) {
            console.error('[AIProcessing] Error generating outline:', error);
            console.error('[AIProcessing] Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            this.showError(error.message || 'Failed to generate outline');
        } finally {
            console.log('[AIProcessing] Stopping processing state...');
            this.stopProcessing();
        }
    }

    /**
     * Start processing state
     */
    startProcessing() {
        this.isProcessing = true;
        this.generateButton.textContent = 'Cancel';
        this.generateButton.classList.add('processing');
        this.processingStatus.classList.remove('hidden');
        
        // Disable other inputs during processing
        const notesElement = document.getElementById('notes-input');
        if (notesElement) {
            notesElement.disabled = true;
        }
        
        // Start progress animation
        this.startProgressAnimation();
    }

    /**
     * Stop processing state
     */
    stopProcessing() {
        this.isProcessing = false;
        this.generateButton.textContent = 'Generate Slide Outline';
        this.generateButton.classList.remove('processing');
        this.processingStatus.classList.add('hidden');
        
        // Re-enable inputs
        const notesElement = document.getElementById('notes-input');
        if (notesElement) {
            notesElement.disabled = false;
        }
        
        // Stop progress animation
        this.stopProgressAnimation();
        
        // Update button state
        this.updateButtonState();
    }

    /**
     * Cancel current processing
     */
    cancelProcessing() {
        if (this.currentRequest) {
            // In a real implementation, you would abort the fetch request
            console.log('Cancelling AI request...');
        }
        
        this.stopProcessing();
        this.updateStatus('Processing cancelled');
        
        setTimeout(() => {
            this.processingStatus.classList.add('hidden');
        }, 2000);
    }

    /**
     * Update processing status text
     * @param {string} message - Status message
     */
    updateStatus(message) {
        this.statusText.textContent = message;
    }

    /**
     * Show success message
     * @param {Object} outline - Generated outline
     */
    showSuccess(outline) {
        const slideCount = outline.slides ? outline.slides.length : 0;
        const message = Formatters.formatSuccessMessage('outline_generated', { slideCount });
        
        this.updateStatus(message);
        
        // Show success styling
        this.processingStatus.classList.add('success');
        
        setTimeout(() => {
            this.processingStatus.classList.remove('success');
            this.processingStatus.classList.add('hidden');
        }, 3000);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.updateStatus(message);
        
        // Show error styling
        this.processingStatus.classList.add('error');
        
        setTimeout(() => {
            this.processingStatus.classList.remove('error');
            this.processingStatus.classList.add('hidden');
        }, 5000);
    }

    /**
     * Update button state based on input validation
     */
    updateButtonState() {
        if (this.isProcessing) return;
        
        // Get notes safely
        const notesElement = document.getElementById('notes-input');
        const notes = notesElement ? notesElement.value : '';
        console.log('Updating button state - Notes length:', notes.length);
        
        // Validate with fallback
        let validation;
        if (typeof Validators !== 'undefined') {
            validation = Validators.validateNotes(notes);
        } else {
            validation = {
                isValid: notes.length >= 100,
                errors: notes.length < 100 ? ['Please enter at least 100 characters'] : []
            };
        }
        console.log('Validation result:', validation);
        
        this.generateButton.disabled = !validation.isValid;
        
        if (validation.isValid) {
            this.generateButton.title = 'Generate slide outline from your notes (Ctrl+Enter)';
            this.generateButton.classList.remove('disabled');
            console.log('Button enabled');
        } else {
            this.generateButton.title = validation.errors.join(', ');
            this.generateButton.classList.add('disabled');
            console.log('Button disabled:', validation.errors);
        }
    }

    /**
     * Show the outline section with generated content
     * @param {Object} outline - Generated outline
     */
    showOutlineSection(outline) {
        const outlineSection = document.getElementById('outline-section');
        if (outlineSection) {
            outlineSection.classList.remove('hidden');
            
            // Scroll to outline section
            setTimeout(() => {
                outlineSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 300);
        }

        // Trigger outline preview update
        if (window.outlinePreview) {
            window.outlinePreview.displayOutline(outline);
        }
    }

    /**
     * Start progress animation
     */
    startProgressAnimation() {
        const spinner = this.processingStatus.querySelector('.spinner');
        if (spinner) {
            spinner.style.animationPlayState = 'running';
        }
        
        // Add pulsing effect to status
        this.processingStatus.classList.add('pulsing');
    }

    /**
     * Stop progress animation
     */
    stopProgressAnimation() {
        const spinner = this.processingStatus.querySelector('.spinner');
        if (spinner) {
            spinner.style.animationPlayState = 'paused';
        }
        
        // Remove pulsing effect
        this.processingStatus.classList.remove('pulsing');
    }

    /**
     * Get processing statistics
     * @returns {Object} - Processing stats
     */
    getProcessingStats() {
        return {
            isProcessing: this.isProcessing,
            hasValidInput: !this.generateButton.disabled,
            inputLength: notesInput.getNotes().length,
            estimatedTokens: aiService.estimateTokens(notesInput.getNotes())
        };
    }

    /**
     * Retry outline generation with different parameters
     * @param {Object} options - Retry options
     */
    async retryGeneration(options = {}) {
        const notes = notesInput.getNotes();
        
        if (!notes) {
            this.showError('No notes to process');
            return;
        }

        // Apply any retry options (e.g., different model, temperature)
        const originalModel = aiService.defaultModel;
        
        if (options.model) {
            aiService.defaultModel = options.model;
        }

        try {
            await this.generateOutline(notes);
        } finally {
            // Restore original model
            aiService.defaultModel = originalModel;
        }
    }

    /**
     * Generate slide outline from notes using real AI gateway
     * @param {string} notes - User notes
     * @returns {Promise<Object>} Generated outline
     */
    async generateRealOutline(notes) {
        console.log('[AIProcessing] generateRealOutline called');
        console.log('[AIProcessing] Notes length check:', notes?.length, 'Min required:', this.minNotesLength);
        
        if (!notes || notes.trim().length < this.minNotesLength) {
            const error = `Please provide at least ${this.minNotesLength} characters of notes.`;
            console.error('[AIProcessing] Notes validation failed:', error);
            throw new Error(error);
        }

        try {
            console.log('[AIProcessing] Starting AI gateway call...');
            
            // Get current configuration from ConfigurationManager
            console.log('[AIProcessing] Getting AI configuration...');
            const aiConfig = this.getAIConfiguration();
            console.log('[AIProcessing] AI configuration retrieved:', aiConfig);
            
            // Build the AI prompt with audience context
            console.log('[AIProcessing] Building AI prompt...');
            const prompt = this.buildAIPrompt(notes);
            console.log('[AIProcessing] Prompt built, length:', prompt.length);
            console.log('[AIProcessing] Prompt preview:', prompt.substring(0, 200) + '...');
            
            // Prepare request payload
            const requestPayload = {
                model: aiConfig.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: aiConfig.maxTokens,
                temperature: aiConfig.temperature
            };
            console.log('[AIProcessing] Request payload prepared:', requestPayload);
            
            // Prepare request URL and headers based on gateway configuration
            const requestUrl = aiConfig.gatewayUrl + aiConfig.endpoint;
            console.log('[AIProcessing] Request URL:', requestUrl);
            
            // Prepare headers based on auth type
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (aiConfig.authType === 'bearer') {
                headers['Authorization'] = `Bearer ${CONFIG.AI_GATEWAY.API_KEY}`;
            } else if (aiConfig.authType === 'x-api-key') {
                headers['x-api-key'] = CONFIG.AI_GATEWAY.API_KEY;
            } else if (aiConfig.authType === 'x-goog-api-key') {
                headers['x-goog-api-key'] = CONFIG.AI_GATEWAY.API_KEY;
            }
            
            console.log('[AIProcessing] Request headers prepared:', Object.keys(headers));
            
            // Call AI Gateway with configured settings
            console.log('[AIProcessing] Making fetch request to AI Gateway...');
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestPayload)
            });
            
            console.log('[AIProcessing] Fetch response received');
            console.log('[AIProcessing] Response status:', response.status, response.statusText);
            console.log('[AIProcessing] Response ok:', response.ok);
            
            if (!response.ok) {
                let errorText = 'Unable to read error response';
                try {
                    errorText = await response.text();
                } catch (e) {
                    console.error('[AIProcessing] Could not read error response text:', e);
                }
                console.error(`[AIProcessing] AI Gateway Error Response (Status ${response.status}):`, errorText);
                throw new Error(`The AI service returned an error. Status: ${response.status} ${response.statusText}. Please check the application configuration or network connection.`);
            }
            
            console.log('[AIProcessing] Parsing response JSON...');
            const data = await response.json();
            console.log('[AIProcessing] Response data structure:', {
                hasChoices: !!data.choices,
                choicesLength: data.choices?.length,
                firstChoiceStructure: data.choices?.[0] ? Object.keys(data.choices[0]) : 'N/A'
            });
            
            // Extract the content from the response
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('[AIProcessing] Invalid response structure:', data);
                throw new Error('Invalid AI response structure');
            }
            
            const content = data.choices[0].message.content;
            console.log('[AIProcessing] AI response content length:', content.length);
            console.log('[AIProcessing] AI response preview:', content.substring(0, 300) + '...');
            
            // Parse the JSON response
            console.log('[AIProcessing] Attempting to parse AI response as JSON...');
            let outline;
            try {
                // Clean the content and parse
                const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
                outline = JSON.parse(cleanedContent);
                
                console.log('[AIProcessing] Successfully parsed outline:', {
                    hasSlides: !!outline.slides,
                    slideCount: outline.slides?.length
                });

            } catch (parseError) {
                console.error('[AIProcessing] Failed to parse AI response as JSON:', parseError);
                console.error('[AIProcessing] Raw AI response that failed to parse:', content);
                // Log to analytics service if it exists
                if (window.analyticsService) {
                    window.analyticsService.trackError(parseError, {
                        context: 'AIResponseParsing',
                        rawResponse: content.substring(0, 500) // Log first 500 chars
                    });
                }
                throw new Error('The AI service returned a response in an unexpected format. Please try again.');
            }
            
            // Validate the outline structure
            console.log('[AIProcessing] Validating outline structure...');
            this.validateOutline(outline);
            console.log('[AIProcessing] Outline validation passed');
            
            // Get audience context for metadata
            console.log('[AIProcessing] Getting audience context for metadata...');
            const audienceContext = this.getAudienceContext();
            console.log('[AIProcessing] Audience context:', audienceContext);
            
            // Add metadata about the generation
            outline.generatedWith = {
                model: aiConfig.model,
                temperature: aiConfig.temperature,
                maxTokens: aiConfig.maxTokens,
                audience: audienceContext,
                timestamp: new Date().toISOString()
            };
            console.log('[AIProcessing] Added generation metadata to outline');
            
            console.log('[AIProcessing] generateRealOutline completed successfully');
            return outline;
            
        } catch (error) {
            console.error('[AIProcessing] Error in generateRealOutline:', error);
            console.error('[AIProcessing] Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Build AI prompt for real AI gateway
     * @param {string} notes - User notes
     * @returns {string} Complete prompt
     */
    buildAIPrompt(notes) {
        let prompt = `You are a presentation expert. Convert these notes into a structured PowerPoint outline.

Return a JSON object with this exact structure:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "content": ["Main content points"],
      "bullets": ["Bullet point 1", "Bullet point 2"],
      "presenterNotes": "Speaker notes",
      "slideType": "title|content|conclusion"
    }
  ],
  "totalSlides": number,
  "estimatedDuration": "X minutes"
}

Focus on:
- Clear, concise slide titles
- Logical flow and organization  
- Appropriate bullet point breakdown
- Professional presentation structure
- Maximum 10 slides for optimal presentation length`;

        // Add audience context if available
        if (window.audienceManager && typeof window.audienceManager.generatePromptModifier === 'function') {
            const audienceModifier = window.audienceManager.generatePromptModifier();
            if (audienceModifier) {
                prompt += audienceModifier;
            }
        }

        // Add configuration context
        if (window.configurationManager && typeof window.configurationManager.getCurrentModelInfo === 'function') {
            const modelInfo = window.configurationManager.getCurrentModelInfo();
            if (modelInfo) {
                prompt += `\n\nNote: You are ${modelInfo.name} by ${modelInfo.provider}. Use your strengths in ${modelInfo.quality.toLowerCase()} quality responses.`;
            }
        }

        prompt += `

Notes to convert: ${notes}

Please generate a comprehensive slide outline based on these notes.`;

        return prompt;
    }

    /**
     * Get AI configuration from ConfigurationManager
     * @returns {Object} AI configuration
     */
    getAIConfiguration() {
        // Get configuration from ConfigurationManager if available
        if (window.configurationManager && typeof window.configurationManager.getCurrentConfig === 'function') {
            const config = window.configurationManager.getCurrentConfig();
            const gatewayUrl = config.gatewayUrl || CONFIG.AI_GATEWAY.DEFAULT_GATEWAY;
            const gatewayInfo = CONFIG.AI_GATEWAY.GATEWAYS[gatewayUrl];
            
            return {
                gatewayUrl: gatewayUrl,
                endpoint: gatewayInfo?.endpoint || '/chat/completions',
                authType: gatewayInfo?.authType || 'bearer',
                model: config.aiModel || CONFIG.AI_GATEWAY.DEFAULT_MODEL,
                temperature: config.temperature || CONFIG.AI_GATEWAY.TEMPERATURE,
                maxTokens: config.maxTokens || CONFIG.AI_GATEWAY.MAX_TOKENS,
                timeout: config.timeout || CONFIG.APP.PROCESSING_TIMEOUT
            };
        }
        
        // Fallback to default configuration
        const defaultGateway = CONFIG.AI_GATEWAY.DEFAULT_GATEWAY;
        const defaultGatewayInfo = CONFIG.AI_GATEWAY.GATEWAYS[defaultGateway];
        
        return {
            gatewayUrl: defaultGateway,
            endpoint: defaultGatewayInfo?.endpoint || '/chat/completions',
            authType: defaultGatewayInfo?.authType || 'bearer',
            model: CONFIG.AI_GATEWAY.DEFAULT_MODEL,
            temperature: CONFIG.AI_GATEWAY.TEMPERATURE,
            maxTokens: CONFIG.AI_GATEWAY.MAX_TOKENS,
            timeout: CONFIG.APP.PROCESSING_TIMEOUT
        };
    }

    /**
     * Get audience context from AudienceManager
     * @returns {Object} Audience context
     */
    getAudienceContext() {
        if (window.audienceManager && typeof window.audienceManager.getSelectedAudiences === 'function') {
            const selectedAudiences = window.audienceManager.getSelectedAudiences();
            const audienceSummary = window.audienceManager.getAudienceSummary();
            
            return {
                selectedAudiences: selectedAudiences,
                summary: audienceSummary,
                hasAudiences: selectedAudiences.length > 0
            };
        }
        
        return {
            selectedAudiences: [],
            summary: 'General audience',
            hasAudiences: false
        };
    }

    /**
     * Build AI prompt for outline generation
     * @param {string} notes - User notes
     * @returns {string} Complete prompt
     */
    buildPrompt(notes) {
        let prompt = this.promptTemplate;
        
        // Add audience context if available
        if (window.audienceManager) {
            const audienceModifier = window.audienceManager.generatePromptModifier();
            if (audienceModifier) {
                prompt += audienceModifier;
            }
        }
        
        // Add configuration context
        if (window.configurationManager) {
            const modelInfo = window.configurationManager.getCurrentModelInfo();
            if (modelInfo) {
                prompt += `\n\nNote: You are ${modelInfo.name} by ${modelInfo.provider}. Use your strengths in ${modelInfo.quality.toLowerCase()} quality responses.`;
            }
        }
        
        prompt += `

User Notes:
${notes}

Please generate a comprehensive slide outline based on these notes.`;

        return prompt;
    }

    /**
     * Validate outline structure
     * @param {Object} outline - Outline to validate
     */
    validateOutline(outline) {
        if (!outline || typeof outline !== 'object') {
            throw new Error('Invalid outline format');
        }
        
        if (!outline.slides || !Array.isArray(outline.slides)) {
            throw new Error('Outline must contain slides array');
        }
        
        if (outline.slides.length === 0) {
            throw new Error('Outline must contain at least one slide');
        }
        
        // Validate each slide
        outline.slides.forEach((slide, index) => {
            if (!slide.title || typeof slide.title !== 'string') {
                throw new Error(`Slide ${index + 1} must have a title`);
            }
            
            if (!slide.slideNumber || typeof slide.slideNumber !== 'number') {
                slide.slideNumber = index + 1;
            }
        });
    }

    /**
     * Enable or disable the component
     * @param {boolean} enabled - Whether to enable the component
     */
    setEnabled(enabled) {
        this.generateButton.disabled = !enabled || this.isProcessing;
        
        if (enabled) {
            this.generateButton.classList.remove('disabled');
        } else {
            this.generateButton.classList.add('disabled');
        }
    }

    /**
     * Reset component state
     */
    reset() {
        this.stopProcessing();
        this.processingStatus.classList.add('hidden');
        this.processingStatus.classList.remove('success', 'error', 'pulsing');
        this.updateButtonState();
    }

    /**
     * Cleanup component
     */
    destroy() {
        if (this.currentRequest) {
            this.cancelProcessing();
        }
        
        this.reset();
    }
}

// Create and export singleton instance
const aiProcessing = new AIProcessing();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = aiProcessing;
}
