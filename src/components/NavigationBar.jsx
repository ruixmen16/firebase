// src/components/NavigationBar.jsx
import React from 'react';
import { Navbar, Container, Button, Image } from 'react-bootstrap';

const NavigationBar = ({ user, handleSignOut }) => {
    return (
        <Navbar bg="white" variant="light" className="shadow-sm">
            <Container fluid>
                {/* User Info Section */}
                <Navbar.Brand className="d-flex align-items-center">
                    {user.photoURL ? (
                        <Image
                            src={user.photoURL}
                            alt="Foto de perfil"
                            roundedCircle
                            width="40"
                            height="40"
                            className="border border-primary border-2 me-3"
                        />
                    ) : (
                        <div
                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                            style={{ width: '40px', height: '40px', fontSize: '16px', fontWeight: 'bold' }}
                        >
                            {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <div className="fw-bold text-dark mb-0">
                            {user.displayName || 'Sin nombre'}
                        </div>
                        <small className="text-muted">
                            {user.email || 'Sin email'}
                        </small>
                    </div>
                </Navbar.Brand>

                {/* Sign Out Button */}
                <Button variant="danger" onClick={handleSignOut}>
                    Cerrar Sesión
                </Button>
            </Container>
        </Navbar>
    );
};

export default NavigationBar;