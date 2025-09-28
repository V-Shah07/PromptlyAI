// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

// Conditionally import analytics for web compatibility
let analytics: any = null;
if (typeof window !== 'undefined') {
  try {
    const { getAnalytics } = require("firebase/analytics");
    analytics = getAnalytics;
  } catch (error) {
    console.log("Analytics not available in this environment");
  }
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB50xbLWNRv1ZLnUalQds3veby3a3cYXPM",
  authDomain: "promptly-7fa63.firebaseapp.com",
  projectId: "promptly-7fa63",
  storageBucket: "promptly-7fa63.firebasestorage.app",
  messagingSenderId: "921179215347",
  appId: "1:921179215347:web:b8cc9adf99c72f06a6ee86",
  measurementId: "G-JPCGGD1KHV",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initialize analytics if available
if (analytics && typeof window !== 'undefined') {
  try {
    analytics(app);
  } catch (error) {
    console.log("Analytics initialization failed:", error);
  }
}

// Time tracking functions
export const saveTimeTracking = async (
  userId: string,
  taskId: string,
  taskData: {
    taskTitle: string;
    estimatedDuration: string;
    actualDuration: string;
    tags?: string[];
    completed?: boolean; // Added completed field
  }
) => {
  try {
    const taskRef = doc(db, "timeTracking", userId, "tasks", taskId);

    // Update or create task document
    const dataToSave = {
      taskTitle: taskData.taskTitle,
      estimatedDuration: taskData.estimatedDuration,
      actualDuration: taskData.actualDuration,
      tags: taskData.tags || [],
      completed: taskData.completed || false, // Store completion status
      lastUpdated: serverTimestamp(),
    };

    console.log("🔥 Saving to Firebase:", JSON.stringify(dataToSave, null, 2));

    await setDoc(taskRef, dataToSave, { merge: true });

    console.log("✅ Time tracking data saved successfully");
  } catch (error) {
    console.error("❌ Error saving time tracking data:", error);
    throw error;
  }
};

export const getTimeTracking = async (userId: string, taskId: string) => {
  try {
    const taskRef = doc(db, "timeTracking", userId, "tasks", taskId);
    const taskSnap = await getDoc(taskRef);

    if (taskSnap.exists()) {
      return taskSnap.data();
    }
    return null;
  } catch (error) {
    console.error("❌ Error getting time tracking data:", error);
    throw error;
  }
};

// Event tags functions
export const saveEventTags = async (
  userId: string,
  eventTitle: string,
  tags: string[]
) => {
  try {
    const tagsRef = doc(db, "eventTags", userId, "events", eventTitle);

    await setDoc(
      tagsRef,
      {
        eventTitle,
        tags,
        lastUpdated: serverTimestamp(),
      },
      { merge: true }
    );

    console.log("🏷️ Event tags saved successfully:", { eventTitle, tags });
  } catch (error) {
    console.error("❌ Error saving event tags:", error);
    throw error;
  }
};

export const getEventTags = async (userId: string, eventTitle: string) => {
  try {
    const tagsRef = doc(db, "eventTags", userId, "events", eventTitle);
    const tagsSnap = await getDoc(tagsRef);

    if (tagsSnap.exists()) {
      return tagsSnap.data()?.tags || [];
    }
    return [];
  } catch (error) {
    console.error("❌ Error getting event tags:", error);
    return [];
  }
};

export const getAllEventTags = async (userId: string) => {
  try {
    const tagsRef = collection(db, "eventTags", userId, "events");
    const tagsSnap = await getDocs(tagsRef);

    const eventTagsMap: { [eventTitle: string]: string[] } = {};
    tagsSnap.forEach((doc) => {
      const data = doc.data();
      eventTagsMap[data.eventTitle] = data.tags || [];
    });

    return eventTagsMap;
  } catch (error) {
    console.error("❌ Error getting all event tags:", error);
    return {};
  }
};

// Restricted Hours functions
export const saveRestrictedHours = async (
  userId: string,
  restrictedHours: Array<{
    id: string;
    startTime: string;
    endTime: string;
  }>
) => {
  try {
    // Clear existing restricted hours
    const existingRef = collection(db, "userPreferences", userId, "restrictedHours");
    const existingSnapshot = await getDocs(existingRef);
    
    // Delete existing documents
    const deletePromises = existingSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // Save new restricted hours
    const savePromises = restrictedHours.map(timeRange => {
      const docRef = doc(db, "userPreferences", userId, "restrictedHours", timeRange.id);
      return setDoc(docRef, {
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
        lastUpdated: serverTimestamp(),
      });
    });
    
    await Promise.all(savePromises);
    console.log("✅ Restricted hours saved successfully");
  } catch (error) {
    console.error("❌ Error saving restricted hours:", error);
    throw error;
  }
};

export const getRestrictedHours = async (userId: string) => {
  try {
    const restrictedHoursRef = collection(db, "userPreferences", userId, "restrictedHours");
    const snapshot = await getDocs(restrictedHoursRef);
    
    const restrictedHours: Array<{
      id: string;
      startTime: string;
      endTime: string;
    }> = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      restrictedHours.push({
        id: doc.id,
        startTime: data.startTime,
        endTime: data.endTime,
      });
    });
    
    return restrictedHours;
  } catch (error) {
    console.error("❌ Error getting restricted hours:", error);
    return [];
  }
};

// Get all completed tasks for a user
export const getCompletedTasks = async (userId: string) => {
  try {
    const timeTrackingRef = collection(db, "timeTracking", userId, "tasks");
    const timeTrackingSnap = await getDocs(timeTrackingRef);

    const completedTasks: Set<string> = new Set();

    timeTrackingSnap.forEach((doc) => {
      const data = doc.data();
      if (data.completed === true) {
        // Use the document ID as the task identifier (this matches what we save)
        completedTasks.add(doc.id);
      }
    });

    console.log(
      "✅ Loaded completed tasks from Firestore:",
      Array.from(completedTasks)
    );
    return completedTasks;
  } catch (error) {
    console.error("❌ Error getting completed tasks:", error);
    return new Set<string>();
  }
};

// Analytics functions
export const getAnalyticsData = async (userId: string) => {
  try {
    // Get all time tracking data
    const timeTrackingRef = collection(db, "timeTracking", userId, "tasks");
    const timeTrackingSnap = await getDocs(timeTrackingRef);

    // Get all event tags
    const eventTagsRef = collection(db, "eventTags", userId, "events");
    const eventTagsSnap = await getDocs(eventTagsRef);

    const timeTrackingData: any[] = [];
    const eventTagsData: any[] = [];

    timeTrackingSnap.forEach((doc) => {
      timeTrackingData.push({ id: doc.id, ...doc.data() });
    });

    eventTagsSnap.forEach((doc) => {
      eventTagsData.push({ id: doc.id, ...doc.data() });
    });

    // Count completed tasks
    const completedTasksCount = timeTrackingData.filter(
      (task) => task.completed === true
    ).length;

    // Filter event tags to only include those from completed tasks
    const completedTaskTitles = timeTrackingData
      .filter((task) => task.completed === true)
      .map((task) => task.taskTitle);

    const completedEventTagsData = eventTagsData.filter((eventTag) =>
      completedTaskTitles.includes(eventTag.eventTitle)
    );

    console.log("📊 Analytics data fetched:", {
      timeTrackingCount: timeTrackingData.length,
      eventTagsCount: eventTagsData.length,
      completedTasksCount: completedTasksCount,
      completedEventTagsCount: completedEventTagsData.length,
      completedTaskTitles: completedTaskTitles,
    });

    return {
      timeTracking: timeTrackingData,
      eventTags: completedEventTagsData, // Only return tags from completed tasks
      totalTasks: timeTrackingData.length,
      completedTasks: completedTasksCount,
      totalEvents: eventTagsData.length,
    };
  } catch (error) {
    console.error("❌ Error getting analytics data:", error);
    return {
      timeTracking: [],
      eventTags: [],
      totalTasks: 0,
      completedTasks: 0,
      totalEvents: 0,
    };
  }
};

export const getTimeAnalytics = (timeTrackingData: any[]) => {
  let totalEstimatedMinutes = 0;
  let totalActualMinutes = 0;
  let completedTasks = 0;

  console.log(
    "🕐 Processing time tracking data:",
    timeTrackingData.length,
    "tasks"
  );

  timeTrackingData.forEach((task, index) => {
    // Parse estimated duration (e.g., "2h 30m" or "90m")
    const estimated = parseDurationToMinutes(task.estimatedDuration || "0m");
    const actual = parseDurationToMinutes(task.actualDuration || "0m");

    console.log(`🕐 Task ${index + 1}:`, {
      title: task.taskTitle,
      estimatedDuration: task.estimatedDuration,
      actualDuration: task.actualDuration,
      estimatedMinutes: estimated,
      actualMinutes: actual,
      completed: task.completed,
    });

    totalEstimatedMinutes += estimated;
    totalActualMinutes += actual;

    // Use the completed field instead of checking if actual > 0
    if (task.completed === true) {
      completedTasks++;
    }
  });

  console.log("🕐 Time totals:", {
    totalEstimatedMinutes,
    totalActualMinutes,
    completedTasks,
    totalTasks: timeTrackingData.length,
  });

  const estimatedHours = Math.floor(totalEstimatedMinutes / 60);
  const estimatedMins = totalEstimatedMinutes % 60;
  const actualHours = Math.floor(totalActualMinutes / 60);
  const actualMins = totalActualMinutes % 60;

  return {
    totalEstimatedTime: `${estimatedHours}h ${estimatedMins}m`,
    totalActualTime: `${actualHours}h ${actualMins}m`,
    timeEfficiency:
      totalEstimatedMinutes > 0
        ? Math.round((totalActualMinutes / totalEstimatedMinutes) * 100)
        : 0,
    completedTasks,
    totalTasks: timeTrackingData.length,
    completionRate:
      timeTrackingData.length > 0
        ? Math.round((completedTasks / timeTrackingData.length) * 100)
        : 0,
    averageEstimatedMinutes:
      timeTrackingData.length > 0
        ? Math.round(totalEstimatedMinutes / timeTrackingData.length)
        : 0,
    averageActualMinutes:
      completedTasks > 0 ? Math.round(totalActualMinutes / completedTasks) : 0,
  };
};

export const getTagAnalytics = (eventTagsData: any[]) => {
  const tagCounts: { [key: string]: number } = {};
  const categoryCounts: { [key: string]: number } = {};
  const priorityCounts: { [key: string]: number } = {};

  eventTagsData.forEach((event) => {
    const tags = event.tags || [];
    tags.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;

      // Categorize tags
      if (
        [
          "work",
          "academic",
          "social",
          "extracurriculars",
          "others",
          "health",
          "fitness",
        ].includes(tag)
      ) {
        categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
      } else if (["high", "medium", "low"].includes(tag)) {
        priorityCounts[tag] = (priorityCounts[tag] || 0) + 1;
      }
    });
  });

  return {
    allTags: tagCounts,
    categories: categoryCounts,
    priorities: priorityCounts,
    totalUniqueTags: Object.keys(tagCounts).length,
    mostCommonTag: Object.keys(tagCounts).reduce(
      (a, b) => (tagCounts[a] > tagCounts[b] ? a : b),
      ""
    ),
    mostCommonCategory: Object.keys(categoryCounts).reduce(
      (a, b) => (categoryCounts[a] > categoryCounts[b] ? a : b),
      ""
    ),
    mostCommonPriority: Object.keys(priorityCounts).reduce(
      (a, b) => (priorityCounts[a] > priorityCounts[b] ? a : b),
      ""
    ),
  };
};

// Helper function to parse duration strings
const parseDurationToMinutes = (duration: string): number => {
  if (!duration) return 0;

  const cleanDuration = duration.toLowerCase().replace(/\s/g, "");
  const hoursMatch = cleanDuration.match(/(\d+)h/);
  const minutesMatch = cleanDuration.match(/(\d+)m/);

  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

  const totalMinutes = hours * 60 + minutes;

  console.log(`🕐 Parsing duration "${duration}":`, {
    cleanDuration,
    hoursMatch: hoursMatch?.[1],
    minutesMatch: minutesMatch?.[1],
    hours,
    minutes,
    totalMinutes,
  });

  return totalMinutes;
};

//https://github.com/firebase/firebase-ios-sdk
