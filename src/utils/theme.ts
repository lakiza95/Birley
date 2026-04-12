import { UserRole } from '../types';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  bg: string;
}

export const getRoleTheme = (role: UserRole): ThemeColors => {
  switch (role) {
    case 'admin':
      return {
        primary: '#5B21B6', // Purple 800
        primaryLight: '#EDE9FE', // Purple 100
        bg: '#F9FAFB',
      };
    case 'institution':
      return {
        primary: '#064E3B', // Emerald 900 (Darker)
        primaryLight: '#D1FAE5', // Emerald 100
        bg: '#F0FDFA', // Slightly darker/tinted background
      };
    default: // partner / recruiter
      return {
        primary: '#4338CA', // Indigo 700
        primaryLight: '#EEF2FF', // Indigo 50
        bg: '#F9FAFB',
      };
  }
};
