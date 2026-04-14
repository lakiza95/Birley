import { Student, Activity, ActionItem, School } from './types';

export const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Ana Sousa',
    email: 'ana.sousa@example.com',
    country: 'Portugal',
    program: 'BSc Management',
    status: 'Application started',
    avatar: 'https://i.pravatar.cc/150?u=ana',
    documents: [
      { name: 'Passport', status: 'uploaded' },
      { name: 'Transcript', status: 'uploaded' },
      { name: 'NIF', status: 'missing' },
    ],
    preferences: {
      budget: 15000,
      languageLevels: [
        { language: 'English', level: 'C1' },
        { language: 'Portuguese', level: 'Native' },
      ],
    },
  },
  {
    id: '2',
    name: 'Carlos Lima',
    email: 'carlos.lima@example.com',
    country: 'Brazil',
    program: 'MSc Data Science',
    status: 'Application started',
    avatar: 'https://i.pravatar.cc/150?u=carlos',
    documents: [
      { name: 'Passport', status: 'uploaded' },
      { name: 'Bachelor Degree', status: 'uploaded' },
    ],
    preferences: {
      budget: 25000,
      languageLevels: [
        { language: 'English', level: 'B2' },
        { language: 'Portuguese', level: 'Native' },
      ],
    },
  },
  {
    id: '3',
    name: 'Sofia Martins',
    email: 'sofia.martins@example.com',
    country: 'Portugal',
    program: 'BSc Economics',
    status: 'Done',
    avatar: 'https://i.pravatar.cc/150?u=sofia',
    documents: [
      { name: 'Passport', status: 'uploaded' },
      { name: 'High School Diploma', status: 'uploaded' },
    ],
    preferences: {
      budget: 12000,
      languageLevels: [
        { language: 'English', level: 'C1' },
      ],
    },
  },
];

export const mockActivities: Activity[] = [
  {
    id: '1',
    studentName: 'Sofia Martins',
    action: 'Status changed to "Accepted"',
    timestamp: '2 hours ago',
    type: 'success',
  },
  {
    id: '2',
    studentName: 'Ricardo Santos',
    action: 'New message received from admissions',
    timestamp: '4 hours ago',
    type: 'info',
  },
  {
    id: '3',
    studentName: 'Beatriz Oliveira',
    action: 'Document uploaded: Passport copy',
    timestamp: 'Yesterday',
    type: 'warning',
  },
  {
    id: '4',
    studentName: 'Tiago Almeida',
    action: 'Application submitted successfully',
    timestamp: '2 days ago',
    type: 'info',
  },
];

export const mockActionItems: ActionItem[] = [
  {
    id: '1',
    title: 'CESAE requested NIF for Ana Sousa',
    description: 'Document required to proceed with enrollment process',
    type: 'missing_doc',
    studentName: 'Ana Sousa',
    actionLabel: 'Upload document',
  },
  {
    id: '2',
    title: 'Facultét response deadline in 2 days for Carlos Lima',
    description: 'Urgent: School awaiting response to proceed with application',
    type: 'deadline',
    studentName: 'Carlos Lima',
    actionLabel: 'Send reminder',
  },
  {
    id: '3',
    title: 'João Ferreira accepted! Confirm enrollment',
    description: 'Congratulations! Student accepted at Instituto Politécnico de Lisboa',
    type: 'enrollment',
    studentName: 'João Ferreira',
    actionLabel: 'Confirm',
  },
];

export const mockSchools: School[] = [
  {
    id: '1',
    name: 'Católica Lisbon',
    location: 'Lisbon, Portugal',
    image: 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=400&h=300&auto=format&fit=crop',
    programs: ['BSc Management', 'MSc Finance', 'The Lisbon MBA'],
  },
  {
    id: '2',
    name: 'NOVA SBE',
    location: 'Carcavelos, Portugal',
    image: 'https://images.unsplash.com/photo-1523050853064-8521a39983b9?q=80&w=400&h=300&auto=format&fit=crop',
    programs: ['BSc Economics', 'International MSc in Management'],
  },
  {
    id: '3',
    name: 'ISEG Lisbon',
    location: 'Lisbon, Portugal',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=400&h=300&auto=format&fit=crop',
    programs: ['BSc Economics', 'MSc Applied Econometrics'],
  },
  {
    id: '4',
    name: 'ISCTE Business School',
    location: 'Lisbon, Portugal',
    image: 'https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?q=80&w=400&h=300&auto=format&fit=crop',
    programs: ['MSc in Business Administration', 'BSc in Management'],
  },
  {
    id: '5',
    name: 'Porto Business School',
    location: 'Porto, Portugal',
    image: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?q=80&w=400&h=300&auto=format&fit=crop',
    programs: ['The Magellan MBA', 'MSc in Finance'],
  },
  {
    id: '6',
    name: 'University of Coimbra',
    location: 'Coimbra, Portugal',
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=400&h=300&auto=format&fit=crop',
    programs: ['BSc Law', 'MSc Psychology'],
  },
];
