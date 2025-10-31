// AI Service for handling API calls to PlayStation Studios AI Gateway
class AIService {
    constructor() {
        this.apiKey = CONFIG.AI_GATEWAY.API_KEY;
        this.defaultGateway = CONFIG.AI_GATEWAY.DEFAULT_GATEWAY;
        this.defaultModel = CONFIG.AI_GATEWAY.DEFAULT_MODEL;
        this.maxTokens = CONFIG.AI_GATEWAY.MAX_TOKENS;
        this.temperature = CONFIG.AI_GATEWAY.TEMPERATURE;
        this.availableGateways = CONFIG.AI_GATEWAY.GATEWAYS;
        this.currentConfig = {
            gatewayUrl: this.defaultGateway,
            model: this.defaultModel,
            temperature: this.temperature,
            maxTokens: this.maxTokens
        };
    }

    /**
     * Generate slide outline from user notes using AI
     * @param {string} notes - User's presentation notes
     * @param {string} model - AI model to use (optional)
     * @returns {Promise<Object>} - Generated slide outline
     */
    async generateSlideOutline(notes, model = this.defaultModel) {
        try {
            const prompt = CONFIG.PROMPTS.SLIDE_OUTLINE.replace('{USER_NOTES}', notes);
            
            const response = await this.callAI({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: this.maxTokens,
                temperature: this.temperature
            });

            // Parse the AI response to extract JSON - Enhanced for v2.0
            const content = response.choices[0].message.content;
            console.log('AI Response Content:', content);
            
            // Try multiple parsing strategies for latest models
            let slideOutline;
            
            // Strategy 1: Look for JSON within code blocks
            let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                try {
                    slideOutline = JSON.parse(jsonMatch[1]);
                } catch (e) {
                    console.warn('Failed to parse JSON from code block:', e);
                }
            }
            
            // Strategy 2: Look for any JSON object
            if (!slideOutline) {
                jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        slideOutline = JSON.parse(jsonMatch[0]);
                    } catch (e) {
                        console.warn('Failed to parse JSON object:', e);
                    }
                }
            }
            
            // Strategy 3: Try parsing the entire response as JSON
            if (!slideOutline) {
                try {
                    slideOutline = JSON.parse(content.trim());
                } catch (e) {
                    console.warn('Failed to parse entire content as JSON:', e);
                }
            }
            
            if (!slideOutline) {
                console.error('Could not extract JSON from AI response. Full content:', content);
                console.error('Content length:', content.length);
                console.error('First 500 chars:', content.substring(0, 500));
                console.error('Last 500 chars:', content.substring(Math.max(0, content.length - 500)));
                throw new Error('Invalid AI response format - no valid JSON found');
            }
            
            console.log('Successfully parsed JSON outline:', slideOutline);
            
            // Validate the response structure
            this.validateSlideOutline(slideOutline);
            
            return slideOutline;
        } catch (error) {
            console.error('Error generating slide outline:', error);
            throw new Error(CONFIG.ERRORS.AI_API_ERROR);
        }
    }

    /**
     * Analyze existing PowerPoint and generate improved outline
     * @param {Object} presentationContent - Extracted presentation content
     * @param {string} userInstructions - User's improvement instructions
     * @param {string} model - AI model to use (optional)
     * @returns {Promise<Object>} - Generated improved slide outline
     */
    async analyzeAndImprovePresentation(presentationContent, userInstructions, model = this.defaultModel) {
        try {
            const prompt = this.buildPresentationAnalysisPrompt(presentationContent, userInstructions);
            
            const response = await this.callAI({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: this.maxTokens,
                temperature: this.temperature
            });

            // Parse the AI response to extract JSON
            const content = response.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (!jsonMatch) {
                throw new Error('Invalid AI response format');
            }

            const slideOutline = JSON.parse(jsonMatch[0]);
            
            // Validate the response structure
            this.validateSlideOutline(slideOutline);
            
            return slideOutline;
        } catch (error) {
            console.error('Error analyzing presentation:', error);
            // Don't throw error here - let the FileUploadManager handle fallback
            throw new Error('AI service is temporarily unavailable. Please try again.');
        }
    }

    /**
     * Build optimized prompt for presentation analysis and improvement
     * @param {Object} presentationContent - Current presentation content
     * @param {string} userInstructions - User's instructions
     * @returns {string} - Optimized AI prompt
     */
    buildPresentationAnalysisPrompt(presentationContent, userInstructions) {
        const slideSummary = presentationContent.slides.map(slide => {
            // Handle different content types (string, array, object)
            let contentText = '';
            if (typeof slide.content === 'string') {
                contentText = slide.content;
            } else if (Array.isArray(slide.content)) {
                contentText = slide.content.join(' ');
            } else if (slide.content && typeof slide.content === 'object') {
                contentText = JSON.stringify(slide.content);
            } else {
                contentText = slide.content || '';
            }
            
            return `Slide ${slide.slide_number}: "${slide.title}"\nContent: ${contentText.substring(0, 200)}...`;
        }).join('\n\n');

        return `
TASK: Analyze existing PowerPoint presentation and generate an improved outline

CURRENT PRESENTATION:
Title: ${presentationContent.title || 'Untitled Presentation'}
Total Slides: ${presentationContent.slides.length}

EXISTING SLIDES:
${slideSummary}

USER INSTRUCTIONS: "${userInstructions}"

ANALYSIS REQUIREMENTS:
1. Review the existing presentation structure and content
2. Identify strengths and areas for improvement
3. Consider the user's specific instructions
4. Generate a comprehensive improved outline that:
   - Maintains the core message and purpose
   - Improves flow and structure
   - Enhances content quality and clarity
   - Adds relevant information where needed
   - Removes redundant or weak content

OUTPUT FORMAT - Return ONLY valid JSON in this exact structure:
{
  "title": "Improved Presentation Title",
  "theme": "professional",
  "totalSlides": 8,
  "estimatedDuration": "15 minutes",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "slideType": "title",
      "bullets": [
        "Main point 1",
        "Main point 2",
        "Main point 3"
      ],
      "content": [
        "Detailed explanation or additional context",
        "Supporting information",
        "Key insights"
      ],
      "presenterNotes": "Notes for the presenter"
    }
  ]
}

GUIDELINES:
- Use slideType: "title" for opening slide, "content" for main slides, "conclusion" for closing
- Include 3-5 bullet points per slide maximum
- Make bullets actionable and specific
- Add presenter notes with delivery tips
- Ensure logical flow between slides
- Professional, business-appropriate language
- Create compelling, engaging content

Generate an improved outline that addresses the user's instructions while enhancing the overall presentation quality.
`;
    }

    /**
     * Generate Python script for PowerPoint creation
     * @param {Object} slideData - Slide outline data
     * @param {string} model - AI model to use (optional)
     * @returns {Promise<string>} - Generated Python script
     */
    async generatePythonScript(slideData, model = this.defaultModel) {
        try {
            const prompt = CONFIG.PROMPTS.PYTHON_SCRIPT.replace(
                '{SLIDE_DATA}', 
                JSON.stringify(slideData, null, 2)
            );
            
            const response = await this.callAI({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: this.maxTokens,
                temperature: 0.3 // Lower temperature for more consistent code generation
            });

            const pythonScript = response.choices[0].message.content;
            
            // Basic validation of Python script
            if (!pythonScript.includes('python-pptx') && !pythonScript.includes('pptx')) {
                throw new Error('Generated script does not appear to be valid Python-pptx code');
            }

            return pythonScript;
        } catch (error) {
            console.error('Error generating Python script:', error);
            throw new Error(CONFIG.ERRORS.AI_API_ERROR);
        }
    }

    /**
     * Update AI service configuration
     * @param {Object} config - New configuration
     */
    updateConfig(config) {
        if (config.gatewayUrl && this.availableGateways[config.gatewayUrl]) {
            this.currentConfig.gatewayUrl = config.gatewayUrl;
        }
        if (config.model) {
            this.currentConfig.model = config.model;
        }
        if (typeof config.temperature === 'number') {
            this.currentConfig.temperature = config.temperature;
        }
        if (typeof config.maxTokens === 'number') {
            this.currentConfig.maxTokens = config.maxTokens;
        }
        
        console.log('AI Service configuration updated:', this.currentConfig);
    }

    /**
     * Get current gateway configuration
     * @returns {Object} Gateway configuration
     */
    getCurrentGatewayConfig() {
        const gatewayUrl = this.currentConfig.gatewayUrl || this.defaultGateway;
        return this.availableGateways[gatewayUrl];
    }

    /**
     * Make API call to AI Gateway
     * @param {Object} payload - Request payload
     * @param {string} gatewayUrl - Optional gateway URL override
     * @returns {Promise<Object>} - API response
     */
    async callAI(payload, gatewayUrl = null) {
        const requestId = Math.random().toString(36).substr(2, 9);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.APP.PROCESSING_TIMEOUT);

        if (window.logger) {
            window.logger.log('info', `[AI_SERVICE] Starting API call ${requestId}`, {
                payload: payload,
                gatewayUrl: gatewayUrl,
                currentConfig: this.currentConfig
            });
        }

        try {
            // Get gateway configuration
            const selectedGateway = gatewayUrl || this.currentConfig.gatewayUrl || this.defaultGateway;
            const gatewayConfig = this.availableGateways[selectedGateway];
            
            if (!gatewayConfig) {
                const error = `Invalid gateway configuration: ${selectedGateway}`;
                if (window.logger) {
                    window.logger.log('error', `[AI_SERVICE] ${requestId} - ${error}`, {
                        selectedGateway: selectedGateway,
                        availableGateways: Object.keys(this.availableGateways)
                    });
                }
                throw new Error(error);
            }

            // Construct request URL
            let requestUrl = selectedGateway + gatewayConfig.endpoint;
            
            // Handle Gemini direct endpoint with model substitution
            if (gatewayConfig.endpoint.includes('{model}')) {
                const model = payload.model || this.currentConfig.model;
                requestUrl = requestUrl.replace('{model}', model);
            }

            // Construct headers
            const headers = {
                'Content-Type': 'application/json'
            };

            // Set authentication header based on gateway type
            switch (gatewayConfig.authType) {
                case 'bearer':
                    headers['Authorization'] = `Bearer ${this.apiKey}`;
                    break;
                case 'x-api-key':
                    headers['x-api-key'] = this.apiKey;
                    break;
                case 'x-goog-api-key':
                    headers['x-goog-api-key'] = this.apiKey;
                    break;
                default:
                    const authError = `Unknown auth type: ${gatewayConfig.authType}`;
                    if (window.logger) {
                        window.logger.log('error', `[AI_SERVICE] ${requestId} - ${authError}`, {
                            gatewayConfig: gatewayConfig
                        });
                    }
                    throw new Error(authError);
            }

            // Adapt payload for different gateway types
            let requestBody = { ...payload };
            
            // Handle latest model parameter requirements
            const model = payload.model || this.currentConfig.model;
            const isLatestModel = this.isLatestModel(model);
            
            if (gatewayConfig.endpoint.includes('generateContent')) {
                // Gemini direct format
                requestBody = {
                    contents: [
                        {
                            parts: payload.messages.map(msg => ({ text: msg.content }))
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: payload.max_tokens || this.currentConfig.maxTokens,
                        temperature: payload.temperature || this.currentConfig.temperature
                    }
                };
            } else if (gatewayConfig.endpoint.includes('/v1/messages')) {
                // Anthropic direct format  
                requestBody = {
                    model: model,
                    max_tokens: payload.max_tokens || this.currentConfig.maxTokens,
                    messages: payload.messages
                };
            } else {
                // OpenAI format - handle latest model parameter differences
                if (isLatestModel) {
                    // Use max_completion_tokens for latest models (GPT-5, o1, etc.)
                    requestBody.max_completion_tokens = payload.max_tokens || this.currentConfig.maxTokens;
                    delete requestBody.max_tokens;
                    
                    // Latest models only support default temperature (1) - remove custom temperature
                    delete requestBody.temperature;
                } else {
                    // Use max_tokens for older models
                    requestBody.max_tokens = payload.max_tokens || this.currentConfig.maxTokens;
                    // Keep custom temperature for older models
                    requestBody.temperature = payload.temperature || this.currentConfig.temperature;
                }
            }

            if (window.logger) {
                window.logger.log('debug', `[AI_SERVICE] ${requestId} - Request details`, {
                    url: requestUrl,
                    headers: headers,
                    bodySize: JSON.stringify(requestBody).length,
                    gatewayName: gatewayConfig.name,
                    authType: gatewayConfig.authType
                });
            }

            console.log('Making AI request to:', requestUrl);
            console.log('Request headers:', headers);
            console.log('Request body:', requestBody);

            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (window.logger) {
                window.logger.log('debug', `[AI_SERVICE] ${requestId} - Response received`, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries())
                });
            }

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unable to read error response');
                console.error('API Error Response:', errorText);
                
                if (window.logger) {
                    window.logger.log('error', `[AI_SERVICE] ${requestId} - API Error`, {
                        status: response.status,
                        statusText: response.statusText,
                        errorText: errorText,
                        url: requestUrl
                    });
                }
                
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const responseData = await response.json();
            console.log('AI Response:', responseData);

            if (window.logger) {
                window.logger.log('info', `[AI_SERVICE] ${requestId} - Success`, {
                    responseSize: JSON.stringify(responseData).length,
                    hasChoices: !!(responseData.choices),
                    hasCandidates: !!(responseData.candidates),
                    hasContent: !!(responseData.content)
                });
            }

            // Normalize response format for different gateways
            return this.normalizeResponse(responseData, gatewayConfig);

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (window.logger) {
                window.logger.log('error', `[AI_SERVICE] ${requestId} - Exception`, {
                    error: error.message,
                    stack: error.stack,
                    isAbortError: error.name === 'AbortError',
                    isFetchError: error.message.includes('fetch')
                });
            }
            
            if (error.name === 'AbortError') {
                throw new Error(CONFIG.ERRORS.TIMEOUT_ERROR);
            }
            
            if (error.message.includes('fetch')) {
                throw new Error(CONFIG.ERRORS.NETWORK_ERROR);
            }
            
            throw error;
        }
    }

    /**
     * Normalize response format from different gateways
     * @param {Object} response - Raw API response
     * @param {Object} gatewayConfig - Gateway configuration
     * @returns {Object} Normalized response
     */
    normalizeResponse(response, gatewayConfig) {
        // OpenAI format (used by OpenAI and OpenAI-compatible endpoints)
        if (response.choices && response.choices[0] && response.choices[0].message) {
            return response;
        }
        
        // Anthropic direct format
        if (response.content && Array.isArray(response.content)) {
            return {
                choices: [
                    {
                        message: {
                            content: response.content[0].text,
                            role: 'assistant'
                        }
                    }
                ]
            };
        }
        
        // Gemini direct format
        if (response.candidates && response.candidates[0] && response.candidates[0].content) {
            const content = response.candidates[0].content.parts[0].text;
            return {
                choices: [
                    {
                        message: {
                            content: content,
                            role: 'assistant'
                        }
                    }
                ]
            };
        }
        
        // If we can't normalize, return as-is and hope for the best
        console.warn('Unable to normalize response format:', response);
        return response;
    }

    /**
     * Validate slide outline structure
     * @param {Object} outline - Slide outline to validate
     */
    validateSlideOutline(outline) {
        if (!outline || typeof outline !== 'object') {
            throw new Error('Invalid outline structure');
        }

        if (!Array.isArray(outline.slides) || outline.slides.length === 0) {
            throw new Error('Outline must contain at least one slide');
        }

        // Validate each slide
        outline.slides.forEach((slide, index) => {
            if (!slide.title || typeof slide.title !== 'string') {
                throw new Error(`Slide ${index + 1} missing valid title`);
            }
            
            if (!Array.isArray(slide.bullets)) {
                slide.bullets = [];
            }
            
            if (!Array.isArray(slide.content)) {
                slide.content = [];
            }
            
            if (!slide.slideType) {
                slide.slideType = 'content';
            }
            
            if (!slide.presenterNotes) {
                slide.presenterNotes = '';
            }
        });

        // Ensure required fields exist
        if (!outline.totalSlides) {
            outline.totalSlides = outline.slides.length;
        }
        
        if (!outline.estimatedDuration) {
            outline.estimatedDuration = `${Math.ceil(outline.slides.length * 1.5)} minutes`;
        }
        
        if (!outline.theme) {
            outline.theme = 'professional';
        }
    }

    /**
     * Test AI service connectivity
     * @param {string} gatewayUrl - Optional gateway URL to test
     * @returns {Promise<Object>} - Connection test result
     */
    async testConnection(gatewayUrl = null) {
        const startTime = Date.now();
        
        if (window.logger) {
            window.logger.log('info', '[AI_SERVICE] Starting connection test', {
                gatewayUrl: gatewayUrl || this.currentConfig.gatewayUrl,
                model: this.currentConfig.model || this.defaultModel,
                currentConfig: this.currentConfig
            });
        }
        
        try {
            const testPayload = {
                model: this.currentConfig.model || this.defaultModel,
                messages: [
                    {
                        role: 'user',
                        content: 'Hello, please respond with "OK" to test the connection.'
                    }
                ],
                max_tokens: 10,
                temperature: 0
            };

            if (window.logger) {
                window.logger.log('debug', '[AI_SERVICE] Test payload prepared:', testPayload);
            }

            const response = await this.callAI(testPayload, gatewayUrl);

            const responseTime = Date.now() - startTime;
            const success = response && response.choices && response.choices.length > 0;

            const result = {
                success: success,
                responseTime: responseTime,
                response: success ? response.choices[0].message.content : null
            };

            if (window.logger) {
                window.logger.log('info', '[AI_SERVICE] Connection test completed', {
                    success: success,
                    responseTime: responseTime,
                    responseContent: result.response
                });
            }

            return result;
        } catch (error) {
            console.error('AI service connection test failed:', error);
            
            if (window.logger) {
                window.logger.log('error', '[AI_SERVICE] Connection test failed', {
                    error: error.message,
                    stack: error.stack,
                    responseTime: Date.now() - startTime
                });
            }
            
            return {
                success: false,
                responseTime: Date.now() - startTime,
                error: error.message
            };
        }
    }

    /**
     * Get available models for current gateway
     * @param {string} gatewayUrl - Optional gateway URL
     * @returns {Array<string>} - List of available models
     */
    getAvailableModels(gatewayUrl = null) {
        const selectedGateway = gatewayUrl || this.currentConfig.gatewayUrl || this.defaultGateway;
        const gatewayConfig = this.availableGateways[selectedGateway];
        
        if (gatewayConfig && gatewayConfig.supportedModels) {
            return gatewayConfig.supportedModels;
        }
        
        // Fallback to all models
        const allModels = new Set();
        Object.values(this.availableGateways).forEach(gateway => {
            if (gateway.supportedModels) {
                gateway.supportedModels.forEach(model => allModels.add(model));
            }
        });
        
        return Array.from(allModels);
    }

    /**
     * Get available gateways
     * @returns {Object} Available gateways
     */
    getAvailableGateways() {
        return { ...this.availableGateways };
    }

    /**
     * Set current gateway
     * @param {string} gatewayUrl - Gateway URL to use
     */
    setGateway(gatewayUrl) {
        if (this.availableGateways[gatewayUrl]) {
            this.currentConfig.gatewayUrl = gatewayUrl;
            console.log('Gateway changed to:', gatewayUrl);
        } else {
            console.error('Invalid gateway URL:', gatewayUrl);
        }
    }

    /**
     * Set current model
     * @param {string} model - Model to use
     */
    setModel(model) {
        this.currentConfig.model = model;
        console.log('Model changed to:', model);
    }

    /**
     * Estimate token count for text
     * @param {string} text - Text to estimate
     * @returns {number} - Estimated token count
     */
    estimateTokens(text) {
        // Rough estimation: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    /**
     * Check if text exceeds token limit
     * @param {string} text - Text to check
     * @returns {boolean} - Whether text exceeds limit
     */
    exceedsTokenLimit(text) {
        return this.estimateTokens(text) > this.maxTokens;
    }

    /**
     * Check if model is one of the latest that requires max_completion_tokens
     * @param {string} model - Model to check
     * @returns {boolean} - Whether model requires max_completion_tokens
     */
    isLatestModel(model) {
        // Latest models that require max_completion_tokens instead of max_tokens
        const latestModels = [
            'gpt-5',
            'gpt-5-codex', 
            'gpt-5-mini',
            'gpt-5-nano',
            'gpt-4.1',
            'o1',
            'o1-mini'
        ];
        
        return latestModels.includes(model);
    }
}

// Create and export singleton instance
const aiService = new AIService();

// Make globally available
window.aiService = aiService;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = aiService;
}
