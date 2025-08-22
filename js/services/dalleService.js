// DALL-E Service for generating charts and graphs
class DalleService {
    constructor() {
        this.baseUrl = CONFIG.AI_GATEWAY.BASE_URL;
        this.apiKey = CONFIG.AI_GATEWAY.API_KEY;
        this.generatedImages = new Map(); // Store generated images by ID
        this.uploadedImages = new Map(); // Store uploaded images by ID
        this.imageCounter = 0;
        this.uploadCounter = 0;
    }

    /**
     * Generate a chart/graph using DALL-E
     * @param {Object} params - Chart generation parameters
     * @returns {Promise<Object>} - Generated image data
     */
    async generateChart(params) {
        const {
            chartType,
            data,
            title,
            stakeholderGroup,
            customPrompt,
            style = 'professional',
            size = '1024x1024'
        } = params;

        const prompt = this.buildChartPrompt(chartType, data, title, stakeholderGroup, customPrompt, style);

        const result = await this.generateImage(prompt, size);

        const imageId = `chart_${++this.imageCounter}_${Date.now()}`;
        const imageData = {
            ...result,
            id: imageId,
            chartType,
            title,
            stakeholderGroup,
            assignedSlides: []
        };

        this.generatedImages.set(imageId, imageData);
        return imageData;
    }

    async generateVisual(description, size = '1024x1024') {
        const prompt = `Create a high-quality, professional visual for a PowerPoint presentation. The visual should represent the following concept: "${description}". Style: photorealistic, detailed, cinematic lighting.`;

        const result = await this.generateImage(prompt, size);

        const imageId = `visual_${++this.imageCounter}_${Date.now()}`;
        const imageData = {
            ...result,
            id: imageId,
            title: description,
            assignedSlides: []
        };

        this.generatedImages.set(imageId, imageData);
        return imageData;
    }

    async generateImage(prompt, size) {
        console.log('DALL-E generateImage called - using offline placeholder mode');
        
        try {
            // Create a placeholder image instead of calling external AI service
            const placeholderBlob = await this.createPlaceholderImage(prompt, size);
            
            return {
                url: URL.createObjectURL(placeholderBlob),
                blob: placeholderBlob,
                prompt: prompt,
                createdAt: new Date().toISOString(),
                size: size,
                isPlaceholder: true
            };
        } catch (error) {
            console.error('Error creating placeholder image:', error);
            // Return a simple fallback
            return {
                url: 'data:image/svg+xml;base64,' + btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" text-anchor="middle" fill="#666">Chart</text></svg>'),
                blob: null,
                prompt: prompt,
                createdAt: new Date().toISOString(),
                size: size,
                isPlaceholder: true
            };
        }
    }

    /**
     * Create a placeholder image for chart/visual generation
     * @param {string} prompt - Image prompt
     * @param {string} size - Image size
     * @returns {Promise<Blob>} - Placeholder image blob
     */
    async createPlaceholderImage(prompt, size) {
        const [width, height] = size.split('x').map(Number);
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#4A90E2');
        gradient.addColorStop(1, '#7B68EE');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Wrap text for prompt
        const maxWidth = width - 40;
        const words = prompt.split(' ');
        let line = '';
        let y = height / 2 - 20;
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, width / 2, y);
                line = words[n] + ' ';
                y += 30;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, width / 2, y);
        
        // Add placeholder label
        ctx.font = '16px Arial';
        ctx.fillText('Chart Placeholder', width / 2, height - 30);
        
        return new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
        });
    }

    /**
     * Build DALL-E prompt for chart generation
     * @param {string} chartType - Type of chart
     * @param {Object} data - Chart data
     * @param {string} title - Chart title
     * @param {string} stakeholderGroup - Target stakeholder group
     * @param {string} customPrompt - Custom user prompt
     * @param {string} style - Visual style
     * @returns {string} - Complete DALL-E prompt
     */
    buildChartPrompt(chartType, data, title, stakeholderGroup, customPrompt, style) {
        let basePrompt = '';
        
        // Chart type specific prompts
        const chartPrompts = {
            'bar-chart': 'Create a professional bar chart',
            'line-chart': 'Create a clean line chart with trend lines',
            'pie-chart': 'Create a modern pie chart with clear segments',
            'scatter-plot': 'Create a scatter plot with data points',
            'area-chart': 'Create an area chart showing data trends',
            'donut-chart': 'Create a donut chart with center statistics',
            'stacked-bar': 'Create a stacked bar chart comparing categories',
            'timeline': 'Create a timeline visualization',
            'funnel': 'Create a funnel chart showing conversion stages',
            'gauge': 'Create a gauge/speedometer chart',
            'heatmap': 'Create a heatmap visualization',
            'treemap': 'Create a treemap showing hierarchical data'
        };

        basePrompt = chartPrompts[chartType] || 'Create a professional data visualization';

        // Add title
        if (title) {
            basePrompt += ` titled "${title}"`;
        }

        // Add stakeholder-specific styling
        const stakeholderStyles = {
            'executive': 'with executive-level clarity, bold colors, and key metrics prominently displayed. Use corporate blue and gray color scheme.',
            'development': 'with technical precision, detailed labels, and developer-friendly metrics. Use modern tech colors like blue, green, and orange.',
            'product': 'with user-focused metrics, clear UX indicators, and product performance data. Use vibrant, user-friendly colors.',
            'marketing': 'with marketing KPIs, conversion metrics, and brand-aligned colors. Use engaging, brand-focused color palette.',
            'qa': 'with quality metrics, testing data, and clear pass/fail indicators. Use red, green, and yellow for status indication.',
            'partners': 'with partnership metrics, collaboration data, and professional presentation. Use neutral, professional colors.'
        };

        if (stakeholderGroup && stakeholderStyles[stakeholderGroup]) {
            basePrompt += ` ${stakeholderStyles[stakeholderGroup]}`;
        }

        // Add data context if provided
        if (data && typeof data === 'object') {
            if (data.categories && data.values) {
                basePrompt += ` showing categories: ${data.categories.join(', ')} with corresponding values: ${data.values.join(', ')}.`;
            } else if (data.description) {
                basePrompt += ` representing ${data.description}.`;
            }
        }

        // Add style preferences
        const stylePrompts = {
            'professional': 'Use a clean, professional design with clear labels, grid lines, and corporate styling.',
            'modern': 'Use a modern, minimalist design with bold colors and clean typography.',
            'colorful': 'Use vibrant, engaging colors with dynamic visual elements.',
            'minimal': 'Use a minimal design with subtle colors and clean lines.',
            'dark': 'Use a dark theme with bright accent colors and modern styling.'
        };

        if (stylePrompts[style]) {
            basePrompt += ` ${stylePrompts[style]}`;
        }

        // Add custom prompt if provided
        if (customPrompt) {
            basePrompt += ` ${customPrompt}`;
        }

        // Add technical requirements
        basePrompt += ' The chart should be high resolution, suitable for presentation slides, with clear readable text and professional formatting. No background, transparent or white background preferred.';

        return basePrompt;
    }

    /**
     * Download image from URL and convert to blob
     * @param {string} imageUrl - Image URL
     * @returns {Promise<Blob>} - Image blob
     */
    async downloadImage(imageUrl) {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.status}`);
        }
        return await response.blob();
    }

    /**
     * Get all generated images
     * @returns {Array} - Array of image data objects
     */
    getAllImages() {
        return Array.from(this.generatedImages.values());
    }

    /**
     * Get image by ID
     * @param {string} imageId - Image ID
     * @returns {Object|null} - Image data or null
     */
    getImage(imageId) {
        return this.generatedImages.get(imageId) || null;
    }

    /**
     * Delete image
     * @param {string} imageId - Image ID
     * @returns {boolean} - Success status
     */
    deleteImage(imageId) {
        const imageData = this.generatedImages.get(imageId);
        if (imageData) {
            // Revoke blob URL to free memory
            URL.revokeObjectURL(imageData.url);
            this.generatedImages.delete(imageId);
            return true;
        }
        return false;
    }

    /**
     * Assign image to slide
     * @param {string} imageId - Image ID
     * @param {number} slideIndex - Slide index
     * @returns {boolean} - Success status
     */
    assignImageToSlide(imageId, slideIndex) {
        const imageData = this.generatedImages.get(imageId);
        if (imageData) {
            if (!imageData.assignedSlides.includes(slideIndex)) {
                imageData.assignedSlides.push(slideIndex);
            }
            return true;
        }
        return false;
    }

    /**
     * Remove image from slide
     * @param {string} imageId - Image ID
     * @param {number} slideIndex - Slide index
     * @returns {boolean} - Success status
     */
    removeImageFromSlide(imageId, slideIndex) {
        const imageData = this.generatedImages.get(imageId);
        if (imageData) {
            const index = imageData.assignedSlides.indexOf(slideIndex);
            if (index > -1) {
                imageData.assignedSlides.splice(index, 1);
            }
            return true;
        }
        return false;
    }

    /**
     * Get images assigned to a specific slide
     * @param {number} slideIndex - Slide index
     * @returns {Array} - Array of image data objects
     */
    getImagesForSlide(slideIndex) {
        return Array.from(this.generatedImages.values())
            .filter(image => image.assignedSlides.includes(slideIndex));
    }

    /**
     * Get predefined chart templates for stakeholder groups
     * @param {string} stakeholderGroup - Stakeholder group
     * @returns {Array} - Array of chart templates
     */
    getChartTemplatesForStakeholder(stakeholderGroup) {
        const templates = {
            'executive': [
                {
                    type: 'bar-chart',
                    title: 'Revenue Growth',
                    description: 'Quarterly revenue comparison showing growth trends',
                    tooltip: 'Best for showing financial performance and growth metrics to executives'
                },
                {
                    type: 'pie-chart',
                    title: 'Market Share',
                    description: 'Market share distribution across competitors',
                    tooltip: 'Ideal for showing market position and competitive landscape'
                },
                {
                    type: 'line-chart',
                    title: 'KPI Trends',
                    description: 'Key performance indicators over time',
                    tooltip: 'Perfect for tracking business metrics and performance trends'
                },
                {
                    type: 'funnel',
                    title: 'Sales Funnel',
                    description: 'Sales conversion stages and drop-off rates',
                    tooltip: 'Essential for understanding sales process efficiency'
                }
            ],
            'development': [
                {
                    type: 'line-chart',
                    title: 'Code Quality Metrics',
                    description: 'Bug count, test coverage, and code complexity over time',
                    tooltip: 'Track code quality improvements and technical debt'
                },
                {
                    type: 'bar-chart',
                    title: 'Sprint Velocity',
                    description: 'Story points completed per sprint',
                    tooltip: 'Monitor team productivity and sprint planning accuracy'
                },
                {
                    type: 'stacked-bar',
                    title: 'Feature Development',
                    description: 'Development time breakdown by feature category',
                    tooltip: 'Analyze development effort distribution across features'
                },
                {
                    type: 'heatmap',
                    title: 'System Performance',
                    description: 'Server response times and system load patterns',
                    tooltip: 'Visualize system performance bottlenecks and patterns'
                }
            ],
            'product': [
                {
                    type: 'funnel',
                    title: 'User Conversion',
                    description: 'User journey from signup to activation',
                    tooltip: 'Identify conversion bottlenecks in user onboarding'
                },
                {
                    type: 'line-chart',
                    title: 'User Engagement',
                    description: 'Daily/monthly active users and retention rates',
                    tooltip: 'Track user engagement and product stickiness'
                },
                {
                    type: 'bar-chart',
                    title: 'Feature Usage',
                    description: 'Most and least used product features',
                    tooltip: 'Understand feature adoption and prioritize development'
                },
                {
                    type: 'area-chart',
                    title: 'User Feedback',
                    description: 'Customer satisfaction scores and feedback trends',
                    tooltip: 'Monitor user satisfaction and product-market fit'
                }
            ],
            'marketing': [
                {
                    type: 'pie-chart',
                    title: 'Traffic Sources',
                    description: 'Website traffic breakdown by channel',
                    tooltip: 'Understand which marketing channels drive the most traffic'
                },
                {
                    type: 'bar-chart',
                    title: 'Campaign Performance',
                    description: 'ROI and conversion rates by marketing campaign',
                    tooltip: 'Compare campaign effectiveness and optimize budget allocation'
                },
                {
                    type: 'line-chart',
                    title: 'Lead Generation',
                    description: 'Lead volume and quality trends over time',
                    tooltip: 'Track lead generation performance and seasonal patterns'
                },
                {
                    type: 'funnel',
                    title: 'Marketing Funnel',
                    description: 'Awareness to conversion marketing funnel',
                    tooltip: 'Identify marketing funnel bottlenecks and optimization opportunities'
                }
            ],
            'qa': [
                {
                    type: 'line-chart',
                    title: 'Bug Trends',
                    description: 'Bug discovery and resolution rates over time',
                    tooltip: 'Track quality improvements and testing effectiveness'
                },
                {
                    type: 'bar-chart',
                    title: 'Test Coverage',
                    description: 'Test coverage by module or feature',
                    tooltip: 'Identify areas needing more comprehensive testing'
                },
                {
                    type: 'pie-chart',
                    title: 'Bug Categories',
                    description: 'Bug distribution by severity and type',
                    tooltip: 'Understand common bug patterns and focus testing efforts'
                },
                {
                    type: 'gauge',
                    title: 'Quality Score',
                    description: 'Overall product quality score and targets',
                    tooltip: 'Show quality metrics against established benchmarks'
                }
            ],
            'partners': [
                {
                    type: 'bar-chart',
                    title: 'Partnership ROI',
                    description: 'Return on investment by partner relationship',
                    tooltip: 'Demonstrate value of partnership investments'
                },
                {
                    type: 'line-chart',
                    title: 'Integration Success',
                    description: 'API usage and integration health metrics',
                    tooltip: 'Show technical partnership success and adoption'
                },
                {
                    type: 'pie-chart',
                    title: 'Revenue Share',
                    description: 'Revenue distribution across partner channels',
                    tooltip: 'Visualize partner contribution to overall revenue'
                },
                {
                    type: 'timeline',
                    title: 'Partnership Milestones',
                    description: 'Key partnership achievements and roadmap',
                    tooltip: 'Track partnership progress and future opportunities'
                }
            ]
        };

        return templates[stakeholderGroup] || [];
    }

    /**
     * Clear all generated images
     */
    clearAllImages() {
        // Revoke all blob URLs to free memory
        for (const imageData of this.generatedImages.values()) {
            URL.revokeObjectURL(imageData.url);
        }
        this.generatedImages.clear();
        this.imageCounter = 0;
    }

    /**
     * Upload and store user image
     * @param {File} file - Image file
     * @param {string} title - Optional title for the image
     * @returns {Promise<Object>} - Uploaded image data
     */
    async uploadImage(file, title = '') {
        try {
            // Validate file
            if (!file || !file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file');
            }

            // Check file size (10MB limit)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                throw new Error('Image file size must be less than 10MB');
            }

            console.log('Uploading image:', file.name);

            // Create image object
            const imageId = `upload_${++this.uploadCounter}_${Date.now()}`;
            const imageUrl = URL.createObjectURL(file);
            
            const imageData = {
                id: imageId,
                url: imageUrl,
                blob: file,
                title: title || file.name.replace(/\.[^/.]+$/, ''), // Remove extension
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                isUploaded: true,
                createdAt: new Date().toISOString(),
                assignedSlides: [] // Track which slides this image is assigned to
            };

            // Store the uploaded image
            this.uploadedImages.set(imageId, imageData);

            console.log('Image uploaded successfully:', imageData);
            return imageData;

        } catch (error) {
            console.error('Error uploading image:', error);
            throw new Error(`Failed to upload image: ${error.message}`);
        }
    }

    /**
     * Get all uploaded images
     * @returns {Array} - Array of uploaded image data objects
     */
    getAllUploadedImages() {
        return Array.from(this.uploadedImages.values());
    }

    /**
     * Get uploaded image by ID
     * @param {string} imageId - Image ID
     * @returns {Object|null} - Image data or null
     */
    getUploadedImage(imageId) {
        return this.uploadedImages.get(imageId) || null;
    }

    /**
     * Delete uploaded image
     * @param {string} imageId - Image ID
     * @returns {boolean} - Success status
     */
    deleteUploadedImage(imageId) {
        const imageData = this.uploadedImages.get(imageId);
        if (imageData) {
            // Revoke blob URL to free memory
            URL.revokeObjectURL(imageData.url);
            this.uploadedImages.delete(imageId);
            return true;
        }
        return false;
    }

    /**
     * Assign uploaded image to slide
     * @param {string} imageId - Image ID
     * @param {number} slideIndex - Slide index
     * @returns {boolean} - Success status
     */
    assignUploadedImageToSlide(imageId, slideIndex) {
        const imageData = this.uploadedImages.get(imageId);
        if (imageData) {
            if (!imageData.assignedSlides.includes(slideIndex)) {
                imageData.assignedSlides.push(slideIndex);
            }
            return true;
        }
        return false;
    }

    /**
     * Remove uploaded image from slide
     * @param {string} imageId - Image ID
     * @param {number} slideIndex - Slide index
     * @returns {boolean} - Success status
     */
    removeUploadedImageFromSlide(imageId, slideIndex) {
        const imageData = this.uploadedImages.get(imageId);
        if (imageData) {
            const index = imageData.assignedSlides.indexOf(slideIndex);
            if (index > -1) {
                imageData.assignedSlides.splice(index, 1);
            }
            return true;
        }
        return false;
    }

    /**
     * Get all images (generated + uploaded) assigned to a specific slide
     * @param {number} slideIndex - Slide index
     * @returns {Array} - Array of image data objects
     */
    getAllImagesForSlide(slideIndex) {
        const generatedImages = Array.from(this.generatedImages.values())
            .filter(image => image.assignedSlides.includes(slideIndex));
        
        const uploadedImages = Array.from(this.uploadedImages.values())
            .filter(image => image.assignedSlides.includes(slideIndex));
        
        return [...generatedImages, ...uploadedImages];
    }

    /**
     * Get all images (generated + uploaded)
     * @returns {Array} - Array of all image data objects
     */
    getAllImagesAndUploads() {
        return [
            ...Array.from(this.generatedImages.values()),
            ...Array.from(this.uploadedImages.values())
        ];
    }

    /**
     * Clear all uploaded images
     */
    clearAllUploadedImages() {
        // Revoke all blob URLs to free memory
        for (const imageData of this.uploadedImages.values()) {
            URL.revokeObjectURL(imageData.url);
        }
        this.uploadedImages.clear();
        this.uploadCounter = 0;
    }

    /**
     * Clear all images (generated + uploaded)
     */
    clearAllImagesAndUploads() {
        this.clearAllImages();
        this.clearAllUploadedImages();
    }

    /**
     * Export image assignments for PowerPoint generation (includes uploaded images)
     * @returns {Object} - Image assignments by slide index
     */
    exportImageAssignments() {
        const assignments = {};
        
        // Add generated images
        for (const imageData of this.generatedImages.values()) {
            for (const slideIndex of imageData.assignedSlides) {
                if (!assignments[slideIndex]) {
                    assignments[slideIndex] = [];
                }
                assignments[slideIndex].push({
                    id: imageData.id,
                    url: imageData.url,
                    blob: imageData.blob,
                    title: imageData.title,
                    chartType: imageData.chartType,
                    isUploaded: false
                });
            }
        }

        // Add uploaded images
        for (const imageData of this.uploadedImages.values()) {
            for (const slideIndex of imageData.assignedSlides) {
                if (!assignments[slideIndex]) {
                    assignments[slideIndex] = [];
                }
                assignments[slideIndex].push({
                    id: imageData.id,
                    url: imageData.url,
                    blob: imageData.blob,
                    title: imageData.title,
                    fileName: imageData.fileName,
                    isUploaded: true
                });
            }
        }
        
        return assignments;
    }

    /**
     * Format file size in human readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} - Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Create and export singleton instance
const dalleService = new DalleService();

// Make available globally
window.dalleService = dalleService;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = dalleService;
}
