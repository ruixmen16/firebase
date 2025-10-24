// src/hooks/useActasPorZona.js
import { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

/**
 * Hook que obtiene todas las actas de una zona específica
 * ✅ Filtra por zonaCodigo y opcionalmente por parroquiaIdSvg
 * ✅ Tiempo real - se actualiza automáticamente
 * ✅ Muestra información de junta y género para cada acta
 */
export const useActasPorZona = (zonaCodigo, parroquiaIdSvg = null) => {
    const [actas, setActas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [estadisticasZona, setEstadisticasZona] = useState(null);

    useEffect(() => {
        // Solo ejecutar si tenemos una zona específica seleccionada
        if (!zonaCodigo || zonaCodigo === 'all') {
            setActas([]);
            setEstadisticasZona(null);
            setLoading(false);
            return;
        }

        console.log(`🔍 Cargando actas para zona ${zonaCodigo}...`);
        setLoading(true);

        // Crear query base por zona
        let q = query(
            collection(db, 'votos'),
            where('zonaCodigo', '==', parseInt(zonaCodigo))
        );

        // Si también tenemos parroquia específica, agregar filtro
        if (parroquiaIdSvg && parroquiaIdSvg !== 'all') {
            q = query(
                collection(db, 'votos'),
                where('zonaCodigo', '==', parseInt(zonaCodigo)),
                where('parroquiaIdSvg', '==', parroquiaIdSvg)
            );
        }

        // Listener en tiempo real
        const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
                const actasData = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    actasData.push({
                        id: doc.id,
                        ...data,
                        // Calcular datos adicionales para mostrar
                        juntaGenero: `${data.junta || 'S/N'}${data.genero || ''}`,
                        totalVotos: (data.votos || []).reduce((sum, voto) => sum + (parseInt(voto.numeroVotos) || 0), 0)
                    });
                });

                // Ordenar por junta y luego por género
                actasData.sort((a, b) => {
                    const juntaA = parseInt(a.junta) || 999;
                    const juntaB = parseInt(b.junta) || 999;
                    if (juntaA !== juntaB) return juntaA - juntaB;
                    return (a.genero || '').localeCompare(b.genero || '');
                });

                setActas(actasData);

                // Calcular estadísticas de la zona
                const stats = calcularEstadisticasZona(actasData);
                setEstadisticasZona(stats);

                console.log(`✅ ${actasData.length} actas cargadas para zona ${zonaCodigo}`);
                setError(null);
                setLoading(false);
            },
            (err) => {
                console.error('❌ Error cargando actas por zona:', err);
                setError(`Error: ${err.message}`);
                setLoading(false);
            }
        );

        return () => {
            console.log(`🔌 Desconectando listener de zona ${zonaCodigo}`);
            unsubscribe();
        };
    }, [zonaCodigo, parroquiaIdSvg]);

    // Función para calcular estadísticas de la zona
    const calcularEstadisticasZona = (actasData) => {
        if (!actasData || actasData.length === 0) {
            return {
                totalActas: 0,
                totalSufragantes: 0,
                totalVotos: 0,
                totalVotosBlancos: 0,
                totalVotosNulos: 0,
                actasRevisadas: 0,
                actasNoRevisadas: 0,
                porcentajeRevision: 0,
                votosPorCandidato: {}
            };
        }

        let totalActas = actasData.length;
        let totalSufragantes = 0;
        let totalVotos = 0;
        let totalVotosBlancos = 0;
        let totalVotosNulos = 0;
        let actasRevisadas = 0;
        let actasNoRevisadas = 0;
        const votosPorCandidato = {};

        actasData.forEach(acta => {
            // Contar sufragantes
            totalSufragantes += parseInt(acta.totalSufragantes) || 0;

            // Contar votos blancos y nulos
            totalVotosBlancos += parseInt(acta.votosBlancos) || 0;
            totalVotosNulos += parseInt(acta.votosNulos) || 0;

            // Contar revisado/no revisado
            if (acta.revisado === true) {
                actasRevisadas++;
            } else {
                actasNoRevisadas++;
            }

            // Contar votos por candidato
            if (acta.votos && Array.isArray(acta.votos)) {
                acta.votos.forEach(voto => {
                    const candidatoId = voto.candidatoId;
                    const numeroVotos = parseInt(voto.numeroVotos) || 0;
                    totalVotos += numeroVotos;

                    if (!votosPorCandidato[candidatoId]) {
                        votosPorCandidato[candidatoId] = {
                            nombre: voto.candidatoNombre || `Candidato ${candidatoId}`,
                            votos: 0
                        };
                    }
                    votosPorCandidato[candidatoId].votos += numeroVotos;
                });
            }
        });

        return {
            totalActas,
            totalSufragantes,
            totalVotos,
            totalVotosBlancos,
            totalVotosNulos,
            actasRevisadas,
            actasNoRevisadas,
            porcentajeRevision: totalActas > 0 ? Math.round((actasRevisadas / totalActas) * 100) : 0,
            votosPorCandidato
        };
    };

    // Función para obtener candidatos ordenados
    const getCandidatosOrdenados = () => {
        if (!estadisticasZona || !estadisticasZona.votosPorCandidato) return [];

        return Object.entries(estadisticasZona.votosPorCandidato)
            .map(([id, data]) => ({
                id,
                nombre: data.nombre,
                totalVotos: data.votos || 0
            }))
            .filter(candidato => candidato.totalVotos > 0)
            .sort((a, b) => b.totalVotos - a.totalVotos);
    };

    return {
        actas,
        estadisticasZona,
        candidatos: getCandidatosOrdenados(),
        loading,
        error
    };
};