import { parseCSV, exportContactsToCSV, formatPhoneNumber } from '../csvParser';
import { Contact } from '../../types';

describe('csvParser', () => {
  describe('parseCSV', () => {
    it('should parse valid CSV data correctly', () => {
      const csvData = 'Name,Phone,Email\nJohn Doe,123-456-7890,john@example.com\nJane Smith,987-654-3210,jane@example.com';
      
      const result = parseCSV(csvData);
      
      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.duplicates).toHaveLength(0);
      
      expect(result.successful[0]).toEqual({
        name: 'John Doe',
        phone: '123-456-7890',
        email: 'john@example.com',
        notes: '',
      });
    });

    it('should handle CSV with different header formats', () => {
      const csvData = 'full_name,phone_number,email_address\nJohn Doe,123-456-7890,john@example.com';
      
      const result = parseCSV(csvData);
      
      expect(result.successful).toHaveLength(1);
      expect(result.successful[0].name).toBe('John Doe');
    });

    it('should detect duplicates based on phone numbers', () => {
      const csvData = 'Name,Phone,Email\nJohn Doe,123-456-7890,john@example.com\nJane Doe,123-456-7890,jane@example.com';
      
      const result = parseCSV(csvData);
      
      expect(result.successful).toHaveLength(1);
      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0].reason).toBe('Duplicate phone number: 123-456-7890');
    });

    it('should handle missing required fields', () => {
      const csvData = 'Name,Phone,Email\n,123-456-7890,john@example.com\nJane Smith,,jane@example.com';
      
      const result = parseCSV(csvData);
      
      expect(result.failed).toHaveLength(2);
      expect(result.failed[0].reason).toBe('Missing required field: name');
      expect(result.failed[1].reason).toBe('Missing required field: phone');
    });

    it('should validate email formats', () => {
      const csvData = 'Name,Phone,Email\nJohn Doe,123-456-7890,invalid-email';
      
      const result = parseCSV(csvData);
      
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].reason).toBe('Invalid email format');
    });

    it('should validate phone number length', () => {
      const csvData = 'Name,Phone,Email\nJohn Doe,123,john@example.com';
      
      const result = parseCSV(csvData);
      
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].reason).toBe('Phone number must be at least 10 digits');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format 10-digit numbers correctly', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
    });

    it('should format 11-digit numbers correctly', () => {
      expect(formatPhoneNumber('11234567890')).toBe('1 (123) 456-7890');
    });

    it('should handle numbers with existing formatting', () => {
      expect(formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
    });

    it('should return original for invalid lengths', () => {
      expect(formatPhoneNumber('123')).toBe('123');
      expect(formatPhoneNumber('123456789012345')).toBe('123456789012345');
    });
  });

  describe('exportContactsToCSV', () => {
    it('should export contacts to CSV format correctly', () => {
      const contacts: Contact[] = [
        {
          id: 1,
          name: 'John Doe',
          phone: '(123) 456-7890',
          email: 'john@example.com',
          notes: 'Test notes',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
        {
          id: 2,
          name: 'Jane Smith',
          phone: '(987) 654-3210',
          email: 'jane@example.com',
          notes: '',
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
        },
      ];

      const csvContent = exportContactsToCSV(contacts);
      
      expect(csvContent).toContain('Name,Phone,Email,Notes');
      expect(csvContent).toContain('John Doe,(123) 456-7890,john@example.com,Test notes');
      expect(csvContent).toContain('Jane Smith,(987) 654-3210,jane@example.com,');
    });

    it('should handle empty contacts array', () => {
      const csvContent = exportContactsToCSV([]);
      
      expect(csvContent).toBe('Name,Phone,Email,Notes\n');
    });

    it('should escape special characters in CSV', () => {
      const contacts: Contact[] = [
        {
          id: 1,
          name: 'John "Test" Doe',
          phone: '(123) 456-7890',
          email: 'john@example.com',
          notes: 'Notes with, comma',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
      ];

      const csvContent = exportContactsToCSV(contacts);
      
      expect(csvContent).toContain('"John ""Test"" Doe"');
      expect(csvContent).toContain('"Notes with, comma"');
    });
  });
});