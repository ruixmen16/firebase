// src/components/LoginForm.jsx
import React from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';

const LoginForm = ({ signInWithGoogle, clearBrowserData }) => {
    return (
        <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <Row className="w-100 justify-content-center">
                <Col xs={12} sm={8} md={6} lg={4}>
                    <Card className="shadow-lg border-0">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <h2 className="fw-bold text-primary mb-3">Bienvenido</h2>
                                <p className="text-muted">Por favor, inicia sesión para continuar.</p>
                            </div>

                            <Button
                                variant="primary"
                                size="lg"
                                className="w-100 mb-3"
                                onClick={signInWithGoogle}
                            >
                                <i className="bi bi-google me-2"></i>
                                Iniciar Sesión con Google
                            </Button>

                            <Alert variant="warning" className="mt-4">
                                <Alert.Heading className="h6">¿Problemas para iniciar sesión?</Alert.Heading>
                                <p className="small mb-3">
                                    Si ves errores sobre "almacenamiento" o "initial state", prueba:
                                </p>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={clearBrowserData}
                                >
                                    Limpiar Datos del Navegador
                                </Button>
                            </Alert>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default LoginForm;