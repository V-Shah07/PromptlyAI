# Promptly - Agentic AI Personal Productivity Assistant

![Promptly Logo](assets/images/icon.png)

**Promptly** is an advanced agentic AI-powered React Native productivity app that acts as an intelligent personal assistant. It autonomously analyzes your schedule, makes intelligent decisions about task scheduling, and proactively manages your calendar through sophisticated AI agents that understand context, resolve conflicts, and optimize your daily workflow.

## 🚀 Features

### Core Features

#### 🤖 Agentic AI Planning System

- **Autonomous Scheduling Agent**: AI agent independently analyzes your existing calendar events and creates optimized schedules for new tasks
- **Intelligent Decision Making**: The AI agent makes context-aware decisions about task prioritization, duration estimation, and optimal timing
- **Proactive Conflict Resolution**: AI agent automatically detects scheduling conflicts and intelligently suggests alternative time slots
- **Adaptive Learning**: The system learns from your preferences and scheduling patterns to improve future recommendations
- **Voice-Driven Interaction**: Natural language processing allows you to communicate with the AI agent using voice commands
- **Restricted Hours Management**: AI agent respects your personal boundaries and automatically avoids scheduling during restricted time periods

#### 📅 Google Calendar Integration

- **Seamless Sync**: Full integration with Google Calendar API
- **Event Management**: Create, move, delete, and reschedule events directly from the app
- **Real-time Updates**: View and manage your calendar events in real-time
- **Multi-calendar Support**: Works with all your Google calendars

#### ⏱️ Advanced Time Tracking

- **Built-in Stopwatch**: Track actual time spent on tasks with pause/resume functionality
- **Estimated vs Actual**: Compare planned time with actual time spent
- **Task Completion Tracking**: Mark tasks as completed with visual indicators
- **Time Analytics**: Detailed insights into your time management patterns

#### 📊 Comprehensive Analytics

- **Time Efficiency Metrics**: Track how well you estimate task durations
- **Category Distribution**: Visual breakdown of tasks by category (work, health, social, etc.)
- **Priority Analysis**: Monitor high, medium, and low priority task distribution
- **Completion Rates**: Track your task completion percentage over time
- **Personalized Insights**: AI-generated recommendations for improving productivity

#### 🎯 Task Management

- **Swipe Gestures**: Swipe right to complete tasks, swipe left to delete
- **Task Categories**: Automatic categorization with color-coded tags
- **Priority Levels**: High, medium, and low priority task classification
- **Task Details**: Detailed task view with descriptions, timing, and progress tracking

#### 🎨 Modern UI/UX

- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Intuitive Navigation**: Tab-based navigation with clear visual hierarchy
- **Responsive Design**: Optimized for both iOS and Android devices

## 🛠️ Tech Stack

### Frontend Framework

- **React Native 0.81.4**: Cross-platform mobile development
- **Expo SDK 54**: Development platform and toolchain
- **TypeScript**: Type-safe JavaScript development
- **Expo Router**: File-based routing system

### Agentic AI & Machine Learning

- **OpenAI Whisper API**: Speech-to-text transcription for natural language interaction
- **Custom Planning API**: Agentic AI-powered task scheduling with autonomous decision-making ([PlanningAPI](https://github.com/V-Shah07/PlanningAPI))
- **Custom Calendar API**: Intelligent Google Calendar integration with AI-driven event management ([CalendarAPI](https://github.com/V-Shah07/CalendarAPI))
- **Context-Aware AI Agents**: Multiple specialized AI agents that work together to understand user intent and execute complex scheduling tasks

### Backend Services

- **Firebase Firestore**: Real-time database for user data, analytics, and preferences
- **Google Calendar API**: Calendar event management
- **Google Sign-In**: Authentication and user management

### Key Dependencies

- **@react-native-google-signin/google-signin**: Google authentication
- **@react-native-voice/voice**: Voice recording capabilities
- **expo-av**: Audio recording and playback
- **expo-speech**: Text-to-speech functionality
- **react-native-reanimated**: Smooth animations
- **react-native-gesture-handler**: Touch gesture handling
- **axios**: HTTP client for API requests

## 🏗️ Architecture

### App Structure

```
app/
├── _layout.tsx              # Root layout with navigation stack
├── (tabs)/                  # Tab navigation screens
│   ├── index.tsx           # Main dashboard/home screen
│   ├── explore.tsx         # Explore/discovery screen
│   ├── tts.tsx             # Text-to-speech screen
│   └── ttsAPI.tsx          # Speech-to-text API integration
├── ai-planner.tsx          # AI planning interface
├── task-details.tsx        # Detailed task view with timer
├── analytics.tsx           # Analytics dashboard
└── preferences.tsx         # User preferences and settings
```

### Key Components

- **Calendar Integration**: `calendarApiFunctions.ts` - Handles all Google Calendar operations
- **Firebase Services**: `lib/firebase.ts` - Database operations and analytics
- **Time Utilities**: `utils/timeUtils.ts` - Time validation and formatting
- **UI Components**: `components/` - Reusable UI components with theming

### Data Flow

1. **Authentication**: Google Sign-In → Firebase user management
2. **Calendar Sync**: Google Calendar API → Local state management
3. **AI Planning**: User input → Planning API → Calendar events
4. **Time Tracking**: Local stopwatch → Firebase analytics
5. **Analytics**: Firebase data → Visual dashboards

## 🔧 Custom API Integrations

### Planning API (Agentic AI Agent)

**Repository**: [PlanningAPI](https://github.com/V-Shah07/PlanningAPI)

- **Purpose**: Autonomous AI agent for intelligent task scheduling and optimization
- **Agentic Features**:
  - **Autonomous Decision Making**: AI agent independently analyzes context and makes scheduling decisions
  - **Multi-step Reasoning**: Breaks down complex scheduling requests into actionable steps
  - **Context Awareness**: Understands user preferences, existing commitments, and time constraints
  - **Proactive Problem Solving**: Anticipates conflicts and automatically resolves them
  - **Adaptive Learning**: Learns from user feedback to improve future recommendations
- **Integration**: RESTful API calls with agentic AI responses from the React Native app

### Calendar API

**Repository**: [CalendarAPI](https://github.com/V-Shah07/CalendarAPI)

- **Purpose**: Google Calendar event management
- **Features**:
  - Create, read, update, delete calendar events
  - Multi-calendar support
  - Time zone handling
  - Event conflict detection
- **Integration**: OAuth2 authentication with Google Calendar API

## 📱 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for development)
- Google Cloud Console project with Calendar API enabled

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/promptly-app.git
   cd promptly-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Google Sign-In**

   - Create a project in [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Update `app.json` with your client IDs:
     ```json
     {
       "expo": {
         "plugins": [
           [
             "@react-native-google-signin/google-signin",
             {
               "iosUrlScheme": "your-ios-client-id"
             }
           ]
         ]
       }
     }
     ```

4. **Configure Firebase**

   - Create a Firebase project
   - Enable Firestore database
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Update Firebase configuration in `lib/firebase.ts`

5. **Set up Custom APIs**

   - Deploy your Planning API and Calendar API
   - Update API endpoints in:
     - `app/ai-planner.tsx` (Planning API URL)
     - `app/calendarApiFunctions.ts` (Calendar API URL)

6. **Configure OpenAI API**
   - Get OpenAI API key
   - Update the API key in `app/(tabs)/ttsAPI.tsx`

### Running the App

1. **Start the development server**

   ```bash
   npm start
   # or
   yarn start
   ```

2. **Run on specific platforms**

   ```bash
   # iOS
   npm run ios

   # Android
   npm run android

   # Web
   npm run web
   ```

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# Google OAuth
GOOGLE_WEB_CLIENT_ID=your-web-client-id
GOOGLE_IOS_CLIENT_ID=your-ios-client-id

# Firebase
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_PROJECT_ID=your-firebase-project-id

# Custom APIs
PLANNING_API_URL=https://your-planning-api-url.com
CALENDAR_API_URL=https://your-calendar-api-url.com

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

## 📊 Analytics & Insights

The app provides comprehensive analytics through Firebase Firestore:

### Time Tracking Analytics

- **Efficiency Metrics**: Compare estimated vs actual task duration
- **Completion Rates**: Track task completion percentage
- **Time Distribution**: Analyze how time is spent across categories

### Category Analytics

- **Work Tasks**: Professional and project-related activities
- **Health & Fitness**: Exercise, medical appointments, wellness
- **Social**: Meetings, events, personal interactions
- **Academic**: Study sessions, classes, educational activities
- **Personal**: Individual tasks and self-care activities

### Priority Analytics

- **High Priority**: Urgent and important tasks
- **Medium Priority**: Important but not urgent tasks
- **Low Priority**: Nice-to-have tasks

## 🎯 Key Features Implementation

### Agentic AI Planning System

The agentic AI planning system operates as an autonomous intelligent agent with sophisticated decision-making capabilities:

1. **Natural Language Understanding**: AI agent processes user input via text or voice, understanding intent and context
2. **Contextual Analysis**: Agent autonomously analyzes existing calendar events, user preferences, and time constraints
3. **Intelligent Decision Making**: AI agent makes independent decisions about task prioritization, duration estimation, and optimal scheduling
4. **Proactive Conflict Resolution**: Agent anticipates and automatically resolves scheduling conflicts using advanced reasoning
5. **Multi-step Execution**: Agent breaks down complex requests into sequential actions and executes them autonomously
6. **Adaptive Learning**: System learns from user feedback and scheduling patterns to improve future agent decisions
7. **Calendar Integration**: Agent directly creates and manages events in Google Calendar without human intervention
8. **User Confirmation**: Users can approve, modify, or reject agent decisions, providing feedback for learning

### Voice Integration

- **Recording**: Uses Expo AV for high-quality audio recording
- **Transcription**: OpenAI Whisper API converts speech to text
- **Processing**: Transcribed text is sent to AI planning system
- **Feedback**: Visual and haptic feedback during recording

### Time Tracking System

- **Stopwatch**: Built-in timer with pause/resume functionality
- **Data Persistence**: All tracking data stored in Firebase
- **Analytics**: Real-time insights into time management patterns
- **Visualization**: Charts and graphs for easy understanding

## 🔒 Security & Privacy

- **OAuth2 Authentication**: Secure Google Sign-In integration
- **Token Management**: Automatic token refresh and secure storage
- **Data Encryption**: All data encrypted in transit and at rest
- **Privacy Controls**: Users control their data and can delete accounts
- **API Security**: Secure API endpoints with proper authentication

## 🚀 Deployment

### iOS App Store

1. Configure iOS-specific settings in `app.json`
2. Build production bundle: `expo build:ios`
3. Submit to App Store Connect

### Google Play Store

1. Configure Android-specific settings in `app.json`
2. Build production APK: `expo build:android`
3. Submit to Google Play Console

### Web Deployment

1. Build web version: `expo build:web`
2. Deploy to hosting service (Vercel, Netlify, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI**: For Whisper speech-to-text API
- **Google**: For Calendar API and authentication services
- **Expo**: For the excellent React Native development platform
- **Firebase**: For real-time database and analytics
- **React Native Community**: For the amazing ecosystem of libraries

## 📞 Support

For support, email support@promptly-app.com or create an issue in the GitHub repository.

## 🔮 Future Roadmap

- [ ] **Multi-Agent Architecture**: Deploy specialized AI agents for different domains (work, health, social)
- [ ] **Advanced Agentic Capabilities**: Agents that can proactively suggest schedule optimizations
- [ ] **Team Collaboration**: Multi-user agentic AI for shared calendars and collaborative planning
- [ ] **Agent Learning**: Enhanced machine learning for agents to better understand user patterns
- [ ] **Integration with more calendar providers**: Expand agentic AI to work with Outlook, Apple Calendar
- [ ] **Offline Agent Mode**: Agents that can work without internet connectivity
- [ ] **Apple Watch Agent**: Companion app with agentic AI capabilities
- [ ] **Advanced Agent Analytics**: Deep insights into agent decision-making and performance
- [ ] **Custom Agent Training**: Personalized AI agents trained on individual user preferences

---

**Built with ❤️ using React Native, Expo, and Agentic AI**
