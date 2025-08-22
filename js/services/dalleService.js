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
     * Create a visual chart placeholder based on chart type
     * @param {string} prompt - Image prompt (contains chart type and title)
     * @param {string} size - Image size
     * @returns {Promise<Blob>} - Visual chart placeholder blob
     */
    async createPlaceholderImage(prompt, size) {
        const [width, height] = size.split('x').map(Number);
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Determine chart type from prompt
        let chartType = 'bar-chart';
        if (prompt.includes('pie chart')) chartType = 'pie-chart';
        else if (prompt.includes('line graph') || prompt.includes('line chart')) chartType = 'line-chart';
        else if (prompt.includes('funnel')) chartType = 'funnel';
        else if (prompt.includes('bar chart')) chartType = 'bar-chart';
        
        // Extract title from prompt
        const titleMatch = prompt.match(/titled "([^"]+)"/);
        const chartTitle = titleMatch ? titleMatch[1] : 'Chart';
        
        // Draw chart based on type
        this.drawChart(ctx, chartType, chartTitle, width, height);
        
        return new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
        });
    }

    /**
     * Draw actual chart visuals with contextual data
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} chartType - Chart type
     * @param {string} title - Chart title
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    drawChart(ctx, chartType, title, width, height) {
        const chartArea = {
            x: 100,
            y: 100,
            width: width - 200,
            height: height - 200
        };

        // Draw title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, width / 2, 50);

        // Get contextual data based on chart type and title
        const chartData = this.getContextualChartData(chartType, title);

        // Draw chart based on type with contextual data
        switch (chartType) {
            case 'bar-chart':
                this.drawContextualBarChart(ctx, chartArea, chartData, width);
                break;
            case 'pie-chart':
                this.drawContextualPieChart(ctx, chartArea, chartData, width);
                break;
            case 'line-chart':
                this.drawContextualLineChart(ctx, chartArea, chartData, width);
                break;
            case 'funnel':
                this.drawContextualFunnelChart(ctx, chartArea, chartData);
                break;
            default:
                this.drawContextualBarChart(ctx, chartArea, chartData, width);
        }
    }

    /**
     * Get contextual data based on chart type and title
     * @param {string} chartType - Chart type
     * @param {string} title - Chart title
     * @returns {Object} - Contextual chart data
     */
    getContextualChartData(chartType, title) {
        const titleLower = title.toLowerCase();
        
        // Revenue/Financial charts
        if (titleLower.includes('revenue') || titleLower.includes('growth')) {
            return {
                labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                values: [2.1, 2.8, 3.2, 3.9],
                units: 'M',
                currency: '$',
                colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']
            };
        }
        
        // Market Share charts
        if (titleLower.includes('market') || titleLower.includes('share')) {
            return {
                labels: ['Our Product', 'Competitor A', 'Competitor B', 'Others'],
                values: [35, 28, 22, 15],
                units: '%',
                colors: ['#2ca02c', '#ff7f0e', '#d62728', '#9467bd']
            };
        }
        
        // KPI/Performance charts
        if (titleLower.includes('kpi') || titleLower.includes('performance')) {
            return {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                values: [78, 82, 85, 79, 88, 92],
                units: '%',
                colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']
            };
        }
        
        // Sales Funnel
        if (titleLower.includes('funnel') || titleLower.includes('conversion')) {
            return {
                labels: ['Awareness', 'Interest', 'Consideration', 'Purchase'],
                values: [100, 65, 35, 18],
                units: '%',
                colors: ['#2ca02c', '#ff7f0e', '#d62728', '#9467bd']
            };
        }
        
        // Bug/Quality charts
        if (titleLower.includes('bug') || titleLower.includes('quality')) {
            return {
                labels: ['Critical', 'Major', 'Minor', 'Enhancement'],
                values: [5, 23, 45, 27],
                units: '',
                colors: ['#d62728', '#ff7f0e', '#2ca02c', '#1f77b4']
            };
        }
        
        // Default business data
        return {
            labels: ['Category A', 'Category B', 'Category C', 'Category D'],
            values: [45, 32, 28, 15],
            units: '',
            colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']
        };
    }

    /**
     * Draw bar chart
     */
    drawBarChart(ctx, area) {
        const bars = [65, 45, 80, 30, 55]; // Sample data
        const barWidth = area.width / bars.length * 0.6;
        const maxValue = Math.max(...bars);
        
        // Draw axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(area.x, area.y);
        ctx.lineTo(area.x, area.y + area.height);
        ctx.lineTo(area.x + area.width, area.y + area.height);
        ctx.stroke();
        
        // Draw bars
        bars.forEach((value, i) => {
            const barHeight = (value / maxValue) * area.height * 0.8;
            const x = area.x + (i * area.width / bars.length) + (area.width / bars.length - barWidth) / 2;
            const y = area.y + area.height - barHeight;
            
            ctx.fillStyle = `hsl(${210 + i * 30}, 70%, 50%)`;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Add value labels
            ctx.fillStyle = '#333';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), x + barWidth / 2, y - 10);
        });
    }

    /**
     * Draw pie chart
     */
    drawPieChart(ctx, area) {
        const data = [30, 25, 20, 15, 10]; // Sample data
        const total = data.reduce((sum, val) => sum + val, 0);
        const centerX = area.x + area.width / 2;
        const centerY = area.y + area.height / 2;
        const radius = Math.min(area.width, area.height) / 3;
        
        let currentAngle = -Math.PI / 2;
        
        data.forEach((value, i) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.fillStyle = `hsl(${i * 72}, 70%, 50%)`;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Add percentage labels
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round((value / total) * 100)}%`, labelX, labelY);
            
            currentAngle += sliceAngle;
        });
    }

    /**
     * Draw line chart
     */
    drawLineChart(ctx, area) {
        const data = [20, 35, 30, 45, 60, 50, 70]; // Sample data
        const maxValue = Math.max(...data);
        
        // Draw axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(area.x, area.y);
        ctx.lineTo(area.x, area.y + area.height);
        ctx.lineTo(area.x + area.width, area.y + area.height);
        ctx.stroke();
        
        // Draw grid lines
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
            const y = area.y + (area.height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(area.x, y);
            ctx.lineTo(area.x + area.width, y);
            ctx.stroke();
        }
        
        // Draw line
        ctx.strokeStyle = '#007BFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((value, i) => {
            const x = area.x + (i / (data.length - 1)) * area.width;
            const y = area.y + area.height - (value / maxValue) * area.height * 0.8;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Draw data points
            ctx.fillStyle = '#007BFF';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        ctx.stroke();
    }

    /**
     * Draw contextual bar chart with proper labels and legend
     */
    drawContextualBarChart(ctx, area, data, canvasWidth) {
        const barWidth = area.width / data.labels.length * 0.6;
        const maxValue = Math.max(...data.values);
        
        // Draw axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(area.x, area.y);
        ctx.lineTo(area.x, area.y + area.height);
        ctx.lineTo(area.x + area.width, area.y + area.height);
        ctx.stroke();
        
        // Draw Y-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = (maxValue / 5) * i;
            const y = area.y + area.height - (i / 5) * area.height;
            const displayValue = data.currency ? 
                `${data.currency}${value.toFixed(1)}${data.units}` : 
                `${value.toFixed(1)}${data.units}`;
            ctx.fillText(displayValue, area.x - 10, y + 4);
        }
        
        // Draw bars with contextual data
        data.values.forEach((value, i) => {
            const barHeight = (value / maxValue) * area.height * 0.8;
            const x = area.x + (i * area.width / data.labels.length) + (area.width / data.labels.length - barWidth) / 2;
            const y = area.y + area.height - barHeight;
            
            ctx.fillStyle = data.colors[i] || `hsl(${210 + i * 30}, 70%, 50%)`;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Add value labels on bars
            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            const displayValue = data.currency ? 
                `${data.currency}${value}${data.units}` : 
                `${value}${data.units}`;
            ctx.fillText(displayValue, x + barWidth / 2, y - 10);
            
            // Add category labels
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.save();
            ctx.translate(x + barWidth / 2, area.y + area.height + 20);
            ctx.rotate(-Math.PI / 6);
            ctx.fillText(data.labels[i], 0, 0);
            ctx.restore();
        });
        
        // Draw legend
        this.drawLegend(ctx, data, canvasWidth - 180, 100);
    }

    /**
     * Draw contextual pie chart with proper labels and legend
     */
    drawContextualPieChart(ctx, area, data, canvasWidth) {
        const total = data.values.reduce((sum, val) => sum + val, 0);
        const centerX = area.x + area.width / 2;
        const centerY = area.y + area.height / 2;
        const radius = Math.min(area.width, area.height) / 3;
        
        let currentAngle = -Math.PI / 2;
        
        data.values.forEach((value, i) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.fillStyle = data.colors[i] || `hsl(${i * 72}, 70%, 50%)`;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Add percentage labels inside slices
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            const percentage = Math.round((value / total) * 100);
            ctx.fillText(`${percentage}%`, labelX, labelY);
            
            currentAngle += sliceAngle;
        });
        
        // Draw legend
        this.drawLegend(ctx, data, canvasWidth - 180, 100);
    }

    /**
     * Draw contextual line chart with proper labels and legend
     */
    drawContextualLineChart(ctx, area, data, canvasWidth) {
        const maxValue = Math.max(...data.values);
        const minValue = Math.min(...data.values);
        const valueRange = maxValue - minValue;
        
        // Draw axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(area.x, area.y);
        ctx.lineTo(area.x, area.y + area.height);
        ctx.lineTo(area.x + area.width, area.y + area.height);
        ctx.stroke();
        
        // Draw Y-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = minValue + (valueRange / 5) * i;
            const y = area.y + area.height - (i / 5) * area.height;
            const displayValue = data.currency ? 
                `${data.currency}${value.toFixed(1)}${data.units}` : 
                `${value.toFixed(1)}${data.units}`;
            ctx.fillText(displayValue, area.x - 10, y + 4);
        }
        
        // Draw grid lines
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
            const y = area.y + (area.height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(area.x, y);
            ctx.lineTo(area.x + area.width, y);
            ctx.stroke();
        }
        
        // Draw line with contextual data
        ctx.strokeStyle = data.colors[0] || '#007BFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.values.forEach((value, i) => {
            const x = area.x + (i / (data.values.length - 1)) * area.width;
            const normalizedValue = (value - minValue) / valueRange;
            const y = area.y + area.height - normalizedValue * area.height * 0.8;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Draw data points
            ctx.fillStyle = data.colors[0] || '#007BFF';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
            
            // Add data labels
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            const displayValue = data.currency ? 
                `${data.currency}${value}${data.units}` : 
                `${value}${data.units}`;
            ctx.fillText(displayValue, x, y - 15);
        });
        ctx.stroke();
        
        // Draw X-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        data.labels.forEach((label, i) => {
            const x = area.x + (i / (data.labels.length - 1)) * area.width;
            ctx.fillText(label, x, area.y + area.height + 20);
        });
        
        // Draw legend
        this.drawLegend(ctx, data, canvasWidth - 180, 100);
    }

    /**
     * Draw contextual funnel chart with proper labels
     */
    drawContextualFunnelChart(ctx, area, data) {
        data.labels.forEach((label, i) => {
            const stageHeight = area.height / data.labels.length * 0.8;
            const y = area.y + i * (area.height / data.labels.length);
            const widthRatio = data.values[i] / Math.max(...data.values);
            const stageWidth = area.width * widthRatio;
            const x = area.x + (area.width - stageWidth) / 2;
            
            // Draw funnel stage
            ctx.fillStyle = data.colors[i] || `hsl(${210 - i * 20}, 70%, ${60 - i * 5}%)`;
            ctx.fillRect(x, y, stageWidth, stageHeight);
            
            // Add stage border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, stageWidth, stageHeight);
            
            // Add stage labels
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            const displayValue = `${label} (${data.values[i]}${data.units})`;
            ctx.fillText(displayValue, area.x + area.width / 2, y + stageHeight / 2 + 6);
        });
    }

    /**
     * Draw legend for charts
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} data - Chart data
     * @param {number} x - Legend X position
     * @param {number} y - Legend Y position
     */
    drawLegend(ctx, data, x, y) {
        const legendItemHeight = 25;
        
        // Draw legend background
        const legendHeight = data.labels.length * legendItemHeight + 20;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.fillRect(x - 10, y - 10, 150, legendHeight);
        ctx.strokeRect(x - 10, y - 10, 150, legendHeight);
        
        // Draw legend title
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Legend', x, y + 12);
        
        // Draw legend items
        data.labels.forEach((label, i) => {
            const itemY = y + 30 + i * legendItemHeight;
            
            // Draw color box
            ctx.fillStyle = data.colors[i] || `hsl(${i * 72}, 70%, 50%)`;
            ctx.fillRect(x, itemY - 8, 15, 15);
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, itemY - 8, 15, 15);
            
            // Draw label text
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.fillText(label, x + 20, itemY + 4);
            
            // Draw value
            ctx.fillStyle = '#666';
            ctx.font = '11px Arial';
            const value = data.currency ? 
                `${data.currency}${data.values[i]}${data.units}` : 
                `${data.values[i]}${data.units}`;
            ctx.fillText(value, x + 20, itemY + 16);
        });
    }

    /**
     * Draw bar chart
     */
    drawBarChart(ctx, area) {
        const bars = [65, 45, 80, 30, 55]; // Sample data
        const barWidth = area.width / bars.length * 0.6;
        const maxValue = Math.max(...bars);
        
        // Draw axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(area.x, area.y);
        ctx.lineTo(area.x, area.y + area.height);
        ctx.lineTo(area.x + area.width, area.y + area.height);
        ctx.stroke();
        
        // Draw bars
        bars.forEach((value, i) => {
            const barHeight = (value / maxValue) * area.height * 0.8;
            const x = area.x + (i * area.width / bars.length) + (area.width / bars.length - barWidth) / 2;
            const y = area.y + area.height - barHeight;
            
            ctx.fillStyle = `hsl(${210 + i * 30}, 70%, 50%)`;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Add value labels
            ctx.fillStyle = '#333';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), x + barWidth / 2, y - 10);
        });
    }

    /**
     * Draw pie chart
     */
    drawPieChart(ctx, area) {
        const data = [30, 25, 20, 15, 10]; // Sample data
        const total = data.reduce((sum, val) => sum + val, 0);
        const centerX = area.x + area.width / 2;
        const centerY = area.y + area.height / 2;
        const radius = Math.min(area.width, area.height) / 3;
        
        let currentAngle = -Math.PI / 2;
        
        data.forEach((value, i) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.fillStyle = `hsl(${i * 72}, 70%, 50%)`;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Add percentage labels
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round((value / total) * 100)}%`, labelX, labelY);
            
            currentAngle += sliceAngle;
        });
    }

    /**
     * Draw line chart
     */
    drawLineChart(ctx, area) {
        const data = [20, 35, 30, 45, 60, 50, 70]; // Sample data
        const maxValue = Math.max(...data);
        
        // Draw axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(area.x, area.y);
        ctx.lineTo(area.x, area.y + area.height);
        ctx.lineTo(area.x + area.width, area.y + area.height);
        ctx.stroke();
        
        // Draw grid lines
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) {
            const y = area.y + (area.height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(area.x, y);
            ctx.lineTo(area.x + area.width, y);
            ctx.stroke();
        }
        
        // Draw line
        ctx.strokeStyle = '#007BFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((value, i) => {
            const x = area.x + (i / (data.length - 1)) * area.width;
            const y = area.y + area.height - (value / maxValue) * area.height * 0.8;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Draw data points
            ctx.fillStyle = '#007BFF';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        ctx.stroke();
    }

    /**
     * Draw funnel chart
     */
    drawFunnelChart(ctx, area) {
        const stages = ['Awareness', 'Interest', 'Consideration', 'Purchase'];
        const values = [100, 75, 50, 25]; // Sample conversion percentages
        
        stages.forEach((stage, i) => {
            const stageHeight = area.height / stages.length * 0.8;
            const y = area.y + i * (area.height / stages.length);
            const widthRatio = values[i] / 100;
            const stageWidth = area.width * widthRatio;
            const x = area.x + (area.width - stageWidth) / 2;
            
            // Draw funnel stage
            ctx.fillStyle = `hsl(${210 - i * 20}, 70%, ${60 - i * 5}%)`;
            ctx.fillRect(x, y, stageWidth, stageHeight);
            
            // Add stage labels
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${stage} (${values[i]}%)`, area.x + area.width / 2, y + stageHeight / 2);
        });
    }

    /**
     * Build DALL-E prompt for chart generation - Focused on actual visual charts
     * @param {string} chartType - Type of chart
     * @param {Object} data - Chart data
     * @param {string} title - Chart title
     * @param {string} stakeholderGroup - Target stakeholder group
     * @param {string} customPrompt - Custom user prompt
     * @param {string} style - Visual style
     * @returns {string} - Complete DALL-E prompt
     */
    buildChartPrompt(chartType, data, title, stakeholderGroup, customPrompt, style) {
        // Create focused prompts for actual visual charts
        const chartVisuals = {
            'bar-chart': `A professional vertical bar chart visualization with 4-5 bars of different heights showing data comparison. Clean axis labels, grid lines, and numerical values displayed on top of each bar. Corporate blue color scheme.`,
            'line-chart': `A clean line graph with data points connected by a smooth trending line. X and Y axis with grid lines, data points marked with circles, and a clear upward or downward trend. Professional blue line color.`,
            'pie-chart': `A modern pie chart with 4-6 colored segments, each segment clearly labeled with percentages and category names. Clean design with subtle shadows and corporate color palette.`,
            'scatter-plot': `A scatter plot visualization with data points distributed across X and Y axes. Clear axis labels, grid lines, and data points in different colors to show patterns or correlations.`,
            'area-chart': `An area chart showing data trends over time with filled area under the curve. Gradient fill from bottom to top, clear axis labels and smooth curved lines.`,
            'donut-chart': `A modern donut chart with hollow center containing summary statistics. Colored segments with clear labels and percentages, professional color scheme.`,
            'stacked-bar': `A stacked horizontal bar chart with multiple colored sections in each bar representing different categories. Clear legend and category labels.`,
            'timeline': `A horizontal timeline visualization with milestone markers, dates, and event descriptions. Clean design with connecting lines and milestone icons.`,
            'funnel': `A funnel chart visualization showing conversion stages from wide top to narrow bottom. Each stage labeled with conversion rates and stage names. Professional color gradient.`,
            'gauge': `A gauge/speedometer chart with semicircular design, colored zones (red, yellow, green), and a needle pointing to current value. Clear numerical scale.`,
            'heatmap': `A grid-based heatmap with colored cells representing data intensity. Color scale from light to dark, with axis labels and legend showing value ranges.`,
            'treemap': `A treemap visualization with rectangular blocks of different sizes representing data values. Each block labeled and colored according to categories.`
        };

        let visualPrompt = chartVisuals[chartType] || 'A professional data visualization chart';

        // Add title integration
        if (title) {
            visualPrompt = visualPrompt.replace('chart', `chart titled "${title}"`);
        }

        // Add stakeholder-specific color schemes
        const colorSchemes = {
            'executive': 'Use corporate colors: navy blue, silver, and white with bold fonts.',
            'development': 'Use tech colors: blue (#007ACC), green (#28A745), and orange (#FD7E14).',
            'product': 'Use modern colors: purple (#6F42C1), teal (#20C997), and coral (#FF6B6B).',
            'marketing': 'Use brand colors: vibrant blue (#007BFF), gold (#FFC107), and red (#DC3545).',
            'qa': 'Use status colors: green (#28A745) for pass, red (#DC3545) for fail, yellow (#FFC107) for warning.',
            'partners': 'Use neutral colors: gray (#6C757D), blue (#007BFF), and white with professional styling.'
        };

        if (stakeholderGroup && colorSchemes[stakeholderGroup]) {
            visualPrompt += ` ${colorSchemes[stakeholderGroup]}`;
        }

        // Add technical specifications for actual chart creation
        visualPrompt += ` The chart must be a clear data visualization with:
- Actual chart elements (bars, lines, pie slices, etc.) not just text
- Professional axis labels and numerical scales
- Clean typography for labels and titles
- High contrast for readability
- White or transparent background
- No decorative text, just chart title and data labels
- Photorealistic chart rendering suitable for business presentations`;

        return visualPrompt;
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
