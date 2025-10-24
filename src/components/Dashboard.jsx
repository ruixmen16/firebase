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
    } = useDashboard(user, selectedParroquias);

    const estadisticas = getEstadisticasPorCandidato();
    const totalVotosGeneral = estadisticas.reduce((sum, candidato) => sum + candidato.totalVotos, 0);

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
                    <PortoviejoMap
                        onParroquiasSelectionChange={setSelectedParroquias}
                        selectedParroquias={selectedParroquias}
                    />
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
                                            <th>Mesa</th>
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
                                                        <Badge variant="info">
                                                            Mesa {voto.numeroMesa}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <Badge bg="primary">
                                                            {totalVotos} votos
                                                        </Badge>
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
                                    <Card.Header>
                                        <h6 className="mb-0">📸 Fotos del Acta</h6>
                                    </Card.Header>
                                    <Card.Body>
                                        {selectedVotoDetalle.imageUrls && selectedVotoDetalle.imageUrls.length > 0 ? (
                                            <div className="text-center">
                                                {/* Imagen actual con flechas overlay */}
                                                <div className="mb-3 position-relative">
                                                    <img
                                                        src={selectedVotoDetalle.imageUrls[selectedImageIndex]}
                                                        alt={`Foto ${selectedImageIndex + 1}`}
                                                        style={{
                                                            width: '100%',
                                                            maxHeight: '400px',
                                                            objectFit: 'contain',
                                                            border: '1px solid #dee2e6',
                                                            borderRadius: '5px'
                                                        }}
                                                    />

                                                    {/* Flechas overlay SOBRE la imagen */}
                                                    {selectedVotoDetalle.imageUrls.length > 1 && (
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
                                                </div>

                                                {/* Puntos de paginación DEBAJO de la imagen */}
                                                {selectedVotoDetalle.imageUrls.length > 1 && (
                                                    <div className="d-flex justify-content-center align-items-center mb-3" style={{ gap: '8px' }}>
                                                        {selectedVotoDetalle.imageUrls.map((_, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => setSelectedImageIndex(index)}
                                                                style={{
                                                                    width: '10px',
                                                                    height: '10px',
                                                                    borderRadius: '50%',
                                                                    border: 'none',
                                                                    background: index === selectedImageIndex ? '#007bff' : '#ccc',
                                                                    cursor: 'pointer'
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-muted">
                                                <h6>📷 Sin fotos</h6>
                                                <p>No se encontraron imágenes para esta acta</p>
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
                                    <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                                                <Table striped bordered size="sm">
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
                                                                    <small>{candidatoVoto.candidatoNombre || 'Candidato no encontrado'}</small>
                                                                </td>
                                                                <td className="text-center">
                                                                    <Badge bg="primary" className="px-2">
                                                                        {candidatoVoto.numeroVotos}
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="table-success">
                                                        <tr>
                                                            <th><small>Total</small></th>
                                                            <th className="text-center">
                                                                <Badge bg="success" className="px-2">
                                                                    {calcularTotalVotos(selectedVotoDetalle)}
                                                                </Badge>
                                                            </th>
                                                        </tr>
                                                    </tfoot>
                                                </Table>
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

            {/* Modal de Imágenes */}
            <Modal
                show={showImageModal}
                onHide={cerrarModal}
                size="xl"
                centered
                dialogClassName="modal-90w"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        📸 Fotos - Mesa {selectedVoto?.numeroMesa}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '20px' }}>
                    {selectedVoto && selectedVoto.imageUrls && selectedVoto.imageUrls.length > 0 && (
                        <div className="text-center">
                            {/* Contenedor de imagen con flechas overlay */}
                            <div className="position-relative mb-3">
                                <img
                                    src={selectedVoto.imageUrls[selectedImageIndex]}
                                    alt={`Foto ${selectedImageIndex + 1}`}
                                    style={{
                                        width: '100%',
                                        height: '80vh',
                                        maxHeight: '85vh',
                                        objectFit: 'contain',
                                        cursor: 'pointer',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '8px'
                                    }}
                                    onClick={() => abrirImagenEnNuevaVentana(selectedVoto.imageUrls[selectedImageIndex])}
                                />

                                {/* Flechas overlay SOBRE la imagen */}
                                {selectedVoto.imageUrls.length > 1 && (
                                    <>
                                        <button
                                            onClick={imagenAnterior}
                                            style={{
                                                position: 'absolute',
                                                left: '10px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'rgba(0,0,0,0.7)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '50px',
                                                height: '50px',
                                                fontSize: '24px',
                                                cursor: 'pointer',
                                                zIndex: 1000,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.9)'}
                                            onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.7)'}
                                        >
                                            ‹
                                        </button>

                                        <button
                                            onClick={siguienteImagen}
                                            style={{
                                                position: 'absolute',
                                                right: '10px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'rgba(0,0,0,0.7)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '50px',
                                                height: '50px',
                                                fontSize: '24px',
                                                cursor: 'pointer',
                                                zIndex: 1000,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.9)'}
                                            onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.7)'}
                                        >
                                            ›
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Puntos de paginación DEBAJO de la imagen */}
                            {selectedVoto.imageUrls.length > 1 && (
                                <div className="d-flex justify-content-center align-items-center" style={{ gap: '10px' }}>
                                    {selectedVoto.imageUrls.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedImageIndex(index)}
                                            style={{
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                border: 'none',
                                                background: index === selectedImageIndex ? '#007bff' : '#ccc',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
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