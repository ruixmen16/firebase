// src/hooks/useChat.js
import { useState, useEffect } from 'react';
import { db, storage } from '../firebase-config';
import { collection, addDoc, query, onSnapshot, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const useChat = (user) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    const maxChars = 500;

    // Cargar mensajes
    useEffect(() => {
        if (user) {
            setLoading(true);

            const q = query(
                collection(db, "mensajes"),
                limit(100)
            );

            const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
                const userMessages = [];
                querySnapshot.forEach((doc) => {
                    userMessages.push({ id: doc.id, ...doc.data() });
                });

                userMessages.sort((a, b) => {
                    if (a.timestamp && b.timestamp) {
                        return b.timestamp.toDate() - a.timestamp.toDate();
                    }
                    return 0;
                });

                setMessages(userMessages);
                setLoading(false);
            }, (error) => {
                console.error("Error al cargar mensajes:", error);
                setLoading(false);
            });

            return () => unsubscribeMessages();
        } else {
            setMessage('');
            setMessages([]);
            setLoading(false);
        }
    }, [user]);

    // Manejar selección de imagen
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Por favor selecciona solo archivos de imagen');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen es muy grande. Máximo 5MB');
                return;
            }

            setSelectedImage(file);

            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Limpiar imagen
    const clearImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
    };

    // Subir imagen
    const uploadImage = async (file, userId) => {
        try {
            const timestamp = Date.now();
            const fileName = `images/${userId}/${timestamp}_${file.name}`;
            const storageRef = ref(storage, fileName);

            console.log("Subiendo imagen:", fileName);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log("Imagen subida exitosamente:", downloadURL);
            return downloadURL;
        } catch (error) {
            console.error("Error detallado al subir imagen:", error);

            if (error.code === 'storage/unauthorized') {
                throw new Error("Firebase Storage no está configurado. Por favor, habilita Storage en la consola de Firebase.");
            } else if (error.code === 'storage/canceled') {
                throw new Error("Subida cancelada.");
            } else if (error.code === 'storage/unknown') {
                throw new Error("Error desconocido al subir la imagen. Verifica tu conexión a internet.");
            } else {
                throw new Error(`Error al subir imagen: ${error.message}`);
            }
        }
    };

    // Guardar mensaje
    const saveMessage = async () => {
        if (user && (message.trim() !== '' || selectedImage)) {
            setUploading(true);
            try {
                let imageUrl = null;

                if (selectedImage) {
                    imageUrl = await uploadImage(selectedImage, user.uid);
                }

                const userData = {
                    text: message,
                    imageUrl: imageUrl,
                    timestamp: new Date(),
                    userId: user.uid,
                    userName: user.displayName || user.email?.split('@')[0] || 'Usuario sin nombre',
                    userEmail: user.email || 'Email no disponible',
                    userPhoto: user.photoURL || null
                };

                console.log("Guardando mensaje con datos:", userData);

                await addDoc(collection(db, "mensajes"), userData);

                alert("Mensaje guardado con éxito!");
                setMessage('');
                clearImage();
            } catch (error) {
                console.error("Error al guardar el mensaje: ", error);

                if (error.message.includes('Firebase Storage no está configurado')) {
                    alert(`
❌ Firebase Storage no está habilitado.

Para usar imágenes necesitas:
1. Ir a https://console.firebase.google.com/project/prueba-conteo-votos/storage
2. Hacer clic en "Comenzar"
3. Seleccionar "Modo de prueba"
4. Elegir una región

Mientras tanto, puedes enviar solo mensajes de texto.
          `);
                } else {
                    alert(`Error: ${error.message}`);
                }
            } finally {
                setUploading(false);
            }
        } else {
            alert("Escribe un mensaje o selecciona una imagen.");
        }
    };

    return {
        message,
        setMessage,
        messages,
        loading,
        selectedImage,
        imagePreview,
        uploading,
        maxChars,
        handleImageSelect,
        clearImage,
        saveMessage
    };
};