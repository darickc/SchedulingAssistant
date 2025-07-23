import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackScreenProps } from '@/types/navigation';
import { Colors, FontSizes } from '@/constants';

type Props = RootStackScreenProps<'ContactDetails'>;

const ContactDetailsScreen: React.FC<Props> = ({ route }) => {
  const { contactId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.placeholder}>Contact Details Screen</Text>
      <Text style={styles.info}>Contact ID: {contactId}</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
  },
  info: {
    fontSize: FontSizes.md,
    color: Colors.text,
    marginTop: 10,
  },
});

export default ContactDetailsScreen;