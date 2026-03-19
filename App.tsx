import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Camera,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Hospital,
  Languages,
  LogOut,
  Mic,
  Phone,
  PhoneCall,
  Pill,
  Plus,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UserCircle2,
  Users,
  Volume2,
} from 'lucide-react';
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
  NutritionAdvice,
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
  TaskPriority,
  UserRole,
  VitalRecord,
} from './types';
import {
  addFamilyMember,
  addTimelineEntry,
  createConsultationCase,
  createAdherencePlan,
  createReferral,
  createRuralMedicationPlan,
  createRuralTeleconsultRequest,
  findUserByPhoneAndRole,
  forecastInventoryRisk,
  getRuralPrivacySettings,
  listAssessmentsByPhone,
  listAdherenceLogs,
  listAdherencePlans,
  listAshaTasks,
  listCasesForDoctor,
  listCasesForPatient,
  listConsents,
  listEmergencyLogs,
  listFamilyMembers,
  listInventory,
  listMicroPlanEvents,
  listRuralDoseLogs,
  listRuralImmunizationRecords,
  listRuralMedicationPlans,
  listRuralNewbornTrackers,
  listRuralPregnancyTrackers,
  listRuralRecordDocuments,
  listRuralTeleconsultRequests,
  listReferrals,
  listSyncQueue,
  listTimelineByHousehold,
  listVitalsByHousehold,
  logEmergencyAction,
  markRuralDose,
  markTaskCompleted,
  markDoseTaken,
  processSyncQueue,
  registerUser,
  retryFailedSync,
  respondToCase,
  saveAssessment,
  saveMicroPlanEvent,
  saveRuralImmunizationRecord,
  saveRuralRecordDocument,
  saveVitalRecord,
  setRuralImmunizationCompleted,
  updateRuralTeleconsultStatus,
  upsertRuralNewbornTracker,
  upsertRuralPregnancyTracker,
  upsertRuralPrivacySettings,
  upsertConsent,
  updateReferralStatus,
  updateInventoryCount,
  updateUserFaceSecrets,
} from './services/dataService';
import {
  captureFaceTemplate,
  decryptTemplate,
  encryptTemplate,
  isFaceLoginSupported,
  isFaceMatch,
  startCamera,
  stopCamera,
} from './services/faceAuth';
import { analyzeSymptoms, buildGuidedDoctorReport, generateDoctorDraft, getGuidedInterviewPlan, getHealthGuideCards, getNutritionAdvice, isAiEnabled, summarizeFieldNote, transcribeAudioToText } from './services/aiService';

type Step = 'ROLE' | 'AUTH' | 'FACE_ENROLL' | 'FACE_VERIFY' | 'DASHBOARD';
type AuthMode = 'LOGIN' | 'SIGNUP';
type Language = 'en' | 'hi';

const roleConfig = {
  [UserRole.RURAL]: {
    title: 'Rural Family',
    subtitle: 'Phone + Face',
    color: 'bg-orange-600',
    icon: UserCircle2,
  },
  [UserRole.ASHA]: {
    title: 'ASHA Worker',
    subtitle: 'Field Operations',
    color: 'bg-green-700',
    icon: Users,
  },
  [UserRole.DOCTOR]: {
    title: 'Doctor',
    subtitle: 'Clinical Console',
    color: 'bg-blue-700',
    icon: Stethoscope,
  },
};

const shellClass =
  'max-w-md md:max-w-6xl mx-auto min-h-screen bg-gradient-to-b from-emerald-50 via-cyan-50 to-amber-50 border-x border-emerald-100 shadow-2xl';

const appTitle = 'Arogya Swarm Rural';

const symptomsPool = ['Fever', 'Cough', 'Breathing Difficulty', 'Weakness', 'Body Pain', 'Vomiting'];

const severityTone = (risk?: RiskLevel) => {
  if (risk === 'HIGH') return 'bg-red-100 text-red-700';
  if (risk === 'LOW') return 'bg-green-100 text-green-700';
  return 'bg-amber-100 text-amber-700';
};

const TopBar: React.FC<{
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  onLogout?: () => void;
}> = ({ title, subtitle, right, onLogout }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-emerald-100 px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">{title}</h1>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {right}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
};

const Btn: React.FC<{
  label: string;
  onClick: () => void;
  tone?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}> = ({ label, onClick, tone = 'primary', disabled = false }) => {
  const cls =
    tone === 'primary'
      ? 'bg-slate-900 text-white hover:bg-black'
      : tone === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.99] ${cls} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {label}
    </button>
  );
};

const RolePicker: React.FC<{ onSelect: (role: UserRole) => void }> = ({ onSelect }) => {
  return (
    <div className={`${shellClass} p-6 flex flex-col justify-center`}>
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-black tracking-tight text-slate-900">{appTitle}</h2>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2">
          Full Product Build (No OTP)
        </p>
      </div>

      <div className="space-y-4">
        {(Object.keys(roleConfig) as UserRole[]).map((role) => {
          const Icon = roleConfig[role].icon;
          return (
            <button
              key={role}
              onClick={() => onSelect(role)}
              className="w-full bg-white rounded-3xl p-5 text-left border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${roleConfig[role].color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900">{roleConfig[role].title}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {roleConfig[role].subtitle}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const AuthPanel: React.FC<{
  role: UserRole;
  mode: AuthMode;
  phone: string;
  name: string;
  error: string;
  setMode: (mode: AuthMode) => void;
  setPhone: (value: string) => void;
  setName: (value: string) => void;
  onBack: () => void;
  onLogin: () => void;
  onSignup: () => void;
}> = ({ role, mode, phone, name, error, setMode, setPhone, setName, onBack, onLogin, onSignup }) => {
  return (
    <div className={shellClass}>
      <TopBar title={roleConfig[role].title} subtitle="Number-based access" />
      <div className="p-5 space-y-4">
        <button onClick={onBack} className="text-sm font-bold text-slate-500">
          &larr; Back to role selection
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Phone size={17} />
            <p className="text-sm font-bold">Mobile number only (OTP disabled)</p>
          </div>

          <div className="grid grid-cols-2 gap-1 bg-slate-100 rounded-xl p-1">
            <button
              className={`rounded-lg py-2 text-sm font-bold ${mode === 'LOGIN' ? 'bg-white' : 'text-slate-500'}`}
              onClick={() => setMode('LOGIN')}
            >
              Login
            </button>
            <button
              className={`rounded-lg py-2 text-sm font-bold ${mode === 'SIGNUP' ? 'bg-white' : 'text-slate-500'}`}
              onClick={() => setMode('SIGNUP')}
            >
              Sign Up
            </button>
          </div>

          {mode === 'SIGNUP' && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 font-semibold outline-none"
            />
          )}

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
            placeholder="10-digit mobile number"
            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 font-semibold outline-none"
          />

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          {mode === 'LOGIN' ? <Btn label="Login" onClick={onLogin} /> : <Btn label="Create Account" onClick={onSignup} />}

          {role === UserRole.RURAL && (
            <p className="text-xs text-slate-500">Rural users require face enrollment/verification after phone login.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const FacePanel: React.FC<{
  mode: 'ENROLL' | 'VERIFY';
  userName: string;
  helper: string;
  busy: boolean;
  error: string;
  onCapture: (template: string) => Promise<void>;
  onBack: () => void;
}> = ({ mode, userName, helper, busy, error, onCapture, onBack }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      if (!videoRef.current) return;
      if (!isFaceLoginSupported()) {
        setCameraError('Camera or secure crypto is not supported in this browser.');
        return;
      }

      try {
        setCameraError('');
        const media = await startCamera(videoRef.current);
        if (mounted) streamRef.current = media;
      } catch (e: any) {
        const message = String(e?.message || '').toLowerCase();
        if (message.includes('notallowed') || message.includes('permission')) {
          setCameraError('Camera permission denied. Please allow camera access and retry.');
        } else if (message.includes('notfound') || message.includes('devicesnotfound')) {
          setCameraError('No camera device found on this device/browser.');
        } else {
          setCameraError('Unable to access camera. Close other apps using camera and retry.');
        }
      }
    };

    setup();
    return () => {
      mounted = false;
      stopCamera(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  return (
    <div className={shellClass}>
      <TopBar
        title={mode === 'ENROLL' ? 'Face Enrollment' : 'Face Verification'}
        subtitle={mode === 'ENROLL' ? 'Create face signature' : 'Secure rural login'}
      />

      <div className="p-5 space-y-4">
        <button onClick={onBack} className="text-sm font-bold text-slate-500">
          &larr; Back
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-700">
            <ShieldCheck size={17} />
            <p className="font-bold">{userName}</p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
            <video ref={videoRef} className="w-full h-64 object-cover" muted playsInline />
          </div>

          <p className="text-sm text-slate-600">{helper}</p>
          {cameraError && <p className="text-sm font-semibold text-red-600">{cameraError}</p>}
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          <button
            disabled={busy || Boolean(cameraError)}
            onClick={async () => {
              if (!videoRef.current) return;
              const template = await captureFaceTemplate(videoRef.current);
              await onCapture(template);
            }}
            className={`w-full rounded-xl py-3 font-bold text-white flex items-center justify-center gap-2 ${
              busy ? 'bg-slate-400' : 'bg-slate-900'
            }`}
          >
            {busy ? <RefreshCcw size={17} className="animate-spin" /> : <Camera size={17} />}
            {mode === 'ENROLL' ? 'Capture & Enroll' : 'Capture & Verify'}
          </button>
        </div>
      </div>
    </div>
  );
};

const RuralDashboard: React.FC<{
  user: AppUser;
  onLogout: () => void;
  language: Language;
  setLanguage: (value: Language) => void;
}> = ({ user, onLogout, language, setLanguage }) => {
  const [activeTab, setActiveTab] = useState<
    | 'HOME'
    | 'EMERGENCY'
    | 'FAMILY'
    | 'SYMPTOMS'
    | 'MEDS'
    | 'PREGNANCY'
    | 'RECORDS'
    | 'CONSULT'
    | 'FACILITIES'
    | 'NUTRITION'
    | 'EDUCATION'
    | 'IMMUNIZATION'
    | 'PRIVACY'
    | 'OFFLINE'
  >('HOME');

  const [cases, setCases] = useState<ConsultationCase[]>([]);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [history, setHistory] = useState<AssessmentRecord[]>([]);
  const [timeline, setTimeline] = useState<HouseholdTimelineEntry[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);

  const [newMember, setNewMember] = useState({ name: '', age: '', gender: 'Male' as FamilyMember['gender'], relation: '' });
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<{ riskLevel: RiskLevel; diagnosis: string; recommendations: string[]; confidence: number } | null>(null);
  const [qaQuestions, setQaQuestions] = useState<string[]>([]);
  const [qaAnswers, setQaAnswers] = useState<string[]>([]);
  const [qaCurrentIndex, setQaCurrentIndex] = useState(0);
  const [qaCurrentResponse, setQaCurrentResponse] = useState('');
  const [qaCondition, setQaCondition] = useState<'RESPIRATORY' | 'FEVER' | 'GASTRO' | 'GENERAL'>('GENERAL');
  const [qaReport, setQaReport] = useState('');
  const [qaBuildingReport, setQaBuildingReport] = useState(false);
  const [qaAutoVoice, setQaAutoVoice] = useState(true);

  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [voiceBusy, setVoiceBusy] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const qaSpokenKeyRef = useRef('');

  const [nutritionContext, setNutritionContext] = useState('');
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionResult, setNutritionResult] = useState<NutritionAdvice | null>(null);
  const [guideContext, setGuideContext] = useState('');
  const [healthGuideLoading, setHealthGuideLoading] = useState(false);
  const [healthGuideCards, setHealthGuideCards] = useState<Array<{ title: string; text: string }>>([]);

  const [medPlans, setMedPlans] = useState<RuralMedicationPlan[]>([]);
  const [medLogs, setMedLogs] = useState<RuralMedicationLog[]>([]);
  const [medForm, setMedForm] = useState({ patientName: '', medicineName: '', schedule: '1-0-1' });

  const [pregTrackers, setPregTrackers] = useState<RuralPregnancyTracker[]>([]);
  const [newbornTrackers, setNewbornTrackers] = useState<RuralNewbornTracker[]>([]);
  const [pregForm, setPregForm] = useState({ motherName: '', lmpDate: '', expectedDeliveryDate: '', ancVisitsCompleted: '0', highRisk: false, notes: '' });
  const [newbornForm, setNewbornForm] = useState({ babyName: '', dob: '', weightKg: '', breastfeedingStatus: 'EXCLUSIVE' as RuralNewbornTracker['breastfeedingStatus'], warningFlags: '' });

  const [docs, setDocs] = useState<RuralRecordDocument[]>([]);
  const [docForm, setDocForm] = useState({ patientName: '', title: '', docType: 'PRESCRIPTION' as RuralRecordDocument['docType'], fileUrl: '', notes: '' });

  const [teleconsults, setTeleconsults] = useState<RuralTeleconsultRequest[]>([]);
  const [consultForm, setConsultForm] = useState({ patientName: '', summary: '', voiceNoteText: '' });

  const [immunizations, setImmunizations] = useState<RuralImmunizationRecord[]>([]);
  const [immunForm, setImmunForm] = useState({ childName: '', vaccineName: '', dueDate: '' });

  const [privacy, setPrivacy] = useState<RuralPrivacySettings | null>(null);

  const i18n = {
    en: {
      title: 'Rural Family Care',
      subtitle: `Welcome, ${user.name}`,
      tabs: {
        EMERGENCY: 'Emergency',
        FAMILY: 'Family',
        SYMPTOMS: 'Symptoms',
        MEDS: 'Medicine',
        PREGNANCY: 'Mother & Newborn',
        RECORDS: 'Health Records',
        CONSULT: 'Teleconsult',
        FACILITIES: 'Nearby Care',
        NUTRITION: 'Nutrition',
        EDUCATION: 'Health Guides',
        IMMUNIZATION: 'Immunization',
        PRIVACY: 'Privacy',
        OFFLINE: 'Offline Sync',
      },
      common: {
        start: 'Start',
        recordAnswer: 'Record Answer',
        submitAnswer: 'Submit Answer',
        buildingReport: 'Building Report...',
        reportReady: 'Generalized Report Ready',
        sendToDoctor: 'Send Guided Report To Doctor',
        poshanTitle: 'Local Nutrition Planner',
        poshanPlaceholder: 'Example: low appetite, pregnancy month 6, vegetarian',
        poshanGenerate: 'Generate Nutrition Advice',
        swasthyaTitle: 'AI Health Guide',
        swasthyaContext: 'Context (optional)',
        swasthyaContextPlaceholder: 'Example: child fever cases in village',
        swasthyaGenerate: 'Generate AI Health Guide',
        schemesTitle: 'Government Support Schemes',
        handsFree: 'Hands-free auto voice mode',
      },
    },
    hi: {
      title: 'ग्रामीण परिवार स्वास्थ्य',
      subtitle: `स्वागत है, ${user.name}`,
      tabs: {
        EMERGENCY: 'आपातकाल',
        FAMILY: 'परिवार',
        SYMPTOMS: 'लक्षण',
        MEDS: 'दवा',
        PREGNANCY: 'मां और नवजात',
        RECORDS: 'रिकॉर्ड',
        CONSULT: 'टेली-कंसल्ट',
        FACILITIES: 'नजदीकी सेवा',
        NUTRITION: 'पोषण',
        EDUCATION: 'स्वास्थ्य गाइड',
        IMMUNIZATION: 'टीकाकरण',
        PRIVACY: 'प्राइवेसी',
        OFFLINE: 'ऑफलाइन सिंक',
      },
      common: {
        start: 'शुरू करें',
        recordAnswer: 'उत्तर रिकॉर्ड करें',
        submitAnswer: 'उत्तर जमा करें',
        buildingReport: 'रिपोर्ट बन रही है...',
        reportReady: 'सामान्यीकृत रिपोर्ट तैयार',
        sendToDoctor: 'रिपोर्ट डॉक्टर को भेजें',
        poshanTitle: 'स्थानीय पोषण योजना',
        poshanPlaceholder: 'उदाहरण: भूख कम लगना, गर्भावस्था 6वां महीना, शाकाहारी',
        poshanGenerate: 'पोषण सलाह बनाएं',
        swasthyaTitle: 'एआई स्वास्थ्य गाइड',
        swasthyaContext: 'संदर्भ (वैकल्पिक)',
        swasthyaContextPlaceholder: 'उदाहरण: गांव में बच्चों में बुखार के मामले',
        swasthyaGenerate: 'एआई स्वास्थ्य गाइड बनाएं',
        schemesTitle: 'सरकारी सहायता योजनाएं',
        handsFree: 'हैंड्स-फ्री ऑटो वॉइस मोड',
      },
    },
  } as const;

  const t = i18n[language];

  const moduleHints = {
    en: {
      EMERGENCY: '108 call and urgent escalation',
      FAMILY: 'Family timeline and history',
      SYMPTOMS: 'AI symptom + voice assistant',
      MEDS: 'Medicine reminders and adherence',
      PREGNANCY: 'Pregnancy and newborn tracker',
      RECORDS: 'Digital record vault',
      CONSULT: 'Doctor teleconsult requests',
      FACILITIES: 'Nearby facilities and transport',
      NUTRITION: 'Local food nutrition plans',
      EDUCATION: 'Risk-specific guidance cards',
      IMMUNIZATION: 'Vaccine due tracker',
      PRIVACY: 'Consent and data sharing control',
      OFFLINE: 'Offline queue and sync status',
    },
    hi: {
      EMERGENCY: '108 कॉल और तुरंत सहायता',
      FAMILY: 'परिवार टाइमलाइन और इतिहास',
      SYMPTOMS: 'एआई लक्षण और वॉइस सहायक',
      MEDS: 'दवा रिमाइंडर और पालन',
      PREGNANCY: 'गर्भावस्था और नवजात ट्रैकर',
      RECORDS: 'डिजिटल रिकॉर्ड वॉल्ट',
      CONSULT: 'डॉक्टर टेली-कंसल्ट अनुरोध',
      FACILITIES: 'नजदीकी सुविधा और परिवहन',
      NUTRITION: 'स्थानीय पोषण योजना',
      EDUCATION: 'जोखिम-आधारित मार्गदर्शन',
      IMMUNIZATION: 'टीकाकरण ड्यू ट्रैकर',
      PRIVACY: 'सहमति और डेटा नियंत्रण',
      OFFLINE: 'ऑफलाइन कतार और सिंक स्थिति',
    },
  } as const;

  const moduleCards: Array<{
    key: Exclude<typeof activeTab, 'HOME'>;
    tone: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    hint: string;
  }> = [
    { key: 'EMERGENCY', tone: 'bg-gradient-to-r from-red-100 to-rose-50 text-red-800 border-red-200', icon: AlertTriangle, hint: moduleHints[language].EMERGENCY },
    { key: 'FAMILY', tone: 'bg-gradient-to-r from-slate-100 to-zinc-50 text-slate-700 border-slate-200', icon: Users, hint: moduleHints[language].FAMILY },
    { key: 'SYMPTOMS', tone: 'bg-gradient-to-r from-cyan-100 to-blue-50 text-cyan-800 border-cyan-200', icon: Activity, hint: moduleHints[language].SYMPTOMS },
    { key: 'MEDS', tone: 'bg-gradient-to-r from-emerald-100 to-teal-50 text-emerald-800 border-emerald-200', icon: Pill, hint: moduleHints[language].MEDS },
    { key: 'PREGNANCY', tone: 'bg-gradient-to-r from-pink-100 to-rose-50 text-pink-800 border-pink-200', icon: ShieldCheck, hint: moduleHints[language].PREGNANCY },
    { key: 'RECORDS', tone: 'bg-gradient-to-r from-violet-100 to-indigo-50 text-violet-800 border-violet-200', icon: FileText, hint: moduleHints[language].RECORDS },
    { key: 'CONSULT', tone: 'bg-gradient-to-r from-indigo-100 to-blue-50 text-indigo-800 border-indigo-200', icon: Stethoscope, hint: moduleHints[language].CONSULT },
    { key: 'FACILITIES', tone: 'bg-gradient-to-r from-amber-100 to-orange-50 text-amber-800 border-amber-200', icon: Hospital, hint: moduleHints[language].FACILITIES },
    { key: 'NUTRITION', tone: 'bg-gradient-to-r from-green-100 to-lime-50 text-green-800 border-green-200', icon: Plus, hint: moduleHints[language].NUTRITION },
    { key: 'EDUCATION', tone: 'bg-gradient-to-r from-sky-100 to-cyan-50 text-sky-800 border-sky-200', icon: Volume2, hint: moduleHints[language].EDUCATION },
    { key: 'IMMUNIZATION', tone: 'bg-gradient-to-r from-yellow-100 to-amber-50 text-yellow-800 border-yellow-200', icon: CheckCircle2, hint: moduleHints[language].IMMUNIZATION },
    { key: 'PRIVACY', tone: 'bg-gradient-to-r from-fuchsia-100 to-violet-50 text-fuchsia-800 border-fuchsia-200', icon: ShieldAlert, hint: moduleHints[language].PRIVACY },
    { key: 'OFFLINE', tone: 'bg-gradient-to-r from-emerald-100 to-cyan-50 text-emerald-800 border-emerald-200', icon: RefreshCcw, hint: moduleHints[language].OFFLINE },
  ];

  const symptomString = useMemo(() => {
    const full = customSymptom.trim() ? [...selectedSymptoms, customSymptom.trim()] : selectedSymptoms;
    return Array.from(new Set(full));
  }, [selectedSymptoms, customSymptom]);

  const refresh = () => {
    setCases(listCasesForPatient(user.phone));
    setFamily(listFamilyMembers(user.phone));
    setHistory(listAssessmentsByPhone(user.phone));
    setTimeline(listTimelineByHousehold(user.phone));
    setSyncQueue(listSyncQueue());
    setMedPlans(listRuralMedicationPlans(user.phone));
    setMedLogs(listRuralDoseLogs(user.phone));
    setPregTrackers(listRuralPregnancyTrackers(user.phone));
    setNewbornTrackers(listRuralNewbornTrackers(user.phone));
    setDocs(listRuralRecordDocuments(user.phone));
    setTeleconsults(listRuralTeleconsultRequests(user.phone));
    setImmunizations(listRuralImmunizationRecords(user.phone));
    setPrivacy(getRuralPrivacySettings(user.phone));
  };

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 3000);
    return () => clearInterval(poll);
  }, [user.phone]);

  const requestDoctorFromAssessment = () => {
    if (!assessmentResult) return;
    createConsultationCase({
      patientPhone: user.phone,
      patientName: user.name,
      summary: `${assessmentResult.diagnosis} (${assessmentResult.riskLevel})`,
      followUpAnswers: assessmentResult.recommendations,
      riskLevel: assessmentResult.riskLevel,
    });
    refresh();
  };

  const stopAudioStream = () => {
    if (!audioStreamRef.current) return;
    audioStreamRef.current.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // noop
    }
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      // noop
    }
  };

  const blobToBase64 = async (blob: Blob) => {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  };

  const startRecorderFallback = async (target: 'symptom' | 'qa') => {
    if (!isAiEnabled()) {
      setVoiceError('Voice fallback needs Gemini key.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.onstart = () => setIsListening(true);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        setIsListening(false);
        setVoiceBusy(true);
        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          if (!blob.size) {
            setVoiceError('No voice detected.');
            return;
          }
          const transcript = await transcribeAudioToText({ audioBase64: await blobToBase64(blob), mimeType: 'audio/webm', language: language === 'en' ? 'en' : 'hi' });
          if (!transcript) {
            setVoiceError('Could not transcribe voice.');
            return;
          }
          if (target === 'qa') {
            setQaCurrentResponse(transcript);
            if (qaAutoVoice) {
              setTimeout(() => {
                submitAnswerAndProgress(transcript);
              }, 60);
            }
          } else {
            setCustomSymptom(transcript);
          }
          setVoiceError('');
        } finally {
          setVoiceBusy(false);
          stopAudioStream();
        }
      };
      recorder.start();
    } catch {
      setVoiceError('Microphone permission denied.');
    }
  };

  const startListening = (target: 'symptom' | 'qa' = 'symptom') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (window.MediaRecorder) {
        startRecorderFallback(target);
        return;
      }
      setVoiceError('Voice input not supported.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'en' ? 'en-IN' : 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      setVoiceError('Voice capture failed.');
    };
    recognition.onresult = (event: any) => {
      const transcript = String(event?.results?.[0]?.[0]?.transcript || '').trim();
      if (!transcript) return;
      if (target === 'qa') {
        setQaCurrentResponse(transcript);
        if (qaAutoVoice) {
          setTimeout(() => {
            submitAnswerAndProgress(transcript);
          }, 60);
        }
      } else {
        setCustomSymptom(transcript);
      }
      setVoiceError('');
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'en' ? 'en-IN' : 'hi-IN';
    window.speechSynthesis.speak(utterance);
  };

  const runEmergency = (action: 'AMBULANCE_CALL' | 'PHC_CALL' | 'CASE_SHARED') => {
    logEmergencyAction({ household: user.phone, patientName: user.name, actionType: action });
    addTimelineEntry({ household: user.phone, patientName: user.name, entryType: 'EMERGENCY', summary: `Emergency action triggered: ${action}` });

    if (action === 'AMBULANCE_CALL') {
      createConsultationCase({ patientPhone: user.phone, patientName: user.name, summary: 'Emergency escalation from rural app', riskLevel: 'HIGH' });
      window.open('tel:108');
    }
    if (action === 'PHC_CALL') window.open('tel:102');
    refresh();
  };

  const saveMedicationPlan = () => {
    if (!medForm.patientName.trim() || !medForm.medicineName.trim()) return;
    createRuralMedicationPlan({
      ownerPhone: user.phone,
      patientName: medForm.patientName.trim(),
      medicineName: medForm.medicineName.trim(),
      schedule: medForm.schedule,
      startDate: new Date().toISOString().slice(0, 10),
    });
    setMedForm({ patientName: '', medicineName: '', schedule: '1-0-1' });
    refresh();
  };

  const savePregnancy = () => {
    if (!pregForm.motherName.trim() || !pregForm.lmpDate || !pregForm.expectedDeliveryDate) return;
    upsertRuralPregnancyTracker({
      ownerPhone: user.phone,
      motherName: pregForm.motherName.trim(),
      lmpDate: pregForm.lmpDate,
      expectedDeliveryDate: pregForm.expectedDeliveryDate,
      ancVisitsCompleted: parseInt(pregForm.ancVisitsCompleted || '0', 10),
      highRisk: pregForm.highRisk,
      notes: pregForm.notes,
    });
    refresh();
  };

  const saveNewborn = () => {
    if (!newbornForm.babyName.trim() || !newbornForm.dob) return;
    upsertRuralNewbornTracker({
      ownerPhone: user.phone,
      babyName: newbornForm.babyName.trim(),
      dob: newbornForm.dob,
      breastfeedingStatus: newbornForm.breastfeedingStatus,
      weightKg: newbornForm.weightKg ? parseFloat(newbornForm.weightKg) : undefined,
      warningFlags: newbornForm.warningFlags ? newbornForm.warningFlags.split(',').map((x) => x.trim()).filter(Boolean) : [],
    });
    refresh();
  };

  const saveDocument = () => {
    if (!docForm.patientName.trim() || !docForm.title.trim()) return;
    saveRuralRecordDocument({
      ownerPhone: user.phone,
      patientName: docForm.patientName.trim(),
      title: docForm.title.trim(),
      docType: docForm.docType,
      fileUrl: docForm.fileUrl.trim() || undefined,
      notes: docForm.notes.trim() || undefined,
    });
    setDocForm({ patientName: '', title: '', docType: 'PRESCRIPTION', fileUrl: '', notes: '' });
    refresh();
  };

  const sendTeleconsult = () => {
    if (!consultForm.patientName.trim() || !consultForm.summary.trim()) return;
    createRuralTeleconsultRequest({
      ownerPhone: user.phone,
      patientName: consultForm.patientName.trim(),
      summary: consultForm.summary.trim(),
      voiceNoteText: consultForm.voiceNoteText.trim() || undefined,
      status: 'SENT',
    });
    createConsultationCase({
      patientPhone: user.phone,
      patientName: consultForm.patientName.trim(),
      summary: consultForm.summary.trim(),
      followUpAnswers: consultForm.voiceNoteText ? [consultForm.voiceNoteText] : [],
      riskLevel: 'MEDIUM',
    });
    setConsultForm({ patientName: '', summary: '', voiceNoteText: '' });
    refresh();
  };

  const saveImmunization = () => {
    if (!immunForm.childName.trim() || !immunForm.vaccineName.trim() || !immunForm.dueDate) return;
    saveRuralImmunizationRecord({
      ownerPhone: user.phone,
      childName: immunForm.childName.trim(),
      vaccineName: immunForm.vaccineName.trim(),
      dueDate: immunForm.dueDate,
      completed: false,
    });
    setImmunForm({ childName: '', vaccineName: '', dueDate: '' });
    refresh();
  };

  const savePrivacy = (changes: Partial<RuralPrivacySettings>) => {
    upsertRuralPrivacySettings({
      ownerPhone: user.phone,
      shareWithAsha: changes.shareWithAsha ?? privacy?.shareWithAsha ?? true,
      shareWithDoctor: changes.shareWithDoctor ?? privacy?.shareWithDoctor ?? true,
      allowVoiceStorage: changes.allowVoiceStorage ?? privacy?.allowVoiceStorage ?? true,
      allowFaceStorage: changes.allowFaceStorage ?? privacy?.allowFaceStorage ?? true,
    });
    refresh();
  };

  const getFirstGuidedQuestion = () => (language === 'en' ? 'What is your main problem today?' : 'आज आपकी मुख्य समस्या क्या है?');

  const conditionLabel = {
    RESPIRATORY: 'Respiratory condition',
    FEVER: 'Fever-related condition',
    GASTRO: 'Gastrointestinal condition',
    GENERAL: 'General condition',
  } as const;

  const startGuidedInterview = () => {
    setQaQuestions([getFirstGuidedQuestion()]);
    setQaAnswers([]);
    setQaCurrentIndex(0);
    setQaCurrentResponse('');
    setQaCondition('GENERAL');
    setQaReport('');
    setVoiceError('');
    qaSpokenKeyRef.current = '';
  };

  const loadHealthGuideCards = async () => {
    setHealthGuideLoading(true);
    try {
      const cards = await getHealthGuideCards({ language, context: guideContext.trim() || undefined });
      setHealthGuideCards(cards);
    } finally {
      setHealthGuideLoading(false);
    }
  };

  const buildGeneralizedReport = async (answers: string[], condition: 'RESPIRATORY' | 'FEVER' | 'GASTRO' | 'GENERAL') => {
    const qaPairs = answers.map((answer, idx) => ({
      question: qaQuestions[idx] || `Question ${idx + 1}`,
      answer,
    }));

    const aiReport = await buildGuidedDoctorReport({
      language: language === 'en' ? 'en' : 'hi',
      condition,
      symptoms: symptomString,
      qaPairs,
      triage: assessmentResult ? { riskLevel: assessmentResult.riskLevel, diagnosis: assessmentResult.diagnosis } : null,
    });

    const details = [
      `Condition track: ${conditionLabel[condition]}`,
      `Primary symptom set: ${symptomString.join(', ') || 'Not specified'}`,
      ...qaPairs.map((item, idx) => `Q${idx + 1}: ${item.question} | A: ${item.answer}`),
      assessmentResult ? `AI triage: ${assessmentResult.riskLevel} - ${assessmentResult.diagnosis}` : 'AI triage: Not run',
      `Generalized report: ${aiReport}`,
    ];
    return details.join('\n');
  };

  const submitAnswerAndProgress = async (explicitAnswer?: string) => {
    const answer = (explicitAnswer ?? qaCurrentResponse).trim();
    if (!answer || qaQuestions.length === 0) return;

    const nextAnswers = [...qaAnswers, answer];
    setQaAnswers(nextAnswers);
    setQaCurrentResponse('');

    if (qaCurrentIndex === 0) {
      const plan = await getGuidedInterviewPlan({
        primaryInput: answer,
        symptoms: symptomString,
        language: language === 'en' ? 'en' : 'hi',
      });
      setQaCondition(plan.condition);
      const nextQuestions = [getFirstGuidedQuestion(), ...plan.questions];
      setQaQuestions(nextQuestions);
      setQaCurrentIndex(1);
      return;
    }

    if (qaCurrentIndex < qaQuestions.length - 1) {
      setQaCurrentIndex((v) => v + 1);
      return;
    }

    setQaBuildingReport(true);
    try {
      const report = await buildGeneralizedReport(nextAnswers, qaCondition);
      setQaReport(report);
      sendGuidedReportToDoctor(report);
    } finally {
      setQaBuildingReport(false);
    }
  };

  const sendGuidedReportToDoctor = (reportText?: string) => {
    const reportPayload = (reportText ?? qaReport).trim();
    if (!reportPayload) return;
    const caseSummary = `Rural QA Report: ${conditionLabel[qaCondition]} (${assessmentResult?.riskLevel || 'MEDIUM'})`;
    createConsultationCase({
      patientPhone: user.phone,
      patientName: user.name,
      summary: caseSummary,
      riskLevel: assessmentResult?.riskLevel || 'MEDIUM',
      followUpAnswers: reportPayload.split('\n').filter(Boolean),
    });
    createRuralTeleconsultRequest({
      ownerPhone: user.phone,
      patientName: user.name,
      summary: caseSummary,
      voiceNoteText: reportPayload,
      status: 'SENT',
    });
    addTimelineEntry({ household: user.phone, patientName: user.name, entryType: 'TRIAGE', summary: 'Guided symptom report sent to doctor', details: caseSummary });
    refresh();
  };

  useEffect(() => {
    if (!qaAutoVoice) return;
    if (activeTab !== 'SYMPTOMS') return;
    if (!qaQuestions.length || qaReport || qaBuildingReport) return;
    if (qaCurrentResponse.trim()) return;
    if (isListening) return;

    const q = qaQuestions[qaCurrentIndex];
    if (!q) return;

    const key = `${qaCurrentIndex}:${q}`;
    if (qaSpokenKeyRef.current === key) return;
    qaSpokenKeyRef.current = key;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(q);
      utterance.lang = language === 'en' ? 'en-IN' : 'hi-IN';
      utterance.rate = 0.95;
      utterance.onend = () => {
        setTimeout(() => startListening('qa'), 120);
      };
      window.speechSynthesis.speak(utterance);
      return;
    }

    startListening('qa');
  }, [
    qaAutoVoice,
    activeTab,
    qaQuestions,
    qaCurrentIndex,
    qaReport,
    qaBuildingReport,
    qaCurrentResponse,
    isListening,
    language,
  ]);

  useEffect(() => {
    if (activeTab !== 'EDUCATION') return;
    if (healthGuideLoading) return;
    if (healthGuideCards.length > 0 && !guideContext.trim()) return;
    loadHealthGuideCards();
  }, [activeTab, language]);

  const facilities = [
    { name: 'Rampur PHC', km: 2.6, phone: '102', map: 'https://maps.google.com/?q=primary+health+center' },
    { name: 'District Hospital', km: 11.4, phone: '108', map: 'https://maps.google.com/?q=district+hospital' },
    { name: 'Maternal Care Unit', km: 5.2, phone: '108', map: 'https://maps.google.com/?q=maternal+care+unit' },
  ];

  const schemes = [
    { name: 'Janani Suraksha Yojana', help: 'Institutional delivery support' },
    { name: 'PMMVY', help: 'Maternity benefit support' },
    { name: 'Ayushman Bharat', help: 'Hospitalization coverage' },
  ];

  const moduleHeroMap: Record<Exclude<typeof activeTab, 'HOME'>, { subtitle: string; gradient: string }> = {
    EMERGENCY: { subtitle: 'Fast response and urgent escalation tools', gradient: 'from-red-500 via-rose-500 to-orange-500' },
    FAMILY: { subtitle: 'Family members, timeline and continuity of care', gradient: 'from-slate-700 via-slate-600 to-zinc-600' },
    SYMPTOMS: { subtitle: 'Voice-enabled AI triage and doctor escalation', gradient: 'from-cyan-600 via-sky-600 to-blue-600' },
    MEDS: { subtitle: 'Daily medicine plans and adherence tracking', gradient: 'from-emerald-600 via-teal-600 to-cyan-600' },
    PREGNANCY: { subtitle: 'Mother and newborn tracking in one workflow', gradient: 'from-pink-600 via-rose-500 to-orange-500' },
    RECORDS: { subtitle: 'Organized digital health record vault', gradient: 'from-violet-600 via-indigo-600 to-blue-600' },
    CONSULT: { subtitle: 'Create and monitor teleconsult requests', gradient: 'from-indigo-600 via-blue-600 to-cyan-600' },
    FACILITIES: { subtitle: 'Nearby facilities, call and navigation actions', gradient: 'from-amber-600 via-orange-600 to-rose-500' },
    NUTRITION: { subtitle: 'Localized diet planning for family health', gradient: 'from-lime-600 via-emerald-600 to-teal-600' },
    EDUCATION: { subtitle: 'Actionable guidance cards with audio playback', gradient: 'from-sky-600 via-cyan-600 to-teal-600' },
    IMMUNIZATION: { subtitle: 'Track due vaccines and completion status', gradient: 'from-yellow-500 via-amber-500 to-orange-500' },
    PRIVACY: { subtitle: 'Control data sharing and storage permissions', gradient: 'from-fuchsia-600 via-violet-600 to-indigo-600' },
    OFFLINE: { subtitle: 'Monitor queue health and sync reliability', gradient: 'from-emerald-600 via-cyan-600 to-blue-600' },
  };

  return (
    <div className={shellClass}>
      <TopBar
        title={t.title}
        subtitle={t.subtitle}
        right={
          <button className="text-xs font-black px-2 py-1 rounded-md bg-emerald-100 text-emerald-700" onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}>
            {language === 'en' ? 'HI' : 'EN'}
          </button>
        }
        onLogout={onLogout}
      />

      <div className="p-4 space-y-4 pb-24">
        {activeTab === 'HOME' && (
          <div className="space-y-4 animate-rise-in">
            <div className="rounded-3xl p-5 text-white" style={{ background: 'radial-gradient(95% 160% at 8% 8%, #f97316 0%, #ea580c 36%, #c2410c 100%)' }}>
              <p className="text-[11px] uppercase tracking-widest font-black text-orange-100">Rural Family Hub</p>
              <p className="text-2xl font-black mt-1">Care, Safety, And Health Records In One Place</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="bg-white/15 rounded-xl p-2"><p className="text-[10px] uppercase font-black">Family</p><p className="text-lg font-black">{family.length + 1}</p></div>
                <div className="bg-white/15 rounded-xl p-2"><p className="text-[10px] uppercase font-black">Cases</p><p className="text-lg font-black">{cases.length}</p></div>
                <div className="bg-white/15 rounded-xl p-2"><p className="text-[10px] uppercase font-black">Offline</p><p className="text-lg font-black">{syncQueue.filter((q) => q.status !== 'SYNCED').length}</p></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {moduleCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button key={card.key} onClick={() => setActiveTab(card.key)} className={`rounded-3xl border p-4 text-left flex flex-col gap-2 min-h-36 ${card.tone} soft-card`}>
                    <div className="w-11 h-11 rounded-xl bg-white border border-white/70 flex items-center justify-center"><Icon size={20} /></div>
                    <p className="font-black text-sm leading-tight">{t.tabs[card.key]}</p>
                    <p className="text-[11px] font-semibold opacity-75 leading-snug">{card.hint}</p>
                    <div className="mt-auto flex justify-end opacity-70">
                      <ChevronRight size={16} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab !== 'HOME' && (
          <>
            <div className="flex items-center justify-between">
              <button onClick={() => setActiveTab('HOME')} className="text-sm font-black text-slate-600">&larr; Back to modules</button>
              <span className="text-xs uppercase tracking-widest font-black text-slate-400">{t.tabs[activeTab]}</span>
            </div>

            <div className={`rounded-3xl p-4 text-white bg-gradient-to-r ${moduleHeroMap[activeTab].gradient}`}>
              <p className="text-[11px] uppercase tracking-widest font-black text-white/80">{t.tabs[activeTab]}</p>
              <p className="text-lg font-black mt-1">{moduleHeroMap[activeTab].subtitle}</p>
            </div>

            {activeTab === 'EMERGENCY' && (
              <div className="space-y-3">
                <div className="bg-white rounded-3xl border border-red-100 shadow-[0_12px_26px_-18px_rgba(239,68,68,0.5)] p-4">
                  <p className="text-xl font-black">Emergency Escalation</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">One-tap help for critical situations.</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => runEmergency('AMBULANCE_CALL')} className="rounded-xl bg-white border border-red-200 text-red-700 py-3 text-xs font-black">Call 108</button>
                  <button onClick={() => runEmergency('PHC_CALL')} className="rounded-xl bg-white border border-amber-200 text-amber-700 py-3 text-xs font-black">Call PHC</button>
                  <button onClick={() => runEmergency('CASE_SHARED')} className="rounded-xl bg-white border border-blue-200 text-blue-700 py-3 text-xs font-black">Share Case</button>
                </div>
                <button
                  onClick={() => {
                    if (!navigator.geolocation) return;
                    navigator.geolocation.getCurrentPosition((pos) => {
                      const text = `My location: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
                      if ((navigator as any).share) (navigator as any).share({ title: 'Emergency Location', text });
                      else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
                    });
                  }}
                  className="w-full rounded-xl bg-white border border-slate-200 py-3 text-sm font-black text-slate-700"
                >
                  Share Live Location
                </button>
              </div>
            )}

            {activeTab === 'FAMILY' && (
              <div className="space-y-3">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.4)] p-4 space-y-3">
                  <p className="font-black text-slate-900">Family Members</p>
                  <div className="space-y-2">
                    <div className="bg-slate-50 rounded-xl p-3"><p className="font-bold">{user.name} (Primary)</p><p className="text-xs text-slate-500">{user.phone}</p></div>
                    {family.map((member) => <div key={member.id} className="bg-slate-50 rounded-xl p-3"><p className="font-bold">{member.name} • {member.relation}</p><p className="text-xs text-slate-500">{member.age}y • {member.gender}</p></div>)}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} placeholder="Member name" className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-semibold" />
                    <input value={newMember.relation} onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })} placeholder="Relation" className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-semibold" />
                    <input value={newMember.age} onChange={(e) => setNewMember({ ...newMember, age: e.target.value.replace(/[^0-9]/g, '').slice(0, 3) })} placeholder="Age" className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-semibold" />
                    <select value={newMember.gender} onChange={(e) => setNewMember({ ...newMember, gender: e.target.value as FamilyMember['gender'] })} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-semibold"><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select>
                  </div>
                  <Btn label="Add Member" onClick={() => {
                    if (!newMember.name.trim() || !newMember.relation.trim() || !newMember.age) return;
                    addFamilyMember({ ownerPhone: user.phone, name: newMember.name.trim(), relation: newMember.relation.trim(), age: parseInt(newMember.age, 10), gender: newMember.gender });
                    addTimelineEntry({ household: user.phone, patientName: newMember.name.trim(), entryType: 'VISIT', summary: `Family member added (${newMember.relation.trim()})` });
                    setNewMember({ name: '', age: '', gender: 'Male', relation: '' });
                    refresh();
                  }} />
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.35)] p-4 space-y-2">
                  <p className="font-black text-slate-900">Health Timeline</p>
                  {timeline.slice(0, 8).map((item) => <div key={item.id} className="bg-slate-50 rounded-xl p-2"><p className="text-xs uppercase font-black text-slate-400">{item.entryType}</p><p className="text-sm font-semibold">{item.summary}</p></div>)}
                </div>
              </div>
            )}

            {activeTab === 'SYMPTOMS' && (
              <div className="space-y-3">
                <div className="bg-white rounded-3xl border border-cyan-100 shadow-[0_14px_30px_-22px_rgba(8,145,178,0.45)] p-4 space-y-3">
                  <p className="font-black text-slate-900">AI Symptom Triage + Voice</p>
                  <div className="grid grid-cols-2 gap-2">
                    {symptomsPool.map((label) => (
                      <button key={label} onClick={() => setSelectedSymptoms((prev) => prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label])} className={`rounded-xl py-2 text-xs font-black border ${selectedSymptoms.includes(label) ? 'bg-orange-600 text-white border-orange-600' : 'bg-white border-slate-200 text-slate-700'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <input value={customSymptom} onChange={(e) => setCustomSymptom(e.target.value)} placeholder="Any additional symptom or voice text" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-semibold" />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => (isListening ? stopListening() : startListening('symptom'))} className={`rounded-xl py-3 text-sm font-black flex items-center justify-center gap-2 ${isListening ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-800'}`}><Mic size={16} />{isListening ? 'Stop' : 'Voice Input'}</button>
                    <button onClick={() => assessmentResult && speakText([assessmentResult.diagnosis, ...assessmentResult.recommendations].join('. '))} className="rounded-xl py-3 text-sm font-black flex items-center justify-center gap-2 bg-blue-50 text-blue-700"><Volume2 size={16} />Speak Advice</button>
                  </div>
                  {voiceBusy && <p className="text-xs font-bold text-slate-500">Transcribing voice...</p>}
                  {voiceError && <p className="text-xs font-bold text-red-600">{voiceError}</p>}
                  <Btn label={assessmentLoading ? 'Analyzing...' : 'Analyze Symptoms'} disabled={assessmentLoading || symptomString.length === 0} onClick={async () => {
                    setAssessmentLoading(true);
                    try {
                      const result = await analyzeSymptoms({ symptoms: symptomString, language });
                      setAssessmentResult(result);
                      saveAssessment({ patientPhone: user.phone, patientName: user.name, symptoms: symptomString, riskLevel: result.riskLevel, diagnosis: result.diagnosis, recommendations: result.recommendations });
                      addTimelineEntry({ household: user.phone, patientName: user.name, entryType: 'TRIAGE', summary: `${result.riskLevel} triage`, details: result.diagnosis });
                      refresh();
                    } finally {
                      setAssessmentLoading(false);
                    }
                  }} />
                </div>

                <div className="bg-white rounded-3xl border border-blue-100 shadow-[0_14px_30px_-22px_rgba(37,99,235,0.35)] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-slate-900">Doctor Guided Q&A (Voice Enabled)</p>
                    <button onClick={startGuidedInterview} className="text-xs font-black px-3 py-1 rounded-lg bg-blue-100 text-blue-700">{t.common.start}</button>
                  </div>
                  <label className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-black text-slate-700">
                    <span>{t.common.handsFree}</span>
                    <input type="checkbox" checked={qaAutoVoice} onChange={(e) => setQaAutoVoice(e.target.checked)} />
                  </label>
                  <p className="text-xs font-semibold text-slate-500">System asks follow-up questions based on your first answer. Example: if first answer mentions cough, next questions are respiratory-focused.</p>

                  {qaQuestions.length > 0 && !qaReport && (
                    <div className="space-y-2 bg-slate-50 rounded-2xl p-3 border border-slate-200">
                      <p className="text-xs uppercase tracking-widest font-black text-slate-400">Question {qaCurrentIndex + 1}</p>
                      <p className="text-sm font-black text-slate-900">{qaQuestions[qaCurrentIndex]}</p>
                      <input
                        value={qaCurrentResponse}
                        onChange={(e) => setQaCurrentResponse(e.target.value)}
                        placeholder="Type or record your answer"
                        className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm font-semibold"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => (isListening ? stopListening() : startListening('qa'))} className={`rounded-xl py-2 text-xs font-black flex items-center justify-center gap-2 ${isListening ? 'bg-red-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}><Mic size={14} />{isListening ? 'Stop' : t.common.recordAnswer}</button>
                        <button onClick={submitAnswerAndProgress} disabled={!qaCurrentResponse.trim() || qaBuildingReport} className="rounded-xl py-2 text-xs font-black bg-slate-900 text-white disabled:opacity-50">{qaBuildingReport ? t.common.buildingReport : t.common.submitAnswer}</button>
                      </div>
                      {qaAnswers.length > 0 && (
                        <div className="pt-1 space-y-1">
                          <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Responses</p>
                          {qaAnswers.map((ans, i) => (
                            <div key={`${ans}-${i}`} className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700">
                              <span className="font-black text-slate-500">Q{i + 1}:</span> {ans}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {qaReport && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-widest font-black text-blue-500">{t.common.reportReady}</p>
                      <pre className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-700 whitespace-pre-wrap">{qaReport}</pre>
                      <Btn label={t.common.sendToDoctor} onClick={sendGuidedReportToDoctor} />
                    </div>
                  )}
                </div>

                {assessmentResult && (
                  <div className="bg-white rounded-3xl border border-blue-100 shadow-[0_14px_30px_-22px_rgba(37,99,235,0.4)] p-4 space-y-3">
                    <div className="flex justify-between items-center"><p className="font-black text-slate-900">Assessment Result</p><span className={`text-xs font-black px-2 py-1 rounded-full ${severityTone(assessmentResult.riskLevel)}`}>{assessmentResult.riskLevel}</span></div>
                    <p className="font-bold text-slate-900">{assessmentResult.diagnosis}</p>
                    {assessmentResult.recommendations.map((item, index) => <div key={`${item}-${index}`} className="bg-slate-50 rounded-xl p-2 text-sm font-semibold text-slate-700">{item}</div>)}
                    <Btn label="Send To Doctor" onClick={requestDoctorFromAssessment} />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'MEDS' && (
              <div className="space-y-3">
                <div className="bg-white rounded-3xl border border-emerald-100 shadow-[0_14px_30px_-22px_rgba(5,150,105,0.45)] p-4 space-y-2">
                  <p className="font-black">Medicine Schedule</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={medForm.patientName} onChange={(e) => setMedForm({ ...medForm, patientName: e.target.value })} placeholder="Patient" className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm" />
                    <input value={medForm.medicineName} onChange={(e) => setMedForm({ ...medForm, medicineName: e.target.value })} placeholder="Medicine" className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm" />
                    <input value={medForm.schedule} onChange={(e) => setMedForm({ ...medForm, schedule: e.target.value })} placeholder="Schedule e.g. 1-0-1" className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm col-span-2" />
                  </div>
                  <Btn label="Add Reminder Plan" onClick={saveMedicationPlan} />
                </div>
                {medPlans.map((plan) => {
                  const today = new Date().toISOString().slice(0, 10);
                  const taken = medLogs.some((log) => log.planId === plan.id && log.date === today && log.taken);
                  return (
                    <div key={plan.id} className="bg-white rounded-2xl border border-emerald-100 p-3 shadow-[0_10px_22px_-18px_rgba(5,150,105,0.35)]">
                      <p className="font-black">{plan.patientName} • {plan.medicineName}</p>
                      <p className="text-xs text-slate-500 font-semibold">{plan.schedule}</p>
                      <button onClick={() => { markRuralDose({ planId: plan.id, ownerPhone: user.phone, date: today, taken: !taken }); refresh(); }} className={`mt-2 px-3 py-1 rounded-lg text-xs font-black ${taken ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {taken ? 'Taken Today' : 'Mark Taken'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'PREGNANCY' && (
              <div className="space-y-3">
                <div className="bg-white rounded-3xl border border-pink-100 shadow-[0_14px_30px_-22px_rgba(236,72,153,0.45)] p-4 space-y-2">
                  <p className="font-black">Pregnancy Tracker</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={pregForm.motherName} onChange={(e) => setPregForm({ ...pregForm, motherName: e.target.value })} placeholder="Mother name" className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm" />
                    <input type="date" value={pregForm.lmpDate} onChange={(e) => setPregForm({ ...pregForm, lmpDate: e.target.value })} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm" />
                    <input type="date" value={pregForm.expectedDeliveryDate} onChange={(e) => setPregForm({ ...pregForm, expectedDeliveryDate: e.target.value })} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm" />
                    <input value={pregForm.ancVisitsCompleted} onChange={(e) => setPregForm({ ...pregForm, ancVisitsCompleted: e.target.value.replace(/[^0-9]/g, '') })} placeholder="ANC visits" className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm" />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={pregForm.highRisk} onChange={(e) => setPregForm({ ...pregForm, highRisk: e.target.checked })} />High Risk</label>
                  <textarea value={pregForm.notes} onChange={(e) => setPregForm({ ...pregForm, notes: e.target.value })} placeholder="Notes" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 h-20 text-sm" />
                  <Btn label="Save Pregnancy Tracker" onClick={savePregnancy} />
                </div>
                {pregTrackers.map((item) => <div key={item.id} className="bg-white rounded-2xl border border-pink-100 p-3 shadow-[0_10px_22px_-18px_rgba(236,72,153,0.35)]"><p className="font-black">{item.motherName}</p><p className="text-xs text-slate-500 font-semibold">EDD: {item.expectedDeliveryDate} • ANC: {item.ancVisitsCompleted}</p>{item.highRisk && <p className="text-xs font-black text-red-600 mt-1">High-risk follow-up needed</p>}</div>)}

                <div className="bg-white rounded-3xl border border-rose-100 shadow-[0_14px_30px_-22px_rgba(244,63,94,0.4)] p-4 space-y-2">
                  <p className="font-black">Newborn Tracker</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newbornForm.babyName} onChange={(e) => setNewbornForm({ ...newbornForm, babyName: e.target.value })} placeholder="Baby name" className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm" />
                    <input type="date" value={newbornForm.dob} onChange={(e) => setNewbornForm({ ...newbornForm, dob: e.target.value })} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm" />
                    <input value={newbornForm.weightKg} onChange={(e) => setNewbornForm({ ...newbornForm, weightKg: e.target.value })} placeholder="Weight kg" className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm" />
                    <select value={newbornForm.breastfeedingStatus} onChange={(e) => setNewbornForm({ ...newbornForm, breastfeedingStatus: e.target.value as RuralNewbornTracker['breastfeedingStatus'] })} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm"><option value="EXCLUSIVE">Exclusive BF</option><option value="MIXED">Mixed</option><option value="FORMULA">Formula</option></select>
                  </div>
                  <input value={newbornForm.warningFlags} onChange={(e) => setNewbornForm({ ...newbornForm, warningFlags: e.target.value })} placeholder="Warning flags comma separated" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm" />
                  <Btn label="Save Newborn Tracker" onClick={saveNewborn} />
                </div>
                {newbornTrackers.map((item) => <div key={item.id} className="bg-white rounded-2xl border border-rose-100 p-3 shadow-[0_10px_22px_-18px_rgba(244,63,94,0.35)]"><p className="font-black">{item.babyName}</p><p className="text-xs text-slate-500 font-semibold">DOB: {item.dob} • BF: {item.breastfeedingStatus}</p>{item.warningFlags.length > 0 && <p className="text-xs font-semibold text-red-600 mt-1">Flags: {item.warningFlags.join(', ')}</p>}</div>)}
              </div>
            )}

            {activeTab === 'RECORDS' && (
              <div className="space-y-3">
                <div className="bg-white rounded-3xl border border-violet-100 shadow-[0_14px_30px_-22px_rgba(124,58,237,0.4)] p-4 space-y-2">
                  <p className="font-black">Digital Health Records Vault</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={docForm.patientName} onChange={(e) => setDocForm({ ...docForm, patientName: e.target.value })} placeholder="Patient" className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm" />
                    <select value={docForm.docType} onChange={(e) => setDocForm({ ...docForm, docType: e.target.value as RuralRecordDocument['docType'] })} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm"><option value="PRESCRIPTION">Prescription</option><option value="LAB_REPORT">Lab Report</option><option value="DISCHARGE_SUMMARY">Discharge</option><option value="OTHER">Other</option></select>
                    <input value={docForm.title} onChange={(e) => setDocForm({ ...docForm, title: e.target.value })} placeholder="Title" className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm col-span-2" />
                    <input value={docForm.fileUrl} onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })} placeholder="File URL (optional)" className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm col-span-2" />
                  </div>
                  <textarea value={docForm.notes} onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })} placeholder="Notes" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 h-20 text-sm" />
                  <Btn label="Save Document" onClick={saveDocument} />
                </div>
                {docs.map((doc) => <div key={doc.id} className="bg-white rounded-2xl border border-violet-100 p-3 shadow-[0_10px_22px_-18px_rgba(124,58,237,0.3)]"><p className="font-black">{doc.title}</p><p className="text-xs text-slate-500 font-semibold">{doc.docType} • {doc.patientName}</p>{doc.fileUrl && <a href={doc.fileUrl} target="_blank" className="text-xs font-black text-blue-700">Open File</a>}</div>)}
              </div>
            )}

            {activeTab === 'CONSULT' && (
              <div className="space-y-3">
                <div className="bg-white rounded-3xl border border-indigo-100 shadow-[0_14px_30px_-22px_rgba(79,70,229,0.45)] p-4 space-y-2">
                  <p className="font-black">Teleconsult Request</p>
                  <input value={consultForm.patientName} onChange={(e) => setConsultForm({ ...consultForm, patientName: e.target.value })} placeholder="Patient name" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm" />
                  <textarea value={consultForm.summary} onChange={(e) => setConsultForm({ ...consultForm, summary: e.target.value })} placeholder="Symptoms and concern summary" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 h-20 text-sm" />
                  <textarea value={consultForm.voiceNoteText} onChange={(e) => setConsultForm({ ...consultForm, voiceNoteText: e.target.value })} placeholder="Voice note transcript (optional)" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 h-16 text-sm" />
                  <Btn label="Send Teleconsult" onClick={sendTeleconsult} />
                </div>
                {teleconsults.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-indigo-100 p-3 space-y-2 shadow-[0_10px_22px_-18px_rgba(79,70,229,0.3)]">
                    <div className="flex justify-between"><p className="font-black">{item.patientName}</p><span className="text-xs font-black px-2 py-1 rounded-full bg-blue-100 text-blue-700">{item.status}</span></div>
                    <p className="text-sm font-semibold text-slate-700">{item.summary}</p>
                    <select value={item.status} onChange={(e) => { updateRuralTeleconsultStatus({ id: item.id, status: e.target.value as RuralTeleconsultRequest['status'] }); refresh(); }} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold">
                      <option value="SENT">SENT</option><option value="VIEWED">VIEWED</option><option value="RESPONDED">RESPONDED</option><option value="FOLLOW_UP">FOLLOW_UP</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'FACILITIES' && (
              <div className="space-y-2">
                {facilities.map((f) => (
                  <div key={f.name} className="bg-white rounded-2xl border border-amber-100 p-3 space-y-2 shadow-[0_10px_22px_-18px_rgba(245,158,11,0.35)]">
                    <p className="font-black">{f.name}</p>
                    <p className="text-xs font-semibold text-slate-500">{f.km} km away</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => window.open(`tel:${f.phone}`)} className="rounded-lg bg-amber-100 text-amber-700 py-2 text-xs font-black">Call</button>
                      <button onClick={() => window.open(f.map, '_blank')} className="rounded-lg bg-blue-100 text-blue-700 py-2 text-xs font-black">Open Map</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'NUTRITION' && (
              <div className="space-y-3">
                <div className="bg-white rounded-3xl border border-lime-100 shadow-[0_14px_30px_-22px_rgba(101,163,13,0.45)] p-4 space-y-3">
                  <p className="font-black">{t.common.poshanTitle}</p>
                  <textarea value={nutritionContext} onChange={(e) => setNutritionContext(e.target.value)} placeholder={t.common.poshanPlaceholder} className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 h-24 text-sm font-semibold" />
                  <Btn label={nutritionLoading ? (language === 'en' ? 'Generating...' : 'बन रहा है...') : t.common.poshanGenerate} disabled={nutritionLoading || !nutritionContext.trim()} onClick={async () => {
                    setNutritionLoading(true);
                    try {
                      const result = await getNutritionAdvice({ context: nutritionContext, language });
                      setNutritionResult(result);
                    } finally {
                      setNutritionLoading(false);
                    }
                  }} />
                </div>
                {nutritionResult && <div className="bg-white rounded-3xl border border-lime-100 shadow-[0_14px_30px_-22px_rgba(101,163,13,0.35)] p-4 space-y-2"><p className="font-black">{nutritionResult.summary}</p>{nutritionResult.tips.map((tip, i) => <div key={`${tip}-${i}`} className="bg-green-50 border border-green-100 rounded-xl p-2 text-sm font-semibold">{tip}</div>)}</div>}
              </div>
            )}

            {activeTab === 'EDUCATION' && (
              <div className="space-y-3">
                <div className="bg-white rounded-3xl border border-sky-100 shadow-[0_14px_30px_-22px_rgba(14,165,233,0.35)] p-4 space-y-2">
                  <p className="font-black">{t.common.swasthyaTitle}</p>
                  <p className="text-xs font-semibold text-slate-500">{t.common.swasthyaContext}</p>
                  <textarea value={guideContext} onChange={(e) => setGuideContext(e.target.value)} placeholder={t.common.swasthyaContextPlaceholder} className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 h-20 text-sm font-semibold" />
                  <Btn label={healthGuideLoading ? (language === 'en' ? 'Generating...' : 'बन रहा है...') : t.common.swasthyaGenerate} disabled={healthGuideLoading} onClick={loadHealthGuideCards} />
                </div>

                {healthGuideCards.map((item) => (
                  <div key={item.title} className="bg-white rounded-2xl border border-sky-100 p-3 space-y-2 shadow-[0_10px_22px_-18px_rgba(14,165,233,0.35)]">
                    <p className="font-black">{item.title}</p>
                    <p className="text-sm font-semibold text-slate-700">{item.text}</p>
                    <button onClick={() => speakText(item.text)} className="rounded-lg bg-sky-100 text-sky-700 px-3 py-1 text-xs font-black">Play Audio</button>
                  </div>
                ))}
                {!healthGuideLoading && healthGuideCards.length === 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-3 text-sm font-semibold text-slate-500">
                    {language === 'en' ? 'No guide generated yet. Tap Generate to fetch AI guidance.' : 'अभी कोई गाइड नहीं बना है। AI गाइड पाने के लिए Generate दबाएं।'}
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-sky-100 p-3 shadow-[0_10px_22px_-18px_rgba(14,165,233,0.3)]">
                  <p className="font-black mb-2">{t.common.schemesTitle}</p>
                  {schemes.map((s) => <div key={s.name} className="bg-slate-50 rounded-lg p-2 mb-2"><p className="text-sm font-black">{s.name}</p><p className="text-xs font-semibold text-slate-600">{s.help}</p></div>)}
                </div>
              </div>
            )}

            {activeTab === 'IMMUNIZATION' && (
              <div className="space-y-3">
                <div className="bg-white rounded-3xl border border-yellow-100 shadow-[0_14px_30px_-22px_rgba(234,179,8,0.4)] p-4 space-y-2">
                  <p className="font-black">Immunization Due Tracker</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={immunForm.childName} onChange={(e) => setImmunForm({ ...immunForm, childName: e.target.value })} placeholder="Child name" className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm" />
                    <input value={immunForm.vaccineName} onChange={(e) => setImmunForm({ ...immunForm, vaccineName: e.target.value })} placeholder="Vaccine" className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm" />
                    <input type="date" value={immunForm.dueDate} onChange={(e) => setImmunForm({ ...immunForm, dueDate: e.target.value })} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm col-span-2" />
                  </div>
                  <Btn label="Add Vaccine Due" onClick={saveImmunization} />
                </div>
                {immunizations.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-yellow-100 p-3 flex items-center justify-between shadow-[0_10px_22px_-18px_rgba(234,179,8,0.35)]">
                    <div><p className="font-black">{item.childName} • {item.vaccineName}</p><p className="text-xs text-slate-500 font-semibold">Due: {item.dueDate}</p></div>
                    <button onClick={() => { setRuralImmunizationCompleted({ id: item.id, completed: !item.completed }); refresh(); }} className={`px-3 py-1 rounded-lg text-xs font-black ${item.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{item.completed ? 'Done' : 'Mark Done'}</button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'PRIVACY' && (
              <div className="bg-white rounded-3xl border border-fuchsia-100 shadow-[0_14px_30px_-22px_rgba(192,38,211,0.4)] p-4 space-y-3">
                <p className="font-black">Privacy & Consent Controls</p>
                <label className="flex items-center justify-between text-sm font-semibold"><span>Share data with ASHA</span><input type="checkbox" checked={privacy?.shareWithAsha ?? true} onChange={(e) => savePrivacy({ shareWithAsha: e.target.checked })} /></label>
                <label className="flex items-center justify-between text-sm font-semibold"><span>Share data with Doctor</span><input type="checkbox" checked={privacy?.shareWithDoctor ?? true} onChange={(e) => savePrivacy({ shareWithDoctor: e.target.checked })} /></label>
                <label className="flex items-center justify-between text-sm font-semibold"><span>Allow voice storage</span><input type="checkbox" checked={privacy?.allowVoiceStorage ?? true} onChange={(e) => savePrivacy({ allowVoiceStorage: e.target.checked })} /></label>
                <label className="flex items-center justify-between text-sm font-semibold"><span>Allow face storage</span><input type="checkbox" checked={privacy?.allowFaceStorage ?? true} onChange={(e) => savePrivacy({ allowFaceStorage: e.target.checked })} /></label>
              </div>
            )}

            {activeTab === 'OFFLINE' && (
              <div className="space-y-3">
                <div className="bg-white rounded-3xl border border-emerald-100 shadow-[0_14px_30px_-22px_rgba(16,185,129,0.4)] p-4 space-y-2">
                  <p className="font-black">Offline Queue & Sync</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Btn label="Process Sync" onClick={() => setSyncQueue(processSyncQueue())} />
                    <Btn label="Retry Failed" tone="secondary" onClick={() => { retryFailedSync(); setSyncQueue(processSyncQueue()); }} />
                  </div>
                  {syncQueue.slice(0, 12).map((item) => (
                    <div key={item.id} className="bg-slate-50 rounded-xl p-2 flex items-center justify-between">
                      <p className="text-xs font-semibold">{item.entityType}: {item.actionType}</p>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full ${item.status === 'SYNCED' ? 'bg-green-100 text-green-700' : item.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const AshaDashboard: React.FC<{ user: AppUser; onLogout: () => void; language: Language }> = ({ user, onLogout, language }) => {
  const [tab, setTab] = useState<'HOME' | 'TASKS' | 'STOCK' | 'TRIAGE' | 'HOUSEHOLDS' | 'REFERRALS' | 'ADHERENCE' | 'PLANNING' | 'SUPERVISOR'>('HOME');
  const [ashaLanguage, setAshaLanguage] = useState<'en' | 'hi' | 'mr'>(language === 'en' ? 'en' : 'hi');

  const [tasks, setTasks] = useState<AshaTask[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stockForecast, setStockForecast] = useState<Array<InventoryItem & { daysLeft: number; risk: 'LOW' | 'MEDIUM' | 'HIGH' }>>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [adherencePlans, setAdherencePlans] = useState<AdherencePlan[]>([]);
  const [adherenceLogs, setAdherenceLogs] = useState<AdherenceLog[]>([]);
  const [microPlans, setMicroPlans] = useState<MicroPlanEvent[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [emergencyLogs, setEmergencyLogs] = useState<EmergencyActionLog[]>([]);

  const [selectedHousehold, setSelectedHousehold] = useState('Ward 3 - House 45');
  const [timeline, setTimeline] = useState<HouseholdTimelineEntry[]>([]);
  const [vitalsHistory, setVitalsHistory] = useState<VitalRecord[]>([]);

  const [symptomsInput, setSymptomsInput] = useState('');
  const [triageBusy, setTriageBusy] = useState(false);
  const [triageResult, setTriageResult] = useState<{ riskLevel: RiskLevel; diagnosis: string; recommendations: string[]; confidence: number } | null>(null);
  const [dangerFlags, setDangerFlags] = useState<string[]>([]);

  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [voiceBusy, setVoiceBusy] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [patientNameInput, setPatientNameInput] = useState('');
  const [vitalsForm, setVitalsForm] = useState({ bpSystolic: '120', bpDiastolic: '80', pulse: '78', temperatureC: '98.4', spo2: '98', weightKg: '', muacCm: '' });
  const [visitNote, setVisitNote] = useState('');
  const [noteBusy, setNoteBusy] = useState(false);

  const [adherenceForm, setAdherenceForm] = useState({ household: '', patientName: '', condition: '', medicineName: '', doseSchedule: '' });
  const [planForm, setPlanForm] = useState({ eventType: 'HOME_VISIT' as MicroPlanEvent['eventType'], title: '', household: '', dueDate: '' });
  const [counselingTopic, setCounselingTopic] = useState<'fever' | 'diarrhea' | 'pregnancy' | 'newborn' | 'nutrition'>('fever');

  const ashaI18n = {
    en: {
      title: 'ASHA Field Console',
      welcome: `Welcome, ${user.name}`,
      tabs: {
        TASKS: 'Tasks',
        STOCK: 'Stock',
        TRIAGE: 'Triage',
        HOUSEHOLDS: 'Households',
        REFERRALS: 'Referrals',
        ADHERENCE: 'Adherence',
        PLANNING: 'Planning',
        SUPERVISOR: 'Supervisor',
      },
      startVoice: 'Start Voice Input',
      startRecord: 'Start Voice Recording',
      stopVoice: 'Stop',
      triage: 'Walk-in Triage',
      analyze: 'Analyze Symptoms',
      createReferral: 'Refer Immediately',
      noSpeech: 'No speech detected. Please retry.',
      permission: 'Microphone permission denied.',
      captureFailed: 'Voice capture failed.',
      unsupported: 'Voice input is not supported in this browser.',
      aiNeeded: 'Voice fallback needs Gemini API key.',
      transcribing: 'Transcribing voice...',
      speakResult: 'Speak Result',
    },
    hi: {
      title: 'आशा फील्ड कंसोल',
      welcome: `स्वागत है, ${user.name}`,
      tabs: {
        TASKS: 'कार्य',
        STOCK: 'स्टॉक',
        TRIAGE: 'ट्रायेज',
        HOUSEHOLDS: 'परिवार',
        REFERRALS: 'रेफरल',
        ADHERENCE: 'दवा पालन',
        PLANNING: 'योजना',
        SUPERVISOR: 'सुपरवाइजर',
      },
      startVoice: 'आवाज इनपुट',
      startRecord: 'आवाज रिकॉर्ड',
      stopVoice: 'रोकें',
      triage: 'वॉक-इन ट्रायेज',
      analyze: 'लक्षण विश्लेषण',
      createReferral: 'तुरंत रेफर करें',
      noSpeech: 'आवाज नहीं मिली। फिर से कोशिश करें।',
      permission: 'माइक्रोफोन अनुमति नहीं मिली।',
      captureFailed: 'वॉइस कैप्चर विफल।',
      unsupported: 'इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है।',
      aiNeeded: 'फॉलबैक के लिए Gemini key चाहिए।',
      transcribing: 'आवाज को टेक्स्ट में बदल रहा है...',
      speakResult: 'परिणाम सुनें',
    },
    mr: {
      title: 'आशा फील्ड कन्सोल',
      welcome: `स्वागत, ${user.name}`,
      tabs: {
        TASKS: 'कामे',
        STOCK: 'साठा',
        TRIAGE: 'ट्रायेज',
        HOUSEHOLDS: 'कुटुंबे',
        REFERRALS: 'रेफरल',
        ADHERENCE: 'औषध पालन',
        PLANNING: 'नियोजन',
        SUPERVISOR: 'पर्यवेक्षक',
      },
      startVoice: 'आवाज इनपुट',
      startRecord: 'आवाज रेकॉर्ड',
      stopVoice: 'थांबवा',
      triage: 'वॉक-इन ट्रायेज',
      analyze: 'लक्षण विश्लेषण',
      createReferral: 'ताबडतोब रेफर करा',
      noSpeech: 'आवाज सापडला नाही.',
      permission: 'मायक्रोफोन परवानगी नाही.',
      captureFailed: 'व्हॉइस कॅप्चर अयशस्वी.',
      unsupported: 'या ब्राउझरमध्ये व्हॉइस इनपुट उपलब्ध नाही.',
      aiNeeded: 'फॉलबॅकसाठी Gemini key आवश्यक आहे.',
      transcribing: 'आवाज मजकुरात बदलत आहे...',
      speakResult: 'निकाल ऐका',
    },
  } as const;

  const t = ashaI18n[ashaLanguage];
  const speechLang = ashaLanguage === 'en' ? 'en-IN' : ashaLanguage === 'mr' ? 'mr-IN' : 'hi-IN';
  const aiLanguage: Language = ashaLanguage === 'en' ? 'en' : 'hi';

  const counselingScripts = {
    fever: {
      en: 'Give ORS and fluids, check temperature every 4 hours, and refer if breathing difficulty or persistent fever > 2 days.',
      hi: 'ORS और तरल दें, हर 4 घंटे में तापमान देखें, 2 दिन से ज्यादा बुखार या सांस में दिक्कत हो तो रेफर करें।',
      mr: 'ORS व द्रव द्या, प्रत्येक 4 तासांनी तापमान तपासा, 2 दिवसांपेक्षा जास्त ताप किंवा श्वासोच्छवास अडचण असल्यास रेफर करा.',
    },
    diarrhea: {
      en: 'Start ORS immediately, continue feeding, watch dehydration signs, and refer if blood in stool or lethargy.',
      hi: 'तुरंत ORS शुरू करें, खाना जारी रखें, डिहाइड्रेशन के संकेत देखें, मल में खून या सुस्ती हो तो रेफर करें।',
      mr: 'ताबडतोब ORS सुरू करा, आहार सुरू ठेवा, निर्जलीकरण लक्षणे पाहा, मलात रक्त किंवा जास्त सुस्ती असल्यास रेफर करा.',
    },
    pregnancy: {
      en: 'Track ANC visits, ensure iron-folic tablets, monitor BP and edema, and escalate for headache, bleeding, or high BP.',
      hi: 'ANC विजिट ट्रैक करें, आयरन-फोलिक टैबलेट सुनिश्चित करें, BP और सूजन देखें, सिरदर्द/ब्लीडिंग/उच्च BP पर रेफर करें।',
      mr: 'ANC भेटी ट्रॅक करा, आयर्न-फोलिक गोळ्या द्या, BP व सूज तपासा, डोकेदुखी/रक्तस्त्राव/उच्च BP असल्यास रेफर करा.',
    },
    newborn: {
      en: 'Promote breastfeeding, warmth, hygiene, and danger sign monitoring for poor feeding, fast breathing, or fever.',
      hi: 'स्तनपान, गर्माहट, स्वच्छता और खतरे के संकेत (कम दूध पीना, तेज सांस, बुखार) पर निगरानी रखें।',
      mr: 'स्तनपान, उब, स्वच्छता आणि धोका लक्षणे (कमी दूध पिणे, जलद श्वास, ताप) यावर लक्ष ठेवा.',
    },
    nutrition: {
      en: 'Use local seasonal foods, include pulses and greens, monitor child growth monthly, and counsel on clean water.',
      hi: 'स्थानीय मौसमी भोजन दें, दाल और हरी सब्जी शामिल करें, बच्चे की वृद्धि मासिक देखें, और साफ पानी पर सलाह दें।',
      mr: 'स्थानिक मोसमी अन्न वापरा, डाळी व हिरव्या भाज्या द्या, मुलांची वाढ मासिक तपासा, स्वच्छ पाण्याबाबत समुपदेशन करा.',
    },
  } as const;

  const dangerSignRules = (symptoms: string[]) => {
    const lower = symptoms.map((s) => s.toLowerCase());
    const flags: string[] = [];
    if (lower.some((s) => s.includes('breath') || s.includes('सांस') || s.includes('श्वास'))) flags.push('Respiratory danger sign');
    if (lower.some((s) => s.includes('bleed') || s.includes('खून') || s.includes('रक्त'))) flags.push('Bleeding danger sign');
    if (lower.some((s) => s.includes('convulsion') || s.includes('seizure') || s.includes('दौरा'))) flags.push('Neurological danger sign');
    if (lower.some((s) => s.includes('chest pain') || s.includes('सीने'))) flags.push('Cardiac warning sign');
    return flags;
  };

  const refresh = () => {
    setTasks(listAshaTasks());
    setInventory(listInventory());
    setStockForecast(forecastInventoryRisk());
    setSyncQueue(listSyncQueue());
    setReferrals(listReferrals());
    setAdherencePlans(listAdherencePlans());
    setAdherenceLogs(listAdherenceLogs());
    setMicroPlans(listMicroPlanEvents());
    setConsents(listConsents());
    setEmergencyLogs(listEmergencyLogs());
    setTimeline(listTimelineByHousehold(selectedHousehold));
    setVitalsHistory(listVitalsByHousehold(selectedHousehold));
  };

  const stopAudioStream = () => {
    if (!audioStreamRef.current) return;
    audioStreamRef.current.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // no-op
    }
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      // no-op
    }
  };

  const blobToBase64 = async (blob: Blob) => {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  };

  const startRecorderFallback = async () => {
    if (!isAiEnabled()) {
      setVoiceError(t.aiNeeded);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.onstart = () => setIsListening(true);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setIsListening(false);
        setVoiceError(t.captureFailed);
        stopAudioStream();
      };
      recorder.onstop = async () => {
        setIsListening(false);
        setVoiceBusy(true);
        try {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          if (!blob.size) {
            setVoiceError(t.noSpeech);
            return;
          }
          const transcript = await transcribeAudioToText({
            audioBase64: await blobToBase64(blob),
            mimeType: 'audio/webm',
            language: ashaLanguage,
          });
          if (!transcript) {
            setVoiceError(t.noSpeech);
            return;
          }
          setVoiceError('');
          setSymptomsInput((prev) => (prev.trim() ? `${prev.trim()}, ${transcript}` : transcript));
        } finally {
          setVoiceBusy(false);
          stopAudioStream();
        }
      };
      recorder.start();
    } catch {
      setVoiceError(t.permission);
      setIsListening(false);
      stopAudioStream();
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (navigator.mediaDevices?.getUserMedia && window.MediaRecorder) {
        startRecorderFallback();
        return;
      }
      setVoiceError(t.unsupported);
      return;
    }

    setVoiceError('');
    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') setVoiceError(t.permission);
      else if (event?.error === 'no-speech') setVoiceError(t.noSpeech);
      else setVoiceError(t.captureFailed);
    };
    recognition.onresult = (event: any) => {
      const transcript = String(event?.results?.[0]?.[0]?.transcript || '').trim();
      if (!transcript) return;
      setSymptomsInput((prev) => (prev.trim() ? `${prev.trim()}, ${transcript}` : transcript));
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const refreshSync = () => setSyncQueue(processSyncQueue());

  const retrySync = () => {
    retryFailedSync();
    setSyncQueue(processSyncQueue());
  };

  const runTriage = async () => {
    const parsed = symptomsInput.split(',').map((s) => s.trim()).filter(Boolean);
    if (parsed.length === 0) return;
    setTriageBusy(true);
    try {
      const result = await analyzeSymptoms({ symptoms: parsed, language: aiLanguage });
      setTriageResult(result);
      const flags = dangerSignRules(parsed);
      setDangerFlags(flags);
      addTimelineEntry({
        household: selectedHousehold,
        patientName: patientNameInput.trim() || 'Unknown',
        entryType: 'TRIAGE',
        summary: `${result.riskLevel} risk triage recorded`,
        details: parsed.join(', '),
      });
      if (result.riskLevel === 'HIGH' || flags.length > 0) {
        createReferral({
          household: selectedHousehold,
          patientName: patientNameInput.trim() || 'Unknown',
          reason: flags.length > 0 ? flags.join('; ') : result.diagnosis,
          riskLevel: 'HIGH',
          status: 'REFERRED',
          facilityName: 'Nearest PHC',
          transportMode: 'Ambulance',
        });
      }
      refresh();
    } finally {
      setTriageBusy(false);
    }
  };

  const saveVitals = () => {
    if (!patientNameInput.trim()) return;
    saveVitalRecord({
      household: selectedHousehold,
      patientName: patientNameInput.trim(),
      bpSystolic: parseInt(vitalsForm.bpSystolic || '0', 10),
      bpDiastolic: parseInt(vitalsForm.bpDiastolic || '0', 10),
      pulse: parseInt(vitalsForm.pulse || '0', 10),
      temperatureC: parseFloat(vitalsForm.temperatureC || '0'),
      spo2: parseInt(vitalsForm.spo2 || '0', 10),
      weightKg: vitalsForm.weightKg ? parseFloat(vitalsForm.weightKg) : undefined,
      muacCm: vitalsForm.muacCm ? parseFloat(vitalsForm.muacCm) : undefined,
    });
    refresh();
  };

  const saveConsent = (faceConsent: boolean, audioConsent: boolean, clinicalConsent: boolean) => {
    if (!patientNameInput.trim()) return;
    upsertConsent({ household: selectedHousehold, patientName: patientNameInput.trim(), faceConsent, audioConsent, clinicalConsent });
    refresh();
  };

  const saveVisitNote = async () => {
    if (!visitNote.trim() || !patientNameInput.trim()) return;
    setNoteBusy(true);
    try {
      const summary = await summarizeFieldNote({ text: visitNote, language: ashaLanguage });
      addTimelineEntry({
        household: selectedHousehold,
        patientName: patientNameInput.trim(),
        entryType: 'VISIT',
        summary,
        details: visitNote,
      });
      setVisitNote('');
      refresh();
    } finally {
      setNoteBusy(false);
    }
  };

  const addAdherence = () => {
    if (!adherenceForm.household || !adherenceForm.patientName || !adherenceForm.medicineName) return;
    createAdherencePlan({
      household: adherenceForm.household,
      patientName: adherenceForm.patientName,
      condition: adherenceForm.condition || 'General',
      medicineName: adherenceForm.medicineName,
      doseSchedule: adherenceForm.doseSchedule || '1-0-1',
      startDate: new Date().toISOString().slice(0, 10),
    });
    setAdherenceForm({ household: '', patientName: '', condition: '', medicineName: '', doseSchedule: '' });
    refresh();
  };

  const addPlanEvent = () => {
    if (!planForm.title || !planForm.dueDate) return;
    saveMicroPlanEvent({
      eventType: planForm.eventType,
      title: planForm.title,
      household: planForm.household || undefined,
      dueDate: planForm.dueDate,
      completed: false,
    });
    setPlanForm({ eventType: 'HOME_VISIT', title: '', household: '', dueDate: '' });
    refresh();
  };

  const exportSupervisorReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      metrics: {
        tasksTotal: tasks.length,
        tasksCompleted: tasks.filter((tItem) => tItem.completed).length,
        referralsOpen: referrals.filter((r) => r.status !== 'CLOSED').length,
        syncPending: syncQueue.filter((q) => q.status === 'PENDING').length,
      },
      tasks,
      referrals,
      adherencePlans,
      microPlans,
      stockForecast,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asha-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 3500);
    return () => {
      clearInterval(poll);
      stopListening();
      stopAudioStream();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [selectedHousehold]);

  const done = tasks.filter((task) => task.completed).length;
  const latestConsent = consents.find((c) => c.household === selectedHousehold && c.patientName === (patientNameInput.trim() || c.patientName));

  const dueList = [
    ...tasks.filter((task) => !task.completed).map((task) => ({ label: `Task: ${task.title}`, priority: task.priority })),
    ...microPlans.filter((item) => !item.completed).map((item) => ({ label: `Event: ${item.title}`, priority: 'MEDIUM' as TaskPriority })),
    ...adherencePlans.map((plan) => {
      const today = new Date().toISOString().slice(0, 10);
      const taken = adherenceLogs.some((log) => log.planId === plan.id && log.date === today && log.taken);
      return taken ? null : { label: `Dose due: ${plan.patientName} - ${plan.medicineName}`, priority: 'HIGH' as TaskPriority };
    }).filter(Boolean) as Array<{ label: string; priority: TaskPriority }>,
  ];

  const moduleCards: Array<{
    key: Exclude<typeof tab, 'HOME'>;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    tone: string;
    hint: string;
  }> = [
    { key: 'TASKS', icon: ClipboardList, tone: 'bg-gradient-to-r from-green-100 to-emerald-50 text-green-800 border-emerald-200', hint: 'Daily village visits and due activities' },
    { key: 'STOCK', icon: Pill, tone: 'bg-gradient-to-r from-orange-100 to-amber-50 text-amber-800 border-amber-200', hint: 'Medicine stock with risk forecasting' },
    { key: 'TRIAGE', icon: Activity, tone: 'bg-gradient-to-r from-cyan-100 to-sky-50 text-cyan-800 border-cyan-200', hint: 'AI symptom triage and danger flags' },
    { key: 'HOUSEHOLDS', icon: Users, tone: 'bg-gradient-to-r from-slate-100 to-zinc-50 text-slate-700 border-slate-200', hint: 'Timeline, vitals, consent and notes' },
    { key: 'REFERRALS', icon: Hospital, tone: 'bg-gradient-to-r from-rose-100 to-red-50 text-rose-800 border-rose-200', hint: 'Track referral lifecycle to closure' },
    { key: 'ADHERENCE', icon: CheckCircle2, tone: 'bg-gradient-to-r from-teal-100 to-emerald-50 text-teal-800 border-teal-200', hint: 'Dose plans and missed medicine alerts' },
    { key: 'PLANNING', icon: CalendarDays, tone: 'bg-gradient-to-r from-indigo-100 to-violet-50 text-indigo-800 border-indigo-200', hint: 'VHND, ANC and immunization calendar' },
    { key: 'SUPERVISOR', icon: FileText, tone: 'bg-gradient-to-r from-fuchsia-100 to-violet-50 text-fuchsia-800 border-fuchsia-200', hint: 'Sync health, KPIs and exports' },
  ];

  return (
    <div className={shellClass}>
      <TopBar
        title={t.title}
        subtitle={t.welcome}
        right={
          <div className="flex items-center gap-2">
            <Languages size={15} className="text-slate-500" />
            <select value={ashaLanguage} onChange={(e) => setAshaLanguage(e.target.value as 'en' | 'hi' | 'mr')} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-black">
              <option value="en">EN</option>
              <option value="hi">HI</option>
              <option value="mr">MR</option>
            </select>
          </div>
        }
        onLogout={onLogout}
      />

      <div className="p-4 space-y-4 pb-24">
        {tab === 'HOME' && (
          <div className="space-y-4 animate-rise-in">
            <div className="asha-hero rounded-3xl p-5 text-white">
              <p className="text-[11px] uppercase tracking-widest font-black text-green-100">Field Command Center</p>
              <p className="text-2xl font-black mt-1 leading-tight">Choose A Module To Start Field Work</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="bg-white/12 rounded-2xl p-3 backdrop-blur">
                  <p className="text-[10px] uppercase font-black text-green-100">Done</p>
                  <p className="text-xl font-black mt-1">{done}</p>
                </div>
                <div className="bg-white/12 rounded-2xl p-3 backdrop-blur">
                  <p className="text-[10px] uppercase font-black text-green-100">Pending</p>
                  <p className="text-xl font-black mt-1">{tasks.length - done}</p>
                </div>
                <div className="bg-white/12 rounded-2xl p-3 backdrop-blur">
                  <p className="text-[10px] uppercase font-black text-green-100">Sync</p>
                  <p className="text-xl font-black mt-1">{syncQueue.filter((q) => q.status !== 'SYNCED').length}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {moduleCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.key}
                    onClick={() => setTab(card.key)}
                    className={`rounded-3xl border p-4 text-left flex flex-col gap-2 min-h-36 soft-card transition-all active:scale-[0.99] ${card.tone}`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-white border border-white/60 flex items-center justify-center">
                      <Icon size={20} />
                    </div>
                    <p className="text-sm font-black leading-tight">{t.tabs[card.key]}</p>
                    <p className="text-[11px] font-semibold opacity-70 leading-snug">{card.hint}</p>
                    <div className="mt-auto flex justify-end opacity-70">
                      <ChevronRight size={16} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab !== 'HOME' && (
          <>
            <div className="flex items-center justify-between">
              <button onClick={() => setTab('HOME')} className="text-sm font-black text-slate-600">&larr; Back to modules</button>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">{t.tabs[tab]}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-700 text-white rounded-2xl p-3">
                <p className="text-[10px] uppercase font-black tracking-widest text-green-100">Done</p>
                <p className="text-2xl font-black">{done}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-3">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Pending</p>
                <p className="text-2xl font-black text-slate-900">{tasks.length - done}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-3">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Sync Queue</p>
                <p className="text-2xl font-black text-slate-900">{syncQueue.filter((q) => q.status !== 'SYNCED').length}</p>
              </div>
            </div>
          </>
        )}

        {tab === 'TASKS' && (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-black text-slate-900">{task.title}</p>
                  <span className={`text-xs font-black px-2 py-1 rounded-full ${severityTone(task.priority as RiskLevel)}`}>{task.priority}</span>
                </div>
                <p className="text-sm text-slate-600 font-semibold">{task.household}</p>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-400 uppercase font-black tracking-wider">{task.dueDate}</p>
                  <button onClick={() => setTasks(markTaskCompleted(task.id))} disabled={task.completed} className={`px-3 py-1 rounded-lg text-xs font-black ${task.completed ? 'bg-green-100 text-green-700' : 'bg-slate-900 text-white'}`}>
                    {task.completed ? 'DONE' : 'MARK DONE'}
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
              <p className="text-xs uppercase font-black tracking-widest text-slate-400">Smart Due List</p>
              {dueList.slice(0, 6).map((item, idx) => (
                <div key={`${item.label}-${idx}`} className="bg-slate-50 rounded-xl p-2 text-sm font-semibold text-slate-700 flex justify-between">
                  <span>{item.label}</span>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${severityTone(item.priority as RiskLevel)}`}>{item.priority}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'STOCK' && (
          <div className="space-y-3">
            {stockForecast.map((item) => {
              const pct = Math.round((item.count / item.total) * 100);
              return (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-black text-slate-900">{item.name}</p>
                    <span className={`text-xs font-black px-2 py-1 rounded-full ${severityTone(item.risk as RiskLevel)}`}>{item.risk}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">{item.count}/{item.total} • Forecast {item.daysLeft} days left</p>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-green-600" style={{ width: `${pct}%` }} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <Btn label="-1" tone="secondary" onClick={() => setInventory(updateInventoryCount(item.id, item.count - 1))} />
                    <Btn label="+1" onClick={() => setInventory(updateInventoryCount(item.id, item.count + 1))} />
                  </div>
                  {item.risk === 'HIGH' && <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-xs font-bold text-red-700">Auto escalation suggested: request refill now.</div>}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'TRIAGE' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3">
            <p className="font-black text-slate-900">{t.triage}</p>
            <input value={patientNameInput} onChange={(e) => setPatientNameInput(e.target.value)} placeholder="Patient name" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-semibold" />
            <input value={symptomsInput} onChange={(e) => setSymptomsInput(e.target.value)} placeholder="Comma separated symptoms" className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-semibold" />

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => (isListening ? stopListening() : startListening())} className={`rounded-xl py-3 text-sm font-black flex items-center justify-center gap-2 ${isListening ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                <Mic size={16} />
                {isListening ? t.stopVoice : ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) ? t.startVoice : t.startRecord}
              </button>
              <button onClick={() => triageResult && speakText([triageResult.diagnosis, ...triageResult.recommendations].join('. '))} className="rounded-xl py-3 text-sm font-black flex items-center justify-center gap-2 bg-blue-50 text-blue-700">
                <Volume2 size={16} />
                {t.speakResult}
              </button>
            </div>

            {voiceBusy && <p className="text-xs font-bold text-slate-500">{t.transcribing}</p>}
            {voiceError && <p className="text-xs font-bold text-red-600">{voiceError}</p>}

            <Btn label={triageBusy ? 'Analyzing...' : t.analyze} disabled={triageBusy} onClick={runTriage} />

            {dangerFlags.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
                <p className="text-xs font-black text-red-700 uppercase tracking-widest flex items-center gap-1"><ShieldAlert size={14} /> Danger-Sign Protocol Triggered</p>
                {dangerFlags.map((flag) => <p key={flag} className="text-sm font-semibold text-red-700">• {flag}</p>)}
                <Btn label={t.createReferral} tone="danger" onClick={() => {
                  if (!patientNameInput.trim()) return;
                  createReferral({ household: selectedHousehold, patientName: patientNameInput.trim(), reason: dangerFlags.join('; '), riskLevel: 'HIGH', status: 'REFERRED', facilityName: 'Nearest PHC', transportMode: 'Ambulance' });
                  refresh();
                }} />
              </div>
            )}

            {triageResult && (
              <div className="space-y-2">
                <span className={`text-xs font-black px-2 py-1 rounded-full ${severityTone(triageResult.riskLevel)}`}>{triageResult.riskLevel}</span>
                <p className="font-bold text-slate-900">{triageResult.diagnosis}</p>
                {triageResult.recommendations.map((item, index) => (
                  <div key={`${item}-${index}`} className="bg-slate-50 rounded-xl p-2 text-sm font-semibold text-slate-700">{item}</div>
                ))}
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-3 space-y-2">
              <p className="text-xs uppercase font-black tracking-widest text-slate-500">Counseling Script</p>
              <div className="grid grid-cols-2 gap-2">
                <select value={counselingTopic} onChange={(e) => setCounselingTopic(e.target.value as typeof counselingTopic)} className="rounded-lg border border-slate-200 px-2 py-2 text-sm font-semibold bg-white">
                  <option value="fever">Fever</option>
                  <option value="diarrhea">Diarrhea</option>
                  <option value="pregnancy">Pregnancy</option>
                  <option value="newborn">Newborn</option>
                  <option value="nutrition">Nutrition</option>
                </select>
                <button onClick={() => speakText(counselingScripts[counselingTopic][ashaLanguage])} className="rounded-lg bg-white border border-slate-200 px-2 py-2 text-sm font-bold text-slate-700">Play Audio</button>
              </div>
              <p className="text-sm font-semibold text-slate-700">{counselingScripts[counselingTopic][ashaLanguage]}</p>
            </div>
          </div>
        )}

        {tab === 'HOUSEHOLDS' && (
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
              <p className="font-black text-slate-900">Household Longitudinal Timeline</p>
              <input value={selectedHousehold} onChange={(e) => setSelectedHousehold(e.target.value)} placeholder="Household (e.g., Ward 3 - House 45)" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold" />
              <input value={patientNameInput} onChange={(e) => setPatientNameInput(e.target.value)} placeholder="Primary patient name" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold" />
              <textarea value={visitNote} onChange={(e) => setVisitNote(e.target.value)} placeholder="Voice/text visit note" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 h-20 text-sm font-semibold" />
              <Btn label={noteBusy ? 'Summarizing...' : 'Save Visit Note + AI Summary'} disabled={noteBusy} onClick={saveVisitNote} />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
              <p className="font-black text-slate-900">Vitals & Trend Alerts</p>
              <div className="grid grid-cols-2 gap-2">
                <input value={vitalsForm.bpSystolic} onChange={(e) => setVitalsForm({ ...vitalsForm, bpSystolic: e.target.value })} placeholder="BP Sys" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                <input value={vitalsForm.bpDiastolic} onChange={(e) => setVitalsForm({ ...vitalsForm, bpDiastolic: e.target.value })} placeholder="BP Dia" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                <input value={vitalsForm.pulse} onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })} placeholder="Pulse" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                <input value={vitalsForm.temperatureC} onChange={(e) => setVitalsForm({ ...vitalsForm, temperatureC: e.target.value })} placeholder="Temp C" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                <input value={vitalsForm.spo2} onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })} placeholder="SpO2" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                <input value={vitalsForm.weightKg} onChange={(e) => setVitalsForm({ ...vitalsForm, weightKg: e.target.value })} placeholder="Weight kg" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              </div>
              <Btn label="Save Vitals" onClick={saveVitals} />
              {vitalsHistory.slice(0, 3).map((v) => (
                <div key={v.id} className="bg-slate-50 rounded-xl p-2 text-xs font-semibold text-slate-700">
                  {v.patientName} • BP {v.bpSystolic}/{v.bpDiastolic} • SpO2 {v.spo2}% • Temp {v.temperatureC}C
                  {(v.spo2 < 92 || v.bpSystolic > 160 || v.temperatureC >= 101) && (
                    <span className="ml-2 text-red-700 font-black">ALERT</span>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
              <p className="font-black text-slate-900">Consent & Emergency Actions</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => saveConsent(true, latestConsent?.audioConsent ?? true, latestConsent?.clinicalConsent ?? true)} className="rounded-lg bg-slate-900 text-white py-2 text-xs font-black">Face Consent</button>
                <button onClick={() => saveConsent(latestConsent?.faceConsent ?? true, true, latestConsent?.clinicalConsent ?? true)} className="rounded-lg bg-slate-900 text-white py-2 text-xs font-black">Audio Consent</button>
                <button onClick={() => saveConsent(latestConsent?.faceConsent ?? true, latestConsent?.audioConsent ?? true, true)} className="rounded-lg bg-slate-900 text-white py-2 text-xs font-black">Clinical Consent</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => { logEmergencyAction({ household: selectedHousehold, patientName: patientNameInput || 'Unknown', actionType: 'AMBULANCE_CALL' }); window.open('tel:108'); refresh(); }} className="rounded-lg bg-red-600 text-white py-2 text-xs font-black flex items-center justify-center gap-1"><PhoneCall size={12} />108</button>
                <button onClick={() => { logEmergencyAction({ household: selectedHousehold, patientName: patientNameInput || 'Unknown', actionType: 'PHC_CALL' }); window.open('tel:102'); refresh(); }} className="rounded-lg bg-amber-600 text-white py-2 text-xs font-black">Call PHC</button>
                <button onClick={() => { logEmergencyAction({ household: selectedHousehold, patientName: patientNameInput || 'Unknown', actionType: 'CASE_SHARED' }); refresh(); }} className="rounded-lg bg-blue-700 text-white py-2 text-xs font-black">Share Case</button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
              <p className="font-black text-slate-900">Timeline</p>
              {timeline.slice(0, 8).map((entry) => (
                <div key={entry.id} className="bg-slate-50 rounded-xl p-2">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider">{entry.entryType}</p>
                  <p className="text-sm font-semibold text-slate-700">{entry.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'REFERRALS' && (
          <div className="space-y-2">
            {referrals.map((ref) => (
              <div key={ref.id} className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-black text-slate-900">{ref.patientName} • {ref.household}</p>
                  <span className={`text-xs font-black px-2 py-1 rounded-full ${severityTone(ref.riskLevel)}`}>{ref.status}</span>
                </div>
                <p className="text-sm font-semibold text-slate-700">{ref.reason}</p>
                <div className="grid grid-cols-2 gap-2">
                  <select value={ref.status} onChange={(e) => { updateReferralStatus({ referralId: ref.id, status: e.target.value as ReferralRecord['status'] }); refresh(); }} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-bold">
                    <option value="REFERRED">REFERRED</option>
                    <option value="REACHED_FACILITY">REACHED_FACILITY</option>
                    <option value="DIAGNOSED">DIAGNOSED</option>
                    <option value="FOLLOW_UP_PENDING">FOLLOW_UP_PENDING</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                  <input defaultValue={ref.notes || ''} onBlur={(e) => { updateReferralStatus({ referralId: ref.id, status: ref.status, notes: e.target.value }); refresh(); }} placeholder="Notes" className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold" />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'ADHERENCE' && (
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
              <p className="font-black text-slate-900">Medication Adherence Tracker</p>
              <div className="grid grid-cols-2 gap-2">
                <input value={adherenceForm.household} onChange={(e) => setAdherenceForm({ ...adherenceForm, household: e.target.value })} placeholder="Household" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                <input value={adherenceForm.patientName} onChange={(e) => setAdherenceForm({ ...adherenceForm, patientName: e.target.value })} placeholder="Patient" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                <input value={adherenceForm.medicineName} onChange={(e) => setAdherenceForm({ ...adherenceForm, medicineName: e.target.value })} placeholder="Medicine" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                <input value={adherenceForm.doseSchedule} onChange={(e) => setAdherenceForm({ ...adherenceForm, doseSchedule: e.target.value })} placeholder="Schedule e.g. 1-0-1" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              </div>
              <Btn label="Create Plan" onClick={addAdherence} />
            </div>
            {adherencePlans.map((plan) => {
              const today = new Date().toISOString().slice(0, 10);
              const taken = adherenceLogs.some((log) => log.planId === plan.id && log.date === today && log.taken);
              return (
                <div key={plan.id} className="bg-white border border-slate-200 rounded-2xl p-3">
                  <p className="font-black text-slate-900">{plan.patientName} • {plan.medicineName}</p>
                  <p className="text-xs font-semibold text-slate-500">{plan.household} • {plan.doseSchedule}</p>
                  <button onClick={() => { markDoseTaken({ planId: plan.id, date: today, taken: !taken }); refresh(); }} className={`mt-2 px-3 py-1 rounded-lg text-xs font-black ${taken ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {taken ? 'Dose Taken Today' : 'Mark Dose Taken'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'PLANNING' && (
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
              <p className="font-black text-slate-900">Micro-Planning Calendar</p>
              <div className="grid grid-cols-2 gap-2">
                <select value={planForm.eventType} onChange={(e) => setPlanForm({ ...planForm, eventType: e.target.value as MicroPlanEvent['eventType'] })} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <option value="VHND">VHND</option>
                  <option value="ANC">ANC</option>
                  <option value="IMMUNIZATION">IMMUNIZATION</option>
                  <option value="HOME_VISIT">HOME_VISIT</option>
                  <option value="OTHER">OTHER</option>
                </select>
                <input type="date" value={planForm.dueDate} onChange={(e) => setPlanForm({ ...planForm, dueDate: e.target.value })} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                <input value={planForm.title} onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })} placeholder="Event title" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
                <input value={planForm.household} onChange={(e) => setPlanForm({ ...planForm, household: e.target.value })} placeholder="Household (optional)" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              </div>
              <Btn label="Add Event" onClick={addPlanEvent} />
            </div>
            {microPlans.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-3">
                <p className="font-black text-slate-900">{item.eventType} • {item.title}</p>
                <p className="text-xs font-semibold text-slate-500">{item.dueDate} {item.household ? `• ${item.household}` : ''}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'SUPERVISOR' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Referral Closure</p>
                <p className="text-2xl font-black text-slate-900">
                  {referrals.length === 0 ? '0%' : `${Math.round((referrals.filter((r) => r.status === 'CLOSED').length / referrals.length) * 100)}%`}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Missed Doses</p>
                <p className="text-2xl font-black text-slate-900">
                  {adherencePlans.filter((plan) => {
                    const today = new Date().toISOString().slice(0, 10);
                    return !adherenceLogs.some((log) => log.planId === plan.id && log.date === today && log.taken);
                  }).length}
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
              <p className="font-black text-slate-900">Offline Sync Queue</p>
              <div className="grid grid-cols-2 gap-2">
                <Btn label="Process Sync" onClick={refreshSync} />
                <Btn label="Retry Failed" tone="secondary" onClick={retrySync} />
              </div>
              {syncQueue.slice(0, 8).map((item) => (
                <div key={item.id} className="bg-slate-50 rounded-xl p-2 flex justify-between text-xs font-semibold">
                  <span>{item.entityType}: {item.actionType}</span>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black ${item.status === 'SYNCED' ? 'bg-green-100 text-green-700' : item.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-3">
              <button onClick={exportSupervisorReport} className="w-full rounded-xl py-3 bg-slate-900 text-white text-sm font-black flex items-center justify-center gap-2">
                <Download size={15} /> Export Government Format Report
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2">
              <p className="font-black text-slate-900">Emergency Log</p>
              {emergencyLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="bg-slate-50 rounded-xl p-2 text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <AlertTriangle size={13} className="text-red-600" /> {log.patientName} • {log.actionType}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DoctorDashboard: React.FC<{ user: AppUser; onLogout: () => void }> = ({ user, onLogout }) => {
  const [cases, setCases] = useState<ConsultationCase[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [reply, setReply] = useState('');
  const [prescription, setPrescription] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESPONDED'>('PENDING');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [search, setSearch] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiFlags, setAiFlags] = useState<string[]>([]);

  const refresh = () => setCases(listCasesForDoctor());

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 2500);
    return () => clearInterval(poll);
  }, []);

  const selectedCase = useMemo(() => cases.find((item) => item.id === selectedId) || null, [cases, selectedId]);
  const selectedCaseReport = useMemo(() => {
    if (!selectedCase) return '';
    if (!selectedCase.followUpAnswers?.length) return '';
    if (selectedCase.summary.includes('Rural QA Report') || selectedCase.followUpAnswers.some((line) => line.toLowerCase().includes('generalized report'))) {
      return selectedCase.followUpAnswers.join('\n');
    }
    return '';
  }, [selectedCase]);

  const filteredCases = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cases
      .filter((item) => (filter === 'ALL' ? true : item.status === filter))
      .filter((item) => (riskFilter === 'ALL' ? true : (item.riskLevel || 'MEDIUM') === riskFilter))
      .filter((item) => {
        if (!q) return true;
        return [item.patientName, item.summary, item.patientPhone].join(' ').toLowerCase().includes(q);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [cases, filter, riskFilter, search]);

  useEffect(() => {
    if (selectedId) return;
    if (!filteredCases.length) return;
    const item = filteredCases[0];
    setSelectedId(item.id);
    setReply(item.doctorResponse || '');
    setPrescription(item.doctorPrescription || '');
  }, [filteredCases, selectedId]);

  const applyTemplate = (text: string, target: 'reply' | 'prescription') => {
    if (target === 'reply') {
      setReply((prev) => `${prev.trim()}${prev.trim() ? '\n' : ''}${text}`);
      return;
    }
    setPrescription((prev) => `${prev.trim()}${prev.trim() ? '\n' : ''}${text}`);
  };

  const createAiDraft = async () => {
    if (!selectedCase) return;
    setAiBusy(true);
    try {
      const draft = await generateDoctorDraft({
        patientName: selectedCase.patientName,
        summary: selectedCase.summary,
        followUpAnswers: selectedCase.followUpAnswers,
        riskLevel: selectedCase.riskLevel,
      });
      setReply(draft.advice);
      setPrescription(draft.prescription);
      setAiFlags(draft.redFlags);
    } finally {
      setAiBusy(false);
    }
  };

  const exportSelectedCase = () => {
    if (!selectedCase) return;
    const content = [
      `Case ID: ${selectedCase.id}`,
      `Patient: ${selectedCase.patientName} (${selectedCase.patientPhone})`,
      `Status: ${selectedCase.status}`,
      `Risk: ${selectedCase.riskLevel || 'MEDIUM'}`,
      `Summary: ${selectedCase.summary}`,
      `Follow-ups:`,
      ...selectedCase.followUpAnswers,
      '',
      `Doctor Advice:`,
      reply.trim() || selectedCase.doctorResponse || '',
      '',
      `Prescription:`,
      prescription.trim() || selectedCase.doctorPrescription || '',
      followUpDate ? `Follow-up Date: ${followUpDate}` : '',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctor-case-${selectedCase.patientName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quickAdvice = [
    'Hydration every 30 minutes and rest for 24 hours.',
    'If breathlessness, chest pain, or confusion occurs, go to nearest facility immediately.',
    'Recheck temperature and SpO2 every 6 hours for next 24 hours.',
  ];
  const quickRx = [
    'ORS 200 ml after each loose stool episode.',
    'Paracetamol as clinically appropriate for fever and pain.',
    'Continue regular medicines and avoid self-antibiotics.',
  ];

  const pendingCount = cases.filter((item) => item.status === 'PENDING').length;
  const respondedCount = cases.filter((item) => item.status === 'RESPONDED').length;
  const highRiskCount = cases.filter((item) => (item.riskLevel || 'MEDIUM') === 'HIGH').length;

  return (
    <div className={shellClass}>
      <TopBar title="Doctor Response Center" subtitle={`Welcome, Dr. ${user.name}`} onLogout={onLogout} />
      <div className="p-3 sm:p-4 space-y-4 pb-24">
        <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-teal-700 via-cyan-700 to-blue-700 text-white shadow-[0_24px_44px_-28px_rgba(14,116,144,0.75)]">
          <p className="text-[11px] font-black uppercase tracking-widest text-cyan-100">Doctor Command Deck</p>
          <p className="text-xl sm:text-2xl font-black mt-1 leading-tight">Triage Queue, AI Drafts, and Follow-up Decisions</p>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white/15 rounded-2xl p-3 backdrop-blur">
              <p className="text-[10px] uppercase font-black text-cyan-100">Total</p>
              <p className="text-xl font-black mt-1">{cases.length}</p>
            </div>
            <div className="bg-white/15 rounded-2xl p-3 backdrop-blur">
              <p className="text-[10px] uppercase font-black text-cyan-100">Pending</p>
              <p className="text-xl font-black mt-1">{pendingCount}</p>
            </div>
            <div className="bg-white/15 rounded-2xl p-3 backdrop-blur">
              <p className="text-[10px] uppercase font-black text-cyan-100">Responded</p>
              <p className="text-xl font-black mt-1">{respondedCount}</p>
            </div>
            <div className="bg-white/15 rounded-2xl p-3 backdrop-blur">
              <p className="text-[10px] uppercase font-black text-cyan-100">High Risk</p>
              <p className="text-xl font-black mt-1">{highRiskCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-3 sm:p-4 space-y-3 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.3)]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient, phone, or summary"
            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-semibold"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(['PENDING', 'RESPONDED', 'ALL'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-xl py-2 text-xs font-black ${
                  filter === item ? 'bg-cyan-700 text-white' : 'bg-slate-50 border border-slate-200 text-slate-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setRiskFilter(item)}
                className={`rounded-xl py-2 text-xs font-black ${
                  riskFilter === item ? 'bg-slate-900 text-white' : 'bg-slate-50 border border-slate-200 text-slate-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.05fr_1fr]">
          <div className="space-y-2 lg:max-h-[70vh] lg:overflow-auto pr-1">
            {filteredCases.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  setReply(item.doctorResponse || '');
                  setPrescription(item.doctorPrescription || '');
                  setAiFlags([]);
                }}
                className={`w-full text-left rounded-2xl border p-3 transition-all shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)] ${
                  selectedId === item.id ? 'bg-cyan-50 border-cyan-300' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-black text-slate-900">{item.patientName}</p>
                    <p className="text-xs font-semibold text-slate-500">{item.patientPhone}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${severityTone(item.riskLevel)}`}>{item.riskLevel || 'MEDIUM'}</span>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${item.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{item.status}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-600 mt-2 break-words">{item.summary}</p>
              </button>
            ))}
            {filteredCases.length === 0 && <div className="bg-white border border-slate-200 rounded-2xl p-3 text-sm font-semibold text-slate-500">No cases match these filters.</div>}
          </div>

          {selectedCase && (
            <div className="bg-white border border-slate-200 rounded-3xl p-3 sm:p-4 space-y-3 shadow-[0_14px_30px_-22px_rgba(15,23,42,0.35)] lg:max-h-[70vh] lg:overflow-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-black text-slate-900">Case Detail</p>
                  <p className="text-xs font-semibold text-slate-500">Updated {new Date(selectedCase.updatedAt).toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                  <button onClick={createAiDraft} disabled={aiBusy || !isAiEnabled()} className={`rounded-lg px-3 py-2 text-xs font-black ${aiBusy || !isAiEnabled() ? 'bg-slate-100 text-slate-400' : 'bg-cyan-100 text-cyan-800'}`}>
                    {aiBusy ? 'Generating...' : isAiEnabled() ? 'AI Draft' : 'AI Key Needed'}
                  </button>
                  <button onClick={exportSelectedCase} className="rounded-lg bg-slate-100 text-slate-700 px-3 py-2 text-xs font-black">Export</button>
                </div>
              </div>

              {selectedCaseReport && (
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider text-blue-500">Rural Structured Report</p>
                  <pre className="bg-blue-50 border border-blue-100 rounded-xl p-2 text-xs font-semibold text-slate-700 whitespace-pre-wrap max-h-40 overflow-auto">{selectedCaseReport}</pre>
                </div>
              )}
              {selectedCase.followUpAnswers.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Follow-ups</p>
                  {selectedCase.followUpAnswers.slice(0, 6).map((item, idx) => (
                    <div key={`${item}-${idx}`} className="bg-slate-50 rounded-xl p-2 text-sm font-semibold text-slate-700">
                      {item}
                    </div>
                  ))}
                </div>
              )}

              {aiFlags.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-700">AI Highlighted Red Flags</p>
                  {aiFlags.map((flag) => <p key={flag} className="text-xs font-semibold text-red-700">- {flag}</p>)}
                </div>
              )}

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Quick Advice Templates</p>
                <div className="flex flex-wrap gap-2">
                  {quickAdvice.map((item) => (
                    <button key={item} onClick={() => applyTemplate(item, 'reply')} className="rounded-full bg-cyan-50 border border-cyan-100 px-3 py-1 text-[11px] font-black text-cyan-800">+ Advice</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Quick Prescription Templates</p>
                <div className="flex flex-wrap gap-2">
                  {quickRx.map((item) => (
                    <button key={item} onClick={() => applyTemplate(item, 'prescription')} className="rounded-full bg-green-50 border border-green-100 px-3 py-1 text-[11px] font-black text-green-800">+ Rx</button>
                  ))}
                </div>
              </div>

              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Doctor response / advice"
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 h-24 text-sm font-semibold outline-none"
              />
              <textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                placeholder="Prescription"
                className="w-full rounded-xl bg-green-50 border border-green-200 px-3 py-2 h-24 text-sm font-semibold outline-none"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-semibold" />
                <button onClick={() => setReply((prev) => `${prev.trim()}${prev.trim() ? '\n' : ''}${followUpDate ? `Follow-up advised on ${followUpDate}.` : 'Follow-up advised in 48-72 hours.'}`)} className="rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-sm font-black">Add Follow-up Line</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Btn
                  label="Send Response"
                  onClick={() => {
                    if (!reply.trim()) return;
                    const finalReply = `${reply.trim()}${followUpDate ? `\nFollow-up date: ${followUpDate}` : ''}`;
                    respondToCase({
                      caseId: selectedCase.id,
                      doctorName: user.name,
                      response: finalReply,
                      prescription: prescription.trim(),
                    });
                    refresh();
                  }}
                />
                <Btn label="Refresh" tone="secondary" onClick={refresh} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [step, setStep] = useState<Step>('ROLE');
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [role, setRole] = useState<UserRole>(UserRole.RURAL);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [pendingUser, setPendingUser] = useState<AppUser | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [faceBusy, setFaceBusy] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  const resetAuthFields = () => {
    setPhone('');
    setName('');
    setError('');
  };

  const openAuth = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setMode('LOGIN');
    resetAuthFields();
    setStep('AUTH');
  };

  const validatePhone = () => {
    if (!phone || phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return false;
    }
    return true;
  };

  const doLogin = () => {
    if (!validatePhone()) return;

    const user = findUserByPhoneAndRole(phone, role);
    if (!user) {
      setError('No account found. Please create account first.');
      return;
    }

    setPendingUser(user);
    setError('');

    if (role === UserRole.RURAL) {
      setStep(user.faceTemplateEnc ? 'FACE_VERIFY' : 'FACE_ENROLL');
      return;
    }

    setCurrentUser(user);
    setStep('DASHBOARD');
  };

  const doSignup = () => {
    if (!validatePhone()) return;
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    const user = registerUser({
      name: name.trim(),
      phone,
      role,
    });

    setPendingUser(user);
    setError('');

    if (role === UserRole.RURAL) {
      setStep('FACE_ENROLL');
      return;
    }

    setCurrentUser(user);
    setStep('DASHBOARD');
  };

  const handleEnrollCapture = async (template: string) => {
    if (!pendingUser) return;

    setFaceBusy(true);
    setError('');
    try {
      const enc = await encryptTemplate(template);
      const saved = updateUserFaceSecrets({
        userId: pendingUser.id,
        faceTemplateEnc: enc.faceTemplateEnc,
        faceSalt: enc.faceSalt,
      });

      if (!saved) {
        setError('Unable to save face profile. Please retry.');
        return;
      }

      setCurrentUser(saved);
      setStep('DASHBOARD');
    } catch (e: any) {
      setError(e?.message || 'Face enrollment failed.');
    } finally {
      setFaceBusy(false);
    }
  };

  const handleVerifyCapture = async (template: string) => {
    if (!pendingUser?.faceTemplateEnc || !pendingUser.faceSalt) return;

    setFaceBusy(true);
    setError('');
    try {
      const storedTemplate = await decryptTemplate(pendingUser.faceTemplateEnc, pendingUser.faceSalt);
      const matched = isFaceMatch(storedTemplate, template);

      if (!matched) {
        setError('Face verification failed. Move slightly and retry.');
        return;
      }

      setCurrentUser(pendingUser);
      setStep('DASHBOARD');
    } catch (e: any) {
      setError(e?.message || 'Face verification failed.');
    } finally {
      setFaceBusy(false);
    }
  };

  const doLogout = () => {
    setCurrentUser(null);
    setPendingUser(null);
    setMode('LOGIN');
    resetAuthFields();
    setStep('ROLE');
  };

  if (step === 'ROLE') {
    return <RolePicker onSelect={openAuth} />;
  }

  if (step === 'AUTH') {
    return (
      <AuthPanel
        role={role}
        mode={mode}
        phone={phone}
        name={name}
        error={error}
        setMode={setMode}
        setPhone={setPhone}
        setName={setName}
        onBack={() => setStep('ROLE')}
        onLogin={doLogin}
        onSignup={doSignup}
      />
    );
  }

  if (step === 'FACE_ENROLL' && pendingUser) {
    return (
      <FacePanel
        mode="ENROLL"
        userName={pendingUser.name}
        helper="Center your face. We capture multiple frames for basic liveness and encrypt your face signature."
        busy={faceBusy}
        error={error}
        onCapture={handleEnrollCapture}
        onBack={() => setStep('AUTH')}
      />
    );
  }

  if (step === 'FACE_VERIFY' && pendingUser) {
    return (
      <FacePanel
        mode="VERIFY"
        userName={pendingUser.name}
        helper="Look at camera and move naturally. Verification uses encrypted stored face signature."
        busy={faceBusy}
        error={error}
        onCapture={handleVerifyCapture}
        onBack={() => setStep('AUTH')}
      />
    );
  }

  if (!currentUser) {
    return (
      <div className={`${shellClass} flex items-center justify-center p-6`}>
        <div className="text-center space-y-3">
          <RefreshCcw className="mx-auto animate-spin text-slate-500" />
          <p className="font-semibold text-slate-600">Initializing session...</p>
          <Btn label="Go Home" tone="secondary" onClick={() => setStep('ROLE')} />
        </div>
      </div>
    );
  }

  if (currentUser.role === UserRole.RURAL) {
    return <RuralDashboard user={currentUser} onLogout={doLogout} language={language} setLanguage={setLanguage} />;
  }

  if (currentUser.role === UserRole.ASHA) {
    return <AshaDashboard user={currentUser} onLogout={doLogout} language={language} />;
  }

  return <DoctorDashboard user={currentUser} onLogout={doLogout} />;
};

export default App;
