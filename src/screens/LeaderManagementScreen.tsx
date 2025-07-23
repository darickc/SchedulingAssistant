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
import { ListItem, Button, Input, Icon, CheckBox } from 'react-native-elements';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuth } from '../contexts/AuthContext';
import { CalendarService, Calendar } from '../services/googleCalendar';
import { Leader } from '../types';

export const LeaderManagementScreen: React.FC = () => {
  const { leaders, addLeader, updateLeader, deleteLeader } = useSettingsStore();
  const { isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCalendarId, setSelectedCalendarId] = useState('');
  const [selectedCalendarName, setSelectedCalendarName] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (isSignedIn) {
      loadCalendars();
    }
  }, [isSignedIn]);

  const loadCalendars = async () => {
    try {
      setIsLoading(true);
      const calendarList = await CalendarService.listCalendars();
      setCalendars(calendarList.filter(cal => cal.accessRole === 'owner' || cal.accessRole === 'writer'));
    } catch (error) {
      console.error('Error loading calendars:', error);
      Alert.alert('Error', 'Failed to load calendars. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddLeader = () => {
    resetForm();
    setEditingLeader(null);
    setModalVisible(true);
  };

  const openEditLeader = (leader: Leader) => {
    setEditingLeader(leader);
    setName(leader.name);
    setRole(leader.role);
    setEmail(leader.email);
    setSelectedCalendarId(leader.calendar_id);
    setIsActive(leader.is_active);
    
    // Find calendar name
    const calendar = calendars.find(cal => cal.id === leader.calendar_id);
    setSelectedCalendarName(calendar?.summary || leader.calendar_id);
    
    setModalVisible(true);
  };

  const resetForm = () => {
    setName('');
    setRole('');
    setEmail('');
    setSelectedCalendarId('');
    setSelectedCalendarName('');
    setIsActive(true);
  };

  const handleSave = async () => {
    if (!name || !role || !email || !selectedCalendarId) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const leaderData = {
        name,
        role,
        email,
        calendar_id: selectedCalendarId,
        is_active: isActive,
      };

      if (editingLeader) {
        await updateLeader(editingLeader.id, leaderData);
      } else {
        await addLeader(leaderData);
      }

      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error saving leader:', error);
      Alert.alert('Error', 'Failed to save leader');
    }
  };

  const handleDelete = (leader: Leader) => {
    Alert.alert(
      'Delete Leader',
      `Are you sure you want to delete ${leader.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLeader(leader.id);
            } catch (error) {
              console.error('Error deleting leader:', error);
              Alert.alert('Error', 'Failed to delete leader');
            }
          },
        },
      ]
    );
  };

  const selectCalendar = (calendar: Calendar) => {
    setSelectedCalendarId(calendar.id);
    setSelectedCalendarName(calendar.summary);
    setCalendarModalVisible(false);
  };

  if (!isSignedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Icon name="calendar" type="feather" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Please sign in to manage leaders</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {leaders.map((leader) => (
          <ListItem key={leader.id} bottomDivider onPress={() => openEditLeader(leader)}>
            <ListItem.Content>
              <ListItem.Title>{leader.name}</ListItem.Title>
              <ListItem.Subtitle>{leader.role}</ListItem.Subtitle>
              <Text style={styles.emailText}>{leader.email}</Text>
            </ListItem.Content>
            <View style={styles.rightContent}>
              {leader.is_active ? (
                <Icon name="check-circle" type="feather" color="#4CAF50" size={20} />
              ) : (
                <Icon name="x-circle" type="feather" color="#FF5252" size={20} />
              )}
              <TouchableOpacity
                onPress={() => handleDelete(leader)}
                style={styles.deleteButton}
              >
                <Icon name="trash-2" type="feather" color="#FF5252" size={20} />
              </TouchableOpacity>
            </View>
          </ListItem>
        ))}

        {leaders.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="users" type="feather" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No leaders added yet</Text>
            <Text style={styles.emptySubtext}>Add leaders to manage their calendars</Text>
          </View>
        )}
      </ScrollView>

      <Button
        title="Add Leader"
        onPress={openAddLeader}
        buttonStyle={styles.addButton}
        icon={<Icon name="plus" type="feather" color="white" size={20} />}
      />

      {/* Add/Edit Leader Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingLeader ? 'Edit Leader' : 'Add Leader'}
            </Text>

            <Input
              placeholder="Name"
              value={name}
              onChangeText={setName}
              leftIcon={<Icon name="user" type="feather" size={20} color="#666" />}
            />

            <Input
              placeholder="Role (e.g., Bishop, 1st Counselor)"
              value={role}
              onChangeText={setRole}
              leftIcon={<Icon name="briefcase" type="feather" size={20} color="#666" />}
            />

            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Icon name="mail" type="feather" size={20} color="#666" />}
            />

            <TouchableOpacity
              style={styles.calendarSelector}
              onPress={() => setCalendarModalVisible(true)}
            >
              <Icon name="calendar" type="feather" size={20} color="#666" />
              <Text style={styles.calendarSelectorText}>
                {selectedCalendarName || 'Select Calendar'}
              </Text>
              <Icon name="chevron-down" type="feather" size={20} color="#666" />
            </TouchableOpacity>

            <CheckBox
              title="Active"
              checked={isActive}
              onPress={() => setIsActive(!isActive)}
              containerStyle={styles.checkbox}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
                buttonStyle={[styles.modalButton, styles.cancelButton]}
              />
              <Button
                title="Save"
                onPress={handleSave}
                buttonStyle={[styles.modalButton, styles.saveButton]}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Calendar Selection Modal */}
      <Modal
        visible={calendarModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Calendar</Text>
            
            {isLoading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <ScrollView style={styles.calendarList}>
                {calendars.map((calendar) => (
                  <TouchableOpacity
                    key={calendar.id}
                    style={styles.calendarItem}
                    onPress={() => selectCalendar(calendar)}
                  >
                    <View
                      style={[
                        styles.calendarColor,
                        { backgroundColor: calendar.backgroundColor || '#007AFF' },
                      ]}
                    />
                    <Text style={styles.calendarName}>{calendar.summary}</Text>
                    {calendar.id === selectedCalendarId && (
                      <Icon name="check" type="feather" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Button
              title="Close"
              onPress={() => setCalendarModalVisible(false)}
              buttonStyle={styles.closeButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  emailText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    marginLeft: 15,
    padding: 5,
  },
  addButton: {
    margin: 20,
    borderRadius: 30,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  calendarSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#86939e',
    paddingVertical: 15,
    marginHorizontal: 10,
    marginBottom: 20,
  },
  calendarSelectorText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  checkbox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    width: '45%',
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  calendarList: {
    maxHeight: 300,
  },
  calendarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  calendarColor: {
    width: 16,
    height: 16,
    borderRadius: 3,
    marginRight: 10,
  },
  calendarName: {
    flex: 1,
    fontSize: 16,
  },
  closeButton: {
    marginTop: 20,
    borderRadius: 5,
  },
});