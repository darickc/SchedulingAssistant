import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Icon } from 'react-native-elements';
import { useAuth } from '../contexts/AuthContext';
import { SignInButton } from './SignInButton';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  message?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback,
  message = 'Please sign in to continue' 
}) => {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isSignedIn) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <View style={styles.container}>
        <Icon
          name="lock"
          type="feather"
          size={60}
          color="#ccc"
          containerStyle={styles.icon}
        />
        <Text style={styles.message}>{message}</Text>
        <View style={styles.signInContainer}>
          <SignInButton />
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  icon: {
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  signInContainer: {
    width: '100%',
    maxWidth: 300,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});