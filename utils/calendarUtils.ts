/**
 * Calendar utility functions that integrate with restricted hours
 */

import { getRestrictedHours } from "@/lib/firebase";
import { getNextAvailableTimeSlot, isEventTimeRestricted } from "./timeUtils";

/**
 * Checks if a proposed event time conflicts with user's restricted hours
 * @param userId - User ID
 * @param eventStartTime - Event start time in HH:MM format
 * @param eventEndTime - Event end time in HH:MM format
 * @returns Promise<boolean> indicating if event conflicts with restricted hours
 */
export const checkEventAgainstRestrictedHours = async (
  userId: string,
  eventStartTime: string,
  eventEndTime: string
): Promise<boolean> => {
  try {
    const restrictedHours = await getRestrictedHours(userId);
    return isEventTimeRestricted(eventStartTime, eventEndTime, restrictedHours);
  } catch (error) {
    console.error("Error checking restricted hours:", error);
    return false; // Default to allowing the event if there's an error
  }
};

/**
 * Suggests the next available time slot for an event, avoiding restricted hours
 * @param userId - User ID
 * @param preferredStartTime - Preferred start time in HH:MM format
 * @param duration - Event duration in minutes
 * @returns Promise<string | null> - Next available time slot or null if none found
 */
export const suggestAvailableTimeSlot = async (
  userId: string,
  preferredStartTime: string,
  duration: number
): Promise<string | null> => {
  try {
    const restrictedHours = await getRestrictedHours(userId);
    return getNextAvailableTimeSlot(preferredStartTime, duration, restrictedHours);
  } catch (error) {
    console.error("Error suggesting time slot:", error);
    return null;
  }
};

/**
 * Validates an event time and provides suggestions if it conflicts with restricted hours
 * @param userId - User ID
 * @param eventStartTime - Event start time in HH:MM format
 * @param eventEndTime - Event end time in HH:MM format
 * @returns Promise<{isValid: boolean, suggestion?: string, message?: string}>
 */
export const validateEventTime = async (
  userId: string,
  eventStartTime: string,
  eventEndTime: string
): Promise<{isValid: boolean, suggestion?: string, message?: string}> => {
  try {
    const isRestricted = await checkEventAgainstRestrictedHours(userId, eventStartTime, eventEndTime);
    
    if (!isRestricted) {
      return { isValid: true };
    }
    
    // Calculate duration
    const startMinutes = parseInt(eventStartTime.split(':')[0]) * 60 + parseInt(eventStartTime.split(':')[1]);
    const endMinutes = parseInt(eventEndTime.split(':')[0]) * 60 + parseInt(eventEndTime.split(':')[1]);
    const duration = endMinutes - startMinutes;
    
    // Find alternative time slot
    const suggestion = await suggestAvailableTimeSlot(userId, eventStartTime, duration);
    
    return {
      isValid: false,
      suggestion: suggestion || undefined,
      message: suggestion 
        ? `This time conflicts with your restricted hours. Consider ${suggestion} instead.`
        : "This time conflicts with your restricted hours. Please choose a different time."
    };
  } catch (error) {
    console.error("Error validating event time:", error);
    return { isValid: true }; // Default to allowing if there's an error
  }
};

/**
 * Example usage in your calendar functions:
 * 
 * // Before creating an event:
 * const validation = await validateEventTime(userId, "14:00", "15:00");
 * if (!validation.isValid) {
 *   Alert.alert("Time Conflict", validation.message);
 *   if (validation.suggestion) {
 *     // Offer to use the suggested time
 *   }
 *   return;
 * }
 * 
 * // Proceed with creating the event...
 */
