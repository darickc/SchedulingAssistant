import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Button, Icon } from 'react-native-elements';
import { useAuth } from '../contexts/AuthContext';

interface SignInButtonProps {
  onSuccess?: () => void;
  fullWidth?: boolean;
}

export const SignInButton: React.FC<SignInButtonProps> = ({ onSuccess, fullWidth = true }) => {
  const { signIn, isLoading: authLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signIn();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      Alert.alert(
        'Sign In Failed',
        error.message || 'Unable to sign in with Google. Please try again.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const isLoading = authLoading || isSigningIn;

  return (
    <View style={[styles.container, !fullWidth && styles.inline]}>
      <Button
        title={isLoading ? '' : 'Sign in with Google'}
        onPress={handleSignIn}
        disabled={isLoading}
        buttonStyle={[styles.button, !fullWidth && styles.inlineButton]}
        titleStyle={styles.buttonTitle}
        icon={
          isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Icon
              name="google"
              type="font-awesome-5"
              color="white"
              size={20}
              style={{ marginRight: 10 }}
            />
          )
        }
        iconPosition="left"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inline: {
    width: 'auto',
  },
  button: {
    backgroundColor: '#4285F4',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  inlineButton: {
    paddingHorizontal: 15,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
});