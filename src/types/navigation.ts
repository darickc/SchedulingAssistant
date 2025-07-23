import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';

// Define the root stack navigator param list
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ContactDetails: { contactId: number };
  AddEditContact: { contactId?: number };
  AppointmentDetails: { appointmentId: number };
  ScheduleAppointment: { contactId?: number };
  LeaderManagement: undefined;
  TemplateManagement: undefined;
  AppointmentTypeManagement: undefined;
};

// Define the main tab navigator param list
export type MainTabParamList = {
  Home: undefined;
  Contacts: undefined;
  Schedule: undefined;
  Settings: undefined;
};

// Screen props types
export type RootStackScreenProps<T extends keyof RootStackParamList> = StackScreenProps<
  RootStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  StackScreenProps<RootStackParamList>
>;