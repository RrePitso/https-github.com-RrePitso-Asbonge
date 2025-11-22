import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqwin768SOv_WJYchULmpYcugcJwO4Dcs",
  authDomain: "asbonge-1e29d.firebaseapp.com",
  projectId: "asbonge-1e29d",
  storageBucket: "asbonge-1e29d.firebasestorage.app",
  messagingSenderId: "123791191964",
  appId: "1:123791191964:web:b8dfff91ce7c53f011a259",
  measurementId: "G-K2XS08Z983"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally to prevent crashes
let analytics;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn("Firebase Analytics failed to initialize (this is often expected in development or restricted environments):", error);
}

// Initialize Auth conditionally
let auth: Auth | undefined;
try {
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase Auth failed to initialize. Check version compatibility.", error);
}

export { auth, analytics };
export default app;