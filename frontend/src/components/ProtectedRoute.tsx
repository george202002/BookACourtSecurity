import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/AuthService";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
}) => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Subscribe to Firebase auth state changes
    const unsubscribe = authService.subscribeToAuthStateChanges(async (firebaseUser) => {
      if (!firebaseUser) {
        // No Firebase user, not authenticated
        setIsAuth(false);
        setAuthChecked(true);
        return;
      }

      // Firebase user exists, check for app user data
      let appUser = authService.getStoredUser();

      if (!appUser) {
        // Try to refresh user data from backend
        appUser = await authService.refreshUserData();
      }

      if (appUser) {
        setIsAuth(true);
        setIsAdmin(appUser.role === "ADMIN");
      } else {
        // Firebase user exists but no backend user data
        // This shouldn't happen in normal flow, redirect to login
        setIsAuth(false);
      }

      setAuthChecked(true);
    });

    // Check immediately if we already have a Firebase user
    const currentFirebaseUser = authService.getCurrentUser();
    if (currentFirebaseUser) {
      const appUser = authService.getStoredUser();
      if (appUser) {
        setIsAuth(true);
        setIsAdmin(appUser.role === "ADMIN");
        setAuthChecked(true);
      }
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (!isAuth) {
      navigate("/");
      return;
    }

    if (adminOnly && !isAdmin) {
      navigate("/dashboard");
      return;
    }
  }, [authChecked, isAuth, isAdmin, adminOnly, navigate]);

  if (!authChecked) {
    return null;
  }

  if (!isAuth) {
    return null;
  }

  if (adminOnly && !isAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
