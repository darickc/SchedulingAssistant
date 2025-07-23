import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, DatabaseStats } from '../types';

const STORAGE_KEYS = {
  APP_SETTINGS: '@SchedulingAssistant:app_settings',
  GOOGLE_AUTH_TOKEN: '@SchedulingAssistant:google_auth_token',
  GOOGLE_REFRESH_TOKEN: '@SchedulingAssistant:google_refresh_token',
  USER_PREFERENCES: '@SchedulingAssistant:user_preferences',
  LAST_SYNC: '@SchedulingAssistant:last_sync',
  APP_VERSION: '@SchedulingAssistant:app_version',
  ONBOARDING_COMPLETED: '@SchedulingAssistant:onboarding_completed',
  DATABASE_STATS: '@SchedulingAssistant:database_stats',
} as const;

export class StorageService {
  // App Settings
  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      const settingsJson = JSON.stringify(settings);
      await AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, settingsJson);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw new Error('Failed to save settings to storage');
    }
  }

  static async getSettings(): Promise<AppSettings | null> {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      if (!settingsJson) return null;
      
      return JSON.parse(settingsJson) as AppSettings;
    } catch (error) {
      console.error('Failed to get settings:', error);
      return null;
    }
  }

  // Google Authentication Tokens
  static async saveGoogleAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GOOGLE_AUTH_TOKEN, token);
    } catch (error) {
      console.error('Failed to save Google auth token:', error);
      throw new Error('Failed to save authentication token');
    }
  }

  static async getGoogleAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.GOOGLE_AUTH_TOKEN);
    } catch (error) {
      console.error('Failed to get Google auth token:', error);
      return null;
    }
  }

  static async saveGoogleRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GOOGLE_REFRESH_TOKEN, token);
    } catch (error) {
      console.error('Failed to save Google refresh token:', error);
      throw new Error('Failed to save refresh token');
    }
  }

  static async getGoogleRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.GOOGLE_REFRESH_TOKEN);
    } catch (error) {
      console.error('Failed to get Google refresh token:', error);
      return null;
    }
  }

  static async clearGoogleTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.GOOGLE_AUTH_TOKEN,
        STORAGE_KEYS.GOOGLE_REFRESH_TOKEN
      ]);
    } catch (error) {
      console.error('Failed to clear Google tokens:', error);
      throw new Error('Failed to clear authentication tokens');
    }
  }

  // User Preferences (non-critical settings)
  static async saveUserPreference<T>(key: string, value: T): Promise<void> {
    try {
      const preferences = await this.getUserPreferences();
      const updatedPreferences = {
        ...preferences,
        [key]: value
      };
      
      const preferencesJson = JSON.stringify(updatedPreferences);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, preferencesJson);
    } catch (error) {
      console.error('Failed to save user preference:', error);
      // Don't throw error for non-critical preferences
    }
  }

  static async getUserPreference<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    try {
      const preferences = await this.getUserPreferences();
      return preferences[key] !== undefined ? preferences[key] : defaultValue;
    } catch (error) {
      console.error('Failed to get user preference:', error);
      return defaultValue;
    }
  }

  static async getUserPreferences(): Promise<Record<string, unknown>> {
    try {
      const preferencesJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (!preferencesJson) return {};
      
      return JSON.parse(preferencesJson);
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {};
    }
  }

  // Sync and Version Management
  static async saveLastSyncTime(timestamp: Date): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toISOString());
    } catch (error) {
      console.error('Failed to save last sync time:', error);
    }
  }

  static async getLastSyncTime(): Promise<Date | null> {
    try {
      const timestampString = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (!timestampString) return null;
      
      return new Date(timestampString);
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  static async saveAppVersion(version: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_VERSION, version);
    } catch (error) {
      console.error('Failed to save app version:', error);
    }
  }

  static async getAppVersion(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.APP_VERSION);
    } catch (error) {
      console.error('Failed to get app version:', error);
      return null;
    }
  }

  // Onboarding
  static async setOnboardingCompleted(completed: boolean = true): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, JSON.stringify(completed));
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
    }
  }

  static async isOnboardingCompleted(): Promise<boolean> {
    try {
      const completedString = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      if (!completedString) return false;
      
      return JSON.parse(completedString);
    } catch (error) {
      console.error('Failed to get onboarding status:', error);
      return false;
    }
  }

  // Database Statistics (for dashboard)
  static async saveDatabaseStats(stats: DatabaseStats): Promise<void> {
    try {
      const statsJson = JSON.stringify(stats);
      await AsyncStorage.setItem(STORAGE_KEYS.DATABASE_STATS, statsJson);
    } catch (error) {
      console.error('Failed to save database stats:', error);
    }
  }

  static async getDatabaseStats(): Promise<DatabaseStats | null> {
    try {
      const statsJson = await AsyncStorage.getItem(STORAGE_KEYS.DATABASE_STATS);
      if (!statsJson) return null;
      
      return JSON.parse(statsJson) as DatabaseStats;
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return null;
    }
  }

  // Data Export/Import
  static async exportData(): Promise<string> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const schedulingAssistantKeys = allKeys.filter(key => 
        key.startsWith('@SchedulingAssistant:')
      );
      
      if (schedulingAssistantKeys.length === 0) {
        return JSON.stringify({});
      }
      
      const keyValuePairs = await AsyncStorage.multiGet(schedulingAssistantKeys);
      const exportData: Record<string, string> = {};
      
      keyValuePairs.forEach(([key, value]) => {
        if (value !== null) {
          // Remove sensitive tokens from export
          if (!key.includes('token')) {
            exportData[key] = value;
          }
        }
      });
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Failed to export application data');
    }
  }

  static async importData(dataJson: string): Promise<void> {
    try {
      const importData = JSON.parse(dataJson) as Record<string, string>;
      
      // Validate data structure
      const validKeys = Object.keys(importData).filter(key => 
        key.startsWith('@SchedulingAssistant:') && !key.includes('token')
      );
      
      if (validKeys.length === 0) {
        throw new Error('No valid data found in import file');
      }
      
      // Prepare key-value pairs for import
      const keyValuePairs: [string, string][] = validKeys.map(key => [key, importData[key]]);
      
      // Import data (excluding tokens for security)
      await AsyncStorage.multiSet(keyValuePairs);
      
      console.log(`Imported ${keyValuePairs.length} settings`);
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Failed to import application data');
    }
  }

  // Utility Methods
  static async clearAllData(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const schedulingAssistantKeys = allKeys.filter(key => 
        key.startsWith('@SchedulingAssistant:')
      );
      
      if (schedulingAssistantKeys.length > 0) {
        await AsyncStorage.multiRemove(schedulingAssistantKeys);
      }
      
      console.log('All application data cleared from storage');
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw new Error('Failed to clear application data');
    }
  }

  static async getStorageInfo(): Promise<{
    totalKeys: number;
    appKeys: number;
    estimatedSizeKB: number;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter(key => key.startsWith('@SchedulingAssistant:'));
      
      let estimatedSize = 0;
      if (appKeys.length > 0) {
        const keyValuePairs = await AsyncStorage.multiGet(appKeys);
        estimatedSize = keyValuePairs.reduce((total, [key, value]) => {
          return total + key.length + (value?.length || 0);
        }, 0);
      }
      
      return {
        totalKeys: allKeys.length,
        appKeys: appKeys.length,
        estimatedSizeKB: Math.round(estimatedSize / 1024 * 100) / 100
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        totalKeys: 0,
        appKeys: 0,
        estimatedSizeKB: 0
      };
    }
  }

  // Migration helpers
  static async migrateData(fromVersion: string, toVersion: string): Promise<void> {
    try {
      console.log(`Migrating data from version ${fromVersion} to ${toVersion}`);
      
      // Add specific migration logic here as needed
      // For example:
      // if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
      //   await this.migrateFromV1_0_0ToV1_1_0();
      // }
      
      await this.saveAppVersion(toVersion);
      console.log('Data migration completed successfully');
    } catch (error) {
      console.error('Failed to migrate data:', error);
      throw new Error('Failed to migrate application data');
    }
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    try {
      const testKey = '@SchedulingAssistant:health_check';
      const testValue = Date.now().toString();
      
      await AsyncStorage.setItem(testKey, testValue);
      const retrievedValue = await AsyncStorage.getItem(testKey);
      await AsyncStorage.removeItem(testKey);
      
      return retrievedValue === testValue;
    } catch (error) {
      console.error('Storage health check failed:', error);
      return false;
    }
  }
}