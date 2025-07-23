import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { MainTabScreenProps } from '@/types/navigation';
import { Appointment } from '@/types';
import { Colors, Spacing, FontSizes } from '@/constants';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = MainTabScreenProps<'Schedule'>;

const ScheduleScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCalendarView, setShowCalendarView] = useState(true);
  const [appointments] = useState<Appointment[]>([]);

  const handleScheduleNew = () => {
    navigation.navigate('ScheduleAppointment', {});
  };

  const handleAppointmentPress = (appointmentId: number) => {
    navigation.navigate('AppointmentDetails', { appointmentId });
  };

  const renderAppointment = ({ item }: { item: Appointment }) => (
    <TouchableOpacity
      style={styles.appointmentItem}
      onPress={() => handleAppointmentPress(item.id)}
    >
      <View style={styles.appointmentTime}>
        <Text style={styles.timeText}>
          {new Date(item.scheduledTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <View style={styles.appointmentInfo}>
        <Text style={styles.appointmentTitle}>Contact Name</Text>
        <Text style={styles.appointmentSubtitle}>Type • Leader Name</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'cancelled':
        return Colors.danger;
      case 'completed':
        return Colors.info;
      default:
        return Colors.gray;
    }
  };

  const markedDates = appointments.reduce((acc, apt) => {
    const date = new Date(apt.scheduledTime).toISOString().split('T')[0];
    acc[date] = { marked: true, dotColor: Colors.primary };
    return acc;
  }, {} as Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }>);

  markedDates[selectedDate] = {
    ...markedDates[selectedDate],
    selected: true,
    selectedColor: Colors.primary,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Schedule</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowCalendarView(!showCalendarView)}>
            <Icon
              name={showCalendarView ? 'list' : 'calendar'}
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleScheduleNew} style={styles.addButton}>
            <Icon name="add-circle" size={32} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {showCalendarView && (
        <Calendar
          markedDates={markedDates}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          theme={{
            backgroundColor: Colors.background,
            calendarBackground: Colors.surface,
            selectedDayBackgroundColor: Colors.primary,
            selectedDayTextColor: Colors.white,
            todayTextColor: Colors.primary,
            dayTextColor: Colors.text,
            textDisabledColor: Colors.gray,
            monthTextColor: Colors.text,
            arrowColor: Colors.primary,
          }}
          style={styles.calendar}
        />
      )}

      <View style={styles.appointmentsList}>
        <Text style={styles.dateHeader}>
          {new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        
        {appointments.filter(apt => 
          new Date(apt.scheduledTime).toISOString().split('T')[0] === selectedDate
        ).length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="calendar-outline" size={48} color={Colors.gray} />
            <Text style={styles.emptyStateText}>No appointments scheduled</Text>
          </View>
        ) : (
          <FlatList
            data={appointments.filter(apt => 
              new Date(apt.scheduledTime).toISOString().split('T')[0] === selectedDate
            )}
            renderItem={renderAppointment}
            keyExtractor={(item) => item.id.toString()}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  addButton: {
    marginLeft: Spacing.sm,
  },
  calendar: {
    marginHorizontal: Spacing.md,
    borderRadius: 10,
    elevation: 3,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appointmentsList: {
    flex: 1,
    padding: Spacing.md,
  },
  dateHeader: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 10,
  },
  appointmentTime: {
    marginRight: Spacing.md,
  },
  timeText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  appointmentSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: FontSizes.xs,
    color: Colors.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  separator: {
    height: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyStateText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});

export default ScheduleScreen;