
export enum UserRole {
  ASHA = 'ASHA',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT'
}

export enum RiskLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  location: string;
  phone: string;
  vitals?: {
    temp: number;
    bp: string;
    pulse: number;
  };
  lastVisit?: string;
  conditions?: string[];
}

export interface Task {
  id: string;
  title: string;
  patientName: string;
  patientId: string;
  type: 'PREGNANCY' | 'BABY' | 'MEDICINE' | 'FEVER' | 'ELDERLY';
  priority: RiskLevel;
  time: string;
  completed: boolean;
  address: string;
}

export interface SymptomAssessment {
  patientId: string;
  symptoms: string[];
  duration: string;
  risk: RiskLevel;
  diagnosis: string;
  recommendations: string[];
  voiceNoteUrl?: string;
}
