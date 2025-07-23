import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, GoogleUser } from '../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: GoogleUser | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const signedIn = await AuthService.isSignedIn();
      setIsSignedIn(signedIn);

      if (signedIn) {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsSignedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async () => {
    try {
      setIsLoading(true);
      const googleUser = await AuthService.signIn();
      setUser(googleUser);
      setIsSignedIn(true);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await AuthService.signOut();
      setUser(null);
      setIsSignedIn(false);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isSignedIn,
    signIn,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isSignedIn, isLoading } = useAuth();

    if (isLoading) {
      // You can return a loading component here
      return null;
    }

    if (!isSignedIn) {
      // You can redirect to login or show a sign-in prompt
      return null;
    }

    return <Component {...props} />;
  };
};