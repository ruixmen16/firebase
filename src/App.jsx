// src/App.jsx
import React, { useState, useEffect } from 'react';
import { auth, db, storage } from './firebase-config'; // Importa auth, db y storage
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { collection, addDoc, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './App.css'; // Si quieres añadir estilos

function App() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const maxChars = 500;

  // Función para limpiar datos del navegador
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

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Cargar TODOS los mensajes de todos los usuarios (chat familiar)
        setLoading(true);

        const q = query(
          collection(db, "mensajes"),
          limit(100) // Mostrar los 100 mensajes más recientes de todos los usuarios
        );

        const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
          const userMessages = [];
          querySnapshot.forEach((doc) => {
            userMessages.push({ id: doc.id, ...doc.data() });
          });

          // Ordenar por timestamp (más reciente primero)
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
    });
    return () => unsubscribe(); // Limpiar el listener al desmontar
  }, []);

  // Función para manejar selección de imagen
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona solo archivos de imagen');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 5MB');
        return;
      }

      setSelectedImage(file);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Función para limpiar imagen seleccionada
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Función para subir imagen a Firebase Storage
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
  };  // Función para iniciar sesión con Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error al iniciar sesión con Google: ", error);

      // Si hay problemas con el almacenamiento, intentar limpiar y volver a intentar
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

  // Función para cerrar sesión
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión: ", error);
    }
  };

  // Función para guardar el mensaje en Firestore
  const saveMessage = async () => {
    if (user && (message.trim() !== '' || selectedImage)) {
      setUploading(true);
      try {
        let imageUrl = null;

        // Si hay una imagen seleccionada, subirla primero
        if (selectedImage) {
          imageUrl = await uploadImage(selectedImage, user.uid);
        }

        // Obtener datos del usuario con validación
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

        // Guardar el mensaje con o sin imagen
        await addDoc(collection(db, "mensajes"), userData);

        alert("Mensaje guardado con éxito!");
        setMessage('');
        clearImage();
      } catch (error) {
        console.error("Error al guardar el mensaje: ", error);

        // Mostrar error específico al usuario
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>Mi Aplicación de Notas Firebase</h1>
        {!user ? (
          // Vista de inicio de sesión
          <div>
            <p>Por favor, inicia sesión para continuar.</p>
            <button onClick={signInWithGoogle}>Iniciar Sesión con Google</button>

            {/* Botón de ayuda para problemas de almacenamiento */}
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '5px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                <strong>¿Problemas para iniciar sesión?</strong>
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px' }}>
                Si ves errores sobre "almacenamiento" o "initial state", prueba:
              </p>
              <button
                onClick={clearBrowserData}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '3px',
                  fontSize: '12px'
                }}
              >
                Limpiar Datos del Navegador
              </button>
            </div>
          </div>
        ) : (
          // Vista principal una vez logeado
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              {/* Foto de perfil */}
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Foto de perfil"
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    border: '2px solid #007bff',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#007bff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              {/* Información del usuario */}
              <div>
                <p style={{ margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                  Bienvenido, <strong>{user.displayName || 'Sin nombre'}</strong>
                </p>
                <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                  {user.email || 'Sin email'}
                </p>
              </div>
            </div>

            {/* Debug info - se puede quitar después */}
            <details style={{ margin: '10px 0', fontSize: '12px', color: '#666' }}>
              <summary style={{ cursor: 'pointer' }}>Ver datos de usuario (debug)</summary>
              <div style={{ marginTop: '5px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '3px' }}>
                <p><strong>ID:</strong> {user.uid}</p>
                <p><strong>Nombre:</strong> {user.displayName || 'null/undefined'}</p>
                <p><strong>Email:</strong> {user.email || 'null/undefined'}</p>
                <p><strong>Foto:</strong> {user.photoURL || 'null/undefined'}</p>
                <p><strong>Proveedor:</strong> {user.providerData?.[0]?.providerId || 'unknown'}</p>
              </div>
            </details>

            <button onClick={handleSignOut}>Cerrar Sesión</button>

            <div style={{ marginTop: '20px' }}>
              <h3>Escribir nuevo mensaje</h3>

              {/* Campo de texto */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.substring(0, maxChars))}
                placeholder="Escribe tu mensaje aquí..."
                rows="4"
                cols="50"
                maxLength={maxChars}
                style={{ width: '100%', maxWidth: '500px', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
              />
              <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                Caracteres restantes: {maxChars - message.length}
              </p>

              {/* Selector de imagen */}
              <div style={{ margin: '15px 0' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  Agregar imagen (opcional):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ marginBottom: '10px' }}
                />

                {/* Preview de la imagen */}
                {imagePreview && (
                  <div style={{
                    margin: '10px 0',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Vista previa:</p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        maxWidth: '300px',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        border: '1px solid #ccc',
                        borderRadius: '5px'
                      }}
                    />
                    <br />
                    <button
                      onClick={clearImage}
                      style={{
                        marginTop: '10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '3px',
                        fontSize: '12px'
                      }}
                    >
                      Quitar imagen
                    </button>
                  </div>
                )}
              </div>

              {/* Botones de guardar */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={saveMessage}
                  disabled={uploading || (message.trim() === '' && !selectedImage)}
                  style={{
                    backgroundColor: uploading ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '5px',
                    fontSize: '14px',
                    cursor: uploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {uploading ? 'Guardando...' : selectedImage ? 'Guardar con Imagen' : 'Guardar'}
                </button>

                {/* Botón alternativo para solo texto */}
                {selectedImage && message.trim() !== '' && (
                  <button
                    onClick={async () => {
                      setUploading(true);
                      try {
                        const userData = {
                          text: message,
                          imageUrl: null,
                          timestamp: new Date(),
                          userId: user.uid,
                          userName: user.displayName || user.email?.split('@')[0] || 'Usuario sin nombre',
                          userEmail: user.email || 'Email no disponible',
                          userPhoto: user.photoURL || null
                        };

                        await addDoc(collection(db, "mensajes"), userData);
                        alert("Mensaje de texto guardado (sin imagen)!");
                        setMessage('');
                        clearImage();
                      } catch (error) {
                        alert("Error al guardar mensaje de texto: " + error.message);
                      } finally {
                        setUploading(false);
                      }
                    }}
                    disabled={uploading}
                    style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 15px',
                      borderRadius: '5px',
                      fontSize: '12px',
                      cursor: uploading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Solo Texto
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginTop: '30px' }}>
              <h3>Chat Familiar - Todos los mensajes ({messages.length})</h3>
              {loading ? (
                <p>Cargando mensajes...</p>
              ) : messages.length === 0 ? (
                <div>
                  <p>No se encontraron mensajes.</p>
                  <p>Revisa la consola del navegador (F12) para ver los logs de Firebase.</p>
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                  {messages.map((msg) => {
                    const isMyMessage = msg.userId === user.uid;
                    return (
                      <div key={msg.id} style={{
                        border: isMyMessage ? '2px solid #007bff' : '1px solid #eee',
                        margin: '10px 0',
                        padding: '15px',
                        borderRadius: '8px',
                        backgroundColor: isMyMessage ? '#e3f2fd' : '#f9f9f9',
                        boxShadow: isMyMessage ? '0 2px 8px rgba(0,123,255,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
                        position: 'relative'
                      }}>
                        {/* Header con autor */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px',
                          paddingBottom: '8px',
                          borderBottom: '1px solid #ddd'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Foto de perfil del autor */}
                            {msg.userPhoto ? (
                              <img
                                src={msg.userPhoto}
                                alt="Foto del autor"
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  border: isMyMessage ? '2px solid #007bff' : '1px solid #ccc',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                backgroundColor: isMyMessage ? '#007bff' : '#6c757d',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                {(msg.userName || msg.userEmail || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}

                            {/* Información del autor */}
                            <div>
                              <strong style={{ color: isMyMessage ? '#007bff' : '#333', fontSize: '14px' }}>
                                {isMyMessage ? 'Tú' : ''} {
                                  msg.userName ||
                                  (msg.userEmail ? msg.userEmail.split('@')[0] : 'Usuario desconocido')
                                }
                                {isMyMessage && <span style={{ color: '#007bff', fontSize: '12px' }}> (Tu mensaje)</span>}
                              </strong>
                              <br />
                              <small style={{ color: '#888', fontSize: '12px' }}>
                                {msg.userEmail || 'Email no disponible'}
                                {(!msg.userName || !msg.userEmail) &&
                                  <span style={{ color: '#dc3545', marginLeft: '5px' }}>
                                    (Datos incompletos)
                                  </span>
                                }
                              </small>
                            </div>
                          </div>
                          <small style={{ color: '#666', fontSize: '12px' }}>
                            {msg.timestamp?.toDate?.() ?
                              msg.timestamp.toDate().toLocaleString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) :
                              'Fecha no disponible'
                            }
                          </small>
                        </div>

                        {/* Contenido del mensaje */}
                        {msg.text && (
                          <p style={{
                            margin: '0 0 10px 0',
                            lineHeight: '1.4',
                            fontSize: '14px',
                            color: '#333'
                          }}>
                            {msg.text}
                          </p>
                        )}

                        {/* Imagen si existe */}
                        {msg.imageUrl && (
                          <div style={{ margin: '10px 0' }}>
                            <img
                              src={msg.imageUrl}
                              alt="Imagen del mensaje"
                              style={{
                                maxWidth: '75px',
                                maxHeight: '75px',
                                objectFit: 'contain',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                cursor: 'pointer'
                              }}
                              onClick={() => window.open(msg.imageUrl, '_blank')}
                            />
                            <p style={{
                              margin: '5px 0 0 0',
                              fontSize: '11px',
                              color: '#888',
                              fontStyle: 'italic'
                            }}>
                              Haz clic para ver en tamaño completo
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
