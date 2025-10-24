// src/hooks/useEstadisticasOptimizadas.js
import { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { doc, onSnapshot } from 'firebase/firestore';

/**
 * Hook que obtiene estadísticas precalculadas desde Firestore
 * ✅ Ultra rápido - lee 1 solo documento en lugar de procesar 100k votos
 * ✅ Tiempo real - se actualiza automáticamente cuando cambian los datos
 * ✅ Escalable - no importa si son 100 votos o 1 millón
 */
export const useEstadisticasOptimizadas = (selectedParroquias = []) => {
    const [estadisticas, setEstadisticas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('🔥 Conectando a estadísticas optimizadas...');

        // Referencia al documento de estadísticas precalculadas
        const estadisticasRef = doc(db, 'estadisticas_totales', 'estadisticas_generales');

        // Listener en tiempo real
        const unsubscribe = onSnapshot(
            estadisticasRef,
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    console.log('✅ Estadísticas cargadas:', data);
                    setEstadisticas(data);
                    setError(null);
                } else {
                    console.log('⚠️ No existe el documento de estadísticas - usando valores por defecto en cero');
                    // Crear estadísticas vacías en lugar de mostrar error
                    const estadisticasVacias = {
                        totalActas: 0,
                        totalActasRevisadas: 0,
                        totalActasNoRevisadas: 0,
                        totalSufragantes: 0,
                        totalVotosBlancos: 0,
                        totalVotosNulos: 0,
                        totalVotosValidos: 0,
                        porcentajeRevision: 0,
                        votosPorCandidato: {},
                        votosPorParroquia: {},
                        votosPorCircunscripcion: {},
                        votosPorZona: {}
                    };
                    setEstadisticas(estadisticasVacias);
                    setError(null);
                }
                setLoading(false);
            },
            (err) => {
                console.error('❌ Error cargando estadísticas:', err);
                setError(`Error: ${err.message}`);
                setLoading(false);
            }
        );

        return () => {
            console.log('🔌 Desconectando listener de estadísticas');
            unsubscribe();
        };
    }, []);

    // Función para obtener estadísticas filtradas por parroquias seleccionadas
    const getEstadisticasFiltradas = () => {
        if (!estadisticas) {
            // Retornar estadísticas vacías si no hay datos
            return {
                totalActas: 0,
                totalSufragantes: 0,
                totalVotosBlancos: 0,
                totalVotosNulos: 0,
                totalVotosValidos: 0,
                totalActasRevisadas: 0,
                totalActasNoRevisadas: 0,
                porcentajeRevision: 0,
                votosPorCandidato: {}
            };
        }

        // Si no hay filtro, retornar estadísticas globales
        if (!selectedParroquias || selectedParroquias.length === 0) {
            return estadisticas;
        }

        // Si es filtro vacío, retornar estadísticas en cero
        if (selectedParroquias.length === 1 && selectedParroquias[0] === 'FILTRO_VACIO') {
            return {
                totalActas: 0,
                totalSufragantes: 0,
                totalVotosBlancos: 0,
                totalVotosNulos: 0,
                totalVotosValidos: 0,
                totalActasRevisadas: 0,
                totalActasNoRevisadas: 0,
                porcentajeRevision: 0,
                votosPorCandidato: {}
            };
        }

        // Filtrar por parroquias seleccionadas
        let totalActas = 0;
        let totalSufragantes = 0;
        let totalVotosValidos = 0;
        let totalActasRevisadas = 0;
        let totalActasNoRevisadas = 0;
        const votosPorCandidato = {};

        selectedParroquias.forEach(parroquiaIdSvg => {
            // Buscar en votosPorParroquia
            const parroquiaData = Object.values(estadisticas.votosPorParroquia || {})
                .find(p => p.parroquiaIdSvg === parroquiaIdSvg);

            if (parroquiaData) {
                totalActas += parroquiaData.actas || 0;
                totalSufragantes += parroquiaData.sufragantes || 0;
                totalVotosValidos += parroquiaData.totalVotos || 0;
                totalActasRevisadas += parroquiaData.actasRevisadas || 0;
                totalActasNoRevisadas += parroquiaData.actasNoRevisadas || 0;

                // Sumar votos por candidato (esto requeriría más detalle en las estadísticas)
                // Por ahora usamos las estadísticas globales como aproximación
                Object.entries(estadisticas.votosPorCandidato || {}).forEach(([candidatoId, candidatoData]) => {
                    if (!votosPorCandidato[candidatoId]) {
                        votosPorCandidato[candidatoId] = {
                            nombre: candidatoData.nombre,
                            votos: 0
                        };
                    }
                    // Proporción basada en votos de la parroquia vs total
                    const proporcion = totalVotosValidos > 0 ? (parroquiaData.totalVotos || 0) / estadisticas.totalVotosValidos : 0;
                    votosPorCandidato[candidatoId].votos += Math.round(candidatoData.votos * proporcion);
                });
            }
        });

        return {
            totalActas,
            totalSufragantes,
            totalVotosBlancos: 0, // Se podría calcular si tuviéramos estos datos por parroquia
            totalVotosNulos: 0,
            totalVotosValidos,
            totalActasRevisadas,
            totalActasNoRevisadas,
            porcentajeRevision: totalActas > 0 ? Math.round((totalActasRevisadas / totalActas) * 100) : 0,
            votosPorCandidato
        };
    };

    // Función para obtener candidatos ordenados por votos
    const getCandidatosOrdenados = () => {
        const stats = getEstadisticasFiltradas();
        if (!stats || !stats.votosPorCandidato) return [];

        return Object.entries(stats.votosPorCandidato)
            .map(([id, data]) => ({
                id,
                nombre: data.nombre,
                totalVotos: data.votos || 0
            }))
            .filter(candidato => candidato.totalVotos > 0)
            .sort((a, b) => b.totalVotos - a.totalVotos);
    };

    // Función para obtener estadísticas por parroquia (para el mapa)
    const getEstadisticasPorParroquia = () => {
        if (!estadisticas || !estadisticas.votosPorParroquia) return {};
        return estadisticas.votosPorParroquia;
    };

    // Función para obtener estadísticas por zona (NUEVA)
    const getEstadisticasPorZona = () => {
        if (!estadisticas || !estadisticas.votosPorZona) return {};
        return estadisticas.votosPorZona;
    };

    return {
        estadisticas: getEstadisticasFiltradas(),
        estadisticasOriginales: estadisticas,
        candidatos: getCandidatosOrdenados(),
        estadisticasPorParroquia: getEstadisticasPorParroquia(),
        estadisticasPorZona: getEstadisticasPorZona(),
        loading,
        error
    };
};