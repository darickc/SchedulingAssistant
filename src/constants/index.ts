export const Colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#5AC8FA',
  light: '#F2F2F7',
  dark: '#1C1C1E',
  gray: '#8E8E93',
  white: '#FFFFFF',
  black: '#000000',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const defaultMessageTemplates = [
  {
    name: 'Generic Meeting',
    template: 'Brother/Sister {name}, can you meet with {leader} this {day} at {time}?',
  },
  {
    name: 'Temple Recommend Interview',
    template: 'Brother/Sister {name}, your temple recommend has expired or is about to expire. Can you meet with {leader} for a temple recommend interview this {day} at {time}?',
  },
  {
    name: 'Ministering Interview',
    template: 'Brother/Sister {name}, {leader} would like to meet with you for a ministering interview. Are you available this {day} at {time}?',
  },
  {
    name: 'Youth Interview',
    template: 'Hi {name}, {leader} would like to meet with you for a youth interview. Can you come this {day} at {time}?',
  },
  {
    name: 'Calling Interview',
    template: 'Brother/Sister {name}, can you meet with {leader} this {day} at {time} to discuss a calling opportunity?',
  },
  {
    name: 'Tithing Settlement',
    template: 'Brother/Sister {name}, it\'s time for your annual tithing settlement. Can you meet with {leader} this {day} at {time}?',
  },
];

export const DefaultAppointmentTypes = [
  {
    name: 'Generic Meeting',
    durationMinutes: 15,
    template: 'Brother/Sister {name}, can you meet with {leader} this {day} at {time}?',
    color: Colors.primary,
  },
  {
    name: 'Temple Recommend Interview',
    durationMinutes: 10,
    template: 'Brother/Sister {name}, your temple recommend has expired or is about to expire. Can you meet with {leader} for a temple recommend interview this {day} at {time}?',
    color: Colors.success,
  },
  {
    name: 'Ministering Interview',
    durationMinutes: 20,
    template: 'Brother/Sister {name}, {leader} would like to meet with you for a ministering interview. Are you available this {day} at {time}?',
    color: Colors.info,
  },
  {
    name: 'Youth Interview',
    durationMinutes: 15,
    template: 'Hi {name}, {leader} would like to meet with you for a youth interview. Can you come this {day} at {time}?',
    color: Colors.secondary,
  },
];