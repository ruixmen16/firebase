// src/hooks/useDashboard.js
import { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export const useDashboard = (user, selectedParroquias = []) => {
    const [votos, setVotos] = useState([]);
    const [votosOriginales, setVotosOriginales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVoto, setSelectedVoto] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Candidatos definidos (igual que en Android)
    const candidatos = [
        { id: 1, nombre: "Pincay" },
        { id: 2, nombre: "Dennys Guillen" },
        { id: 3, nombre: "Rafael" },
        { id: 4, nombre: "María González" },
        { id: 5, nombre: "Carlos Mendoza" },
        { id: 6, nombre: "Ana Rodríguez" },
        { id: 7, nombre: "Luis Morales" },
        { id: 8, nombre: "Patricia Vega" }
    ];

    // Estado para el modal de detalle de votos
    const [showVotosModal, setShowVotosModal] = useState(false);
    const [selectedVotoDetalle, setSelectedVotoDetalle] = useState(null);

    // Cargar los últimos 20 votos para mostrar actividad reciente
    useEffect(() => {
        if (user) {
            const q = query(
                collection(db, "votos"), // Nombre de colección que viene de Android
                orderBy("timestamp", "desc"),
                limit(20) // Aumentamos a 20 para mejor visibilidad
            );

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const votosData = [];
                querySnapshot.forEach((doc) => {
                    votosData.push({ id: doc.id, ...doc.data() });
                });
                setVotosOriginales(votosData);
                setVotos(votosData); // Inicialmente todos los votos
                setLoading(false);
            }, (error) => {
                console.error("Error al cargar votos:", error);
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [user]);

    // Filtrar votos cuando cambien las parroquias seleccionadas
    useEffect(() => {
        if (votosOriginales.length > 0) {
            console.log('🔍 Filtro Debug:', {
                selectedParroquias: selectedParroquias,
                selectedCount: selectedParroquias?.length || 0,
                totalVotosOriginales: votosOriginales.length
            });

            // Verificar si es filtro vacío (no mostrar nada)
            if (selectedParroquias && selectedParroquias.length === 1 && selectedParroquias[0] === 'FILTRO_VACIO') {
                console.log('🚫 Filtro vacío - NO mostrando votos');
                setVotos([]);
            } else if (!selectedParroquias || selectedParroquias.length === 0) {
                // Array vacío = sin filtro → mostrar todos
                console.log('✅ Mostrando TODOS los votos (sin filtro)');
                setVotos(votosOriginales);
            } else {
                // Filtrar solo votos de las parroquias seleccionadas
                const votosFiltrados = votosOriginales.filter(voto => {
                    const incluido = selectedParroquias.includes(voto.parroquiaIdSvg);
                    if (incluido) {
                        console.log(`✅ Voto incluido: ${voto.parroquiaNombre} (${voto.parroquiaIdSvg})`);
                    }
                    return incluido;
                });
                console.log(`🎯 Filtrados: ${votosFiltrados.length} de ${votosOriginales.length} votos`);
                setVotos(votosFiltrados);
            }
        }
    }, [selectedParroquias, votosOriginales]);

    // Calcular total de votos por registro (suma de todos los candidatos)
    const calcularTotalVotos = (voto) => {
        if (!voto.votos || !Array.isArray(voto.votos)) return 0;
        return voto.votos.reduce((sum, candidatoVoto) => {
            return sum + (parseInt(candidatoVoto.numeroVotos) || 0);
        }, 0);
    };

    // Calcular estadísticas por candidato (SOLO PARA LOS ÚLTIMOS VOTOS - no se usa más en el Dashboard principal)
    // Esta función se mantiene para funciones de detalle/debug, pero las estadísticas principales vienen optimizadas
    const getEstadisticasPorCandidato = () => {
        console.log('⚠️ Usando cálculo legacy - considera usar useEstadisticasOptimizadas');
        const estadisticas = candidatos.map(candidato => {
            let totalVotos = 0;
            let totalActas = 0;

            votos.forEach(voto => {
                if (voto.votos && Array.isArray(voto.votos)) {
                    const votoDelCandidato = voto.votos.find(v => v.candidatoId === candidato.id);
                    if (votoDelCandidato) {
                        totalVotos += parseInt(votoDelCandidato.numeroVotos) || 0;
                        totalActas += 1; // Contar el acta que contiene votos para este candidato
                    }
                }
            });

            return {
                ...candidato,
                totalVotos,
                totalActas
            };
        });

        return estadisticas;
    };

    // Abrir modal de detalle de votos
    const abrirModalVotos = (voto) => {
        setSelectedVotoDetalle(voto);
        // Resetear índice de imagen, especialmente importante para imágenes individuales
        setSelectedImageIndex(0);
        setShowVotosModal(true);
    };

    // Cerrar modal de votos
    const cerrarModalVotos = () => {
        setShowVotosModal(false);
        setSelectedVotoDetalle(null);
    };

    // Abrir modal de imágenes
    const abrirModalImagenes = (voto) => {
        setSelectedVoto(voto);
        setSelectedImageIndex(0);
        setShowImageModal(true);
    };

    // Cerrar modal
    const cerrarModal = () => {
        setShowImageModal(false);
        setSelectedVoto(null);
        setSelectedImageIndex(0);
    };

    // Navegar entre imágenes
    const siguienteImagen = () => {
        // Determinar qué voto usar basándose en qué modal está abierto
        const votoActivo = showVotosModal ? selectedVotoDetalle : selectedVoto;

        if (votoActivo && votoActivo.imageUrls && votoActivo.imageUrls.length > 1) {
            setSelectedImageIndex((prev) =>
                prev < votoActivo.imageUrls.length - 1 ? prev + 1 : 0
            );
        }
    };

    const imagenAnterior = () => {
        // Determinar qué voto usar basándose en qué modal está abierto
        const votoActivo = showVotosModal ? selectedVotoDetalle : selectedVoto;

        if (votoActivo && votoActivo.imageUrls && votoActivo.imageUrls.length > 1) {
            setSelectedImageIndex((prev) =>
                prev > 0 ? prev - 1 : votoActivo.imageUrls.length - 1
            );
        }
    };

    // Abrir imagen en nueva ventana
    const abrirImagenEnNuevaVentana = (imageUrl) => {
        window.open(imageUrl, '_blank');
    };

    return {
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
    };
};