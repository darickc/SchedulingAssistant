import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import {
  ListItem,
  Header,
  FAB,
  Button,
  Input,
  Text,
  Card,
  Chip,
} from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../stores/settingsStore';
import { MessageTemplate } from '../types';
import { defaultMessageTemplates } from '../constants';
import { SMSService } from '../services/sms';

export default function TemplateManagementScreen({ navigation }: any) {
  const { messageTemplates, updateMessageTemplate, addMessageTemplate, deleteMessageTemplate } = useSettingsStore();
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateText, setTemplateText] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

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

  const availableVariables = [
    { key: 'name', description: 'Contact name' },
    { key: 'leader', description: 'Leader name' },
    { key: 'leaderRole', description: 'Leader role' },
    { key: 'day', description: 'Day of the week' },
    { key: 'date', description: 'Full date' },
    { key: 'time', description: 'Appointment time' },
    { key: 'duration', description: 'Appointment duration' },
    { key: 'type', description: 'Appointment type' },
    { key: 'location', description: 'Meeting location' },
  ];

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateText(template.template);
    setIsModalVisible(true);
    setIsPreviewMode(false);
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateText('');
    setIsModalVisible(true);
    setIsPreviewMode(false);
  };

  const handleSave = () => {
    if (!templateName.trim() || !templateText.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (editingTemplate) {
      updateMessageTemplate(editingTemplate.id!, {
        name: templateName,
        template: templateText,
      });
    } else {
      addMessageTemplate({
        name: templateName,
        template: templateText,
      });
    }

    setIsModalVisible(false);
  };

  const handleDelete = (template: MessageTemplate) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMessageTemplate(template.id!),
        },
      ]
    );
  };

  const insertVariable = (variable: string) => {
    const cursorPosition = templateText.length;
    const newText = 
      templateText.slice(0, cursorPosition) + 
      `{${variable}}` + 
      templateText.slice(cursorPosition);
    setTemplateText(newText);
  };

  const getPreviewText = () => {
    const sampleVariables = {
      name: 'John Doe',
      leader: 'Bishop Smith',
      leaderRole: 'Bishop',
      day: 'Sunday, March 15',
      date: '03/15/2024',
      time: '3:00 PM',
      duration: '15 minutes',
      type: 'Temple Recommend Interview',
      location: 'Church',
    };

    return SMSService.formatMessage(templateText, sampleVariables);
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Templates',
      'This will reset all templates to their default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // Clear existing templates and add defaults
            messageTemplates.forEach(template => {
              if (template.id) {
                deleteMessageTemplate(template.id);
              }
            });
            defaultMessageTemplates.forEach(template => {
              addMessageTemplate(template);
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        centerComponent={{ text: 'Message Templates', style: { color: '#fff', fontSize: 18 } }}
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
        {messageTemplates.map((template, index) => (
          <ListItem
            key={template.id || index}
            bottomDivider
            onPress={() => handleEdit(template)}
          >
            <ListItem.Content>
              <ListItem.Title>{template.name}</ListItem.Title>
              <ListItem.Subtitle
                numberOfLines={2}
                ellipsizeMode="tail"
                style={styles.templatePreview}
              >
                {template.template}
              </ListItem.Subtitle>
            </ListItem.Content>
            <Ionicons
              name="trash-outline"
              size={24}
              color="#FF3B30"
              onPress={() => handleDelete(template)}
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
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
              text: editingTemplate ? 'Edit Template' : 'New Template', 
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
              label="Template Name"
              value={templateName}
              onChangeText={setTemplateName}
              placeholder="e.g., Temple Recommend Interview"
            />

            <View style={styles.templateSection}>
              <Text style={styles.sectionTitle}>Template Message</Text>
              <TextInput
                style={styles.templateInput}
                value={templateText}
                onChangeText={setTemplateText}
                placeholder="Enter your message template..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.variablesSection}>
              <Text style={styles.sectionTitle}>Available Variables</Text>
              <Text style={styles.helpText}>
                Tap to insert variables into your template
              </Text>
              <View style={styles.variableChips}>
                {availableVariables.map((variable) => (
                  <Chip
                    key={variable.key}
                    title={`{${variable.key}}`}
                    onPress={() => insertVariable(variable.key)}
                    buttonStyle={styles.variableChip}
                    titleStyle={styles.variableChipText}
                  />
                ))}
              </View>
            </View>

            <Card>
              <Card.Title>Variable Descriptions</Card.Title>
              <Card.Divider />
              {availableVariables.map((variable) => (
                <View key={variable.key} style={styles.variableDescription}>
                  <Text style={styles.variableKey}>{`{${variable.key}}`}</Text>
                  <Text style={styles.variableDesc}>{variable.description}</Text>
                </View>
              ))}
            </Card>

            <Button
              title={isPreviewMode ? "Edit Template" : "Preview Message"}
              onPress={() => setIsPreviewMode(!isPreviewMode)}
              buttonStyle={styles.previewButton}
              icon={
                <Ionicons
                  name={isPreviewMode ? "create-outline" : "eye-outline"}
                  size={20}
                  color="#fff"
                  style={{ marginRight: 5 }}
                />
              }
            />

            {isPreviewMode && (
              <Card>
                <Card.Title>Message Preview</Card.Title>
                <Card.Divider />
                <Text style={styles.previewText}>{getPreviewText()}</Text>
              </Card>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  templatePreview: {
    color: '#666',
    marginTop: 4,
  },
  templateSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  templateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#f9f9f9',
  },
  variablesSection: {
    marginBottom: 20,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  variableChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variableChip: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  variableChipText: {
    fontSize: 14,
  },
  variableDescription: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  variableKey: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#007AFF',
    width: 100,
  },
  variableDesc: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  previewButton: {
    backgroundColor: '#34C759',
    marginVertical: 20,
  },
  previewText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});