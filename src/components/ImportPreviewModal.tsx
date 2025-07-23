import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ContactImportResult, CreateContactInput } from '@/types';
import { Colors, Spacing, FontSizes } from '@/constants';
import Icon from 'react-native-vector-icons/Ionicons';

interface ImportPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  importResult: ContactImportResult;
}

const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  visible,
  onClose,
  onConfirm,
  importResult,
}) => {
  const { successful, failed, duplicates } = importResult;
  const totalContacts = successful.length + failed.length + duplicates.length;

  const handleViewDetails = (type: 'failed' | 'duplicates') => {
    const items = type === 'failed' ? failed : duplicates;
    const details = items.map((item, index) => {
      if (type === 'failed') {
        return `Row ${item.row}: ${item.error}`;
      } else {
        const dup = item as ContactImportResult['duplicates'][0];
        return `Row ${dup.row}: ${(dup.data as CreateContactInput).name} (duplicate of ${dup.existingContact.name})`;
      }
    }).join('\n\n');

    Alert.alert(
      type === 'failed' ? 'Failed Imports' : 'Duplicate Contacts',
      details,
      [{ text: 'OK' }]
    );
  };

  const renderSummaryItem = (icon: string, label: string, count: number, color: string, onPress?: () => void) => (
    <TouchableOpacity 
      style={[styles.summaryItem, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={!onPress || count === 0}
    >
      <Icon name={icon} size={24} color={color} />
      <View style={styles.summaryTextContainer}>
        <Text style={styles.summaryCount}>{count}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
      {onPress && count > 0 && (
        <Icon name="chevron-forward" size={20} color={Colors.gray} />
      )}
    </TouchableOpacity>
  );

  const renderContactPreview = ({ item }: { item: CreateContactInput }) => (
    <View style={styles.contactItem}>
      <Icon name="person-circle-outline" size={24} color={Colors.primary} />
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
        {item.email && <Text style={styles.contactEmail}>{item.email}</Text>}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Import Preview</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.totalText}>
            Total contacts found: {totalContacts}
          </Text>

          <View style={styles.summaryContainer}>
            {renderSummaryItem(
              'checkmark-circle',
              'Ready to import',
              successful.length,
              Colors.success
            )}
            {renderSummaryItem(
              'alert-circle',
              'Failed to parse',
              failed.length,
              Colors.error,
              () => handleViewDetails('failed')
            )}
            {renderSummaryItem(
              'copy',
              'Duplicates (will skip)',
              duplicates.length,
              Colors.warning,
              () => handleViewDetails('duplicates')
            )}
          </View>

          {successful.length > 0 && (
            <>
              <Text style={styles.previewTitle}>Contacts to Import:</Text>
              <FlatList
                data={successful.slice(0, 5)}
                renderItem={renderContactPreview}
                keyExtractor={(item, index) => index.toString()}
                style={styles.previewList}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
              {successful.length > 5 && (
                <Text style={styles.moreText}>
                  ...and {successful.length - 5} more
                </Text>
              )}
            </>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              disabled={successful.length === 0}
            >
              <Text style={styles.confirmButtonText}>
                Import {successful.length} Contact{successful.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  totalText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  summaryContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 10,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
  },
  summaryTextContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  summaryCount: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  previewTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  previewList: {
    maxHeight: 200,
    paddingHorizontal: Spacing.lg,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  contactInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  contactName: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  contactPhone: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  contactEmail: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  moreText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
  },
  cancelButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  confirmButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default ImportPreviewModal;