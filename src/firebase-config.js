// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'; // Importamos la autenticación
import { getFirestore } from 'firebase/firestore'; // Importamos Cloud Firestore

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCNDR9Ph8piE-7gjqB4OfYOQ_vO13WzoVU",
    authDomain: "prueba-conteo-votos.firebaseapp.com",
    projectId: "prueba-conteo-votos",
    storageBucket: "prueba-conteo-votos.firebasestorage.app",
    messagingSenderId: "89480573097",
    appId: "1:89480573097:web:df41a3f0bb33d47479b9b8",
    measurementId: "G-NCG8RWE0P7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Exportar los servicios que usaremos
export const auth = getAuth(app); // Para la autenticación
export const db = getFirestore(app); // Para Cloud Firestore

// Ahora puedes importar 'auth' y 'db' en cualquier componente