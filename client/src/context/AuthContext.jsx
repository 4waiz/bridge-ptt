import { useCallback, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AuthContext from './auth-context';
import { auth, db, firebaseReady } from '../firebase';
import { USER_ROLES } from '../utils/routes';

function ensureFirebaseReady() {
  if (!firebaseReady || !auth || !db) {
    throw new Error('Firebase is not configured. Please set client/.env and restart Vite.');
  }
}

async function ensureUserDoc(firebaseUser, preferredRole = USER_ROLES.APPLICANT, preferredName = '') {
  ensureFirebaseReady();

  const ref = doc(db, 'users', firebaseUser.uid);
  const snapshot = await getDoc(ref);

  if (snapshot.exists()) {
    const data = snapshot.data();
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: data.name || firebaseUser.displayName || preferredName || 'Bridge Member',
      role: data.role || USER_ROLES.APPLICANT,
      profilePicUrl: data.profilePicUrl || '',
    };
  }

  const payload = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    name: preferredName || firebaseUser.displayName || 'Bridge Member',
    role: preferredRole,
    profilePicUrl: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, payload, { merge: true });

  return {
    uid: payload.uid,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    profilePicUrl: '',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      return;
    }

    const profile = await ensureUserDoc(firebaseUser);
    setUser(profile);
  }, []);

  useEffect(() => {
    if (!firebaseReady || !auth) {
      setLoading(false);
      return () => {};
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        await refreshUser(firebaseUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [refreshUser]);

  const register = useCallback(async ({ name, email, password, role }) => {
    ensureFirebaseReady();
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const profile = await ensureUserDoc(result.user, role, name);
    setUser(profile);
    return profile;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    ensureFirebaseReady();
    const result = await signInWithEmailAndPassword(auth, email, password);
    const profile = await ensureUserDoc(result.user);
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(async () => {
    if (!firebaseReady || !auth) {
      setUser(null);
      return;
    }

    await signOut(auth);
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    register,
    login,
    logout,
    refreshUser: async () => {
      if (!firebaseReady || !auth) {
        return;
      }
      await refreshUser(auth.currentUser);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
