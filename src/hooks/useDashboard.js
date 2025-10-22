// src/hooks/useDashboard.js
import { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export const useDashboard = (user) => {
    const [votos, setVotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVoto, setSelectedVoto] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Candidatos definidos (igual que en Android)
    const candidatos = [
        { id: 1, nombre: "Pincay" },
        { id: 2, nombre: "Dennys Guillen" },
        { id: 3, nombre: "Rafael" }
    ];

    // Cargar los últimos 10 votos
    useEffect(() => {
        if (user) {
            const q = query(
                collection(db, "votos"), // Nombre de colección que viene de Android
                orderBy("timestamp", "desc"),
                limit(10)
            );

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const votosData = [];
                querySnapshot.forEach((doc) => {
                    votosData.push({ id: doc.id, ...doc.data() });
                });
                setVotos(votosData);
                setLoading(false);
            }, (error) => {
                console.error("Error al cargar votos:", error);
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [user]);

    // Calcular estadísticas por candidato
    const getEstadisticasPorCandidato = () => {
        const estadisticas = candidatos.map(candidato => {
            const votosDelCandidato = votos.filter(voto => voto.candidatoId === candidato.id);
            const totalVotos = votosDelCandidato.reduce((sum, voto) =>
                sum + parseInt(voto.numeroVotos || 0), 0
            );
            const totalActas = votosDelCandidato.length;

            return {
                ...candidato,
                totalVotos,
                totalActas
            };
        });

        return estadisticas;
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
        if (selectedVoto && selectedVoto.imageUrls) {
            setSelectedImageIndex((prev) =>
                prev < selectedVoto.imageUrls.length - 1 ? prev + 1 : 0
            );
        }
    };

    const imagenAnterior = () => {
        if (selectedVoto && selectedVoto.imageUrls) {
            setSelectedImageIndex((prev) =>
                prev > 0 ? prev - 1 : selectedVoto.imageUrls.length - 1
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
        getEstadisticasPorCandidato,
        abrirModalImagenes,
        cerrarModal,
        siguienteImagen,
        imagenAnterior,
        abrirImagenEnNuevaVentana
    };
};