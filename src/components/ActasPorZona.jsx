// src/components/ActasPorZona.jsx
import React, { useState } from 'react';
import { Card, Row, Col, Table, Button, Badge, Alert, Modal } from 'react-bootstrap';
import { useActasPorZona } from '../hooks/useActasPorZona';
import { useEstadisticasPorZona } from '../hooks/useEstadisticasPorZona';
import LoadingSpinner from './LoadingSpinner';

const ActasPorZona = ({ zonaCodigo, zonaNombre, parroquiaIdSvg, parroquiaId, onActaSeleccionada }) => {
    // Hook optimizado para estadísticas (usa datos precalculados)
    const { estadisticasZona: estadisticasOptimizadas, loading: loadingOptimizadas, error: errorOptimizadas } = useEstadisticasPorZona(zonaCodigo, parroquiaId);

    // Hook para actas individuales (sigue consultando votos para mostrar lista detallada)
    const { actas, estadisticasZona: estadisticasDirectas, candidatos, loading: loadingActas, error: errorActas } = useActasPorZona(zonaCodigo, parroquiaIdSvg);

    const [showEstadisticas, setShowEstadisticas] = useState(true);
    const [modoOptimizado, setModoOptimizado] = useState(true);

    // Usar estadísticas optimizadas por defecto, fallback a directas
    const estadisticasZona = modoOptimizado && estadisticasOptimizadas && !errorOptimizadas ?
        estadisticasOptimizadas : estadisticasDirectas;

    const loading = modoOptimizado ? loadingOptimizadas : loadingActas;
    const error = modoOptimizado && errorOptimizadas ? errorOptimizadas : errorActas;

    // Si no hay zona seleccionada
    if (!zonaCodigo || zonaCodigo === 'all') {
        return (
            <Card className="shadow-sm">
                <Card.Body className="text-center py-4">
                    <div className="text-muted">
                        <h5>🎯 Selecciona una Zona Específica</h5>
                        <p>Elige una zona del selector para ver sus actas y estadísticas</p>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    if (loading) {
        return <LoadingSpinner message={`Cargando actas de ${zonaNombre || `Zona ${zonaCodigo}`}...`} />;
    }

    if (error) {
        return (
            <Alert variant="danger">
                <Alert.Heading>❌ Error</Alert.Heading>
                <p>{error}</p>
            </Alert>
        );
    }

    return (
        <div>
            {/* Header con información de la zona */}
            <Card className="shadow-sm mb-3">
                <Card.Header className="bg-success text-white">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="mb-0">📍 {zonaNombre || `Zona ${zonaCodigo}`}</h5>
                            <small>Código: {zonaCodigo} • {actas.length} acta{actas.length !== 1 ? 's' : ''}</small>
                        </div>
                        <div className="d-flex gap-2">
                            <Badge bg={modoOptimizado && estadisticasOptimizadas ? 'info' : 'secondary'} className="small">
                                {modoOptimizado && estadisticasOptimizadas ? '⚡ Optimizado' : '🔄 Directo'}
                            </Badge>
                            <Button
                                variant="outline-light"
                                size="sm"
                                onClick={() => setShowEstadisticas(!showEstadisticas)}
                            >
                                {showEstadisticas ? '📊 Ocultar Stats' : '📊 Ver Stats'}
                            </Button>
                        </div>
                    </div>
                </Card.Header>

                {/* Estadísticas de la zona (colapsible) */}
                {showEstadisticas && estadisticasZona && (
                    <Card.Body className="p-3">
                        <Row className="g-2 mb-3">
                            <Col xs={3} className="text-center">
                                <div className="fw-bold text-primary">{estadisticasZona.totalVotos.toLocaleString()}</div>
                                <small className="text-muted">Total Votos</small>
                            </Col>
                            <Col xs={3} className="text-center">
                                <div className="fw-bold text-warning">{estadisticasZona.totalSufragantes.toLocaleString()}</div>
                                <small className="text-muted">Sufragantes</small>
                            </Col>
                            <Col xs={3} className="text-center">
                                <div className="fw-bold text-success">{estadisticasZona.actasRevisadas}</div>
                                <small className="text-muted">Revisadas</small>
                            </Col>
                            <Col xs={3} className="text-center">
                                <div className="fw-bold text-danger">{estadisticasZona.actasNoRevisadas}</div>
                                <small className="text-muted">Pendientes</small>
                            </Col>
                        </Row>

                        {/* Candidatos de la zona */}
                        {candidatos.length > 0 && (
                            <Row className="g-2">
                                {candidatos.slice(0, 3).map((candidato, index) => (
                                    <Col key={candidato.id} xs={4} className="text-center">
                                        <div className="p-2 border rounded bg-light">
                                            <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                                                {candidato.nombre}
                                            </div>
                                            <div className="text-primary fw-bold">
                                                {candidato.totalVotos.toLocaleString()}
                                            </div>
                                            <small className="text-muted">
                                                {estadisticasZona.totalVotos > 0 ?
                                                    Math.round((candidato.totalVotos / estadisticasZona.totalVotos) * 100) : 0}%
                                            </small>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </Card.Body>
                )}
            </Card>

            {/* Lista de actas */}
            {actas.length > 0 ? (
                <Card className="shadow-sm">
                    <Card.Header className="bg-light">
                        <h6 className="mb-0">📋 Actas de la Zona</h6>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Table responsive className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Junta</th>
                                    <th>Estado</th>
                                    <th>Votos</th>
                                    <th>Sufragantes</th>
                                    <th>Fecha</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {actas.map((acta) => (
                                    <tr key={acta.id}>
                                        <td>
                                            <Badge
                                                bg={acta.genero === 'F' ? 'danger' : 'primary'}
                                                className="fs-6 px-2 py-1"
                                            >
                                                {acta.juntaGenero}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Badge bg={acta.revisado ? 'success' : 'warning'}>
                                                {acta.revisado ? '✅ Revisado' : '⏳ Pendiente'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <span className="fw-bold text-primary">
                                                {acta.totalVotos.toLocaleString()}
                                            </span>
                                        </td>
                                        <td>{(acta.totalSufragantes || 0).toLocaleString()}</td>
                                        <td>
                                            <small className="text-muted">
                                                {acta.timestamp ? new Date(acta.timestamp.toDate()).toLocaleString('es-ES', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : 'Sin fecha'}
                                            </small>
                                        </td>
                                        <td>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => onActaSeleccionada && onActaSeleccionada(acta)}
                                            >
                                                👁️ Ver
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            ) : (
                <Card className="shadow-sm">
                    <Card.Body className="text-center py-4">
                        <div className="text-muted">
                            <h6>📄 No hay actas registradas</h6>
                            <p>Esta zona aún no tiene actas registradas</p>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default ActasPorZona;