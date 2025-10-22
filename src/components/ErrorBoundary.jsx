// src/components/ErrorBoundary.jsx
import React from 'react';
import { Alert, Button, Container } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to console and state
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <Container className="py-5">
                    <Alert variant="danger">
                        <Alert.Heading>¡Oops! Algo salió mal</Alert.Heading>
                        <p>
                            Ha ocurrido un error inesperado en la aplicación. Por favor, intenta recargar la página.
                        </p>
                        <hr />
                        <div className="d-flex justify-content-end">
                            <Button
                                variant="outline-danger"
                                onClick={() => window.location.reload()}
                            >
                                Recargar página
                            </Button>
                        </div>
                    </Alert>

                    {process.env.NODE_ENV === 'development' && (
                        <Alert variant="warning" className="mt-3">
                            <Alert.Heading>Información de desarrollo</Alert.Heading>
                            <details>
                                <summary>Ver detalles del error</summary>
                                <pre className="mt-2">
                                    {this.state.error && this.state.error.toString()}
                                    <br />
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        </Alert>
                    )}
                </Container>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;