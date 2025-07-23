import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';

import { RootStackParamList, MainTabParamList } from '@/types/navigation';
import { Colors } from '@/constants';

// Screens
import HomeScreen from '@/screens/HomeScreen';
import ContactsScreen from '@/screens/ContactsScreen';
import ScheduleScreen from '@/screens/ScheduleScreen';
import SettingsScreen from '@/screens/SettingsScreen';

// Stack screens
import ContactDetailsScreen from '@/screens/ContactDetailsScreen';
import AddEditContactScreen from '@/screens/AddEditContactScreen';
import ScheduleAppointmentScreen from '@/screens/ScheduleAppointmentScreen';

// Placeholder screens (to be implemented)
const AppointmentDetailsScreen = () => null;
const LeaderManagementScreen = () => null;
const TemplateManagementScreen = () => null;
const AppointmentTypeManagementScreen = () => null;

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Contacts':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Schedule':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 0.5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.surface,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0.5,
            borderBottomColor: Colors.border,
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ContactDetails"
          component={ContactDetailsScreen}
          options={{ title: 'Contact Details' }}
        />
        <Stack.Screen
          name="AddEditContact"
          component={AddEditContactScreen}
          options={({ route }) => ({
            title: route.params?.contactId ? 'Edit Contact' : 'Add Contact',
          })}
        />
        <Stack.Screen
          name="AppointmentDetails"
          component={AppointmentDetailsScreen}
          options={{ title: 'Appointment Details' }}
        />
        <Stack.Screen
          name="ScheduleAppointment"
          component={ScheduleAppointmentScreen}
          options={{ title: 'Schedule Appointment' }}
        />
        <Stack.Screen
          name="LeaderManagement"
          component={LeaderManagementScreen}
          options={{ title: 'Leaders' }}
        />
        <Stack.Screen
          name="TemplateManagement"
          component={TemplateManagementScreen}
          options={{ title: 'Message Templates' }}
        />
        <Stack.Screen
          name="AppointmentTypeManagement"
          component={AppointmentTypeManagementScreen}
          options={{ title: 'Appointment Types' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;