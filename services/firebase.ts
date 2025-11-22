import { initializeApp } from "firebase/app";
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

// Initialize Auth
const auth = getAuth(app);

// Export auth and app
export { auth };
export default app;