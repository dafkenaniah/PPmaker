// Configuration for the PowerPoint Generator App v2.0
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
                supportedModels: [
                    'gpt-5',           // Smartest, fastest model with expert-level intelligence
                    'gpt-5-codex',     // GPT-5 variant optimized for agentic coding tasks
                    'gpt-5-mini',      // Faster, cost-efficient version of GPT-5
                    'gpt-5-nano',      // Fastest, most cost-efficient version of GPT-5
                    'gpt-4.1',         // Fast, highly intelligent model with 1M token context
                    'gpt-4o',          // Flagship multimodal model (text, vision, audio)
                    'gpt-4o-mini',     // Compact GPT-4o variant for cost efficiency
                    'o1',              // Previous generation reasoning model
                    'o1-mini'          // Faster, cheaper STEM-focused reasoning model
                ],
                imageEndpoint: '/v1/images/generations',
                imageModels: ['gpt-image-1']  // Professional-grade images with excellent text rendering
            },
            'https://gateway.ai.studios.playstation.com/anthropic': {
                name: 'PSS AI Gateway - Anthropic',
                endpoint: '/v1/messages',
                authType: 'x-api-key',
                supportedModels: [
                    'claude-sonnet-4-5-20250929',    // Best for complex agents and coding, highest intelligence
                    'claude-opus-4-1-20250805',      // Exceptional for specialized complex tasks
                    'claude-3-5-haiku-20241022'      // Fastest model, optimized for quick responses
                ]
            },
            'https://gateway.ai.studios.playstation.com/anthropic-oai': {
                name: 'PSS AI Gateway - Anthropic (OpenAI Compatible)',
                endpoint: '/v1/messages',
                authType: 'bearer',
                supportedModels: [
                    'claude-sonnet-4-5-20250929',
                    'claude-opus-4-1-20250805', 
                    'claude-3-5-haiku-20241022'
                ]
            },
            'https://gateway.ai.studios.playstation.com/gemini': {
                name: 'PSS AI Gateway - Gemini',
                endpoint: '/v1beta/models/{model}:generateContent',
                authType: 'x-goog-api-key',
                supportedModels: [
                    'gemini-2.5-pro',          // Most powerful thinking model; complex reasoning
                    'gemini-2.5-flash',        // Price-performance optimized; large scale processing
                    'gemini-2.5-flash-lite',   // Cost-efficient; high throughput
                    'gemini-1.5-pro',          // Previous generation with 2 hours video / 19 hours audio
                    'gemini-1.5-flash',        // Previous generation versatile model
                    'gemini-1.5-flash-8b'      // Small 8B model for simpler tasks
                ]
            },
            'https://gateway.ai.studios.playstation.com/gemini-oai': {
                name: 'PSS AI Gateway - Gemini (OpenAI Compatible)',
                endpoint: '/chat/completions',
                authType: 'bearer',
                supportedModels: [
                    'gemini-2.5-pro',
                    'gemini-2.5-flash', 
                    'gemini-2.5-flash-lite',
                    'gemini-1.5-pro',
                    'gemini-1.5-flash',
                    'gemini-1.5-flash-8b'
                ]
            }
        },
        
        // Image Generation Configuration
        IMAGE_GENERATION: {
            ENDPOINT: '/v1/images/generations',
            MODELS: {
                'gpt-image-1': 'Professional-grade images with excellent text rendering',
                'gpt-4o': 'Built into GPT-4o; leverages chat context for inspiration'
            },
            DEFAULT_MODEL: 'gpt-image-1'
        },

        // Default configuration - Updated to latest models
        DEFAULT_GATEWAY: 'https://gateway.ai.studios.playstation.com/openai',
        DEFAULT_MODEL: 'gpt-5',  // Updated to GPT-5 for best performance
        MEETING_MODEL: 'claude-sonnet-4-5-20250929',  // Claude Sonnet 4.5 excels at complex content analysis
        MAX_TOKENS: 4000,  // Increased for more comprehensive responses
        TEMPERATURE: 0.3   // Lower temperature for more consistent, factual outputs
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
    
    // AI Prompt Templates - Optimized for v2.0
    PROMPTS: {
        // Enhanced slide outline generation with meeting focus
        SLIDE_OUTLINE: `You are an expert presentation designer specializing in preserving meeting context for future reference.

CRITICAL: When generating status update presentations, ensure ALL important topics are bulletized for easy scanning.

Return ONLY this JSON structure:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "content": ["Key context points"],
      "bullets": ["• Important topic 1", "• Critical decision 2", "• Action item 3"],
      "presenterNotes": "Full context and background details",
      "slideType": "title|agenda|content|decisions|actions|conclusion",
      "importance": "high|medium|low",
      "tags": ["decision", "action", "update", "blocker"]
    }
  ],
  "totalSlides": number,
  "estimatedDuration": "X minutes",
  "meetingContext": {
    "type": "status|planning|review|decision",
    "keyDecisions": ["Decision 1", "Decision 2"],
    "actionItems": ["Action 1 - Owner", "Action 2 - Owner"],
    "importantTopics": ["Topic 1", "Topic 2", "Topic 3"],
    "blockers": ["Blocker 1", "Blocker 2"]
  }
}

REQUIREMENTS:
• Bulletize ALL important topics for easy scanning
• Preserve meeting context in presenterNotes
• Include decision makers and action item owners
• Flag high-priority items clearly
• Structure for future reference value
• Maximum 8 slides for focused delivery

Notes: {USER_NOTES}`,

        // Specialized meeting processing prompt
        MEETING_ANALYSIS: `You are a meeting analysis expert. Transform this meeting content into a comprehensive presentation that preserves all critical information for stakeholders.

OBJECTIVE: Create a status update presentation where important topics are clearly bulletized and all context is preserved.

Return ONLY this JSON:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Meeting Summary",
      "bullets": ["• Key outcome 1", "• Important decision 2", "• Critical update 3"],
      "content": ["Context and details"],
      "presenterNotes": "Full meeting context for reference",
      "slideType": "summary",
      "speakers": ["John", "Sarah"],
      "timestamp": "Meeting timeframe"
    }
  ],
  "meetingSummary": "Concise overview of meeting outcomes",
  "keyDecisions": ["• Decision 1 - made by [Name]", "• Decision 2 - agreed by team"],
  "actionItems": ["• Task 1 - assigned to [Name] - due [Date]", "• Task 2 - owner [Name]"],
  "importantTopics": ["• Topic 1", "• Topic 2", "• Topic 3"],
  "blockers": ["• Blocker 1 - needs resolution", "• Blocker 2 - escalation required"],
  "nextSteps": ["• Step 1", "• Step 2", "• Step 3"],
  "participants": ["Name 1", "Name 2"],
  "totalSlides": number,
  "estimatedDuration": "X minutes"
}

CRITICAL REQUIREMENTS:
• BULLETIZE all important topics with • symbols
• Preserve complete context in presenterNotes
• Identify decision makers and task owners
• Include timestamps where available
• Structure for future reference and follow-up
• Highlight blockers and escalation needs

Meeting Content: {MEETING_CONTENT}`,

        // Status update specific prompt
        STATUS_UPDATE: `You are creating a status update presentation that will be referenced later. Focus on bulletizing important topics and preserving all context.

Create slides that answer: What happened? What was decided? What's next?

JSON Structure:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Status Update Summary",
      "bullets": ["• Progress update 1", "• Key milestone 2", "• Important change 3"],
      "content": ["Supporting details"],
      "presenterNotes": "Complete context for future reference",
      "slideType": "status",
      "priority": "high|medium|low"
    }
  ],
  "statusSummary": "Overall project/team status",
  "achievements": ["• Completed item 1", "• Delivered feature 2"],
  "challenges": ["• Challenge 1 - mitigation plan", "• Risk 2 - owner"],
  "upcomingMilestones": ["• Milestone 1 - date", "• Deliverable 2 - timeline"],
  "resourceNeeds": ["• Resource request 1", "• Support needed 2"],
  "decisions": ["• Decision 1", "• Approval 2"],
  "totalSlides": number
}

Focus: {FOCUS_AREA}
Content: {CONTENT}`,

        PYTHON_SCRIPT: `Generate a complete Python script using python-pptx library to create a professional PowerPoint presentation.

Requirements:
- Use provided slide outline data
- Professional formatting with consistent styling
- Bulletized content properly formatted
- Handle text overflow gracefully
- Include error handling and logging
- Modern, clean template design
- Preserve all meeting context in notes

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
