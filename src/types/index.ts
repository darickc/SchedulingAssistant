export interface Contact {
  id: number;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Leader {
  id: number;
  name: string;
  role: string;
  calendarId: string;
  email: string;
  isActive: boolean;
}

export interface AppointmentType {
  id: number;
  name: string;
  durationMinutes: number;
  template: string;
  color: string;
}

export interface Appointment {
  id: number;
  contactId: number;
  leaderId: number;
  typeId: number;
  scheduledTime: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  googleEventId?: string;
  notes?: string;
  createdAt: Date;
}

// Extended interfaces with related data
export interface AppointmentWithDetails extends Appointment {
  contact: Contact;
  leader: Leader;
  appointmentType: AppointmentType;
}

// Utility types for creating/updating records
export type CreateContactInput = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateContactInput = Partial<CreateContactInput>;

export type CreateLeaderInput = Omit<Leader, 'id'>;
export type UpdateLeaderInput = Partial<CreateLeaderInput>;

export type CreateAppointmentTypeInput = Omit<AppointmentType, 'id'>;
export type UpdateAppointmentTypeInput = Partial<CreateAppointmentTypeInput>;

export type CreateAppointmentInput = Omit<Appointment, 'id' | 'createdAt'>;
export type UpdateAppointmentInput = Partial<Omit<Appointment, 'id' | 'createdAt'>>;

// Time slot and scheduling types
export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  score?: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AvailabilityRequest {
  leaderId: number;
  durationMinutes: number;
  startDate: Date;
  endDate: Date;
  excludeAppointmentId?: number;
}

export interface SchedulingPreferences {
  workingHours: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  workingDays: number[]; // 0-6, where 0 is Sunday
  bufferMinutes: number; // Minutes between appointments
  timezone: string;
  preferredTimes?: {
    start: string;
    end: string;
    daysOfWeek: number[];
  };
  preferredDays?: number[];
}

// CSV import types
export interface ContactImportResult {
  successful: Contact[];
  failed: {
    row: number;
    data: unknown;
    error: string;
  }[];
  duplicates: {
    row: number;
    data: unknown;
    existingContact: Contact;
  }[];
}

// Message template types
export interface MessageTemplate {
  id?: number;
  name: string;
  template: string;
  variables?: string[]; // Auto-extracted from template
}

export interface MessageVariables {
  name: string;
  leader: string;
  day: string;
  time: string;
  date: string;
  appointmentType: string;
  location?: string;
  duration?: string;
}

// Google Calendar types
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: {
    email: string;
    displayName?: string;
  }[];
}

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
}

// Settings and configuration types
export interface AppSettings {
  defaultLeaderId?: number;
  defaultAppointmentTypeId?: number;
  schedulingPreferences: SchedulingPreferences;
  messageTemplates: MessageTemplate[];
  googleCalendarSettings: {
    syncEnabled: boolean;
    defaultCalendarId?: string;
    createReminders: boolean;
  };
  smsSettings: {
    includeLocation: boolean;
    sendConfirmationRequest: boolean;
    reminderHours: number;
  };
}

// Database statistics
export interface DatabaseStats {
  contactCount: number;
  leaderCount: number;
  appointmentTypeCount: number;
  appointmentCount: number;
  upcomingAppointments: number;
}

// Error types
export class DatabaseError extends Error {
  constructor(message: string, public readonly operation: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly field: string, public readonly value?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}