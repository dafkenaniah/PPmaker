// Configuration for the PowerPoint Generator App
const CONFIG = {
    // AI Gateway Configuration
    AI_GATEWAY: {
        API_KEY: 'YPiXGinbEM6lr63dJgJm5Sp8Xty0uFhl',
        
        // Available gateway URLs with their supported models and endpoints
        GATEWAYS: {
            'https://gateway.ai.studios.playstation.com/openai': {
                name: 'PSS AI Gateway - OpenAI',
                endpoint: '/v1/chat/completions',
                authType: 'bearer',
                supportedModels: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1', 'gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini']
            },
            'https://gateway.ai.studios.playstation.com/anthropic': {
                name: 'PSS AI Gateway - Anthropic',
                endpoint: '/v1/messages',
                authType: 'x-api-key',
                supportedModels: ['claude-opus-4-1', 'claude-sonnet-4-0', 'claude-3-5-haiku-latest']
            },
            'https://gateway.ai.studios.playstation.com/anthropic-oai': {
                name: 'PSS AI Gateway - Anthropic (OpenAI Compatible)',
                endpoint: '/v1/messages',
                authType: 'bearer',
                supportedModels: ['claude-opus-4-1-20250805', 'claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022']
            },
            'https://gateway.ai.studios.playstation.com/gemini': {
                name: 'PSS AI Gateway - Gemini',
                endpoint: '/v1beta/models/{model}:generateContent',
                authType: 'x-goog-api-key',
                supportedModels: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b']
            },
            'https://gateway.ai.studios.playstation.com/gemini-oai': {
                name: 'PSS AI Gateway - Gemini (OpenAI Compatible)',
                endpoint: '/chat/completions',
                authType: 'bearer',
                supportedModels: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.5-flash-8b']
            }
        },
        
        // DALL-E Configuration
        DALL_E: {
            ENDPOINT: '/v1/images/generations',
            MODEL: 'dall-e-3'
        },

        // Default configuration
        DEFAULT_GATEWAY: 'https://gateway.ai.studios.playstation.com/openai',
        DEFAULT_MODEL: 'gpt-4o',
        MAX_TOKENS: 2000,
        TEMPERATURE: 0.7
    },
    
    // Backend API Configuration
    BACKEND_API: {
        BASE_URL: 'http://localhost:3001/api',
        ENDPOINTS: {
            GENERATE_PYTHON: '/generate-python',
            EXECUTE_PYTHON: '/execute-python',
            DOWNLOAD: '/download'
        }
    },
    
    // Application Settings
    APP: {
        MIN_NOTES_LENGTH: 100,
        MAX_NOTES_LENGTH: 10000,
        AUTO_SAVE_INTERVAL: 30000, // 30 seconds
        PROCESSING_TIMEOUT: 120000, // 2 minutes
        
        // UI Settings
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 500
    },
    
    // AI Prompt Templates
    PROMPTS: {
        SLIDE_OUTLINE: `You are a presentation expert. Convert these notes into a structured PowerPoint outline.

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
  "estimatedDuration": "X minutes",
  "theme": "professional"
}

Notes to convert: {USER_NOTES}

Focus on:
- Clear, concise slide titles
- Logical flow and organization  
- Appropriate bullet point breakdown
- Professional presentation structure
- Maximum 10 slides for optimal presentation length`,

        PYTHON_SCRIPT: `Generate a complete Python script using python-pptx library to create a PowerPoint presentation.

Requirements:
- Use the provided slide outline data
- Create professional-looking slides
- Handle text sizing to prevent overflow
- Apply consistent formatting
- Include error handling
- Use a clean, modern template

Slide data: {SLIDE_DATA}

Return only the Python script code, no explanations.`
    },
    
    // Error Messages
    ERRORS: {
        NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
        AI_API_ERROR: 'AI service is temporarily unavailable. Please try again.',
        PYTHON_EXECUTION_ERROR: 'Failed to generate PowerPoint. Please try again.',
        FILE_GENERATION_ERROR: 'Failed to create presentation file.',
        VALIDATION_ERROR: 'Please enter at least 100 characters of notes.',
        TIMEOUT_ERROR: 'Request timed out. Please try again.',
        GENERIC_ERROR: 'An unexpected error occurred. Please try again.'
    },
    
    // Success Messages
    SUCCESS: {
        OUTLINE_GENERATED: 'Slide outline generated successfully!',
        POWERPOINT_CREATED: 'PowerPoint presentation created successfully!',
        FILE_DOWNLOADED: 'Presentation downloaded successfully!'
    }
};

// Export configuration for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
