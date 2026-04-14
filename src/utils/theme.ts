import { UserRole } from '../types';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  bg: string;
  accent: string;
  text: string;
  border: string;
  ring: string;
}

export const getRoleTheme = (role: UserRole): ThemeColors => {
  switch (role) {
    case 'admin':
      return {
        primary: '#6366f1', // Indigo 500
        primaryLight: '#eef2ff', // Indigo 50
        primaryDark: '#4338ca', // Indigo 700
        bg: '#f8fafc',
        accent: '#818cf8',
        text: '#1e1b4b',
        border: '#e2e8f0',
        ring: 'ring-indigo-500/20',
      };
    case 'institution':
      return {
        primary: '#10b981', // Emerald 500
        primaryLight: '#ecfdf5', // Emerald 50
        primaryDark: '#047857', // Emerald 700
        bg: '#f8fafc',
        accent: '#34d399',
        text: '#064e3b',
        border: '#e2e8f0',
        ring: 'ring-emerald-500/20',
      };
    default: // partner / recruiter
      return {
        primary: '#0071e3', // Apple Blue
        primaryLight: '#f5faff', // Very light blue
        primaryDark: '#005bb7',
        bg: '#f8fafc',
        accent: '#40a9ff',
        text: '#001d3d',
        border: '#e2e8f0',
        ring: 'ring-blue-500/20',
      };
  }
};
