import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Table, Modal } from 'react-bootstrap';
import { useDashboard } from '../hooks/useDashboard';
import LoadingSpinner from './LoadingSpinner';
import PortoviejoMap from './PortoviejoMap';
import { db } from '../firebase-config';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';

const Dashboard = ({ user }) => {
    // Estado para filtro de parroquias seleccionadas en el mapa
    const [selectedParroquias, setSelectedParroquias] = useState([]);

    // Estados para el modal de edición de votos
    const [modoEdicion, setModoEdicion] = useState(false);
    const [votoEditando, setVotoEditando] = useState(null);
    const [guardandoChanges, setGuardandoChanges] = useState(false);
    const [parroquiasData, setParroquiasData] = useState([]);

    const {
        votos,
        loading,
        candidatos,
        selectedImageIndex,
        setSelectedImageIndex,
        showVotosModal,
        selectedVotoDetalle,
        calcularTotalVotos,
        getEstadisticasPorCandidato,
        abrirModalVotos,
        cerrarModalVotos,
        siguienteImagen,
        imagenAnterior
    } = useDashboard(user, selectedParroquias);

    const estadisticas = getEstadisticasPorCandidato();
    const totalVotosGeneral = estadisticas.reduce((sum, candidato) => sum + candidato.totalVotos, 0);

    // Calcular estadísticas adicionales
    const calcularEstadisticasAdicionales = () => {
        // Total de sufragantes (suma de todos los totalSufragantes de todas las actas)
        const totalSufragantes = votos.reduce((sum, voto) => {
            return sum + (parseInt(voto.totalSufragantes) || 0);
        }, 0);

        // Actas validadas (revisado === true)
        const actasValidadas = votos.filter(voto => voto.revisado === true).length;

        // Actas sin validar (revisado === false o no tiene el campo)
        const actasSinValidar = votos.filter(voto => voto.revisado !== true).length;

        // Total de actas registradas
        const totalActas = votos.length;

        return {
            totalSufragantes,
            actasValidadas,
            actasSinValidar,
            totalActas
        };
    };

    const estadisticasAdicionales = calcularEstadisticasAdicionales();

    // Cargar información de parroquias al montar el componente
    useEffect(() => {
        const cargarParroquias = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "parroquias"));
                const parroquias = [];
                querySnapshot.forEach((doc) => {
                    parroquias.push({ id: doc.id, ...doc.data() });
                });
                setParroquiasData(parroquias);
                console.log('✅ Parroquias cargadas:', parroquias.length);
            } catch (error) {
                console.error('❌ Error cargando parroquias:', error);
            }
        };

        cargarParroquias();
    }, []);

    // Función para obtener información de circunscripción basándose en parroquiaId
    const obtenerInfoCircunscripcion = (parroquiaId) => {
        if (!parroquiaId) return 'Sin parroquia ID';
        if (parroquiasData.length === 0) return 'Cargando...';

        const parroquia = parroquiasData.find(p => p.id === parroquiaId);
        return parroquia?.circunscripcion || 'No encontrada';
    };

    // Función para obtener información completa de parroquia basándose en parroquiaId
    const obtenerInfoParroquia = (parroquiaId) => {
        if (!parroquiaId) return 'Sin parroquia ID';
        if (parroquiasData.length === 0) return 'Cargando...';

        const parroquia = parroquiasData.find(p => p.id === parroquiaId);
        return parroquia?.strNombre || 'No encontrada';
    };    // Función para auto-guardar cambios en Firebase (sin botón)
    const autoGuardarCambio = async (campo, valor) => {
        if (!selectedVotoDetalle || !modoEdicion) return;

        setGuardandoChanges(true);
        try {
            const votoRef = doc(db, 'votos', selectedVotoDetalle.id);

            // Preparar solo el campo que cambió
            const cambio = {
                [campo]: valor,
                fechaUltimaEdicion: new Date()
            };

            // Actualizar en Firebase
            await updateDoc(votoRef, cambio);

            console.log(`✅ Campo '${campo}' actualizado a: ${valor}`);

        } catch (error) {
            console.error(`❌ Error al guardar ${campo}:`, error);
        } finally {
            setGuardandoChanges(false);
        }
    };    // Formatear fecha y hora
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
        <Container className="py-3">

            {/* Layout Principal: Mapa + Estadísticas */}
            <Row className="mb-4 gx-3">
                {/* Mapa Interactivo de Portoviejo - 70% del ancho */}
                <Col lg={8} className="d-flex mb-4 mb-lg-0">
                    <PortoviejoMap
                        onParroquiasSelectionChange={setSelectedParroquias}
                        selectedParroquias={selectedParroquias}
                    />
                </Col>

                {/* Estadísticas por Candidato - 30% del ancho */}
                <Col lg={4} className="d-flex">
                    <Card className="shadow-sm h-100 w-100">
                        <Card.Body className="p-3 d-flex flex-column h-100">
                            {/* Estadísticas Electorales - FIJAS (no scrolleable) */}
                            <div className="mb-3 p-3 bg-light border rounded flex-shrink-0">
                                <div className="row g-2 mb-2">
                                    <div className="col-4 text-center">
                                        <div className="fw-bold text-primary">{totalVotosGeneral.toLocaleString()}</div>
                                        <small className="text-muted">Total Votos</small>
                                    </div>
                                    <div className="col-4 text-center">
                                        <div className="fw-bold text-warning">{estadisticasAdicionales.totalSufragantes.toLocaleString()}</div>
                                        <small className="text-muted">Sufragantes</small>
                                    </div>
                                    <div className="col-4 text-center">
                                        <div className="fw-bold text-info">{estadisticasAdicionales.totalActas}</div>
                                        <small className="text-muted">Actas</small>
                                    </div>
                                </div>
                                <div className="row g-2">
                                    <div className="col-6 text-center">
                                        <div className="fw-bold text-success">{estadisticasAdicionales.actasValidadas}</div>
                                        <small className="text-muted">
                                            Validadas ({estadisticasAdicionales.totalActas > 0 ? Math.round((estadisticasAdicionales.actasValidadas / estadisticasAdicionales.totalActas) * 100) : 0}%)
                                        </small>
                                    </div>
                                    <div className="col-6 text-center">
                                        <div className="fw-bold text-danger">{estadisticasAdicionales.actasSinValidar}</div>
                                        <small className="text-muted">
                                            Sin Validar ({estadisticasAdicionales.totalActas > 0 ? Math.round((estadisticasAdicionales.actasSinValidar / estadisticasAdicionales.totalActas) * 100) : 0}%)
                                        </small>
                                    </div>
                                </div>
                            </div>

                            {/* Lista de Candidatos - SCROLLEABLE */}
                            <div className="flex-grow-1 overflow-auto"
                                style={{ minHeight: 0 }}>
                                {estadisticas
                                    .filter(candidato => candidato.totalVotos > 0) // Mostrar solo candidatos con votos
                                    .sort((a, b) => b.totalVotos - a.totalVotos) // Ordenar de mayor a menor por votos
                                    .map((candidato, index) => {
                                        const porcentaje = totalVotosGeneral > 0 ?
                                            Math.round((candidato.totalVotos / totalVotosGeneral) * 100) : 0;

                                        // Colores para las barras de progreso - el primer lugar tendrá color dorado/success
                                        const colores = ['success', 'primary', 'info', 'warning', 'danger', 'secondary', 'dark', 'primary'];
                                        const color = colores[index % colores.length];

                                        // Solo mostrar trofeo para el primer lugar
                                        const posicionIcon = index === 0 ? '🏆' : '';
                                        const esLider = index === 0;

                                        return (
                                            <div key={candidato.id} className={`mb-3 p-2 border rounded ${esLider ? 'bg-warning bg-opacity-25 border-warning' : 'bg-light'}`}>
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <div className="d-flex align-items-center">
                                                        {posicionIcon && <span className="me-2" style={{ fontSize: '16px' }}>{posicionIcon}</span>}
                                                        <div>
                                                            <h6 className={`mb-0 ${esLider ? 'text-warning-emphasis fw-bold' : 'text-dark fw-bold'}`}>
                                                                {candidato.nombre}
                                                            </h6>
                                                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                                {candidato.totalVotos.toLocaleString()} votos
                                                            </small>
                                                        </div>
                                                    </div>
                                                    <div className="text-end">
                                                        <span className="fw-bold text-secondary">{porcentaje}%</span>
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
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Lista de Últimss 10 Actas */}
            <Row className="gx-3">
                <Col>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-info text-white">
                            <h4 className="mb-0">📋 Últimos 10 Actas Registrados</h4>
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
                                            <th>Total Votos</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {votos.map((voto) => {
                                            const totalVotos = calcularTotalVotos(voto);
                                            return (
                                                <tr key={voto.id}>
                                                    <td>{formatearFecha(voto.timestamp)}</td>
                                                    <td>
                                                        <strong>{totalVotos} votos</strong>
                                                    </td>
                                                    <td>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => abrirModalVotos(voto)}
                                                        >
                                                            👁️ Ver
                                                        </Button>
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
                onHide={() => {
                    cerrarModalVotos();
                    setModoEdicion(false);
                    setVotoEditando(null);
                }}
                size="xl"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        📊 Detalle de Acta - Mesa {selectedVotoDetalle?.numeroMesa}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedVotoDetalle && (
                        <Row>
                            {/* Columna izquierda: Fotos */}
                            <Col md={6}>
                                <Card className="h-100">
                                    <Card.Body className="p-0">
                                        {selectedVotoDetalle.imageUrls && selectedVotoDetalle.imageUrls.length > 0 ? (
                                            <div className="text-center">
                                                {/* Imagen actual con overlays */}
                                                <div className="position-relative" style={{ height: '100%', minHeight: '500px' }}>
                                                    <div
                                                        className="image-zoom-container"
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            overflow: 'hidden',
                                                            border: '1px solid #dee2e6',
                                                            borderRadius: '5px',
                                                            cursor: 'zoom-in'
                                                        }}
                                                        onMouseMove={(e) => {
                                                            const container = e.currentTarget;
                                                            const img = container.querySelector('img');
                                                            const rect = container.getBoundingClientRect();
                                                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                                                            const y = ((e.clientY - rect.top) / rect.height) * 100;

                                                            // Limpiar timeout anterior si existe
                                                            if (container.zoomTimeout) {
                                                                clearTimeout(container.zoomTimeout);
                                                            }

                                                            // Crear nuevo timeout para activar zoom después de 200ms de inactividad
                                                            container.zoomTimeout = setTimeout(() => {
                                                                img.style.transformOrigin = `${x}% ${y}%`;
                                                                img.style.transform = 'scale(2)';
                                                            }, 200);
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            const container = e.currentTarget;
                                                            const img = container.querySelector('img');

                                                            // Limpiar timeout al salir
                                                            if (container.zoomTimeout) {
                                                                clearTimeout(container.zoomTimeout);
                                                                container.zoomTimeout = null;
                                                            }

                                                            img.style.transform = 'scale(1)';
                                                            img.style.transformOrigin = 'center center';
                                                        }}
                                                    >
                                                        <img
                                                            src={selectedVotoDetalle.imageUrls[selectedImageIndex]}
                                                            alt={`Foto ${selectedImageIndex + 1}`}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'contain',
                                                                transition: 'transform 0.3s ease',
                                                                transformOrigin: 'center center'
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Flechas overlay SOBRE la imagen - Solo si hay más de 1 imagen */}
                                                    {selectedVotoDetalle.imageUrls && selectedVotoDetalle.imageUrls.length > 1 && (
                                                        <>
                                                            <button
                                                                onClick={imagenAnterior}
                                                                style={{
                                                                    position: 'absolute',
                                                                    left: '5px',
                                                                    top: '50%',
                                                                    transform: 'translateY(-50%)',
                                                                    background: 'rgba(0,0,0,0.7)',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '50%',
                                                                    width: '35px',
                                                                    height: '35px',
                                                                    fontSize: '18px',
                                                                    cursor: 'pointer',
                                                                    zIndex: 1000,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                            >
                                                                ‹
                                                            </button>

                                                            <button
                                                                onClick={siguienteImagen}
                                                                style={{
                                                                    position: 'absolute',
                                                                    right: '5px',
                                                                    top: '50%',
                                                                    transform: 'translateY(-50%)',
                                                                    background: 'rgba(0,0,0,0.7)',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '50%',
                                                                    width: '35px',
                                                                    height: '35px',
                                                                    fontSize: '18px',
                                                                    cursor: 'pointer',
                                                                    zIndex: 1000,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                            >
                                                                ›
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Contador de imágenes overlay en la esquina superior derecha */}
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            top: '8px',
                                                            right: '8px',
                                                            background: 'rgba(0,0,0,0.7)',
                                                            color: 'white',
                                                            padding: '4px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            zIndex: 1000
                                                        }}
                                                    >
                                                        📷 {selectedImageIndex + 1} / {selectedVotoDetalle.imageUrls.length}
                                                    </div>

                                                    {/* Puntos de paginación overlay en la parte inferior - Solo si hay más de 1 imagen */}
                                                    {selectedVotoDetalle.imageUrls && selectedVotoDetalle.imageUrls.length > 1 && (
                                                        <div
                                                            className="d-flex justify-content-center align-items-center"
                                                            style={{
                                                                position: 'absolute',
                                                                bottom: '10px',
                                                                left: '50%',
                                                                transform: 'translateX(-50%)',
                                                                gap: '8px',
                                                                zIndex: 1000
                                                            }}
                                                        >
                                                            {selectedVotoDetalle.imageUrls.map((_, index) => (
                                                                <button
                                                                    key={index}
                                                                    onClick={() => setSelectedImageIndex(index)}
                                                                    style={{
                                                                        width: '12px',
                                                                        height: '12px',
                                                                        minWidth: '12px',
                                                                        minHeight: '12px',
                                                                        borderRadius: '50%',
                                                                        border: '2px solid rgba(255,255,255,0.8)',
                                                                        background: index === selectedImageIndex ? '#007bff' : 'rgba(255,255,255,0.6)',
                                                                        cursor: 'pointer',
                                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                                                        padding: '0',
                                                                        margin: '0',
                                                                        boxSizing: 'border-box',
                                                                        outline: 'none'
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                                <div className="text-center">
                                                    <h6>📷 Sin fotos</h6>
                                                    <p className="mb-0">No se encontraron imágenes para esta acta</p>
                                                </div>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Columna derecha: Datos del voto */}
                            <Col md={6}>
                                <Card className="h-100">
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        <h6 className="mb-0">📋 Información del Acta</h6>
                                        <div className="d-flex align-items-center gap-3">
                                            {guardandoChanges && (
                                                <small className="text-success">
                                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                    Guardando...
                                                </small>
                                            )}
                                            <div className="form-check form-switch mb-0">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={modoEdicion}
                                                    onChange={(e) => {
                                                        setModoEdicion(e.target.checked);
                                                        if (e.target.checked) {
                                                            setVotoEditando({ ...selectedVotoDetalle });
                                                        }
                                                    }}
                                                />
                                                <label className="form-check-label">
                                                    ✏️ Editar
                                                </label>
                                            </div>
                                        </div>
                                    </Card.Header>
                                    <Card.Body>
                                        {/* Información de ubicación */}
                                        <div className="mb-3">
                                            <Row>
                                                <Col sm={6}>
                                                    <label className="form-label"><strong>Parroquia:</strong></label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={modoEdicion ? (votoEditando?.parroquiaNombre || obtenerInfoParroquia(selectedVotoDetalle?.parroquiaId)) : obtenerInfoParroquia(selectedVotoDetalle?.parroquiaId)}
                                                        disabled={!modoEdicion}
                                                        onChange={(e) => {
                                                            if (modoEdicion) {
                                                                const nuevoValor = e.target.value;
                                                                setVotoEditando(prev => ({ ...prev, parroquiaNombre: nuevoValor }));
                                                                autoGuardarCambio('parroquiaNombre', nuevoValor);
                                                            }
                                                        }}
                                                    />
                                                </Col>
                                                <Col sm={6}>
                                                    <label className="form-label"><strong>Circunscripción:</strong></label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={modoEdicion ? (votoEditando?.circunscripcion || obtenerInfoCircunscripcion(selectedVotoDetalle?.parroquiaId)) : obtenerInfoCircunscripcion(selectedVotoDetalle?.parroquiaId)}
                                                        disabled={!modoEdicion}
                                                        onChange={(e) => {
                                                            if (modoEdicion) {
                                                                const nuevoValor = e.target.value;
                                                                setVotoEditando(prev => ({ ...prev, circunscripcion: nuevoValor }));
                                                                autoGuardarCambio('circunscripcion', nuevoValor);
                                                            }
                                                        }}
                                                    />
                                                </Col>
                                            </Row>
                                        </div>

                                        <div className="mb-3">
                                            <Row>
                                                <Col sm={6}>
                                                    <label className="form-label"><strong>Junta:</strong></label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        value={modoEdicion ? (votoEditando?.junta || '') : (selectedVotoDetalle?.junta || 'No especificada')}
                                                        disabled={!modoEdicion}
                                                        onChange={(e) => {
                                                            if (modoEdicion) {
                                                                const nuevoValor = e.target.value;
                                                                setVotoEditando(prev => ({ ...prev, junta: nuevoValor }));
                                                                autoGuardarCambio('junta', nuevoValor);
                                                            }
                                                        }}
                                                    />
                                                </Col>
                                                <Col sm={6}>
                                                    <div className="form-check form-switch mt-4">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={modoEdicion ? (votoEditando?.revisado || false) : (selectedVotoDetalle?.revisado || false)}
                                                            disabled={!modoEdicion}
                                                            onChange={(e) => {
                                                                if (modoEdicion) {
                                                                    const nuevoValor = e.target.checked;
                                                                    setVotoEditando(prev => ({ ...prev, revisado: nuevoValor }));
                                                                    autoGuardarCambio('revisado', nuevoValor);
                                                                }
                                                            }}
                                                        />
                                                        <label className="form-check-label">
                                                            ✅ Revisado
                                                        </label>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* Campos adicionales */}
                                        <div className="mb-3">
                                            <Row>
                                                <Col sm={4}>
                                                    <label className="form-label"><strong>Votos Nulos:</strong></label>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        value={modoEdicion ? (votoEditando?.votosNulos || 0) : (selectedVotoDetalle?.votosNulos || 0)}
                                                        disabled={!modoEdicion}
                                                        onChange={(e) => {
                                                            if (modoEdicion) {
                                                                const nuevoValor = parseInt(e.target.value) || 0;
                                                                setVotoEditando(prev => ({ ...prev, votosNulos: nuevoValor }));
                                                                autoGuardarCambio('votosNulos', nuevoValor);
                                                            }
                                                        }}
                                                        min="0"
                                                    />
                                                </Col>
                                                <Col sm={4}>
                                                    <label className="form-label"><strong>Votos Blancos:</strong></label>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        value={modoEdicion ? (votoEditando?.votosBlancos || 0) : (selectedVotoDetalle?.votosBlancos || 0)}
                                                        disabled={!modoEdicion}
                                                        onChange={(e) => {
                                                            if (modoEdicion) {
                                                                const nuevoValor = parseInt(e.target.value) || 0;
                                                                setVotoEditando(prev => ({ ...prev, votosBlancos: nuevoValor }));
                                                                autoGuardarCambio('votosBlancos', nuevoValor);
                                                            }
                                                        }}
                                                        min="0"
                                                    />
                                                </Col>
                                                <Col sm={4}>
                                                    <label className="form-label"><strong>Total Sufragantes:</strong></label>
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm"
                                                        value={modoEdicion ? (votoEditando?.totalSufragantes || 0) : (selectedVotoDetalle?.totalSufragantes || 0)}
                                                        disabled={!modoEdicion}
                                                        onChange={(e) => {
                                                            if (modoEdicion) {
                                                                const nuevoValor = parseInt(e.target.value) || 0;
                                                                setVotoEditando(prev => ({ ...prev, totalSufragantes: nuevoValor }));
                                                                autoGuardarCambio('totalSufragantes', nuevoValor);
                                                            }
                                                        }}
                                                        min="0"
                                                    />
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* Tabla de votos por candidato */}
                                        <div className="mb-3">
                                            <label className="form-label"><strong>Votos por Candidato:</strong></label>
                                            {selectedVotoDetalle.votos && (
                                                (() => {
                                                    const totalVotos = calcularTotalVotos(selectedVotoDetalle);
                                                    const votosOrdenados = [...selectedVotoDetalle.votos]
                                                        .sort((a, b) => parseInt(b.numeroVotos) - parseInt(a.numeroVotos));

                                                    return (
                                                        <Table striped bordered size="sm">
                                                            <thead className="table-primary">
                                                                <tr>
                                                                    <th>Candidato</th>
                                                                    <th className="text-center">Votos</th>
                                                                    <th className="text-center">%</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {votosOrdenados.map((candidatoVoto, index) => {
                                                                    const votos = parseInt(candidatoVoto.numeroVotos) || 0;
                                                                    const porcentaje = totalVotos > 0 ? Math.round((votos / totalVotos) * 100) : 0;

                                                                    return (
                                                                        <tr key={index}>
                                                                            <td>
                                                                                <small>{candidatoVoto.candidatoNombre || 'Candidato no encontrado'}</small>
                                                                            </td>
                                                                            <td className="text-center">
                                                                                <strong>{votos}</strong>
                                                                            </td>
                                                                            <td className="text-center">
                                                                                <strong>{porcentaje}%</strong>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                            <tfoot className="table-success">
                                                                <tr>
                                                                    <th><small>Total</small></th>
                                                                    <th className="text-center">
                                                                        <strong className="text-success">{totalVotos}</strong>
                                                                    </th>
                                                                    <th className="text-center">
                                                                        <strong className="text-success">100%</strong>
                                                                    </th>
                                                                </tr>
                                                            </tfoot>
                                                        </Table>
                                                    );
                                                })()
                                            )}
                                        </div>

                                        {/* Información de registro */}
                                        <div className="mt-3 pt-3 border-top">
                                            <small className="text-muted">
                                                <strong>Registrado:</strong> {formatearFecha(selectedVotoDetalle.timestamp)}
                                            </small>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => {
                        cerrarModalVotos();
                        setModoEdicion(false);
                        setVotoEditando(null);
                    }}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>


        </Container>
    );
};

export default Dashboard;