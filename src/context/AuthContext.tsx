import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  isSignInWithEmailLink,
  linkWithCredential,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  updateEmail,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { isAdminEmail } from '../lib/admin';
import { setActiveFirebaseUid } from '../lib/authUid';
import { mapAuthError } from '../lib/authErrors';
import {
  cleanEmailLinkFromUrl,
  clearEmailLinkStorage,
  getEmailLinkActionCodeSettings,
  readDisplayNameForSignIn,
  readEmailForSignIn,
  storeEmailForSignIn,
} from '../lib/emailLinkAuth';
import {
  getUserProfile,
  patchUserProfile,
  resolveUserPhoto,
  type UserProfile,
} from '../lib/userDataFirestore';

type AuthContextType = {
  user: User | null;
  userPhoto: string | null;
  loading: boolean;
  isAdmin: boolean;
  firebaseReady: boolean;
  profileVersion: number;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  sendEmailSignInLink: (email: string, displayName?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  completeEmailLinkSignIn: (email: string) => Promise<void>;
  emailLinkPending: boolean;
  completingEmailLink: boolean;
  signOut: () => Promise<void>;
  updateUserProfile: (fields: { displayName?: string; photoDataUrl?: string | null }) => Promise<void>;
  updateUserEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  setLoginPassword: (newPassword: string) => Promise<void>;
  userHasPasswordLogin: boolean;
  authError: string | null;
  setAuthError: (message: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function syncAuthFieldsToFirestore(user: User): Promise<UserProfile> {
  const existing = await getUserProfile(user.uid);
  const patch: Partial<Omit<UserProfile, 'uid'>> = {
    email: user.email,
    displayName: user.displayName,
  };
  if (user.photoURL?.startsWith('http')) {
    patch.photoURL = user.photoURL;
  }
  await patchUserProfile(user.uid, patch);
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL?.startsWith('http') ? user.photoURL : existing?.photoURL ?? null,
    photoDataUrl: existing?.photoDataUrl ?? null,
    updatedAt: new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firestoreProfile, setFirestoreProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profileVersion, setProfileVersion] = useState(0);
  const [emailLinkPending, setEmailLinkPending] = useState(false);
  const [completingEmailLink, setCompletingEmailLink] = useState(false);
  const firebaseReady = isFirebaseConfigured();

  const refreshProfile = useCallback(async () => {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setFirestoreProfile(null);
      return;
    }
    await currentUser.reload();
    const profile = await getUserProfile(currentUser.uid);
    setFirestoreProfile(profile);
    setProfileVersion((v) => v + 1);
  }, []);

  const completeEmailLinkSignIn = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    setAuthError(null);
    setCompletingEmailLink(true);
    try {
      await signInWithEmailLink(auth, email.trim(), window.location.href);
      const displayName = readDisplayNameForSignIn();
      if (displayName && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
      }
      clearEmailLinkStorage();
      cleanEmailLinkFromUrl();
      setEmailLinkPending(false);
    } catch (error) {
      const msg = mapAuthError(error);
      setAuthError(msg);
      throw error;
    } finally {
      setCompletingEmailLink(false);
    }
  }, []);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const storedEmail = readEmailForSignIn();
      if (storedEmail) {
        setLoading(true);
        void completeEmailLinkSignIn(storedEmail).finally(() => setLoading(false));
      } else {
        setEmailLinkPending(true);
        setLoading(false);
      }
    }
  }, [firebaseReady, completeEmailLinkSignIn]);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setActiveFirebaseUid(nextUser?.uid ?? null);

      const finishingEmailLink = isSignInWithEmailLink(auth, window.location.href);
      if (!finishingEmailLink || nextUser) {
        setLoading(false);
      }

      if (nextUser) {
        setEmailLinkPending(false);
        setAuthError(null);
        try {
          const profile = await syncAuthFieldsToFirestore(nextUser);
          setFirestoreProfile(profile);
        } catch {
          try {
            const profile = await getUserProfile(nextUser.uid);
            setFirestoreProfile(profile);
          } catch {
            setFirestoreProfile(null);
          }
        }
      } else {
        setFirestoreProfile(null);
      }
    });

    return unsub;
  }, [firebaseReady]);

  const reauthenticate = useCallback(async (currentPassword: string) => {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    if (!currentUser?.email) {
      throw new Error('לא מחובר');
    }
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const trimmedEmail = email.trim();
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), trimmedEmail, password);
    } catch (error) {
      const code = (error as { code?: string })?.code ?? '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        try {
          const methods = await fetchSignInMethodsForEmail(getFirebaseAuth(), trimmedEmail);
          if (methods.length > 0 && !methods.includes('password')) {
            setAuthError(
              'לחשבון זה אין סיסמה — התחברי עם «קישור חד-פעמי במייל», ואז «שכחתי סיסמה» להגדרת סיסמה.'
            );
            throw error;
          }
        } catch {
          /* keep default message */
        }
      }
      const msg = mapAuthError(error);
      setAuthError(msg);
      throw error;
    }
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setAuthError(null);
      try {
        const auth = getFirebaseAuth();
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const name = displayName?.trim();
        if (name) {
          await updateProfile(cred.user, { displayName: name });
        }
      } catch (error) {
        const msg = mapAuthError(error);
        setAuthError(msg);
        throw error;
      }
    },
    []
  );

  const sendPasswordReset = useCallback(async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim(), {
        url: `${window.location.origin}${window.location.pathname}`,
      });
    } catch (error) {
      const msg = mapAuthError(error);
      setAuthError(msg);
      throw error;
    }
  }, []);

  const sendEmailSignInLink = useCallback(async (email: string, displayName?: string) => {
    setAuthError(null);
    try {
      const auth = getFirebaseAuth();
      storeEmailForSignIn(email, displayName);
      await sendSignInLinkToEmail(auth, email.trim(), getEmailLinkActionCodeSettings());
    } catch (error) {
      const msg = mapAuthError(error);
      setAuthError(msg);
      throw error;
    }
  }, []);

  const signOut = async () => {
    setAuthError(null);
    await firebaseSignOut(getFirebaseAuth());
  };

  const updateUserProfile = useCallback(
    async (fields: { displayName?: string; photoDataUrl?: string | null }) => {
      setAuthError(null);
      try {
        const auth = getFirebaseAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('לא מחובר');

        const firestorePatch: Partial<Omit<UserProfile, 'uid'>> = {};

        if (fields.displayName !== undefined) {
          const name = fields.displayName.trim() || null;
          await updateProfile(currentUser, { displayName: name });
          firestorePatch.displayName = name;
        }

        if (fields.photoDataUrl !== undefined) {
          firestorePatch.photoDataUrl = fields.photoDataUrl || null;
        }

        if (Object.keys(firestorePatch).length > 0) {
          await patchUserProfile(currentUser.uid, firestorePatch);
        }

        await currentUser.reload();
        const profile = await getUserProfile(currentUser.uid);
        setFirestoreProfile(profile);
        setProfileVersion((v) => v + 1);
      } catch (error) {
        const msg = mapAuthError(error);
        setAuthError(msg);
        throw error;
      }
    },
    []
  );

  const updateUserEmail = useCallback(
    async (newEmail: string, currentPassword: string) => {
      setAuthError(null);
      try {
        const auth = getFirebaseAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('לא מחובר');

        await reauthenticate(currentPassword);
        await updateEmail(currentUser, newEmail.trim());
        await currentUser.reload();
        await patchUserProfile(currentUser.uid, { email: currentUser.email });
        await refreshProfile();
      } catch (error) {
        const msg = mapAuthError(error);
        setAuthError(msg);
        throw error;
      }
    },
    [refreshProfile, reauthenticate]
  );

  const setLoginPassword = useCallback(async (newPassword: string) => {
    setAuthError(null);
    try {
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;
      if (!currentUser?.email) throw new Error('לא מחובר');

      try {
        await updatePassword(currentUser, newPassword);
        return;
      } catch (error) {
        const code = (error as { code?: string })?.code ?? '';
        if (code !== 'auth/requires-recent-login' && code !== 'auth/operation-not-allowed') {
          throw error;
        }
      }

      const credential = EmailAuthProvider.credential(currentUser.email, newPassword);
      await linkWithCredential(currentUser, credential);
    } catch (error) {
      const msg = mapAuthError(error);
      setAuthError(msg);
      throw error;
    }
  }, []);

  const updateUserPassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setAuthError(null);
      try {
        const auth = getFirebaseAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('לא מחובר');

        await reauthenticate(currentPassword);
        await updatePassword(currentUser, newPassword);
      } catch (error) {
        const msg = mapAuthError(error);
        setAuthError(msg);
        throw error;
      }
    },
    [reauthenticate]
  );

  const userPhoto = useMemo(
    () => resolveUserPhoto(firestoreProfile),
    [firestoreProfile, profileVersion]
  );

  const userHasPasswordLogin = useMemo(() => {
    if (!user) return false;
    return user.providerData.some((p) => p.providerId === 'password');
  }, [user, profileVersion]);

  const isAdmin = useMemo(
    () => isAdminEmail(user?.email),
    [user?.email, profileVersion]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        userPhoto,
        loading,
        isAdmin,
        firebaseReady,
        profileVersion,
        signInWithEmail,
        signUpWithEmail,
        sendEmailSignInLink,
        sendPasswordReset,
        completeEmailLinkSignIn,
        emailLinkPending,
        completingEmailLink,
        signOut,
        updateUserProfile,
        updateUserEmail,
        updateUserPassword,
        setLoginPassword,
        userHasPasswordLogin,
        authError,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
