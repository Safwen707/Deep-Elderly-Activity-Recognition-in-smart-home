// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
    apiKey: "AIzaSyB4-NYTPjcM86_ymblzzwRpKQtClr0H_vo",
    authDomain: "mynewapp-c73cb.firebaseapp.com",
    projectId: "mynewapp-c73cb",
    storageBucket: "mynewapp-c73cb.firebasestorage.app",
    messagingSenderId: "230143602018",
    appId: "1:230143602018:web:896625252a02431868903b",
    measurementId: "G-JM9MQYQRDS"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const db=getFirestore(app);
const auth = getAuth(app);
export { db, auth };
