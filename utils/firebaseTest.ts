/**
 * Simple Firebase test utility
 * This can be used to verify Firebase connectivity
 */

import { getRestrictedHours, saveRestrictedHours } from "@/lib/firebase";

export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log("🧪 Testing Firebase connection...");
    
    // Test reading from Firebase
    const testUserId = "test-user-123";
    const hours = await getRestrictedHours(testUserId);
    console.log("✅ Firebase read test successful:", hours);
    
    // Test writing to Firebase
    const testData = [
      {
        id: "test-1",
        startTime: "12:00",
        endTime: "13:00"
      }
    ];
    
    await saveRestrictedHours(testUserId, testData);
    console.log("✅ Firebase write test successful");
    
    // Clean up test data
    await saveRestrictedHours(testUserId, []);
    console.log("✅ Firebase cleanup successful");
    
    return true;
  } catch (error) {
    console.error("❌ Firebase test failed:", error);
    return false;
  }
};

// Usage example:
// import { testFirebaseConnection } from "@/utils/firebaseTest";
// const isWorking = await testFirebaseConnection();
// console.log("Firebase working:", isWorking);
