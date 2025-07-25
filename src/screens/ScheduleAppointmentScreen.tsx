import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ListItem, Header } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { RootStackScreenProps } from '@/types/navigation';
import { Colors, FontSizes } from '@/constants';
import { useContactStore } from '@/stores/contactStore';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { SchedulingService } from '@/services/scheduling';
import { SMSService } from '@/services/sms';
import { GoogleCalendarService } from '@/services/googleCalendar';
import { TimeSlot, Leader, AppointmentType, MessageTemplate } from '@/types';

type Props = RootStackScreenProps<'ScheduleAppointment'>;

const ScheduleAppointmentScreen: React.FC<Props> = ({ route, navigation }) => {
  const { contactId } = route.params;
  
  // Store hooks
  const { contacts } = useContactStore();
  const { createAppointment, updateAppointment } = useAppointmentStore();
  const { leaders, appointmentTypes, messageTemplates } = useSettingsStore();
  
  // State
  const [step, setStep] = useState(1); // 1: Type, 2: Leader, 3: Date/Time, 4: Confirm
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagePreview, setMessagePreview] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  
  const contact = contacts.find(c => c.id === contactId);
  const activeLeaders = leaders.filter(l => l.isActive);

  useEffect(() => {
    if (selectedType) {
      // Find matching template or use the type's default template
      const matchingTemplate = messageTemplates.find(t => 
        t.name.toLowerCase().includes(selectedType.name.toLowerCase())
      );
      setSelectedTemplate(matchingTemplate || {
        id: 0,
        name: selectedType.name,
        template: selectedType.template
      });
    }
  }, [selectedType, messageTemplates]);

  useEffect(() => {
    if (selectedSlot && contact && selectedLeader && selectedType && selectedTemplate) {
      const preview = SMSService.previewMessage(
        selectedTemplate,
        {
          id: 0,
          contactId: contact.id!,
          leaderId: selectedLeader.id!,
          typeId: selectedType.id!,
          scheduledTime: selectedSlot.start,
          status: 'pending',
          createdAt: new Date(),
        },
        contact,
        selectedLeader,
        selectedType
      );
      setMessagePreview(preview);
    }
  }, [selectedSlot, contact, selectedLeader, selectedType, selectedTemplate]);

  const loadAvailableSlots = async (date: string) => {
    if (!selectedLeader || !selectedType) return;
    
    setLoading(true);
    try {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      const slots = await SchedulingService.findAvailableSlots(
        selectedLeader.id!,
        selectedLeader,
        selectedType.durationMinutes,
        { start: startDate, end: endDate }
      );
      
      setAvailableSlots(slots);
    } catch (error) {
      Alert.alert('Error', 'Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: any) => {
    setSelectedDate(date.dateString);
    setSelectedSlot(null);
    loadAvailableSlots(date.dateString);
  };

  const handleSchedule = async () => {
    if (!contact || !selectedLeader || !selectedType || !selectedSlot || !selectedTemplate) {
      Alert.alert('Error', 'Please complete all steps');
      return;
    }

    setLoading(true);
    try {
      // Create appointment in local database
      const appointment = await createAppointment({
        contactId: contact.id!,
        leaderId: selectedLeader.id!,
        typeId: selectedType.id!,
        scheduledTime: selectedSlot.start,
        status: 'pending',
      });

      // Create Google Calendar event
      try {
        const event = await GoogleCalendarService.createEvent(
          selectedLeader.calendarId,
          {
            summary: `${selectedType.name} - ${contact.name}`,
            description: `Appointment with ${contact.name}\nPhone: ${contact.phone}${contact.email ? `\nEmail: ${contact.email}` : ''}${contact.notes ? `\nNotes: ${contact.notes}` : ''}`,
            start: selectedSlot.start,
            end: selectedSlot.end,
            attendees: contact.email ? [contact.email] : [],
          }
        );

        // Update appointment with Google event ID
        if (event.id && appointment.id) {
          await updateAppointment(appointment.id, {
            googleEventId: event.id,
          });
        }
      } catch (calendarError) {
        console.error('Failed to create calendar event:', calendarError);
        // Continue even if calendar creation fails
      }

      // Send SMS
      try {
        await SMSService.sendAppointmentSMS(
          appointment,
          contact,
          selectedLeader,
          selectedType,
          selectedTemplate
        );
      } catch (smsError) {
        Alert.alert(
          'SMS Not Sent',
          'The appointment was scheduled but the SMS could not be sent. You can send it manually from the appointment details.',
          [{ text: 'OK' }]
        );
      }

      Alert.alert(
        'Success',
        'Appointment scheduled successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((num) => (
        <View key={num} style={styles.stepContainer}>
          <View
            style={[
              styles.stepCircle,
              step >= num && styles.stepCircleActive,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                step >= num && styles.stepNumberActive,
              ]}
            >
              {num}
            </Text>
          </View>
          {num < 4 && (
            <View
              style={[
                styles.stepLine,
                step > num && styles.stepLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Appointment Type</Text>
      {appointmentTypes.map((type) => (
        <ListItem
          key={type.id}
          bottomDivider
          onPress={() => {
            setSelectedType(type);
            setStep(2);
          }}
          containerStyle={[
            styles.listItem,
            selectedType?.id === type.id && styles.selectedItem,
          ]}
        >
          <View
            style={[
              styles.typeColor,
              { backgroundColor: type.color || '#007AFF' },
            ]}
          />
          <ListItem.Content>
            <ListItem.Title>{type.name}</ListItem.Title>
            <ListItem.Subtitle>{type.durationMinutes} minutes</ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>
      ))}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Leader</Text>
      {activeLeaders.map((leader) => (
        <ListItem
          key={leader.id}
          bottomDivider
          onPress={() => {
            setSelectedLeader(leader);
            setStep(3);
          }}
          containerStyle={[
            styles.listItem,
            selectedLeader?.id === leader.id && styles.selectedItem,
          ]}
        >
          <Ionicons name="person-circle-outline" size={40} color={Colors.primary} />
          <ListItem.Content>
            <ListItem.Title>{leader.name}</ListItem.Title>
            <ListItem.Subtitle>{leader.role}</ListItem.Subtitle>
          </ListItem.Content>
          <ListItem.Chevron />
        </ListItem>
      ))}
    </View>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Select Date & Time</Text>
      <Calendar
        onDayPress={handleDateSelect}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: Colors.primary },
        }}
        minDate={new Date().toISOString().split('T')[0]}
        theme={{
          selectedDayBackgroundColor: Colors.primary,
          todayTextColor: Colors.primary,
          arrowColor: Colors.primary,
        }}
      />
      
      {selectedDate && (
        <View style={styles.slotsContainer}>
          <Text style={styles.slotsTitle}>Available Times</Text>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : availableSlots.length > 0 ? (
            <View style={styles.slotsGrid}>
              {availableSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.timeSlot,
                    selectedSlot === slot && styles.selectedSlot,
                  ]}
                  onPress={() => {
                    setSelectedSlot(slot);
                    setStep(4);
                  }}
                >
                  <Text
                    style={[
                      styles.slotText,
                      selectedSlot === slot && styles.selectedSlotText,
                    ]}
                  >
                    {slot.start.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.noSlotsText}>No available time slots for this date</Text>
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Confirm Appointment</Text>
      
      <Card>
        <Card.Title>Appointment Summary</Card.Title>
        <Card.Divider />
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Contact:</Text>
          <Text style={styles.summaryValue}>{contact?.name}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Type:</Text>
          <Text style={styles.summaryValue}>{selectedType?.name}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Leader:</Text>
          <Text style={styles.summaryValue}>{selectedLeader?.name}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Date & Time:</Text>
          <Text style={styles.summaryValue}>
            {selectedSlot && new Date(selectedSlot.start).toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Duration:</Text>
          <Text style={styles.summaryValue}>{selectedType?.durationMinutes} minutes</Text>
        </View>
      </Card>
      
      <Card>
        <Card.Title>SMS Preview</Card.Title>
        <Card.Divider />
        <Text style={styles.messagePreview}>{messagePreview}</Text>
        <Text style={styles.recipientText}>To: {contact?.phone}</Text>
      </Card>
      
      <Button
        title="Schedule & Send SMS"
        onPress={handleSchedule}
        loading={loading}
        buttonStyle={styles.confirmButton}
        icon={<Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />}
      />
    </ScrollView>
  );

  if (!contact) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Contact not found</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          buttonStyle={styles.backButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Schedule Appointment</Text>
          <Text style={styles.headerSubtitle}>{contact.name}</Text>
        </View>
      </View>

      {renderStepIndicator()}

      <View style={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </View>

      {step > 1 && (
        <View style={styles.navigationButtons}>
          <Button
            title="Previous"
            type="outline"
            onPress={() => setStep(step - 1)}
            buttonStyle={styles.navButton}
            titleStyle={styles.navButtonTitle}
          />
        </View>
      )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
    backgroundColor: Colors.surface,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepNumber: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 5,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },
  listItem: {
    backgroundColor: Colors.surface,
    marginBottom: 8,
    borderRadius: 8,
    paddingVertical: 12,
  },
  selectedItem: {
    backgroundColor: '#E8F4F8',
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  typeColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  slotsContainer: {
    marginTop: 20,
  },
  slotsTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedSlot: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotText: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  selectedSlotText: {
    color: '#fff',
  },
  noSlotsText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    width: 100,
  },
  summaryValue: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    flex: 1,
    fontWeight: '500',
  },
  messagePreview: {
    fontSize: FontSizes.md,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 10,
  },
  recipientText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  confirmButton: {
    backgroundColor: Colors.success,
    marginTop: 20,
    paddingVertical: 12,
  },
  navigationButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navButton: {
    borderColor: Colors.primary,
    paddingHorizontal: 30,
  },
  navButtonTitle: {
    color: Colors.primary,
  },
  errorText: {
    fontSize: FontSizes.lg,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default ScheduleAppointmentScreen;