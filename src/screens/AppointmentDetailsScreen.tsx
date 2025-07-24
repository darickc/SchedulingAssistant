import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ListItem } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '@/types/navigation';
import { Colors, FontSizes } from '@/constants';
import { useAppointmentsStore } from '@/stores/appointmentStore';
import { useContactsStore } from '@/stores/contactStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { SMSService } from '@/services/sms';
import { GoogleCalendarService } from '@/services/googleCalendar';
import { AppointmentStatus } from '@/types';

type Props = RootStackScreenProps<'AppointmentDetails'>;

const AppointmentDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { appointmentId } = route.params;
  
  const { appointments, updateAppointment, deleteAppointment } = useAppointmentsStore();
  const { contacts } = useContactsStore();
  const { leaders, appointmentTypes, messageTemplates } = useSettingsStore();
  
  const [loading, setLoading] = useState(false);
  
  const appointment = appointments.find(a => a.id === appointmentId);
  const contact = appointment ? contacts.find(c => c.id === appointment.contactId) : null;
  const leader = appointment ? leaders.find(l => l.id === appointment.leaderId) : null;
  const appointmentType = appointment ? appointmentTypes.find(t => t.id === appointment.typeId) : null;
  
  if (!appointment || !contact || !leader || !appointmentType) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Appointment not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          buttonStyle={styles.backButton}
        />
      </SafeAreaView>
    );
  }

  const appointmentDate = new Date(appointment.scheduled_time);
  const isPast = appointmentDate < new Date();

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return Colors.success;
      case 'completed':
        return Colors.primary;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.warning;
    }
  };

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    setLoading(true);
    try {
      await updateAppointment(appointment.id!, { status: newStatus });
      
      // Update Google Calendar event if needed
      if (appointment.google_event_id && newStatus === 'cancelled') {
        try {
          await GoogleCalendarService.deleteEvent(
            leader.calendar_id,
            appointment.google_event_id
          );
        } catch (error) {
          console.error('Failed to delete calendar event:', error);
        }
      }
      
      Alert.alert('Success', `Appointment ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update appointment status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Appointment',
      'Are you sure you want to delete this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Delete from Google Calendar if exists
              if (appointment.google_event_id) {
                try {
                  await GoogleCalendarService.deleteEvent(
                    leader.calendar_id,
                    appointment.google_event_id
                  );
                } catch (error) {
                  console.error('Failed to delete calendar event:', error);
                }
              }
              
              await deleteAppointment(appointment.id!);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete appointment');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSendReminder = async () => {
    const template = messageTemplates.find(t => 
      t.name.toLowerCase().includes('reminder')
    ) || messageTemplates[0];
    
    if (!template) {
      Alert.alert('Error', 'No message template found');
      return;
    }
    
    try {
      await SMSService.sendAppointmentSMS(
        appointment,
        contact,
        leader,
        appointmentType,
        template
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send SMS');
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${contact.phone}`);
  };

  const handleEmail = () => {
    if (contact.email) {
      Linking.openURL(`mailto:${contact.email}`);
    }
  };

  const handleReschedule = () => {
    navigation.navigate('ScheduleAppointment', { 
      contactId: contact.id!,
      rescheduleAppointmentId: appointment.id 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Card>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
              <Text style={styles.statusText}>{appointment.status.toUpperCase()}</Text>
            </View>
          </View>
          
          <Card.Divider />
          
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Contact:</Text>
            <Text style={styles.infoValue}>{contact.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>
              {appointmentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Time:</Text>
            <Text style={styles.infoValue}>
              {appointmentDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{appointmentType.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="hourglass-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>{appointmentType.duration_minutes} minutes</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoLabel}>Leader:</Text>
            <Text style={styles.infoValue}>{leader.name} ({leader.role})</Text>
          </View>
          
          {appointment.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{appointment.notes}</Text>
            </View>
          )}
        </Card>

        <Card>
          <Card.Title>Contact Actions</Card.Title>
          <Card.Divider />
          
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call-outline" size={24} color={Colors.primary} />
            <Text style={styles.actionText}>Call {contact.name}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleSendReminder}>
            <Ionicons name="chatbox-outline" size={24} color={Colors.primary} />
            <Text style={styles.actionText}>Send Reminder SMS</Text>
          </TouchableOpacity>
          
          {contact.email && (
            <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
              <Ionicons name="mail-outline" size={24} color={Colors.primary} />
              <Text style={styles.actionText}>Send Email</Text>
            </TouchableOpacity>
          )}
        </Card>

        {appointment.status === 'pending' && !isPast && (
          <Card>
            <Card.Title>Update Status</Card.Title>
            <Card.Divider />
            
            <Button
              title="Mark as Confirmed"
              onPress={() => handleStatusChange('confirmed')}
              loading={loading}
              buttonStyle={[styles.statusButton, { backgroundColor: Colors.success }]}
              icon={<Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />}
            />
            
            <Button
              title="Cancel Appointment"
              onPress={() => handleStatusChange('cancelled')}
              loading={loading}
              buttonStyle={[styles.statusButton, { backgroundColor: Colors.error }]}
              icon={<Ionicons name="close-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />}
            />
          </Card>
        )}

        {appointment.status === 'confirmed' && isPast && (
          <Card>
            <Card.Title>Complete Appointment</Card.Title>
            <Card.Divider />
            
            <Button
              title="Mark as Completed"
              onPress={() => handleStatusChange('completed')}
              loading={loading}
              buttonStyle={[styles.statusButton, { backgroundColor: Colors.primary }]}
              icon={<Ionicons name="checkmark-done-outline" size={20} color="#fff" style={{ marginRight: 8 }} />}
            />
          </Card>
        )}

        <View style={styles.bottomActions}>
          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <Button
              title="Reschedule"
              onPress={handleReschedule}
              type="outline"
              buttonStyle={styles.rescheduleButton}
              titleStyle={styles.rescheduleButtonTitle}
              icon={<Ionicons name="calendar-outline" size={20} color={Colors.primary} style={{ marginRight: 8 }} />}
            />
          )}
          
          <Button
            title="Delete"
            onPress={handleDelete}
            loading={loading}
            buttonStyle={styles.deleteButton}
            icon={<Ionicons name="trash-outline" size={20} color="#fff" style={{ marginRight: 8 }} />}
          />
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
  errorText: {
    fontSize: FontSizes.lg,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  backButton: {
    marginHorizontal: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginLeft: 10,
    width: 80,
  },
  infoValue: {
    fontSize: FontSizes.md,
    color: Colors.text,
    flex: 1,
    fontWeight: '500',
  },
  notesContainer: {
    marginTop: 15,
  },
  notesLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  notesText: {
    fontSize: FontSizes.md,
    color: Colors.text,
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    marginLeft: 15,
    fontWeight: '500',
  },
  statusButton: {
    marginBottom: 10,
    paddingVertical: 12,
  },
  bottomActions: {
    margin: 20,
    gap: 10,
  },
  rescheduleButton: {
    borderColor: Colors.primary,
    paddingVertical: 12,
  },
  rescheduleButtonTitle: {
    color: Colors.primary,
  },
  deleteButton: {
    backgroundColor: Colors.error,
    paddingVertical: 12,
  },
});

export default AppointmentDetailsScreen;