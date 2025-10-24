// src/components/ActasPorZona.jsx
import React, { useState } from 'react';
import { Card, Row, Col, Table, Button, Alert } from 'react-bootstrap';
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

    // Cálculos de armonización de métricas (porcentajes) - usar optimizadas con fallback a directas
    const actasRevisadasOpt = estadisticasZona?.actasRevisadas || 0;
    const actasNoRevisadasOpt = estadisticasZona?.actasNoRevisadas || 0;
    const actasRevisadasDirectas = actas.filter(acta => acta.revisado).length;
    const actasNoRevisadasDirectas = actas.filter(acta => !acta.revisado).length;

    // Usar optimizadas si están disponibles y son coherentes, sino usar directas
    const actasRevisadas = modoOptimizado && (actasRevisadasOpt + actasNoRevisadasOpt) === actas.length ?
        actasRevisadasOpt : actasRevisadasDirectas;
    const actasNoRevisadas = modoOptimizado && (actasRevisadasOpt + actasNoRevisadasOpt) === actas.length ?
        actasNoRevisadasOpt : actasNoRevisadasDirectas;

    const totalActasZona = actas.length;
    const pctValidadasZona = totalActasZona > 0 ? Math.round((actasRevisadas / totalActasZona) * 100) : 0;
    const pctNoValidadasZona = totalActasZona > 0 ? Math.round((actasNoRevisadas / totalActasZona) * 100) : 0;

    // Si no hay zona seleccionada
    if (!zonaCodigo || zonaCodigo === 'all') {
        return (
            <Card className="shadow-sm">
                <Card.Body className="text-center py-4">
                    <div className="text-muted">
                        <h5>Selecciona una zona específica</h5>
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
                <Alert.Heading>Error</Alert.Heading>
                <p>{error}</p>
            </Alert>
        );
    }

    return (
        <div>
            {/* Header con información de la zona */}
            <Card className="shadow-sm mb-3">
                <Card.Header className="bg-light text-dark">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="mb-0">{zonaNombre || `Zona ${zonaCodigo}`}</h5>
                            <small>{actas.length} acta{actas.length !== 1 ? 's' : ''}</small>
                        </div>
                        <div className="d-flex gap-2">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setShowEstadisticas(!showEstadisticas)}
                            >
                                {showEstadisticas ? 'Ocultar estadísticas' : 'Ver estadísticas'}
                            </Button>
                        </div>
                    </div>
                </Card.Header>

                {/* Estadísticas de la zona (colapsible) */}
                {showEstadisticas && estadisticasZona && (
                    <Card.Body className="p-3">
                        <Row className="g-2 mb-3">
                            <Col xs={3} className="text-center">
                                <div className="fw-bold text-primary">
                                    {(() => {
                                        // Usar estadísticas optimizadas si están disponibles, fallback a suma directa
                                        const totalOptimizado = estadisticasZona?.totalVotos || 0;
                                        const totalDirecto = actas.reduce((sum, acta) => sum + (acta?.totalVotos || 0), 0);
                                        const total = modoOptimizado && totalOptimizado > 0 ? totalOptimizado : totalDirecto;
                                        return total.toLocaleString();
                                    })()}
                                </div>
                                <small className="text-muted">Total Votos</small>
                            </Col>
                            <Col xs={3} className="text-center">
                                <div className="fw-bold text-warning">
                                    {(() => {
                                        // Usar estadísticas optimizadas si están disponibles, fallback a suma directa
                                        const sufragantesOptimizado = estadisticasZona?.totalSufragantes || 0;
                                        const sufragantesDirecto = actas.reduce((sum, acta) => sum + (acta?.totalSufragantes || 0), 0);
                                        const sufragantes = modoOptimizado && sufragantesOptimizado > 0 ? sufragantesOptimizado : sufragantesDirecto;
                                        return sufragantes.toLocaleString();
                                    })()}
                                </div>
                                <small className="text-muted">Sufragantes</small>
                            </Col>
                            <Col xs={3} className="text-center">
                                <div className="fw-bold text-success">{actasRevisadas}</div>
                                <small className="text-muted">Validadas ({pctValidadasZona}%)</small>
                            </Col>
                            <Col xs={3} className="text-center">
                                <div className="fw-bold text-danger">{actasNoRevisadas}</div>
                                <small className="text-muted">Sin validar ({pctNoValidadasZona}%)</small>
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
                                                {(candidato?.totalVotos || 0).toLocaleString()}
                                            </div>
                                            <small className="text-muted">
                                                {(estadisticasZona?.totalVotos || 0) > 0 ?
                                                    Math.round(((candidato?.totalVotos || 0) / estadisticasZona.totalVotos) * 100) : 0}%
                                            </small>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </Card.Body>
                )}
                {/* Lista de actas embebida en el mismo card */}
                <Card.Body className="p-0">
                    {actas.length > 0 ? (
                        <>
                            <div className="px-3 pt-2">
                                <h6 className="mb-2 text-uppercase text-muted" style={{ letterSpacing: '0.02em' }}>Actas de la zona</h6>
                            </div>
                            <Table responsive className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Junta</th>
                                        <th>Estado</th>
                                        <th>Votos</th>
                                        <th>Sufragantes</th>
                                        <th>Fecha</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {actas.map((acta) => (
                                        <tr key={acta.id}>
                                            <td>
                                                <small className="text-muted">{acta.juntaGenero}</small>
                                            </td>
                                            <td>
                                                <small className={acta.revisado ? 'text-success fw-semibold' : 'text-secondary fw-semibold'}>
                                                    {acta.revisado ? 'Validada' : 'Sin validar'}
                                                </small>
                                            </td>
                                            <td>
                                                <span className="fw-bold text-primary">
                                                    {(acta?.totalVotos || 0).toLocaleString()}
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
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() => onActaSeleccionada && onActaSeleccionada(acta)}
                                                >
                                                    Ver
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="text-muted">
                                <h6 className="mb-1">No hay actas registradas</h6>
                                <p className="mb-0">Esta zona aún no tiene actas registradas</p>
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default ActasPorZona;