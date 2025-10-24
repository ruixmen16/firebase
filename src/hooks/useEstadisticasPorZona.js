// src/hooks/useEstadisticasPorZona.js
import { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { doc, onSnapshot } from 'firebase/firestore';

/**
 * Hook optimizado que obtiene estadísticas de zona desde las estadísticas precalculadas
 * ✅ Ultra rápido - lee 1 solo documento en lugar de consultar votos
 * ✅ Tiempo real - se actualiza automáticamente
 * ✅ Usa datos precalculados de la Cloud Function
 */
export const useEstadisticasPorZona = (zonaCodigo, parroquiaId = null) => {
    const [estadisticasZona, setEstadisticasZona] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Solo ejecutar si tenemos una zona específica seleccionada
        if (!zonaCodigo || zonaCodigo === 'all') {
            setEstadisticasZona(null);
            setLoading(false);
            return;
        }

        console.log(`🚀 Cargando estadísticas OPTIMIZADAS para zona ${zonaCodigo}...`);
        setLoading(true);

        // Referencia al documento de estadísticas precalculadas
        const estadisticasRef = doc(db, 'estadisticas_totales', 'estadisticas_generales');

        // Listener en tiempo real
        const unsubscribe = onSnapshot(
            estadisticasRef,
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();

                    // Buscar la zona específica en votosPorZona
                    const votosPorZona = data.votosPorZona || {};

                    // Crear clave de zona basada en parroquiaId y zonaCodigo
                    let zonaEncontrada = null;

                    if (parroquiaId) {
                        // Buscar con parroquia específica
                        const zonaKey = `${parroquiaId}_${zonaCodigo}`;
                        zonaEncontrada = votosPorZona[zonaKey];
                    } else {
                        // Buscar zona por código en cualquier parroquia
                        zonaEncontrada = Object.values(votosPorZona).find(zona =>
                            zona.codigo === parseInt(zonaCodigo)
                        );
                    }

                    if (zonaEncontrada) {
                        console.log('✅ Estadísticas de zona encontradas (OPTIMIZADAS):', zonaEncontrada);
                        setEstadisticasZona(zonaEncontrada);
                        setError(null);
                    } else {
                        console.log(`⚠️ No se encontraron estadísticas para zona ${zonaCodigo}`);
                        setEstadisticasZona({
                            nombre: `Zona ${zonaCodigo}`,
                            codigo: parseInt(zonaCodigo),
                            totalVotos: 0,
                            sufragantes: 0,
                            actas: 0,
                            actasRevisadas: 0,
                            actasNoRevisadas: 0,
                            porcentajeRevision: 0
                        });
                        setError(null);
                    }
                } else {
                    console.log('⚠️ No existe el documento de estadísticas');
                    setError('No se encontraron estadísticas. Asegúrate de que la Cloud Function esté funcionando.');
                }
                setLoading(false);
            },
            (err) => {
                console.error('❌ Error cargando estadísticas por zona:', err);
                setError(`Error: ${err.message}`);
                setLoading(false);
            }
        );

        return () => {
            console.log(`🔌 Desconectando listener de estadísticas zona ${zonaCodigo}`);
            unsubscribe();
        };
    }, [zonaCodigo, parroquiaId]);

    return {
        estadisticasZona,
        loading,
        error
    };
};