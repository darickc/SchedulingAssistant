import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import {
  ListItem,
  Header,
  FAB,
  Button,
  Input,
  Text,
  Slider,
} from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../stores/settingsStore';
import { AppointmentType } from '../types';
import { defaultAppointmentTypes } from '../constants';

export default function AppointmentTypeManagementScreen({ navigation }: any) {
  const { appointmentTypes, updateAppointmentType, addAppointmentType, deleteAppointmentType } = useSettingsStore();
  const [editingType, setEditingType] = useState<AppointmentType | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [duration, setDuration] = useState(15);
  const [color, setColor] = useState('#007AFF');
  const [template, setTemplate] = useState('');

  const colors = [
    '#007AFF', // Blue
    '#34C759', // Green
    '#FF9500', // Orange
    '#FF3B30', // Red
    '#5856D6', // Purple
    '#AF52DE', // Violet
    '#FFD60A', // Yellow
    '#32D74B', // Light Green
    '#FF453A', // Light Red
    '#0A84FF', // Light Blue
  ];

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Ionicons
          name="arrow-back"
          size={24}
          color="#007AFF"
          style={{ marginLeft: 10 }}
          onPress={() => navigation.goBack()}
        />
      ),
    });
  }, [navigation]);

  const handleEdit = (type: AppointmentType) => {
    setEditingType(type);
    setTypeName(type.name);
    setDuration(type.duration_minutes);
    setColor(type.color || '#007AFF');
    setTemplate(type.template);
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setEditingType(null);
    setTypeName('');
    setDuration(15);
    setColor('#007AFF');
    setTemplate('');
    setIsModalVisible(true);
  };

  const handleSave = () => {
    if (!typeName.trim()) {
      Alert.alert('Error', 'Please enter a name for the appointment type');
      return;
    }

    if (!template.trim()) {
      Alert.alert('Error', 'Please enter a message template');
      return;
    }

    const appointmentType: Omit<AppointmentType, 'id'> = {
      name: typeName,
      duration_minutes: duration,
      color,
      template,
    };

    if (editingType) {
      updateAppointmentType(editingType.id!, appointmentType);
    } else {
      addAppointmentType(appointmentType);
    }

    setIsModalVisible(false);
  };

  const handleDelete = (type: AppointmentType) => {
    Alert.alert(
      'Delete Appointment Type',
      `Are you sure you want to delete "${type.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAppointmentType(type.id!),
        },
      ]
    );
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Appointment Types',
      'This will reset all appointment types to their default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // Clear existing types and add defaults
            appointmentTypes.forEach(type => {
              if (type.id) {
                deleteAppointmentType(type.id);
              }
            });
            defaultAppointmentTypes.forEach(type => {
              addAppointmentType(type);
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        centerComponent={{ text: 'Appointment Types', style: { color: '#fff', fontSize: 18 } }}
        rightComponent={
          <Button
            title="Reset"
            type="clear"
            titleStyle={{ color: '#fff', fontSize: 14 }}
            onPress={resetToDefaults}
          />
        }
      />

      <ScrollView>
        {appointmentTypes.map((type, index) => (
          <ListItem
            key={type.id ? `type-${type.id}` : `temp-${index}`}
            bottomDivider
            onPress={() => handleEdit(type)}
          >
            <View
              style={[
                styles.colorIndicator,
                { backgroundColor: type.color || '#007AFF' },
              ]}
            />
            <ListItem.Content>
              <ListItem.Title>{type.name}</ListItem.Title>
              <ListItem.Subtitle style={styles.subtitle}>
                {type.duration_minutes} minutes
              </ListItem.Subtitle>
            </ListItem.Content>
            <Ionicons
              name="trash-outline"
              size={24}
              color="#FF3B30"
              onPress={() => handleDelete(type)}
            />
          </ListItem>
        ))}
      </ScrollView>

      <FAB
        placement="right"
        icon={<Ionicons name="add" size={24} color="#fff" />}
        color="#007AFF"
        onPress={handleAdd}
      />

      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Header
            leftComponent={
              <Button
                title="Cancel"
                type="clear"
                titleStyle={{ color: '#fff' }}
                onPress={() => setIsModalVisible(false)}
              />
            }
            centerComponent={{ 
              text: editingType ? 'Edit Appointment Type' : 'New Appointment Type', 
              style: { color: '#fff', fontSize: 18 } 
            }}
            rightComponent={
              <Button
                title="Save"
                type="clear"
                titleStyle={{ color: '#fff' }}
                onPress={handleSave}
              />
            }
          />

          <ScrollView style={styles.modalContent}>
            <Input
              label="Type Name"
              value={typeName}
              onChangeText={setTypeName}
              placeholder="e.g., Temple Recommend Interview"
            />

            <View style={styles.durationSection}>
              <Text style={styles.label}>Duration: {duration} minutes</Text>
              <Slider
                value={duration}
                onValueChange={setDuration}
                minimumValue={5}
                maximumValue={120}
                step={5}
                thumbStyle={styles.sliderThumb}
                trackStyle={styles.sliderTrack}
                minimumTrackTintColor="#007AFF"
              />
              <View style={styles.durationLabels}>
                <Text key="duration-min" style={styles.durationLabel}>5 min</Text>
                <Text key="duration-max" style={styles.durationLabel}>120 min</Text>
              </View>
            </View>

            <View style={styles.colorSection}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {colors.map((colorOption, index) => (
                  <TouchableOpacity
                    key={`color-${colorOption}-${index}`}
                    style={[
                      styles.colorOption,
                      { backgroundColor: colorOption },
                      color === colorOption && styles.selectedColor,
                    ]}
                    onPress={() => setColor(colorOption)}
                  >
                    {color === colorOption && (
                      <Ionicons name="checkmark" size={24} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label="Default Message Template"
              value={template}
              onChangeText={setTemplate}
              placeholder="Brother/Sister {name}, can you meet with {leader} this {day} at {time}?"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              inputStyle={styles.templateInput}
            />

            <View style={styles.helpSection}>
              <Text style={styles.helpTitle}>Available Variables:</Text>
              <Text style={styles.helpText}>
                {'{name}'} - Contact's name{'\n'}
                {'{leader}'} - Leader's name{'\n'}
                {'{leaderRole}'} - Leader's role{'\n'}
                {'{day}'} - Day and date{'\n'}
                {'{time}'} - Appointment time{'\n'}
                {'{duration}'} - Appointment duration{'\n'}
                {'{type}'} - Appointment type{'\n'}
                {'{location}'} - Meeting location
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  colorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  durationSection: {
    marginBottom: 30,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#007AFF',
  },
  sliderTrack: {
    height: 5,
    borderRadius: 2.5,
  },
  durationLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  durationLabel: {
    fontSize: 12,
    color: '#666',
  },
  colorSection: {
    marginBottom: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#333',
  },
  templateInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helpSection: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});