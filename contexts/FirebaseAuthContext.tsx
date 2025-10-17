import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { router } from 'expo-router';
import { auth } from '@/config/firebase';
import { FirebaseService, User, UserProfile } from '@/services/FirebaseService';
import { AuthService, AuthUser } from '@/services/authService';
import { logger } from '@/utils/logger';

interface AuthContextData {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: { name: string; email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setUser: (user: FirebaseUser | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setIsAuthenticated: (authenticated: boolean) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setLoading(true);
        setError(null);
        logger.debug('[Auth] State changed:', firebaseUser ? `User ${firebaseUser.uid}` : 'No user');
        
        if (firebaseUser) {
          logger.info('[Auth] User authenticated:', firebaseUser.uid);
          setUser(firebaseUser);
          setIsAuthenticated(true);

          const authUser: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || undefined,
            photoURL: firebaseUser.photoURL || undefined,
          };
          await AuthService.saveUser(authUser);

          logger.debug('[Auth] Loading profile for user:', firebaseUser.uid);
          const profile = await FirebaseService.getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
          logger.info('[Auth] Profile loaded:', profile ? 'Success' : 'Not found');

          if (profile) {
            logger.debug('[Auth] Tutorial status:', profile.hasSeenTutorial ? 'SEEN' : 'NOT SEEN');
          }
          
          // Check if migration is needed
          await checkAndMigrateLocalData(firebaseUser.uid);
        } else {
          logger.info('[Auth] User logged out');

          setUser(null);
          setUserProfile(null);
          setIsAuthenticated(false);
          setError(null);

          try {
            await AuthService.clearAllData();
            logger.debug('[Auth] Local data cleared after logout');
          } catch (error) {
            logger.warn('[Auth] Could not clear local data:', error);
          }
        }
      } catch (error) {
        logger.error('[Auth] Error in auth state change:', error);
        setError('Authentication error occurred');

        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    });

    // Listen for logout events from other tabs/windows
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'logout' && e.newValue === 'true') {
          logger.info('[Auth] Logout detected from another tab');
          handleCrossTabLogout();
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      return () => {
        unsubscribe();
        window.removeEventListener('storage', handleStorageChange);
      };
    }
    return unsubscribe;
  }, []);

  const handleCrossTabLogout = useCallback(async () => {
    try {
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      setError(null);
      router.replace('/auth/login');
    } catch (error) {
      logger.error('[Auth] Error handling cross-tab logout:', error);
    }
  }, []);
  const checkAndMigrateLocalData = useCallback(async (userId: string) => {
    try {
      logger.debug(`[Migration] Checking status for user: ${userId}`);
      const migrationFlag = await AuthService.getUser();

      if (!migrationFlag) {
        logger.info(`[Migration] Starting data migration for user: ${userId}`);
        try {
          await migrateLocalDataToFirebase(userId);
          logger.info(`[Migration] Completed successfully for user: ${userId}`);
        } catch (error) {
          logger.error(`[Migration] Failed for user: ${userId}`, error);
        }
      } else {
        logger.debug(`[Migration] Already completed for user: ${userId}`);
      }
    } catch (error) {
      logger.error(`[Migration] Check failed for user: ${userId}`, error);
    }
  }, []);

  const migrateLocalDataToFirebase = useCallback(async (userId: string) => {
    try {
      logger.debug(`[Migration] Collecting local data for user: ${userId}`);
      logger.info(`[Migration] Skipped - using new auth system for user: ${userId}`);
    } catch (error) {
      logger.error(`[Migration] Failed for user: ${userId}`, error);
    }
  }, []);
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      logger.info('[Auth] Attempting login for:', email);
      await FirebaseService.loginUser(email, password);
      logger.info('[Auth] Login successful for:', email);
      return true;
    } catch (error: any) {
      logger.error('[Auth] Login failed for:', email, error);
      setError('Login failed. Please check your credentials.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: { name: string; email: string; password: string }): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      logger.info('[Auth] Attempting registration for:', userData.email);
      await FirebaseService.registerUser(userData.email, userData.password, userData.name);
      logger.info('[Auth] Registration successful for:', userData.email);
      return true;
    } catch (error: any) {
      logger.error('[Auth] Registration failed for:', userData.email, error);
      setError('Registration failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      logger.info('[Auth] Starting logout process');
      setLoading(true);

      await AuthService.logout();

      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      setError(null);

      logger.info('[Auth] Logout completed successfully');
      router.replace('/auth/login');
    } catch (error) {
      logger.error('[Auth] Error during logout:', error);

      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      setError(null);

      router.replace('/auth/login');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('No authenticated user');

      setError(null);
      logger.info('[Auth] Updating user profile:', user.uid);

      if (updates.profileImageUrl && userProfile?.profileImageUrl &&
          userProfile.profileImageUrl !== updates.profileImageUrl) {
        try {
          logger.debug('[Auth] Deleting old profile image:', user.uid);
          await FirebaseService.deleteProfileImage(userProfile.profileImageUrl);
        } catch (error) {
          logger.warn('[Auth] Could not delete old profile image:', error);
        }
      }

      await FirebaseService.updateUserProfile(user.uid, updates);
      logger.info('[Auth] Profile updated successfully:', user.uid);

      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      logger.error('[Auth] Profile update failed:', user?.uid, error);
      setError('Failed to update profile. Please try again.');
      throw error;
    }
  }, [user, userProfile]);


  const contextValue = useMemo(
    () => ({
      user,
      userProfile,
      isAuthenticated,
      loading,
      error,
      login,
      register,
      logout,
      updateUserProfile,
      setUser,
      setUserProfile,
      setIsAuthenticated,
    }),
    [user, userProfile, isAuthenticated, loading, error, login, register, logout, updateUserProfile]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
};