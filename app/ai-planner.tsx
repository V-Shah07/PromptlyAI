import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  checkTimeSlotConflict,
  createEvent,
  findEventsByDate,
  getLocalDateString,
} from "./calendarApiFunctions";

// API Configuration
const API_BASE_URL =
  "https://promptly-r6lhifp8e-krishs-projects-32b186bc.vercel.app"; // For user management
const SCHEDULE_API_URL = "https://web-production-ae703.up.railway.app"; // New scheduling API

// Interfaces for new scheduling API
interface TaskRequest {
  tasks: string;
}

interface ScheduledTask {
  category: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  priority: number;
  reasoning: string;
}

interface ScheduleResponse {
  conflicts: string[];
  scheduled_tasks: ScheduledTask[];
  suggestions: string[];
  summary: string;
}

// New scheduling API function
export const scheduleTasks = async (
  prompt: string
): Promise<ScheduleResponse> => {
  const response = await fetch(`${SCHEDULE_API_URL}/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tasks: prompt,
    } as TaskRequest),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return (await response.json()) as ScheduleResponse;
};

// Simplified user management - no database operations, just for display
const getUserInfo = async (googleId: string, email: string, name: string) => {
  console.log("👤 Using Google user info for display:", {
    googleId,
    email,
    name,
  }); // Return user info without backend database operations
  return {
    google_id: googleId,
    email: email,
    name: name,
    preferences: {},
  };
};

export default function AIPlannerScreen() {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userCheckLoading, setUserCheckLoading] = useState(true);
  const [todaysEvents, setTodaysEvents] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);

  // Check for existing user on component mount
  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const userInfo = await GoogleSignin.getCurrentUser();
        if (userInfo?.user) {
          console.log(
            "✅ User found from previous login:",
            userInfo.user.email
          );
          setCurrentUser(userInfo.user);
          setUserId(userInfo.user.id); // Get today's events and show welcome message
          try {
            console.log("📅 Fetching today's calendar events...");
            const localDate = getLocalDateString();
            console.log("📅 Using local date for accuracy:", localDate);
            const tokens = await GoogleSignin.getTokens();
            const accessToken = tokens.accessToken;
            if (accessToken) {
              const calendarEvents = await findEventsByDate(
                localDate,
                accessToken
              );
              console.log(
                "📅 Today's events for date",
                localDate,
                ":",
                calendarEvents
              );
              console.log(
                "📅 Fetching events for:",
                new Date(localDate).toDateString()
              ); // Store events in state for AI planning reference
              setTodaysEvents(calendarEvents || []);
              let eventsText = "";
              if (calendarEvents && calendarEvents.length > 0) {
                eventsText = "\n\n📅 **Your schedule for today:**\n";
                calendarEvents.forEach((event, index) => {
                  // The API already returns formatted times like "05:30 PM"
                  const startTime = event.start_time;
                  const endTime = event.end_time;
                  eventsText += `${index + 1}. **${
                    event.title
                  }** (${startTime} - ${endTime})\n`;
                  if (event.description && event.description.trim()) {
                    eventsText += `   📝 ${event.description}\n`;
                  }
                  if (event.location && event.location.trim()) {
                    eventsText += `    ${event.location}\n`;
                  }
                });
                eventsText +=
                  "\nI'll help you plan around these existing events!";
              } else {
                eventsText =
                  "\n\n📅 You have no events scheduled for today - perfect for planning a productive day!";
              }
              const welcomeMessage = {
                id: 1,
                text: `Hello ${
                  userInfo.user.name || userInfo.user.email
                }! 👋\n\nI'm your AI planning assistant. Tell me what you want to accomplish today and I'll create a personalized schedule for you.${eventsText}\n\nFor example: "I need to work on my project for 2 hours, go to the gym, and pick up groceries"`,
                isBot: true,
                timestamp: new Date(),
              };
              setMessages([welcomeMessage]);
            } else {
              throw new Error("No access token available");
            }
          } catch (calendarError) {
            console.log("❌ Failed to fetch calendar events:", calendarError); // Fallback welcome message without calendar
            const welcomeMessage = {
              id: 1,
              text: `Hello ${
                userInfo.user.name || userInfo.user.email
              }! 👋\n\nI'm your AI planning assistant. Tell me what you want to accomplish today and I'll create a personalized schedule for you.\n\n⚠️ Couldn't fetch your calendar events, but I can still help you plan your day!\n\nFor example: "I need to work on my project for 2 hours, go to the gym, and pick up groceries"`,
              isBot: true,
              timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
          }
        } else {
          console.log("❌ No user logged in - user needs to sign in first");
          const loginMessage = {
            id: 1,
            text: `Welcome to AI Planner! 🤖\n\nTo get started, please go back and sign in with Google from the main screen. Once you're signed in, I'll be ready to help you plan your perfect day!`,
            isBot: true,
            timestamp: new Date(),
          };
          setMessages([loginMessage]);
        }
      } catch (error) {
        console.log("❌ Error checking current user:", error);
        const errorMessage = {
          id: 1,
          text: `Oops! There was an error checking your login status. Please try going back and signing in with Google again.`,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
      } finally {
        setUserCheckLoading(false);
      }
    };

    checkCurrentUser();
  }, []);

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return; // Check if user is logged in before proceeding

    if (!currentUser || !userId) {
      Alert.alert(
        "Sign In Required",
        "Please go back and sign in with Google to use the AI planner.",
        [{ text: "OK" }]
      );
      return;
    }

    const userInput = message.trim();
    setMessage("");
    setIsLoading(true); // Add user message

    const userMessage = {
      id: messages.length + 1,
      text: userInput,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      console.log("🚀 Creating schedule with new API..."); // Create the prompt format with existing calendar events

      let promptText =
        "Today I have the following tasks planned out in advance: ";
      if (todaysEvents && todaysEvents.length > 0) {
        const eventsList = todaysEvents
          .map(
            (event) =>
              `**${event.title}** (${event.start_time} - ${event.end_time})`
          )
          .join(", ");
        promptText += eventsList;
      } else {
        promptText += "No existing events";
      }
      promptText += `. I also want to do the following **NEW** tasks: ${userInput}`;
      console.log("📝 Generated prompt:", promptText); // Call new scheduling API

      const scheduleResult = await scheduleTasks(promptText);
      console.log(
        "🤖 Schedule Result:",
        JSON.stringify(scheduleResult, null, 2)
      ); // Debug: Check what dates are in the scheduled tasks
      if (scheduleResult.scheduled_tasks) {
        console.log("🔍 Analyzing scheduled task dates:");
        scheduleResult.scheduled_tasks.forEach((task, index) => {
          console.log(
            `🔍 Task ${index + 1}: "${task.title}" - Start: ${
              task.start_time
            }, End: ${task.end_time}`
          );
        });
      } // Store the current plan for confirmation
      setCurrentPlan(scheduleResult); // Format the response for display

      let responseText = `Here's your personalized schedule:\n\n`;
      if (scheduleResult.summary) {
        responseText += `📋 **Summary:**\n${scheduleResult.summary}\n\n`;
      }
      if (
        scheduleResult.scheduled_tasks &&
        scheduleResult.scheduled_tasks.length > 0
      ) {
        responseText += `📅 **Scheduled Tasks:**\n`;
        scheduleResult.scheduled_tasks.forEach((task, index) => {
          responseText += `${index + 1}. **${task.title}** (${
            task.start_time
          } - ${task.end_time})\n`;
          responseText += `   📂 ${task.category} | Priority: ${task.priority}\n`;
          if (task.description) {
            responseText += `   📝 ${task.description}\n`;
          }
          if (task.reasoning) {
            responseText += `   💭 ${task.reasoning}\n`;
          }
          responseText += `\n`;
        });
      }
      if (scheduleResult.conflicts && scheduleResult.conflicts.length > 0) {
        responseText += `⚠️ **Conflicts:** ${scheduleResult.conflicts.join(
          ", "
        )}\n\n`;
      }
      if (scheduleResult.suggestions && scheduleResult.suggestions.length > 0) {
        responseText += `💡 **Suggestions:** ${scheduleResult.suggestions.join(
          ", "
        )}`;
      } // Add AI response with the plan

      const aiResponse = {
        id: messages.length + 2,
        text: responseText,
        isBot: true,
        timestamp: new Date(),
        showConfirmation: true,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error planning tasks:", error);
      const errorResponse = {
        id: messages.length + 2,
        text: `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : "Failed to create your plan"
        }. Please try again.`,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPlan = async () => {
    if (!currentPlan || !userId) return;

    setIsLoading(true);

    try {
      // Create calendar events directly (no database saving)
      console.log("📅 Creating calendar events for scheduled tasks...");
      const tokens = await GoogleSignin.getTokens();
      const accessToken = tokens.accessToken;
      let createdEventsCount = 0;
      let skippedEventsCount = 0;
      let movedEventsCount = 0;
      let totalEvents = 0;
      if (
        currentPlan.scheduled_tasks &&
        Array.isArray(currentPlan.scheduled_tasks)
      ) {
        totalEvents = currentPlan.scheduled_tasks.length;
        for (const task of currentPlan.scheduled_tasks) {
          try {
            console.log("📅 Creating event:", task.title);
            console.log("📅 Raw task data:", task);
            console.log("📅 Raw start_time:", task.start_time);
            console.log("📅 Raw end_time:", task.end_time); // Preserve the original dates from the AI scheduling API
            const todayDate = getLocalDateString(); // This gives us YYYY-MM-DD for today
            console.log("📅 Today's date for reference:", todayDate); // Helper function to format datetime properly for calendar API
            const formatDateTime = (datetime: string): string => {
              if (!datetime) return datetime; // If datetime already includes date and time, use as is
              if (datetime.includes("T")) {
                const [datePart, timePart] = datetime.split("T");
                console.log(
                  `📅 Preserving original date: ${datePart} with time: ${timePart}`
                );
                return datetime; // Keep the original date from the AI API
              } // If it's just time, assume it's for today (fallback only)
              console.log(
                `📅 Time only provided: ${datetime}, assuming today: ${todayDate}`
              );
              return `${todayDate}T${datetime}`;
            };
            const formattedStartTime = formatDateTime(task.start_time);
            const formattedEndTime = formatDateTime(task.end_time);
            console.log("📅 Formatted start_time:", formattedStartTime);
            console.log("📅 Formatted end_time:", formattedEndTime);

            // Check for conflicts and try alternative times if needed
            console.log("🔍 Checking for time slot conflicts...");
            let finalStartTime = formattedStartTime;
            let finalEndTime = formattedEndTime;
            let foundAvailableSlot = false;
            let hoursAdded = 0;
            const maxHoursToTry = 12; // Try up to 12 hours ahead

            // Try the original time first
            let conflictCheck = await checkTimeSlotConflict(
              finalStartTime,
              finalEndTime,
              accessToken
            );

            // If there's a conflict, try moving forward by 1-hour increments
            while (conflictCheck.hasConflict && hoursAdded < maxHoursToTry) {
              hoursAdded += 1; // Add 1 hour
              console.log(
                `⚠️ Conflict found for "${task.title}", trying ${hoursAdded} hour(s) later...`
              );

              // Calculate new times by adding hours
              const originalStart = new Date(formattedStartTime);
              const originalEnd = new Date(formattedEndTime);

              const newStart = new Date(
                originalStart.getTime() + hoursAdded * 60 * 60 * 1000
              );
              const newEnd = new Date(
                originalEnd.getTime() + hoursAdded * 60 * 60 * 1000
              );

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

              finalStartTime = formatLocalDateTime(newStart);
              finalEndTime = formatLocalDateTime(newEnd);

              console.log(
                `🔄 Trying new time: ${finalStartTime} - ${finalEndTime}`
              );

              // Check for conflicts again
              conflictCheck = await checkTimeSlotConflict(
                finalStartTime,
                finalEndTime,
                accessToken
              );
            }

            if (conflictCheck.hasConflict) {
              console.log(
                "❌ No available slot found within 12 hours for:",
                task.title
              );
              console.log("⏭️ Skipping event:", task.title);
              skippedEventsCount++;
              continue;
            }

            if (hoursAdded > 0) {
              console.log(
                `✅ Found available slot ${hoursAdded} hour(s) later for: ${task.title}`
              );
              movedEventsCount++;
            } else {
              console.log("✅ No conflicts found, using original time");
            }

            foundAvailableSlot = true;

            // Convert the task times to the format expected by the calendar API
            const eventData = {
              title: task.title || "Planned Task",
              start_datetime: finalStartTime, // Use the final time (original or adjusted)
              end_datetime: finalEndTime, // Use the final time (original or adjusted)
              description: task.description || task.reasoning || "",
            };
            console.log("📅 Final event data with dates:", eventData);
            console.log(
              "📅 Event start date/time:",
              new Date(finalStartTime).toLocaleString()
            );
            console.log(
              "📅 Event end date/time:",
              new Date(finalEndTime).toLocaleString()
            );
            const result = await createEvent(eventData, accessToken);
            console.log("✅ Event created successfully:", result);
            console.log(
              "✅ Event created on date:",
              new Date(finalStartTime).toDateString()
            );

            createdEventsCount++;
          } catch (eventError) {
            console.error(
              "❌ Failed to create calendar event for task:",
              task.title,
              eventError
            ); // Continue with other events even if one fails
          }
        }
      }
      const confirmationMessage = {
        id: messages.length + 1,
        text: `✅ Perfect! Your schedule has been successfully created!\n\n📊 **Summary:**\n• Created ${createdEventsCount} of ${totalEvents} calendar events${
          movedEventsCount > 0
            ? `\n• Moved ${movedEventsCount} events to avoid conflicts`
            : ""
        }${
          skippedEventsCount > 0
            ? `\n• Skipped ${skippedEventsCount} events due to conflicts`
            : ""
        }\n\nYou can now view and manage your tasks from your calendar and the main screen.`,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, confirmationMessage]);
      setCurrentPlan(null); // Show success alert with details

      Alert.alert(
        "Schedule Created! 🎉",
        `Your personalized schedule has been added to your calendar!\n\n📅 ${createdEventsCount} of ${totalEvents} events created successfully.${
          movedEventsCount > 0
            ? `\n🔄 ${movedEventsCount} events were moved to avoid conflicts.`
            : ""
        }${
          skippedEventsCount > 0
            ? `\n⚠️ ${skippedEventsCount} events were skipped due to conflicts with existing events.`
            : ""
        }`,
        [{ text: "Great!", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error saving plan:", error);
      Alert.alert(
        "Save Failed",
        "Sorry, there was an error saving your schedule. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const rejectPlan = () => {
    setCurrentPlan(null);
    const rejectionMessage = {
      id: messages.length + 1,
      text: "No problem! Let me know what you'd like to change or tell me what you want to accomplish in a different way.",
      isBot: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, rejectionMessage]);
  };

  return (
    <SafeAreaView style={styles.container}>
            {/* Header */}
            
      <View style={styles.header}>
                
        <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>← Back</Text>
                  
        </TouchableOpacity>
                
        <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>AI Planner</Text>
                    
          {userCheckLoading ? (
            <Text style={styles.statusText}>Checking user...</Text>
          ) : currentUser ? (
            <Text style={styles.statusTextSuccess}>✅ {currentUser.email}</Text>
          ) : (
            <Text style={styles.statusTextError}>❌ Please sign in first</Text>
          )}
                  
        </View>
                
        <View style={styles.placeholder} />
              
      </View>
            {/* Messages */}
            
      <ScrollView
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
                
        {messages.map((msg: any) => (
          <View
            key={msg.id}
            style={[
              styles.messageWrapper,
              msg.isBot ? styles.botMessageWrapper : styles.userMessageWrapper,
            ]}
          >
                        
            <View
              style={[
                styles.messageBubble,
                msg.isBot ? styles.botMessage : styles.userMessage,
              ]}
            >
                            
              <Text
                style={[
                  styles.messageText,
                  msg.isBot ? styles.botMessageText : styles.userMessageText,
                ]}
              >
                                {msg.text}
                              
              </Text>
                                           
              {/* Confirmation buttons for AI plan */}
                            
              {msg.showConfirmation && currentPlan && (
                <View style={styles.confirmationButtons}>
                                    
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={confirmPlan}
                    disabled={isLoading}
                  >
                                        
                    <Text style={styles.confirmButtonText}>
                                            
                      {isLoading ? "Saving..." : "✅ Confirm & Save"}
                                          
                    </Text>
                                      
                  </TouchableOpacity>
                                    
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={rejectPlan}
                    disabled={isLoading}
                  >
                                        
                    <Text style={styles.rejectButtonText}>❌ Modify</Text>
                                      
                  </TouchableOpacity>
                                  
                </View>
              )}
                          
            </View>
                      
          </View>
        ))}
                         {/* Loading indicator */}
                
        {isLoading && (
          <View style={styles.loadingWrapper}>
                        
            <View style={styles.loadingBubble}>
                            
              <Text style={styles.loadingText}>🤖 Planning your day...</Text>
                          
            </View>
                      
          </View>
        )}
              
      </ScrollView>
            {/* Input Area */}
            
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
      >
                
        <View style={styles.inputWrapper}>
                    
          <TextInput
            style={[styles.textInput, !currentUser && styles.textInputDisabled]}
            value={message}
            onChangeText={setMessage}
            placeholder={
              currentUser
                ? "Type your message here..."
                : "Sign in required to use AI planner"
            }
            placeholderTextColor={currentUser ? "#999" : "#ccc"}
            multiline
            maxLength={500}
            editable={!!currentUser}
          />
                    
          <TouchableOpacity
            style={[
              styles.sendButton,
              message.trim() && !isLoading && currentUser
                ? styles.sendButtonActive
                : {},
            ]}
            onPress={sendMessage}
            disabled={!message.trim() || isLoading || !currentUser}
          >
                        
            <Text style={styles.sendButtonText}>
                            {isLoading ? "⏳" : "→"}
                          
            </Text>
                      
          </TouchableOpacity>
                  
        </View>
                
        <Text style={styles.suggestionText}>
                    
          {currentUser
            ? 'Try: "I need 2 hours for project work, 1 hour gym, and grocery shopping"'
            : "Please sign in with Google to start planning your day"}
                  
        </Text>
              
      </KeyboardAvoidingView>
          
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    fontSize: 16,
    color: "#8B5CF6",
    fontWeight: "600",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
  },
  statusText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  statusTextSuccess: {
    fontSize: 12,
    color: "#10B981",
    marginTop: 2,
    fontWeight: "600",
  },
  statusTextError: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 2,
    fontWeight: "600",
  },
  placeholder: {
    width: 50,
  },

  messagesContainer: {
    flex: 1,
    padding: 20,
  },
  messageWrapper: {
    marginBottom: 15,
  },
  botMessageWrapper: {
    alignItems: "flex-start",
  },
  userMessageWrapper: {
    alignItems: "flex-end",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 15,
    borderRadius: 20,
  },
  botMessage: {
    backgroundColor: "white",
    borderBottomLeftRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userMessage: {
    backgroundColor: "#8B5CF6",
    borderBottomRightRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  botMessageText: {
    color: "#1E293B",
  },
  userMessageText: {
    color: "white",
  },
  inputContainer: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F1F5F9",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    minHeight: 50,
  },

  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    maxHeight: 100,
    lineHeight: 20,
  },
  textInputDisabled: {
    color: "#9CA3AF",
    backgroundColor: "#F9FAFB",
  },
  sendButton: {
    backgroundColor: "#E2E8F0",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  sendButtonActive: {
    backgroundColor: "#8B5CF6",
  },
  sendButtonText: {
    fontSize: 20,
    color: "#64748B",
    fontWeight: "600",
  },
  suggestionText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  confirmationButtons: {
    flexDirection: "row",
    marginTop: 15,
    gap: 10,
  },
  confirmButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  rejectButton: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    alignItems: "center",
  },
  rejectButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
  },
  loadingWrapper: {
    alignItems: "flex-start",
    marginBottom: 15,
  },
  loadingBubble: {
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 20,
    borderBottomLeftRadius: 5,
  },
  loadingText: {
    color: "#6B7280",
    fontSize: 16,
    fontStyle: "italic",
  },
});
