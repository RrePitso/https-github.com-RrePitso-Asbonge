import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { ref, query, orderByChild, equalTo, get, push, set } from 'firebase/database';
import { auth, db } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
          // 1. Check if user is already in 'admins' node in Realtime Database
          const adminsRef = ref(db, 'admins');
          const adminQuery = query(adminsRef, orderByChild('email'), equalTo(currentUser.email));
          const snapshot = await get(adminQuery);
          
          if (snapshot.exists()) {
            setIsAdmin(true);
          } else {
            // 2. LOGIC TO PROMOTE ADMIN
            // Condition A: It is the specific "owner" email
            const isOwner = currentUser.email === 'admin@gmail.com';
            
            // Condition B: The admins list is completely empty (Bootstrap first user)
            let isDbEmpty = false;
            if (!isOwner) {
                const allAdminsSnapshot = await get(adminsRef);
                isDbEmpty = !allAdminsSnapshot.exists();
            }

            if (isOwner || isDbEmpty) {
              console.log(`Promoting ${currentUser.email} to admin...`);
              const newAdminRef = push(adminsRef);
              await set(newAdminRef, { 
                email: currentUser.email, 
                role: 'super_admin',
                createdAt: new Date().toISOString()
              });
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          }
        } catch (error) {
          console.error("Error verifying admin status:", error);
          // Fallback for the owner account if DB fails (e.g. during dev)
          if (currentUser.email === 'admin@gmail.com') {
             setIsAdmin(true);
          } else {
             setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
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
    <AuthContext.Provider value={{ user, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};