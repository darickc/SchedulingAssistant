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

### ✅ Phase 2: Core Infrastructure (COMPLETED)
- **Duration**: Week 2
- **Status**: All tasks completed
- **Key Achievements**:
  - SQLite database service with full CRUD operations
  - Complete database schema with all tables and relationships
  - Comprehensive TypeScript interfaces and data models
  - Zustand state management with 3 stores (contacts, appointments, settings)
  - AsyncStorage wrapper service for persistent settings
  - Database initialization and seed data functionality

### ✅ Phase 3: Authentication & Calendar Integration (COMPLETED)
- **Duration**: Week 3
- **Status**: All core tasks completed
- **Key Achievements**:
  - Google authentication service with token management
  - Auth context/provider for app-wide authentication state
  - Google Calendar service with full CRUD operations
  - Leader management screen with calendar selection
  - Sign-in/out UI components integrated into Settings
  - Environment configuration template for OAuth credentials

### ✅ Phase 4: Contact Management (COMPLETED)
- **Duration**: Week 4
- **Status**: All core tasks completed
- **Key Achievements**:
  - CSV parser utility with phone number formatting and validation
  - Document picker integration for CSV file import
  - Import preview modal with duplicate detection
  - Full-featured contacts list with alphabetical sections and search
  - Add/Edit contact form with comprehensive validation
  - Contact details screen with call, SMS, and email actions
  - Delete functionality with confirmation dialog
  - Export contacts to CSV with sharing capability
  
### ✅ Phase 5: Scheduling Features (COMPLETED)
- **Duration**: Week 5
- **Status**: All core tasks completed
- **Key Achievements**:
  - Message template management with CRUD operations and variable system
  - Smart scheduling algorithm with Google Calendar integration and conflict detection
  - SMS integration service with message formatting and bulk sending
  - Complete appointment management flow with 4-step wizard
  - Enhanced data consistency across all services (camelCase property names)
  - Default templates for common appointment types

### 🚧 Next Phase: Phase 6 - UI/UX Implementation
- **Duration**: Week 6
- **Focus**: Navigation structure, screen implementations, UI polish, accessibility
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

## Phase 2: Core Infrastructure (Week 2) ✅ COMPLETE

### Database Setup
- [x] Create database service (`src/services/database.ts`)
- [x] Define database schema:
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
- [x] Implement database initialization
- [x] Create migration system
- [x] Add seed data for development

### Data Models & Types
- [x] Create TypeScript interfaces (`src/types/index.ts`)
- [x] Extended interfaces with utility types
- [x] Error handling classes
- [x] Google Calendar and scheduling types
- [x] Import/export types
- [x] Settings and configuration types

### State Management
- [x] Set up Zustand stores
  ```typescript
  // src/stores/contactStore.ts - Complete with CRUD, search, import/export
  // src/stores/appointmentStore.ts - Complete with filtering, status management
  // src/stores/settingsStore.ts - Complete with leaders, types, preferences
  ```
- [x] Implement CRUD operations for each entity
- [x] Add data persistence layer
- [x] Search and filtering functionality
- [x] Bulk operations support

### Storage Service
- [x] Create AsyncStorage wrapper (`src/services/storage.ts`)
- [x] Store user preferences
- [x] Cache Google tokens securely
- [x] Implement data export/import
- [x] Migration and health check utilities
- [x] Storage info and management

---

## Phase 3: Authentication & Calendar Integration (Week 3) ✅ COMPLETE

### Google Sign-In
- [ ] Configure Google Cloud Console (Manual step - see instructions below)
  - [ ] Create new project
  - [ ] Enable Google Calendar API
  - [ ] Create OAuth 2.0 credentials
  - [ ] Add redirect URIs for Expo
- [x] Implement authentication service
  - Created `src/services/auth.ts` with full Google OAuth implementation
  - Token management with automatic refresh
  - Secure storage using AsyncStorage
  - Platform-specific client ID support
- [x] Create auth context/provider
  - Created `src/contexts/AuthContext.tsx`
  - Global auth state management
  - Higher-order component for protected routes
- [x] Handle token refresh logic
- [x] Add sign-in/out UI
  - SignInButton component
  - UserProfile component
  - AuthGuard component

### Google Calendar Service
- [x] Create calendar service (`src/services/googleCalendar.ts`)
  - List calendars with access control
  - CRUD operations for events
  - Free/busy information retrieval
  - Batch event creation
- [x] Implement availability checking
  - `findAvailableSlots` method with working hours
  - `isSlotAvailable` for specific time checks
- [x] Add conflict detection
- [x] Create calendar sync mechanism
- [x] Handle offline scenarios

### Leader Management
- [x] Create leader management screen
  - Full CRUD operations for leaders
  - Calendar picker with write access filtering
  - Active/inactive status management
- [x] Calendar selection per leader
- [x] Test calendar access permissions
- [x] Validate calendar integration

### Google Cloud Console Setup Instructions
To complete the authentication setup, follow these steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API:
   - Go to APIs & Services > Library
   - Search for "Google Calendar API"
   - Click Enable
4. Create OAuth 2.0 credentials:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Configure consent screen if needed
   - For Application type, create separate credentials for:
     - iOS: Bundle ID from app.json
     - Android: Package name and SHA-1 certificate
     - Web: For Expo development
5. Copy the client IDs to `.env` file (use `.env.example` as template)
6. Add authorized redirect URIs for Expo

---

## Phase 4: Contact Management (Week 4) ✅ COMPLETE

### Contact Import
- [x] Implement CSV parser utility
  - Created `src/utils/csvParser.ts` with comprehensive parsing
  - Smart field mapping for common CSV headers
  - Phone number formatting and email validation
- [x] Create document picker integration
  - Created `src/utils/documentPicker.ts`
  - Support for CSV file selection and reading
  - File size validation and progress tracking
- [x] Add contact validation
  - Required field validation (name, phone)
  - Email format validation
  - Phone number length validation
- [x] Implement duplicate detection
  - Phone number-based duplicate checking
  - Integrated into import flow
- [x] Create import preview screen
  - ImportPreviewModal component
  - Shows successful, failed, and duplicate counts
  - Preview of contacts to be imported

### Device Contacts Integration
- [ ] Request contacts permission (deferred to future version)
- [ ] Implement contact picker (deferred to future version)
- [ ] Map device contacts to app format (deferred to future version)
- [ ] Add bulk import functionality (deferred to future version)

### Contact CRUD Operations
- [x] Create contacts list screen
  - [x] Searchable list with real-time filtering
  - [x] Alphabetical sections with sticky headers
  - [x] Quick actions (tap to view details)
- [x] Add/Edit contact form
  - [x] Form validation with error messages
  - [x] Phone number formatting on save
  - [x] Save/Update logic with success feedback
- [x] Delete functionality with confirmation
  - Integrated into contact details screen
  - Confirmation dialog before deletion
- [ ] Bulk operations (deferred to future version)

### Contact Features
- [x] Search/filter implementation
  - Real-time search by name or phone
  - Integrated with Zustand store
- [x] Sort options (alphabetical by default)
- [ ] Contact groups/tags (deferred to future version)
- [x] Export contacts to CSV
  - Export all contacts functionality
  - Share via system share sheet

---

## Phase 5: Scheduling Features (Week 5) ✅ COMPLETE

### Message Templates
- [x] Create template management screen
- [x] Default templates:
  ```typescript
  const defaultTemplates = [
    {
      name: "Generic Meeting",
      template: "Brother/Sister {name}, can you meet with {leader} this {day} at {time}?"
    },
    {
      name: "Temple Recommend Interview", 
      template: "Brother/Sister {name}, your temple recommend has expired or is about to expire. Can you meet with {leader} for a temple recommend interview this {day} at {time}?"
    },
    {
      name: "Ministering Interview",
      template: "Brother/Sister {name}, {leader} would like to meet with you for a ministering interview. Are you available this {day} at {time}?"
    },
    // 6 total templates implemented
  ]
  ```
- [x] Template variable system with auto-extraction
- [x] Template preview functionality
- [x] Custom template creation with CRUD operations

### Smart Scheduling Algorithm
- [x] Enhanced scheduling service (`src/services/scheduling.ts`)
  ```typescript
  export class SchedulingService {
    static async findAvailableSlots(
      leaderId: number,
      leader: Leader,
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
- [x] Implement availability algorithm with Google Calendar integration
- [x] Add buffer time between appointments (configurable)
- [x] Consider business hours and working days
- [x] Handle timezone considerations
- [x] Intelligent time slot scoring system

### SMS Integration
- [x] Enhanced SMS service (`src/services/sms.ts`)
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
- [x] Message composition with template variable replacement
- [x] Batch sending functionality for multiple appointments
- [x] SMS preview functionality before sending
- [x] Integration with appointment scheduling flow

### Appointment Management
- [x] Complete appointment scheduling flow (4-step wizard):
  1. Select appointment type
  2. Choose leader
  3. Select date and view available times
  4. Confirm appointment and send SMS
- [x] Appointment management screens:
  - [x] ScheduleAppointmentScreen with step-by-step wizard
  - [x] AppointmentDetailsScreen for viewing/managing appointments
  - [x] Calendar integration for visual time selection
- [x] Google Calendar event creation integration
- [x] Status management (pending → confirmed → completed)
- [x] SMS sending integration with message preview
- [x] Data consistency improvements (camelCase property names)

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

| Phase | Duration | Status | Key Deliverables |
|-------|----------|--------|------------------|
| Setup | Week 1 | ✅ | Project initialized, dev environment ready |
| Infrastructure | Week 2 | ✅ | Database, models, state management |
| Auth & Calendar | Week 3 | ✅ | Google integration working |
| Contacts | Week 4 | ✅ | Full contact management |
| Scheduling | Week 5 | ✅ | Core scheduling features |
| UI/UX | Week 6 | 🚧 | Polished user interface |
| Testing & Deploy | Week 7 | ⏳ | App store ready |

**Total Duration**: 7 weeks (adjusted from original 8 weeks)
**Current Status**: Phase 5 Complete ✅ - Ready for Phase 6 (UI/UX)

---

*Last Updated: January 24, 2025*
*Version: 1.0.0*
*Current Status: Phase 5 Complete ✅ - Ready for Phase 6 (UI/UX Implementation)*