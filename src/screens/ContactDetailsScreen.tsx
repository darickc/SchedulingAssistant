import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, MenuTrigger, MenuOptions, MenuOption, MenuProvider } from 'react-native-popup-menu';
import { RootStackScreenProps } from '@/types/navigation';
import { Colors, Spacing, FontSizes } from '@/constants';
import { useContactStore } from '@/stores/contactStore';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = RootStackScreenProps<'ContactDetails'>;

const ContactDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { contactId } = route.params;
  const { getContactById, deleteContact } = useContactStore();
  const [contact, setContact] = useState(getContactById(contactId));
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const updatedContact = getContactById(contactId);
    if (updatedContact) {
      setContact(updatedContact);
    } else {
      // Contact was deleted, go back
      navigation.goBack();
    }
  }, [contactId, getContactById]);

  if (!contact) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const handleEdit = () => {
    navigation.navigate('AddEditContact', { contactId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteContact(contactId);
              navigation.goBack();
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to delete contact'
              );
              setIsDeleting(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCall = () => {
    const phoneNumber = contact.phone.replace(/\D/g, '');
    const phoneURL = `tel:${phoneNumber}`;
    
    Linking.canOpenURL(phoneURL)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneURL);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch((err) => console.error('Error opening phone app:', err));
  };

  const handleSMS = () => {
    const phoneNumber = contact.phone.replace(/\D/g, '');
    const smsURL = `sms:${phoneNumber}`;
    
    Linking.canOpenURL(smsURL)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(smsURL);
        } else {
          Alert.alert('Error', 'SMS is not supported on this device');
        }
      })
      .catch((err) => console.error('Error opening SMS app:', err));
  };

  const handleEmail = () => {
    if (!contact.email) return;
    
    const emailURL = `mailto:${contact.email}`;
    
    Linking.canOpenURL(emailURL)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(emailURL);
        } else {
          Alert.alert('Error', 'Email is not supported on this device');
        }
      })
      .catch((err) => console.error('Error opening email app:', err));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <MenuProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Contact Details</Text>
          <Menu>
            <MenuTrigger>
              <Icon name="ellipsis-vertical" size={24} color={Colors.text} />
            </MenuTrigger>
            <MenuOptions customStyles={menuOptionsStyles}>
              <MenuOption onSelect={handleEdit}>
                <View style={styles.menuOption}>
                  <Icon name="create-outline" size={20} color={Colors.text} />
                  <Text style={styles.menuOptionText}>Edit</Text>
                </View>
              </MenuOption>
              <MenuOption onSelect={handleDelete} disabled={isDeleting}>
                <View style={styles.menuOption}>
                  <Icon name="trash-outline" size={20} color={Colors.error} />
                  <Text style={[styles.menuOptionText, { color: Colors.error }]}>
                    Delete
                  </Text>
                </View>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.contactName}>{contact.name}</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Icon name="call" size={24} color={Colors.primary} />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleSMS}>
              <Icon name="chatbubble" size={24} color={Colors.primary} />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
            
            {contact.email && (
              <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
                <Icon name="mail" size={24} color={Colors.primary} />
                <Text style={styles.actionButtonText}>Email</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            <View style={styles.infoItem}>
              <Icon name="call-outline" size={20} color={Colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{contact.phone}</Text>
              </View>
            </View>

            {contact.email && (
              <View style={styles.infoItem}>
                <Icon name="mail-outline" size={20} color={Colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{contact.email}</Text>
                </View>
              </View>
            )}

            {contact.notes && (
              <View style={styles.infoItem}>
                <Icon name="document-text-outline" size={20} color={Colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Notes</Text>
                  <Text style={styles.infoValue}>{contact.notes}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoItem}>
              <Icon name="calendar-outline" size={20} color={Colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Added</Text>
                <Text style={styles.infoValue}>{formatDate(contact.createdAt)}</Text>
              </View>
            </View>

            {contact.updatedAt && contact.updatedAt !== contact.createdAt && (
              <View style={styles.infoItem}>
                <Icon name="time-outline" size={20} color={Colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Last Updated</Text>
                  <Text style={styles.infoValue}>{formatDate(contact.updatedAt)}</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </MenuProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: Colors.white,
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
  },
  contactName: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionButton: {
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
  },
  actionButtonText: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  infoSection: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  menuOptionText: {
    marginLeft: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
});

const menuOptionsStyles = {
  optionsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.xs,
  },
  optionWrapper: {
    paddingVertical: 2,
  },
};

export default ContactDetailsScreen;