import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, MenuTrigger, MenuOptions, MenuOption, MenuProvider } from 'react-native-popup-menu';
import { MainTabScreenProps } from '@/types/navigation';
import { Contact, ContactImportResult } from '@/types';
import { Colors, Spacing, FontSizes } from '@/constants';
import Icon from 'react-native-vector-icons/Ionicons';
import { useContactStore } from '@/stores/contactStore';
import { pickCSVFile, importContactsFromCSV } from '@/utils/documentPicker';
import { exportContactsToCSV } from '@/utils/csvParser';
import ImportPreviewModal from '@/components/ImportPreviewModal';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

type Props = MainTabScreenProps<'Contacts'>;

interface ContactSection {
  title: string;
  data: Contact[];
}

const ContactsScreen: React.FC<Props> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [pendingImportResult, setPendingImportResult] = useState<ContactImportResult | null>(null);
  
  const { 
    contacts, 
    loading, 
    error, 
    loadContacts, 
    importContacts, 
    setSearchQuery: storeSetSearchQuery,
    filteredContacts,
    clearError
  } = useContactStore();

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, []);

  // Update store search query
  useEffect(() => {
    storeSetSearchQuery(searchQuery);
  }, [searchQuery]);

  // Show error alerts
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error]);

  const handleAddContact = () => {
    navigation.navigate('AddEditContact', {});
  };

  const handleContactPress = (contactId: number) => {
    navigation.navigate('ContactDetails', { contactId });
  };

  const handleImportCSV = async () => {
    try {
      setIsImporting(true);
      
      const file = await pickCSVFile();
      if (!file) {
        setIsImporting(false);
        return;
      }

      const result = await importContactsFromCSV(file.uri);
      setPendingImportResult(result);
      setShowImportPreview(true);
      
    } catch (error) {
      Alert.alert('Import Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingImportResult) return;
    
    try {
      setShowImportPreview(false);
      setIsImporting(true);
      
      await importContacts(pendingImportResult.successful);
      
      const message = `Successfully imported ${pendingImportResult.successful.length} contact${pendingImportResult.successful.length !== 1 ? 's' : ''}`;
      Alert.alert('Import Complete', message);
      
      setPendingImportResult(null);
    } catch (error) {
      Alert.alert('Import Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancelImport = () => {
    setShowImportPreview(false);
    setPendingImportResult(null);
  };

  const handleExportCSV = async () => {
    try {
      const csvContent = exportContactsToCSV(contacts);
      const fileUri = `${FileSystem.cacheDirectory}contacts_${Date.now()}.csv`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Contacts',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      Alert.alert('Export Failed', error instanceof Error ? error.message : 'Unknown error');
    }
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

  // Group contacts alphabetically
  const getSections = (): ContactSection[] => {
    const sections: Record<string, Contact[]> = {};
    
    filteredContacts.forEach(contact => {
      const firstLetter = contact.name[0].toUpperCase();
      if (!sections[firstLetter]) {
        sections[firstLetter] = [];
      }
      sections[firstLetter].push(contact);
    });

    return Object.keys(sections)
      .sort()
      .map(letter => ({
        title: letter,
        data: sections[letter]
      }));
  };

  const sections = getSections();

  return (
    <MenuProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Contacts</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleAddContact} style={styles.headerButton}>
              <Icon name="add-circle" size={32} color={Colors.primary} />
            </TouchableOpacity>
            <Menu>
              <MenuTrigger>
                <Icon name="ellipsis-vertical" size={24} color={Colors.text} />
              </MenuTrigger>
              <MenuOptions customStyles={menuOptionsStyles}>
                <MenuOption onSelect={handleImportCSV} disabled={isImporting}>
                  <View style={styles.menuOption}>
                    <Icon name="cloud-upload-outline" size={20} color={Colors.text} />
                    <Text style={styles.menuOptionText}>Import CSV</Text>
                  </View>
                </MenuOption>
                <MenuOption onSelect={handleExportCSV} disabled={contacts.length === 0}>
                  <View style={styles.menuOption}>
                    <Icon name="cloud-download-outline" size={20} color={Colors.text} />
                    <Text style={styles.menuOptionText}>Export CSV</Text>
                  </View>
                </MenuOption>
              </MenuOptions>
            </Menu>
          </View>
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

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : isImporting ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Importing contacts...</Text>
          </View>
        ) : filteredContacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={64} color={Colors.gray} />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </Text>
            {!searchQuery && (
              <>
                <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
                  <Text style={styles.addButtonText}>Add First Contact</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.importButton} onPress={handleImportCSV}>
                  <Text style={styles.importButtonText}>Import from CSV</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <SectionList
            sections={sections}
            renderItem={renderContact}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{title}</Text>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={true}
          />
        )}
        
        {pendingImportResult && (
          <ImportPreviewModal
            visible={showImportPreview}
            onClose={handleCancelImport}
            onConfirm={handleConfirmImport}
            importResult={pendingImportResult}
          />
        )}
      </SafeAreaView>
    </MenuProvider>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginRight: Spacing.sm,
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  sectionHeaderText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
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
  importButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  importButtonText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: '600',
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

export default ContactsScreen;