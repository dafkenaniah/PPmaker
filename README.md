# PowerPoint Generator

An AI-powered desktop application for creating and updating PowerPoint presentations with audience targeting and advanced configuration options.

## Features

### 🎯 Multi-Tab Interface
- **Create New**: Generate presentations from scratch using AI
- **Update Existing**: Upload and modify existing PowerPoint files
- **Audience Settings**: Target specific stakeholders in game development
- **Configuration**: Customize AI models and application settings

### 🤖 AI-Powered Generation
- Support for multiple AI models (GPT-4.1, Claude, Gemini)
- Audience-specific content optimization
- Configurable creativity levels and response lengths
- Real-time connection testing

### 👥 Audience Targeting
Optimize presentations for specific game development stakeholders:
- **Executive Leadership**: CEOs, VPs, Studio Heads
- **Development Teams**: Engineers, Designers, Artists
- **Product Management**: Product Managers, Producers
- **Marketing & Publishing**: Marketing Teams, Publishers
- **Quality Assurance**: QA Teams, Test Engineers
- **External Partners**: Publishers, Investors, Platform Holders

### 🔧 Advanced Features
- File drag-and-drop support
- PowerPoint file parsing and updating
- Persistent settings and preferences
- Auto-save functionality
- Keyboard shortcuts
- Cross-platform desktop app (Windows, macOS, Linux)

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/powerpoint-generator/powerpoint-generator-app.git
   cd powerpoint-generator-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```
   This will start a local server and launch the Electron app with hot reload.

### Building for Production

1. **Build for current platform**
   ```bash
   npm run build
   ```

2. **Build for specific platforms**
   ```bash
   # Windows
   npm run build-win
   
   # macOS
   npm run build-mac
   
   # Linux
   npm run build-linux
   ```

3. **Create installer packages**
   ```bash
   npm run dist
   ```

## Usage

### Getting Started

1. **Launch the application**
   - Development: `npm run dev`
   - Production: Run the installed application

2. **Configure AI Settings**
   - Go to the "Configuration" tab
   - Select your preferred AI model
   - Adjust creativity level and response length
   - Test the connection

3. **Set Audience Preferences**
   - Navigate to "Audience Settings"
   - Select target stakeholders
   - Save your preferences

### Creating New Presentations

1. **Switch to "Create New" tab**
2. **Enter your presentation notes**
   - Use `#` for slide titles
   - Use `-` for bullet points
   - Write at least 100 characters for best results
3. **Click "Generate Slide Outline"**
4. **Review and edit the generated outline**
5. **Click "Create PowerPoint" to generate the file**

### Updating Existing Presentations

1. **Switch to "Update Existing" tab**
2. **Upload your PowerPoint file**
   - Drag and drop or click to browse
   - Supports .pptx and .ppt files
3. **Enter update instructions**
   - Describe what changes you want to make
4. **Click "Process Updates"**
5. **Download the updated presentation**

## Keyboard Shortcuts

- `Ctrl/Cmd + Enter`: Generate outline
- `Ctrl/Cmd + S`: Save current state
- `Ctrl/Cmd + R`: Regenerate outline
- `Ctrl/Cmd + 1-4`: Switch between tabs
- `Esc`: Close modals
- `F1`: Show help

## Configuration

### AI Models

The application supports multiple AI models:

- **GPT-4.1** (Recommended): Latest OpenAI model with excellent quality
- **GPT-4.1 Mini**: Faster, cost-effective version
- **Claude Opus 4**: Anthropic's premium model
- **Claude Sonnet 4**: Balanced performance and speed
- **Gemini 2.5 Pro**: Google's multimodal model

### Settings Storage

- Application settings are stored locally
- Window position and size are remembered
- Audience preferences persist between sessions
- AI configuration is saved automatically

## File Structure

```
powerpoint-generator/
├── electron/                 # Electron main process files
│   ├── main.js              # Main Electron process
│   ├── preload.js           # Preload script for security
│   └── splash.html          # Splash screen
├── js/                      # JavaScript application code
│   ├── components/          # UI components
│   ├── services/           # API and service layers
│   └── utils/              # Utility functions
├── build/                   # Build assets (icons, etc.)
├── dist/                    # Built application packages
├── index.html              # Main application HTML
├── styles.css              # Application styles
└── package.json            # Project configuration
```

## Development

### Architecture

The application follows a modular component-based architecture:

- **Components**: Self-contained UI modules with their own logic
- **Services**: API integrations and data processing
- **Utils**: Shared utility functions and formatters
- **Electron**: Desktop app wrapper with native OS integration

### Adding New Features

1. Create component files in `js/components/`
2. Add service integrations in `js/services/`
3. Update the main app in `js/app.js`
4. Add styles to `styles.css`
5. Test in development mode

### Code Style

- Use ES6+ JavaScript features
- Follow consistent naming conventions
- Add JSDoc comments for functions
- Maintain separation of concerns

## API Integration

The application requires backend services for:

- AI model integration (OpenAI, Anthropic, Google)
- PowerPoint file processing
- Python script execution for file generation

Configure API endpoints in `js/config.js`.

## Security

- Context isolation enabled in Electron
- No Node.js integration in renderer
- Secure IPC communication
- External link handling
- Input validation and sanitization

## Troubleshooting

### Common Issues

1. **Application won't start**
   - Check Node.js version (18+ required)
   - Run `npm install` to ensure dependencies are installed
   - Check console for error messages

2. **AI connection fails**
   - Verify API keys are configured
   - Test internet connection
   - Check firewall settings

3. **File upload issues**
   - Ensure file is valid PowerPoint format
   - Check file size limits (50MB max)
   - Verify file permissions

### Debug Mode

Run with debug logging:
```bash
DEBUG=* npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- Report issues: [GitHub Issues](https://github.com/powerpoint-generator/powerpoint-generator-app/issues)
- Documentation: [Wiki](https://github.com/powerpoint-generator/powerpoint-generator-app/wiki)
- Email: support@powerpointgenerator.com

## Changelog

### v1.0.0
- Initial release
- Multi-tab interface
- AI-powered presentation generation
- Audience targeting system
- PowerPoint file updating
- Cross-platform desktop app
- Configuration management
- Auto-save functionality

---

Built with ❤️ using Electron, modern JavaScript, and AI technologies.
