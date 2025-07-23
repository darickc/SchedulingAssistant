# Scheduling Assistant App - Development Plan

## Project Overview

### Description
A React Native mobile application for scheduling appointments via SMS, with Google Calendar integration and local SQLite storage. The app enables scheduling for multiple leaders (Bishop, counselors) with customizable message templates and automated calendar management.

### Technology Stack
- **Frontend**: React Native with Expo (TypeScript)
- **Database**: SQLite (local storage)
- **Authentication**: Google Sign-In
- **APIs**: Google Calendar API
- **SMS**: Native SMS integration
- **State Management**: Zustand
- **UI Components**: React Native Elements
- **Navigation**: React Navigation

### Core Features
1. Contact management with CSV import
2. Multiple Google Calendar integration
3. SMS messaging with templates
4. Smart scheduling with availability checking
5. Appointment type management
6. Offline-first architecture

### Architecture
```
┌─────────────────────────┐
│   React Native App      │
├─────────────────────────┤
│  Presentation Layer     │
│  - Screens              │
│  - Components           │
├─────────────────────────┤
│  Business Logic Layer   │
│  - Services             │
│  - Utils                │
├─────────────────────────┤
│  Data Layer             │
│  - SQLite Database      │
│  - AsyncStorage         │
└─────────────────────────┘
          │
          ├──> Google Calendar API
          └──> Native SMS
```

---

## 🎯 Current Progress

### ✅ Phase 1: Project Setup (COMPLETED)
- **Duration**: Week 1
- **Status**: All tasks completed
- **Key Achievements**:
  - Expo TypeScript project initialized
  - All dependencies installed and configured
  - Navigation structure implemented with 4 main screens
  - Project folder structure created
  - ESLint/Prettier configured with zero errors
  - Base UI components and screens functional

### 🚧 Next Phase: Phase 2 - Core Infrastructure
- **Duration**: Week 2
- **Focus**: Database setup, data models, and state management
- **Ready to Start**: Yes ✅

---

## Phase 1: Project Setup (Week 1) ✅ COMPLETE

### Environment Setup
- [x] Install Node.js (v18+), npm/yarn
- [x] Install Expo CLI globally
- [ ] Set up iOS Simulator (Mac) / Android Emulator
- [ ] Install VS Code with React Native extensions

### Project Initialization
- [x] Create Expo project with TypeScript template
  ```bash
  npx create-expo-app SchedulingAssistant --template expo-template-blank-typescript
  cd SchedulingAssistant
  ```
- [x] Configure TypeScript strictly
- [x] Set up ESLint and Prettier
- [x] Configure absolute imports

### Core Dependencies
- [x] Install navigation
  ```bash
  npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
  npx expo install react-native-screens react-native-safe-area-context
  ```
- [x] Install UI libraries
  ```bash
  npm install react-native-elements react-native-vector-icons
  npm install react-native-calendars
  ```
- [x] Install Expo SDK packages
  ```bash
  npx expo install expo-sqlite expo-contacts expo-sms expo-document-picker
  npx expo install expo-google-sign-in @react-native-async-storage/async-storage
  ```

### Project Structure
- [x] Create folder structure:
  ```
  src/
  ├── components/
  ├── screens/
  ├── services/
  ├── utils/
  ├── types/
  ├── constants/
  └── navigation/
  ```
- [x] Set up navigation structure
- [x] Create base screen components
- [x] Configure app entry point

---

## Phase 2: Core Infrastructure (Week 2)

### Database Setup
- [ ] Create database service (`src/services/database.ts`)
- [ ] Define database schema:
  ```typescript
  // Contacts table
  CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  // Leaders table  
  CREATE TABLE leaders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    calendar_id TEXT NOT NULL,
    email TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1
  );

  // Appointment types table
  CREATE TABLE appointment_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    template TEXT NOT NULL,
    color TEXT DEFAULT '#007AFF'
  );

  // Appointments table
  CREATE TABLE appointments (
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
  ```
- [ ] Implement database initialization
- [ ] Create migration system
- [ ] Add seed data for development

### Data Models & Types
- [ ] Create TypeScript interfaces (`src/types/index.ts`)
  ```typescript
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
  ```

### State Management
- [ ] Set up Zustand stores
  ```typescript
  // src/stores/contactStore.ts
  // src/stores/appointmentStore.ts
  // src/stores/settingsStore.ts
  ```
- [ ] Implement CRUD operations for each entity
- [ ] Add data persistence layer

### Storage Service
- [ ] Create AsyncStorage wrapper (`src/services/storage.ts`)
- [ ] Store user preferences
- [ ] Cache Google tokens securely
- [ ] Implement data export/import

---

## Phase 3: Authentication & Calendar Integration (Week 3)

### Google Sign-In
- [ ] Configure Google Cloud Console
  - [ ] Create new project
  - [ ] Enable Google Calendar API
  - [ ] Create OAuth 2.0 credentials
  - [ ] Add redirect URIs for Expo
- [ ] Implement authentication service
  ```typescript
  // src/services/auth.ts
  export class AuthService {
    static async signIn(): Promise<GoogleUser>
    static async signOut(): Promise<void>
    static async refreshToken(): Promise<string>
    static async getAccessToken(): Promise<string>
  }
  ```
- [ ] Create auth context/provider
- [ ] Handle token refresh logic
- [ ] Add sign-in/out UI

### Google Calendar Service
- [ ] Create calendar service (`src/services/googleCalendar.ts`)
  ```typescript
  export class CalendarService {
    static async listCalendars(): Promise<Calendar[]>
    static async getEvents(calendarId: string, timeMin: Date, timeMax: Date): Promise<Event[]>
    static async createEvent(calendarId: string, event: EventInput): Promise<Event>
    static async updateEvent(calendarId: string, eventId: string, event: EventInput): Promise<Event>
    static async deleteEvent(calendarId: string, eventId: string): Promise<void>
    static async getFreeBusy(calendarIds: string[], timeMin: Date, timeMax: Date): Promise<FreeBusy>
  }
  ```
- [ ] Implement availability checking
- [ ] Add conflict detection
- [ ] Create calendar sync mechanism
- [ ] Handle offline scenarios

### Leader Management
- [ ] Create leader management screen
- [ ] Calendar selection per leader
- [ ] Test calendar access permissions
- [ ] Validate calendar integration

---

## Phase 4: Contact Management (Week 4)

### Contact Import
- [ ] Implement CSV parser utility
  ```typescript
  // src/utils/csvParser.ts
  export async function parseContactsCSV(uri: string): Promise<Contact[]>
  ```
- [ ] Create document picker integration
- [ ] Add contact validation
- [ ] Implement duplicate detection
- [ ] Create import preview screen

### Device Contacts Integration
- [ ] Request contacts permission
- [ ] Implement contact picker
- [ ] Map device contacts to app format
- [ ] Add bulk import functionality

### Contact CRUD Operations
- [ ] Create contacts list screen
  - [ ] Searchable list
  - [ ] Alphabetical sections
  - [ ] Quick actions (call, text)
- [ ] Add/Edit contact form
  - [ ] Form validation
  - [ ] Phone number formatting
  - [ ] Save/Update logic
- [ ] Delete functionality with confirmation
- [ ] Bulk operations (select multiple)

### Contact Features
- [ ] Search/filter implementation
- [ ] Sort options (name, recent, etc.)
- [ ] Contact groups/tags
- [ ] Export contacts to CSV

---

## Phase 5: Scheduling Features (Week 5-6)

### Message Templates
- [ ] Create template management screen
- [ ] Default templates:
  ```typescript
  const defaultTemplates = [
    {
      name: "Generic Meeting",
      duration: 15,
      template: "Brother/Sister {name}, can you meet with {leader} this {day} at {time}?"
    },
    {
      name: "Temple Recommend Interview",
      duration: 10,
      template: "Brother/Sister {name}, your temple recommend has expired or is about to expire. Can you meet with {leader} for a temple recommend interview this {day} at {time}?"
    },
    // More templates...
  ]
  ```
- [ ] Template variable system
- [ ] Template preview functionality
- [ ] Custom template creation

### Smart Scheduling Algorithm
- [ ] Create scheduling service (`src/services/scheduling.ts`)
  ```typescript
  export class SchedulingService {
    static async findAvailableSlots(
      leaderId: number,
      duration: number,
      dateRange: DateRange
    ): Promise<TimeSlot[]>
    
    static async suggestOptimalTimes(
      contactId: number,
      leaderId: number,
      typeId: number
    ): Promise<TimeSlot[]>
  }
  ```
- [ ] Implement availability algorithm
- [ ] Add buffer time between appointments
- [ ] Consider business hours
- [ ] Handle timezone considerations

### SMS Integration
- [ ] Create SMS service (`src/services/sms.ts`)
  ```typescript
  export class SMSService {
    static async sendSMS(
      phoneNumber: string,
      message: string
    ): Promise<void>
    
    static async sendBulkSMS(
      appointments: Appointment[]
    ): Promise<SendResult[]>
  }
  ```
- [ ] Message composition with templates
- [ ] Batch sending functionality
- [ ] Delivery tracking (where possible)
- [ ] SMS preview before sending

### Appointment Management
- [ ] Create appointment flow
  1. Select contact
  2. Choose appointment type
  3. Select leader
  4. View available times
  5. Confirm and send SMS
- [ ] Appointment list view
  - [ ] Upcoming appointments
  - [ ] Past appointments
  - [ ] Filter by status
- [ ] Appointment details screen
- [ ] Status management (pending → confirmed → completed)
- [ ] Reschedule functionality
- [ ] Cancellation flow

---

## Phase 6: UI/UX Implementation (Week 7)

### Navigation Structure
- [ ] Bottom tab navigation
  - [ ] Home (Dashboard)
  - [ ] Contacts
  - [ ] Schedule
  - [ ] Settings
- [ ] Stack navigators for each tab
- [ ] Modal presentations for forms
- [ ] Deep linking for SMS responses

### Screen Implementations

#### Home Screen
- [ ] Statistics dashboard
  - [ ] Upcoming appointments count
  - [ ] Weekly/monthly view
  - [ ] Quick actions
- [ ] Recent activity feed
- [ ] Quick scheduling button

#### Contacts Screen
- [ ] Searchable contact list
- [ ] Contact details modal
- [ ] Import/export options
- [ ] Batch operations toolbar

#### Schedule Screen
- [ ] Calendar view component
- [ ] List view toggle
- [ ] Filter by leader/type
- [ ] Legend for appointment types

#### Settings Screen
- [ ] Leader management
- [ ] Template management
- [ ] Appointment types
- [ ] App preferences
- [ ] Data backup/restore
- [ ] Sign out option

### UI Polish
- [ ] Loading states for all async operations
- [ ] Error handling with user-friendly messages
- [ ] Empty states with helpful actions
- [ ] Pull-to-refresh where applicable
- [ ] Confirmation dialogs for destructive actions
- [ ] Success feedback (toasts/alerts)

### Accessibility
- [ ] Screen reader support
- [ ] Proper contrast ratios
- [ ] Touch target sizes (44x44 minimum)
- [ ] Keyboard navigation support
- [ ] Dynamic font sizing support

---

## Phase 7: Testing & Deployment (Week 8)

### Testing Strategy

#### Unit Tests
- [ ] Database operations
- [ ] Scheduling algorithm
- [ ] Template variable replacement
- [ ] CSV parsing
- [ ] Date/time utilities

#### Integration Tests
- [ ] Google Calendar API
- [ ] SMS functionality
- [ ] Contact import flows
- [ ] Appointment creation flow

#### Manual Testing Checklist
- [ ] iOS Testing
  - [ ] iPhone SE (small screen)
  - [ ] iPhone 14 (standard)
  - [ ] iPad (tablet)
  - [ ] iOS 15+ compatibility
- [ ] Android Testing
  - [ ] Small screen devices
  - [ ] Standard screen devices
  - [ ] Tablets
  - [ ] Android 6+ compatibility

### Performance Optimization
- [ ] Implement lazy loading for contacts
- [ ] Optimize database queries
- [ ] Add pagination for large lists
- [ ] Image optimization (if applicable)
- [ ] Bundle size optimization

### Build Configuration

#### iOS Build
- [ ] Configure app.json for iOS
- [ ] Set up Apple Developer account
- [ ] Create App ID and provisioning profiles
- [ ] Configure push notification certificates
- [ ] Build with EAS Build
  ```bash
  eas build --platform ios
  ```

#### Android Build
- [ ] Configure app.json for Android
- [ ] Set up Google Play Console
- [ ] Generate upload key
- [ ] Configure app signing
- [ ] Build with EAS Build
  ```bash
  eas build --platform android
  ```

### App Store Preparation

#### Common Assets
- [ ] App icon (1024x1024)
- [ ] Screenshots for both platforms
- [ ] App description
- [ ] Keywords/categories
- [ ] Privacy policy
- [ ] Terms of service

#### iOS App Store
- [ ] Create app in App Store Connect
- [ ] Upload build via EAS Submit
- [ ] Fill in app information
- [ ] Submit for review

#### Google Play Store
- [ ] Create app in Play Console
- [ ] Upload APK/AAB via EAS Submit
- [ ] Complete store listing
- [ ] Submit for review

### Post-Launch
- [ ] Monitor crash reports
- [ ] Gather user feedback
- [ ] Plan update cycle
- [ ] Set up analytics (optional)

---

## Future Enhancements (Post-Launch)

### Version 2.0 Ideas
- [ ] Push notifications for reminders
- [ ] Recurring appointments
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Calendar widget
- [ ] Backup to cloud (Google Drive/iCloud)
- [ ] Web companion app
- [ ] Analytics dashboard
- [ ] Automated follow-ups
- [ ] Integration with other calendar services

### Technical Debt
- [ ] Refactor large components
- [ ] Improve error handling
- [ ] Add comprehensive logging
- [ ] Performance monitoring
- [ ] Security audit
- [ ] Accessibility audit

---

## Resources & References

### Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [Google Calendar API](https://developers.google.com/calendar)
- [React Navigation](https://reactnavigation.org/)

### Key Libraries
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [expo-sms](https://docs.expo.dev/versions/latest/sdk/sms/)
- [expo-google-sign-in](https://docs.expo.dev/versions/latest/sdk/google-sign-in/)
- [react-native-calendars](https://github.com/wix/react-native-calendars)

### Development Tools
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Flipper](https://fbflipper.com/)
- [Expo Dev Tools](https://docs.expo.dev/workflow/debugging/)

---

## Notes

### Design Decisions
- **SQLite over Realm**: Simpler, no sync needed, smaller bundle
- **Expo over React Native CLI**: Faster development, easier deployment
- **Local storage only**: Privacy, no server costs, offline-first
- **Google Calendar direct**: No backend needed, real-time updates

### Known Limitations
- Cannot receive SMS responses automatically
- Requires manual confirmation of appointments
- Limited to Google Calendar (for now)
- No web version (mobile only)

### Security Considerations
- Google tokens stored securely in Keychain/Keystore
- No sensitive data in AsyncStorage
- SQLite database encrypted on device
- No data transmission to external servers

---

## Project Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Setup | Week 1 | Project initialized, dev environment ready |
| Infrastructure | Week 2 | Database, models, state management |
| Auth & Calendar | Week 3 | Google integration working |
| Contacts | Week 4 | Full contact management |
| Scheduling | Weeks 5-6 | Core scheduling features |
| UI/UX | Week 7 | Polished user interface |
| Testing & Deploy | Week 8 | App store ready |

**Total Duration**: 8 weeks (2 months)

---

*Last Updated: January 23, 2025*
*Version: 1.0.0*
*Current Status: Phase 1 Complete ✅ - Ready for Phase 2*