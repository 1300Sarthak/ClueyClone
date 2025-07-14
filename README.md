# Cluely Copilot

An invisible AI co-pilot that reads your screen and listens to conversations to provide intelligent, context-aware assistance during meetings, interviews, and technical discussions.

## 🎯 **What is Cluely Copilot?**

Cluely Copilot is an invisible desktop application that combines:

- **Real-time audio transcription** using OpenAI Whisper
- **Screen content analysis** using OCR and AI vision
- **Intelligent AI responses** using the Cluely system prompt
- **Invisible operation** that bypasses most screen recording software

## 🚀 **Key Features**

### **🎤 Audio Intelligence**

- Real-time microphone recording and transcription
- Automatic speaker detection and conversation analysis
- Context-aware question detection and response generation

### **🖥️ Screen Intelligence**

- Continuous screen content extraction using OCR
- Visual context understanding and analysis
- Integration with audio context for comprehensive assistance

### **🤖 AI-Powered Assistance**

- **Question Answering**: Direct answers to questions asked in meetings
- **Term Definitions**: Automatic explanation of technical terms and concepts
- **Follow-up Suggestions**: Intelligent conversation advancement prompts
- **Screen Problem Solving**: Analysis and solutions for visible problems

### **👻 Invisibility Features**

The application is invisible to:

- Zoom versions below 6.1.6 (inclusive)
- All browser-based screen recording software
- All versions of Discord
- Mac OS screenshot functionality (Command + Shift + 3/4)

**Note**: The application is **NOT** invisible to:

- Zoom versions 6.1.6 and above
- Mac OS native screen recording (Command + Shift + 5)

## ⌨️ **Global Commands**

- **Toggle Copilot**: `⌘ + Shift + K` - Activate/deactivate the AI copilot
- **Toggle Window**: `⌘ + B` - Show/hide the application window
- **Move Window**: `⌘ + Arrow Keys` - Reposition the window
- **Take Screenshot**: `⌘ + H` - Capture screen for analysis
- **Process Screenshots**: `⌘ + Enter` - Analyze captured screenshots
- **Reset View**: `⌘ + R` - Reset to initial state

## 🎯 **Use Cases**

### **1. Technical Interviews**

- **Original Interview Coder functionality**: Capture coding problems and get AI-generated solutions
- **Enhanced with copilot**: Real-time assistance during live coding sessions

### **2. Business Meetings**

- **Term Definitions**: Automatically explain technical terms mentioned
- **Follow-up Questions**: Generate relevant questions to advance discussions
- **Action Items**: Help identify and track meeting action items

### **3. Technical Discussions**

- **Code Reviews**: Analyze code on screen and provide feedback
- **Architecture Discussions**: Explain technical concepts and patterns
- **Problem Solving**: Assist with debugging and technical challenges

### **4. Learning & Training**

- **Real-time Explanations**: Get instant explanations of concepts
- **Context-Aware Help**: Assistance based on current screen content
- **Knowledge Reinforcement**: Automatic definition of technical terms

## 🛠️ **Technical Architecture**

### **Core Components**

- **AudioHelper**: Real-time audio recording and Whisper transcription
- **OCRHelper**: Screen text extraction using Tesseract.js
- **CluelyAIHelper**: AI processing using the Cluely system prompt
- **WindowHelper**: Invisible window management
- **ScreenshotHelper**: Screen capture and management

### **AI Processing Pipeline**

1. **Audio Capture** → Whisper transcription → Context analysis
2. **Screen Capture** → OCR text extraction → Visual context
3. **AI Analysis** → Cluely prompt processing → Intelligent response
4. **Response Display** → Contextual UI → User interaction

### **Privacy & Security**

- **Local-First**: All processing happens locally when possible
- **Secure Storage**: API keys stored securely using electron-store
- **No Persistent Logging**: Audio and screen data not permanently stored
- **User Control**: Complete control over when copilot is active

## 📋 **Prerequisites**

- Node.js (v16 or higher)
- npm or bun package manager
- OpenAI API key (for AI features)
- Screen Recording Permission for Terminal/IDE
- Microphone Permission for audio recording

### **macOS Setup**

1. Go to System Preferences > Security & Privacy > Privacy > Screen Recording
2. Ensure your Terminal app (or IDE) has screen recording permission enabled
3. Go to System Preferences > Security & Privacy > Privacy > Microphone
4. Ensure your Terminal app has microphone permission enabled
5. Restart your Terminal/IDE after enabling permissions

### **Windows Setup**

- No additional permissions needed for basic functionality
- May require microphone access permissions

## 🚀 **Installation & Usage**

### **1. Clone and Install**

```bash
git clone https://github.com/ibttf/cluely-copilot.git
cd cluely-copilot
npm install
# or if using bun
bun install
```

### **2. Start Development**

```bash
npm run app:dev
# or
bun run app:dev
```

### **3. First Launch**

1. Enter your OpenAI API key when prompted
2. The application will appear as an invisible window
3. Use `⌘ + B` to show/hide the interface

### **4. Using the Copilot**

1. Press `⌘ + Shift + K` to activate the copilot
2. The copilot will start listening to audio and analyzing your screen
3. Ask questions or discuss topics naturally
4. The copilot will provide intelligent responses based on context
5. Press `⌘ + Shift + K` again to deactivate

## 🏗️ **Tech Stack**

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Electron + Node.js
- **AI**: OpenAI GPT-4 + Whisper API
- **OCR**: Tesseract.js
- **Audio**: Native platform recording APIs
- **UI**: Radix UI Components

## 🔧 **Configuration**

### **Environment Variables**

- `OPENAI_API_KEY`: Your OpenAI API key (stored securely)

### **Settings**

- Audio recording quality and duration
- Screen capture frequency
- AI response preferences
- Privacy and data retention settings

## 🤝 **Contributing**

Contributions are welcome! Please feel free to submit a Pull Request.

### **Development Guidelines**

- Follow TypeScript best practices
- Maintain the invisible operation principle
- Ensure privacy and security standards
- Test across different platforms

## 📄 **License**

ISC License

## 🙏 **Acknowledgments**

Built with inspiration from the original Interview Coder project, enhanced with Cluely's intelligent meeting assistance capabilities.

---

**Note**: This application is designed for legitimate use cases like productivity enhancement and learning assistance. Users are responsible for complying with their organization's policies and applicable laws regarding recording and AI assistance tools.
