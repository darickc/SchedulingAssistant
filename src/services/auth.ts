import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

// Constants for storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: '@auth_access_token',
  REFRESH_TOKEN: '@auth_refresh_token',
  USER_INFO: '@auth_user_info',
  TOKEN_EXPIRY: '@auth_token_expiry',
};

// Google OAuth configuration
export interface GoogleAuthConfig {
  expoClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
  webClientId?: string;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export class AuthService {
  private static config: GoogleAuthConfig = {
    // These will need to be filled in with actual client IDs from Google Cloud Console
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  };

  /**
   * Initialize Google Sign-In with proper configuration
   */
  static async initialize(config?: GoogleAuthConfig): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Sign in with Google and get user information
   */
  static async signIn(): Promise<GoogleUser> {
    try {
      // Always use proxy for Expo Go development
      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
      });
      
      console.log('Generated redirect URI:', redirectUri);

      // Get client ID
      const clientId = this.getClientId();
      console.log('Using client ID:', clientId);
      
      // Generate a random state for security
      const state = Math.random().toString(36).substring(7);
      
      // Build the auth URL manually for better control
      const authUrl = 
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('openid profile email https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events')}` +
        `&prompt=select_account` +
        `&access_type=offline` +
        `&state=${state}`;

      console.log('Opening auth URL...');
      
      // Open the auth session
      const result = await AuthSession.startAsync({
        authUrl,
        returnUrl: redirectUri,
      });

      console.log('Auth result:', result.type);
      if (result.type === 'error') {
        console.error('Auth error:', result);
        throw new Error(`Authentication error: ${result.errorCode}`);
      }
      
      if (result.type === 'success' && result.params) {
        console.log('Auth success, params:', Object.keys(result.params));
        
        let accessToken: string | undefined;
        let refreshToken: string | undefined;
        let expiresIn: number | undefined;

        // Handle authorization code response
        if (result.params.code) {
          console.log('Exchanging authorization code for tokens...');
          
          // Exchange code for tokens
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              code: result.params.code,
              client_id: clientId,
              redirect_uri: redirectUri,
              grant_type: 'authorization_code',
            }).toString(),
          });

          if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token exchange failed:', errorText);
            throw new Error('Failed to exchange authorization code for tokens');
          }

          const tokenData = await tokenResponse.json();
          accessToken = tokenData.access_token;
          refreshToken = tokenData.refresh_token;
          expiresIn = tokenData.expires_in;
        }

        if (!accessToken) {
          throw new Error('No access token received');
        }

        // Store tokens
        await this.storeTokens({
          accessToken,
          refreshToken: refreshToken || undefined,
          expiresIn,
        });

        // Fetch user info
        const userInfo = await this.fetchUserInfo(accessToken);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));

        return userInfo;
      } else if (result.type === 'cancel') {
        throw new Error('Authentication cancelled');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign out and clear all stored authentication data
   */
  static async signOut(): Promise<void> {
    try {
      // Clear all stored auth data
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_INFO,
        STORAGE_KEYS.TOKEN_EXPIRY,
      ]);

      // If using expo-auth-session, we might need to revoke the token
      const accessToken = await this.getAccessToken();
      if (accessToken) {
        await this.revokeToken(accessToken);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get the current access token, refreshing if necessary
   */
  static async getAccessToken(): Promise<string | null> {
    try {
      const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const expiryStr = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);

      if (!accessToken) {
        return null;
      }

      // Check if token is expired
      if (expiryStr) {
        const expiry = parseInt(expiryStr);
        const now = Date.now();
        
        // Refresh if token expires in less than 5 minutes
        if (expiry - now < 5 * 60 * 1000) {
          return await this.refreshToken();
        }
      }

      return accessToken;
    } catch (error) {
      console.error('Get access token error:', error);
      return null;
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  static async refreshToken(): Promise<string> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.getClientId(),
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }).toString(),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      await this.storeTokens({
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      });

      return data.access_token;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  }

  /**
   * Get the currently signed-in user
   */
  static async getCurrentUser(): Promise<GoogleUser | null> {
    try {
      const userInfoStr = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
      if (!userInfoStr) {
        return null;
      }
      return JSON.parse(userInfoStr);
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Check if user is signed in
   */
  static async isSignedIn(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    const user = await this.getCurrentUser();
    return !!(accessToken && user);
  }

  /**
   * Fetch user information from Google
   */
  private static async fetchUserInfo(accessToken: string): Promise<GoogleUser> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const data = await response.json();
      
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
      };
    } catch (error) {
      console.error('Fetch user info error:', error);
      throw error;
    }
  }

  /**
   * Store authentication tokens
   */
  private static async storeTokens(tokens: AuthTokens): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    
    if (tokens.refreshToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    }
    
    if (tokens.expiresIn) {
      const expiry = Date.now() + tokens.expiresIn * 1000;
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString());
    }
  }

  /**
   * Revoke a token (sign out from Google)
   */
  private static async revokeToken(token: string): Promise<void> {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Revoke token error:', error);
      // Continue with sign out even if revoke fails
    }
  }

  /**
   * Get the appropriate client ID based on platform
   * For Expo Go development, always use web client ID with auth proxy
   */
  private static getClientId(): string {
    // For Expo Go development, always use web client ID
    if (this.config.webClientId) {
      return this.config.webClientId;
    } else if (this.config.expoClientId) {
      return this.config.expoClientId;
    } else if (Platform.OS === 'ios' && this.config.iosClientId) {
      return this.config.iosClientId;
    } else if (Platform.OS === 'android' && this.config.androidClientId) {
      return this.config.androidClientId;
    }
    
    throw new Error('No client ID configured for current platform');
  }
}