import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MainTabScreenProps } from '@/types/navigation';
import { Colors, Spacing, FontSizes } from '@/constants';
import { useContactStore } from '@/stores/contactStore';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { AppointmentWithDetails } from '@/types';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = MainTabScreenProps<'Home'>;

interface DashboardStats {
  todayCount: number;
  weekCount: number;
  contactsCount: number;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { contacts, loadContacts } = useContactStore();
  const { 
    appointmentsWithDetails, 
    loading: appointmentsLoading, 
    loadAppointments,
    getAppointmentsForDate,
    getUpcomingAppointments 
  } = useAppointmentStore();
  
  const [stats, setStats] = useState<DashboardStats>({
    todayCount: 0,
    weekCount: 0,
    contactsCount: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<AppointmentWithDetails[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const calculateStats = useCallback(() => {
    const today = new Date();
    const todayAppointments = getAppointmentsForDate(today);
    
    // Calculate week range (current week)
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day; 
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const weekAppointments = appointmentsWithDetails.filter(apt => 
      apt.scheduledTime >= startOfWeek && 
      apt.scheduledTime <= endOfWeek &&
      apt.status !== 'cancelled'
    );

    setStats({
      todayCount: todayAppointments.length,
      weekCount: weekAppointments.length,
      contactsCount: contacts.length
    });

    // Get recent appointments (next 5 upcoming)
    const upcoming = getUpcomingAppointments().slice(0, 5);
    setRecentAppointments(upcoming);
  }, [appointmentsWithDetails, contacts, getAppointmentsForDate, getUpcomingAppointments]);

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        loadContacts(),
        loadAppointments()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }, [loadContacts, loadAppointments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const handleQuickSchedule = () => {
    navigation.navigate('ScheduleAppointment', {});
  };

  const handleViewContacts = () => {
    navigation.navigate('Contacts');
  };

  const handleViewSchedule = () => {
    navigation.navigate('Schedule');
  };

  const formatAppointmentTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const renderRecentActivity = () => {
    if (appointmentsLoading && recentAppointments.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      );
    }

    if (recentAppointments.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="time-outline" size={48} color={Colors.gray} />
          <Text style={styles.emptyStateText}>No upcoming appointments</Text>
          <TouchableOpacity 
            style={styles.emptyActionButton} 
            onPress={handleQuickSchedule}
          >
            <Text style={styles.emptyActionText}>Schedule your first appointment</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        {recentAppointments.map((appointment) => (
          <TouchableOpacity
            key={appointment.id}
            style={styles.activityItem}
            onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: appointment.id })}
          >
            <View style={styles.activityIcon}>
              <Icon name="calendar" size={20} color={Colors.primary} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>
                {appointment.contact.name} - {appointment.appointmentType.name}
              </Text>
              <Text style={styles.activitySubtitle}>
                {appointment.leader.name} • {formatAppointmentTime(appointment.scheduledTime)}
              </Text>
              <View style={[styles.statusBadge, styles[`status${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}`]]}>
                <Text style={styles.statusText}>{appointment.status}</Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color={Colors.gray} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.viewAllButton} onPress={handleViewSchedule}>
          <Text style={styles.viewAllText}>View All Appointments</Text>
          <Icon name="arrow-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <Text style={styles.title}>Scheduling Assistant</Text>
        
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={handleViewSchedule}
            accessibilityRole="button"
            accessibilityLabel={`${stats.todayCount} appointments today. Tap to view schedule.`}
            accessibilityHint="Opens the schedule screen"
          >
            <Icon name="calendar" size={24} color={Colors.primary} />
            <Text style={styles.statNumber}>{stats.todayCount}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={handleViewSchedule}
            accessibilityRole="button"
            accessibilityLabel={`${stats.weekCount} appointments this week. Tap to view schedule.`}
            accessibilityHint="Opens the schedule screen"
          >
            <Icon name="calendar-outline" size={24} color={Colors.info} />
            <Text style={styles.statNumber}>{stats.weekCount}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={handleViewContacts}
            accessibilityRole="button"
            accessibilityLabel={`${stats.contactsCount} contacts. Tap to view contacts.`}
            accessibilityHint="Opens the contacts screen"
          >
            <Icon name="people" size={24} color={Colors.success} />
            <Text style={styles.statNumber}>{stats.contactsCount}</Text>
            <Text style={styles.statLabel}>Contacts</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity 
            style={styles.quickActionButton} 
            onPress={handleQuickSchedule}
            accessibilityRole="button"
            accessibilityLabel="Schedule new appointment"
            accessibilityHint="Opens the appointment scheduling screen"
          >
            <Icon name="add-circle" size={32} color={Colors.white} />
            <Text style={styles.quickActionText}>Schedule Appointment</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          {renderRecentActivity()}
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
    marginBottom: Spacing.md,
  },
  emptyActionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  emptyActionText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  loadingContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  activityItem: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  activitySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusPending: {
    backgroundColor: Colors.warning + '20',
  },
  statusConfirmed: {
    backgroundColor: Colors.success + '20',
  },
  statusCompleted: {
    backgroundColor: Colors.info + '20',
  },
  statusCancelled: {
    backgroundColor: Colors.error + '20',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  viewAllText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
});

export default HomeScreen;