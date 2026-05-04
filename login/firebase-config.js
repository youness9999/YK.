// 1. Paste your Firebase configuration here
const firebaseConfig = {
    apiKey: "AIzaSyC6If8kA8HY6gYXp3PBv14C8zXGnWy2S14",
    authDomain: "ykshop-6ce6f.firebaseapp.com",
    projectId: "ykshop-6ce6f",
    storageBucket: "ykshop-6ce6f.firebasestorage.app",
    messagingSenderId: "639055131318",
    appId: "1:639055131318:web:e23afb614b90baf4092c17"
};

// 2. Initialize Firebase
firebase.initializeApp(firebaseConfig);

// 3. Initialize Cloud Firestore and get a reference to the service
const db = firebase.firestore();
