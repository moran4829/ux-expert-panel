import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import type { ExpertOverrides, ReviewProject } from '../types';
import type { LlmSettings } from '../types/llm';
import type { SavedPersona } from '../types/userSimulation';
import type { WizardFieldOptions } from '../data/wizardOptions';

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  /** Short http(s) URL only — not for uploaded avatars */
  photoURL: string | null;
  /** Inline avatar stored in Firestore (data URL) */
  photoDataUrl?: string | null;
  updatedAt: string;
};

export function resolveUserPhoto(profile: Pick<UserProfile, 'photoURL' | 'photoDataUrl'> | null | undefined): string | null {
  if (profile?.photoDataUrl) return profile.photoDataUrl;
  const url = profile?.photoURL;
  if (url && url.startsWith('http')) return url;
  return null;
}

export type UserAppSettings = {
  expertOverrides: ExpertOverrides;
  llmSettings: LlmSettings;
  wizardFieldOptions: WizardFieldOptions;
};

export type UserAppData = {
  projects: ReviewProject[];
  personas: SavedPersona[];
  settings: UserAppSettings;
};

export type AdminUserSummary = UserProfile & {
  projectCount: number;
};

export type AdminProjectRow = ReviewProject & {
  ownerUid: string;
  ownerEmail: string | null;
  ownerName: string | null;
};

function userRef(uid: string) {
  return doc(getFirebaseDb(), 'users', uid);
}

function settingsRef(uid: string) {
  return doc(getFirebaseDb(), 'users', uid, 'data', 'app');
}

function projectsCol(uid: string) {
  return collection(getFirebaseDb(), 'users', uid, 'projects');
}

function personasCol(uid: string) {
  return collection(getFirebaseDb(), 'users', uid, 'personas');
}

/** Firestore rejects `undefined` anywhere in document payloads. */
export function sanitizeForFirestore<T>(value: T): T {
  if (value === undefined) return value;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val !== undefined) {
      out[key] = sanitizeForFirestore(val);
    }
  }
  return out as T;
}

export async function upsertUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(userRef(profile.uid), sanitizeForFirestore(profile), { merge: true });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userRef(uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function patchUserProfile(
  uid: string,
  patch: Partial<Omit<UserProfile, 'uid'>>
): Promise<void> {
  await setDoc(
    userRef(uid),
    sanitizeForFirestore({ ...patch, uid, updatedAt: new Date().toISOString() }),
    { merge: true }
  );
}

export async function loadUserAppData(uid: string): Promise<UserAppData | null> {
  const db = getFirebaseDb();
  const [settingsSnap, projectsSnap, personasSnap] = await Promise.all([
    getDoc(settingsRef(uid)),
    getDocs(projectsCol(uid)),
    getDocs(personasCol(uid)),
  ]);

  const hasProjects = !projectsSnap.empty;
  const hasPersonas = !personasSnap.empty;
  const hasSettings = settingsSnap.exists();

  if (!hasProjects && !hasPersonas && !hasSettings) return null;

  const settingsData = (settingsSnap.data() ?? {}) as DocumentData;
  const settings: UserAppSettings = {
    expertOverrides: (settingsData.expertOverrides as ExpertOverrides) ?? {},
    llmSettings: settingsData.llmSettings as LlmSettings,
    wizardFieldOptions: settingsData.wizardFieldOptions as WizardFieldOptions,
  };

  const projects = projectsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as ReviewProject)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  const personas = personasSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as SavedPersona);

  return { projects, personas, settings };
}

export async function saveUserAppData(uid: string, data: UserAppData): Promise<void> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);

  batch.set(
    settingsRef(uid),
    sanitizeForFirestore({
      expertOverrides: data.settings.expertOverrides,
      llmSettings: data.settings.llmSettings,
      wizardFieldOptions: data.settings.wizardFieldOptions,
      updatedAt: new Date().toISOString(),
    }),
    { merge: true }
  );

  const projectIds = new Set(data.projects.map((p) => p.id));
  const existingProjects = await getDocs(projectsCol(uid));
  for (const snap of existingProjects.docs) {
    if (!projectIds.has(snap.id)) {
      batch.delete(snap.ref);
    }
  }
  for (const project of data.projects) {
    const { id, ...rest } = project;
    batch.set(doc(projectsCol(uid), id), sanitizeForFirestore(rest), { merge: true });
  }

  const personaIds = new Set(data.personas.map((p) => p.id));
  const existingPersonas = await getDocs(personasCol(uid));
  for (const snap of existingPersonas.docs) {
    if (!personaIds.has(snap.id)) {
      batch.delete(snap.ref);
    }
  }
  for (const persona of data.personas) {
    const { id, ...rest } = persona;
    batch.set(doc(personasCol(uid), id), sanitizeForFirestore(rest), { merge: true });
  }

  await batch.commit();
}

export async function deleteUserProject(uid: string, projectId: string): Promise<void> {
  await deleteDoc(doc(projectsCol(uid), projectId));
}

export async function listAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(getFirebaseDb(), 'users'));
  return snap.docs.map((d) => d.data() as UserProfile);
}

export async function listAllProjectsForAdmin(): Promise<AdminProjectRow[]> {
  const snap = await getDocs(collectionGroup(getFirebaseDb(), 'projects'));
  const rows: AdminProjectRow[] = [];

  for (const docSnap of snap.docs) {
    const ownerUid = docSnap.ref.parent.parent?.id;
    if (!ownerUid) continue;

    let ownerEmail: string | null = null;
    let ownerName: string | null = null;
    try {
      const profileSnap = await getDoc(userRef(ownerUid));
      if (profileSnap.exists()) {
        const p = profileSnap.data() as UserProfile;
        ownerEmail = p.email;
        ownerName = p.displayName;
      }
    } catch {
      /* profile optional */
    }

    rows.push({
      id: docSnap.id,
      ...(docSnap.data() as Omit<ReviewProject, 'id'>),
      ownerUid,
      ownerEmail,
      ownerName,
    });
  }

  return rows.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export async function getUserProjectCounts(): Promise<Map<string, number>> {
  const snap = await getDocs(collectionGroup(getFirebaseDb(), 'projects'));
  const counts = new Map<string, number>();
  for (const docSnap of snap.docs) {
    const ownerUid = docSnap.ref.parent.parent?.id;
    if (!ownerUid) continue;
    counts.set(ownerUid, (counts.get(ownerUid) ?? 0) + 1);
  }
  return counts;
}
