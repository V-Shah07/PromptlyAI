/**
 * Utility functions for time handling and validation
 */

/**
 * Validates if a time string is in HH:MM format
 * @param time - Time string to validate (e.g., "09:30")
 * @returns boolean indicating if the time is valid
 */
export const validateTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Validates if a time range is valid (start time is before end time)
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns boolean indicating if the time range is valid
 */
export const validateTimeRange = (startTime: string, endTime: string): boolean => {
  if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
    return false;
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return startMinutes < endMinutes;
};

/**
 * Formats time input as user types (adds colon automatically)
 * @param value - Current input value
 * @returns formatted time string
 */
export const formatTimeInput = (value: string): string => {
  // Remove any non-numeric characters
  const numbers = value.replace(/\D/g, '');
  
  // Limit to 4 digits
  const limited = numbers.slice(0, 4);
  
  // Add colon after 2 digits
  if (limited.length >= 2) {
    return `${limited.slice(0, 2)}:${limited.slice(2)}`;
  }
  
  return limited;
};

/**
 * Converts time string to minutes since midnight
 * @param time - Time in HH:MM format
 * @returns minutes since midnight
 */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Converts minutes since midnight to time string
 * @param minutes - Minutes since midnight
 * @returns time in HH:MM format
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Checks if two time ranges overlap
 * @param range1 - First time range {start: string, end: string}
 * @param range2 - Second time range {start: string, end: string}
 * @returns boolean indicating if ranges overlap
 */
export const timeRangesOverlap = (
  range1: { start: string; end: string },
  range2: { start: string; end: string }
): boolean => {
  const start1 = timeToMinutes(range1.start);
  const end1 = timeToMinutes(range1.end);
  const start2 = timeToMinutes(range2.start);
  const end2 = timeToMinutes(range2.end);

  return start1 < end2 && start2 < end1;
};

/**
 * Checks if a given time falls within any of the restricted time ranges
 * @param time - Time to check in HH:MM format
 * @param restrictedRanges - Array of restricted time ranges
 * @returns boolean indicating if time is restricted
 */
export const isTimeRestricted = (
  time: string,
  restrictedRanges: Array<{ startTime: string; endTime: string }>
): boolean => {
  const timeMinutes = timeToMinutes(time);
  
  return restrictedRanges.some(range => {
    const startMinutes = timeToMinutes(range.startTime);
    const endMinutes = timeToMinutes(range.endTime);
    
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  });
};

/**
 * Checks if an event time range conflicts with any restricted hours
 * @param eventStartTime - Event start time in HH:MM format
 * @param eventEndTime - Event end time in HH:MM format
 * @param restrictedRanges - Array of restricted time ranges
 * @returns boolean indicating if event conflicts with restricted hours
 */
export const isEventTimeRestricted = (
  eventStartTime: string,
  eventEndTime: string,
  restrictedRanges: Array<{ startTime: string; endTime: string }>
): boolean => {
  const eventStart = timeToMinutes(eventStartTime);
  const eventEnd = timeToMinutes(eventEndTime);
  
  return restrictedRanges.some(range => {
    const rangeStart = timeToMinutes(range.startTime);
    const rangeEnd = timeToMinutes(range.endTime);
    
    // Check if event overlaps with restricted range
    return eventStart < rangeEnd && eventEnd > rangeStart;
  });
};

/**
 * Gets the next available time slot after a given time, avoiding restricted hours
 * @param startTime - Starting time to check from in HH:MM format
 * @param duration - Duration in minutes
 * @param restrictedRanges - Array of restricted time ranges
 * @returns next available time slot or null if none found
 */
export const getNextAvailableTimeSlot = (
  startTime: string,
  duration: number,
  restrictedRanges: Array<{ startTime: string; endTime: string }>
): string | null => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + duration;
  
  // Check if the initial time slot is available
  if (!isEventTimeRestricted(startTime, minutesToTime(endMinutes), restrictedRanges)) {
    return startTime;
  }
  
  // Find the next available slot
  for (let minutes = startMinutes; minutes < 24 * 60; minutes += 15) { // Check every 15 minutes
    const currentTime = minutesToTime(minutes);
    const currentEndTime = minutesToTime(minutes + duration);
    
    if (!isEventTimeRestricted(currentTime, currentEndTime, restrictedRanges)) {
      return currentTime;
    }
  }
  
  return null; // No available slot found
};
