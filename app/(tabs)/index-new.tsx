import {
    GoogleSignin,
    GoogleSigninButton,
    isErrorWithCode,
    isNoSavedCredentialFoundResponse,
    isSuccessResponse,
    statusCodes,
} from "@react-native-google-signin/google-signin";
import { Button } from "@react-navigation/elements";
import { router } from "expo-router";
import React from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Your API base URL - change this to your deployed API URL
const API_BASE_URL = "https://web-production-0c742.up.railway.app"; // Production

GoogleSignin.configure({
  webClientId:
    "508082066757-3nua72jbkoidknv98j962h0uodemquoe.apps.googleusercontent.com",
  scopes: [
    "https://www.googleapis.com/auth/calendar", // Add calendar scope
    "https://www.googleapis.com/auth/calendar.events", // Add calendar events scope
  ],
  iosClientId:
    "508082066757-boonvs8n01ec5crn9d6k3n5h1pa8608r.apps.googleusercontent.com",
});

interface CalendarApiService {
  createEvent: (data: {
    title: string;
    start_datetime: string;
    end_datetime: string;
    description?: string;
    calendar_id?: string;
  }) => Promise<any>;

  createCalendar: (data: {
    calendar_name: string;
    description?: string;
  }) => Promise<any>;

  moveEvent: (data: {
    title: string;
    current_start_datetime: string;
    new_start_datetime: string;
    new_end_datetime: string;
    calendar_id?: string;
  }) => Promise<any>;

  findEvent: (data: {
    title: string;
    start_datetime: string;
    calendar_id?: string;
  }) => Promise<any>;

  findEvents: (data: {
    date: string; // YYYY-MM-DD format
  }) => Promise<any>;
}

const Index = () => {
  const [userInfo, setUserInfo] = React.useState<any>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = React.useState(false);

  // Form states for creating events
  const [createEventTitle, setCreateEventTitle] = React.useState("Test Event");
  const [createStartDateTime, setCreateStartDateTime] = React.useState(
    "2025-12-28T10:00:00"
  );
  const [createEndDateTime, setCreateEndDateTime] = React.useState(
    "2025-12-28T11:00:00"
  );

  // Form states for moving events
  const [moveEventTitle, setMoveEventTitle] = React.useState("Test Event");
  const [moveCurrentStartDateTime, setMoveCurrentStartDateTime] =
    React.useState("2025-12-28T10:00:00");
  const [moveNewStartDateTime, setMoveNewStartDateTime] = React.useState(
    "2025-12-28T14:00:00"
  );
  const [moveNewEndDateTime, setMoveNewEndDateTime] = React.useState(
    "2025-12-28T15:00:00"
  );

  // Form states for finding events
  const [findEventsDate, setFindEventsDate] = React.useState("2025-12-28");

  // API service function
  const createApiService = (token: string): CalendarApiService => {
    const makeRequest = async (endpoint: string, data: any) => {
      try {
        console.log(`Making request to: ${API_BASE_URL}${endpoint}`);
        console.log("Request data:", data);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "API request failed");
        }

        return await response.json();
      } catch (error) {
        console.error("API request error:", error);
        throw error;
      }
    };

    return {
      createEvent: (data) => makeRequest("/event/create", data),
      createCalendar: (data) => makeRequest("/calendar/create", data),
      moveEvent: (data) => makeRequest("/event/move", data),
      findEvent: (data) => makeRequest("/event/find", data),
      findEvents: (data) => makeRequest("/events/find", data),
    };
  };

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        setUserInfo({ userInfo: response.data });

        // Get access token
        const tokens = await GoogleSignin.getTokens();
        setAccessToken(tokens.accessToken);
        console.log(
          "Access token obtained:",
          tokens.accessToken ? "Yes" : "No"
        );
      } else {
        console.log("Sign in cancelled by user");
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            Alert.alert("Sign in in progress");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert("Play services not available or outdated");
            break;
          default:
            Alert.alert("Some other error happened", error.message);
        }
      } else {
        console.log("Unknown error", error);
      }
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      setUserInfo(null);
      setAccessToken(null);
      Alert.alert("Signed out successfully");
    } catch (error) {
      console.error(error);
    }
  };

  const getCurrentUser = async () => {
    try {
      const response = await GoogleSignin.signInSilently();
      if (isSuccessResponse(response)) {
        console.log("Current user: ", response);
        setUserInfo({ userInfo: response.data });

        // Get fresh tokens
        const tokens = await GoogleSignin.getTokens();
        setAccessToken(tokens.accessToken);
      } else if (isNoSavedCredentialFoundResponse(response)) {
        console.log("No user is signed in");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Test functions for calendar API
  const testCreateEvent = async () => {
    if (!accessToken) {
      Alert.alert("Error", "Please sign in first");
      return;
    }

    try {
      console.log("Starting create event test...");
      console.log("Access token available:", !!accessToken);
      console.log("API Base URL:", API_BASE_URL);

      // First test basic connectivity
      try {
        const testResponse = await fetch(`${API_BASE_URL}/`);
        console.log("Basic connectivity test:", testResponse.status);
      } catch (connectError) {
        console.error("Connectivity test failed:", connectError);
        Alert.alert(
          "Network Error",
          "Cannot connect to server. Check your network connection and server status."
        );
        return;
      }

      const apiService = createApiService(accessToken);
      const result = await apiService.createEvent({
        title: createEventTitle,
        start_datetime: createStartDateTime,
        end_datetime: createEndDateTime,
        description: "Created from React Native app",
      });

      Alert.alert("Success", `Event created: ${result.message}`);
      console.log("Create event result:", result);
    } catch (error: any) {
      Alert.alert("Error", `Failed to create event: ${error.message}`);
      console.error("Create event error:", error);
    }
  };

  const testMoveEvent = async () => {
    if (!accessToken) {
      Alert.alert("Error", "Please sign in first");
      return;
    }

    try {
      const apiService = createApiService(accessToken);
      const result = await apiService.moveEvent({
        title: moveEventTitle,
        current_start_datetime: moveCurrentStartDateTime,
        new_start_datetime: moveNewStartDateTime,
        new_end_datetime: moveNewEndDateTime,
      });

      Alert.alert("Success", `Event moved: ${result.message}`);
      console.log("Move event result:", result);
    } catch (error: any) {
      Alert.alert("Error", `Failed to move event: ${error.message}`);
      console.error("Move event error:", error);
    }
  };

  const testFindEvents = async () => {
    if (!accessToken) {
      Alert.alert("Error", "Please sign in first");
      return;
    }

    try {
      console.log("Starting find events test...");
      console.log("Date to search:", findEventsDate);

      const apiService = createApiService(accessToken);
      const result = await apiService.findEvents({
        date: findEventsDate,
      });

      // Format the events for display
      const eventsList =
        result.events
          ?.map(
            (event: any) =>
              `• ${event.title} (${event.start_time} - ${event.end_time})`
          )
          .join("\n") || "No events found";

      Alert.alert(
        `Events on ${findEventsDate}`,
        `Found ${result.events?.length || 0} events:\n\n${eventsList}`
      );
      console.log("Find events result:", result);
    } catch (error: any) {
      Alert.alert("Error", `Failed to find events: ${error.message}`);
      console.error("Find events error:", error);
    }
  };

  // TaskItem Component
  const TaskItem = ({ task, time, duration, category, color }: {
    task: string;
    time: string;
    duration: string;
    category: string;
    color: string;
  }) => (
    <TouchableOpacity 
      style={styles.taskItem}
      onPress={() => router.push({
        pathname: '/task-details',
        params: { task, time, duration, category, color }
      })}
    >
      <View style={styles.taskLeft}>
        <View style={styles.taskCircle} />
        <View style={styles.taskContent}>
          <Text style={styles.taskText}>{task}</Text>
          <Text style={styles.taskTime}>{time}</Text>
        </View>
      </View>
      <View style={styles.taskRight}>
        <Text style={styles.taskDuration}>{duration}</Text>
        <View style={[styles.categoryBadge, { backgroundColor: color }]}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {userInfo ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.todayText}>Today</Text>
              <Text style={styles.dateText}>Saturday, September 27</Text>
            </View>
            <View style={styles.profileAvatar}>
              <Text style={styles.avatarText}>J</Text>
            </View>
          </View>

          {/* Daily Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>⚡ Daily Progress</Text>
              <Text style={styles.tasksCount}>0/4 tasks</Text>
            </View>
            <View style={styles.progressStats}>
              <Text style={styles.focusedTime}>6.5h focused time</Text>
              <Text style={styles.onTrack}>85% on track</Text>
            </View>
          </View>

          {/* Plan My Day Button */}
          <TouchableOpacity 
            style={styles.planButton}
            onPress={() => router.push('/ai-planner')}
          >
            <Text style={styles.planButtonText}>+ Plan My Day</Text>
          </TouchableOpacity>

          {/* Today's Schedule */}
          <View style={styles.scheduleSection}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleTitle}>Today's Schedule</Text>
              <Text style={styles.menuDots}>•••</Text>
            </View>

            <TaskItem
              task="Finish ML project slides"
              time="9:00 AM"
              duration="2h"
              category="work"
              color="#5A6ACF"
            />

            <TaskItem
              task="Gym workout"
              time="11:30 AM"
              duration="1.5h"
              category="health"
              color="#FF8A65"
            />

            <TaskItem
              task="Lunch with Sarah"
              time="1:00 PM"
              duration="1h"
              category="social"
              color="#AB47BC"
            />

            <TaskItem
              task="Call mom"
              time="4:00 PM"
              duration="30m"
              category="personal"
              color="#4CAF50"
            />
          </View>

          {/* Debug Panel Toggle */}
          <TouchableOpacity 
            style={styles.debugToggle}
            onPress={() => setShowDebugPanel(!showDebugPanel)}
          >
            <Text style={styles.debugToggleText}>
              {showDebugPanel ? 'Hide' : 'Show'} Calendar Functions
            </Text>
          </TouchableOpacity>

          {/* Existing Calendar Functionality - Hidden by default */}
          {showDebugPanel && (
            <View style={styles.debugPanel}>
              <View style={styles.buttonContainer}>
                <Button onPress={signOut}>Logout</Button>
                <Button onPress={getCurrentUser}>Get current user</Button>
              </View>

              {accessToken && (
                <>
                  {/* Create Event Section */}
                  <View style={styles.apiTestContainer}>
                    <Text style={styles.sectionTitle}>Create Event</Text>

                    <View style={styles.inputContainer}>
                      <Text>Event Title:</Text>
                      <TextInput
                        style={styles.input}
                        value={createEventTitle}
                        onChangeText={setCreateEventTitle}
                        placeholder="Enter event title"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text>Start DateTime (YYYY-MM-DDTHH:mm:ss):</Text>
                      <TextInput
                        style={styles.input}
                        value={createStartDateTime}
                        onChangeText={setCreateStartDateTime}
                        placeholder="2025-12-28T10:00:00"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text>End DateTime (YYYY-MM-DDTHH:mm:ss):</Text>
                      <TextInput
                        style={styles.input}
                        value={createEndDateTime}
                        onChangeText={setCreateEndDateTime}
                        placeholder="2025-12-28T11:00:00"
                      />
                    </View>

                    <View style={styles.buttonContainer}>
                      <Button onPress={testCreateEvent}>Create Event</Button>
                    </View>
                  </View>

                  {/* Move Event Section */}
                  <View style={styles.apiTestContainer}>
                    <Text style={styles.sectionTitle}>Move Event</Text>

                    <View style={styles.inputContainer}>
                      <Text>Event Title to Move:</Text>
                      <TextInput
                        style={styles.input}
                        value={moveEventTitle}
                        onChangeText={setMoveEventTitle}
                        placeholder="Enter event title to move"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text>Current Start DateTime:</Text>
                      <TextInput
                        style={styles.input}
                        value={moveCurrentStartDateTime}
                        onChangeText={setMoveCurrentStartDateTime}
                        placeholder="2025-12-28T10:00:00"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text>New Start DateTime:</Text>
                      <TextInput
                        style={styles.input}
                        value={moveNewStartDateTime}
                        onChangeText={setMoveNewStartDateTime}
                        placeholder="2025-12-28T14:00:00"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text>New End DateTime:</Text>
                      <TextInput
                        style={styles.input}
                        value={moveNewEndDateTime}
                        onChangeText={setMoveNewEndDateTime}
                        placeholder="2025-12-28T15:00:00"
                      />
                    </View>

                    <View style={styles.buttonContainer}>
                      <Button onPress={testMoveEvent}>Move Event</Button>
                    </View>
                  </View>

                  {/* Find Events Section */}
                  <View style={styles.apiTestContainer}>
                    <Text style={styles.sectionTitle}>Find Events by Date</Text>

                    <View style={styles.inputContainer}>
                      <Text>Date (YYYY-MM-DD):</Text>
                      <TextInput
                        style={styles.input}
                        value={findEventsDate}
                        onChangeText={setFindEventsDate}
                        placeholder="2025-12-28"
                      />
                    </View>

                    <View style={styles.buttonContainer}>
                      <Button onPress={testFindEvents}>Find All Events</Button>
                    </View>
                  </View>
                </>
              )}

              <View style={styles.userInfoContainer}>
                <Text style={styles.sectionTitle}>User Info:</Text>
                <Text style={styles.userInfoText}>
                  {JSON.stringify(userInfo, null, 2)}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.signInContainer}>
          <Text style={styles.signInTitle}>Welcome to Promptly</Text>
          <Text style={styles.signInSubtitle}>Sign in to start planning your day</Text>
          <GoogleSigninButton
            style={{ width: 212, height: 48 }}
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={signIn}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  todayText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  dateText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressCard: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  tasksCount: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  focusedTime: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  onTrack: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  planButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  planButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleSection: {
    marginBottom: 32,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  scheduleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  menuDots: {
    fontSize: 20,
    color: '#666666',
    fontWeight: 'bold',
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 16,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 14,
    color: '#666666',
  },
  taskRight: {
    alignItems: 'flex-end',
  },
  taskDuration: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  debugToggle: {
    backgroundColor: '#E0E0E0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  debugToggleText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  debugPanel: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  signInTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  signInSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  // Existing styles for calendar functionality
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    margin: 20,
  },
  scrollContent: {
    padding: 20,
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  apiTestContainer: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: '#1A1A1A',
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    marginTop: 5,
  },
  userInfoContainer: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 8,
  },
  userInfoText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: '#666',
  },
});
