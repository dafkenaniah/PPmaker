// Configuration Manager Component
class ConfigurationManager {
    constructor() {
        this.currentConfig = {
            gatewayUrl: CONFIG.AI_GATEWAY.DEFAULT_GATEWAY,
            aiModel: CONFIG.AI_GATEWAY.DEFAULT_MODEL,
            temperature: CONFIG.AI_GATEWAY.TEMPERATURE,
            maxTokens: CONFIG.AI_GATEWAY.MAX_TOKENS,
            timeout: 60000
        };
        this.defaultConfig = { ...this.currentConfig };
        this.availableGateways = CONFIG.AI_GATEWAY.GATEWAYS;
        this.availableModels = {
            // OpenAI Models - Latest v2.0
            'gpt-5': {
                name: 'GPT-5',
                provider: 'OpenAI',
                contextLength: 200000,
                speed: 'Fast',
                quality: 'Excellent',
                badge: 'recommended'
            },
            'gpt-5-codex': {
                name: 'GPT-5 Codex',
                provider: 'OpenAI',
                contextLength: 200000,
                speed: 'Fast',
                quality: 'Excellent',
                badge: 'coding'
            },
            'gpt-5-mini': {
                name: 'GPT-5 Mini',
                provider: 'OpenAI',
                contextLength: 200000,
                speed: 'Very Fast',
                quality: 'Good',
                badge: 'fast'
            },
            'gpt-5-nano': {
                name: 'GPT-5 Nano',
                provider: 'OpenAI',
                contextLength: 200000,
                speed: 'Very Fast',
                quality: 'Good',
                badge: 'fast'
            },
            'gpt-4.1': {
                name: 'GPT-4.1',
                provider: 'OpenAI',
                contextLength: 1000000,
                speed: 'Fast',
                quality: 'Excellent',
                badge: 'balanced'
            },
            'gpt-4o': {
                name: 'GPT-4o',
                provider: 'OpenAI',
                contextLength: 128000,
                speed: 'Fast',
                quality: 'Excellent',
                badge: 'multimodal'
            },
            'gpt-4o-mini': {
                name: 'GPT-4o Mini',
                provider: 'OpenAI',
                contextLength: 128000,
                speed: 'Very Fast',
                quality: 'Good',
                badge: 'fast'
            },
            'o1': {
                name: 'o1',
                provider: 'OpenAI',
                contextLength: 128000,
                speed: 'Slow',
                quality: 'Excellent',
                badge: 'reasoning'
            },
            'o1-mini': {
                name: 'o1 Mini',
                provider: 'OpenAI',
                contextLength: 128000,
                speed: 'Medium',
                quality: 'Very Good',
                badge: 'reasoning'
            },
            
            // Anthropic Models - Latest v2.0
            'claude-sonnet-4-5-20250929': {
                name: 'Claude Sonnet 4.5',
                provider: 'Anthropic',
                contextLength: 200000,
                speed: 'Fast',
                quality: 'Excellent',
                badge: 'recommended'
            },
            'claude-opus-4-1-20250805': {
                name: 'Claude Opus 4.1',
                provider: 'Anthropic',
                contextLength: 200000,
                speed: 'Medium',
                quality: 'Excellent',
                badge: 'premium'
            },
            'claude-3-5-haiku-20241022': {
                name: 'Claude Haiku 3.5',
                provider: 'Anthropic',
                contextLength: 200000,
                speed: 'Very Fast',
                quality: 'Good',
                badge: 'fast'
            },
            
            // Google Models - Latest v2.0
            'gemini-2.5-pro': {
                name: 'Gemini 2.5 Pro',
                provider: 'Google',
                contextLength: 1000000,
                speed: 'Fast',
                quality: 'Excellent',
                badge: 'multimodal'
            },
            'gemini-2.5-flash': {
                name: 'Gemini 2.5 Flash',
                provider: 'Google',
                contextLength: 1000000,
                speed: 'Very Fast',
                quality: 'Very Good',
                badge: 'fast'
            },
            'gemini-2.5-flash-lite': {
                name: 'Gemini 2.5 Flash Lite',
                provider: 'Google',
                contextLength: 1000000,
                speed: 'Very Fast',
                quality: 'Good',
                badge: 'fast'
            },
            'gemini-1.5-pro': {
                name: 'Gemini 1.5 Pro',
                provider: 'Google',
                contextLength: 1000000,
                speed: 'Fast',
                quality: 'Very Good',
                badge: 'balanced'
            },
            'gemini-1.5-flash': {
                name: 'Gemini 1.5 Flash',
                provider: 'Google',
                contextLength: 1000000,
                speed: 'Very Fast',
                quality: 'Good',
                badge: 'fast'
            },
            'gemini-1.5-flash-8b': {
                name: 'Gemini 1.5 Flash 8B',
                provider: 'Google',
                contextLength: 1000000,
                speed: 'Very Fast',
                quality: 'Good',
                badge: 'fast'
            }
        };
        this.init();
    }

    /**
     * Initialize configuration manager
     */
    init() {
        this.setupGatewaySelection();
        this.setupModelSelection();
        this.setupAdvancedSettings();
        this.setupConnectionTest();
        this.setupSaveButton();
        this.setupResetButton();
        this.loadSavedConfig();
    }

    /**
     * Set up gateway selection
     */
    setupGatewaySelection() {
        this.initializeGatewayDropdown();
    }

    /**
     * Initialize gateway dropdown (alias for setupGatewaySelection)
     */
    initializeGatewayDropdown() {
        const gatewaySelect = document.getElementById('gateway-url-select');
        if (gatewaySelect) {
            // Populate gateway options
            gatewaySelect.innerHTML = '';
            Object.entries(this.availableGateways).forEach(([url, info]) => {
                const option = document.createElement('option');
                option.value = url;
                option.textContent = info.name;
                gatewaySelect.appendChild(option);
            });
            
            // Set current value
            gatewaySelect.value = this.currentConfig.gatewayUrl;
            
            // Add change listener
            gatewaySelect.addEventListener('change', (e) => {
                this.handleGatewaySelection(e.target.value);
            });
            
            console.log('Gateway dropdown initialized with', Object.keys(this.availableGateways).length, 'gateways');
        } else {
            console.warn('Gateway select element not found: gateway-url-select');
        }
    }

    /**
     * Handle gateway selection
     * @param {string} gatewayUrl - Selected gateway URL
     */
    handleGatewaySelection(gatewayUrl) {
        if (!this.availableGateways[gatewayUrl]) {
            console.warn('Invalid gateway selected:', gatewayUrl);
            return;
        }

        this.currentConfig.gatewayUrl = gatewayUrl;
        
        // Filter available models based on selected gateway
        this.updateAvailableModels();
        
        console.log('Gateway selected:', gatewayUrl);
    }

    /**
     * Update available models based on selected gateway
     */
    updateAvailableModels() {
        this.updateModelDropdown();
    }

    /**
     * Update model dropdown (alias for updateAvailableModels)
     */
    updateModelDropdown() {
        const gatewayInfo = this.availableGateways[this.currentConfig.gatewayUrl];
        if (!gatewayInfo) {
            console.warn('No gateway info found for:', this.currentConfig.gatewayUrl);
            return;
        }

        const supportedModels = gatewayInfo.supportedModels || [];
        console.log('Updating models for gateway:', gatewayInfo.name, 'Supported models:', supportedModels);
        
        // Hide/show model cards based on supported models
        document.querySelectorAll('.model-card').forEach(card => {
            const radio = card.querySelector('.model-radio');
            if (radio) {
                const modelId = radio.value;
                if (supportedModels.includes(modelId)) {
                    card.style.display = 'block';
                    radio.disabled = false;
                } else {
                    card.style.display = 'none';
                    radio.disabled = true;
                    
                    // If this was the selected model, switch to first supported model
                    if (modelId === this.currentConfig.aiModel) {
                        const firstSupported = supportedModels[0];
                        if (firstSupported) {
                            this.handleModelSelection(firstSupported);
                        }
                    }
                }
            }
        });
    }

    /**
     * Set up model selection
     */
    setupModelSelection() {
        const modelCards = document.querySelectorAll('.model-card');
        const modelRadios = document.querySelectorAll('input[name="ai-model"]');
        
        modelCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const radio = card.querySelector('.model-radio');
                if (radio && e.target !== radio) {
                    radio.checked = true;
                    this.handleModelSelection(radio.value);
                }
            });
        });
        
        modelRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.handleModelSelection(e.target.value);
                }
            });
        });
    }

    /**
     * Set up advanced settings
     */
    setupAdvancedSettings() {
        // Temperature slider
        const temperatureSlider = document.getElementById('temperature-slider');
        if (temperatureSlider) {
            temperatureSlider.addEventListener('input', (e) => {
                this.currentConfig.temperature = parseFloat(e.target.value);
                this.updateSliderLabels();
            });
        }

        // Max tokens select
        const maxTokensSelect = document.getElementById('max-tokens-input');
        if (maxTokensSelect) {
            maxTokensSelect.addEventListener('change', (e) => {
                this.currentConfig.maxTokens = parseInt(e.target.value);
            });
        }

        // Timeout select
        const timeoutSelect = document.getElementById('timeout-input');
        if (timeoutSelect) {
            timeoutSelect.addEventListener('change', (e) => {
                this.currentConfig.timeout = parseInt(e.target.value);
            });
        }
    }

    /**
     * Set up connection test
     */
    setupConnectionTest() {
        const testBtn = document.getElementById('test-connection-btn');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.testConnection();
            });
        }
    }

    /**
     * Set up save button
     */
    setupSaveButton() {
        const saveBtn = document.getElementById('save-config-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveConfiguration();
            });
        }
    }

    /**
     * Set up reset button
     */
    setupResetButton() {
        const resetBtn = document.getElementById('reset-config-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetConfiguration();
            });
        }
    }

    /**
     * Handle model selection
     * @param {string} modelId - Selected model ID
     */
    handleModelSelection(modelId) {
        if (!this.availableModels[modelId]) {
            console.warn('Invalid model selected:', modelId);
            return;
        }

        this.currentConfig.aiModel = modelId;
        
        // Update UI
        this.updateModelCards();
        
        console.log('Model selected:', modelId);
    }

    /**
     * Update model card UI
     */
    updateModelCards() {
        document.querySelectorAll('.model-card').forEach(card => {
            card.classList.remove('selected');
            const radio = card.querySelector('.model-radio');
            if (radio && radio.value === this.currentConfig.aiModel) {
                card.classList.add('selected');
                radio.checked = true;
            }
        });
    }

    /**
     * Update slider labels based on current value
     */
    updateSliderLabels() {
        const slider = document.getElementById('temperature-slider');
        if (!slider) return;

        const value = parseFloat(slider.value);
        const labels = slider.parentNode.querySelector('.slider-labels');
        
        if (labels) {
            const spans = labels.querySelectorAll('span');
            spans.forEach(span => span.style.fontWeight = 'normal');
            
            if (value <= 0.3) {
                spans[0].style.fontWeight = 'bold';
            } else if (value <= 0.7) {
                spans[1].style.fontWeight = 'bold';
            } else {
                spans[2].style.fontWeight = 'bold';
            }
        }
    }

    /**
     * Test connection to AI service
     */
    async testConnection() {
        if (window.logger) {
            window.logger.log('info', '[CONFIG] Test Connection button clicked');
            window.logger.log('debug', '[CONFIG] Current configuration:', this.currentConfig);
        }

        const testBtn = document.getElementById('test-connection-btn');
        const statusDiv = document.getElementById('connection-status');
        const statusText = document.getElementById('connection-text');
        
        if (!testBtn || !statusDiv || !statusText) {
            if (window.logger) {
                window.logger.log('error', '[CONFIG] Missing UI elements for connection test', {
                    testBtn: !!testBtn,
                    statusDiv: !!statusDiv,
                    statusText: !!statusText
                });
            }
            return;
        }

        try {
            // Show testing state
            testBtn.disabled = true;
            statusDiv.classList.remove('hidden', 'success', 'error');
            statusDiv.classList.add('show');
            statusText.textContent = 'Testing connection...';

            if (window.logger) {
                window.logger.log('info', '[CONFIG] Starting connection test with gateway:', this.currentConfig.gatewayUrl);
                window.logger.log('debug', '[CONFIG] Test configuration:', {
                    gatewayUrl: this.currentConfig.gatewayUrl,
                    model: this.currentConfig.aiModel,
                    temperature: this.currentConfig.temperature,
                    maxTokens: this.currentConfig.maxTokens
                });
            }

            // Test the connection
            const testResult = await this.performConnectionTest();
            
            if (window.logger) {
                window.logger.log('info', '[CONFIG] Connection test result:', testResult);
            }
            
            if (testResult.success) {
                statusDiv.classList.add('success');
                statusText.textContent = `Connection successful! Response time: ${testResult.responseTime}ms`;
                if (window.logger) {
                    window.logger.log('info', '[CONFIG] Connection test SUCCESS', {
                        responseTime: testResult.responseTime,
                        response: testResult.response
                    });
                }
            } else {
                statusDiv.classList.add('error');
                statusText.textContent = `Connection failed: ${testResult.error}`;
                if (window.logger) {
                    window.logger.log('error', '[CONFIG] Connection test FAILED', {
                        error: testResult.error,
                        responseTime: testResult.responseTime
                    });
                }
            }

        } catch (error) {
            console.error('Connection test error:', error);
            if (window.logger) {
                window.logger.log('error', '[CONFIG] Connection test exception:', {
                    message: error.message,
                    stack: error.stack
                });
            }
            statusDiv.classList.add('error');
            statusText.textContent = 'Connection test failed. Please check your settings.';
        } finally {
            testBtn.disabled = false;
            
            // Hide status after 5 seconds
            setTimeout(() => {
                statusDiv.classList.add('hidden');
            }, 5000);
        }
    }

    /**
     * Perform actual connection test
     * @returns {Promise<Object>} Test result
     */
    async performConnectionTest() {
        try {
            // Update AI service with current configuration
            if (window.aiService) {
                window.aiService.updateConfig({
                    gatewayUrl: this.currentConfig.gatewayUrl,
                    model: this.currentConfig.aiModel,
                    temperature: this.currentConfig.temperature,
                    maxTokens: this.currentConfig.maxTokens
                });
                
                // Use AI service to test connection
                const result = await window.aiService.testConnection(this.currentConfig.gatewayUrl);
                return result;
            } else {
                // Fallback to direct API call if aiService is not available
                return await this.performDirectConnectionTest();
            }
        } catch (error) {
            console.error('Connection test error:', error);
            return {
                success: false,
                error: error.message || 'Unknown error occurred',
                responseTime: 0
            };
        }
    }

    /**
     * Perform direct connection test (fallback)
     * @returns {Promise<Object>} Test result
     */
    async performDirectConnectionTest() {
        const startTime = Date.now();
        
        try {
            // Create a simple test prompt
            const testPrompt = 'Respond with "Connection test successful" if you can read this message.';
            
            // Get current configuration
            const gatewayUrl = this.currentConfig.gatewayUrl || CONFIG.AI_GATEWAY.DEFAULT_GATEWAY;
            const gatewayInfo = CONFIG.AI_GATEWAY.GATEWAYS[gatewayUrl];
            
            if (!gatewayInfo) {
                throw new Error('Invalid gateway configuration');
            }
            
            // Prepare request URL and headers
            let requestUrl = gatewayUrl + gatewayInfo.endpoint;
            
            // Handle Gemini direct endpoint with model substitution
            if (gatewayInfo.endpoint.includes('{model}')) {
                requestUrl = requestUrl.replace('{model}', this.currentConfig.aiModel);
            }
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Set authentication header based on gateway type
            if (gatewayInfo.authType === 'bearer') {
                headers['Authorization'] = `Bearer ${CONFIG.AI_GATEWAY.API_KEY}`;
            } else if (gatewayInfo.authType === 'x-api-key') {
                headers['x-api-key'] = CONFIG.AI_GATEWAY.API_KEY;
            } else if (gatewayInfo.authType === 'x-goog-api-key') {
                headers['x-goog-api-key'] = CONFIG.AI_GATEWAY.API_KEY;
            }
            
            // Prepare request payload based on gateway type
            let requestPayload;
            
            if (gatewayInfo.endpoint.includes('generateContent')) {
                // Gemini direct format
                requestPayload = {
                    contents: [
                        {
                            parts: [{ text: testPrompt }]
                        }
                    ],
                    generationConfig: {
                        maxOutputTokens: 50,
                        temperature: 0.1
                    }
                };
            } else if (gatewayInfo.endpoint.includes('/v1/messages')) {
                // Anthropic direct format
                requestPayload = {
                    model: this.currentConfig.aiModel,
                    max_tokens: 50,
                    messages: [
                        {
                            role: 'user',
                            content: testPrompt
                        }
                    ]
                };
            } else {
                // OpenAI format (default)
                requestPayload = {
                    model: this.currentConfig.aiModel,
                    messages: [
                        {
                            role: 'user',
                            content: testPrompt
                        }
                    ],
                    max_tokens: 50,
                    temperature: 0.1
                };
            }
            
            console.log('Testing connection to:', requestUrl);
            console.log('Request headers:', headers);
            console.log('Request payload:', requestPayload);
            
            // Make the request
            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestPayload)
            });
            
            const responseTime = Date.now() - startTime;
            
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unable to read error response');
                console.error('API Error:', errorText);
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${errorText}`,
                    responseTime: responseTime
                };
            }
            
            const data = await response.json();
            console.log('API Response:', data);
            
            // Handle different response formats
            let responseContent = null;
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                // OpenAI format
                responseContent = data.choices[0].message.content;
            } else if (data.content && Array.isArray(data.content)) {
                // Anthropic format
                responseContent = data.content[0].text;
            } else if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                // Gemini format
                responseContent = data.candidates[0].content.parts[0].text;
            }
            
            if (responseContent) {
                return {
                    success: true,
                    responseTime: responseTime,
                    response: responseContent
                };
            } else {
                return {
                    success: false,
                    error: 'Invalid response format from AI service',
                    responseTime: responseTime
                };
            }
            
        } catch (error) {
            console.error('Direct connection test error:', error);
            return {
                success: false,
                error: error.message || 'Unknown error occurred',
                responseTime: Date.now() - startTime
            };
        }
    }

    /**
     * Get current configuration
     * @returns {Object} Current configuration
     */
    getCurrentConfig() {
        return { ...this.currentConfig };
    }

    /**
     * Get model information
     * @param {string} modelId - Model ID
     * @returns {Object|null} Model information
     */
    getModelInfo(modelId) {
        return this.availableModels[modelId] || null;
    }

    /**
     * Get current model information
     * @returns {Object|null} Current model information
     */
    getCurrentModelInfo() {
        return this.getModelInfo(this.currentConfig.aiModel);
    }

    /**
     * Set configuration
     * @param {Object} config - Configuration to set
     */
    setConfiguration(config) {
        // Validate and merge configuration
        if (config.gatewayUrl && this.availableGateways[config.gatewayUrl]) {
            this.currentConfig.gatewayUrl = config.gatewayUrl;
        }
        
        if (config.aiModel && this.availableModels[config.aiModel]) {
            this.currentConfig.aiModel = config.aiModel;
        }
        
        if (typeof config.temperature === 'number' && config.temperature >= 0 && config.temperature <= 1) {
            this.currentConfig.temperature = config.temperature;
        }
        
        if (typeof config.maxTokens === 'number' && config.maxTokens > 0) {
            this.currentConfig.maxTokens = config.maxTokens;
        }
        
        if (typeof config.timeout === 'number' && config.timeout > 0) {
            this.currentConfig.timeout = config.timeout;
        }
        
        // Update UI
        this.updateUI();
    }

    /**
     * Update UI with current configuration
     */
    updateUI() {
        // Update model selection
        this.updateModelCards();
        
        // Update temperature slider
        const temperatureSlider = document.getElementById('temperature-slider');
        if (temperatureSlider) {
            temperatureSlider.value = this.currentConfig.temperature;
            this.updateSliderLabels();
        }
        
        // Update max tokens select
        const maxTokensSelect = document.getElementById('max-tokens-input');
        if (maxTokensSelect) {
            maxTokensSelect.value = this.currentConfig.maxTokens;
        }
        
        // Update timeout select
        const timeoutSelect = document.getElementById('timeout-input');
        if (timeoutSelect) {
            timeoutSelect.value = this.currentConfig.timeout;
        }
    }

    /**
     * Save configuration
     */
    saveConfiguration() {
        try {
            const configToSave = {
                ...this.currentConfig,
                savedAt: new Date().toISOString()
            };
            
            localStorage.setItem('powerpoint_generator_config', JSON.stringify(configToSave));
            
            // Update AI service configuration
            if (window.aiService && typeof window.aiService.updateConfig === 'function') {
                window.aiService.updateConfig(this.currentConfig);
            }
            
            // Show success notification
            if (window.app && typeof window.app.showNotification === 'function') {
                const modelInfo = this.getCurrentModelInfo();
                window.app.showNotification(
                    `Configuration saved! Using ${modelInfo?.name || this.currentConfig.aiModel}`,
                    'success'
                );
            }
            
            console.log('Configuration saved:', configToSave);
            
        } catch (error) {
            console.error('Failed to save configuration:', error);
            
            if (window.app && typeof window.app.showNotification === 'function') {
                window.app.showNotification('Failed to save configuration', 'error');
            }
        }
    }

    /**
     * Load saved configuration
     */
    loadSavedConfig() {
        this.loadConfiguration();
    }

    /**
     * Load configuration (alias for loadSavedConfig)
     */
    loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem('powerpoint_generator_config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                this.setConfiguration(config);
                console.log('Loaded configuration:', config);
            } else {
                console.log('No saved configuration found, using defaults');
            }
        } catch (error) {
            console.warn('Failed to load saved configuration:', error);
        }
    }

    /**
     * Reset configuration to defaults
     */
    resetConfiguration() {
        const confirmed = confirm('Are you sure you want to reset all configuration settings to defaults?');
        if (!confirmed) return;
        
        // Reset to defaults
        this.currentConfig = { ...this.defaultConfig };
        
        // Update UI
        this.updateUI();
        
        // Clear saved configuration
        try {
            localStorage.removeItem('powerpoint_generator_config');
        } catch (error) {
            console.warn('Failed to clear saved configuration:', error);
        }
        
        // Show notification
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification('Configuration reset to defaults', 'success');
        }
        
        console.log('Configuration reset to defaults');
    }

    /**
     * Get configuration for AI service
     * @returns {Object} AI service configuration
     */
    getAIServiceConfig() {
        return {
            model: this.currentConfig.aiModel,
            temperature: this.currentConfig.temperature,
            maxTokens: this.currentConfig.maxTokens,
            timeout: this.currentConfig.timeout
        };
    }

    /**
     * Validate configuration
     * @param {Object} config - Configuration to validate
     * @returns {Object} Validation result
     */
    validateConfiguration(config) {
        const errors = [];
        
        if (config.aiModel && !this.availableModels[config.aiModel]) {
            errors.push(`Invalid AI model: ${config.aiModel}`);
        }
        
        if (typeof config.temperature === 'number' && (config.temperature < 0 || config.temperature > 1)) {
            errors.push('Temperature must be between 0 and 1');
        }
        
        if (typeof config.maxTokens === 'number' && config.maxTokens <= 0) {
            errors.push('Max tokens must be greater than 0');
        }
        
        if (typeof config.timeout === 'number' && config.timeout <= 0) {
            errors.push('Timeout must be greater than 0');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Export configuration
     * @returns {Object} Exportable configuration
     */
    exportConfiguration() {
        return {
            config: { ...this.currentConfig },
            availableModels: this.availableModels,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import configuration
     * @param {Object} configData - Configuration data to import
     */
    importConfiguration(configData) {
        if (configData.config) {
            const validation = this.validateConfiguration(configData.config);
            if (validation.valid) {
                this.setConfiguration(configData.config);
                this.saveConfiguration();
            } else {
                console.error('Invalid configuration:', validation.errors);
                if (window.app && typeof window.app.showNotification === 'function') {
                    window.app.showNotification(
                        `Invalid configuration: ${validation.errors.join(', ')}`,
                        'error'
                    );
                }
            }
        }
    }

    /**
     * Get available models
     * @returns {Object} Available models
     */
    getAvailableModels() {
        return { ...this.availableModels };
    }

    /**
     * Add custom model
     * @param {string} modelId - Model ID
     * @param {Object} modelInfo - Model information
     */
    addCustomModel(modelId, modelInfo) {
        if (!modelId || !modelInfo) {
            console.error('Invalid model data');
            return;
        }
        
        this.availableModels[modelId] = {
            name: modelInfo.name || modelId,
            provider: modelInfo.provider || 'Custom',
            contextLength: modelInfo.contextLength || 4000,
            speed: modelInfo.speed || 'Unknown',
            quality: modelInfo.quality || 'Unknown',
            badge: modelInfo.badge || 'custom'
        };
        
        console.log('Added custom model:', modelId);
    }

    /**
     * Remove custom model
     * @param {string} modelId - Model ID to remove
     */
    removeCustomModel(modelId) {
        if (this.availableModels[modelId]) {
            delete this.availableModels[modelId];
            
            // If this was the current model, switch to default
            if (this.currentConfig.aiModel === modelId) {
                this.currentConfig.aiModel = this.defaultConfig.aiModel;
                this.updateUI();
            }
            
            console.log('Removed custom model:', modelId);
        }
    }

    /**
     * Reset configuration manager
     */
    reset() {
        this.currentConfig = { ...this.defaultConfig };
        this.updateUI();
    }

    /**
     * Destroy configuration manager
     */
    destroy() {
        this.reset();
        // Clean up event listeners would go here
    }
}

// Create global instance
const configurationManager = new ConfigurationManager();

// Make globally available
window.configurationManager = configurationManager;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigurationManager;
}
