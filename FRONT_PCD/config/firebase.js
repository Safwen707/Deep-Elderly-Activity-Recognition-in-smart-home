import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyB4-NYTPjcM86_ymblzzwRpKQtClr0H_vo",
    authDomain: "mynewapp-c73cb.firebaseapp.com",
    projectId: "mynewapp-c73cb",
    storageBucket: "mynewapp-c73cb.appspot.com", // Changed to .appspot.com
    messagingSenderId: "230143602018",
    appId: "1:230143602018:web:896625252a02431868903b",
    measurementId: "G-JM9MQYQRDS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // Add storage instance

export { db, auth, storage }; // Export storage