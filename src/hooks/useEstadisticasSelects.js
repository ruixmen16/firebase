// src/hooks/useEstadisticasSelects.js
import { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { doc, onSnapshot } from 'firebase/firestore';

/**
 * Hook para obtener estadísticas de actas por circunscripción, parroquia y zona
 * para mostrar en los selects del mapa
 * ✅ Ultra rápido - lee 1 solo documento
 * ✅ Tiempo real - se actualiza automáticamente
 * ✅ Usa datos precalculados de la Cloud Function
 */
export const useEstadisticasSelects = () => {
    const [estadisticas, setEstadisticas] = useState({
        votosPorCircunscripcion: {},
        votosPorParroquia: {},
        votosPorZona: {}
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('🚀 Cargando estadísticas para selects...');
        setLoading(true);

        // Referencia al documento de estadísticas precalculadas
        const estadisticasRef = doc(db, 'estadisticas_totales', 'estadisticas_generales');

        // Listener en tiempo real
        const unsubscribe = onSnapshot(
            estadisticasRef,
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();

                    setEstadisticas({
                        votosPorCircunscripcion: data.votosPorCircunscripcion || {},
                        votosPorParroquia: data.votosPorParroquia || {},
                        votosPorZona: data.votosPorZona || {}
                    });

                    console.log('✅ Estadísticas para selects cargadas');
                    setError(null);
                } else {
                    console.log('⚠️ No existe el documento de estadísticas');
                    setEstadisticas({
                        votosPorCircunscripcion: {},
                        votosPorParroquia: {},
                        votosPorZona: {}
                    });
                    setError(null);
                }
                setLoading(false);
            },
            (err) => {
                console.error('❌ Error cargando estadísticas para selects:', err);
                setError(`Error: ${err.message}`);
                setLoading(false);
            }
        );

        return () => {
            console.log('🔌 Desconectando listener de estadísticas selects');
            unsubscribe();
        };
    }, []);

    // Función para obtener total de actas por circunscripción
    const getActasPorCircunscripcion = (circunscripcionCodigo) => {
        if (loading || !estadisticas.votosPorCircunscripcion) return 0;

        if (circunscripcionCodigo === 'all') {
            // Para "TODAS", sumar todas las circunscripciones
            return Object.values(estadisticas.votosPorCircunscripcion).reduce(
                (total, circ) => total + (circ.actas || 0), 0
            );
        }

        const circunscripcion = estadisticas.votosPorCircunscripcion[circunscripcionCodigo];
        return circunscripcion?.actas || 0;
    };

    // Función para obtener total de actas por parroquia
    const getActasPorParroquia = (parroquiaIdSvg) => {
        if (loading || !estadisticas.votosPorParroquia) return 0;

        if (parroquiaIdSvg === 'all') {
            // Para "TODAS", sumar todas las parroquias
            return Object.values(estadisticas.votosPorParroquia).reduce(
                (total, parroquia) => total + (parroquia.actas || 0), 0
            );
        }

        // Buscar por parroquiaIdSvg en votosPorParroquia
        const parroquia = Object.values(estadisticas.votosPorParroquia).find(
            p => p.parroquiaIdSvg === parroquiaIdSvg
        );
        return parroquia?.actas || 0;
    };

    // Función para obtener total de actas por zona
    const getActasPorZona = (zonaCodigo) => {
        if (loading || !estadisticas.votosPorZona) return 0;

        if (zonaCodigo === 'all') {
            // Para "TODAS", sumar todas las zonas
            return Object.values(estadisticas.votosPorZona).reduce(
                (total, zona) => total + (zona.actas || 0), 0
            );
        }

        // Buscar por código de zona
        const zona = Object.values(estadisticas.votosPorZona).find(
            z => z.codigo === parseInt(zonaCodigo)
        );
        return zona?.actas || 0;
    };

    // Función para obtener actas filtradas por circunscripción seleccionada
    const getActasParroquiasFiltradas = (parroquias, selectedCircunscripcion) => {
        if (loading || !estadisticas.votosPorParroquia || !parroquias) return 0;

        if (!selectedCircunscripcion || selectedCircunscripcion.length === 0 ||
            (selectedCircunscripcion.length === 1 && selectedCircunscripcion[0].value === 'all')) {
            // Todas las parroquias
            return Object.values(estadisticas.votosPorParroquia).reduce(
                (total, parroquia) => total + (parroquia.actas || 0), 0
            );
        }

        // Filtrar por circunscripciones seleccionadas
        const codigosSeleccionados = selectedCircunscripcion
            .filter(c => c.value !== 'all')
            .map(c => c.value);

        let totalActas = 0;
        parroquias.forEach(p => {
            if (codigosSeleccionados.includes(p.intCircunscripcionCodigo)) {
                const parroquiaStats = Object.values(estadisticas.votosPorParroquia).find(
                    ps => ps.parroquiaIdSvg === p.id_svg
                );
                if (parroquiaStats) {
                    totalActas += parroquiaStats.actas || 0;
                }
            }
        });

        return totalActas;
    };

    // Función para obtener actas de zonas filtradas por parroquias
    const getActasZonasFiltradas = (parroquias, selectedParroquia) => {
        if (loading || !estadisticas.votosPorZona || !parroquias) return 0;

        if (!selectedParroquia || selectedParroquia.length === 0 ||
            (selectedParroquia.length === 1 && selectedParroquia[0].value === 'all')) {
            // Todas las zonas
            return Object.values(estadisticas.votosPorZona).reduce(
                (total, zona) => total + (zona.actas || 0), 0
            );
        }

        // Filtrar por parroquias seleccionadas
        const parroquiasSeleccionadas = selectedParroquia
            .filter(p => p.value !== 'all')
            .map(p => p.value);

        let totalActas = 0;
        parroquias.forEach(p => {
            if (parroquiasSeleccionadas.includes(p.id_svg)) {
                // Sumar actas de todas las zonas de esta parroquia
                Object.values(estadisticas.votosPorZona).forEach(zona => {
                    if (zona.parroquiaIdSvg === p.id_svg) {
                        totalActas += zona.actas || 0;
                    }
                });
            }
        });

        return totalActas;
    };

    return {
        estadisticas,
        loading,
        error,
        getActasPorCircunscripcion,
        getActasPorParroquia,
        getActasPorZona,
        getActasParroquiasFiltradas,
        getActasZonasFiltradas
    };
};