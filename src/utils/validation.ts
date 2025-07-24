// Input validation and sanitization utilities

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationSchema {
  [key: string]: FieldValidation;
}

// Core validation functions
export const isRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value != null && value !== undefined;
};

export const isEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const isPhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Must be at least 10 digits
  return digits.length >= 10;
};

export const isValidName = (name: string): boolean => {
  // Must contain at least one letter and be between 1-100 characters
  const nameRegex = /^[a-zA-Z\s\-'\.]{1,100}$/;
  return nameRegex.test(name.trim()) && name.trim().length > 0;
};

export const isValidNotes = (notes: string): boolean => {
  // Notes can be empty or up to 1000 characters
  return notes.length <= 1000;
};

// Sanitization functions
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizePhoneNumber = (phone: string): string => {
  // Keep only digits, spaces, parentheses, and hyphens
  return phone.replace(/[^\d\s\(\)\-]/g, '').trim();
};

export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

// Contact validation
export const validateContact = (contact: {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}): ValidationResult => {
  const errors: string[] = [];

  // Validate name
  if (!isRequired(contact.name)) {
    errors.push('Name is required');
  } else if (!isValidName(contact.name)) {
    errors.push('Name must contain only letters, spaces, hyphens, apostrophes, and periods');
  }

  // Validate phone
  if (!isRequired(contact.phone)) {
    errors.push('Phone number is required');
  } else if (!isPhoneNumber(contact.phone)) {
    errors.push('Phone number must be at least 10 digits');
  }

  // Validate email (optional)
  if (contact.email && contact.email.trim().length > 0) {
    if (!isEmail(contact.email)) {
      errors.push('Please enter a valid email address');
    }
  }

  // Validate notes (optional)
  if (contact.notes && !isValidNotes(contact.notes)) {
    errors.push('Notes must be less than 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Leader validation
export const validateLeader = (leader: {
  name: string;
  role: string;
  email: string;
  calendarId: string;
}): ValidationResult => {
  const errors: string[] = [];

  // Validate name
  if (!isRequired(leader.name)) {
    errors.push('Leader name is required');
  } else if (!isValidName(leader.name)) {
    errors.push('Leader name must contain only letters, spaces, hyphens, apostrophes, and periods');
  }

  // Validate role
  if (!isRequired(leader.role)) {
    errors.push('Role is required');
  } else if (leader.role.trim().length < 2 || leader.role.trim().length > 50) {
    errors.push('Role must be between 2 and 50 characters');
  }

  // Validate email
  if (!isRequired(leader.email)) {
    errors.push('Email is required');
  } else if (!isEmail(leader.email)) {
    errors.push('Please enter a valid email address');
  }

  // Validate calendar ID
  if (!isRequired(leader.calendarId)) {
    errors.push('Calendar ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Appointment type validation
export const validateAppointmentType = (appointmentType: {
  name: string;
  durationMinutes: number;
  template: string;
}): ValidationResult => {
  const errors: string[] = [];

  // Validate name
  if (!isRequired(appointmentType.name)) {
    errors.push('Appointment type name is required');
  } else if (appointmentType.name.trim().length < 2 || appointmentType.name.trim().length > 50) {
    errors.push('Appointment type name must be between 2 and 50 characters');
  }

  // Validate duration
  if (!appointmentType.durationMinutes || appointmentType.durationMinutes < 5) {
    errors.push('Duration must be at least 5 minutes');
  } else if (appointmentType.durationMinutes > 480) {
    errors.push('Duration cannot exceed 8 hours (480 minutes)');
  }

  // Validate template
  if (!isRequired(appointmentType.template)) {
    errors.push('Message template is required');
  } else if (appointmentType.template.trim().length < 10) {
    errors.push('Message template must be at least 10 characters');
  } else if (appointmentType.template.trim().length > 500) {
    errors.push('Message template must be less than 500 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Message template validation
export const validateMessageTemplate = (template: {
  name: string;
  template: string;
}): ValidationResult => {
  const errors: string[] = [];

  // Validate name
  if (!isRequired(template.name)) {
    errors.push('Template name is required');
  } else if (template.name.trim().length < 2 || template.name.trim().length > 50) {
    errors.push('Template name must be between 2 and 50 characters');
  }

  // Validate template content
  if (!isRequired(template.template)) {
    errors.push('Template content is required');
  } else if (template.template.trim().length < 10) {
    errors.push('Template content must be at least 10 characters');
  } else if (template.template.trim().length > 500) {
    errors.push('Template content must be less than 500 characters');
  }

  // Check for required template variables
  const requiredVariables = ['{name}', '{leader}'];
  const missingVariables = requiredVariables.filter(
    variable => !template.template.includes(variable)
  );

  if (missingVariables.length > 0) {
    errors.push(`Template must include: ${missingVariables.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Date/time validation
export const validateAppointmentTime = (scheduledTime: Date): ValidationResult => {
  const errors: string[] = [];
  const now = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);

  // Must be in the future
  if (scheduledTime <= now) {
    errors.push('Appointment time must be in the future');
  }

  // Must be within one year
  if (scheduledTime > oneYearFromNow) {
    errors.push('Appointment time cannot be more than one year in the future');
  }

  // Check for reasonable business hours (optional warning)
  const hour = scheduledTime.getHours();
  if (hour < 8 || hour > 20) {
    // This could be a warning rather than an error
    // For now, we'll allow it but could add a warnings array to ValidationResult
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Generic form validation
export const validateForm = (data: Record<string, any>, schema: ValidationSchema): ValidationResult => {
  const errors: string[] = [];

  Object.entries(schema).forEach(([field, rules]) => {
    const value = data[field];

    // Check required
    if (rules.required && !isRequired(value)) {
      errors.push(`${field} is required`);
      return;
    }

    // Skip further validation if field is empty and not required
    if (!isRequired(value) && !rules.required) {
      return;
    }

    const stringValue = String(value);

    // Check min length
    if (rules.minLength && stringValue.length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters`);
    }

    // Check max length
    if (rules.maxLength && stringValue.length > rules.maxLength) {
      errors.push(`${field} must be less than ${rules.maxLength} characters`);
    }

    // Check pattern
    if (rules.pattern && !rules.pattern.test(stringValue)) {
      errors.push(`${field} format is invalid`);
    }

    // Check custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Sanitize contact input
export const sanitizeContactInput = (contact: {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}) => ({
  name: sanitizeString(contact.name),
  phone: sanitizePhoneNumber(contact.phone),
  email: contact.email ? sanitizeEmail(contact.email) : '',
  notes: contact.notes ? sanitizeString(contact.notes) : '',
});

// Sanitize leader input
export const sanitizeLeaderInput = (leader: {
  name: string;
  role: string;
  email: string;
  calendarId: string;
}) => ({
  name: sanitizeString(leader.name),
  role: sanitizeString(leader.role),
  email: sanitizeEmail(leader.email),
  calendarId: sanitizeString(leader.calendarId),
});

// Export validation utilities
export const ValidationUtils = {
  isRequired,
  isEmail,
  isPhoneNumber,
  isValidName,
  isValidNotes,
  sanitizeString,
  sanitizePhoneNumber,
  sanitizeEmail,
  validateContact,
  validateLeader,
  validateAppointmentType,
  validateMessageTemplate,
  validateAppointmentTime,
  validateForm,
  sanitizeContactInput,
  sanitizeLeaderInput,
};