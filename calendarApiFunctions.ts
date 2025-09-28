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
}

// Configuration
const API_BASE_URL = "https://web-production-0c742.up.railway.app"; // Update with your API URL

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

// Example usage functions (optional - for testing)

/**
 * Example: Get today's events
 */
export const getTodaysEvents = async (
  accessToken: string
): Promise<CalendarEvent[]> => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  return await findEventsByDate(today, accessToken);
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
 * Example: Move an event by 1 hour
 */
export const moveEventByOneHour = async (
  title: string,
  currentStartTime: string,
  accessToken: string
): Promise<ApiResponse<any>> => {
  const currentStart = new Date(currentStartTime);
  const newStart = new Date(currentStart.getTime() + 60 * 60 * 1000); // Add 1 hour
  const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000); // 1 hour duration

  return await moveEvent(
    {
      title,
      current_start_datetime: currentStartTime,
      new_start_datetime: newStart.toISOString().slice(0, 19),
      new_end_datetime: newEnd.toISOString().slice(0, 19),
    },
    accessToken
  );
};
