import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getRestrictedHours, saveRestrictedHours as saveRestrictedHoursToFirebase } from "@/lib/firebase";
import { formatTimeInput, validateTimeFormat, validateTimeRange } from "@/utils/timeUtils";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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

interface TimeRange {
  id: string;
  startTime: string;
  endTime: string;
}

export default function Preferences() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [restrictedHours, setRestrictedHours] = useState<TimeRange[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock user ID - replace with actual user authentication
  const userId = "user123";

  // Load restricted hours from Firebase
  useEffect(() => {
    loadRestrictedHours();
  }, []);

  const loadRestrictedHours = async () => {
    try {
      setIsLoading(true);
      const hours = await getRestrictedHours(userId);
      setRestrictedHours(hours);
    } catch (error) {
      console.error("Error loading restricted hours:", error);
      Alert.alert("Error", "Failed to load restricted hours");
    } finally {
      setIsLoading(false);
    }
  };

  const saveRestrictedHours = async () => {
    if (!validateAllTimeRanges()) {
      return;
    }

    try {
      setIsLoading(true);
      await saveRestrictedHoursToFirebase(userId, restrictedHours);
      Alert.alert("Success", "Restricted hours saved successfully!");
    } catch (error) {
      console.error("Error saving restricted hours:", error);
      Alert.alert("Error", "Failed to save restricted hours");
    } finally {
      setIsLoading(false);
    }
  };

  const addTimeRange = () => {
    const newTimeRange: TimeRange = {
      id: Date.now().toString(),
      startTime: "09:00",
      endTime: "17:00",
    };
    setRestrictedHours([...restrictedHours, newTimeRange]);
  };

  const removeTimeRange = (id: string) => {
    setRestrictedHours(restrictedHours.filter(range => range.id !== id));
  };

  const updateTimeRange = (id: string, field: 'startTime' | 'endTime', value: string) => {
    // Format the input as user types
    const formattedValue = formatTimeInput(value);
    
    setRestrictedHours(restrictedHours.map(range => 
      range.id === id ? { ...range, [field]: formattedValue } : range
    ));
  };

  const validateAllTimeRanges = (): boolean => {
    for (const range of restrictedHours) {
      if (!validateTimeFormat(range.startTime) || !validateTimeFormat(range.endTime)) {
        Alert.alert("Invalid Time", "Please enter valid time in HH:MM format");
        return false;
      }
      
      if (!validateTimeRange(range.startTime, range.endTime)) {
        Alert.alert("Invalid Time Range", "Start time must be before end time");
        return false;
      }
    }
    return true;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Preferences
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: "#8B5CF6" }]}>
            Restricted Hours
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.tabIconDefault }]}>
            Set time ranges when events cannot be scheduled
          </Text>

          {restrictedHours.map((timeRange, index) => (
            <View key={timeRange.id} style={styles.timeRangeContainer}>
              <View style={styles.timeRangeHeader}>
                <Text style={[styles.timeRangeLabel, { color: "#8B5CF6" }]}>
                  Time Range {index + 1}
                </Text>
                <TouchableOpacity
                  onPress={() => removeTimeRange(timeRange.id)}
                  style={styles.removeButton}
                >
                  <IconSymbol name="trash" size={20} color="#8B5CF6" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.timeInputsContainer}>
                <View style={styles.timeInputWrapper}>
                  <Text style={[styles.timeInputLabel, { color: colors.tabIconDefault }]}>
                    Start Time
                  </Text>
                  <TextInput
                    style={[
                      styles.timeInput,
                      { 
                        backgroundColor: colors.background,
                        borderColor: validateTimeFormat(timeRange.startTime) 
                          ? "#8B5CF6" 
                          : "#FF3B30",
                        color: colors.text 
                      }
                    ]}
                    value={timeRange.startTime}
                    onChangeText={(value) => updateTimeRange(timeRange.id, 'startTime', value)}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.tabIconDefault}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                
                <View style={styles.timeInputWrapper}>
                  <Text style={[styles.timeInputLabel, { color: colors.tabIconDefault }]}>
                    End Time
                  </Text>
                  <TextInput
                    style={[
                      styles.timeInput,
                      { 
                        backgroundColor: colors.background,
                        borderColor: validateTimeFormat(timeRange.endTime) 
                          ? "#8B5CF6" 
                          : "#FF3B30",
                        color: colors.text 
                      }
                    ]}
                    value={timeRange.endTime}
                    onChangeText={(value) => updateTimeRange(timeRange.id, 'endTime', value)}
                    placeholder="HH:MM"
                    placeholderTextColor={colors.tabIconDefault}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={addTimeRange}
          >
            <IconSymbol name="plus" size={20} color="#8B5CF6" />
            <Text style={styles.addButtonText}>
              Add Time Range
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveRestrictedHours}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? "Saving..." : "Save Restricted Hours"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About
          </Text>

          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>
              Version
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              1.0.0
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>
              Build
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              2024.01.15
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginRight: 40, // Compensate for back button width
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  timeRangeContainer: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderLeftWidth: 4,
    borderLeftColor: "#8B5CF6",
  },
  timeRangeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timeRangeLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  removeButton: {
    padding: 4,
  },
  timeInputsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  timeInputWrapper: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
    borderColor: "#8B5CF6", // Purple border
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B5CF6", // Purple text
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "#8B5CF6", // Purple background
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
