# Promptly - Agentic AI Personal Productivity Assistant

![Promptly Logo](logo.jpg)

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

### Quick Setup

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

## 📊 Analytics & Insights

The app provides comprehensive analytics through Firebase Firestore:

- **Time Efficiency**: Compare estimated vs actual task duration with completion rates
- **Category Distribution**: Track work, health, social, academic, and personal activities
- **Priority Analysis**: Monitor high, medium, and low priority task distribution
- **Personalized Insights**: AI-generated recommendations for improving productivity

## 🔮 Future Roadmap

- [ ] **Multi-Agent Architecture**: Deploy specialized AI agents for different domains (work, health, social)
- [ ] **Advanced Agentic Capabilities**: Agents that can proactively suggest schedule optimizations
- [ ] **Team Collaboration**: Multi-user agentic AI for shared calendars and collaborative planning
- [ ] **Custom Agent Training**: Personalized AI agents trained on individual user preferences

---

**Built with ❤️ using React Native, Expo, and Agentic AI**
