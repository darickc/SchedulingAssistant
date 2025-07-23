import * as SQLite from 'expo-sqlite';
import { Contact, Leader, AppointmentType, Appointment } from '../types';

// Database row types to avoid 'any'
interface ContactRow {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface LeaderRow {
  id: number;
  name: string;
  role: string;
  calendar_id: string;
  email: string;
  is_active: number;
}

interface AppointmentTypeRow {
  id: number;
  name: string;
  duration_minutes: number;
  template: string;
  color: string;
}

interface AppointmentRow {
  id: number;
  contact_id: number;
  leader_id: number;
  type_id: number;
  scheduled_time: string;
  status: string;
  google_event_id: string | null;
  notes: string | null;
  created_at: string;
}

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase;
  private static initialized = false;

  private static async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync('scheduling_assistant.db');
    }
    return this.db;
  }

  static async initialize(): Promise<void> {
    if (this.initialized) return;

    const db = await this.getDatabase();
    
    // Enable foreign keys
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    // Create tables
    await this.createTables(db);
    
    // Run migrations if needed
    await this.runMigrations(db);
    
    this.initialized = true;
  }

  private static async createTables(db: SQLite.SQLiteDatabase): Promise<void> {
    // Contacts table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Leaders table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS leaders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        calendar_id TEXT NOT NULL,
        email TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1
      );
    `);

    // Appointment types table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS appointment_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        template TEXT NOT NULL,
        color TEXT DEFAULT '#007AFF'
      );
    `);

    // Appointments table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_id INTEGER NOT NULL,
        leader_id INTEGER NOT NULL,
        type_id INTEGER NOT NULL,
        scheduled_time DATETIME NOT NULL,
        status TEXT DEFAULT 'pending',
        google_event_id TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES contacts(id),
        FOREIGN KEY (leader_id) REFERENCES leaders(id),
        FOREIGN KEY (type_id) REFERENCES appointment_types(id)
      );
    `);

    // Create indexes for better performance
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
      CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
      CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_time ON appointments(scheduled_time);
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    `);
  }

  private static async runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
    // Create a table to track migrations if it doesn't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get current version
    const result = await db.getFirstAsync<{version: string}>(`
      SELECT version FROM migrations ORDER BY id DESC LIMIT 1;
    `);
    
    const currentVersion = result?.version || '0.0.0';
    console.log('Current database version:', currentVersion);
    
    // Add future migrations here as needed
    // Example:
    // if (currentVersion < '1.1.0') {
    //   await this.migrateToV1_1_0(db);
    // }
  }

  // Contact CRUD operations
  static async createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const db = await this.getDatabase();
    const result = await db.runAsync(
      'INSERT INTO contacts (name, phone, email, notes) VALUES (?, ?, ?, ?)',
      [contact.name, contact.phone, contact.email || null, contact.notes || null]
    );
    
    const newContact = await this.getContactById(result.lastInsertRowId!);
    if (!newContact) {
      throw new Error('Failed to create contact');
    }
    return newContact;
  }

  static async getContactById(id: number): Promise<Contact | null> {
    const db = await this.getDatabase();
    const row = await db.getFirstAsync<ContactRow>(
      'SELECT * FROM contacts WHERE id = ?',
      [id]
    );
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  static async getAllContacts(): Promise<Contact[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<ContactRow>('SELECT * FROM contacts ORDER BY name ASC');
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  static async updateContact(id: number, updates: Partial<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Contact | null> {
    const db = await this.getDatabase();
    
    const fields = [];
    const values = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.phone !== undefined) {
      fields.push('phone = ?');
      values.push(updates.phone);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    
    if (fields.length === 0) {
      return this.getContactById(id);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await db.runAsync(
      `UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return this.getContactById(id);
  }

  static async deleteContact(id: number): Promise<boolean> {
    const db = await this.getDatabase();
    const result = await db.runAsync('DELETE FROM contacts WHERE id = ?', [id]);
    return result.changes > 0;
  }

  static async searchContacts(query: string): Promise<Contact[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<ContactRow>(
      'SELECT * FROM contacts WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC',
      [`%${query}%`, `%${query}%`]
    );
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  // Leader CRUD operations
  static async createLeader(leader: Omit<Leader, 'id'>): Promise<Leader> {
    const db = await this.getDatabase();
    const result = await db.runAsync(
      'INSERT INTO leaders (name, role, calendar_id, email, is_active) VALUES (?, ?, ?, ?, ?)',
      [leader.name, leader.role, leader.calendarId, leader.email, leader.isActive ? 1 : 0]
    );
    
    const newLeader = await this.getLeaderById(result.lastInsertRowId!);
    if (!newLeader) {
      throw new Error('Failed to create leader');
    }
    return newLeader;
  }

  static async getLeaderById(id: number): Promise<Leader | null> {
    const db = await this.getDatabase();
    const row = await db.getFirstAsync<LeaderRow>(
      'SELECT * FROM leaders WHERE id = ?',
      [id]
    );
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      calendarId: row.calendar_id,
      email: row.email,
      isActive: Boolean(row.is_active)
    };
  }

  static async getAllLeaders(): Promise<Leader[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<LeaderRow>('SELECT * FROM leaders ORDER BY name ASC');
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      role: row.role,
      calendarId: row.calendar_id,
      email: row.email,
      isActive: Boolean(row.is_active)
    }));
  }

  static async getActiveLeaders(): Promise<Leader[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<LeaderRow>('SELECT * FROM leaders WHERE is_active = 1 ORDER BY name ASC');
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      role: row.role,
      calendarId: row.calendar_id,
      email: row.email,
      isActive: Boolean(row.is_active)
    }));
  }

  // AppointmentType CRUD operations
  static async createAppointmentType(type: Omit<AppointmentType, 'id'>): Promise<AppointmentType> {
    const db = await this.getDatabase();
    const result = await db.runAsync(
      'INSERT INTO appointment_types (name, duration_minutes, template, color) VALUES (?, ?, ?, ?)',
      [type.name, type.durationMinutes, type.template, type.color]
    );
    
    const newType = await this.getAppointmentTypeById(result.lastInsertRowId!);
    if (!newType) {
      throw new Error('Failed to create appointment type');
    }
    return newType;
  }

  static async getAppointmentTypeById(id: number): Promise<AppointmentType | null> {
    const db = await this.getDatabase();
    const row = await db.getFirstAsync<AppointmentTypeRow>(
      'SELECT * FROM appointment_types WHERE id = ?',
      [id]
    );
    
    if (!row) return null;
    
    return {
      id: row.id,
      name: row.name,
      durationMinutes: row.duration_minutes,
      template: row.template,
      color: row.color
    };
  }

  static async getAllAppointmentTypes(): Promise<AppointmentType[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<AppointmentTypeRow>('SELECT * FROM appointment_types ORDER BY name ASC');
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      durationMinutes: row.duration_minutes,
      template: row.template,
      color: row.color
    }));
  }

  // Appointment CRUD operations
  static async createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    const db = await this.getDatabase();
    const result = await db.runAsync(
      'INSERT INTO appointments (contact_id, leader_id, type_id, scheduled_time, status, google_event_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        appointment.contactId,
        appointment.leaderId,
        appointment.typeId,
        appointment.scheduledTime.toISOString(),
        appointment.status,
        appointment.googleEventId || null,
        appointment.notes || null
      ]
    );
    
    const newAppointment = await this.getAppointmentById(result.lastInsertRowId!);
    if (!newAppointment) {
      throw new Error('Failed to create appointment');
    }
    return newAppointment;
  }

  static async getAppointmentById(id: number): Promise<Appointment | null> {
    const db = await this.getDatabase();
    const row = await db.getFirstAsync<AppointmentRow>(
      'SELECT * FROM appointments WHERE id = ?',
      [id]
    );
    
    if (!row) return null;
    
    return {
      id: row.id,
      contactId: row.contact_id,
      leaderId: row.leader_id,
      typeId: row.type_id,
      scheduledTime: new Date(row.scheduled_time),
      status: row.status as Appointment['status'],
      googleEventId: row.google_event_id,
      notes: row.notes,
      createdAt: new Date(row.created_at)
    };
  }

  static async getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<AppointmentRow>(
      'SELECT * FROM appointments WHERE scheduled_time BETWEEN ? AND ? ORDER BY scheduled_time ASC',
      [startDate.toISOString(), endDate.toISOString()]
    );
    
    return rows.map(row => ({
      id: row.id,
      contactId: row.contact_id,
      leaderId: row.leader_id,
      typeId: row.type_id,
      scheduledTime: new Date(row.scheduled_time),
      status: row.status as Appointment['status'],
      googleEventId: row.google_event_id,
      notes: row.notes,
      createdAt: new Date(row.created_at)
    }));
  }

  static async getAppointmentsByLeader(leaderId: number): Promise<Appointment[]> {
    const db = await this.getDatabase();
    const rows = await db.getAllAsync<AppointmentRow>(
      'SELECT * FROM appointments WHERE leader_id = ? ORDER BY scheduled_time ASC',
      [leaderId]
    );
    
    return rows.map(row => ({
      id: row.id,
      contactId: row.contact_id,
      leaderId: row.leader_id,
      typeId: row.type_id,
      scheduledTime: new Date(row.scheduled_time),
      status: row.status as Appointment['status'],
      googleEventId: row.google_event_id,
      notes: row.notes,
      createdAt: new Date(row.created_at)
    }));
  }

  static async updateAppointmentStatus(id: number, status: Appointment['status']): Promise<Appointment | null> {
    const db = await this.getDatabase();
    await db.runAsync(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, id]
    );
    
    return this.getAppointmentById(id);
  }

  // Utility methods
  static async seedDefaultData(): Promise<void> {
    const db = await this.getDatabase();
    
    // Check if we already have data
    const contactCount = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM contacts');
    if (contactCount && contactCount.count > 0) {
      return; // Data already exists
    }

    // Insert default appointment types
    const defaultTypes = [
      {
        name: 'Generic Meeting',
        durationMinutes: 15,
        template: 'Brother/Sister {name}, can you meet with {leader} this {day} at {time}?',
        color: '#007AFF'
      },
      {
        name: 'Temple Recommend Interview',
        durationMinutes: 10,
        template: 'Brother/Sister {name}, your temple recommend has expired or is about to expire. Can you meet with {leader} for a temple recommend interview this {day} at {time}?',
        color: '#34C759'
      },
      {
        name: 'Calling Interview',
        durationMinutes: 20,
        template: 'Brother/Sister {name}, can you meet with {leader} this {day} at {time} to discuss a calling opportunity?',
        color: '#FF9500'
      },
      {
        name: 'General Interview',
        durationMinutes: 15,
        template: 'Brother/Sister {name}, can you meet with {leader} this {day} at {time}?',
        color: '#5856D6'
      }
    ];

    for (const type of defaultTypes) {
      await db.runAsync(
        'INSERT INTO appointment_types (name, duration_minutes, template, color) VALUES (?, ?, ?, ?)',
        [type.name, type.durationMinutes, type.template, type.color]
      );
    }

    console.log('Default appointment types seeded');
  }

  static async clearAllData(): Promise<void> {
    const db = await this.getDatabase();
    
    // Clear in reverse order due to foreign key constraints
    await db.execAsync('DELETE FROM appointments');
    await db.execAsync('DELETE FROM appointment_types');
    await db.execAsync('DELETE FROM leaders');
    await db.execAsync('DELETE FROM contacts');
    await db.execAsync('DELETE FROM migrations');
    
    console.log('All data cleared');
  }

  static async getStats(): Promise<{
    contactCount: number;
    leaderCount: number;
    appointmentTypeCount: number;
    appointmentCount: number;
    upcomingAppointments: number;
  }> {
    const db = await this.getDatabase();
    
    const contactCountResult = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM contacts');
    const leaderCountResult = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM leaders WHERE is_active = 1');
    const appointmentTypeCountResult = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM appointment_types');
    const appointmentCountResult = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM appointments');
    const upcomingAppointmentsResult = await db.getFirstAsync<{count: number}>(
      'SELECT COUNT(*) as count FROM appointments WHERE scheduled_time > datetime("now") AND status != "cancelled"'
    );
    
    return {
      contactCount: contactCountResult?.count || 0,
      leaderCount: leaderCountResult?.count || 0,
      appointmentTypeCount: appointmentTypeCountResult?.count || 0,
      appointmentCount: appointmentCountResult?.count || 0,
      upcomingAppointments: upcomingAppointmentsResult?.count || 0
    };
  }
}