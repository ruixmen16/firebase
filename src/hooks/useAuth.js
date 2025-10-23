// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { auth } from '../firebase-config';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        console.log("Intentando iniciar sesión con Google...");
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            console.log("Login exitoso:", result.user);
        } catch (error) {
            console.error("Error al iniciar sesión con Google: ", error);

            if (error.code === 'auth/web-storage-unsupported' ||
                error.message.includes('missing initial state') ||
                error.message.includes('sessionStorage')) {

                alert(`
Error de almacenamiento del navegador. 
Por favor:
1. Limpia los datos del sitio en tu navegador
2. O usa modo incógnito/privado
3. Después recarga la página e intenta de nuevo
        `);
            } else {
                alert("Error al iniciar sesión. Intenta de nuevo.");
            }
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error al cerrar sesión: ", error);
        }
    };

    const clearBrowserData = () => {
        try {
            localStorage.clear();
            sessionStorage.clear();
            alert("Datos del navegador limpiados. Recarga la página e intenta iniciar sesión nuevamente.");
            window.location.reload();
        } catch (error) {
            alert("No se pudieron limpiar los datos. Usa modo incógnito o limpia manualmente los datos del sitio.");
        }
    };

    return {
        user,
        loading,
        signInWithGoogle,
        handleSignOut,
        clearBrowserData
    };
};