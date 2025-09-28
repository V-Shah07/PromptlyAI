// Calendar API Functions for Frontend Projects
// Simple TypeScript functions for calendar operations

// Types
interface CalendarEvent {
  title: string;
  start_time: string;
  end_time: string;
  calendar: string;
  calendar_id: string;
  event_id: string;
  description?: string;
  location?: string;
  status?: string;
}

interface CreateEventData {
  title: string;
  start_datetime: string; // YYYY-MM-DDTHH:mm:ss format
  end_datetime: string; // YYYY-MM-DDTHH:mm:ss format
  description?: string;
  calendar_id?: string;
}

interface MoveEventData {
  title: string;
  current_start_datetime: string; // YYYY-MM-DDTHH:mm:ss format
  new_start_datetime: string; // YYYY-MM-DDTHH:mm:ss format
  new_end_datetime: string; // YYYY-MM-DDTHH:mm:ss format
  calendar_id?: string;
}

interface ApiResponse<T> {
  message: string;
  data?: T;
  events?: CalendarEvent[];
  total_events?: number;
  success?: boolean;
  error?: any;
}

interface DeleteEventData {
  title: string;
  start_datetime: string; // YYYY-MM-DDTHH:mm:ss format
  calendar_id?: string;
}

// Configuration
const API_BASE_URL = "https://web-production-0c742.up.railway.app"; // Update with your API URL

/**
 * Get local date in YYYY-MM-DD format
 * This ensures consistent date handling across timezones
 */
export const getLocalDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Find all events on a specific date across all calendars
 * @param date - Date in YYYY-MM-DD format
 * @param accessToken - Google access token
 * @returns Promise with events array
 */
export const findEventsByDate = async (
  date: string,
  accessToken: string
): Promise<CalendarEvent[]> => {
  try {
    console.log("🔍 API Request - Date being sent to backend:", date);
    console.log("🔍 API Request - Date object:", new Date(date + "T12:00:00"));

    const response = await fetch(`${API_BASE_URL}/events/find`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ date }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to find events");
    }

    const result: ApiResponse<CalendarEvent[]> = await response.json();
    console.log("🔍 API Response - Raw events received:", result.events);
    console.log("🔍 API Response - Total events:", result.events?.length || 0);

    return result.events || [];
  } catch (error) {
    console.error("Error finding events:", error);
    throw error;
  }
};

/**
 * Create a new event in the calendar
 * @param eventData - Event details
 * @param accessToken - Google access token
 * @returns Promise with created event info
 */
export const createEvent = async (
  eventData: CreateEventData,
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/event/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create event");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

/**
 * Move an existing event to a new time
 * @param moveData - Move event details
 * @param accessToken - Google access token
 * @returns Promise with move result
 */
export const moveEvent = async (
  moveData: MoveEventData,
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/event/move`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(moveData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to move event");
    }

    return await response.json();
  } catch (error) {
    console.error("Error moving event:", error);
    throw error;
  }
};

/**
 * Delete an existing event from the calendar
 * @param deleteData - Delete event details
 * @param accessToken - Google access token
 * @returns Promise with delete result
 */
export const deleteEvent = async (
  deleteData: DeleteEventData,
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/event/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(deleteData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete event");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

// Example usage functions (optional - for testing)

/**
 * Example: Get today's events
 */
export const getTodaysEvents = async (
  accessToken: string
): Promise<CalendarEvent[]> => {
  return await findEventsByDate(getLocalDateString(), accessToken);
};

/**
 * Example: Create a simple event
 */
export const createSimpleEvent = async (
  title: string,
  startTime: string,
  endTime: string,
  accessToken: string,
  description?: string
): Promise<ApiResponse<any>> => {
  return await createEvent(
    {
      title,
      start_datetime: startTime,
      end_datetime: endTime,
      description: description || "",
    },
    accessToken
  );
};

/**
 * Check if a specific time slot has any conflicts with existing events
 * @param startDateTime - Start time in ISO format (YYYY-MM-DDTHH:mm:ss)
 * @param endDateTime - End time in ISO format (YYYY-MM-DDTHH:mm:ss)
 * @param accessToken - Google access token
 * @param excludeEventTitle - Event title to exclude from conflict check (for rescheduling)
 * @returns Promise with conflict check result
 */
export const checkTimeSlotConflict = async (
  startDateTime: string,
  endDateTime: string,
  accessToken: string,
  excludeEventTitle?: string
): Promise<{ hasConflict: boolean; conflictingEvents: any[] }> => {
  try {
    console.log(
      `🔍 Checking time slot conflict: ${startDateTime} - ${endDateTime}`
    );

    // Extract date from startDateTime
    const date = startDateTime.split("T")[0];

    // Get all events for that date
    const events = await findEventsByDate(date, accessToken);
    console.log(`📅 Found ${events.length} events on ${date}`);

    // Convert our time slot to Date objects for comparison
    const slotStart = new Date(startDateTime);
    const slotEnd = new Date(endDateTime);

    // Add 30-minute buffer on both sides for minimum spacing
    const bufferMinutes = 30;
    const bufferedSlotStart = new Date(
      slotStart.getTime() - bufferMinutes * 60 * 1000
    );
    const bufferedSlotEnd = new Date(
      slotEnd.getTime() + bufferMinutes * 60 * 1000
    );

    console.log(
      `🕐 Original slot: ${slotStart.toISOString()} - ${slotEnd.toISOString()}`
    );
    console.log(
      `🕐 Buffered slot: ${bufferedSlotStart.toISOString()} - ${bufferedSlotEnd.toISOString()}`
    );

    const conflictingEvents: any[] = [];

    // Check each event for conflicts
    for (const event of events) {
      // Skip the event we're rescheduling
      if (excludeEventTitle && event.title === excludeEventTitle) {
        continue;
      }

      // Convert event times to Date objects
      const convertEventTime = (timeStr: string): Date => {
        const [time, period] = timeStr.split(" ");
        const [hours, minutes] = time.split(":").map(Number);
        let hour24 = hours;

        if (period === "PM" && hours !== 12) hour24 += 12;
        if (period === "AM" && hours === 12) hour24 = 0;

        const eventDateTime = new Date(
          `${date}T${hour24.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:00`
        );
        return eventDateTime;
      };

      const eventStart = convertEventTime(event.start_time);
      const eventEnd = convertEventTime(event.end_time);

      // Check for overlap with buffered time slot (30 min buffer on each side)
      const hasOverlap =
        bufferedSlotStart < eventEnd && bufferedSlotEnd > eventStart;

      if (hasOverlap) {
        console.log(
          `❌ Conflict found with "${event.title}" (${event.start_time} - ${event.end_time}) - too close to our buffered slot`
        );
        conflictingEvents.push(event);
      }
    }

    const hasConflict = conflictingEvents.length > 0;
    console.log(
      `🔍 Conflict check result: ${hasConflict ? "CONFLICT" : "NO CONFLICT"}`
    );

    return {
      hasConflict,
      conflictingEvents,
    };
  } catch (error: any) {
    console.error("❌ Error checking time slot conflict:", error);
    return {
      hasConflict: false,
      conflictingEvents: [],
    };
  }
};

/**
 * Simple reschedule: Move event to next day at same time
 */
export const smartRescheduleEvent = async (
  title: string,
  currentStartTime: string,
  accessToken: string
): Promise<{ success: boolean; newTime?: string; message: string }> => {
  console.log(
    `🔄 Rescheduling "${title}" from ${currentStartTime} to next day at same time`
  );

  try {
    const currentStart = new Date(currentStartTime);

    // Calculate the same time next day
    const nextDayStart = new Date(currentStart.getTime() + 24 * 60 * 60 * 1000);

    // Calculate end time (assuming 1 hour duration)
    const eventDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    const nextDayEnd = new Date(nextDayStart.getTime() + eventDuration);

    console.log(`📅 Moving to: ${nextDayStart.toISOString()}`);

    // Move the event
    const result = await moveEvent(
      {
        title,
        current_start_datetime: currentStartTime,
        new_start_datetime: nextDayStart.toISOString().slice(0, 19),
        new_end_datetime: nextDayEnd.toISOString().slice(0, 19),
      },
      accessToken
    );

    // Format the new time for display
    const newTimeStr = nextDayStart.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return {
      success: true,
      newTime: newTimeStr,
      message: `Moved to tomorrow at ${newTimeStr}`,
    };
  } catch (error: any) {
    console.error("❌ Reschedule error:", error);
    return {
      success: false,
      message: `Reschedule failed: ${error.message}`,
    };
  }
};

/**
 * Delete an event by title and start time
 * @param title - Event title to delete
 * @param startDateTime - Start time in ISO format (YYYY-MM-DDTHH:mm:ss)
 * @param accessToken - Google access token
 * @param calendarId - Optional calendar ID (defaults to 'primary')
 * @returns Promise with delete result
 */
export const deleteEventByTitle = async (
  title: string,
  startDateTime: string,
  accessToken: string,
  calendarId: string = "primary"
): Promise<ApiResponse<any>> => {
  return await deleteEvent(
    {
      title,
      start_datetime: startDateTime,
      calendar_id: calendarId,
    },
    accessToken
  );
};

/**
 * Delete an event from today's events
 * @param title - Event title to delete
 * @param startTime - Start time in HH:mm format (e.g., "09:00")
 * @param accessToken - Google access token
 * @param calendarId - Optional calendar ID (defaults to 'primary')
 * @returns Promise with delete result
 */
export const deleteTodaysEvent = async (
  title: string,
  startTime: string,
  accessToken: string,
  calendarId: string = "primary"
): Promise<ApiResponse<any>> => {
  const today = getLocalDateString();
  const startDateTime = `${today}T${startTime}:00`;

  return await deleteEventByTitle(
    title,
    startDateTime,
    accessToken,
    calendarId
  );
};

/**
 * Delete multiple events with the same title
 * @param title - Event title to delete
 * @param accessToken - Google access token
 * @param calendarId - Optional calendar ID (defaults to 'primary')
 * @returns Promise with array of delete results
 */
export const deleteAllEventsWithTitle = async (
  title: string,
  accessToken: string,
  calendarId: string = "primary"
): Promise<ApiResponse<any>[]> => {
  try {
    // First, find all events with this title
    const today = getLocalDateString();
    const events = await findEventsByDate(today, accessToken);

    const matchingEvents = events.filter(
      (event) => event.title.toLowerCase() === title.toLowerCase()
    );

    console.log(`Found ${matchingEvents.length} events with title "${title}"`);

    // Delete each matching event
    const deleteResults: ApiResponse<any>[] = [];

    for (const event of matchingEvents) {
      try {
        // Convert event time back to ISO format
        const convertToISO = (timeStr: string): string => {
          const [time, period] = timeStr.split(" ");
          const [hours, minutes] = time.split(":").map(Number);
          let hour24 = hours;

          if (period === "PM" && hours !== 12) hour24 += 12;
          if (period === "AM" && hours === 12) hour24 = 0;

          return `${today}T${hour24.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:00`;
        };

        const startDateTime = convertToISO(event.start_time);

        const result = await deleteEventByTitle(
          event.title,
          startDateTime,
          accessToken,
          calendarId
        );

        deleteResults.push(result);
      } catch (error) {
        console.error(`Failed to delete event: ${event.title}`, error);
        deleteResults.push({
          success: false,
          message: `Failed to delete ${event.title}`,
          error: error,
        });
      }
    }

    return deleteResults;
  } catch (error) {
    console.error("Error deleting events with title:", error);
    throw error;
  }
};
