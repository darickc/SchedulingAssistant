import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainTabScreenProps } from '@/types/navigation';
import { Contact } from '@/types';
import { Colors, Spacing, FontSizes } from '@/constants';
import Icon from 'react-native-vector-icons/Ionicons';

type Props = MainTabScreenProps<'Contacts'>;

const ContactsScreen: React.FC<Props> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts] = useState<Contact[]>([]);

  const handleAddContact = () => {
    navigation.navigate('AddEditContact', {});
  };

  const handleContactPress = (contactId: number) => {
    navigation.navigate('ContactDetails', { contactId });
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleContactPress(item.id)}
    >
      <View style={styles.contactAvatar}>
        <Text style={styles.avatarText}>
          {item.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color={Colors.gray} />
    </TouchableOpacity>
  );

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
        <TouchableOpacity onPress={handleAddContact}>
          <Icon name="add-circle" size={32} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={Colors.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      {filteredContacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="people-outline" size={64} color={Colors.gray} />
          <Text style={styles.emptyStateText}>No contacts yet</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
            <Text style={styles.addButtonText}>Add First Contact</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 10,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  separator: {
    height: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyStateText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});

export default ContactsScreen;