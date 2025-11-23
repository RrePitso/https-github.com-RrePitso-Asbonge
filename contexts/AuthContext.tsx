import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { ref, get, push, set } from 'firebase/database';
import { auth, db } from '../services/firebase';
import { AdminRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: AdminRole | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AdminRole | null>(null);

  useEffect(() => {
    if (!auth) {
      console.error("Auth instance is not available.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && currentUser.email) {
        try {
          // 1. Fetch all admins (avoid indexed query to prevent "Index not defined" error)
          const adminsRef = ref(db, 'admins');
          const snapshot = await get(adminsRef);
          
          let foundRole: AdminRole | null = null;
          let isDbEmpty = true;

          if (snapshot.exists()) {
            isDbEmpty = false;
            const adminsData = snapshot.val();
            // Client-side filter to find the user
            const adminEntry = Object.values(adminsData).find((a: any) => a.email === currentUser.email) as { role: AdminRole } | undefined;
            
            if (adminEntry) {
              foundRole = adminEntry.role || 'driver';
            }
          }

          if (foundRole) {
            setUserRole(foundRole);
          } else {
            // 2. LOGIC TO PROMOTE ADMIN
            // Condition A: It is the specific "owner" email
            const isOwner = currentUser.email === 'admin@gmail.com';
            
            if (isOwner || isDbEmpty) {
              console.log(`Promoting ${currentUser.email} to super_admin...`);
              const newAdminRef = push(adminsRef);
              await set(newAdminRef, { 
                email: currentUser.email, 
                role: 'super_admin',
                createdAt: new Date().toISOString()
              });
              setUserRole('super_admin');
            } else {
              setUserRole(null);
            }
          }
        } catch (error) {
          console.error("Error verifying admin status:", error);
          // Fallback for the owner account if DB fails
          if (currentUser.email === 'admin@gmail.com') {
             setUserRole('super_admin');
          } else {
             setUserRole(null);
          }
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, userRole, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};