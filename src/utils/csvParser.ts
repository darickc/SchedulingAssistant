import { CreateContactInput, ContactImportResult } from '../types';

// CSV field mappings - maps common CSV headers to our Contact fields
const CSV_FIELD_MAPPINGS: Record<string, keyof CreateContactInput> = {
  // Name variations
  'name': 'name',
  'full name': 'name',
  'fullname': 'name',
  'contact name': 'name',
  'member name': 'name',
  'person': 'name',
  'first name': 'name', // Will be combined with last name if present
  'last name': 'name',  // Will be combined with first name if present
  
  // Phone variations
  'phone': 'phone',
  'phone number': 'phone',
  'phonenumber': 'phone',
  'mobile': 'phone',
  'mobile number': 'phone',
  'cell': 'phone',
  'cell phone': 'phone',
  'cellphone': 'phone',
  'telephone': 'phone',
  'contact number': 'phone',
  
  // Email variations
  'email': 'email',
  'email address': 'email',
  'emailaddress': 'email',
  'e-mail': 'email',
  'mail': 'email',
  
  // Notes variations
  'notes': 'notes',
  'note': 'notes',
  'comments': 'notes',
  'comment': 'notes',
  'remarks': 'notes',
  'description': 'notes',
};

// Phone number formatting function
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // US phone number formatting
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // Remove country code and format
    const withoutCountry = cleaned.slice(1);
    return `(${withoutCountry.slice(0, 3)}) ${withoutCountry.slice(3, 6)}-${withoutCountry.slice(6)}`;
  }
  
  // Return original if not standard format
  return phone;
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Parse CSV content
export async function parseContactsCSV(csvContent: string): Promise<ContactImportResult> {
  const result: ContactImportResult = {
    successful: [],
    failed: [],
    duplicates: []
  };

  try {
    // Split by lines, handling different line endings
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must contain headers and at least one data row');
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    
    // Create field mapping based on detected headers
    const fieldMapping: Record<number, keyof CreateContactInput | 'firstName' | 'lastName'> = {};
    let hasFirstName = false;
    let hasLastName = false;
    
    headers.forEach((header, index) => {
      if (header === 'first name' || header === 'firstname') {
        fieldMapping[index] = 'firstName';
        hasFirstName = true;
      } else if (header === 'last name' || header === 'lastname') {
        fieldMapping[index] = 'lastName';
        hasLastName = true;
      } else if (CSV_FIELD_MAPPINGS[header]) {
        fieldMapping[index] = CSV_FIELD_MAPPINGS[header];
      }
    });

    // Check if we have required fields
    const hasMappedName = Object.values(fieldMapping).includes('name') || (hasFirstName && hasLastName);
    const hasMappedPhone = Object.values(fieldMapping).includes('phone');
    
    if (!hasMappedName) {
      throw new Error('CSV must contain a name column (or first name and last name columns)');
    }
    
    if (!hasMappedPhone) {
      throw new Error('CSV must contain a phone number column');
    }

    // Process data rows
    for (let rowIndex = 1; rowIndex < lines.length; rowIndex++) {
      const line = lines[rowIndex].trim();
      if (!line) continue; // Skip empty lines
      
      try {
        const values = parseCSVLine(line);
        const contact: any = {};
        let firstName = '';
        let lastName = '';

        // Map values to contact fields
        values.forEach((value, index) => {
          const field = fieldMapping[index];
          if (field) {
            const trimmedValue = value.trim();
            if (field === 'firstName') {
              firstName = trimmedValue;
            } else if (field === 'lastName') {
              lastName = trimmedValue;
            } else {
              contact[field] = trimmedValue;
            }
          }
        });

        // Combine first and last name if needed
        if (!contact.name && (firstName || lastName)) {
          contact.name = `${firstName} ${lastName}`.trim();
        }

        // Validate required fields
        if (!contact.name || !contact.phone) {
          result.failed.push({
            row: rowIndex + 1,
            data: values,
            error: 'Missing required fields (name and phone)'
          });
          continue;
        }

        // Format phone number
        contact.phone = formatPhoneNumber(contact.phone);

        // Validate email if present
        if (contact.email && !isValidEmail(contact.email)) {
          result.failed.push({
            row: rowIndex + 1,
            data: values,
            error: 'Invalid email address'
          });
          continue;
        }

        // Add to successful imports
        result.successful.push(contact as CreateContactInput);

      } catch (error) {
        result.failed.push({
          row: rowIndex + 1,
          data: line,
          error: error instanceof Error ? error.message : 'Failed to parse row'
        });
      }
    }

    return result;

  } catch (error) {
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Parse a single CSV line, handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  
  return result;
}

// Export contacts to CSV
export function exportContactsToCSV(contacts: CreateContactInput[]): string {
  const headers = ['Name', 'Phone', 'Email', 'Notes'];
  const rows = [headers.join(',')];
  
  contacts.forEach(contact => {
    const row = [
      escapeCSVValue(contact.name),
      escapeCSVValue(contact.phone),
      escapeCSVValue(contact.email || ''),
      escapeCSVValue(contact.notes || '')
    ];
    rows.push(row.join(','));
  });
  
  return rows.join('\n');
}

// Escape CSV values that contain commas, quotes, or newlines
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Escape quotes by doubling them
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return value;
}