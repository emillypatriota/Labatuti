import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
    apiKey: "AIzaSyCEKe9SV13V0WSPlW6PtJmGkZKo8QifH-E",
    authDomain: "labatuti-192d2.firebaseapp.com",
    projectId: "labatuti-192d2",
    storageBucket: "labatuti-192d2.firebasestorage.app",
    messagingSenderId: "590534896260",
    appId: "1:590534896260:web:3ee9439f3144ae30dfb0d1",
    measurementId: "G-P7WS0YMWDG"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);