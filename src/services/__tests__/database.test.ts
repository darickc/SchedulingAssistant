import { DatabaseService } from '../database';
import { CreateContactInput, CreateAppointmentInput } from '../../types';

// Mock expo-sqlite
const mockTransaction = jest.fn();
const mockExecuteSql = jest.fn();

jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(() => ({
    transaction: mockTransaction,
    executeSql: mockExecuteSql,
  })),
}));

describe('DatabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the database instance
    (DatabaseService as any).db = null;
  });

  describe('Contact operations', () => {
    it('should create a contact successfully', async () => {
      // Mock successful insertion
      mockTransaction.mockImplementation((callback) => {
        callback({
          executeSql: (query, params, successCallback) => {
            successCallback(null, {
              insertId: 1,
              rows: { length: 0, _array: [] },
            });
          },
        });
      });

      const contactInput: CreateContactInput = {
        name: 'John Doe',
        phone: '(123) 456-7890',
        email: 'john@example.com',
        notes: 'Test contact',
      };

      const result = await DatabaseService.createContact(contactInput);

      expect(result).toEqual({
        id: 1,
        ...contactInput,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should get all contacts', async () => {
      const mockContacts = [
        {
          id: 1,
          name: 'John Doe',
          phone: '(123) 456-7890',
          email: 'john@example.com',
          notes: 'Test contact',
          created_at: '2023-01-01T00:00:00.000Z',
          updated_at: '2023-01-01T00:00:00.000Z',
        },
      ];

      mockTransaction.mockImplementation((callback) => {
        callback({
          executeSql: (query, params, successCallback) => {
            successCallback(null, {
              rows: { 
                length: 1, 
                _array: mockContacts,
                item: (index) => mockContacts[index],
              },
            });
          },
        });
      });

      const result = await DatabaseService.getAllContacts();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        name: 'John Doe',
        phone: '(123) 456-7890',
        email: 'john@example.com',
        notes: 'Test contact',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should update a contact', async () => {
      mockTransaction.mockImplementation((callback) => {
        callback({
          executeSql: (query, params, successCallback) => {
            if (query.includes('UPDATE')) {
              successCallback(null, { rowsAffected: 1 });
            } else {
              // GET query
              successCallback(null, {
                rows: {
                  length: 1,
                  _array: [{
                    id: 1,
                    name: 'John Updated',
                    phone: '(123) 456-7890',
                    email: 'john.updated@example.com',
                    notes: 'Updated notes',
                    created_at: '2023-01-01T00:00:00.000Z',
                    updated_at: new Date().toISOString(),
                  }],
                  item: (index) => ({
                    id: 1,
                    name: 'John Updated',
                    phone: '(123) 456-7890',
                    email: 'john.updated@example.com',
                    notes: 'Updated notes',
                    created_at: '2023-01-01T00:00:00.000Z',
                    updated_at: new Date().toISOString(),
                  }),
                },
              });
            }
          },
        });
      });

      const result = await DatabaseService.updateContact(1, {
        name: 'John Updated',
        email: 'john.updated@example.com',
        notes: 'Updated notes',
      });

      expect(result?.name).toBe('John Updated');
      expect(result?.email).toBe('john.updated@example.com');
    });

    it('should delete a contact', async () => {
      mockTransaction.mockImplementation((callback) => {
        callback({
          executeSql: (query, params, successCallback) => {
            successCallback(null, { rowsAffected: 1 });
          },
        });
      });

      const result = await DatabaseService.deleteContact(1);

      expect(result).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      mockTransaction.mockImplementation((callback) => {
        callback({
          executeSql: (query, params, successCallback, errorCallback) => {
            errorCallback(null, new Error('Database error'));
          },
        });
      });

      await expect(DatabaseService.getAllContacts()).rejects.toThrow('Database error');
    });
  });

  describe('Appointment operations', () => {
    it('should create an appointment successfully', async () => {
      mockTransaction.mockImplementation((callback) => {
        callback({
          executeSql: (query, params, successCallback) => {
            successCallback(null, {
              insertId: 1,
              rows: { length: 0, _array: [] },
            });
          },
        });
      });

      const appointmentInput: CreateAppointmentInput = {
        contactId: 1,
        leaderId: 1,
        typeId: 1,
        scheduledTime: new Date('2023-12-25T10:00:00'),
        status: 'pending',
        notes: 'Test appointment',
      };

      const result = await DatabaseService.createAppointment(appointmentInput);

      expect(result).toEqual({
        id: 1,
        ...appointmentInput,
        googleEventId: null,
        createdAt: expect.any(Date),
      });
    });

    it('should get appointments by date range', async () => {
      const mockAppointments = [
        {
          id: 1,
          contact_id: 1,
          leader_id: 1,
          type_id: 1,
          scheduled_time: '2023-12-25T10:00:00.000Z',
          status: 'pending',
          google_event_id: null,
          notes: 'Test appointment',
          created_at: '2023-01-01T00:00:00.000Z',
        },
      ];

      mockTransaction.mockImplementation((callback) => {
        callback({
          executeSql: (query, params, successCallback) => {
            successCallback(null, {
              rows: {
                length: 1,
                _array: mockAppointments,
                item: (index) => mockAppointments[index],
              },
            });
          },
        });
      });

      const startDate = new Date('2023-12-01');
      const endDate = new Date('2023-12-31');
      
      const result = await DatabaseService.getAppointmentsByDateRange(startDate, endDate);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        contactId: 1,
        leaderId: 1,
        typeId: 1,
        scheduledTime: expect.any(Date),
        status: 'pending',
        googleEventId: null,
        notes: 'Test appointment',
        createdAt: expect.any(Date),
      });
    });
  });

  describe('Leader operations', () => {
    it('should get all leaders', async () => {
      const mockLeaders = [
        {
          id: 1,
          name: 'Bishop Smith',
          role: 'Bishop',
          calendar_id: 'calendar123',
          email: 'bishop@example.com',
          is_active: 1,
        },
      ];

      mockTransaction.mockImplementation((callback) => {
        callback({
          executeSql: (query, params, successCallback) => {
            successCallback(null, {
              rows: {
                length: 1,
                _array: mockLeaders,
                item: (index) => mockLeaders[index],
              },
            });
          },
        });
      });

      const result = await DatabaseService.getAllLeaders();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        name: 'Bishop Smith',
        role: 'Bishop',
        calendarId: 'calendar123',
        email: 'bishop@example.com',
        isActive: true,
      });
    });
  });
});