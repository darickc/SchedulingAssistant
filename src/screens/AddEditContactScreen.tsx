import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackScreenProps } from '@/types/navigation';
import { Colors, Spacing, FontSizes } from '@/constants';
import { useContactStore } from '@/stores/contactStore';
import { formatPhoneNumber, isValidEmail } from '@/utils/csvParser';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = RootStackScreenProps<'AddEditContact'>;

const AddEditContactScreen: React.FC<Props> = ({ route, navigation }) => {
  const { contactId } = route.params;
  const { 
    getContactById, 
    createContact, 
    updateContact, 
    loading 
  } = useContactStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (contactId) {
      const contact = getContactById(contactId);
      if (contact) {
        setName(contact.name);
        setPhone(contact.phone);
        setEmail(contact.email || '');
        setNotes(contact.notes || '');
      }
    }
  }, [contactId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Phone validation
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length < 10) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    // Email validation (optional but must be valid if provided)
    if (email.trim() && !isValidEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const contactData = {
        name: name.trim(),
        phone: formatPhoneNumber(phone.trim()),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (contactId) {
        await updateContact(contactId, contactData);
        Alert.alert('Success', 'Contact updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await createContact(contactData);
        Alert.alert('Success', 'Contact created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save contact'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhoneChange = (text: string) => {
    // Allow only numbers and formatting characters
    const cleaned = text.replace(/[^\d\s()-]/g, '');
    setPhone(cleaned);
    if (errors.phone) {
      setErrors({ ...errors, phone: '' });
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    error?: string,
    placeholder?: string,
    keyboardType?: 'default' | 'phone-pad' | 'email-address',
    multiline?: boolean
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error ? styles.inputError : null
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {contactId ? 'Edit Contact' : 'New Contact'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderInput(
            'Name *',
            name,
            (text) => {
              setName(text);
              if (errors.name) setErrors({ ...errors, name: '' });
            },
            errors.name,
            'John Doe'
          )}

          {renderInput(
            'Phone Number *',
            phone,
            handlePhoneChange,
            errors.phone,
            '(555) 123-4567',
            'phone-pad'
          )}

          {renderInput(
            'Email',
            email,
            (text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: '' });
            },
            errors.email,
            'john@example.com',
            'email-address'
          )}

          {renderInput(
            'Notes',
            notes,
            setNotes,
            undefined,
            'Add any additional notes...',
            'default',
            true
          )}

          <View style={styles.requiredNote}>
            <Text style={styles.requiredText}>* Required fields</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={isSaving || loading}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>
              {contactId ? 'Update' : 'Save'}
            </Text>
          )}
        </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  requiredNote: {
    marginTop: Spacing.md,
  },
  requiredText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default AddEditContactScreen;