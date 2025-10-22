// src/App.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase-config'; // Importa auth y db
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { collection, addDoc, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import './App.css'; // Si quieres añadir estilos

function App() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
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
        // Cargar los mensajes del usuario actual
        setLoading(true);

        const q = query(
          collection(db, "mensajes"),
          where("userId", "==", currentUser.uid),
          limit(50) // Mostrar solo los 50 mensajes más recientes
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

  // Función para iniciar sesión con Google
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
    if (user && message.trim() !== '') {
      try {
        await addDoc(collection(db, "mensajes"), {
          text: message,
          timestamp: new Date(),
          userId: user.uid,
          userName: user.displayName,
          userEmail: user.email
        });
        alert("Mensaje guardado con éxito!");
        setMessage('');
      } catch (error) {
        console.error("Error al guardar el mensaje: ", error);
        alert("Hubo un error al guardar el mensaje.");
      }
    } else {
      alert("No hay un usuario autenticado o el mensaje está vacío.");
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
                🧹 Limpiar Datos del Navegador
              </button>
            </div>
          </div>
        ) : (
          // Vista principal una vez logeado
          <div>
            <p>Bienvenido, <strong>{user.displayName}</strong> ({user.email})</p>
            <button onClick={handleSignOut}>Cerrar Sesión</button>

            <div style={{ marginTop: '20px' }}>
              <h3>Escribir nuevo mensaje</h3>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.substring(0, maxChars))}
                placeholder="Escribe tu mensaje aquí..."
                rows="5"
                cols="50"
                maxLength={maxChars}
              />
              <p>Caracteres restantes: {maxChars - message.length}</p>
              <button onClick={saveMessage} disabled={message.trim() === ''}>Guardar</button>
            </div>

            <div style={{ marginTop: '30px' }}>
              <h3>💬 Tus mensajes guardados ({messages.length})</h3>
              {loading ? (
                <p>⏳ Cargando mensajes...</p>
              ) : messages.length === 0 ? (
                <div>
                  <p>❌ No se encontraron mensajes.</p>
                  <p>🔍 Revisa la consola del navegador (F12) para ver los logs de Firebase.</p>
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                  {messages.map((msg) => (
                    <div key={msg.id} style={{
                      border: '1px solid #eee',
                      margin: '10px 0',
                      padding: '15px',
                      borderRadius: '8px',
                      backgroundColor: '#f9f9f9',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
                        <div>
                          <strong style={{ color: '#333', fontSize: '14px' }}>
                            👤 {msg.userName || 'Usuario desconocido'}
                          </strong>
                          <br />
                          <small style={{ color: '#888', fontSize: '12px' }}>
                            {msg.userEmail || 'Email no disponible'}
                          </small>
                        </div>
                        <small style={{ color: '#666', fontSize: '12px' }}>
                          🕒 {msg.timestamp?.toDate?.() ?
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
                      <p style={{
                        margin: '0',
                        lineHeight: '1.4',
                        fontSize: '14px',
                        color: '#333'
                      }}>
                        {msg.text}
                      </p>
                    </div>
                  ))}
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
