import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainTabScreenProps } from '@/types/navigation';
import { Colors, Spacing, FontSizes } from '@/constants';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = MainTabScreenProps<'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const handleQuickSchedule = () => {
    navigation.navigate('ScheduleAppointment', {});
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Scheduling Assistant</Text>
        
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="calendar" size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="calendar-outline" size={24} color={Colors.info} />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="people" size={24} color={Colors.success} />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Contacts</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleQuickSchedule}>
            <Icon name="add-circle" size={32} color={Colors.white} />
            <Text style={styles.quickActionText}>Schedule Appointment</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.emptyState}>
            <Icon name="time-outline" size={48} color={Colors.gray} />
            <Text style={styles.emptyStateText}>No recent activity</Text>
          </View>
        </View>
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
    padding: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  quickActionsContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  quickActionButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  quickActionText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  recentActivityContainer: {
    marginBottom: Spacing.lg,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});

export default HomeScreen;