// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
export const db = getFirestore(app);

// Time tracking functions
export const saveTimeTracking = async (
  userId: string,
  taskId: string,
  taskData: {
    taskTitle: string;
    estimatedDuration: string;
    actualDuration: string;
    tags?: string[];
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

//https://github.com/firebase/firebase-ios-sdk
