
// Firebase Auth is no longer used in this application.
// This file is kept to prevent import errors if other files still reference it,
// but its functions no longer interact with Firebase.

console.log("[AuthService] Firebase Auth functions are no longer active.");

export const signUpWithEmailPassword = async (email: string, pass: string): Promise<any> => {
  console.warn("signUpWithEmailPassword called, but Firebase Auth is not active.");
  throw new Error("Firebase Auth is not configured in this application.");
};

export const signInWithEmailPassword = async (email: string, pass: string): Promise<any> => {
  console.warn("signInWithEmailPassword called, but Firebase Auth is not active.");
  throw new Error("Firebase Auth is not configured in this application.");
};

export const signOutUser = async (): Promise<void> => {
  console.warn("signOutUser called, but Firebase Auth is not active.");
  // No actual sign out needed as there's no auth session
  return Promise.resolve();
};

export const getCurrentFirebaseUser = (): null => {
  // Always returns null as Firebase Auth is not used
  return null;
};
