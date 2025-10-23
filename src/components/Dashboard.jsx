import React from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Table, Modal } from 'react-bootstrap';
import { useDashboard } from '../hooks/useDashboard';
import LoadingSpinner from './LoadingSpinner';
import PortoviejoMap from './PortoviejoMap';

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

            {/* Layout Principal: Mapa + Estadísticas */}
            <Row className="mb-4">
                {/* Mapa Interactivo de Portoviejo - 70% del ancho */}
                <Col lg={8} className="mb-4">
                    <PortoviejoMap />
                </Col>

                {/* Estadísticas por Candidato - 30% del ancho */}
                <Col lg={4}>
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-primary text-white text-center">
                            <h5 className="mb-0">🏛️ Candidatos a Alcalde</h5>
                        </Card.Header>
                        <Card.Body className="p-3" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {estadisticas
                                .filter(candidato => candidato.totalVotos > 0) // Mostrar solo candidatos con votos
                                .sort((a, b) => b.totalVotos - a.totalVotos) // Ordenar de mayor a menor por votos
                                .map((candidato, index) => {
                                    const porcentaje = totalVotosGeneral > 0 ?
                                        Math.round((candidato.totalVotos / totalVotosGeneral) * 100) : 0;

                                    // Colores para las barras de progreso - el primer lugar tendrá color dorado/success
                                    const colores = ['success', 'primary', 'info', 'warning', 'danger', 'secondary', 'dark', 'primary'];
                                    const color = colores[index % colores.length];

                                    // Indicadores de posición
                                    const posicionIcon = index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}°`;
                                    const esLider = index === 0;

                                    return (
                                        <div key={candidato.id} className={`mb-3 p-2 border rounded ${esLider ? 'bg-warning bg-opacity-25 border-warning' : 'bg-light'}`}>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="d-flex align-items-center">
                                                    <span className="me-2" style={{ fontSize: '16px' }}>{posicionIcon}</span>
                                                    <h6 className={`mb-0 ${esLider ? 'text-warning-emphasis fw-bold' : 'text-dark fw-bold'}`}>
                                                        {candidato.nombre}
                                                    </h6>
                                                </div>
                                                <div className="text-end">
                                                    <Badge bg={color} className="me-1">{candidato.totalVotos}</Badge>
                                                    <Badge bg="outline-secondary" text="dark">{porcentaje}%</Badge>
                                                </div>
                                            </div>
                                            <div className="progress" style={{ height: '8px' }}>
                                                <div
                                                    className={`progress-bar bg-${color}`}
                                                    role="progressbar"
                                                    style={{ width: `${porcentaje}%` }}
                                                    aria-valuenow={porcentaje}
                                                    aria-valuemin="0"
                                                    aria-valuemax="100"
                                                ></div>
                                            </div>
                                            <small className="text-muted">
                                                {candidato.totalActas} acta{candidato.totalActas !== 1 ? 's' : ''} registrada{candidato.totalActas !== 1 ? 's' : ''}
                                            </small>
                                        </div>
                                    );
                                })}

                            {/* Mensaje cuando no hay candidatos con votos */}
                            {estadisticas.filter(candidato => candidato.totalVotos > 0).length === 0 && (
                                <div className="text-center py-4">
                                    <div className="text-muted">
                                        <h6>📊 Sin resultados aún</h6>
                                        <p className="mb-0">Los candidatos aparecerán aquí cuando reciban votos</p>
                                    </div>
                                </div>
                            )}

                            {/* Resumen total */}
                            <div className="mt-3 pt-3 border-top">
                                <div className="d-flex justify-content-between align-items-center">
                                    <strong className="text-dark">Total General:</strong>
                                    <div>
                                        <Badge bg="success" className="me-1">{totalVotosGeneral}</Badge>
                                        <Badge bg="info">{votos.length} actas</Badge>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
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