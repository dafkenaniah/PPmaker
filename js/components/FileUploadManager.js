// File Upload and Update Manager Component
class FileUploadManager {
    constructor() {
        this.uploadedFile = null;
        this.isProcessing = false;
        this.supportedFormats = ['.pptx', '.ppt'];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.init();
    }

    /**
     * Initialize file upload manager
     */
    init() {
        // Prevent double initialization
        if (this.initialized) {
            return;
        }
        this.initialized = true;
        
        this.setupFileInput();
        this.setupDropZone();
        this.setupUpdateButton();
        this.setupRemoveButton();
        this.loadSavedFile();
    }

    /**
     * Set up file input event listeners
     */
    setupFileInput() {
        const fileInput = document.getElementById('ppt-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFileSelection(file);
                }
            });
        }
    }

    /**
     * Set up drag and drop zone
     */
    setupDropZone() {
        const dropZone = document.getElementById('file-drop-zone');
        if (!dropZone) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            }, false);
        });

        // Handle dropped files
        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelection(files[0]);
            }
        }, false);

        // Handle click to browse
        dropZone.addEventListener('click', () => {
            const fileInput = document.getElementById('ppt-file-input');
            if (fileInput) {
                fileInput.click();
            }
        });
    }

    /**
     * Set up update processing button
     */
    setupUpdateButton() {
        const updateBtn = document.getElementById('process-update-btn');
        if (updateBtn) {
            // Create debounced function once if it doesn't exist
            if (!this.debouncedProcessUpdate) {
                this.debouncedProcessUpdate = this.debounce(() => {
                    this.processUpdate();
                }, 2000); // 2 second debounce for more safety
            }
            
            // Remove any existing listeners to prevent duplicates
            updateBtn.removeEventListener('click', this.debouncedProcessUpdate);
            updateBtn.addEventListener('click', this.debouncedProcessUpdate);
        }

        // Monitor update notes input
        const updateInput = document.getElementById('update-notes-input');
        if (updateInput) {
            // Create input handler once if it doesn't exist
            if (!this.inputChangeHandler) {
                this.inputChangeHandler = () => {
                    this.updateButtonState();
                };
            }
            
            updateInput.removeEventListener('input', this.inputChangeHandler);
            updateInput.addEventListener('input', this.inputChangeHandler);
        }
    }

    /**
     * Debounce function to prevent rapid consecutive calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Set up remove file button
     */
    setupRemoveButton() {
        const removeBtn = document.getElementById('remove-file-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeFile();
            });
        }
    }

    /**
     * Prevent default drag behaviors
     * @param {Event} e - Event object
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Handle file selection
     * @param {File} file - Selected file
     */
    async handleFileSelection(file) {
        try {
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.valid) {
                this.showError(validation.error);
                return;
            }

            // Show processing state
            this.showProcessingState('Analyzing file...');

            // Process file
            const fileData = await this.processFile(file);
            
            // Store file data
            this.uploadedFile = {
                file: file,
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                data: fileData
            };

            // Update UI
            this.displayFileInfo();
            this.updateButtonState();
            this.saveFileInfo();

            // Hide processing state
            this.hideProcessingState();

            console.log('File uploaded successfully:', this.uploadedFile.name);

        } catch (error) {
            console.error('File upload error:', error);
            this.showError('Failed to process file. Please try again.');
            this.hideProcessingState();
        }
    }

    /**
     * Validate uploaded file
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFile(file) {
        // Check file type
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!this.supportedFormats.includes(fileExtension)) {
            return {
                valid: false,
                error: `Unsupported file format. Please upload ${this.supportedFormats.join(' or ')} files.`
            };
        }

        // Check file size
        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `File too large. Maximum size is ${Formatters.formatFileSize(this.maxFileSize)}.`
            };
        }

        // Check if file is empty
        if (file.size === 0) {
            return {
                valid: false,
                error: 'File appears to be empty. Please select a valid PowerPoint file.'
            };
        }

        return { valid: true };
    }

    /**
     * Process uploaded file
     * @param {File} file - File to process
     * @returns {Promise<Object>} File data
     */
    async processFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    
                    // Convert to base64 for storage/transmission
                    const base64 = this.arrayBufferToBase64(arrayBuffer);
                    
                    resolve({
                        arrayBuffer: arrayBuffer,
                        base64: base64,
                        processedAt: new Date().toISOString()
                    });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Convert ArrayBuffer to Base64
     * @param {ArrayBuffer} buffer - Buffer to convert
     * @returns {string} Base64 string
     */
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        
        return btoa(binary);
    }

    /**
     * Display file information in UI
     */
    displayFileInfo() {
        const fileInfo = document.getElementById('uploaded-file-info');
        const fileName = document.getElementById('file-name');
        const fileSize = document.getElementById('file-size');
        const dropZone = document.getElementById('file-drop-zone');

        if (this.uploadedFile && fileInfo && fileName && fileSize) {
            fileName.textContent = this.uploadedFile.name;
            fileSize.textContent = Formatters.formatFileSize(this.uploadedFile.size);
            
            fileInfo.classList.remove('hidden');
            if (dropZone) {
                dropZone.style.display = 'none';
            }
        }
    }

    /**
     * Remove uploaded file
     */
    removeFile() {
        this.uploadedFile = null;
        
        // Update UI
        const fileInfo = document.getElementById('uploaded-file-info');
        const dropZone = document.getElementById('file-drop-zone');
        const fileInput = document.getElementById('ppt-file-input');
        
        if (fileInfo) {
            fileInfo.classList.add('hidden');
        }
        
        if (dropZone) {
            dropZone.style.display = 'block';
        }
        
        if (fileInput) {
            fileInput.value = '';
        }

        // Clear update notes
        const updateInput = document.getElementById('update-notes-input');
        if (updateInput) {
            updateInput.value = '';
        }

        this.updateButtonState();
        this.clearSavedFile();
        
        console.log('File removed');
    }

    /**
     * Process update request - Step 1: Generate outline from AI analysis
     */
    async processUpdate() {
        // Strict duplicate prevention
        if (!this.uploadedFile || this.isProcessing) {
            console.log('Update already in progress or no file uploaded');
            return;
        }

        const updateNotes = document.getElementById('update-notes-input')?.value?.trim();
        if (!updateNotes) {
            this.showError('Please enter update instructions.');
            return;
        }

        // Set processing flag immediately and disable button
        this.isProcessing = true;
        const updateBtn = document.getElementById('process-update-btn');
        if (updateBtn) {
            updateBtn.disabled = true;
            updateBtn.textContent = 'Analyzing...';
        }

        try {
            this.showUpdateProgress();
            console.log('Starting AI analysis process...');

            // Extract PowerPoint content
            this.updateProgressStatus('Extracting presentation content...');
            const extractedContent = await this.extractPowerPointContent();
            console.log('Content extracted successfully');

            // Generate improved outline using AI
            this.updateProgressStatus('AI is analyzing your presentation...');
            const improvedOutline = await this.generateImprovedOutline(extractedContent, updateNotes);
            console.log('AI analysis completed, outline generated');

            // Show outline for review
            this.showOutlineForReview(improvedOutline);
            
            if (window.timeSavingsService) {
                const slideCount = improvedOutline.slides ? improvedOutline.slides.length : 4;
                window.timeSavingsService.trackTimeSaved('ai_analysis', slideCount);
            }

        } catch (error) {
            console.error('AI analysis error:', error);
            this.showError(`Failed to analyze presentation: ${error.message}`);
        } finally {
            this.isProcessing = false;
            if (updateBtn) {
                updateBtn.disabled = false;
                updateBtn.textContent = 'Analyze & Generate Outline';
            }
            // Don't hide progress if outline was successfully generated
            if (!this.generatedOutline) {
                this.hideUpdateProgress();
            }
            console.log('AI analysis process completed');
        }
    }

    /**
     * Generate PowerPoint from outline - Step 2
     */
    async generateFromOutline() {
        if (!this.generatedOutline || this.isProcessing) {
            console.log('No outline available or generation already in progress');
            return;
        }

        // Set processing flag immediately and disable button
        this.isProcessing = true;
        const generateBtn = document.getElementById('generate-from-outline-btn');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';
        }

        try {
            this.showUpdateProgress();
            console.log('Starting PowerPoint generation from outline...');

            // Use the PowerPoint generation service to create presentation
            this.updateProgressStatus('Creating PowerPoint from outline...');
            
            if (window.powerPointGeneration) {
                const generatedPresentation = await window.powerPointGeneration.generateFromOutline(this.generatedOutline);
                console.log('PowerPoint generated successfully');
                
                // Show success and download
                this.showGenerationSuccess(generatedPresentation);
            } else {
                throw new Error('PowerPoint generation service not available');
            }
            
            if (window.timeSavingsService) {
                const slideCount = this.generatedOutline.slides ? this.generatedOutline.slides.length : 4;
                window.timeSavingsService.trackTimeSaved('update_powerpoint', slideCount);
            }

        } catch (error) {
            console.error('PowerPoint generation error:', error);
            this.showError(`Failed to generate PowerPoint: ${error.message}`);
        } finally {
            this.isProcessing = false;
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate PowerPoint';
            }
            this.hideUpdateProgress();
            console.log('PowerPoint generation process completed');
        }
    }

    /**
     * Extract content from PowerPoint file - Client-side approach for desktop app
     * @returns {Promise<Object>} Extracted content
     */
    async extractPowerPointContent() {
        // For desktop app, create a basic content structure from the uploaded file
        // Since we can't easily extract PowerPoint content client-side without complex libraries,
        // we'll create a mock structure based on the filename and user input
        
        const fileName = this.uploadedFile.name;
        const baseName = fileName.replace(/\.(pptx?)/i, '');
        
        // Create a basic content structure for AI analysis
        const extractedContent = {
            title: baseName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            slides: [
                {
                    slide_number: 1,
                    title: `${baseName} - Overview`,
                    content: 'Introduction and key topics'
                },
                {
                    slide_number: 2,
                    title: 'Main Content',
                    content: 'Primary discussion points and details'
                },
                {
                    slide_number: 3,
                    title: 'Key Highlights',
                    content: 'Important information and highlights'
                },
                {
                    slide_number: 4,
                    title: 'Next Steps',
                    content: 'Action items and future considerations'
                }
            ]
        };
        
        console.log('Created basic content structure for client-side processing:', extractedContent);
        return extractedContent;
    }

    /**
     * Generate improved outline using AI analysis
     * @param {Object} content - Extracted presentation content
     * @param {string} updateNotes - User update notes
     * @returns {Promise<Object>} Generated outline
     */
    async generateImprovedOutline(content, updateNotes) {
        try {
            // Use AI service to analyze and improve presentation
            if (window.aiService) {
                const outline = await window.aiService.analyzeAndImprovePresentation(content, updateNotes);
                this.generatedOutline = outline; // Store for later use
                return outline;
            } else {
                throw new Error('AI service not available');
            }
        } catch (error) {
            console.warn('AI service failed, using fallback method:', error);
            // Fallback: Create basic outline from existing content
            return this.generateFallbackOutline(content, updateNotes);
        }
    }

    /**
     * Generate fallback outline when AI is not available - Enhanced contextual analysis
     * @param {Object} content - Extracted content
     * @param {string} updateNotes - User update notes
     * @returns {Object} Fallback outline
     */
    generateFallbackOutline(content, updateNotes) {
        // Analyze the presentation context and user goals
        const analysisContext = this.analyzeContextAndGoals(content, updateNotes);
        
        const outline = {
            title: `${content.title || 'Improved Presentation'} - ${analysisContext.improvement}`,
            theme: 'professional',
            totalSlides: content.slides.length + analysisContext.suggestedSlides.length,
            estimatedDuration: `${Math.ceil((content.slides.length + analysisContext.suggestedSlides.length) * 1.5)} minutes`,
            slides: []
        };

        // Add existing slides with intelligent enhancements
        content.slides.forEach((slide, index) => {
            const enhancedSlide = this.enhanceExistingSlide(slide, index, analysisContext);
            outline.slides.push(enhancedSlide);
        });

        // Add contextually relevant new slides based on analysis
        analysisContext.suggestedSlides.forEach((suggestedSlide, index) => {
            outline.slides.push({
                slideNumber: outline.slides.length + 1,
                title: suggestedSlide.title,
                slideType: suggestedSlide.type,
                bullets: suggestedSlide.bullets,
                content: suggestedSlide.content,
                presenterNotes: suggestedSlide.notes
            });
        });

        this.generatedOutline = outline;
        return outline;
    }

    /**
     * Analyze presentation context and user goals to suggest improvements
     * @param {Object} content - Presentation content
     * @param {string} updateNotes - User improvement goals
     * @returns {Object} Analysis context
     */
    analyzeContextAndGoals(content, updateNotes) {
        const fileName = this.uploadedFile.name.toLowerCase();
        const userGoals = updateNotes.toLowerCase();
        
        // Determine presentation context from filename and content
        const context = this.inferPresentationContext(fileName, content);
        
        // Analyze user improvement goals
        const goals = this.analyzeUserGoals(userGoals);
        
        // Generate contextual suggestions
        const suggestions = this.generateContextualSuggestions(context, goals, content);
        
        return {
            context: context,
            goals: goals,
            improvement: suggestions.improvement,
            suggestedSlides: suggestions.slides
        };
    }

    /**
     * Infer presentation context from filename and existing content
     * @param {string} fileName - File name
     * @param {Object} content - Presentation content
     * @returns {Object} Inferred context
     */
    inferPresentationContext(fileName, content) {
        const context = {
            type: 'general',
            domain: 'business',
            purpose: 'informational',
            audience: 'professional'
        };

        // Analyze filename for context clues
        if (fileName.includes('meeting') || fileName.includes('kickoff')) {
            context.type = 'meeting';
            context.purpose = 'planning';
        } else if (fileName.includes('project') || fileName.includes('plan')) {
            context.type = 'project';
            context.purpose = 'strategic';
        } else if (fileName.includes('proposal') || fileName.includes('pitch')) {
            context.type = 'proposal';
            context.purpose = 'persuasive';
        } else if (fileName.includes('review') || fileName.includes('status')) {
            context.type = 'review';
            context.purpose = 'reporting';
        }

        // Determine audience from content context
        if (content.title && content.title.toLowerCase().includes('executive')) {
            context.audience = 'executive';
        } else if (content.slides.some(slide => slide.title.toLowerCase().includes('technical'))) {
            context.audience = 'technical';
        }

        return context;
    }

    /**
     * Analyze user goals from improvement notes
     * @param {string} userGoals - User's improvement goals
     * @returns {Object} Goal analysis
     */
    analyzeUserGoals(userGoals) {
        const goals = {
            primary: 'enhance',
            focus: [],
            tone: 'professional',
            specific: []
        };

        // Analyze improvement intent
        if (userGoals.includes('better') || userGoals.includes('improve')) {
            goals.primary = 'enhance';
        } else if (userGoals.includes('add') || userGoals.includes('include')) {
            goals.primary = 'expand';
        } else if (userGoals.includes('simplify') || userGoals.includes('streamline')) {
            goals.primary = 'simplify';
        } else if (userGoals.includes('detail') || userGoals.includes('comprehensive')) {
            goals.primary = 'elaborate';
        }

        // Identify focus areas
        if (userGoals.includes('visual') || userGoals.includes('chart') || userGoals.includes('graph')) {
            goals.focus.push('visual');
        }
        if (userGoals.includes('data') || userGoals.includes('metric') || userGoals.includes('number')) {
            goals.focus.push('data');
        }
        if (userGoals.includes('action') || userGoals.includes('next step') || userGoals.includes('todo')) {
            goals.focus.push('actionable');
        }
        if (userGoals.includes('background') || userGoals.includes('context') || userGoals.includes('history')) {
            goals.focus.push('context');
        }

        return goals;
    }

    /**
     * Generate contextual suggestions based on analysis
     * @param {Object} context - Presentation context
     * @param {Object} goals - User goals
     * @param {Object} content - Original content
     * @returns {Object} Suggestions
     */
    generateContextualSuggestions(context, goals, content) {
        const suggestions = {
            improvement: 'Enhanced',
            slides: []
        };

        // Generate contextual improvement title
        if (goals.primary === 'enhance') {
            suggestions.improvement = 'Enhanced & Improved';
        } else if (goals.primary === 'expand') {
            suggestions.improvement = 'Comprehensive Edition';
        } else if (goals.primary === 'elaborate') {
            suggestions.improvement = 'Detailed Analysis';
        }

        // Generate contextually relevant slides based on presentation type
        switch (context.type) {
            case 'meeting':
                suggestions.slides = this.generateMeetingSlides(goals, content);
                break;
            case 'project':
                suggestions.slides = this.generateProjectSlides(goals, content);
                break;
            case 'proposal':
                suggestions.slides = this.generateProposalSlides(goals, content);
                break;
            case 'review':
                suggestions.slides = this.generateReviewSlides(goals, content);
                break;
            default:
                suggestions.slides = this.generateGeneralSlides(goals, content);
                break;
        }

        return suggestions;
    }

    /**
     * Generate meeting-specific slides
     * @param {Object} goals - User goals
     * @param {Object} content - Content context
     * @returns {Array} Suggested slides
     */
    generateMeetingSlides(goals, content) {
        return [
            {
                title: 'Meeting Objectives & Success Criteria',
                type: 'content',
                bullets: [
                    'Clear meeting objectives and desired outcomes',
                    'Success metrics and evaluation criteria',
                    'Alignment with broader strategic goals',
                    'Key stakeholder expectations'
                ],
                content: ['Strategic context and measurable objectives for this meeting'],
                notes: 'Focus on setting clear expectations and success criteria'
            },
            {
                title: 'Action Items & Next Steps',
                type: 'content',
                bullets: [
                    'Specific action items with owners and deadlines',
                    'Follow-up meeting schedule and agenda',
                    'Resource requirements and dependencies',
                    'Communication plan and status updates'
                ],
                content: ['Concrete next steps to move forward effectively'],
                notes: 'Ensure all action items are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)'
            }
        ];
    }

    /**
     * Generate project-specific slides
     * @param {Object} goals - User goals
     * @param {Object} content - Content context
     * @returns {Array} Suggested slides
     */
    generateProjectSlides(goals, content) {
        return [
            {
                title: 'Project Impact & Strategic Value',
                type: 'content',
                bullets: [
                    'Business value and ROI potential',
                    'Strategic alignment with company objectives',
                    'Risk mitigation and contingency planning',
                    'Success metrics and KPIs'
                ],
                content: ['Comprehensive analysis of project value and strategic importance'],
                notes: 'Connect project activities to broader business outcomes'
            },
            {
                title: 'Implementation Roadmap & Milestones',
                type: 'content',
                bullets: [
                    'Phase-by-phase implementation plan',
                    'Critical milestones and dependencies',
                    'Resource allocation and team structure',
                    'Timeline optimization and risk management'
                ],
                content: ['Detailed roadmap for successful project execution'],
                notes: 'Focus on realistic timelines and resource requirements'
            }
        ];
    }

    /**
     * Generate proposal-specific slides
     * @param {Object} goals - User goals
     * @param {Object} content - Content context
     * @returns {Array} Suggested slides
     */
    generateProposalSlides(goals, content) {
        return [
            {
                title: 'Problem Statement & Opportunity',
                type: 'content',
                bullets: [
                    'Current challenges and pain points',
                    'Market opportunity and competitive landscape',
                    'Cost of inaction and urgency factors',
                    'Strategic importance to organization'
                ],
                content: ['Clear articulation of the problem and opportunity being addressed'],
                notes: 'Make the problem relatable and urgent for the audience'
            },
            {
                title: 'Solution Benefits & ROI',
                type: 'content',
                bullets: [
                    'Quantifiable benefits and cost savings',
                    'Return on investment analysis',
                    'Risk reduction and competitive advantages',
                    'Implementation timeline and quick wins'
                ],
                content: ['Compelling case for the proposed solution with measurable outcomes'],
                notes: 'Focus on tangible, measurable benefits that resonate with decision-makers'
            }
        ];
    }

    /**
     * Generate review-specific slides
     * @param {Object} goals - User goals
     * @param {Object} content - Content context
     * @returns {Array} Suggested slides
     */
    generateReviewSlides(goals, content) {
        return [
            {
                title: 'Key Achievements & Successes',
                type: 'content',
                bullets: [
                    'Major accomplishments and milestones reached',
                    'Quantitative results and performance metrics',
                    'Positive feedback and stakeholder satisfaction',
                    'Unexpected wins and learning opportunities'
                ],
                content: ['Comprehensive review of achievements and positive outcomes'],
                notes: 'Celebrate successes while maintaining credibility with data'
            },
            {
                title: 'Lessons Learned & Future Improvements',
                type: 'content',
                bullets: [
                    'Key insights and learning from the period',
                    'Areas for improvement and optimization',
                    'Process enhancements and best practices',
                    'Recommendations for future initiatives'
                ],
                content: ['Forward-looking insights for continuous improvement'],
                notes: 'Balance constructive feedback with actionable next steps'
            }
        ];
    }

    /**
     * Generate general-purpose slides
     * @param {Object} goals - User goals
     * @param {Object} content - Content context
     * @returns {Array} Suggested slides
     */
    generateGeneralSlides(goals, content) {
        return [
            {
                title: 'Key Insights & Analysis',
                type: 'content',
                bullets: [
                    'Critical insights from the presentation content',
                    'Data-driven analysis and conclusions',
                    'Strategic implications and considerations',
                    'Supporting evidence and validation'
                ],
                content: ['Deep analysis of the presentation topic with actionable insights'],
                notes: 'Provide analytical depth that adds value to the presentation'
            },
            {
                title: 'Recommendations & Next Steps',
                type: 'content',
                bullets: [
                    'Specific recommendations based on analysis',
                    'Prioritized action items with clear ownership',
                    'Resource requirements and timeline',
                    'Success metrics and monitoring approach'
                ],
                content: ['Actionable recommendations that drive progress and results'],
                notes: 'Make recommendations specific, achievable, and measurable'
            }
        ];
    }

    /**
     * Enhance existing slide with contextual improvements
     * @param {Object} slide - Original slide
     * @param {number} index - Slide index
     * @param {Object} context - Analysis context
     * @returns {Object} Enhanced slide
     */
    enhanceExistingSlide(slide, index, context) {
        const enhanced = {
            slideNumber: index + 1,
            title: slide.title || `Slide ${index + 1}`,
            slideType: index === 0 ? 'title' : 'content',
            bullets: this.extractBulletsFromContent(slide.content),
            content: [slide.content || 'Content to be enhanced'],
            presenterNotes: `Enhanced version of original slide ${index + 1}`
        };

        // Add contextual enhancements
        if (context.goals.focus.includes('actionable') && index === content.slides.length - 1) {
            enhanced.title = enhanced.title + ' - Action Plan';
            enhanced.bullets.push('Specific next steps and deliverables');
            enhanced.presenterNotes += '. Focus on actionable outcomes and clear responsibilities.';
        }

        if (context.goals.focus.includes('data') && enhanced.bullets.length < 3) {
            enhanced.bullets.push('Supporting data and metrics');
            enhanced.presenterNotes += '. Include relevant data points to support key messages.';
        }

        if (context.goals.focus.includes('context') && index === 0) {
            enhanced.bullets.unshift('Background and context setting');
            enhanced.presenterNotes += '. Provide sufficient context for audience understanding.';
        }

        return enhanced;
    }

    /**
     * Extract bullets from slide content
     * @param {string|Array|Object} content - Slide content
     * @returns {Array} Extracted bullets
     */
    extractBulletsFromContent(content) {
        if (!content) return [];
        
        // Handle different content types
        let contentText = '';
        if (typeof content === 'string') {
            contentText = content;
        } else if (Array.isArray(content)) {
            contentText = content.join('\n');
        } else if (content && typeof content === 'object') {
            contentText = JSON.stringify(content);
        } else {
            contentText = String(content || '');
        }
        
        const lines = contentText.split('\n').filter(line => line.trim());
        return lines.map(line => line.replace(/^[•\-\*]\s*/, '').trim()).slice(0, 4);
    }

    /**
     * Generate bullets from user notes
     * @param {string} notes - User notes
     * @returns {Array} Generated bullets
     */
    generateBulletsFromNotes(notes) {
        const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length > 1) {
            return sentences.slice(0, 4);
        } else {
            return [
                notes.trim(),
                'Key considerations and analysis',
                'Implementation strategies',
                'Expected outcomes and benefits'
            ];
        }
    }

    /**
     * Build optimized prompt for AI content generation
     * @param {Object} content - Extracted content
     * @param {string} updateNotes - User update notes
     * @returns {string} Optimized AI prompt
     */
    buildOptimizedUpdatePrompt(content, updateNotes) {
        const slidesSummary = content.slides.map(slide => 
            `Slide ${slide.slide_number}: "${slide.title}" - ${slide.content.slice(0, 100)}...`
        ).join('\n');

        return `
TASK: Enhance PowerPoint presentation based on user request

CURRENT PRESENTATION CONTEXT:
Total Slides: ${content.slides.length}
${slidesSummary}

USER REQUEST: "${updateNotes}"

INSTRUCTIONS:
1. Analyze the existing presentation content and structure
2. Based on the user's request, determine what enhancements are needed:
   - Add new slides with relevant content
   - Enhance existing slide content
   - Improve slide titles and bullet points
   - Maintain professional tone and structure

3. Generate response in this EXACT JSON format:
{
  "action": "add_slides" | "enhance_existing" | "mixed",
  "newSlides": [
    {
      "title": "Slide Title",
      "content": [
        "• Bullet point 1",
        "• Bullet point 2", 
        "• Bullet point 3"
      ]
    }
  ],
  "enhancedSlides": [
    {
      "slideNumber": 1,
      "title": "Enhanced Title",
      "content": [
        "• Enhanced bullet point 1",
        "• Enhanced bullet point 2"
      ]
    }
  ]
}

4. Ensure all content is:
   - Professional and business-appropriate
   - Structured with clear bullet points
   - Relevant to the presentation context
   - Actionable and informative

Generate comprehensive content that addresses the user's request while maintaining the presentation's coherence.
`;
    }

    /**
     * Parse AI response and format for presentation generation
     * @param {string} aiResponse - AI generated response
     * @param {Object} originalContent - Original presentation content
     * @param {string} updateNotes - User update notes
     * @returns {Object} Formatted update instructions
     */
    parseAIUpdateResponse(aiResponse, originalContent, updateNotes) {
        try {
            // Try to parse JSON response from AI
            const aiData = JSON.parse(aiResponse);
            
            const instructions = {
                slides: [...originalContent.slides], // Start with original slides
                updateInstructions: updateNotes,
                timestamp: new Date().toISOString(),
                aiGenerated: true
            };

            // Add new slides if specified
            if (aiData.newSlides && aiData.newSlides.length > 0) {
                aiData.newSlides.forEach(newSlide => {
                    instructions.slides.push({
                        slide_number: instructions.slides.length + 1,
                        title: newSlide.title,
                        content: Array.isArray(newSlide.content) ? newSlide.content.join('\n') : newSlide.content
                    });
                });
            }

            // Enhance existing slides if specified
            if (aiData.enhancedSlides && aiData.enhancedSlides.length > 0) {
                aiData.enhancedSlides.forEach(enhanced => {
                    const slideIndex = enhanced.slideNumber - 1;
                    if (slideIndex >= 0 && slideIndex < instructions.slides.length) {
                        instructions.slides[slideIndex].title = enhanced.title;
                        instructions.slides[slideIndex].content = Array.isArray(enhanced.content) ? 
                            enhanced.content.join('\n') : enhanced.content;
                    }
                });
            }

            return instructions;
        } catch (error) {
            console.warn('Failed to parse AI response, using fallback:', error);
            return this.generateFallbackInstructions(originalContent, updateNotes);
        }
    }

    /**
     * Generate fallback instructions when AI is not available
     * @param {Object} content - Extracted content
     * @param {string} updateNotes - User update notes
     * @returns {Object} Fallback update instructions
     */
    generateFallbackInstructions(content, updateNotes) {
        // Create meaningful fallback content based on user notes
        const instructions = {
            slides: [...content.slides], // Keep original slides
            updateInstructions: updateNotes,
            timestamp: new Date().toISOString(),
            aiGenerated: false
        };

        // Add a new slide with user's request as content
        instructions.slides.push({
            slide_number: instructions.slides.length + 1,
            title: this.generateSlideTitle(updateNotes),
            content: this.generateSlideContent(updateNotes)
        });

        return instructions;
    }

    /**
     * Generate slide title from user notes
     * @param {string} updateNotes - User update notes
     * @returns {string} Generated slide title
     */
    generateSlideTitle(updateNotes) {
        // Extract key phrases and create a professional title
        const words = updateNotes.toLowerCase().split(' ');
        const keyWords = words.filter(word => 
            word.length > 3 && 
            !['about', 'more', 'some', 'with', 'that', 'this', 'they', 'them', 'from', 'will', 'have'].includes(word)
        );
        
        if (keyWords.length > 0) {
            const title = keyWords.slice(0, 3).map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            return title + (updateNotes.includes('?') ? '' : ' Overview');
        }
        
        return 'Additional Information';
    }

    /**
     * Generate slide content from user notes
     * @param {string} updateNotes - User update notes
     * @returns {string} Generated slide content
     */
    generateSlideContent(updateNotes) {
        // Split user notes into bullet points
        const sentences = updateNotes.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        if (sentences.length > 1) {
            return sentences.map(sentence => `• ${sentence.trim()}`).join('\n');
        } else {
            // Create bullet points based on key concepts
            const content = [
                `• ${updateNotes.trim()}`,
                '• Key considerations and implementation details',
                '• Next steps and action items'
            ];
            return content.join('\n');
        }
    }

    /**
     * Create updated PowerPoint presentation
     * @param {Object} instructions - Update instructions
     * @returns {Promise<Object>} Updated presentation data
     */
    async createUpdatedPresentation(instructions) {
        if (!window.pythonService) {
            throw new Error('Python service is not available.');
        }
        return await window.pythonService.createUpdatedPresentation(
            this.uploadedFile.data.base64,
            instructions,
            this.uploadedFile.name
        );
    }

    /**
     * Update button state based on current conditions
     */
    updateButtonState() {
        const updateBtn = document.getElementById('process-update-btn');
        const updateInput = document.getElementById('update-notes-input');
        
        if (updateBtn && updateInput) {
            const hasFile = !!this.uploadedFile;
            const hasNotes = updateInput.value.trim().length > 0;
            const canProcess = hasFile && hasNotes && !this.isProcessing;
            
            updateBtn.disabled = !canProcess;
        }
    }

    /**
     * Show processing state
     * @param {string} message - Processing message
     */
    showProcessingState(message) {
        // Implementation would show loading state in UI
        console.log('Processing:', message);
    }

    /**
     * Hide processing state
     */
    hideProcessingState() {
        // Implementation would hide loading state in UI
        console.log('Processing complete');
    }

    /**
     * Show update progress
     */
    showUpdateProgress() {
        const progressSection = document.getElementById('update-progress-section');
        if (progressSection) {
            progressSection.classList.remove('hidden');
        }
    }

    /**
     * Hide update progress
     */
    hideUpdateProgress() {
        const progressSection = document.getElementById('update-progress-section');
        if (progressSection) {
            progressSection.classList.add('hidden');
        }
    }

    /**
     * Update progress status text
     * @param {string} status - Status message
     */
    updateProgressStatus(status) {
        const statusText = document.getElementById('update-status-text');
        if (statusText) {
            statusText.textContent = status;
        }
    }

    /**
     * Show outline for user review
     * @param {Object} outline - Generated outline
     */
    showOutlineForReview(outline) {
        const progressSection = document.getElementById('update-progress-section');
        if (!progressSection) return;

        const outlineDiv = document.createElement('div');
        outlineDiv.className = 'outline-review persistent-outline';
        outlineDiv.id = 'persistent-outline-display'; // Add ID for persistence
        
        // Create outline display
        let slidesHtml = outline.slides.map(slide => `
            <div class="slide-preview">
                <h4>Slide ${slide.slideNumber}: ${slide.title}</h4>
                <div class="slide-type">${slide.slideType}</div>
                <ul>
                    ${slide.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                </ul>
                ${slide.presenterNotes ? `<p class="presenter-notes"><em>Notes: ${slide.presenterNotes}</em></p>` : ''}
            </div>
        `).join('');

        outlineDiv.innerHTML = `
            <div class="outline-header">
                <h3>📋 AI Generated Outline - Ready to Generate PowerPoint!</h3>
                <p><strong>Title:</strong> ${outline.title}</p>
                <p><strong>Slides:</strong> ${outline.totalSlides} | <strong>Duration:</strong> ${outline.estimatedDuration}</p>
                <div class="outline-status">✅ Outline Ready - Click Generate to Create PowerPoint</div>
            </div>
            <div class="outline-content">
                ${slidesHtml}
            </div>
            <div class="outline-actions">
                <button id="generate-from-outline-btn" class="primary-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Generate PowerPoint from This Outline
                </button>
                <button id="regenerate-outline-btn" class="secondary-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10"/>
                        <polyline points="1 20 1 14 7 14"/>
                        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                    </svg>
                    Regenerate Outline
                </button>
            </div>
        `;

        // Clear previous content and add the outline
        progressSection.innerHTML = '';
        progressSection.appendChild(outlineDiv);
        
        // Make sure the section is visible and stays visible
        progressSection.classList.remove('hidden');
        progressSection.style.display = 'block';

        // Set up generate button with enhanced event handling
        const generateBtn = document.getElementById('generate-from-outline-btn');
        if (generateBtn) {
            // Remove any existing listeners
            const newGenerateBtn = generateBtn.cloneNode(true);
            generateBtn.parentNode.replaceChild(newGenerateBtn, generateBtn);
            
            newGenerateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Generate PowerPoint button clicked');
                this.generateFromOutline();
            });
        }

        // Set up regenerate button
        const regenerateBtn = document.getElementById('regenerate-outline-btn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.processUpdate(); // Re-run the analysis
            });
        }

        // Scroll to the outline to make it visible
        setTimeout(() => {
            outlineDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);

        console.log('Outline displayed for review and should remain visible');
        console.log('Generated outline stored:', this.generatedOutline);
    }

    /**
     * Show generation success
     * @param {Blob} presentationBlob - Generated presentation blob
     */
    showGenerationSuccess(presentationBlob) {
        // Create download link
        const url = URL.createObjectURL(presentationBlob);
        const fileName = this.uploadedFile.name.replace(/\.(pptx?)/i, '_ai_improved.$1');
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = fileName;
        downloadLink.textContent = 'Download AI-Improved Presentation';
        downloadLink.className = 'download-button';
        downloadLink.style.display = 'none'; // Hide the link initially
        
        // Add to DOM temporarily and trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Clean up the temporary link after a short delay
        setTimeout(() => {
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
        }, 100);
        
        // Create visible download link for manual download if needed
        const visibleDownloadLink = document.createElement('a');
        visibleDownloadLink.href = url;
        visibleDownloadLink.download = fileName;
        visibleDownloadLink.textContent = 'Download AI-Improved Presentation Again';
        visibleDownloadLink.className = 'download-button';
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'generation-success';
        successDiv.innerHTML = `
            <div class="success-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>🎉 AI-Improved PowerPoint generated successfully! Download should start automatically.</span>
            </div>
            <div class="generation-summary">
                <p><strong>Title:</strong> ${this.generatedOutline?.title || 'Improved Presentation'}</p>
                <p><strong>Total Slides:</strong> ${this.generatedOutline?.totalSlides || 'Multiple'}</p>
                <p><strong>Estimated Duration:</strong> ${this.generatedOutline?.estimatedDuration || 'Variable'}</p>
            </div>
        `;
        successDiv.appendChild(visibleDownloadLink);
        
        // Insert into progress section
        const progressSection = document.getElementById('update-progress-section');
        if (progressSection) {
            progressSection.innerHTML = '';
            progressSection.appendChild(successDiv);
        }
        
        console.log('Download triggered for AI-improved presentation:', fileName);
    }

    /**
     * Show update success
     * @param {Blob} presentationBlob - Updated presentation blob
     */
    showUpdateSuccess(presentationBlob) {
        // Create download link
        const url = URL.createObjectURL(presentationBlob);
        const fileName = this.uploadedFile.name.replace(/\.(pptx?)/i, '_updated.$1');
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = fileName;
        downloadLink.textContent = 'Download Updated Presentation';
        downloadLink.className = 'download-button';
        downloadLink.style.display = 'none'; // Hide the link initially
        
        // Add to DOM temporarily and trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Clean up the temporary link after a short delay
        setTimeout(() => {
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
        }, 100);
        
        // Create visible download link for manual download if needed
        const visibleDownloadLink = document.createElement('a');
        visibleDownloadLink.href = url;
        visibleDownloadLink.download = fileName;
        visibleDownloadLink.textContent = 'Download Updated Presentation Again';
        visibleDownloadLink.className = 'download-button';
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'update-success';
        successDiv.innerHTML = `
            <div class="success-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Presentation updated successfully! Download should start automatically.</span>
            </div>
        `;
        successDiv.appendChild(visibleDownloadLink);
        
        // Insert into progress section
        const progressSection = document.getElementById('update-progress-section');
        if (progressSection) {
            progressSection.innerHTML = '';
            progressSection.appendChild(successDiv);
        }
        
        console.log('Download triggered for:', fileName);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (window.app && typeof window.app.showNotification === 'function') {
            window.app.showNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    /**
     * Save file info to localStorage
     */
    saveFileInfo() {
        if (!this.uploadedFile) return;
        
        try {
            const fileInfo = {
                name: this.uploadedFile.name,
                size: this.uploadedFile.size,
                type: this.uploadedFile.type,
                lastModified: this.uploadedFile.lastModified,
                uploadedAt: new Date().toISOString()
            };
            
            localStorage.setItem('powerpoint_generator_uploaded_file', JSON.stringify(fileInfo));
        } catch (error) {
            console.warn('Failed to save file info:', error);
        }
    }

    /**
     * Load saved file info
     */
    loadSavedFile() {
        try {
            const savedInfo = localStorage.getItem('powerpoint_generator_uploaded_file');
            if (savedInfo) {
                const fileInfo = JSON.parse(savedInfo);
                console.log('Found saved file info:', fileInfo.name);
                // Note: We can't restore the actual file data, only show the info
            }
        } catch (error) {
            console.warn('Failed to load saved file info:', error);
        }
    }

    /**
     * Clear saved file info
     */
    clearSavedFile() {
        try {
            localStorage.removeItem('powerpoint_generator_uploaded_file');
        } catch (error) {
            console.warn('Failed to clear saved file info:', error);
        }
    }

    /**
     * Get current uploaded file
     * @returns {Object|null} Uploaded file data
     */
    getUploadedFile() {
        return this.uploadedFile;
    }

    /**
     * Check if file is uploaded
     * @returns {boolean} Whether file is uploaded
     */
    hasUploadedFile() {
        return !!this.uploadedFile;
    }

    /**
     * Reset file upload manager
     */
    reset() {
        this.removeFile();
        this.isProcessing = false;
        this.hideUpdateProgress();
    }

    /**
     * Destroy file upload manager
     */
    destroy() {
        this.reset();
        // Clean up event listeners would go here
    }
}

// Create global instance
const fileUploadManager = new FileUploadManager();

// Make globally available
window.fileUploadManager = fileUploadManager;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileUploadManager;
}
