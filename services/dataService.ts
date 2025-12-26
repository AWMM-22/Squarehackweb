
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  getDocs,
  Timestamp,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "../firebase";
import { Patient, Task, RiskLevel, UserRole } from "../types";

// --- User Auth & Registration ---
export interface UserProfile {
  id?: string;
  uid: string; // The login ID or Phone
  pin?: string;
  name: string;
  role: UserRole;
  phone?: string;
  createdAt: Timestamp;
}

export const checkUserCredentials = async (role: UserRole, uid: string, pin?: string) => {
  const usersRef = collection(db, "users");
  let q;
  
  if (role === UserRole.PATIENT) {
    // Patients login via phone
    q = query(usersRef, where("role", "==", role), where("phone", "==", uid), limit(1));
  } else {
    // ASHA/Doctors login via ID and PIN
    q = query(usersRef, where("role", "==", role), where("uid", "==", uid), where("pin", "==", pin), limit(1));
  }

  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as UserProfile;
  }
  return null;
};

export const createUserProfile = async (profile: Omit<UserProfile, "id" | "createdAt">) => {
  // Check if user already exists
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("role", "==", profile.role), where("uid", "==", profile.uid), limit(1));
  const existing = await getDocs(q);
  
  if (!existing.empty) {
    throw new Error("User already exists with this ID/Phone");
  }

  return await addDoc(collection(db, "users"), {
    ...profile,
    createdAt: Timestamp.now()
  });
};

// --- Patient Operations ---
export const subscribeToPatients = (callback: (patients: Patient[]) => void) => {
  const q = query(collection(db, "patients"), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
    callback(patients);
  });
};

export const registerPatient = async (patient: Omit<Patient, "id">) => {
  return await addDoc(collection(db, "patients"), {
    ...patient,
    createdAt: Timestamp.now()
  });
};

// --- Task Operations ---
export const subscribeToTasks = (roleId: string, callback: (tasks: Task[]) => void) => {
  const q = query(collection(db, "tasks"), where("ashaId", "==", roleId));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    callback(tasks);
  });
};

export const completeTask = async (taskId: string) => {
  const taskRef = doc(db, "tasks", taskId);
  return await updateDoc(taskRef, { completed: true, completedAt: Timestamp.now() });
};

// --- Assessment & Diagnosis ---
export const saveAssessment = async (assessment: any) => {
  return await addDoc(collection(db, "assessments"), {
    ...assessment,
    timestamp: Timestamp.now()
  });
};

// --- Inventory ---
export const subscribeToInventory = (phcId: string, callback: (items: any[]) => void) => {
  const q = collection(db, `inventory/${phcId}/items`);
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(items);
  });
};
