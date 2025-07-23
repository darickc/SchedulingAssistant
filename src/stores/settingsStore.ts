import { create } from 'zustand';
import { 
  AppSettings, 
  SchedulingPreferences, 
  MessageTemplate,
  Leader,
  AppointmentType 
} from '../types';
import { DatabaseService } from '../services/database';

interface SettingsState {
  settings: AppSettings;
  leaders: Leader[];
  appointmentTypes: AppointmentType[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

interface SettingsActions {
  // Initialization
  initialize: () => Promise<void>;
  
  // Settings management
  updateSchedulingPreferences: (preferences: Partial<SchedulingPreferences>) => Promise<void>;
  updateGoogleCalendarSettings: (settings: Partial<AppSettings['googleCalendarSettings']>) => Promise<void>;
  updateSMSSettings: (settings: Partial<AppSettings['smsSettings']>) => Promise<void>;
  setDefaultLeader: (leaderId?: number) => Promise<void>;
  setDefaultAppointmentType: (typeId?: number) => Promise<void>;
  
  // Leaders management
  loadLeaders: () => Promise<void>;
  createLeader: (leader: Omit<Leader, 'id'>) => Promise<Leader>;
  updateLeader: (id: number, updates: Partial<Omit<Leader, 'id'>>) => Promise<Leader>;
  deleteLeader: (id: number) => Promise<void>;
  toggleLeaderActive: (id: number) => Promise<void>;
  
  // Appointment types management
  loadAppointmentTypes: () => Promise<void>;
  createAppointmentType: (type: Omit<AppointmentType, 'id'>) => Promise<AppointmentType>;
  updateAppointmentType: (id: number, updates: Partial<Omit<AppointmentType, 'id'>>) => Promise<AppointmentType>;
  deleteAppointmentType: (id: number) => Promise<void>;
  
  // Message templates
  updateMessageTemplates: (templates: MessageTemplate[]) => Promise<void>;
  addMessageTemplate: (template: MessageTemplate) => Promise<void>;
  removeMessageTemplate: (appointmentType: string) => Promise<void>;
  
  // Utility
  getLeaderById: (id: number) => Leader | undefined;
  getAppointmentTypeById: (id: number) => AppointmentType | undefined;
  getActiveLeaders: () => Leader[];
  clearError: () => void;
  reset: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const defaultSchedulingPreferences: SchedulingPreferences = {
  workingHours: {
    start: '09:00',
    end: '17:00'
  },
  workingDays: [1, 2, 3, 4, 5], // Monday to Friday
  bufferMinutes: 15,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
};

const defaultMessageTemplates: MessageTemplate[] = [
  {
    appointmentType: 'Generic Meeting',
    template: 'Brother/Sister {name}, can you meet with {leader} this {day} at {time}?',
    variables: ['name', 'leader', 'day', 'time']
  },
  {
    appointmentType: 'Temple Recommend Interview',
    template: 'Brother/Sister {name}, your temple recommend has expired or is about to expire. Can you meet with {leader} for a temple recommend interview this {day} at {time}?',
    variables: ['name', 'leader', 'day', 'time']
  },
  {
    appointmentType: 'Calling Interview',
    template: 'Brother/Sister {name}, can you meet with {leader} this {day} at {time} to discuss a calling opportunity?',
    variables: ['name', 'leader', 'day', 'time']
  }
];

const defaultSettings: AppSettings = {
  schedulingPreferences: defaultSchedulingPreferences,
  messageTemplates: defaultMessageTemplates,
  googleCalendarSettings: {
    syncEnabled: false,
    createReminders: true
  },
  smsSettings: {
    includeLocation: false,
    sendConfirmationRequest: true,
    reminderHours: 24
  }
};

const initialState: SettingsState = {
  settings: defaultSettings,
  leaders: [],
  appointmentTypes: [],
  loading: false,
  error: null,
  initialized: false,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...initialState,

  // Initialization
  initialize: async () => {
    if (get().initialized) return;
    
    set({ loading: true, error: null });
    try {
      // Initialize database
      await DatabaseService.initialize();
      
      // Seed default data if needed
      await DatabaseService.seedDefaultData();
      
      // Load leaders and appointment types
      await Promise.all([
        get().loadLeaders(),
        get().loadAppointmentTypes()
      ]);
      
      // Load settings from storage (implement this when storage service is ready)
      // const savedSettings = await StorageService.getSettings();
      // if (savedSettings) {
      //   set({ settings: { ...defaultSettings, ...savedSettings } });
      // }
      
      set({ initialized: true, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to initialize settings',
        loading: false 
      });
    }
  },

  // Settings management
  updateSchedulingPreferences: async (preferences: Partial<SchedulingPreferences>) => {
    const { settings } = get();
    const updatedSettings = {
      ...settings,
      schedulingPreferences: {
        ...settings.schedulingPreferences,
        ...preferences
      }
    };
    
    set({ settings: updatedSettings });
    
    // Save to storage (implement when storage service is ready)
    // await StorageService.saveSettings(updatedSettings);
  },

  updateGoogleCalendarSettings: async (calendarSettings: Partial<AppSettings['googleCalendarSettings']>) => {
    const { settings } = get();
    const updatedSettings = {
      ...settings,
      googleCalendarSettings: {
        ...settings.googleCalendarSettings,
        ...calendarSettings
      }
    };
    
    set({ settings: updatedSettings });
    
    // Save to storage
    // await StorageService.saveSettings(updatedSettings);
  },

  updateSMSSettings: async (smsSettings: Partial<AppSettings['smsSettings']>) => {
    const { settings } = get();
    const updatedSettings = {
      ...settings,
      smsSettings: {
        ...settings.smsSettings,
        ...smsSettings
      }
    };
    
    set({ settings: updatedSettings });
    
    // Save to storage
    // await StorageService.saveSettings(updatedSettings);
  },

  setDefaultLeader: async (leaderId?: number) => {
    const { settings } = get();
    const updatedSettings = {
      ...settings,
      defaultLeaderId: leaderId
    };
    
    set({ settings: updatedSettings });
    
    // Save to storage
    // await StorageService.saveSettings(updatedSettings);
  },

  setDefaultAppointmentType: async (typeId?: number) => {
    const { settings } = get();
    const updatedSettings = {
      ...settings,
      defaultAppointmentTypeId: typeId
    };
    
    set({ settings: updatedSettings });
    
    // Save to storage
    // await StorageService.saveSettings(updatedSettings);
  },

  // Leaders management
  loadLeaders: async () => {
    try {
      const leaders = await DatabaseService.getAllLeaders();
      set({ leaders });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load leaders'
      });
    }
  },

  createLeader: async (leaderInput: Omit<Leader, 'id'>) => {
    set({ loading: true, error: null });
    try {
      const newLeader = await DatabaseService.createLeader(leaderInput);
      const { leaders } = get();
      
      set({ 
        leaders: [...leaders, newLeader].sort((a, b) => a.name.localeCompare(b.name)),
        loading: false 
      });
      
      return newLeader;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create leader',
        loading: false 
      });
      throw error;
    }
  },

  updateLeader: async (id: number, updates: Partial<Omit<Leader, 'id'>>) => {
    set({ loading: true, error: null });
    try {
      // Note: We need to implement updateLeader in DatabaseService
      // For now, we'll get the existing leader and recreate
      const existingLeader = await DatabaseService.getLeaderById(id);
      if (!existingLeader) {
        throw new Error('Leader not found');
      }

      const updatedLeaderData = {
        ...existingLeader,
        ...updates
      };

      // This is a workaround - in real implementation, use proper update method
      const updatedLeader = updatedLeaderData as Leader;
      
      const { leaders } = get();
      const updatedLeaders = leaders.map(leader => 
        leader.id === id ? updatedLeader : leader
      ).sort((a, b) => a.name.localeCompare(b.name));
      
      set({ 
        leaders: updatedLeaders,
        loading: false 
      });
      
      return updatedLeader;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update leader',
        loading: false 
      });
      throw error;
    }
  },

  deleteLeader: async (id: number) => {
    set({ loading: true, error: null });
    try {
      // Note: Implement deleteLeader in DatabaseService
      // For now, using placeholder logic
      const { leaders } = get();
      const updatedLeaders = leaders.filter(leader => leader.id !== id);
      
      set({ 
        leaders: updatedLeaders,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete leader',
        loading: false 
      });
      throw error;
    }
  },

  toggleLeaderActive: async (id: number) => {
    const leader = get().getLeaderById(id);
    if (!leader) {
      throw new Error('Leader not found');
    }
    
    await get().updateLeader(id, { isActive: !leader.isActive });
  },

  // Appointment types management
  loadAppointmentTypes: async () => {
    try {
      const appointmentTypes = await DatabaseService.getAllAppointmentTypes();
      set({ appointmentTypes });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load appointment types'
      });
    }
  },

  createAppointmentType: async (typeInput: Omit<AppointmentType, 'id'>) => {
    set({ loading: true, error: null });
    try {
      const newType = await DatabaseService.createAppointmentType(typeInput);
      const { appointmentTypes } = get();
      
      set({ 
        appointmentTypes: [...appointmentTypes, newType].sort((a, b) => a.name.localeCompare(b.name)),
        loading: false 
      });
      
      return newType;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create appointment type',
        loading: false 
      });
      throw error;
    }
  },

  updateAppointmentType: async (id: number, updates: Partial<Omit<AppointmentType, 'id'>>) => {
    set({ loading: true, error: null });
    try {
      // Note: Implement updateAppointmentType in DatabaseService
      const { appointmentTypes } = get();
      const existingType = appointmentTypes.find(type => type.id === id);
      if (!existingType) {
        throw new Error('Appointment type not found');
      }

      const updatedType = { ...existingType, ...updates };
      const updatedTypes = appointmentTypes.map(type => 
        type.id === id ? updatedType : type
      ).sort((a, b) => a.name.localeCompare(b.name));
      
      set({ 
        appointmentTypes: updatedTypes,
        loading: false 
      });
      
      return updatedType;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update appointment type',
        loading: false 
      });
      throw error;
    }
  },

  deleteAppointmentType: async (id: number) => {
    set({ loading: true, error: null });
    try {
      // Note: Implement deleteAppointmentType in DatabaseService
      const { appointmentTypes } = get();
      const updatedTypes = appointmentTypes.filter(type => type.id !== id);
      
      set({ 
        appointmentTypes: updatedTypes,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete appointment type',
        loading: false 
      });
      throw error;
    }
  },

  // Message templates
  updateMessageTemplates: async (templates: MessageTemplate[]) => {
    const { settings } = get();
    const updatedSettings = {
      ...settings,
      messageTemplates: templates
    };
    
    set({ settings: updatedSettings });
    
    // Save to storage
    // await StorageService.saveSettings(updatedSettings);
  },

  addMessageTemplate: async (template: MessageTemplate) => {
    const { settings } = get();
    const existingIndex = settings.messageTemplates.findIndex(t => t.appointmentType === template.appointmentType);
    
    let updatedTemplates;
    if (existingIndex >= 0) {
      // Replace existing template
      updatedTemplates = [...settings.messageTemplates];
      updatedTemplates[existingIndex] = template;
    } else {
      // Add new template
      updatedTemplates = [...settings.messageTemplates, template];
    }
    
    await get().updateMessageTemplates(updatedTemplates);
  },

  removeMessageTemplate: async (appointmentType: string) => {
    const { settings } = get();
    const updatedTemplates = settings.messageTemplates.filter(t => t.appointmentType !== appointmentType);
    await get().updateMessageTemplates(updatedTemplates);
  },

  // Utility
  getLeaderById: (id: number) => {
    return get().leaders.find(leader => leader.id === id);
  },

  getAppointmentTypeById: (id: number) => {
    return get().appointmentTypes.find(type => type.id === id);
  },

  getActiveLeaders: () => {
    return get().leaders.filter(leader => leader.isActive);
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  }
}));