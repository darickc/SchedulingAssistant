import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { parseContactsCSV } from './csvParser';
import { ContactImportResult } from '../types';

export interface DocumentPickerResult {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

export interface CSVImportOptions {
  onProgress?: (progress: number) => void;
  maxFileSize?: number; // in bytes, default 5MB
}

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function pickCSVFile(): Promise<DocumentPickerResult | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/csv', 'text/plain'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    
    return {
      uri: asset.uri,
      name: asset.name,
      size: asset.size,
      mimeType: asset.mimeType,
    };
  } catch (error) {
    console.error('Error picking document:', error);
    throw new Error('Failed to pick CSV file');
  }
}

export async function readCSVFile(uri: string, options?: CSVImportOptions): Promise<string> {
  try {
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    
    if (!fileInfo.exists) {
      throw new Error('File not found');
    }

    // Check file size
    const maxSize = options?.maxFileSize || DEFAULT_MAX_FILE_SIZE;
    if (fileInfo.size && fileInfo.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
    }

    // Read file content
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return content;
  } catch (error) {
    console.error('Error reading CSV file:', error);
    throw new Error(`Failed to read CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function importContactsFromCSV(
  uri: string,
  options?: CSVImportOptions
): Promise<ContactImportResult> {
  try {
    // Update progress
    options?.onProgress?.(10);

    // Read the file
    const csvContent = await readCSVFile(uri, options);
    
    // Update progress
    options?.onProgress?.(30);

    // Parse the CSV
    const importResult = await parseContactsCSV(csvContent);
    
    // Update progress
    options?.onProgress?.(90);

    return importResult;
  } catch (error) {
    console.error('Error importing contacts from CSV:', error);
    throw error;
  }
}

// Export contacts to CSV file and share
export async function exportContactsToFile(csvContent: string, filename: string = 'contacts.csv'): Promise<string> {
  try {
    // Create file path in cache directory
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    
    // Write CSV content to file
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return fileUri;
  } catch (error) {
    console.error('Error exporting contacts to file:', error);
    throw new Error('Failed to export contacts');
  }
}

// Clean up temporary files
export async function cleanupTempFiles(): Promise<void> {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) return;

    const files = await FileSystem.readDirectoryAsync(cacheDir);
    
    // Delete CSV files
    const csvFiles = files.filter(file => file.endsWith('.csv'));
    
    await Promise.all(
      csvFiles.map(file => 
        FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true })
      )
    );
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
}