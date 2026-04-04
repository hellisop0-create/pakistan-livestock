import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '../types';

// 1. CENTRAL ADMIN LIST (Must match your Admin.tsx)
const ADMIN_EMAILS = [
  'saadatali1403@gmail.com',
  'hellisop0@gmail.com',
  'mehreensaadat2@gmail.com'
].map(email => email.toLowerCase().trim());

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userEmail = firebaseUser.email?.toLowerCase().trim() || "";
        
        // 2. IMMEDIATE CHECK: Check if email is in the hardcoded list
        const isHardcodedAdmin = ADMIN_EMAILS.includes(userEmail);

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              ...userData 
            } as User);
            
            // 3. FINAL ADMIN LOGIC: True if role is admin OR email is in list
            setIsAdmin(userData.role === 'admin' || isHardcodedAdmin);
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              favoriteAds: []
            } as User);
            
            // Even if no database doc exists, let them in if they are in the list
            setIsAdmin(isHardcodedAdmin);
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore sync error:", error);
          // If Firestore fails, still give access based on email list
          setIsAdmin(isHardcodedAdmin);
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // Clear local storage on logout just in case
      sessionStorage.removeItem('admin_session_active');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}