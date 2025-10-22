// src/components/LoadingSpinner.jsx
import React from 'react';
import { Spinner, Container } from 'react-bootstrap';

const LoadingSpinner = React.memo(({ message = "Cargando..." }) => {
    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
            <div className="text-center">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <div className="text-muted">{message}</div>
            </div>
        </Container>
    );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;