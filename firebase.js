import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { getAuth } from "firebase/auth"; // We can add Auth later if needed

const firebaseConfig = {
    apiKey: "AIzaSyC6If8kA8HY6gYXp3PBv14C8zXGnWy2S14",
    authDomain: "ykshop-6ce6f.firebaseapp.com",
    projectId: "ykshop-6ce6f",
    storageBucket: "ykshop-6ce6f.firebasestorage.app",
    messagingSenderId: "639055131318",
    appId: "1:639055131318:web:e23afb614b90baf4092c17"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
