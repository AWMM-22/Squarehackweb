
export enum UserRole {
  RURAL = 'RURAL',
  ASHA = 'ASHA',
  DOCTOR = 'DOCTOR',
}

export type CaseStatus = 'PENDING' | 'RESPONDED';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type ReferralStatus = 'REFERRED' | 'REACHED_FACILITY' | 'DIAGNOSED' | 'FOLLOW_UP_PENDING' | 'CLOSED';
export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface AppUser {
  id: string;
  role: UserRole;
  phone: string;
  name: string;
  createdAt: string;
  faceTemplateEnc?: string;
  faceSalt?: string;
}

export interface ConsultationCase {
  id: string;
  patientPhone: string;
  patientName: string;
  summary: string;
  followUpAnswers: string[];
  riskLevel?: RiskLevel;
  status: CaseStatus;
  doctorName?: string;
  doctorResponse?: string;
  doctorPrescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AshaTask {
  id: string;
  household: string;
  title: string;
  dueDate: string;
  completed: boolean;
  priority: TaskPriority;
}

export interface FamilyMember {
  id: string;
  ownerPhone: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  relation: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  count: number;
  total: number;
}

export interface AssessmentRecord {
  id: string;
  patientPhone: string;
  patientName: string;
  symptoms: string[];
  riskLevel: RiskLevel;
  diagnosis: string;
  recommendations: string[];
  createdAt: string;
}

export interface NutritionAdvice {
  summary: string;
  tips: string[];
}

export interface SyncQueueItem {
  id: string;
  actionType: string;
  entityType: string;
  payloadSummary: string;
  status: SyncStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralRecord {
  id: string;
  household: string;
  patientName: string;
  reason: string;
  riskLevel: RiskLevel;
  status: ReferralStatus;
  facilityName: string;
  transportMode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VitalRecord {
  id: string;
  household: string;
  patientName: string;
  bpSystolic: number;
  bpDiastolic: number;
  pulse: number;
  temperatureC: number;
  spo2: number;
  weightKg?: number;
  muacCm?: number;
  createdAt: string;
}

export interface AdherencePlan {
  id: string;
  household: string;
  patientName: string;
  condition: string;
  medicineName: string;
  doseSchedule: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface AdherenceLog {
  id: string;
  planId: string;
  date: string;
  taken: boolean;
  createdAt: string;
}

export interface MicroPlanEvent {
  id: string;
  eventType: 'VHND' | 'ANC' | 'IMMUNIZATION' | 'HOME_VISIT' | 'OTHER';
  title: string;
  household?: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

export interface ConsentRecord {
  id: string;
  household: string;
  patientName: string;
  faceConsent: boolean;
  audioConsent: boolean;
  clinicalConsent: boolean;
  updatedAt: string;
}

export interface EmergencyActionLog {
  id: string;
  household: string;
  patientName: string;
  actionType: 'AMBULANCE_CALL' | 'PHC_CALL' | 'CASE_SHARED';
  note?: string;
  createdAt: string;
}

export interface HouseholdTimelineEntry {
  id: string;
  household: string;
  patientName: string;
  entryType:
    | 'VISIT'
    | 'TRIAGE'
    | 'VITALS'
    | 'REFERRAL'
    | 'ADHERENCE'
    | 'CONSENT'
    | 'EMERGENCY'
    | 'COUNSELING';
  summary: string;
  details?: string;
  createdAt: string;
}

export interface RuralMedicationPlan {
  id: string;
  ownerPhone: string;
  patientName: string;
  medicineName: string;
  schedule: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface RuralMedicationLog {
  id: string;
  planId: string;
  ownerPhone: string;
  date: string;
  taken: boolean;
  createdAt: string;
}

export interface RuralRecordDocument {
  id: string;
  ownerPhone: string;
  patientName: string;
  docType: 'PRESCRIPTION' | 'LAB_REPORT' | 'DISCHARGE_SUMMARY' | 'OTHER';
  title: string;
  fileUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface RuralPregnancyTracker {
  id: string;
  ownerPhone: string;
  motherName: string;
  lmpDate: string;
  expectedDeliveryDate: string;
  ancVisitsCompleted: number;
  highRisk: boolean;
  notes?: string;
  updatedAt: string;
}

export interface RuralNewbornTracker {
  id: string;
  ownerPhone: string;
  babyName: string;
  dob: string;
  weightKg?: number;
  breastfeedingStatus: 'EXCLUSIVE' | 'MIXED' | 'FORMULA';
  warningFlags: string[];
  updatedAt: string;
}

export interface RuralImmunizationRecord {
  id: string;
  ownerPhone: string;
  childName: string;
  vaccineName: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface RuralTeleconsultRequest {
  id: string;
  ownerPhone: string;
  patientName: string;
  summary: string;
  voiceNoteText?: string;
  status: 'SENT' | 'VIEWED' | 'RESPONDED' | 'FOLLOW_UP';
  createdAt: string;
  updatedAt: string;
}

export interface RuralPrivacySettings {
  id: string;
  ownerPhone: string;
  shareWithAsha: boolean;
  shareWithDoctor: boolean;
  allowVoiceStorage: boolean;
  allowFaceStorage: boolean;
  updatedAt: string;
}
