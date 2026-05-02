// 1. Paste your Firebase configuration here
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "ykshop-6ce6f",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// 2. Initialize Firebase
firebase.initializeApp(firebaseConfig);

// 3. Initialize Cloud Firestore and get a reference to the service
const db = firebase.firestore();
