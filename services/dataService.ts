
import { supabase } from "../supabase";
import { Patient, Task, UserRole, FamilyMember } from "../types";

// --- User Auth & Registration ---
export interface UserProfile {
  id?: string;
  uid: string; // The User ID
  password?: string; 
  name: string;
  age: number;
  gender: string;
  role: UserRole;
  phone: string; // Mobile Number
  created_at?: string;
}

const MOCK_USERS_KEY = 'arogya_swarm_mock_users';
const MOCK_FAMILY_KEY = 'arogya_swarm_mock_family';
const MOCK_INQUIRIES_KEY = 'arogya_swarm_mock_inquiries';

/**
 * Gets data from local storage as a fallback
 */
const getLocalData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Saves data to local storage as a fallback
 */
const saveLocalData = <T>(key: string, item: T) => {
  const items = getLocalData<T>(key);
  items.push(item);
  localStorage.setItem(key, JSON.stringify(items));
};

export const checkUserCredentials = async (role: UserRole, phone: string, password?: string) => {
  let supabaseUser: UserProfile | null = null;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .eq('phone', phone)
      .eq('password', password)
      .maybeSingle();
    
    if (data && !error) {
      supabaseUser = data as UserProfile;
    }
  } catch (err) {
    console.warn("Supabase auth check failed, will check local storage.");
  }

  if (supabaseUser) return supabaseUser;

  const localUsers = getLocalData<UserProfile>(MOCK_USERS_KEY);
  return localUsers.find(u => 
    u.phone === phone && 
    u.password === password && 
    u.role === role
  ) || null;
};

export const createUserProfile = async (profile: Omit<UserProfile, "id" | "created_at">) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([profile])
      .select()
      .single();

    if (error) {
      console.warn("Could not save to Supabase. Saving to Local Storage instead.", error.message);
      saveLocalData(MOCK_USERS_KEY, profile as UserProfile);
      return profile as UserProfile;
    }
    
    return data as UserProfile;
  } catch (err: any) {
    console.warn("Supabase registration error. Saving user locally:", err.message);
    saveLocalData(MOCK_USERS_KEY, profile as UserProfile);
    return profile as UserProfile;
  }
};

// --- Family Operations ---

export const subscribeToFamily = (parentPhone: string, callback: (members: FamilyMember[]) => void) => {
  const local = getLocalData<FamilyMember>(MOCK_FAMILY_KEY);
  const filteredLocal = local.filter(m => m.parent_phone === parentPhone);
  callback(filteredLocal);

  supabase
    .from('family_members')
    .select('*')
    .eq('parent_phone', parentPhone)
    .then(({ data }) => {
      if (data) {
        const merged = [...filteredLocal, ...data.filter(d => !filteredLocal.find(l => l.name === d.name))];
        callback(merged as FamilyMember[]);
      }
    });

  const channel = supabase
    .channel(`family-${parentPhone}`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'family_members', filter: `parent_phone=eq.${parentPhone}` }, 
      async () => {
        const { data } = await supabase.from('family_members').select('*').eq('parent_phone', parentPhone);
        if (data) {
          const latestLocal = getLocalData<FamilyMember>(MOCK_FAMILY_KEY).filter(m => m.parent_phone === parentPhone);
          const merged = [...latestLocal, ...data.filter(d => !latestLocal.find(l => l.name === d.name))];
          callback(merged as FamilyMember[]);
        }
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
};

export const addFamilyMember = async (member: FamilyMember) => {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .insert([member])
      .select()
      .single();

    if (error) {
      console.warn("Table missing or error. Saving family member locally.");
      saveLocalData(MOCK_FAMILY_KEY, member);
      return member;
    }
    return data;
  } catch (e) {
    saveLocalData(MOCK_FAMILY_KEY, member);
    return member;
  }
};

// --- Doctor Inquiry Operations ---

export interface DoctorInquiry {
  id: string;
  patient_id: string;
  patient_name: string;
  phone: string;
  problem_desc: string;
  follow_up_answers: string[];
  status: 'PENDING' | 'RESPONDED';
  doctor_response?: string;
  doctor_name?: string;
  timestamp: string;
}

export const sendDoctorInquiry = async (inquiry: Omit<DoctorInquiry, 'id' | 'status' | 'timestamp'>) => {
  const newInquiry = { 
    ...inquiry, 
    id: Math.random().toString(36).substr(2, 9), 
    status: 'PENDING', 
    timestamp: new Date().toISOString() 
  };
  
  try {
    await supabase.from('doctor_inquiries').insert([newInquiry]);
  } catch (e) {
    console.warn("Saving inquiry locally.");
  }
  saveLocalData(MOCK_INQUIRIES_KEY, newInquiry);
  return newInquiry;
};

export const subscribeToInquiries = (callback: (inquiries: DoctorInquiry[]) => void) => {
  const poll = setInterval(() => {
    const data = getLocalData<DoctorInquiry>(MOCK_INQUIRIES_KEY);
    callback(data.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, 3000);
  return () => clearInterval(poll);
};

export const respondToInquiry = async (id: string, response: string, doctorName: string) => {
  const items = getLocalData<DoctorInquiry>(MOCK_INQUIRIES_KEY);
  const updated = items.map(item => item.id === id ? { ...item, status: 'RESPONDED' as const, doctor_response: response, doctor_name: doctorName } : item);
  localStorage.setItem(MOCK_INQUIRIES_KEY, JSON.stringify(updated));
  
  try {
    await supabase.from('doctor_inquiries').update({ status: 'RESPONDED', doctor_response: response, doctor_name: doctorName }).eq('id', id);
  } catch (e) {}
};

export const subscribeToPatientResponses = (patientId: string, callback: (inquiries: DoctorInquiry[]) => void) => {
  const poll = setInterval(() => {
    const data = getLocalData<DoctorInquiry>(MOCK_INQUIRIES_KEY);
    callback(data.filter(i => i.patient_id === patientId && i.status === 'RESPONDED'));
  }, 3000);
  return () => clearInterval(poll);
};

// --- Other Data Operations ---
export const subscribeToTasks = (roleId: string, callback: (tasks: Task[]) => void) => {
  supabase.from('tasks').select('*').eq('asha_id', roleId).then(({ data, error }) => {
    if (data) callback(data as any[]);
    if (error) callback([]); 
  });

  const channel = supabase
    .channel(`tasks-${roleId}`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'tasks', filter: `asha_id=eq.${roleId}` }, 
      async () => {
        const { data } = await supabase.from('tasks').select('*').eq('asha_id', roleId);
        if (data) callback(data as any[]);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
};

export const completeTask = async (taskId: string) => {
  try {
    await supabase.from('tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', taskId);
  } catch (e) {
    console.warn("Could not mark task as complete in Supabase.");
  }
};

export const saveAssessment = async (assessment: any) => {
  try {
    await supabase.from('assessments').insert([{ ...assessment, timestamp: new Date().toISOString() }]);
  } catch (e) {
    console.warn("Could not save assessment to Supabase.");
  }
};
