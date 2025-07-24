import { renderHook, act } from '@testing-library/react-native';
import { useContactStore } from '../contactStore';
import { DatabaseService } from '../../services/database';
import { CreateContactInput } from '../../types';

// Mock DatabaseService
jest.mock('../../services/database');
const mockDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>;

describe('contactStore', () => {
  beforeEach(() => {
    // Reset store state
    const { result } = renderHook(() => useContactStore());
    act(() => {
      result.current.reset();
    });
    
    jest.clearAllMocks();
  });

  it('should load contacts successfully', async () => {
    const mockContacts = [
      {
        id: 1,
        name: 'John Doe',
        phone: '(123) 456-7890',
        email: 'john@example.com',
        notes: 'Test contact',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockDatabaseService.getAllContacts.mockResolvedValue(mockContacts);

    const { result } = renderHook(() => useContactStore());

    await act(async () => {
      await result.current.loadContacts();
    });

    expect(result.current.contacts).toEqual(mockContacts);
    expect(result.current.filteredContacts).toEqual(mockContacts);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle load contacts error', async () => {
    const errorMessage = 'Database error';
    mockDatabaseService.getAllContacts.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useContactStore());

    await act(async () => {
      await result.current.loadContacts();
    });

    expect(result.current.contacts).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should create a contact successfully', async () => {
    const newContactInput: CreateContactInput = {
      name: 'Jane Smith',
      phone: '(987) 654-3210',
      email: 'jane@example.com',
      notes: 'New contact',
    };

    const createdContact = {
      id: 2,
      ...newContactInput,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockDatabaseService.createContact.mockResolvedValue(createdContact);

    const { result } = renderHook(() => useContactStore());

    // Set initial state
    act(() => {
      result.current.contacts = [{
        id: 1,
        name: 'John Doe',
        phone: '(123) 456-7890',
        email: 'john@example.com',
        notes: 'Existing contact',
        createdAt: new Date(),
        updatedAt: new Date(),
      }];
    });

    await act(async () => {
      await result.current.createContact(newContactInput);
    });

    expect(result.current.contacts).toHaveLength(2);
    expect(result.current.contacts.find(c => c.id === 2)).toEqual(createdContact);
    expect(result.current.loading).toBe(false);
  });

  it('should filter contacts based on search query', () => {
    const { result } = renderHook(() => useContactStore());

    const mockContacts = [
      {
        id: 1,
        name: 'John Doe',
        phone: '(123) 456-7890',
        email: 'john@example.com',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: 'Jane Smith',
        phone: '(987) 654-3210',
        email: 'jane@example.com',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    act(() => {
      result.current.contacts = mockContacts;
      result.current.filteredContacts = mockContacts;
    });

    // Filter by name
    act(() => {
      result.current.setSearchQuery('John');
    });

    expect(result.current.filteredContacts).toHaveLength(1);
    expect(result.current.filteredContacts[0].name).toBe('John Doe');

    // Filter by phone
    act(() => {
      result.current.setSearchQuery('987');
    });

    expect(result.current.filteredContacts).toHaveLength(1);
    expect(result.current.filteredContacts[0].name).toBe('Jane Smith');

    // Clear filter
    act(() => {
      result.current.setSearchQuery('');
    });

    expect(result.current.filteredContacts).toHaveLength(2);
  });

  it('should update a contact successfully', async () => {
    const updatedContact = {
      id: 1,
      name: 'John Updated',
      phone: '(123) 456-7890',
      email: 'john.updated@example.com',
      notes: 'Updated contact',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockDatabaseService.updateContact.mockResolvedValue(updatedContact);

    const { result } = renderHook(() => useContactStore());

    // Set initial state
    act(() => {
      result.current.contacts = [{
        id: 1,
        name: 'John Doe',
        phone: '(123) 456-7890',
        email: 'john@example.com',
        notes: 'Original contact',
        createdAt: new Date(),
        updatedAt: new Date(),
      }];
    });

    await act(async () => {
      await result.current.updateContact(1, {
        name: 'John Updated',
        email: 'john.updated@example.com',
        notes: 'Updated contact',
      });
    });

    expect(result.current.contacts[0].name).toBe('John Updated');
    expect(result.current.contacts[0].email).toBe('john.updated@example.com');
  });

  it('should delete a contact successfully', async () => {
    mockDatabaseService.deleteContact.mockResolvedValue(true);

    const { result } = renderHook(() => useContactStore());

    // Set initial state
    act(() => {
      result.current.contacts = [
        {
          id: 1,
          name: 'John Doe',
          phone: '(123) 456-7890',
          email: 'john@example.com',
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Jane Smith',
          phone: '(987) 654-3210',
          email: 'jane@example.com',
          notes: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    });

    await act(async () => {
      await result.current.deleteContact(1);
    });

    expect(result.current.contacts).toHaveLength(1);
    expect(result.current.contacts[0].id).toBe(2);
  });

  it('should get contact by id', () => {
    const { result } = renderHook(() => useContactStore());

    const mockContacts = [
      {
        id: 1,
        name: 'John Doe',
        phone: '(123) 456-7890',
        email: 'john@example.com',
        notes: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    act(() => {
      result.current.contacts = mockContacts;
    });

    const contact = result.current.getContactById(1);
    expect(contact).toEqual(mockContacts[0]);

    const nonExistentContact = result.current.getContactById(999);
    expect(nonExistentContact).toBeUndefined();
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useContactStore());

    act(() => {
      result.current.error = 'Test error';
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});