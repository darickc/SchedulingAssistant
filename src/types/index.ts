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