import { AuthService } from './auth';
import { Platform } from 'react-native';

const CALENDAR_BASE_URL = 'https://www.googleapis.com/calendar/v3';

export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  timeZone?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  accessRole: string;
  primary?: boolean;
}

export interface Event {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
  creator?: {
    email?: string;
    displayName?: string;
  };
  organizer?: {
    email?: string;
    displayName?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

export interface EventInput {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
  }>;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export interface FreeBusyInfo {
  calendars: {
    [calendarId: string]: {
      busy: Array<{
        start: string;
        end: string;
      }>;
    };
  };
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export class CalendarService {
  /**
   * List all calendars the user has access to
   */
  static async listCalendars(): Promise<Calendar[]> {
    try {
      const accessToken = await AuthService.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(`${CALENDAR_BASE_URL}/users/me/calendarList`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list calendars: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('List calendars error:', error);
      throw error;
    }
  }

  /**
   * Get events from a specific calendar
   */
  static async getEvents(
    calendarId: string,
    timeMin: Date,
    timeMax: Date,
    maxResults: number = 250
  ): Promise<Event[]> {
    try {
      const accessToken = await AuthService.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: maxResults.toString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      const response = await fetch(
        `${CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get events: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Get events error:', error);
      throw error;
    }
  }

  /**
   * Create a new event in a calendar
   */
  static async createEvent(calendarId: string, event: EventInput): Promise<Event> {
    try {
      const accessToken = await AuthService.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(
        `${CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Create event error:', error);
      throw error;
    }
  }

  /**
   * Update an existing event
   */
  static async updateEvent(
    calendarId: string,
    eventId: string,
    event: EventInput
  ): Promise<Event> {
    try {
      const accessToken = await AuthService.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(
        `${CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update event: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Update event error:', error);
      throw error;
    }
  }

  /**
   * Delete an event from a calendar
   */
  static async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    try {
      const accessToken = await AuthService.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await fetch(
        `${CALENDAR_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Delete event error:', error);
      throw error;
    }
  }

  /**
   * Get free/busy information for multiple calendars
   */
  static async getFreeBusy(
    calendarIds: string[],
    timeMin: Date,
    timeMax: Date
  ): Promise<FreeBusyInfo> {
    try {
      const accessToken = await AuthService.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const items = calendarIds.map(id => ({ id }));

      const response = await fetch(`${CALENDAR_BASE_URL}/freeBusy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get free/busy info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get free/busy error:', error);
      throw error;
    }
  }

  /**
   * Find available time slots based on free/busy information
   */
  static async findAvailableSlots(
    calendarId: string,
    duration: number, // in minutes
    searchStart: Date,
    searchEnd: Date,
    workingHours: { start: number; end: number } = { start: 9, end: 17 }
  ): Promise<TimeSlot[]> {
    try {
      // Get free/busy info
      const freeBusy = await this.getFreeBusy([calendarId], searchStart, searchEnd);
      const busySlots = freeBusy.calendars[calendarId]?.busy || [];

      const availableSlots: TimeSlot[] = [];
      const slotDuration = duration * 60 * 1000; // Convert to milliseconds

      // Start from the beginning of the search period
      let currentTime = new Date(searchStart);
      currentTime.setHours(workingHours.start, 0, 0, 0);

      while (currentTime < searchEnd) {
        const slotEnd = new Date(currentTime.getTime() + slotDuration);

        // Check if slot is within working hours
        const isWorkingHours =
          currentTime.getHours() >= workingHours.start &&
          slotEnd.getHours() <= workingHours.end &&
          currentTime.getDay() !== 0 && // Not Sunday
          currentTime.getDay() !== 6; // Not Saturday

        if (isWorkingHours) {
          // Check if slot conflicts with any busy time
          const hasConflict = busySlots.some(busy => {
            const busyStart = new Date(busy.start);
            const busyEnd = new Date(busy.end);
            return (
              (currentTime >= busyStart && currentTime < busyEnd) ||
              (slotEnd > busyStart && slotEnd <= busyEnd) ||
              (currentTime <= busyStart && slotEnd >= busyEnd)
            );
          });

          if (!hasConflict) {
            availableSlots.push({
              start: new Date(currentTime),
              end: new Date(slotEnd),
              available: true,
            });
          }
        }

        // Move to next slot (15-minute intervals)
        currentTime.setMinutes(currentTime.getMinutes() + 15);

        // If we've reached the end of working hours, move to next day
        if (currentTime.getHours() >= workingHours.end) {
          currentTime.setDate(currentTime.getDate() + 1);
          currentTime.setHours(workingHours.start, 0, 0, 0);
        }
      }

      return availableSlots;
    } catch (error) {
      console.error('Find available slots error:', error);
      throw error;
    }
  }

  /**
   * Check if a specific time slot is available
   */
  static async isSlotAvailable(
    calendarId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    try {
      const freeBusy = await this.getFreeBusy([calendarId], startTime, endTime);
      const busySlots = freeBusy.calendars[calendarId]?.busy || [];
      return busySlots.length === 0;
    } catch (error) {
      console.error('Check slot availability error:', error);
      throw error;
    }
  }

  /**
   * Batch create multiple events
   */
  static async createBatchEvents(
    calendarId: string,
    events: EventInput[]
  ): Promise<Event[]> {
    try {
      const createdEvents: Event[] = [];
      
      // Google Calendar API doesn't support true batch operations,
      // so we'll create them sequentially with error handling
      for (const event of events) {
        try {
          const created = await this.createEvent(calendarId, event);
          createdEvents.push(created);
        } catch (error) {
          console.error('Failed to create event:', event.summary, error);
          // Continue with other events
        }
      }

      return createdEvents;
    } catch (error) {
      console.error('Batch create events error:', error);
      throw error;
    }
  }
}