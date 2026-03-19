import {
  AdherenceLog,
  AdherencePlan,
  AppUser,
  AssessmentRecord,
  AshaTask,
  ConsultationCase,
  ConsentRecord,
  EmergencyActionLog,
  FamilyMember,
  HouseholdTimelineEntry,
  InventoryItem,
  MicroPlanEvent,
  ReferralRecord,
  RiskLevel,
  RuralImmunizationRecord,
  RuralMedicationLog,
  RuralMedicationPlan,
  RuralNewbornTracker,
  RuralPregnancyTracker,
  RuralPrivacySettings,
  RuralRecordDocument,
  RuralTeleconsultRequest,
  SyncQueueItem,
  UserRole,
  VitalRecord,
} from '../types';

const USERS_KEY = 'arogya_v3_users';
const CASES_KEY = 'arogya_v3_cases';
const TASKS_KEY = 'arogya_v3_asha_tasks';
const FAMILY_KEY = 'arogya_v3_family';
const INVENTORY_KEY = 'arogya_v3_inventory';
const ASSESSMENT_KEY = 'arogya_v3_assessments';
const SYNC_QUEUE_KEY = 'arogya_v3_sync_queue';
const REFERRAL_KEY = 'arogya_v3_referrals';
const VITALS_KEY = 'arogya_v3_vitals';
const ADHERENCE_PLAN_KEY = 'arogya_v3_adherence_plans';
const ADHERENCE_LOG_KEY = 'arogya_v3_adherence_logs';
const MICROPLAN_KEY = 'arogya_v3_microplan';
const CONSENT_KEY = 'arogya_v3_consents';
const EMERGENCY_KEY = 'arogya_v3_emergency_logs';
const TIMELINE_KEY = 'arogya_v3_household_timeline';
const RURAL_MED_PLAN_KEY = 'arogya_v3_rural_med_plans';
const RURAL_MED_LOG_KEY = 'arogya_v3_rural_med_logs';
const RURAL_DOC_KEY = 'arogya_v3_rural_docs';
const RURAL_PREGNANCY_KEY = 'arogya_v3_rural_pregnancy';
const RURAL_NEWBORN_KEY = 'arogya_v3_rural_newborn';
const RURAL_IMMUNIZATION_KEY = 'arogya_v3_rural_immunization';
const RURAL_TELECONSULT_KEY = 'arogya_v3_rural_teleconsult';
const RURAL_PRIVACY_KEY = 'arogya_v3_rural_privacy';

const now = () => new Date().toISOString();
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const readList = <T,>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const writeList = <T,>(key: string, value: T[]) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const seedData = () => {
  if (readList<AshaTask>(TASKS_KEY).length === 0) {
    writeList<AshaTask>(TASKS_KEY, [
      {
        id: generateId(),
        household: 'Ward 3 - House 45',
        title: 'Prenatal follow-up visit',
        dueDate: 'Today 10:30 AM',
        completed: false,
        priority: 'HIGH',
      },
      {
        id: generateId(),
        household: 'Ward 2 - House 18',
        title: 'Child immunization reminder',
        dueDate: 'Today 01:00 PM',
        completed: false,
        priority: 'MEDIUM',
      },
      {
        id: generateId(),
        household: 'Ward 1 - House 09',
        title: 'Blood pressure check (elderly)',
        dueDate: 'Tomorrow 09:00 AM',
        completed: false,
        priority: 'LOW',
      },
    ]);
  }

  if (readList<InventoryItem>(INVENTORY_KEY).length === 0) {
    writeList<InventoryItem>(INVENTORY_KEY, [
      { id: generateId(), name: 'ORS Packets', count: 18, total: 50 },
      { id: generateId(), name: 'Paracetamol', count: 44, total: 100 },
      { id: generateId(), name: 'Iron Folic Acid', count: 66, total: 120 },
      { id: generateId(), name: 'Zinc Tablets', count: 11, total: 40 },
    ]);
  }
};

seedData();

const enqueueSyncAction = (payload: {
  actionType: string;
  entityType: string;
  payloadSummary: string;
}) => {
  const list = readList<SyncQueueItem>(SYNC_QUEUE_KEY);
  list.unshift({
    id: generateId(),
    actionType: payload.actionType,
    entityType: payload.entityType,
    payloadSummary: payload.payloadSummary,
    status: 'PENDING',
    attempts: 0,
    createdAt: now(),
    updatedAt: now(),
  });
  writeList(SYNC_QUEUE_KEY, list);
};

export const queueOfflineAction = (payload: {
  actionType: string;
  entityType: string;
  payloadSummary: string;
}) => {
  enqueueSyncAction(payload);
};

export const listSyncQueue = (): SyncQueueItem[] => readList<SyncQueueItem>(SYNC_QUEUE_KEY);

export const processSyncQueue = (): SyncQueueItem[] => {
  const queue: SyncQueueItem[] = readList<SyncQueueItem>(SYNC_QUEUE_KEY).map((item) => {
    if (item.status !== 'PENDING' && item.status !== 'FAILED') return item;
    const shouldFail = Math.random() < 0.12;
    return {
      ...item,
      attempts: item.attempts + 1,
      status: (shouldFail ? 'FAILED' : 'SYNCED') as SyncQueueItem['status'],
      updatedAt: now(),
    };
  });
  writeList(SYNC_QUEUE_KEY, queue);
  return queue;
};

export const retryFailedSync = (): SyncQueueItem[] => {
  const queue: SyncQueueItem[] = readList<SyncQueueItem>(SYNC_QUEUE_KEY).map((item) =>
    item.status === 'FAILED' ? { ...item, status: 'PENDING', updatedAt: now() } : item,
  );
  writeList(SYNC_QUEUE_KEY, queue);
  return queue;
};

export const findUserByPhoneAndRole = (phone: string, role: UserRole): AppUser | null => {
  const users = readList<AppUser>(USERS_KEY);
  return users.find((user) => user.phone === phone && user.role === role) || null;
};

export const registerUser = (payload: {
  name: string;
  phone: string;
  role: UserRole;
}): AppUser => {
  const users = readList<AppUser>(USERS_KEY);

  const existing = users.find((u) => u.phone === payload.phone && u.role === payload.role);
  if (existing) return existing;

  const newUser: AppUser = {
    id: generateId(),
    name: payload.name,
    phone: payload.phone,
    role: payload.role,
    createdAt: now(),
  };

  users.push(newUser);
  writeList(USERS_KEY, users);
  return newUser;
};

export const updateUserFaceSecrets = (payload: {
  userId: string;
  faceTemplateEnc: string;
  faceSalt: string;
}): AppUser | null => {
  const users = readList<AppUser>(USERS_KEY);
  const index = users.findIndex((item) => item.id === payload.userId);
  if (index === -1) return null;

  users[index] = {
    ...users[index],
    faceTemplateEnc: payload.faceTemplateEnc,
    faceSalt: payload.faceSalt,
  };

  writeList(USERS_KEY, users);
  return users[index];
};

export const listAshaTasks = (): AshaTask[] => {
  return readList<AshaTask>(TASKS_KEY);
};

export const markTaskCompleted = (taskId: string): AshaTask[] => {
  const tasks = readList<AshaTask>(TASKS_KEY).map((task) =>
    task.id === taskId ? { ...task, completed: true } : task,
  );
  writeList(TASKS_KEY, tasks);
  enqueueSyncAction({ actionType: 'MARK_DONE', entityType: 'TASK', payloadSummary: taskId });
  return tasks;
};

export const listInventory = (): InventoryItem[] => {
  return readList<InventoryItem>(INVENTORY_KEY);
};

export const updateInventoryCount = (itemId: string, nextCount: number): InventoryItem[] => {
  const items = readList<InventoryItem>(INVENTORY_KEY).map((item) => {
    if (item.id !== itemId) return item;
    return { ...item, count: Math.max(0, Math.min(nextCount, item.total)) };
  });
  writeList(INVENTORY_KEY, items);
  enqueueSyncAction({ actionType: 'UPDATE_STOCK', entityType: 'INVENTORY', payloadSummary: itemId });
  return items;
};

export const forecastInventoryRisk = (): Array<InventoryItem & { daysLeft: number; risk: 'LOW' | 'MEDIUM' | 'HIGH' }> => {
  return readList<InventoryItem>(INVENTORY_KEY).map((item) => {
    const burnRate = Math.max(1, Math.ceil(item.total * 0.04));
    const daysLeft = Math.ceil(item.count / burnRate);
    const risk = daysLeft <= 5 ? 'HIGH' : daysLeft <= 12 ? 'MEDIUM' : 'LOW';
    return { ...item, daysLeft, risk };
  });
};

export const addFamilyMember = (payload: {
  ownerPhone: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  relation: string;
}): FamilyMember => {
  const list = readList<FamilyMember>(FAMILY_KEY);
  const member: FamilyMember = {
    id: generateId(),
    ownerPhone: payload.ownerPhone,
    name: payload.name,
    age: payload.age,
    gender: payload.gender,
    relation: payload.relation,
  };

  list.push(member);
  writeList(FAMILY_KEY, list);
  return member;
};

export const listFamilyMembers = (ownerPhone: string): FamilyMember[] => {
  return readList<FamilyMember>(FAMILY_KEY).filter((item) => item.ownerPhone === ownerPhone);
};

export const createConsultationCase = (payload: {
  patientPhone: string;
  patientName: string;
  summary: string;
  followUpAnswers?: string[];
  riskLevel?: RiskLevel;
}): ConsultationCase => {
  const list = readList<ConsultationCase>(CASES_KEY);
  const entry: ConsultationCase = {
    id: generateId(),
    patientPhone: payload.patientPhone,
    patientName: payload.patientName,
    summary: payload.summary,
    followUpAnswers: payload.followUpAnswers || [],
    riskLevel: payload.riskLevel,
    status: 'PENDING',
    createdAt: now(),
    updatedAt: now(),
  };

  list.unshift(entry);
  writeList(CASES_KEY, list);
  return entry;
};

export const listCasesForDoctor = (): ConsultationCase[] => {
  return readList<ConsultationCase>(CASES_KEY);
};

export const listCasesForPatient = (phone: string): ConsultationCase[] => {
  return readList<ConsultationCase>(CASES_KEY).filter((item) => item.patientPhone === phone);
};

export const respondToCase = (payload: {
  caseId: string;
  doctorName: string;
  response: string;
  prescription?: string;
}): ConsultationCase | null => {
  const list = readList<ConsultationCase>(CASES_KEY);
  const index = list.findIndex((item) => item.id === payload.caseId);
  if (index === -1) return null;

  const updated: ConsultationCase = {
    ...list[index],
    status: 'RESPONDED',
    doctorName: payload.doctorName,
    doctorResponse: payload.response,
    doctorPrescription: payload.prescription,
    updatedAt: now(),
  };

  list[index] = updated;
  writeList(CASES_KEY, list);
  return updated;
};

export const saveAssessment = (payload: {
  patientPhone: string;
  patientName: string;
  symptoms: string[];
  riskLevel: RiskLevel;
  diagnosis: string;
  recommendations: string[];
}): AssessmentRecord => {
  const list = readList<AssessmentRecord>(ASSESSMENT_KEY);
  const item: AssessmentRecord = {
    id: generateId(),
    patientPhone: payload.patientPhone,
    patientName: payload.patientName,
    symptoms: payload.symptoms,
    riskLevel: payload.riskLevel,
    diagnosis: payload.diagnosis,
    recommendations: payload.recommendations,
    createdAt: now(),
  };

  list.unshift(item);
  writeList(ASSESSMENT_KEY, list);
  enqueueSyncAction({ actionType: 'SAVE_ASSESSMENT', entityType: 'ASSESSMENT', payloadSummary: item.id });
  return item;
};

export const listAssessmentsByPhone = (phone: string): AssessmentRecord[] => {
  return readList<AssessmentRecord>(ASSESSMENT_KEY).filter((item) => item.patientPhone === phone);
};

export const addTimelineEntry = (payload: Omit<HouseholdTimelineEntry, 'id' | 'createdAt'>): HouseholdTimelineEntry => {
  const list = readList<HouseholdTimelineEntry>(TIMELINE_KEY);
  const item: HouseholdTimelineEntry = {
    id: generateId(),
    createdAt: now(),
    ...payload,
  };
  list.unshift(item);
  writeList(TIMELINE_KEY, list);
  enqueueSyncAction({ actionType: 'ADD_TIMELINE', entityType: 'TIMELINE', payloadSummary: item.id });
  return item;
};

export const listTimelineByHousehold = (household: string): HouseholdTimelineEntry[] => {
  return readList<HouseholdTimelineEntry>(TIMELINE_KEY).filter((item) => item.household === household);
};

export const saveVitalRecord = (payload: Omit<VitalRecord, 'id' | 'createdAt'>): VitalRecord => {
  const list = readList<VitalRecord>(VITALS_KEY);
  const item: VitalRecord = {
    id: generateId(),
    createdAt: now(),
    ...payload,
  };
  list.unshift(item);
  writeList(VITALS_KEY, list);
  addTimelineEntry({ household: item.household, patientName: item.patientName, entryType: 'VITALS', summary: 'Vitals recorded' });
  enqueueSyncAction({ actionType: 'SAVE_VITALS', entityType: 'VITALS', payloadSummary: item.id });
  return item;
};

export const listVitalsByHousehold = (household: string): VitalRecord[] => {
  return readList<VitalRecord>(VITALS_KEY).filter((item) => item.household === household);
};

export const createReferral = (payload: Omit<ReferralRecord, 'id' | 'createdAt' | 'updatedAt'>): ReferralRecord => {
  const list = readList<ReferralRecord>(REFERRAL_KEY);
  const item: ReferralRecord = {
    id: generateId(),
    createdAt: now(),
    updatedAt: now(),
    ...payload,
  };
  list.unshift(item);
  writeList(REFERRAL_KEY, list);
  addTimelineEntry({ household: item.household, patientName: item.patientName, entryType: 'REFERRAL', summary: `Referral created: ${item.reason}` });
  enqueueSyncAction({ actionType: 'CREATE_REFERRAL', entityType: 'REFERRAL', payloadSummary: item.id });
  return item;
};

export const listReferrals = (): ReferralRecord[] => readList<ReferralRecord>(REFERRAL_KEY);

export const updateReferralStatus = (payload: {
  referralId: string;
  status: ReferralRecord['status'];
  notes?: string;
}): ReferralRecord | null => {
  const list = readList<ReferralRecord>(REFERRAL_KEY);
  const idx = list.findIndex((item) => item.id === payload.referralId);
  if (idx === -1) return null;
  list[idx] = {
    ...list[idx],
    status: payload.status,
    notes: payload.notes || list[idx].notes,
    updatedAt: now(),
  };
  writeList(REFERRAL_KEY, list);
  addTimelineEntry({ household: list[idx].household, patientName: list[idx].patientName, entryType: 'REFERRAL', summary: `Referral status -> ${payload.status}` });
  enqueueSyncAction({ actionType: 'UPDATE_REFERRAL', entityType: 'REFERRAL', payloadSummary: list[idx].id });
  return list[idx];
};

export const createAdherencePlan = (payload: Omit<AdherencePlan, 'id' | 'createdAt'>): AdherencePlan => {
  const list = readList<AdherencePlan>(ADHERENCE_PLAN_KEY);
  const item: AdherencePlan = {
    id: generateId(),
    createdAt: now(),
    ...payload,
  };
  list.unshift(item);
  writeList(ADHERENCE_PLAN_KEY, list);
  addTimelineEntry({ household: item.household, patientName: item.patientName, entryType: 'ADHERENCE', summary: `Adherence plan added: ${item.medicineName}` });
  enqueueSyncAction({ actionType: 'CREATE_ADHERENCE_PLAN', entityType: 'ADHERENCE_PLAN', payloadSummary: item.id });
  return item;
};

export const listAdherencePlans = (): AdherencePlan[] => readList<AdherencePlan>(ADHERENCE_PLAN_KEY);

export const markDoseTaken = (payload: { planId: string; date: string; taken: boolean }): AdherenceLog => {
  const logs = readList<AdherenceLog>(ADHERENCE_LOG_KEY);
  const existing = logs.find((log) => log.planId === payload.planId && log.date === payload.date);
  if (existing) {
    existing.taken = payload.taken;
    existing.createdAt = now();
    writeList(ADHERENCE_LOG_KEY, logs);
    enqueueSyncAction({ actionType: 'UPDATE_DOSE_LOG', entityType: 'ADHERENCE_LOG', payloadSummary: existing.id });
    return existing;
  }

  const item: AdherenceLog = {
    id: generateId(),
    planId: payload.planId,
    date: payload.date,
    taken: payload.taken,
    createdAt: now(),
  };
  logs.unshift(item);
  writeList(ADHERENCE_LOG_KEY, logs);
  enqueueSyncAction({ actionType: 'MARK_DOSE', entityType: 'ADHERENCE_LOG', payloadSummary: item.id });
  return item;
};

export const listAdherenceLogs = (): AdherenceLog[] => readList<AdherenceLog>(ADHERENCE_LOG_KEY);

export const saveMicroPlanEvent = (payload: Omit<MicroPlanEvent, 'id' | 'createdAt'>): MicroPlanEvent => {
  const list = readList<MicroPlanEvent>(MICROPLAN_KEY);
  const item: MicroPlanEvent = {
    id: generateId(),
    createdAt: now(),
    ...payload,
  };
  list.unshift(item);
  writeList(MICROPLAN_KEY, list);
  enqueueSyncAction({ actionType: 'SAVE_MICROPLAN', entityType: 'MICROPLAN', payloadSummary: item.id });
  return item;
};

export const listMicroPlanEvents = (): MicroPlanEvent[] => readList<MicroPlanEvent>(MICROPLAN_KEY);

export const upsertConsent = (payload: Omit<ConsentRecord, 'id' | 'updatedAt'>): ConsentRecord => {
  const list = readList<ConsentRecord>(CONSENT_KEY);
  const idx = list.findIndex((item) => item.household === payload.household && item.patientName === payload.patientName);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...payload, updatedAt: now() };
    writeList(CONSENT_KEY, list);
    enqueueSyncAction({ actionType: 'UPDATE_CONSENT', entityType: 'CONSENT', payloadSummary: list[idx].id });
    return list[idx];
  }
  const item: ConsentRecord = { id: generateId(), updatedAt: now(), ...payload };
  list.unshift(item);
  writeList(CONSENT_KEY, list);
  addTimelineEntry({ household: item.household, patientName: item.patientName, entryType: 'CONSENT', summary: 'Consent updated' });
  enqueueSyncAction({ actionType: 'CREATE_CONSENT', entityType: 'CONSENT', payloadSummary: item.id });
  return item;
};

export const listConsents = (): ConsentRecord[] => readList<ConsentRecord>(CONSENT_KEY);

export const logEmergencyAction = (payload: Omit<EmergencyActionLog, 'id' | 'createdAt'>): EmergencyActionLog => {
  const list = readList<EmergencyActionLog>(EMERGENCY_KEY);
  const item: EmergencyActionLog = {
    id: generateId(),
    createdAt: now(),
    ...payload,
  };
  list.unshift(item);
  writeList(EMERGENCY_KEY, list);
  addTimelineEntry({ household: item.household, patientName: item.patientName, entryType: 'EMERGENCY', summary: `Emergency action: ${item.actionType}` });
  enqueueSyncAction({ actionType: 'EMERGENCY_ACTION', entityType: 'EMERGENCY', payloadSummary: item.id });
  return item;
};

export const listEmergencyLogs = (): EmergencyActionLog[] => readList<EmergencyActionLog>(EMERGENCY_KEY);

export const createRuralMedicationPlan = (payload: Omit<RuralMedicationPlan, 'id' | 'createdAt'>): RuralMedicationPlan => {
  const list = readList<RuralMedicationPlan>(RURAL_MED_PLAN_KEY);
  const item: RuralMedicationPlan = { id: generateId(), createdAt: now(), ...payload };
  list.unshift(item);
  writeList(RURAL_MED_PLAN_KEY, list);
  enqueueSyncAction({ actionType: 'CREATE_MED_PLAN', entityType: 'RURAL_MEDICATION', payloadSummary: item.id });
  return item;
};

export const listRuralMedicationPlans = (ownerPhone: string): RuralMedicationPlan[] => {
  return readList<RuralMedicationPlan>(RURAL_MED_PLAN_KEY).filter((item) => item.ownerPhone === ownerPhone);
};

export const markRuralDose = (payload: { planId: string; ownerPhone: string; date: string; taken: boolean }): RuralMedicationLog => {
  const list = readList<RuralMedicationLog>(RURAL_MED_LOG_KEY);
  const existing = list.find((item) => item.planId === payload.planId && item.date === payload.date);
  if (existing) {
    existing.taken = payload.taken;
    existing.createdAt = now();
    writeList(RURAL_MED_LOG_KEY, list);
    enqueueSyncAction({ actionType: 'UPDATE_MED_LOG', entityType: 'RURAL_MED_LOG', payloadSummary: existing.id });
    return existing;
  }
  const item: RuralMedicationLog = { id: generateId(), createdAt: now(), ...payload };
  list.unshift(item);
  writeList(RURAL_MED_LOG_KEY, list);
  enqueueSyncAction({ actionType: 'CREATE_MED_LOG', entityType: 'RURAL_MED_LOG', payloadSummary: item.id });
  return item;
};

export const listRuralDoseLogs = (ownerPhone: string): RuralMedicationLog[] => {
  return readList<RuralMedicationLog>(RURAL_MED_LOG_KEY).filter((item) => item.ownerPhone === ownerPhone);
};

export const saveRuralRecordDocument = (payload: Omit<RuralRecordDocument, 'id' | 'createdAt'>): RuralRecordDocument => {
  const list = readList<RuralRecordDocument>(RURAL_DOC_KEY);
  const item: RuralRecordDocument = { id: generateId(), createdAt: now(), ...payload };
  list.unshift(item);
  writeList(RURAL_DOC_KEY, list);
  enqueueSyncAction({ actionType: 'SAVE_RURAL_DOC', entityType: 'RURAL_DOCUMENT', payloadSummary: item.id });
  return item;
};

export const listRuralRecordDocuments = (ownerPhone: string): RuralRecordDocument[] => {
  return readList<RuralRecordDocument>(RURAL_DOC_KEY).filter((item) => item.ownerPhone === ownerPhone);
};

export const upsertRuralPregnancyTracker = (payload: Omit<RuralPregnancyTracker, 'id' | 'updatedAt'>): RuralPregnancyTracker => {
  const list = readList<RuralPregnancyTracker>(RURAL_PREGNANCY_KEY);
  const idx = list.findIndex((item) => item.ownerPhone === payload.ownerPhone && item.motherName === payload.motherName);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...payload, updatedAt: now() };
    writeList(RURAL_PREGNANCY_KEY, list);
    enqueueSyncAction({ actionType: 'UPDATE_PREG_TRACKER', entityType: 'RURAL_PREGNANCY', payloadSummary: list[idx].id });
    return list[idx];
  }
  const item: RuralPregnancyTracker = { id: generateId(), updatedAt: now(), ...payload };
  list.unshift(item);
  writeList(RURAL_PREGNANCY_KEY, list);
  enqueueSyncAction({ actionType: 'CREATE_PREG_TRACKER', entityType: 'RURAL_PREGNANCY', payloadSummary: item.id });
  return item;
};

export const listRuralPregnancyTrackers = (ownerPhone: string): RuralPregnancyTracker[] => {
  return readList<RuralPregnancyTracker>(RURAL_PREGNANCY_KEY).filter((item) => item.ownerPhone === ownerPhone);
};

export const upsertRuralNewbornTracker = (payload: Omit<RuralNewbornTracker, 'id' | 'updatedAt'>): RuralNewbornTracker => {
  const list = readList<RuralNewbornTracker>(RURAL_NEWBORN_KEY);
  const idx = list.findIndex((item) => item.ownerPhone === payload.ownerPhone && item.babyName === payload.babyName);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...payload, updatedAt: now() };
    writeList(RURAL_NEWBORN_KEY, list);
    enqueueSyncAction({ actionType: 'UPDATE_NEWBORN_TRACKER', entityType: 'RURAL_NEWBORN', payloadSummary: list[idx].id });
    return list[idx];
  }
  const item: RuralNewbornTracker = { id: generateId(), updatedAt: now(), ...payload };
  list.unshift(item);
  writeList(RURAL_NEWBORN_KEY, list);
  enqueueSyncAction({ actionType: 'CREATE_NEWBORN_TRACKER', entityType: 'RURAL_NEWBORN', payloadSummary: item.id });
  return item;
};

export const listRuralNewbornTrackers = (ownerPhone: string): RuralNewbornTracker[] => {
  return readList<RuralNewbornTracker>(RURAL_NEWBORN_KEY).filter((item) => item.ownerPhone === ownerPhone);
};

export const saveRuralImmunizationRecord = (payload: Omit<RuralImmunizationRecord, 'id' | 'createdAt'>): RuralImmunizationRecord => {
  const list = readList<RuralImmunizationRecord>(RURAL_IMMUNIZATION_KEY);
  const item: RuralImmunizationRecord = { id: generateId(), createdAt: now(), ...payload };
  list.unshift(item);
  writeList(RURAL_IMMUNIZATION_KEY, list);
  enqueueSyncAction({ actionType: 'SAVE_IMMUNIZATION', entityType: 'RURAL_IMMUNIZATION', payloadSummary: item.id });
  return item;
};

export const listRuralImmunizationRecords = (ownerPhone: string): RuralImmunizationRecord[] => {
  return readList<RuralImmunizationRecord>(RURAL_IMMUNIZATION_KEY).filter((item) => item.ownerPhone === ownerPhone);
};

export const setRuralImmunizationCompleted = (payload: { id: string; completed: boolean }): RuralImmunizationRecord | null => {
  const list = readList<RuralImmunizationRecord>(RURAL_IMMUNIZATION_KEY);
  const idx = list.findIndex((item) => item.id === payload.id);
  if (idx === -1) return null;
  list[idx] = {
    ...list[idx],
    completed: payload.completed,
    completedAt: payload.completed ? now() : undefined,
  };
  writeList(RURAL_IMMUNIZATION_KEY, list);
  enqueueSyncAction({ actionType: 'UPDATE_IMMUNIZATION', entityType: 'RURAL_IMMUNIZATION', payloadSummary: list[idx].id });
  return list[idx];
};

export const createRuralTeleconsultRequest = (payload: Omit<RuralTeleconsultRequest, 'id' | 'createdAt' | 'updatedAt'>): RuralTeleconsultRequest => {
  const list = readList<RuralTeleconsultRequest>(RURAL_TELECONSULT_KEY);
  const item: RuralTeleconsultRequest = { id: generateId(), createdAt: now(), updatedAt: now(), ...payload };
  list.unshift(item);
  writeList(RURAL_TELECONSULT_KEY, list);
  enqueueSyncAction({ actionType: 'CREATE_TELECONSULT', entityType: 'RURAL_TELECONSULT', payloadSummary: item.id });
  return item;
};

export const listRuralTeleconsultRequests = (ownerPhone: string): RuralTeleconsultRequest[] => {
  return readList<RuralTeleconsultRequest>(RURAL_TELECONSULT_KEY).filter((item) => item.ownerPhone === ownerPhone);
};

export const updateRuralTeleconsultStatus = (payload: { id: string; status: RuralTeleconsultRequest['status'] }): RuralTeleconsultRequest | null => {
  const list = readList<RuralTeleconsultRequest>(RURAL_TELECONSULT_KEY);
  const idx = list.findIndex((item) => item.id === payload.id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], status: payload.status, updatedAt: now() };
  writeList(RURAL_TELECONSULT_KEY, list);
  enqueueSyncAction({ actionType: 'UPDATE_TELECONSULT', entityType: 'RURAL_TELECONSULT', payloadSummary: list[idx].id });
  return list[idx];
};

export const upsertRuralPrivacySettings = (payload: Omit<RuralPrivacySettings, 'id' | 'updatedAt'>): RuralPrivacySettings => {
  const list = readList<RuralPrivacySettings>(RURAL_PRIVACY_KEY);
  const idx = list.findIndex((item) => item.ownerPhone === payload.ownerPhone);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...payload, updatedAt: now() };
    writeList(RURAL_PRIVACY_KEY, list);
    enqueueSyncAction({ actionType: 'UPDATE_RURAL_PRIVACY', entityType: 'RURAL_PRIVACY', payloadSummary: list[idx].id });
    return list[idx];
  }
  const item: RuralPrivacySettings = { id: generateId(), updatedAt: now(), ...payload };
  list.unshift(item);
  writeList(RURAL_PRIVACY_KEY, list);
  enqueueSyncAction({ actionType: 'CREATE_RURAL_PRIVACY', entityType: 'RURAL_PRIVACY', payloadSummary: item.id });
  return item;
};

export const getRuralPrivacySettings = (ownerPhone: string): RuralPrivacySettings | null => {
  return readList<RuralPrivacySettings>(RURAL_PRIVACY_KEY).find((item) => item.ownerPhone === ownerPhone) || null;
};
