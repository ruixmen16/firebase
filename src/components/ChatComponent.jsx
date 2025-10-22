// src/components/ChatComponent.jsx
import React from 'react';
import { Container, Form, Button, Card, Image, Badge, Spinner } from 'react-bootstrap';
import { useChat } from '../hooks/useChat';
import LoadingSpinner from './LoadingSpinner';

const ChatComponent = ({ user }) => {
    const {
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
    } = useChat(user);
    return (
        <Container className="py-4">
            <div className="row">
                <div className="col">
                    {/* Message Input Section */}
                    <Card className="mb-4 shadow-sm">
                        <Card.Header className="bg-primary text-white">
                            <h5 className="mb-0">Escribir nuevo mensaje</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value.substring(0, maxChars))}
                                        placeholder="Escribe tu mensaje aquí..."
                                        maxLength={maxChars}
                                    />
                                    <Form.Text className="text-muted">
                                        Caracteres restantes: {maxChars - message.length}
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Agregar imagen (opcional):</Form.Label>
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                    />
                                </Form.Group>

                                {/* Image Preview */}
                                {imagePreview && (
                                    <Card className="mb-3 bg-light">
                                        <Card.Body>
                                            <Card.Title className="h6">Vista previa:</Card.Title>
                                            <Image
                                                src={imagePreview}
                                                alt="Preview"
                                                thumbnail
                                                style={{ maxWidth: '300px', maxHeight: '200px' }}
                                            />
                                            <div className="mt-2">
                                                <Button variant="danger" size="sm" onClick={clearImage}>
                                                    Quitar imagen
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                )}

                                {/* Action Buttons */}
                                <div className="d-flex gap-2 flex-wrap">
                                    <Button
                                        variant="success"
                                        onClick={saveMessage}
                                        disabled={uploading || (message.trim() === '' && !selectedImage)}
                                    >
                                        {uploading ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Guardando...
                                            </>
                                        ) : selectedImage ? (
                                            'Guardar con Imagen'
                                        ) : (
                                            'Guardar'
                                        )}
                                    </Button>

                                    {selectedImage && message.trim() !== '' && (
                                        <Button
                                            variant="secondary"
                                            onClick={async () => {
                                                // Logic for saving text only
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
                                                }
                                            }}
                                            disabled={uploading}
                                        >
                                            Solo Texto
                                        </Button>
                                    )}
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>

                    {/* Messages Section */}
                    <Card className="shadow-sm">
                        <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Chat Familiar</h5>
                            <Badge bg="light" text="dark">{messages.length} mensajes</Badge>
                        </Card.Header>
                        <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {loading ? (
                                <LoadingSpinner message="Cargando mensajes..." />
                            ) : messages.length === 0 ? (
                                <div className="text-center text-muted py-4">
                                    <p>No se encontraron mensajes.</p>
                                    <small>Revisa la consola del navegador (F12) para ver los logs de Firebase.</small>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {messages.map((msg) => {
                                        const isMyMessage = msg.userId === user.uid;
                                        return (
                                            <Card
                                                key={msg.id}
                                                className={`${isMyMessage ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
                                            >
                                                <Card.Body className="p-3">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <div className="d-flex align-items-center gap-2">
                                                            {msg.userPhoto ? (
                                                                <Image
                                                                    src={msg.userPhoto}
                                                                    alt="Foto del autor"
                                                                    roundedCircle
                                                                    width="30"
                                                                    height="30"
                                                                    className={`border ${isMyMessage ? 'border-primary border-2' : 'border-secondary'}`}
                                                                />
                                                            ) : (
                                                                <div
                                                                    className={`rounded-circle text-white d-flex align-items-center justify-content-center ${isMyMessage ? 'bg-primary' : 'bg-secondary'}`}
                                                                    style={{ width: '30px', height: '30px', fontSize: '12px', fontWeight: 'bold' }}
                                                                >
                                                                    {(msg.userName || msg.userEmail || 'U').charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className={`fw-bold ${isMyMessage ? 'text-primary' : 'text-dark'}`}>
                                                                    {isMyMessage ? 'Tú ' : ''}
                                                                    {msg.userName || (msg.userEmail ? msg.userEmail.split('@')[0] : 'Usuario desconocido')}
                                                                    {isMyMessage && <small className="text-primary"> (Tu mensaje)</small>}
                                                                </div>
                                                                <small className="text-muted">
                                                                    {msg.userEmail || 'Email no disponible'}
                                                                    {(!msg.userName || !msg.userEmail) && (
                                                                        <span className="text-danger ms-1">(Datos incompletos)</span>
                                                                    )}
                                                                </small>
                                                            </div>
                                                        </div>
                                                        <small className="text-muted">
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

                                                    {msg.text && (
                                                        <p className="mb-2 text-dark">{msg.text}</p>
                                                    )}

                                                    {msg.imageUrl && (
                                                        <div className="mt-2">
                                                            <Image
                                                                src={msg.imageUrl}
                                                                alt="Imagen del mensaje"
                                                                thumbnail
                                                                style={{ maxWidth: '100px', maxHeight: '100px', cursor: 'pointer' }}
                                                                onClick={() => window.open(msg.imageUrl, '_blank')}
                                                            />
                                                            <div>
                                                                <small className="text-muted fst-italic">
                                                                    Haz clic para ver en tamaño completo
                                                                </small>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </Container>
    );
}; export default ChatComponent;