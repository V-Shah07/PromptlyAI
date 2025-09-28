import { getAllEventTags } from "@/lib/firebase";
import {
  GoogleSignin,
  GoogleSigninButton,
  isErrorWithCode,
  isNoSavedCredentialFoundResponse,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  checkTimeSlotConflict,
  findEventsByDate,
  getLocalDateString,
  moveEvent,
} from "../calendarApiFunctions";

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
  const [todaysEvents, setTodaysEvents] = React.useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = React.useState(false);
  const [completedTasks, setCompletedTasks] = React.useState<Set<string>>(
    new Set()
  );
  const [eventTags, setEventTags] = React.useState<{
    [eventTitle: string]: string[];
  }>({});
  const [selectedDate, setSelectedDate] = React.useState<string>(
    getLocalDateString()
  );
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  // Effect to check for existing user and fetch events on mount
  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser) {
          setUserInfo({ userInfo: currentUser.user });
          const tokens = await GoogleSignin.getTokens();
          setAccessToken(tokens.accessToken);
          console.log("✅ Existing user found, fetching today's events...");

          // Fetch today's events for existing user
          setTimeout(() => {
            fetchTodaysEvents();
          }, 500);
        }
      } catch (error) {
        console.log("No existing user found");
      }
    };

    checkExistingUser();
  }, []);

  // Fetch events when selected date changes
  useEffect(() => {
    if (accessToken && selectedDate) {
      fetchEventsForDate(selectedDate);
    }
  }, [selectedDate, accessToken]);

  // Effect to fetch events when access token changes
  useEffect(() => {
    if (accessToken) {
      fetchTodaysEvents();
    }
  }, [accessToken]);

  // Function to toggle task completion
  const toggleTaskCompletion = (eventId: string) => {
    setCompletedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

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

  // Simple reschedule function
  const handleRescheduleEvent = async (event: any) => {
    if (!accessToken) {
      Alert.alert("Error", "Please sign in to reschedule events");
      return;
    }

    // Show confirmation dialog first
    Alert.alert(
      "Reschedule Event",
      `Reschedule "${event.title}" to tomorrow at the same time?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reschedule",
          onPress: async () => {
            try {
              console.log("🔄 Starting reschedule for:", event.title);
              console.log(
                "🔄 Full event data:",
                JSON.stringify(event, null, 2)
              );

              // Show event data in alert for debugging
              Alert.alert(
                "Debug: Event Data",
                `Title: ${event.title}\nStart: ${event.start_time}\nEnd: ${
                  event.end_time
                }\nHas start_datetime: ${!!event.start_datetime}\nHas end_datetime: ${!!event.end_datetime}`,
                [{ text: "OK" }]
              );

              // Check if event has original datetime fields
              let currentStartDateTime, currentEndDateTime;

              if (event.start_datetime && event.end_datetime) {
                // Use original datetime fields if available
                currentStartDateTime = event.start_datetime;
                currentEndDateTime = event.end_datetime;
                console.log("🔄 Using original datetime fields");
              } else {
                // Fallback to converting display times
                const startTime = event.start_time; // e.g., "10:30 PM"
                const endTime = event.end_time; // e.g., "11:00 PM"

                // Convert display times to ISO format using today's date
                const convertToISODateTime = (
                  timeStr: string,
                  dateStr: string
                ): string => {
                  const [time, period] = timeStr.split(" ");
                  const [hours, minutes] = time.split(":").map(Number);
                  let hour24 = hours;

                  if (period === "PM" && hours !== 12) hour24 += 12;
                  if (period === "AM" && hours === 12) hour24 = 0;

                  return `${dateStr}T${hour24
                    .toString()
                    .padStart(2, "0")}:${minutes
                    .toString()
                    .padStart(2, "0")}:00`;
                };

                // Use the date that was used to fetch these events
                // Use the selectedDate (the date we're currently viewing)
                currentStartDateTime = convertToISODateTime(
                  startTime,
                  selectedDate
                );
                currentEndDateTime = convertToISODateTime(
                  endTime,
                  selectedDate
                );
                console.log(
                  "🔄 Converted from display times using date:",
                  selectedDate
                );
              }

              console.log("🔄 Current start:", currentStartDateTime);
              console.log("🔄 Current end:", currentEndDateTime);

              // Add 24 hours to get tomorrow's times
              const currentStart = new Date(currentStartDateTime);
              const currentEnd = new Date(currentEndDateTime);

              console.log("🔄 Current start Date object:", currentStart);
              console.log("🔄 Current end Date object:", currentEnd);

              // Add 24 hours using local time to avoid timezone issues
              const tomorrowStart = new Date(currentStart);
              tomorrowStart.setDate(tomorrowStart.getDate() + 1);

              const tomorrowEnd = new Date(currentEnd);
              tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

              // Format as local datetime string to avoid timezone conversion
              const formatLocalDateTime = (date: Date): string => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const hours = String(date.getHours()).padStart(2, "0");
                const minutes = String(date.getMinutes()).padStart(2, "0");
                const seconds = String(date.getSeconds()).padStart(2, "0");
                return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
              };

              // Find the next available time slot
              let finalStartDateTime = formatLocalDateTime(tomorrowStart);
              let finalEndDateTime = formatLocalDateTime(tomorrowEnd);
              let hoursAdded = 24; // Start with 24 hours (next day)

              console.log("🔄 Initial tomorrow start:", finalStartDateTime);
              console.log("🔄 Initial tomorrow end:", finalEndDateTime);

              // Check for conflicts and find available slot
              let conflictCheck = await checkTimeSlotConflict(
                finalStartDateTime,
                finalEndDateTime,
                accessToken,
                event.title
              );

              // Keep adding 30 minutes until we find an available slot
              while (conflictCheck.hasConflict && hoursAdded < 48) {
                // Max 48 hours (2 days)
                hoursAdded += 0.5; // Add 30 minutes
                console.log(
                  `🔄 Conflict found, trying ${hoursAdded} hours later...`
                );

                // Add 30 more minutes
                const newStart = new Date(currentStart);
                newStart.setMinutes(newStart.getMinutes() + hoursAdded * 60);

                const newEnd = new Date(currentEnd);
                newEnd.setMinutes(newEnd.getMinutes() + hoursAdded * 60);

                finalStartDateTime = formatLocalDateTime(newStart);
                finalEndDateTime = formatLocalDateTime(newEnd);

                console.log(
                  `🔄 Trying new time: ${finalStartDateTime} - ${finalEndDateTime}`
                );

                // Check for conflicts again
                conflictCheck = await checkTimeSlotConflict(
                  finalStartDateTime,
                  finalEndDateTime,
                  accessToken,
                  event.title
                );
              }

              if (conflictCheck.hasConflict) {
                Alert.alert(
                  "No Available Slots",
                  "No available time slots found within the next 2 days. Please try rescheduling manually.",
                  [{ text: "OK" }]
                );
                return;
              }

              console.log("🔄 Final start:", finalStartDateTime);
              console.log("🔄 Final end:", finalEndDateTime);
              console.log("🔄 Hours added:", hoursAdded);

              // Show datetime values in alert for debugging
              Alert.alert(
                "Debug: DateTime Values",
                `Current Start: ${currentStartDateTime}\nCurrent End: ${currentEndDateTime}\nNew Start: ${finalStartDateTime}\nNew End: ${finalEndDateTime}\nHours Added: ${hoursAdded}`,
                [{ text: "OK" }]
              );

              // Call moveEvent directly
              const moveData = {
                title: event.title,
                current_start_datetime: currentStartDateTime,
                new_start_datetime: finalStartDateTime,
                new_end_datetime: finalEndDateTime,
              };

              console.log(
                "🔄 Calling moveEvent with data:",
                JSON.stringify(moveData, null, 2)
              );

              const result = await moveEvent(moveData, accessToken);

              if (result.success) {
                let timeMessage;
                if (hoursAdded === 24) {
                  timeMessage = "tomorrow at the same time";
                } else if (hoursAdded < 1) {
                  timeMessage = `in ${Math.round(hoursAdded * 60)} minutes`;
                } else if (hoursAdded < 24) {
                  const hours = Math.floor(hoursAdded);
                  const minutes = Math.round((hoursAdded - hours) * 60);
                  if (minutes === 0) {
                    timeMessage = `in ${hours} hour${hours !== 1 ? "s" : ""}`;
                  } else {
                    timeMessage = `in ${hours} hour${
                      hours !== 1 ? "s" : ""
                    } and ${minutes} minute${minutes !== 1 ? "s" : ""}`;
                  }
                } else {
                  const days = Math.floor(hoursAdded / 24);
                  const remainingHours = hoursAdded % 24;
                  const hours = Math.floor(remainingHours);
                  const minutes = Math.round((remainingHours - hours) * 60);

                  if (minutes === 0) {
                    timeMessage = `in ${days} day${
                      days !== 1 ? "s" : ""
                    } and ${hours} hour${hours !== 1 ? "s" : ""}`;
                  } else {
                    timeMessage = `in ${days} day${
                      days !== 1 ? "s" : ""
                    }, ${hours} hour${
                      hours !== 1 ? "s" : ""
                    } and ${minutes} minute${minutes !== 1 ? "s" : ""}`;
                  }
                }

                Alert.alert(
                  "Successfully Rescheduled! 🎉",
                  `"${event.title}" has been moved ${timeMessage}`,
                  [
                    {
                      text: "Perfect!",
                      onPress: () => {
                        // Refresh events to show updated schedule
                        fetchTodaysEvents();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  "Reschedule Failed",
                  result.message || "Please try again later"
                );
              }
            } catch (error: any) {
              console.error("❌ Reschedule error:", error);
              Alert.alert(
                "Reschedule Failed",
                `Something went wrong: ${
                  error.message || "Please try again later."
                }`
              );
            }
          },
        },
      ]
    );
  };

  // Function to navigate to previous day
  const goToPreviousDay = () => {
    const currentDate = new Date(selectedDate + "T12:00:00"); // Add time to avoid timezone issues
    currentDate.setDate(currentDate.getDate() - 1);
    // Use local date formatting instead of toISOString()
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const newDate = `${year}-${month}-${day}`;
    console.log("🔄 Previous day: from", selectedDate, "to", newDate);
    setSelectedDate(newDate);
  };

  // Function to navigate to next day
  const goToNextDay = () => {
    const currentDate = new Date(selectedDate + "T12:00:00"); // Add time to avoid timezone issues
    currentDate.setDate(currentDate.getDate() + 1);
    // Use local date formatting instead of toISOString()
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const newDate = `${year}-${month}-${day}`;
    console.log("🔄 Next day: from", selectedDate, "to", newDate);
    setSelectedDate(newDate);
  };

  // Function to go back to today
  const goToToday = () => {
    const today = getLocalDateString();
    setSelectedDate(today);
  };

  // Function to fetch events for selected date
  const fetchEventsForDate = async (date: string) => {
    if (!accessToken) {
      console.log("No access token available for fetching events");
      return;
    }

    setLoadingEvents(true);
    try {
      console.log("📅 Fetching events for date:", date);
      console.log("📅 Selected date object:", new Date(date + "T12:00:00"));
      console.log("📅 Today's date:", getLocalDateString());
      console.log("📅 Is today?", date === getLocalDateString());
      console.log(
        "📅 User timezone:",
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );

      const events = await findEventsByDate(date, accessToken);
      console.log("📅 Raw API response - Total events found:", events.length);
      console.log(
        "📅 Raw API response (full):",
        JSON.stringify(events, null, 2)
      );
      console.log("📅 Events for", date, ":", events);

      // Log each event title for easier debugging
      events.forEach((event, index) => {
        console.log(
          `📅 Event ${index + 1}: "${event.title}" (${event.start_time} - ${
            event.end_time
          })`
        );
        console.log("📅 Full event object:", JSON.stringify(event, null, 2));

        // Log tags specifically
        console.log(`🔍 Checking tags for "${event.title}":`, {
          hasTagsProperty: "tags" in event,
          tagsValue: event.tags,
          tagsType: typeof event.tags,
          tagsIsArray: Array.isArray(event.tags),
          allEventKeys: Object.keys(event),
        });

        if (event.tags && Array.isArray(event.tags) && event.tags.length > 0) {
          console.log(`🏷️ Tags for "${event.title}":`, event.tags);
        } else {
          console.log(`❌ No valid tags found for "${event.title}"`);
        }
      });

      setTodaysEvents(events || []);

      // Load event tags from Firestore
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser) {
          const userId = currentUser.user.id;
          const tagsMap = await getAllEventTags(userId);
          setEventTags(tagsMap);
          console.log("🏷️ Loaded event tags from Firestore:", tagsMap);
        }
      } catch (tagError) {
        console.error("❌ Error loading event tags:", tagError);
        setEventTags({});
      }
    } catch (error) {
      console.error("❌ Error fetching events for date:", date, error);
      setTodaysEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Function to fetch today's events (for backward compatibility)
  const fetchTodaysEvents = async () => {
    await fetchEventsForDate(selectedDate);
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

        // Fetch today's events after successful sign-in
        setTimeout(() => {
          fetchTodaysEvents();
        }, 1000); // Small delay to ensure token is set
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
      setShowUserMenu(false);
      Alert.alert("Signed out successfully");
    } catch (error) {
      console.error(error);
    }
  };

  const handleSettings = () => {
    Alert.alert("Settings", "Settings feature coming soon!");
    setShowUserMenu(false);
  };

  const handleAnalytics = () => {
    Alert.alert("Analytics", "Analytics feature coming soon!");
    setShowUserMenu(false);
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

  // Calculate total focused time from all events
  const calculateTotalFocusedTime = () => {
    if (!todaysEvents || todaysEvents.length === 0) return "0h";

    let totalMinutes = 0;

    todaysEvents.forEach((event) => {
      // Parse times like "05:30 PM" and "06:30 PM"
      const parseTime = (timeStr: string) => {
        const [time, period] = timeStr.split(" ");
        const [hours, minutes] = time.split(":").map(Number);
        let hour24 = hours;

        if (period === "PM" && hours !== 12) hour24 += 12;
        if (period === "AM" && hours === 12) hour24 = 0;

        return hour24 * 60 + minutes; // Return minutes from midnight
      };

      const startMinutes = parseTime(event.start_time);
      let endMinutes = parseTime(event.end_time);

      // Handle events that span midnight
      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60; // Add 24 hours worth of minutes
      }

      totalMinutes += endMinutes - startMinutes;
    });

    if (totalMinutes < 60) {
      return `${totalMinutes}m`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (minutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}.${Math.round((minutes / 60) * 10)}h`;
      }
    }
  };

  // Calculate progress statistics
  const getProgressStats = () => {
    const totalTasks = todaysEvents.length;
    const completedCount = Array.from(completedTasks).filter((taskId) =>
      todaysEvents.some((event) => (event.event_id || event.title) === taskId)
    ).length;

    const percentage =
      totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    return {
      completedCount,
      totalTasks,
      percentage,
    };
  };

  // TaskItem Component
  const TaskItem = ({
    task,
    time,
    duration,
    category,
    color,
    isCompleted,
    eventId,
    onToggleComplete,
    onReschedule,
    event,
    description,
    tags,
  }: {
    task: string;
    time: string;
    duration: string;
    category: string;
    color: string;
    isCompleted?: boolean;
    eventId: string;
    onToggleComplete: (eventId: string) => void;
    onReschedule: (event: any) => void;
    event: any;
    description?: string;
    tags?: string[];
  }) => {
    // Helper function to get tag color and style
    const getTagStyle = (tag: string) => {
      // Priority tags
      if (tag === "high") return { backgroundColor: "#EF4444", color: "white" };
      if (tag === "medium")
        return { backgroundColor: "#F59E0B", color: "white" };
      if (tag === "low") return { backgroundColor: "#10B981", color: "white" };

      // Category tags
      const categoryColors: { [key: string]: string } = {
        work: "#5A6ACF",
        academic: "#8B5CF6",
        social: "#AB47BC",
        extracurriculars: "#F59E0B",
        others: "#6B7280",
        health: "#FF8A65",
        fitness: "#10B981",
      };

      return {
        backgroundColor: categoryColors[tag] || "#6B7280",
        color: "white",
      };
    };

    return (
      <TouchableOpacity
        style={styles.taskItem}
        onPress={() =>
          router.push({
            pathname: "/task-details",
            params: {
              task,
              time,
              duration,
              category,
              color,
              description,
              tags: JSON.stringify(tags || []),
            },
          })
        }
      >
        <View style={styles.taskLeft}>
          <TouchableOpacity
            style={[
              styles.taskCircle,
              isCompleted && styles.taskCircleCompleted,
            ]}
            onPress={(e) => {
              e.stopPropagation(); // Prevent navigating to task details
              onToggleComplete(eventId);
            }}
          >
            {isCompleted && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <View style={styles.taskContent}>
            <Text
              style={[styles.taskText, isCompleted && styles.taskTextCompleted]}
            >
              {task}
            </Text>
            <Text style={styles.taskTime}>{time}</Text>
            {tags && tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <View key={index} style={[styles.tag, getTagStyle(tag)]}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
        <View style={styles.taskRight}>
          <Text style={styles.taskDuration}>{duration}</Text>
          <View style={styles.taskRightBottom}>
            <TouchableOpacity
              style={styles.rescheduleButton}
              onPress={(e) => {
                e.stopPropagation(); // Prevent navigating to task details
                onReschedule(event);
              }}
            >
              <Text style={styles.rescheduleButtonText}>📅 Reschedule</Text>
            </TouchableOpacity>
            <View style={[styles.categoryBadge, { backgroundColor: color }]}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {userInfo ? (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.todayText}>
                {selectedDate === getLocalDateString() ? "Today" : "Schedule"}
              </Text>
              <Text style={styles.dateText}>
                {selectedDate === getLocalDateString()
                  ? new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })
                  : (() => {
                      const [year, month, day] = selectedDate
                        .split("-")
                        .map(Number);
                      const date = new Date(year, month - 1, day);
                      return date.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      });
                    })()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.profileAvatar}
              onPress={() => setShowUserMenu(!showUserMenu)}
            >
              <Text style={styles.avatarText}>
                {userInfo?.userInfo?.name
                  ? userInfo.userInfo.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : userInfo?.name
                  ? userInfo.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "U"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Daily Progress Card */}
          {(() => {
            const progressStats = getProgressStats();
            const focusedTime = calculateTotalFocusedTime();

            return (
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>⚡ Daily Progress</Text>
                  <Text style={styles.tasksCount}>
                    {progressStats.completedCount}/{progressStats.totalTasks}{" "}
                    tasks
                  </Text>
                </View>
                <View style={styles.progressStats}>
                  <Text style={styles.focusedTime}>
                    {focusedTime} focused time
                  </Text>
                  <Text style={styles.onTrack}>
                    {progressStats.percentage}% on track
                  </Text>
                </View>
              </View>
            );
          })()}

          {/* Plan My Day Button */}
          <TouchableOpacity
            style={styles.planButton}
            onPress={() => router.push("/ai-planner")}
          >
            <Text style={styles.planButtonText}>Plan My Day</Text>
          </TouchableOpacity>

          {/* Schedule Section */}
          <View style={styles.scheduleSection}>
            <View style={styles.scheduleHeader}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={goToPreviousDay}
              >
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateTitleContainer}
                onPress={goToToday}
              >
                <Text style={styles.scheduleTitle}>
                  {selectedDate === getLocalDateString()
                    ? "Today's Schedule"
                    : (() => {
                        const [year, month, day] = selectedDate
                          .split("-")
                          .map(Number);
                        const date = new Date(year, month - 1, day);
                        return date.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        });
                      })()}
                </Text>
                {selectedDate !== getLocalDateString() && (
                  <Text style={styles.todayButtonText}>Tap to go to today</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.navButton} onPress={goToNextDay}>
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            </View>

            {loadingEvents ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                  Loading events for{" "}
                  {selectedDate === getLocalDateString()
                    ? "today"
                    : (() => {
                        const [year, month, day] = selectedDate
                          .split("-")
                          .map(Number);
                        const date = new Date(year, month - 1, day);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      })()}
                  ...
                </Text>
              </View>
            ) : todaysEvents.length > 0 ? (
              // Sort events chronologically by start time, then map to TaskItems
              todaysEvents
                .sort((a, b) => {
                  // Parse times for sorting
                  const parseTimeForSort = (timeStr: string) => {
                    const [time, period] = timeStr.split(" ");
                    const [hours, minutes] = time.split(":").map(Number);
                    let hour24 = hours;

                    if (period === "PM" && hours !== 12) hour24 += 12;
                    if (period === "AM" && hours === 12) hour24 = 0;

                    return hour24 * 60 + minutes; // Return minutes from midnight
                  };

                  return (
                    parseTimeForSort(a.start_time) -
                    parseTimeForSort(b.start_time)
                  );
                })
                .map((event, index) => {
                  // Calculate duration between start and end time (handle midnight crossover)
                  const calculateDuration = (
                    startTime: string,
                    endTime: string
                  ) => {
                    // Parse times like "05:30 PM" and "06:30 PM"
                    const parseTime = (timeStr: string) => {
                      const [time, period] = timeStr.split(" ");
                      const [hours, minutes] = time.split(":").map(Number);
                      let hour24 = hours;

                      if (period === "PM" && hours !== 12) hour24 += 12;
                      if (period === "AM" && hours === 12) hour24 = 0;

                      return hour24 * 60 + minutes; // Return minutes from midnight
                    };

                    const startMinutes = parseTime(startTime);
                    let endMinutes = parseTime(endTime);

                    // Handle events that span midnight (end time is next day)
                    if (endMinutes < startMinutes) {
                      endMinutes += 24 * 60; // Add 24 hours worth of minutes
                    }

                    const durationMinutes = endMinutes - startMinutes;

                    if (durationMinutes < 60) {
                      return `${durationMinutes}m`;
                    } else {
                      const hours = Math.floor(durationMinutes / 60);
                      const minutes = durationMinutes % 60;
                      return minutes > 0
                        ? `${hours}h ${minutes}m`
                        : `${hours}h`;
                    }
                  };

                  // Use Firestore tags for categorization, fallback to title-based categorization
                  const getCategoryAndColor = (event: any) => {
                    const firestoreTags = eventTags[event.title] || [];
                    console.log(`🔍 Processing tags for "${event.title}":`, {
                      eventTags: event.tags,
                      firestoreTags,
                    });

                    // If Firestore provides tags, use the first category tag
                    if (firestoreTags && firestoreTags.length > 0) {
                      console.log(
                        `✅ Found ${firestoreTags.length} Firestore tags:`,
                        firestoreTags
                      );

                      const categoryTag = firestoreTags.find((tag: string) =>
                        [
                          "work",
                          "academic",
                          "social",
                          "extracurriculars",
                          "others",
                          "health",
                          "fitness",
                        ].includes(tag)
                      );

                      if (categoryTag) {
                        console.log(`🎯 Using category tag: "${categoryTag}"`);
                        const categoryColors: { [key: string]: string } = {
                          work: "#5A6ACF",
                          academic: "#8B5CF6",
                          social: "#AB47BC",
                          extracurriculars: "#F59E0B",
                          others: "#6B7280",
                          health: "#FF8A65",
                          fitness: "#10B981",
                        };
                        return {
                          category: categoryTag,
                          color: categoryColors[categoryTag] || "#6B7280",
                        };
                      } else {
                        console.log(
                          `⚠️ No valid category tag found in:`,
                          firestoreTags
                        );
                      }
                    } else {
                      console.log(
                        `❌ No Firestore tags found for "${event.title}"`
                      );
                    }

                    // Fallback to title-based categorization
                    const text = (
                      event.title +
                      " " +
                      (event.description || "")
                    ).toLowerCase();

                    if (
                      text.includes("work") ||
                      text.includes("project") ||
                      text.includes("meeting") ||
                      text.includes("presentation")
                    ) {
                      return { category: "work", color: "#5A6ACF" };
                    } else if (
                      text.includes("gym") ||
                      text.includes("workout") ||
                      text.includes("exercise") ||
                      text.includes("health")
                    ) {
                      return { category: "health", color: "#FF8A65" };
                    } else if (
                      text.includes("lunch") ||
                      text.includes("dinner") ||
                      text.includes("coffee") ||
                      text.includes("social")
                    ) {
                      return { category: "social", color: "#AB47BC" };
                    } else if (
                      text.includes("call") ||
                      text.includes("family") ||
                      text.includes("personal")
                    ) {
                      return { category: "personal", color: "#4CAF50" };
                    } else {
                      return { category: "other", color: "#64B5F6" };
                    }
                  };

                  const { category, color } = getCategoryAndColor(event);
                  console.log(
                    `📊 Final categorization for "${event.title}": category="${category}", color="${color}"`
                  );

                  const duration = calculateDuration(
                    event.start_time,
                    event.end_time
                  );

                  // Get tags from Firestore instead of event object
                  const firestoreTags = eventTags[event.title] || [];

                  console.log(`🎯 Creating TaskItem for "${event.title}":`, {
                    hasEventTags: !!event.tags,
                    eventTags: event.tags,
                    eventTagsLength: event.tags?.length || 0,
                    hasFirestoreTags: !!firestoreTags,
                    firestoreTags: firestoreTags,
                    firestoreTagsLength: firestoreTags.length,
                  });

                  return (
                    <TaskItem
                      key={event.event_id || index}
                      task={event.title}
                      time={event.start_time}
                      duration={duration}
                      category={category}
                      color={color}
                      eventId={event.event_id || `${index}`}
                      isCompleted={completedTasks.has(
                        event.event_id || `${index}`
                      )}
                      onToggleComplete={toggleTaskCompletion}
                      onReschedule={handleRescheduleEvent}
                      event={event}
                      description={event.description}
                      tags={firestoreTags}
                    />
                  );
                })
            ) : (
              <View style={styles.noEventsContainer}>
                <Text style={styles.noEventsText}>
                  No events scheduled for{" "}
                  {selectedDate === getLocalDateString()
                    ? "today"
                    : (() => {
                        const [year, month, day] = selectedDate
                          .split("-")
                          .map(Number);
                        const date = new Date(year, month - 1, day);
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      })()}
                </Text>
                <Text style={styles.noEventsSubtext}>
                  {selectedDate === getLocalDateString()
                    ? "Perfect day to plan something new!"
                    : "This day is free for planning!"}
                </Text>
              </View>
            )}
          </View>

          {/* Refresh Button */}
          <View style={styles.refreshButtonContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={fetchTodaysEvents}
            >
              <Text style={styles.actionButtonText}>🔄 Refresh Events</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.signInContainer}>
          <Text style={styles.signInTitle}>Welcome to Promptly</Text>
          <Text style={styles.signInSubtitle}>
            Sign in to start planning your day
          </Text>
          <GoogleSigninButton
            style={{ width: 212, height: 48 }}
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={signIn}
          />
        </View>
      )}

      {/* User Menu Modal */}
      {showUserMenu && (
        <View style={styles.userMenuOverlay}>
          <TouchableOpacity
            style={styles.userMenuBackdrop}
            onPress={() => setShowUserMenu(false)}
          />
          <View style={styles.userMenu}>
            <View style={styles.userMenuHeader}>
              <Text style={styles.userMenuTitle}>Menu</Text>
            </View>
            <TouchableOpacity
              style={styles.userMenuItem}
              onPress={handleSettings}
            >
              <Text style={styles.userMenuIcon}>⚙️</Text>
              <Text style={styles.userMenuText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.userMenuItem}
              onPress={handleAnalytics}
            >
              <Text style={styles.userMenuIcon}>📊</Text>
              <Text style={styles.userMenuText}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.userMenuItem} onPress={signOut}>
              <Text style={styles.userMenuIcon}>🚪</Text>
              <Text style={styles.userMenuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20,
  },
  todayText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  dateText: {
    fontSize: 16,
    color: "#666666",
    marginTop: 4,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  progressCard: {
    backgroundColor: "#8B5CF6",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  tasksCount: {
    color: "white",
    fontSize: 16,
    opacity: 0.9,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  focusedTime: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  onTrack: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  planButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "center",
  },
  planButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  scheduleSection: {
    marginBottom: 32,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
  },
  dateTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },
  scheduleTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    textAlign: "center",
  },
  todayButtonText: {
    fontSize: 12,
    color: "#8B5CF6",
    marginTop: 2,
    fontStyle: "italic",
  },
  menuDots: {
    fontSize: 20,
    color: "#666666",
    fontWeight: "bold",
  },
  taskItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  taskCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  taskLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  taskContent: {
    flex: 1,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  taskText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 14,
    color: "#666666",
  },
  taskRight: {
    alignItems: "flex-end",
  },
  taskDuration: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtonsContainer: {
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  refreshButtonContainer: {
    alignItems: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  actionButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 160,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  signInContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  signInTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  signInSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
  noEventsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noEventsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 5,
  },
  noEventsSubtext: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  taskCircleCompleted: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  checkmark: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  taskTextCompleted: {
    textDecorationLine: "line-through",
    color: "#999",
  },
  taskRightBottom: {
    alignItems: "flex-end",
    gap: 8,
  },
  rescheduleButton: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  rescheduleButtonText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  userMenuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  userMenuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  userMenu: {
    position: "absolute",
    top: 100,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    backdropFilter: "blur(10px)",
  },
  userMenuHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  userMenuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  userMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userMenuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  userMenuText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
});
