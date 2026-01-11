// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAMqKuf5ojz62m2Y30HBWskF8F1apJRzj0",
    authDomain: "dune-uprising-tracker.firebaseapp.com",
    projectId: "dune-uprising-tracker",
    storageBucket: "dune-uprising-tracker.firebasestorage.app",
    messagingSenderId: "31927845078",
    appId: "1:31927845078:web:73d8896fd2a34b2721c977"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
