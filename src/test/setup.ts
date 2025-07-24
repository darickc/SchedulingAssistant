// extend-expect is built into @testing-library/react-native v12.4+
// import '@testing-library/react-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn(),
    _db: {
      exec: jest.fn(),
      transaction: jest.fn(),
    },
  })),
}));

// Mock expo-sms
jest.mock('expo-sms', () => ({
  sendSMSAsync: jest.fn(() => Promise.resolve({ result: 'sent' })),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock zustand stores
jest.mock('../stores/contactStore', () => ({
  useContactStore: jest.fn(() => ({
    contacts: [],
    loading: false,
    error: null,
    loadContacts: jest.fn(),
    createContact: jest.fn(),
    updateContact: jest.fn(),
    deleteContact: jest.fn(),
  })),
}));

jest.mock('../stores/appointmentStore', () => ({
  useAppointmentStore: jest.fn(() => ({
    appointmentsWithDetails: [],
    loading: false,
    error: null,
    loadAppointments: jest.fn(),
    createAppointment: jest.fn(),
    updateAppointment: jest.fn(),
    deleteAppointment: jest.fn(),
    getAppointmentsForDate: jest.fn(() => []),
    getUpcomingAppointments: jest.fn(() => []),
  })),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

// Mock AuthContext
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    isSignedIn: false,
    user: null,
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Global test timeout
jest.setTimeout(10000);