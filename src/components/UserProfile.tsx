import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Avatar, Icon, Button } from 'react-native-elements';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  showSignOut?: boolean;
  compact?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  showSignOut = true, 
  compact = false 
}) => {
  const { user, signOut, isLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return null;
  }

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={showSignOut ? handleSignOut : undefined}>
        <Avatar
          rounded
          source={{ uri: user.picture }}
          size="small"
          containerStyle={styles.compactAvatar}
        />
        <Text style={styles.compactName} numberOfLines={1}>
          {user.name}
        </Text>
        {showSignOut && (
          <Icon name="log-out" type="feather" size={20} color="#666" />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <Avatar
          rounded
          source={{ uri: user.picture }}
          size="large"
          containerStyle={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      </View>

      {showSignOut && (
        <Button
          title={isSigningOut ? '' : 'Sign Out'}
          onPress={handleSignOut}
          disabled={isSigningOut || isLoading}
          buttonStyle={styles.signOutButton}
          titleStyle={styles.signOutButtonText}
          icon={
            isSigningOut ? (
              <ActivityIndicator size="small" color="#FF5252" />
            ) : (
              <Icon
                name="log-out"
                type="feather"
                color="#FF5252"
                size={20}
                style={{ marginRight: 8 }}
              />
            )
          }
          iconPosition="left"
          type="outline"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  compactAvatar: {
    marginRight: 10,
  },
  compactName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  signOutButton: {
    borderColor: '#FF5252',
    borderWidth: 1,
    borderRadius: 5,
  },
  signOutButtonText: {
    color: '#FF5252',
    fontSize: 16,
  },
});