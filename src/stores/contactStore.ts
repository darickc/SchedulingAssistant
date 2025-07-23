import { create } from 'zustand';
import { Contact, CreateContactInput, UpdateContactInput, ContactImportResult } from '../types';
import { DatabaseService } from '../services/database';

interface ContactState {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filteredContacts: Contact[];
}

interface ContactActions {
  // Data operations
  loadContacts: () => Promise<void>;
  createContact: (contact: CreateContactInput) => Promise<Contact>;
  updateContact: (id: number, updates: UpdateContactInput) => Promise<Contact>;
  deleteContact: (id: number) => Promise<void>;
  
  // Search and filter
  setSearchQuery: (query: string) => void;
  searchContacts: (query: string) => Promise<Contact[]>;
  
  // Bulk operations
  importContacts: (contacts: CreateContactInput[]) => Promise<ContactImportResult>;
  exportContacts: () => Contact[];
  
  // Utility
  getContactById: (id: number) => Contact | undefined;
  clearError: () => void;
  reset: () => void;
}

type ContactStore = ContactState & ContactActions;

const initialState: ContactState = {
  contacts: [],
  loading: false,
  error: null,
  searchQuery: '',
  filteredContacts: [],
};

export const useContactStore = create<ContactStore>((set, get) => ({
  ...initialState,

  // Data operations
  loadContacts: async () => {
    set({ loading: true, error: null });
    try {
      const contacts = await DatabaseService.getAllContacts();
      set({ 
        contacts, 
        filteredContacts: contacts, 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load contacts',
        loading: false 
      });
    }
  },

  createContact: async (contactInput: CreateContactInput) => {
    set({ loading: true, error: null });
    try {
      const newContact = await DatabaseService.createContact(contactInput);
      const { contacts } = get();
      const updatedContacts = [...contacts, newContact].sort((a, b) => a.name.localeCompare(b.name));
      
      set({ 
        contacts: updatedContacts,
        filteredContacts: get().searchQuery ? 
          updatedContacts.filter(contact => 
            contact.name.toLowerCase().includes(get().searchQuery.toLowerCase()) ||
            contact.phone.includes(get().searchQuery)
          ) : updatedContacts,
        loading: false 
      });
      
      return newContact;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create contact',
        loading: false 
      });
      throw error;
    }
  },

  updateContact: async (id: number, updates: UpdateContactInput) => {
    set({ loading: true, error: null });
    try {
      const updatedContact = await DatabaseService.updateContact(id, updates);
      if (!updatedContact) {
        throw new Error('Contact not found');
      }
      
      const { contacts } = get();
      const updatedContacts = contacts.map(contact => 
        contact.id === id ? updatedContact : contact
      ).sort((a, b) => a.name.localeCompare(b.name));
      
      set({ 
        contacts: updatedContacts,
        filteredContacts: get().searchQuery ? 
          updatedContacts.filter(contact => 
            contact.name.toLowerCase().includes(get().searchQuery.toLowerCase()) ||
            contact.phone.includes(get().searchQuery)
          ) : updatedContacts,
        loading: false 
      });
      
      return updatedContact;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update contact',
        loading: false 
      });
      throw error;
    }
  },

  deleteContact: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const success = await DatabaseService.deleteContact(id);
      if (!success) {
        throw new Error('Contact not found');
      }
      
      const { contacts } = get();
      const updatedContacts = contacts.filter(contact => contact.id !== id);
      
      set({ 
        contacts: updatedContacts,
        filteredContacts: get().searchQuery ? 
          updatedContacts.filter(contact => 
            contact.name.toLowerCase().includes(get().searchQuery.toLowerCase()) ||
            contact.phone.includes(get().searchQuery)
          ) : updatedContacts,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete contact',
        loading: false 
      });
      throw error;
    }
  },

  // Search and filter
  setSearchQuery: (query: string) => {
    const { contacts } = get();
    const filteredContacts = query.trim() === '' ? contacts : 
      contacts.filter(contact => 
        contact.name.toLowerCase().includes(query.toLowerCase()) ||
        contact.phone.includes(query) ||
        (contact.email && contact.email.toLowerCase().includes(query.toLowerCase()))
      );
    
    set({ searchQuery: query, filteredContacts });
  },

  searchContacts: async (query: string) => {
    set({ loading: true, error: null });
    try {
      const contacts = await DatabaseService.searchContacts(query);
      set({ loading: false });
      return contacts;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to search contacts',
        loading: false 
      });
      return [];
    }
  },

  // Bulk operations
  importContacts: async (contactInputs: CreateContactInput[]) => {
    set({ loading: true, error: null });
    
    const result: ContactImportResult = {
      successful: [],
      failed: [],
      duplicates: []
    };

    try {
      const existingContacts = await DatabaseService.getAllContacts();
      
      for (let i = 0; i < contactInputs.length; i++) {
        const contactInput = contactInputs[i];
        
        try {
          // Check for duplicates (by phone number)
          const existingContact = existingContacts.find(c => c.phone === contactInput.phone);
          if (existingContact) {
            result.duplicates.push({
              row: i + 1,
              data: contactInput,
              existingContact
            });
            continue;
          }
          
          // Validate required fields
          if (!contactInput.name || !contactInput.phone) {
            result.failed.push({
              row: i + 1,
              data: contactInput,
              error: 'Name and phone are required'
            });
            continue;
          }
          
          const newContact = await DatabaseService.createContact(contactInput);
          result.successful.push(newContact);
          
        } catch (error) {
          result.failed.push({
            row: i + 1,
            data: contactInput,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Refresh contacts list
      await get().loadContacts();
      
      set({ loading: false });
      return result;
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to import contacts',
        loading: false 
      });
      throw error;
    }
  },

  exportContacts: () => {
    return get().contacts;
  },

  // Utility
  getContactById: (id: number) => {
    return get().contacts.find(contact => contact.id === id);
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  }
}));