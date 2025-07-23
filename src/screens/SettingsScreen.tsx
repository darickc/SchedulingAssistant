import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainTabScreenProps } from '@/types/navigation';
import { Colors, Spacing, FontSizes } from '@/constants';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = MainTabScreenProps<'Settings'>;

interface SettingItem {
  title: string;
  subtitle?: string;
  icon: string;
  onPress: () => void;
  showArrow?: boolean;
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => {
          // TODO: Implement sign out logic
          console.log('Signing out...');
        }},
      ]
    );
  };

  const settingSections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Organization',
      items: [
        {
          title: 'Leaders',
          subtitle: 'Manage leaders and their calendars',
          icon: 'people',
          onPress: () => navigation.navigate('LeaderManagement'),
          showArrow: true,
        },
        {
          title: 'Appointment Types',
          subtitle: 'Customize appointment types and durations',
          icon: 'time',
          onPress: () => navigation.navigate('AppointmentTypeManagement'),
          showArrow: true,
        },
        {
          title: 'Message Templates',
          subtitle: 'Edit SMS templates',
          icon: 'chatbubble-ellipses',
          onPress: () => navigation.navigate('TemplateManagement'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          title: 'Import Contacts',
          icon: 'download',
          onPress: () => {
            // TODO: Implement import functionality
            Alert.alert('Import', 'Import contacts from CSV');
          },
        },
        {
          title: 'Export Data',
          icon: 'share',
          onPress: () => {
            // TODO: Implement export functionality
            Alert.alert('Export', 'Export all data');
          },
        },
        {
          title: 'Backup & Restore',
          icon: 'cloud-upload',
          onPress: () => {
            // TODO: Implement backup functionality
            Alert.alert('Backup', 'Backup and restore data');
          },
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          title: 'Google Account',
          subtitle: 'Not connected',
          icon: 'logo-google',
          onPress: () => {
            // TODO: Implement Google sign-in
            Alert.alert('Google Sign-In', 'Connect your Google account');
          },
          showArrow: true,
        },
        {
          title: 'Sign Out',
          icon: 'log-out',
          onPress: handleSignOut,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          title: 'Version',
          subtitle: '1.0.0',
          icon: 'information-circle',
          onPress: () => {},
        },
        {
          title: 'Privacy Policy',
          icon: 'shield-checkmark',
          onPress: () => {
            // TODO: Open privacy policy
            Alert.alert('Privacy Policy', 'View privacy policy');
          },
          showArrow: true,
        },
        {
          title: 'Terms of Service',
          icon: 'document-text',
          onPress: () => {
            // TODO: Open terms of service
            Alert.alert('Terms of Service', 'View terms of service');
          },
          showArrow: true,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.title}
      style={styles.settingItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingIconContainer}>
        <Icon name={item.icon} size={24} color={Colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{item.title}</Text>
        {item.subtitle && (
          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
        )}
      </View>
      {item.showArrow && (
        <Icon name="chevron-forward" size={20} color={Colors.gray} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>
        
        {settingSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    marginHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

export default SettingsScreen;