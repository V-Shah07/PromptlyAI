import { IconSymbol } from "@/components/ui/icon-symbol";
import { getTimeTracking, saveTimeTracking } from "@/lib/firebase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TaskDetails() {
  const params = useLocalSearchParams();
  const { task, time, duration, category, color, description, tags } = params;

  console.log("📋 Task Details - Received params:", {
    task,
    time,
    duration,
    category,
    color,
    description,
    tags,
    tagsType: typeof tags,
  });

  const [timeTracking, setTimeTracking] = useState({
    estimated: (duration as string) || "2h",
    actual: "0m",
  });

  // Timer state
  const [isTimerVisible, setIsTimerVisible] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "work":
        return "#5A6ACF";
      case "health":
        return "#FF8A65";
      case "social":
        return "#AB47BC";
      case "personal":
        return "#4CAF50";
      default:
        return "#8B5CF6";
    }
  };

  const getPriorityColor = () => {
    return "#FF4444"; // High priority red
  };

  // Parse duration string to seconds
  const parseDurationToSeconds = (durationStr: string): number => {
    const duration = durationStr as string;
    if (duration.includes("h") && duration.includes("m")) {
      // Format: "2h 30m"
      const parts = duration.split(" ");
      const hours = parseInt(parts[0].replace("h", "")) || 0;
      const minutes = parseInt(parts[1].replace("m", "")) || 0;
      return hours * 3600 + minutes * 60;
    } else if (duration.includes("h")) {
      // Format: "2h"
      const hours = parseInt(duration.replace("h", "")) || 0;
      return hours * 3600;
    } else if (duration.includes("m")) {
      // Format: "30m"
      const minutes = parseInt(duration.replace("m", "")) || 0;
      return minutes * 60;
    }
    return 0;
  };

  // Format seconds to readable time
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, "0")}`;
    }
  };

  // Load saved time tracking data on component mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser) {
          const userId = currentUser.user.id;
          const taskId = `${task}_${time}`; // Create unique task ID

          const savedData = await getTimeTracking(userId, taskId);
          if (savedData) {
            setTimeTracking((prev) => ({
              ...prev,
              actual: savedData.actualDuration || "0m",
            }));
          }
        }
      } catch (error) {
        console.error("Error loading saved time tracking data:", error);
      }
    };

    loadSavedData();
  }, [task, time]);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && !isTimerPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTimerRunning, isTimerPaused]);

  // Animate timer dropdown
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isTimerVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isTimerVisible]);

  // Timer control functions
  const startTimer = () => {
    setIsTimerVisible(true);
    setIsTimerRunning(true);
    setIsTimerPaused(false);
  };

  const pauseTimer = () => {
    setIsTimerPaused(!isTimerPaused);
  };

  const resetTimer = async () => {
    try {
      // Reset local state
      setIsTimerRunning(false);
      setIsTimerPaused(false);
      setElapsedTime(0);
      setIsTimerVisible(false);

      setTimeTracking((prev) => ({
        ...prev,
        actual: "0m",
      }));

      // Clear Firebase data
      const currentUser = await GoogleSignin.getCurrentUser();
      if (currentUser) {
        const userId = currentUser.user.id;
        const taskId = `${task}_${time}`;

        await saveTimeTracking(userId, taskId, {
          taskTitle: task as string,
          estimatedDuration: duration as string,
          actualDuration: "0m",
          tags: tags ? JSON.parse(tags as string) : [],
        });
      }
    } catch (error) {
      console.error("Error resetting time tracking data:", error);
    }
  };

  const stopTimer = async () => {
    try {
      // Update the actual time with elapsed time (rounded down to nearest minute)
      const minutes = Math.floor(elapsedTime / 60);
      const formattedTime = minutes > 0 ? `${minutes}m` : "0m";

      // Update local state
      setTimeTracking((prev) => ({
        ...prev,
        actual: formattedTime,
      }));

      // Save to Firebase
      const currentUser = await GoogleSignin.getCurrentUser();
      if (currentUser) {
        const userId = currentUser.user.id;
        const taskId = `${task}_${time}`; // Create unique task ID

        const parsedTags = tags ? JSON.parse(tags as string) : [];
        console.log("💾 About to save to Firebase:", {
          userId,
          taskId,
          taskTitle: task as string,
          estimatedDuration: duration as string,
          actualDuration: formattedTime,
          tags: parsedTags,
          originalTags: tags,
        });

        await saveTimeTracking(userId, taskId, {
          taskTitle: task as string,
          estimatedDuration: duration as string,
          actualDuration: formattedTime,
          tags: parsedTags,
        });
      }

      setIsTimerRunning(false);
      setIsTimerPaused(false);
      setIsTimerVisible(false);
    } catch (error) {
      console.error("Error saving time tracking data:", error);
      // Still update local state even if Firebase fails
      const minutes = Math.floor(elapsedTime / 60);
      const formattedTime = minutes > 0 ? `${minutes}m` : "0m";

      setTimeTracking((prev) => ({
        ...prev,
        actual: formattedTime,
      }));

      setIsTimerRunning(false);
      setIsTimerPaused(false);
      setIsTimerVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Details</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Task Title */}
        <Text style={styles.taskTitle}>{task}</Text>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          <View
            style={[
              styles.categoryTag,
              { backgroundColor: getCategoryColor(category as string) },
            ]}
          >
            <Text style={styles.categoryTagText}>{category}</Text>
          </View>
          <View
            style={[
              styles.priorityTag,
              { backgroundColor: getPriorityColor() },
            ]}
          >
            <Text style={styles.priorityTagText}>high priority</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          {description || "No description available for this task."}
        </Text>

        {/* Time and Duration */}
        <View style={styles.timeContainer}>
          <View style={styles.timeItem}>
            <Text style={styles.timeIcon}>⏱️</Text>
            <Text style={styles.timeLabel}>Duration: </Text>
            <Text style={styles.timeValue}>{duration}</Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeIcon}>📅</Text>
            <Text style={styles.timeLabel}>Time: </Text>
            <Text style={styles.timeValue}>{time}</Text>
          </View>
        </View>

        {/* Start Now Button */}
        <TouchableOpacity style={styles.startButton} onPress={startTimer}>
          <Text style={styles.playIcon}>▶</Text>
          <Text style={styles.startButtonText}>Start Now</Text>
        </TouchableOpacity>

        {/* Timer Dropdown */}
        <Animated.View
          style={[
            styles.timerDropdown,
            {
              opacity: slideAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.timerContainer}>
            <Text style={styles.timerTitle}>Stopwatch</Text>
            <Text style={styles.timerDisplay}>{formatTime(elapsedTime)}</Text>

            <View style={styles.timerControls}>
              <TouchableOpacity
                style={[styles.timerButton, styles.pauseButton]}
                onPress={pauseTimer}
              >
                <IconSymbol
                  name={isTimerPaused ? "play.fill" : "pause.fill"}
                  size={20}
                  color="white"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.timerButton, styles.resetButton]}
                onPress={resetTimer}
              >
                <IconSymbol name="arrow.clockwise" size={20} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.timerButton, styles.stopButton]}
                onPress={stopTimer}
              >
                <IconSymbol name="stop.fill" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Time Tracking */}
        <View style={styles.timeTrackingSection}>
          <Text style={styles.timeTrackingTitle}>Time Tracking</Text>
          <View style={styles.timeTrackingContainer}>
            <View style={styles.timeTrackingItem}>
              <Text style={styles.timeTrackingLabel}>Estimated</Text>
              <Text style={styles.timeTrackingValue}>
                {timeTracking.estimated}
              </Text>
            </View>
            <View style={styles.timeTrackingItem}>
              <Text style={styles.timeTrackingLabel}>Actual</Text>
              <Text style={styles.timeTrackingValue}>
                {timeTracking.actual}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: "#333",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  placeholder: {
    width: 50,
  },
  taskTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 16,
    lineHeight: 34,
  },
  tagsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryTagText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  priorityTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityTagText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 24,
  },
  timeContainer: {
    flexDirection: "row",
    gap: 32,
    marginBottom: 32,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  timeLabel: {
    fontSize: 16,
    color: "#666",
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  startButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  playIcon: {
    color: "white",
    fontSize: 16,
    marginRight: 8,
  },
  startButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  timeTrackingSection: {
    marginBottom: 32,
  },
  timeTrackingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  timeTrackingContainer: {
    flexDirection: "row",
    gap: 32,
  },
  timeTrackingItem: {
    flex: 1,
  },
  timeTrackingLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  timeTrackingValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  timerDropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  timerContainer: {
    alignItems: "center",
  },
  timerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  timerDisplay: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginBottom: 20,
    fontFamily: "monospace",
    textAlign: "center",
  },
  timerControls: {
    flexDirection: "row",
    gap: 12,
  },
  timerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  pauseButton: {
    backgroundColor: "#8B5CF6",
  },
  resetButton: {
    backgroundColor: "#8B5CF6",
  },
  stopButton: {
    backgroundColor: "#8B5CF6",
  },
});
