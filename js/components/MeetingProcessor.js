// Meeting Processor Component - Handles meeting transcription to PowerPoint conversion
class MeetingProcessor {
    constructor() {
        this.currentMeetingType = 'meeting';
        this.meetingContent = '';
        this.processingOptions = {
            extractActionItems: true,
            identifySpeakers: true,
            extractDecisions: false,
            timelineStructure: false,
            topicGrouping: true,
            includeContext: false
        };
        this.meetingContext = {
            type: 'general',
            duration: '',
            participants: null
        };
        this.isProcessing = false;
        this.currentOutline = null;
        
        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        this.setupEventListeners();
        this.setupMeetingTypeCards();
        this.setupProcessingOptions();
        this.loadSampleData();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Meeting content input
        const meetingInput = document.getElementById('meeting-content-input');
        if (meetingInput) {
            meetingInput.addEventListener('input', (e) => {
                this.handleContentInput(e.target.value);
            });
        }

        // Context inputs
        const contextSelect = document.getElementById('meeting-context-select');
        if (contextSelect) {
            contextSelect.addEventListener('change', (e) => {
                this.meetingContext.type = e.target.value;
            });
        }

        const durationInput = document.getElementById('meeting-duration');
        if (durationInput) {
            durationInput.addEventListener('input', (e) => {
                this.meetingContext.duration = e.target.value;
            });
        }

        const participantsInput = document.getElementById('meeting-participants');
        if (participantsInput) {
            participantsInput.addEventListener('input', (e) => {
                this.meetingContext.participants = parseInt(e.target.value) || null;
            });
        }

        // Action buttons
        const clearBtn = document.getElementById('clear-meeting-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearContent();
            });
        }

        const sampleBtn = document.getElementById('sample-meeting-btn');
        if (sampleBtn) {
            sampleBtn.addEventListener('click', () => {
                this.loadSampleContent();
            });
        }

        const generateBtn = document.getElementById('generate-meeting-ppt-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateMeetingPresentation();
            });
        }

        const regenerateBtn = document.getElementById('regenerate-meeting-outline-btn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                this.regenerateOutline();
            });
        }

        const createBtn = document.getElementById('create-meeting-powerpoint-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.createPowerPoint();
            });
        }
    }

    /**
     * Set up meeting type cards
     */
    setupMeetingTypeCards() {
        const typeCards = document.querySelectorAll('.meeting-type-card');
        typeCards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectMeetingType(card.dataset.type);
            });
        });
    }

    /**
     * Set up processing options
     */
    setupProcessingOptions() {
        const options = [
            'extract-action-items',
            'identify-speakers', 
            'extract-decisions',
            'timeline-structure',
            'topic-grouping',
            'include-context'
        ];

        options.forEach(optionId => {
            const checkbox = document.getElementById(optionId);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    const optionKey = optionId.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    this.processingOptions[optionKey] = e.target.checked;
                });
            }
        });
    }

    /**
     * Select meeting type
     * @param {string} type - Meeting type (meeting, slack, teams)
     */
    selectMeetingType(type) {
        this.currentMeetingType = type;
        
        // Update UI
        document.querySelectorAll('.meeting-type-card').forEach(card => {
            card.classList.remove('active');
        });
        
        const selectedCard = document.querySelector(`[data-type="${type}"]`);
        if (selectedCard) {
            selectedCard.classList.add('active');
        }

        // Update title and placeholder
        this.updateInputTitle(type);
        this.updatePlaceholder(type);
    }

    /**
     * Update input title based on meeting type
     * @param {string} type - Meeting type
     */
    updateInputTitle(type) {
        const titleElement = document.getElementById('meeting-input-title');
        if (!titleElement) return;

        const titles = {
            meeting: 'Meeting Transcription',
            slack: 'Slack Conversation',
            teams: 'Teams Chat'
        };

        titleElement.textContent = titles[type] || 'Meeting Content';
    }

    /**
     * Update placeholder text based on meeting type
     * @param {string} type - Meeting type
     */
    updatePlaceholder(type) {
        const input = document.getElementById('meeting-content-input');
        if (!input) return;

        const placeholders = {
            meeting: `Paste your meeting transcription here...

For best results, include:
• Speaker names and timestamps
• Key decisions made
• Action items discussed
• Important topics covered

Example format:
[10:00] John: Let's discuss the Q4 roadmap...
[10:05] Sarah: I think we should prioritize the mobile features...
[10:10] Mike: What about the performance improvements?`,

            slack: `Paste your Slack conversation here...

For best results, include:
• Usernames and timestamps
• Thread context
• Key decisions and agreements
• Action items and assignments

Example format:
John Smith 10:00 AM
Let's discuss the Q4 roadmap for our mobile app

Sarah Johnson 10:05 AM
I think we should prioritize the new user onboarding flow

Mike Chen 10:10 AM
What about the performance improvements we discussed?`,

            teams: `Paste your Teams chat here...

For best results, include:
• Participant names and timestamps
• Meeting context
• Key decisions and next steps
• Important discussion points

Example format:
John Smith 10:00 AM
Let's review the sprint goals for next quarter

Sarah Johnson 10:05 AM
We need to focus on the mobile experience improvements

Mike Chen 10:10 AM
I'll take the lead on the performance optimization tasks`
        };

        input.placeholder = placeholders[type] || placeholders.meeting;
    }

    /**
     * Handle content input changes
     * @param {string} content - Input content
     */
    handleContentInput(content) {
        this.meetingContent = content;
        this.updateStats(content);
        this.updateGenerateButton();
    }

    /**
     * Update character and word count
     * @param {string} content - Content to analyze
     */
    updateStats(content) {
        const charCount = document.getElementById('meeting-char-count');
        const wordCount = document.getElementById('meeting-word-count');

        if (charCount) {
            charCount.textContent = content.length.toLocaleString();
        }

        if (wordCount) {
            const words = content.trim() ? content.trim().split(/\s+/).length : 0;
            wordCount.textContent = words.toLocaleString();
        }
    }

    /**
     * Update generate button state
     */
    updateGenerateButton() {
        const generateBtn = document.getElementById('generate-meeting-ppt-btn');
        if (!generateBtn) return;

        const hasContent = this.meetingContent.trim().length >= 200;
        generateBtn.disabled = !hasContent || this.isProcessing;

        if (hasContent && !this.isProcessing) {
            generateBtn.classList.remove('disabled');
            generateBtn.title = 'Convert meeting content to PowerPoint presentation';
        } else {
            generateBtn.classList.add('disabled');
            generateBtn.title = hasContent ? 'Processing...' : 'Please enter at least 200 characters of meeting content';
        }
    }

    /**
     * Clear all content
     */
    clearContent() {
        const input = document.getElementById('meeting-content-input');
        if (input) {
            input.value = '';
            this.handleContentInput('');
        }

        // Reset context
        this.meetingContext = {
            type: 'general',
            duration: '',
            participants: null
        };

        // Reset UI
        const contextSelect = document.getElementById('meeting-context-select');
        if (contextSelect) contextSelect.value = 'general';

        const durationInput = document.getElementById('meeting-duration');
        if (durationInput) durationInput.value = '';

        const participantsInput = document.getElementById('meeting-participants');
        if (participantsInput) participantsInput.value = '';

        // Hide sections
        this.hideOutlineSection();
        this.hideGenerationSection();
    }

    /**
     * Load sample content based on meeting type
     */
    loadSampleContent() {
        const samples = this.getSampleContent();
        const sample = samples[this.currentMeetingType];

        const input = document.getElementById('meeting-content-input');
        if (input && sample) {
            input.value = sample.content;
            this.handleContentInput(sample.content);

            // Set sample context
            if (sample.context) {
                const contextSelect = document.getElementById('meeting-context-select');
                if (contextSelect) contextSelect.value = sample.context.type;

                const durationInput = document.getElementById('meeting-duration');
                if (durationInput) durationInput.value = sample.context.duration;

                const participantsInput = document.getElementById('meeting-participants');
                if (participantsInput) participantsInput.value = sample.context.participants;

                this.meetingContext = { ...sample.context };
            }
        }
    }

    /**
     * Get sample content for different meeting types
     * @returns {Object} Sample content
     */
    getSampleContent() {
        return {
            meeting: {
                content: `[09:00] Project Manager: Good morning everyone. Let's start our sprint planning meeting. We have several key features to discuss for the upcoming release.

[09:02] Lead Developer: Thanks for organizing this. I've reviewed the backlog and we have some interesting challenges ahead, especially with the new user authentication system.

[09:05] UX Designer: I've completed the wireframes for the onboarding flow. The user testing showed a 40% improvement in completion rates with the new design.

[09:08] Product Owner: That's excellent news. Our main priorities for this sprint should be:
- Implementing the new authentication system
- Completing the mobile responsive design
- Setting up the analytics dashboard
- Bug fixes from the previous release

[09:12] QA Engineer: I've identified 15 critical bugs from the last release that need immediate attention. The authentication issues are blocking several user workflows.

[09:15] Lead Developer: I can assign two developers to work on the authentication system. We should be able to complete it within the first week of the sprint.

[09:18] Marketing Manager: From a business perspective, we need to ensure the analytics dashboard is ready for the product launch next month. Our stakeholders are expecting detailed user engagement metrics.

[09:22] Project Manager: Let's set our sprint goals:
1. Complete authentication system implementation
2. Fix all critical bugs
3. Finish mobile responsive design
4. Deliver analytics dashboard MVP

[09:25] UX Designer: I'll work closely with the development team to ensure the design implementation matches our specifications.

[09:28] Product Owner: We also need to consider the performance implications. The new features shouldn't slow down the application.

[09:30] Lead Developer: Agreed. I'll set up performance monitoring and we'll run load tests before the release.

[09:32] Project Manager: Perfect. Let's schedule daily standups at 9 AM and plan for a sprint review in two weeks. Any questions or concerns?

[09:35] QA Engineer: I'll need access to the staging environment by Wednesday to start testing the new features.

[09:37] Project Manager: I'll make sure that's set up. Thanks everyone for a productive meeting. Let's make this sprint a success!`,
                context: {
                    type: 'planning',
                    duration: '37 minutes',
                    participants: 6
                }
            },

            slack: {
                content: `John Smith 9:00 AM
Hey team! 👋 Ready to discuss our Q4 mobile app roadmap?

Sarah Johnson 9:02 AM
Absolutely! I've been working on the user research findings. We have some interesting insights about user behavior patterns.

Mike Chen 9:03 AM
Great timing. I just finished the technical feasibility analysis for the features we discussed last week.

John Smith 9:05 AM
Perfect! Let's start with the key priorities. Based on our user feedback, I think we should focus on:
1. Improving app performance
2. Adding dark mode
3. Enhanced notification system
4. Better offline functionality

Sarah Johnson 9:08 AM
The user research strongly supports those priorities. 78% of users mentioned performance issues, and 65% specifically requested dark mode.

Mike Chen 9:10 AM
From a technical standpoint, the performance improvements will require some significant backend changes. I estimate about 3-4 weeks of development time.

Lisa Wong 9:12 AM
Just joined! Sorry I'm late. Catching up on the conversation now.

John Smith 9:13 AM
No worries @Lisa Wong! We're discussing Q4 priorities. Your input on the design aspects would be valuable.

Lisa Wong 9:15 AM
Thanks! For dark mode, I've already created some initial mockups. The design system can easily accommodate both light and dark themes.

Sarah Johnson 9:18 AM
That's fantastic! The user testing showed that dark mode could increase user engagement by 25% during evening hours.

Mike Chen 9:20 AM
For the notification system, we'll need to integrate with both iOS and Android native APIs. It's doable but will require careful testing.

John Smith 9:22 AM
What about the offline functionality? How complex would that be to implement?

Mike Chen 9:25 AM
It's moderately complex. We'd need to implement local data caching and sync mechanisms. Probably 2-3 weeks of work.

Lisa Wong 9:27 AM
From a UX perspective, we need to clearly indicate to users when they're in offline mode and what functionality is available.

Sarah Johnson 9:30 AM
Agreed. The research shows users get frustrated when they don't understand why certain features aren't working.

John Smith 9:32 AM
Alright, let's prioritize:
1. Performance improvements (4 weeks)
2. Dark mode (2 weeks)
3. Notification system (3 weeks)
4. Offline functionality (3 weeks)

Mike Chen 9:35 AM
That timeline looks realistic. We can work on dark mode and notifications in parallel.

Lisa Wong 9:37 AM
I'll start working on the detailed designs for all these features. Should have mockups ready by Friday.

Sarah Johnson 9:40 AM
I'll schedule user testing sessions for the new designs once they're ready.

John Smith 9:42 AM
Perfect! Let's schedule a follow-up meeting next week to review progress. Thanks everyone! 🚀`,
                context: {
                    type: 'planning',
                    duration: '42 minutes',
                    participants: 4
                }
            },

            teams: {
                content: `John Smith 10:00 AM
Good morning team! Let's kick off our weekly status update. How is everyone progressing on their current tasks?

Sarah Johnson 10:02 AM
Morning! I've completed the user interface designs for the new dashboard. The client feedback was very positive, and we're ready to move to development.

Mike Chen 10:05 AM
Great work Sarah! On the backend side, I've finished implementing the API endpoints for the dashboard data. All tests are passing and it's ready for integration.

Lisa Wong 10:08 AM
Excellent progress everyone! I've been working on the database optimization. We've improved query performance by 40% which should make the dashboard much more responsive.

John Smith 10:10 AM
That's fantastic news! Any blockers or challenges we need to address?

Sarah Johnson 10:12 AM
I have a question about the mobile responsiveness requirements. The client mentioned they want it to work well on tablets, but we haven't defined the specific breakpoints.

Mike Chen 10:15 AM
I can help with that. I've been researching the most common tablet resolutions. We should target iPad and Android tablet sizes primarily.

Lisa Wong 10:18 AM
From a performance perspective, we might need to implement lazy loading for the dashboard widgets on mobile devices.

John Smith 10:20 AM
Good point. Let's make sure the mobile experience is smooth. What about our timeline? Are we still on track for the Friday delivery?

Sarah Johnson 10:22 AM
I think we're in good shape. I can have the responsive designs ready by Wednesday.

Mike Chen 10:25 AM
The API integration should be complete by Thursday. That gives us a day for testing and bug fixes.

Lisa Wong 10:28 AM
Database changes are already deployed to staging. We can start testing the performance improvements immediately.

John Smith 10:30 AM
Perfect! Let's also make sure we have proper error handling in place. The client specifically mentioned they want graceful degradation if the API is slow.

Mike Chen 10:32 AM
Already implemented! The dashboard will show loading states and fallback to cached data if needed.

Sarah Johnson 10:35 AM
I've also designed empty states and error messages that match the overall design system.

Lisa Wong 10:38 AM
Should we schedule a demo session with the client before the final delivery?

John Smith 10:40 AM
Great idea! I'll reach out to them and see if they're available Thursday afternoon for a preview.

Mike Chen 10:42 AM
That works for me. I'll make sure everything is deployed to the demo environment by Thursday morning.

Sarah Johnson 10:45 AM
I'll prepare a presentation showing the key features and improvements.

John Smith 10:47 AM
Excellent! Looks like we're well-coordinated and on track. Let's reconvene tomorrow for a quick check-in. Great work everyone! 👏`,
                context: {
                    type: 'status',
                    duration: '47 minutes',
                    participants: 4
                }
            }
        };
    }

    /**
     * Generate meeting presentation
     */
    async generateMeetingPresentation() {
        if (this.isProcessing) return;

        try {
            this.startProcessing();
            
            // Build the specialized prompt for meeting content
            const prompt = this.buildMeetingPrompt();
            
            // Get AI configuration
            const config = window.configurationManager ? 
                window.configurationManager.getAIServiceConfig() : 
                {};
            
            // Generate outline using AI service
            this.updateStatus('Analyzing meeting content...');
            
            // Use the AI service's slide outline generation method
            const outline = await aiService.generateSlideOutline(prompt, config.model);
            
            // Validate and store outline
            this.validateMeetingOutline(outline);
            this.currentOutline = outline;
            
            // Show success and display outline
            this.showSuccess(outline);
            this.showOutlineSection(outline);
            
        } catch (error) {
            console.error('Error generating meeting presentation:', error);
            this.showError(error.message || 'Failed to generate presentation from meeting content');
        } finally {
            this.stopProcessing();
        }
    }

    /**
     * Build specialized prompt for meeting content
     * @returns {string} Complete prompt
     */
    buildMeetingPrompt() {
        let prompt = `You are an expert presentation designer specializing in converting meeting content into structured PowerPoint presentations.

Your task is to analyze the following ${this.currentMeetingType} content and create a comprehensive presentation outline.

CONTENT TYPE: ${this.getMeetingTypeDescription()}
MEETING CONTEXT: ${this.meetingContext.type}
${this.meetingContext.duration ? `DURATION: ${this.meetingContext.duration}` : ''}
${this.meetingContext.participants ? `PARTICIPANTS: ${this.meetingContext.participants}` : ''}

PROCESSING INSTRUCTIONS:
${this.getProcessingInstructions()}

Return a JSON object with this exact structure:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "content": ["Main content points"],
      "bullets": ["Bullet point 1", "Bullet point 2"],
      "presenterNotes": "Speaker notes with context",
      "slideType": "title|agenda|content|decisions|actions|conclusion",
      "speakers": ["Speaker names if relevant"],
      "timestamp": "Time reference if available"
    }
  ],
  "totalSlides": number,
  "estimatedDuration": "X minutes",
  "meetingSummary": "Brief summary of the meeting",
  "keyDecisions": ["Decision 1", "Decision 2"],
  "actionItems": ["Action 1", "Action 2"],
  "participants": ["Participant names"]
}

FOCUS ON:
- Clear, professional slide titles
- Logical flow from meeting discussion
- Key decisions and outcomes
- Action items and next steps
- Proper attribution to speakers
- Context for stakeholders who weren't present`;

        // Add audience context if available
        if (window.audienceManager) {
            const audienceModifier = window.audienceManager.generatePromptModifier();
            if (audienceModifier) {
                prompt += audienceModifier;
            }
        }

        // Add model-specific context
        if (window.configurationManager) {
            const modelInfo = window.configurationManager.getCurrentModelInfo();
            if (modelInfo) {
                prompt += `\n\nNote: You are ${modelInfo.name} by ${modelInfo.provider}. Use your strengths in analyzing conversational content and creating structured presentations.`;
            }
        }

        prompt += `\n\nMEETING CONTENT TO ANALYZE:\n${this.meetingContent}`;

        return prompt;
    }

    /**
     * Get meeting type description
     * @returns {string} Description
     */
    getMeetingTypeDescription() {
        const descriptions = {
            meeting: 'meeting transcription or recording',
            slack: 'Slack conversation or thread',
            teams: 'Microsoft Teams chat or meeting discussion'
        };
        return descriptions[this.currentMeetingType] || 'meeting content';
    }

    /**
     * Get processing instructions based on selected options
     * @returns {string} Instructions
     */
    getProcessingInstructions() {
        const instructions = [];

        if (this.processingOptions.extractActionItems) {
            instructions.push('- Extract and highlight all action items, assignments, and next steps');
        }

        if (this.processingOptions.identifySpeakers) {
            instructions.push('- Identify key contributors and attribute important points to speakers');
        }

        if (this.processingOptions.extractDecisions) {
            instructions.push('- Emphasize important decisions, agreements, and conclusions reached');
        }

        if (this.processingOptions.timelineStructure) {
            instructions.push('- Organize content chronologically following the discussion timeline');
        }

        if (this.processingOptions.topicGrouping) {
            instructions.push('- Group related discussion points by topic rather than chronological order');
        }

        if (this.processingOptions.includeContext) {
            instructions.push('- Include background context and meeting purpose for stakeholders');
        }

        return instructions.length > 0 ? instructions.join('\n') : '- Create a clear, structured presentation from the meeting content';
    }

    /**
     * Validate meeting outline structure
     * @param {Object} outline - Outline to validate
     */
    validateMeetingOutline(outline) {
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

        // Ensure meeting-specific fields exist
        if (!outline.meetingSummary) {
            outline.meetingSummary = 'Meeting summary not available';
        }

        if (!outline.keyDecisions) {
            outline.keyDecisions = [];
        }

        if (!outline.actionItems) {
            outline.actionItems = [];
        }
    }

    /**
     * Start processing state
     */
    startProcessing() {
        this.isProcessing = true;
        
        const generateBtn = document.getElementById('generate-meeting-ppt-btn');
        if (generateBtn) {
            generateBtn.textContent = 'Processing...';
            generateBtn.disabled = true;
        }

        const statusDiv = document.getElementById('meeting-processing-status');
        if (statusDiv) {
            statusDiv.classList.remove('hidden');
        }
    }

    /**
     * Stop processing state
     */
    stopProcessing() {
        this.isProcessing = false;
        
        const generateBtn = document.getElementById('generate-meeting-ppt-btn');
        if (generateBtn) {
            generateBtn.textContent = 'Convert to PowerPoint';
            this.updateGenerateButton();
        }

        const statusDiv = document.getElementById('meeting-processing-status');
        if (statusDiv) {
            statusDiv.classList.add('hidden');
        }
    }

    /**
     * Update processing status
     * @param {string} message - Status message
     */
    updateStatus(message) {
        const statusText = document.getElementById('meeting-status-text');
        if (statusText) {
            statusText.textContent = message;
        }
    }

    /**
     * Show success message
     * @param {Object} outline - Generated outline
     */
    showSuccess(outline) {
        const slideCount = outline.slides ? outline.slides.length : 0;
        const message = `Successfully generated presentation with ${slideCount} slides from meeting content`;
        
        this.updateStatus(message);
        
        // Show success styling briefly
        const statusDiv = document.getElementById('meeting-processing-status');
        if (statusDiv) {
            statusDiv.classList.add('success');
            setTimeout(() => {
                statusDiv.classList.remove('success');
            }, 3000);
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.updateStatus(message);
        
        const statusDiv = document.getElementById('meeting-processing-status');
        if (statusDiv) {
            statusDiv.classList.add('error');
            setTimeout(() => {
                statusDiv.classList.remove('error');
            }, 5000);
        }
    }

    /**
     * Show outline section with generated content
     * @param {Object} outline - Generated outline
     */
    showOutlineSection(outline) {
        const outlineSection = document.getElementById('meeting-outline-section');
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

        // Display the outline
        this.displayMeetingOutline(outline);
        
        // Show generation section
        this.showGenerationSection();
    }

    /**
     * Display meeting outline in the preview area
     * @param {Object} outline - Outline to display
     */
    displayMeetingOutline(outline) {
        const previewDiv = document.getElementById('meeting-outline-preview');
        if (!previewDiv) return;

        let html = `
            <div class="meeting-outline-header">
                <div class="outline-summary">
                    <h3>Meeting Summary</h3>
                    <p>${outline.meetingSummary || 'No summary available'}</p>
                </div>
                
                <div class="outline-stats">
                    <div class="stat-item">
                        <span class="stat-number">${outline.totalSlides || outline.slides.length}</span>
                        <span class="stat-label">Slides</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${outline.estimatedDuration || 'N/A'}</span>
                        <span class="stat-label">Duration</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${outline.participants ? outline.participants.length : 'N/A'}</span>
                        <span class="stat-label">Participants</span>
                    </div>
                </div>
            </div>

            <div class="meeting-highlights">
                ${outline.keyDecisions && outline.keyDecisions.length > 0 ? `
                    <div class="highlight-section">
                        <h4>Key Decisions</h4>
                        <ul>
                            ${outline.keyDecisions.map(decision => `<li>${decision}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${outline.actionItems && outline.actionItems.length > 0 ? `
                    <div class="highlight-section">
                        <h4>Action Items</h4>
                        <ul>
                            ${outline.actionItems.map(action => `<li>${action}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>

            <div class="slides-preview">
                <h4>Slide Outline</h4>
                ${outline.slides.map(slide => `
                    <div class="slide-preview-card" data-slide="${slide.slideNumber}">
                        <div class="slide-header">
                            <span class="slide-number">Slide ${slide.slideNumber}</span>
                            <span class="slide-type">${slide.slideType || 'content'}</span>
                            ${slide.speakers && slide.speakers.length > 0 ? `
                                <span class="slide-speakers">👥 ${slide.speakers.join(', ')}</span>
                            ` : ''}
                        </div>
                        <h5 class="slide-title">${slide.title}</h5>
                        ${slide.bullets && slide.bullets.length > 0 ? `
                            <ul class="slide-bullets">
                                ${slide.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                            </ul>
                        ` : ''}
                        ${slide.presenterNotes ? `
                            <div class="presenter-notes">
                                <strong>Notes:</strong> ${slide.presenterNotes}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        previewDiv.innerHTML = html;
    }

    /**
     * Show generation section
     */
    showGenerationSection() {
        const generationSection = document.getElementById('meeting-generation-final-section');
        if (generationSection) {
            generationSection.classList.remove('hidden');
        }
    }

    /**
     * Hide outline section
     */
    hideOutlineSection() {
        const outlineSection = document.getElementById('meeting-outline-section');
        if (outlineSection) {
            outlineSection.classList.add('hidden');
        }
    }

    /**
     * Hide generation section
     */
    hideGenerationSection() {
        const generationSection = document.getElementById('meeting-generation-final-section');
        if (generationSection) {
            generationSection.classList.add('hidden');
        }
    }

    /**
     * Regenerate outline
     */
    async regenerateOutline() {
        if (!this.meetingContent) {
            this.showError('No meeting content to regenerate from');
            return;
        }

        await this.generateMeetingPresentation();
    }

    /**
     * Create PowerPoint from current outline
     */
    async createPowerPoint() {
        if (!this.currentOutline) {
            this.showError('No outline available to create PowerPoint from');
            return;
        }

        try {
            this.startPowerPointGeneration();
            
            // Set the outline in the PowerPoint generation component
            if (window.powerPointGeneration) {
                window.powerPointGeneration.setOutline(this.currentOutline);
                await window.powerPointGeneration.generatePowerPoint();
                this.showPowerPointSuccess({ success: true });
            } else {
                throw new Error('PowerPoint generation component not available');
            }
            
        } catch (error) {
            console.error('Error creating PowerPoint:', error);
            this.showPowerPointError(error.message);
        } finally {
            this.stopPowerPointGeneration();
        }
    }

    /**
     * Start PowerPoint generation
     */
    startPowerPointGeneration() {
        const createBtn = document.getElementById('create-meeting-powerpoint-btn');
        if (createBtn) {
            createBtn.disabled = true;
            createBtn.textContent = 'Creating...';
        }

        const progressDiv = document.getElementById('meeting-generation-progress');
        if (progressDiv) {
            progressDiv.classList.remove('hidden');
        }

        this.updatePowerPointProgress('Generating PowerPoint...', 0);
    }

    /**
     * Stop PowerPoint generation
     */
    stopPowerPointGeneration() {
        const createBtn = document.getElementById('create-meeting-powerpoint-btn');
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.textContent = 'Create PowerPoint';
        }

        const progressDiv = document.getElementById('meeting-generation-progress');
        if (progressDiv) {
            progressDiv.classList.add('hidden');
        }
    }

    /**
     * Update PowerPoint generation progress
     * @param {string} message - Progress message
     * @param {number} percent - Progress percentage
     */
    updatePowerPointProgress(message, percent) {
        const progressText = document.getElementById('meeting-progress-text');
        if (progressText) {
            progressText.textContent = message;
        }

        const progressFill = document.getElementById('meeting-progress-fill');
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
    }

    /**
     * Show PowerPoint success
     * @param {Object} result - Generation result
     */
    showPowerPointSuccess(result) {
        const downloadSection = document.getElementById('meeting-download-section');
        if (downloadSection) {
            downloadSection.classList.remove('hidden');
        }

        const downloadLink = document.getElementById('meeting-download-link');
        if (downloadLink && result.downloadUrl) {
            downloadLink.href = result.downloadUrl;
            downloadLink.download = result.filename || 'meeting-presentation.pptx';
        }

        // Show success notification
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification('Meeting PowerPoint created successfully!', 'success');
        }
    }

    /**
     * Show PowerPoint error
     * @param {string} message - Error message
     */
    showPowerPointError(message) {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(`Failed to create PowerPoint: ${message}`, 'error');
        }
    }

    /**
     * Load sample data on initialization
     */
    loadSampleData() {
        // Initialize with default meeting type
        this.selectMeetingType('meeting');
    }

    /**
     * Get current meeting content
     * @returns {string} Meeting content
     */
    getMeetingContent() {
        return this.meetingContent;
    }

    /**
     * Get current outline
     * @returns {Object|null} Current outline
     */
    getCurrentOutline() {
        return this.currentOutline;
    }

    /**
     * Get processing options
     * @returns {Object} Processing options
     */
    getProcessingOptions() {
        return { ...this.processingOptions };
    }

    /**
     * Get meeting context
     * @returns {Object} Meeting context
     */
    getMeetingContext() {
        return { ...this.meetingContext };
    }

    /**
     * Reset component state
     */
    reset() {
        this.clearContent();
        this.currentOutline = null;
        this.isProcessing = false;
        
        // Reset processing options to defaults
        this.processingOptions = {
            extractActionItems: true,
            identifySpeakers: true,
            extractDecisions: false,
            timelineStructure: false,
            topicGrouping: true,
            includeContext: false
        };

        // Update checkboxes
        Object.keys(this.processingOptions).forEach(key => {
            const checkboxId = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.checked = this.processingOptions[key];
            }
        });
    }

    /**
     * Destroy component
     */
    destroy() {
        this.reset();
        // Event listeners are automatically cleaned up when elements are removed
    }
}

// Create and export singleton instance
const meetingProcessor = new MeetingProcessor();

// Make globally available
window.meetingProcessor = meetingProcessor;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MeetingProcessor;
}
