import React from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Table, Modal } from 'react-bootstrap';
import { useDashboard } from '../hooks/useDashboard';
import LoadingSpinner from './LoadingSpinner';

const Dashboard = ({ user }) => {
    const {
        votos,
        loading,
        candidatos,
        selectedVoto,
        showImageModal,
        selectedImageIndex,
        setSelectedImageIndex,
        showVotosModal,
        selectedVotoDetalle,
        calcularTotalVotos,
        getEstadisticasPorCandidato,
        abrirModalImagenes,
        abrirModalVotos,
        cerrarModal,
        cerrarModalVotos,
        siguienteImagen,
        imagenAnterior,
        abrirImagenEnNuevaVentana
    } = useDashboard(user);

    const estadisticas = getEstadisticasPorCandidato();
    const totalVotosGeneral = estadisticas.reduce((sum, candidato) => sum + candidato.totalVotos, 0);

    // Formatear fecha y hora
    const formatearFecha = (timestamp) => {
        if (!timestamp) return 'Sin fecha';
        const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return fecha.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <LoadingSpinner message="Cargando resultados electorales..." />;
    }

    return (
        <Container className="py-4">
            {/* Header */}
            <Row className="mb-4">
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-success text-white">
                            <h3 className="mb-0">📊 Dashboard Electoral - Resultados</h3>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    <Alert variant="info" className="mb-0">
                                        <strong>Total de votos:</strong> {totalVotosGeneral} votos
                                    </Alert>
                                </Col>
                                <Col md={6}>
                                    <Alert variant="success" className="mb-0">
                                        <strong>Actas registradas:</strong> {votos.length} actas
                                    </Alert>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Estadísticas por Candidato */}
            <Row className="mb-4">
                {estadisticas.map((candidato) => {
                    const porcentaje = totalVotosGeneral > 0 ?
                        Math.round((candidato.totalVotos / totalVotosGeneral) * 100) : 0;

                    return (
                        <Col md={4} key={candidato.id} className="mb-3">
                            <Card className="h-100 shadow-sm">
                                <Card.Header className="bg-primary text-white text-center">
                                    <h5 className="mb-0">{candidato.nombre}</h5>
                                </Card.Header>
                                <Card.Body className="text-center">
                                    <div className="mb-3">
                                        <h2 className="text-primary">{candidato.totalVotos}</h2>
                                        <small className="text-muted">votos totales</small>
                                    </div>
                                    <Badge variant="secondary" className="fs-6">
                                        {porcentaje}% del total
                                    </Badge>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {/* Lista de Últimos 10 Votos */}
            <Row>
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-info text-white">
                            <h4 className="mb-0">📋 Últimos 10 Votos Registrados</h4>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {votos.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-muted">No hay votos registrados aún.</p>
                                </div>
                            ) : (
                                <Table responsive striped hover className="mb-0">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Fecha y Hora</th>
                                            <th>Mesa</th>
                                            <th style={{ cursor: 'pointer' }}>Total Votos</th>
                                            <th style={{ cursor: 'pointer' }}>Fotos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {votos.map((voto) => {
                                            const totalVotos = calcularTotalVotos(voto);
                                            return (
                                                <tr key={voto.id}>
                                                    <td>{formatearFecha(voto.timestamp)}</td>
                                                    <td>
                                                        <Badge variant="info">
                                                            Mesa {voto.numeroMesa}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <Button
                                                            variant="link"
                                                            className="p-0 fw-bold text-primary"
                                                            onClick={() => abrirModalVotos(voto)}
                                                            style={{
                                                                textDecoration: 'none',
                                                                fontSize: '16px'
                                                            }}
                                                        >
                                                            {totalVotos} votos
                                                        </Button>
                                                    </td>
                                                    <td
                                                        style={{ cursor: voto.imageUrls && voto.imageUrls.length > 0 ? 'pointer' : 'default' }}
                                                        onClick={() => voto.imageUrls && voto.imageUrls.length > 0 && abrirModalImagenes(voto)}
                                                    >
                                                        {voto.imageUrls && voto.imageUrls.length > 0 ? (
                                                            <Badge variant="success" className="user-select-none">
                                                                {voto.imageUrls.length} foto{voto.imageUrls.length > 1 ? 's' : ''}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="user-select-none">Sin fotos</Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Modal de Detalle de Votos por Candidato */}
            <Modal
                show={showVotosModal}
                onHide={cerrarModalVotos}
                size="md"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        📊 Detalle de Votos - Mesa {selectedVotoDetalle?.numeroMesa}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedVotoDetalle && selectedVotoDetalle.votos && (
                        <div>
                            <div className="mb-3">
                                <small className="text-muted">
                                    Registrado el: {formatearFecha(selectedVotoDetalle.timestamp)}
                                </small>
                            </div>
                            <Table striped bordered responsive>
                                <thead className="table-primary">
                                    <tr>
                                        <th>Candidato</th>
                                        <th className="text-center">Votos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedVotoDetalle.votos.map((candidatoVoto, index) => (
                                        <tr key={index}>
                                            <td>
                                                <strong>{candidatoVoto.candidatoNombre || 'Candidato no encontrado'}</strong>
                                            </td>
                                            <td className="text-center">
                                                <Badge variant="primary" className="fs-6 px-3 py-2">
                                                    {candidatoVoto.numeroVotos}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="table-success">
                                    <tr>
                                        <th>Total de Votos</th>
                                        <th className="text-center">
                                            <Badge variant="success" className="fs-6 px-3 py-2">
                                                {calcularTotalVotos(selectedVotoDetalle)}
                                            </Badge>
                                        </th>
                                    </tr>
                                </tfoot>
                            </Table>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={cerrarModalVotos}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Imágenes */}
            <Modal
                show={showImageModal}
                onHide={cerrarModal}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        📸 Fotos - Mesa {selectedVoto?.numeroMesa}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedVoto && selectedVoto.imageUrls && selectedVoto.imageUrls.length > 0 && (
                        <div className="text-center">
                            {/* Contador de imágenes */}
                            <div className="mb-3">
                                <Badge variant="info">
                                    Imagen {selectedImageIndex + 1} de {selectedVoto.imageUrls.length}
                                </Badge>
                            </div>

                            {/* Imagen actual */}
                            <div className="mb-3">
                                <img
                                    src={selectedVoto.imageUrls[selectedImageIndex]}
                                    alt={`Foto ${selectedImageIndex + 1}`}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '400px',
                                        objectFit: 'contain',
                                        cursor: 'pointer',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '5px'
                                    }}
                                    onClick={() => abrirImagenEnNuevaVentana(selectedVoto.imageUrls[selectedImageIndex])}
                                />
                            </div>

                            {/* Navegación entre imágenes */}
                            {selectedVoto.imageUrls.length > 1 && (
                                <div className="mb-3">
                                    <Button
                                        variant="outline-secondary"
                                        className="me-2"
                                        onClick={imagenAnterior}
                                    >
                                        ← Anterior
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        onClick={siguienteImagen}
                                    >
                                        Siguiente →
                                    </Button>
                                </div>
                            )}

                            {/* Miniaturas numeradas */}
                            <div className="d-flex justify-content-center flex-wrap gap-2">
                                {selectedVoto.imageUrls.map((_, index) => (
                                    <Button
                                        key={index}
                                        variant={index === selectedImageIndex ? "primary" : "outline-primary"}
                                        size="sm"
                                        onClick={() => setSelectedImageIndex(index)}
                                        style={{ minWidth: '40px' }}
                                    >
                                        {index + 1}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success" onClick={() => abrirImagenEnNuevaVentana(selectedVoto?.imageUrls[selectedImageIndex])}>
                        Abrir en Nueva Ventana
                    </Button>
                    <Button variant="secondary" onClick={cerrarModal}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Dashboard;