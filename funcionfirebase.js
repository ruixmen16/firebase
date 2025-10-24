const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Inicializar Firebase Admin
initializeApp();
const db = getFirestore();

// Trigger que se ejecuta cuando se crea, actualiza o elimina un documento en 'votos'
exports.actualizarEstadisticas = onDocumentWritten('votos/{votoId}', async (event) => {
    const change = event.data;
    const context = event;
    try {
        const estadisticasRef = db.collection('estadisticas_totales').doc('estadisticas_generales');

        // Usar transacción para evitar condiciones de carrera
        await db.runTransaction(async (transaction) => {
            const estadisticasDoc = await transaction.get(estadisticasRef);

            // Inicializar documento de estadísticas si no existe
            if (!estadisticasDoc.exists) {
                const estadisticasIniciales = {
                    totalActas: 0,
                    totalActasRevisadas: 0,
                    totalActasNoRevisadas: 0,
                    totalSufragantes: 0,
                    totalVotosBlancos: 0,
                    totalVotosNulos: 0,
                    totalVotosValidos: 0,
                    votosPorCandidato: {},
                    votosPorParroquia: {},
                    votosPorCircunscripcion: {},
                    votosPorZona: {},
                    fechaUltimaActualizacion: FieldValue.serverTimestamp(),
                    version: 1
                };
                transaction.set(estadisticasRef, estadisticasIniciales);
                return;
            }

            const estadisticas = estadisticasDoc.data();
            const datosAntes = change.before.exists ? change.before.data() : null;
            const datosNuevos = change.after.exists ? change.after.data() : null;

            // Calcular diferencias
            let deltaActas = 0;
            let deltaActasRevisadas = 0;
            let deltaActasNoRevisadas = 0;
            let deltaSufragantes = 0;
            let deltaVotosBlancos = 0;
            let deltaVotosNulos = 0;
            let deltaCandidatos = {};
            let deltaParroquias = {};
            let deltaCircunscripciones = {};
            let deltaZonas = {};

            // Si es una creación
            if (!datosAntes && datosNuevos) {
                deltaActas = 1;
                // Verificar si el acta está revisada
                if (datosNuevos.revisado === true) {
                    deltaActasRevisadas = 1;
                } else {
                    deltaActasNoRevisadas = 1;
                }
                deltaSufragantes = datosNuevos.totalSufragantes || 0;
                deltaVotosBlancos = datosNuevos.votosBlancos || 0;
                deltaVotosNulos = datosNuevos.votosNulos || 0;

                // Procesar votos por candidato
                if (datosNuevos.votos && Array.isArray(datosNuevos.votos)) {
                    datosNuevos.votos.forEach(voto => {
                        deltaCandidatos[voto.candidatoId] = (deltaCandidatos[voto.candidatoId] || 0) + voto.numeroVotos;
                    });
                }

                // Procesar por parroquia
                if (datosNuevos.parroquiaId) {
                    deltaParroquias[datosNuevos.parroquiaId] = {
                        nombre: datosNuevos.parroquiaNombre,
                        parroquiaIdSvg: datosNuevos.parroquiaIdSvg || '',
                        totalVotos: calcularTotalVotos(datosNuevos),
                        sufragantes: datosNuevos.totalSufragantes || 0,
                        actas: 1,
                        actasRevisadas: datosNuevos.revisado === true ? 1 : 0,
                        actasNoRevisadas: datosNuevos.revisado === true ? 0 : 1
                    };
                }

                // Procesar por circunscripción
                if (datosNuevos.circunscripcionCodigo !== undefined) {
                    deltaCircunscripciones[datosNuevos.circunscripcionCodigo] = {
                        totalVotos: calcularTotalVotos(datosNuevos),
                        sufragantes: datosNuevos.totalSufragantes || 0,
                        actas: 1,
                        actasRevisadas: datosNuevos.revisado === true ? 1 : 0,
                        actasNoRevisadas: datosNuevos.revisado === true ? 0 : 1
                    };
                }

                // Procesar por zona
                if (datosNuevos.zonaCodigo !== undefined) {
                    const zonaKey = `${datosNuevos.parroquiaId || 'sin_parroquia'}_${datosNuevos.zonaCodigo}`;
                    deltaZonas[zonaKey] = {
                        nombre: datosNuevos.zonaNombre || `Zona ${datosNuevos.zonaCodigo}`,
                        codigo: datosNuevos.zonaCodigo,
                        parroquiaId: datosNuevos.parroquiaId,
                        parroquiaNombre: datosNuevos.parroquiaNombre,
                        parroquiaIdSvg: datosNuevos.parroquiaIdSvg || '',
                        totalVotos: calcularTotalVotos(datosNuevos),
                        sufragantes: datosNuevos.totalSufragantes || 0,
                        actas: 1,
                        actasRevisadas: datosNuevos.revisado === true ? 1 : 0,
                        actasNoRevisadas: datosNuevos.revisado === true ? 0 : 1
                    };
                }
            }

            // Si es una eliminación
            else if (datosAntes && !datosNuevos) {
                deltaActas = -1;
                // Verificar si el acta eliminada estaba revisada
                if (datosAntes.revisado === true) {
                    deltaActasRevisadas = -1;
                } else {
                    deltaActasNoRevisadas = -1;
                }
                deltaSufragantes = -(datosAntes.totalSufragantes || 0);
                deltaVotosBlancos = -(datosAntes.votosBlancos || 0);
                deltaVotosNulos = -(datosAntes.votosNulos || 0);

                // Restar votos por candidato
                if (datosAntes.votos && Array.isArray(datosAntes.votos)) {
                    datosAntes.votos.forEach(voto => {
                        deltaCandidatos[voto.candidatoId] = (deltaCandidatos[voto.candidatoId] || 0) - voto.numeroVotos;
                    });
                }

                // Restar por parroquia
                if (datosAntes.parroquiaId) {
                    deltaParroquias[datosAntes.parroquiaId] = {
                        nombre: datosAntes.parroquiaNombre,
                        parroquiaIdSvg: datosAntes.parroquiaIdSvg || '',
                        totalVotos: -calcularTotalVotos(datosAntes),
                        sufragantes: -(datosAntes.totalSufragantes || 0),
                        actas: -1,
                        actasRevisadas: datosAntes.revisado === true ? -1 : 0,
                        actasNoRevisadas: datosAntes.revisado === true ? 0 : -1
                    };
                }

                // Restar por circunscripción
                if (datosAntes.circunscripcionCodigo !== undefined) {
                    deltaCircunscripciones[datosAntes.circunscripcionCodigo] = {
                        totalVotos: -calcularTotalVotos(datosAntes),
                        sufragantes: -(datosAntes.totalSufragantes || 0),
                        actas: -1,
                        actasRevisadas: datosAntes.revisado === true ? -1 : 0,
                        actasNoRevisadas: datosAntes.revisado === true ? 0 : -1
                    };
                }

                // Restar por zona
                if (datosAntes.zonaCodigo !== undefined) {
                    const zonaKey = `${datosAntes.parroquiaId || 'sin_parroquia'}_${datosAntes.zonaCodigo}`;
                    deltaZonas[zonaKey] = {
                        nombre: datosAntes.zonaNombre || `Zona ${datosAntes.zonaCodigo}`,
                        codigo: datosAntes.zonaCodigo,
                        parroquiaId: datosAntes.parroquiaId,
                        parroquiaNombre: datosAntes.parroquiaNombre,
                        parroquiaIdSvg: datosAntes.parroquiaIdSvg || '',
                        totalVotos: -calcularTotalVotos(datosAntes),
                        sufragantes: -(datosAntes.totalSufragantes || 0),
                        actas: -1,
                        actasRevisadas: datosAntes.revisado === true ? -1 : 0,
                        actasNoRevisadas: datosAntes.revisado === true ? 0 : -1
                    };
                }
            }

            // Si es una actualización
            else if (datosAntes && datosNuevos) {
                // Verificar cambios en el estado de revisión
                const revisadoAntes = datosAntes.revisado === true;
                const revisadoNuevos = datosNuevos.revisado === true;

                if (revisadoAntes !== revisadoNuevos) {
                    if (revisadoNuevos) {
                        // Cambió de no revisado a revisado
                        deltaActasRevisadas = 1;
                        deltaActasNoRevisadas = -1;
                    } else {
                        // Cambió de revisado a no revisado
                        deltaActasRevisadas = -1;
                        deltaActasNoRevisadas = 1;
                    }
                }

                // Calcular diferencias entre antes y después
                deltaSufragantes = (datosNuevos.totalSufragantes || 0) - (datosAntes.totalSufragantes || 0);
                deltaVotosBlancos = (datosNuevos.votosBlancos || 0) - (datosAntes.votosBlancos || 0);
                deltaVotosNulos = (datosNuevos.votosNulos || 0) - (datosAntes.votosNulos || 0);

                // Calcular diferencias en votos por candidato
                const votosAntesMap = {};
                const votosNuevosMap = {};

                if (datosAntes.votos) {
                    datosAntes.votos.forEach(voto => {
                        votosAntesMap[voto.candidatoId] = voto.numeroVotos;
                    });
                }

                if (datosNuevos.votos) {
                    datosNuevos.votos.forEach(voto => {
                        votosNuevosMap[voto.candidatoId] = voto.numeroVotos;
                    });
                }

                // Calcular deltas por candidato
                const todosCandidatos = new Set([...Object.keys(votosAntesMap), ...Object.keys(votosNuevosMap)]);
                todosCandidatos.forEach(candidatoId => {
                    const antes = votosAntesMap[candidatoId] || 0;
                    const nuevos = votosNuevosMap[candidatoId] || 0;
                    deltaCandidatos[candidatoId] = nuevos - antes;
                });

                // Manejar cambios en parroquia y circunscripción
                const parroquiaAntes = datosAntes.parroquiaId;
                const parroquiaNuevos = datosNuevos.parroquiaId;
                const circunscripcionAntes = datosAntes.circunscripcionCodigo;
                const circunscripcionNuevos = datosNuevos.circunscripcionCodigo;

                // Si cambió la parroquia
                if (parroquiaAntes !== parroquiaNuevos) {
                    // Restar de la parroquia anterior
                    if (parroquiaAntes) {
                        deltaParroquias[parroquiaAntes] = {
                            nombre: datosAntes.parroquiaNombre,
                            parroquiaIdSvg: datosAntes.parroquiaIdSvg || '',
                            totalVotos: -calcularTotalVotos(datosAntes),
                            sufragantes: -(datosAntes.totalSufragantes || 0),
                            actas: -1,
                            actasRevisadas: datosAntes.revisado === true ? -1 : 0,
                            actasNoRevisadas: datosAntes.revisado === true ? 0 : -1
                        };
                    }
                    // Sumar a la parroquia nueva
                    if (parroquiaNuevos) {
                        deltaParroquias[parroquiaNuevos] = {
                            nombre: datosNuevos.parroquiaNombre,
                            parroquiaIdSvg: datosNuevos.parroquiaIdSvg || '',
                            totalVotos: calcularTotalVotos(datosNuevos),
                            sufragantes: datosNuevos.totalSufragantes || 0,
                            actas: 1,
                            actasRevisadas: datosNuevos.revisado === true ? 1 : 0,
                            actasNoRevisadas: datosNuevos.revisado === true ? 0 : 1
                        };
                    }
                } else if (parroquiaNuevos) {
                    // Misma parroquia, solo calcular diferencias
                    deltaParroquias[parroquiaNuevos] = {
                        nombre: datosNuevos.parroquiaNombre,
                        parroquiaIdSvg: datosNuevos.parroquiaIdSvg || '',
                        totalVotos: calcularTotalVotos(datosNuevos) - calcularTotalVotos(datosAntes),
                        sufragantes: deltaSufragantes,
                        actas: 0,
                        actasRevisadas: revisadoNuevos && !revisadoAntes ? 1 : (!revisadoNuevos && revisadoAntes ? -1 : 0),
                        actasNoRevisadas: !revisadoNuevos && revisadoAntes ? 1 : (revisadoNuevos && !revisadoAntes ? -1 : 0)
                    };
                }

                // Si cambió la circunscripción
                if (circunscripcionAntes !== circunscripcionNuevos) {
                    // Restar de la circunscripción anterior
                    if (circunscripcionAntes !== undefined) {
                        deltaCircunscripciones[circunscripcionAntes] = {
                            totalVotos: -calcularTotalVotos(datosAntes),
                            sufragantes: -(datosAntes.totalSufragantes || 0),
                            actas: -1,
                            actasRevisadas: datosAntes.revisado === true ? -1 : 0,
                            actasNoRevisadas: datosAntes.revisado === true ? 0 : -1
                        };
                    }
                    // Sumar a la circunscripción nueva
                    if (circunscripcionNuevos !== undefined) {
                        deltaCircunscripciones[circunscripcionNuevos] = {
                            totalVotos: calcularTotalVotos(datosNuevos),
                            sufragantes: datosNuevos.totalSufragantes || 0,
                            actas: 1,
                            actasRevisadas: datosNuevos.revisado === true ? 1 : 0,
                            actasNoRevisadas: datosNuevos.revisado === true ? 0 : 1
                        };
                    }
                } else if (circunscripcionNuevos !== undefined) {
                    // Misma circunscripción, solo calcular diferencias
                    deltaCircunscripciones[circunscripcionNuevos] = {
                        totalVotos: calcularTotalVotos(datosNuevos) - calcularTotalVotos(datosAntes),
                        sufragantes: deltaSufragantes,
                        actas: 0,
                        actasRevisadas: revisadoNuevos && !revisadoAntes ? 1 : (!revisadoNuevos && revisadoAntes ? -1 : 0),
                        actasNoRevisadas: !revisadoNuevos && revisadoAntes ? 1 : (revisadoNuevos && !revisadoAntes ? -1 : 0)
                    };
                }

                // Manejar cambios en zona
                const zonaAntes = datosAntes.zonaCodigo;
                const zonaNuevos = datosNuevos.zonaCodigo;
                const zonaKeyAntes = `${datosAntes.parroquiaId || 'sin_parroquia'}_${zonaAntes}`;
                const zonaKeyNuevos = `${datosNuevos.parroquiaId || 'sin_parroquia'}_${zonaNuevos}`;

                // Si cambió la zona o la parroquia (afecta la clave de zona)
                if (zonaKeyAntes !== zonaKeyNuevos) {
                    // Restar de la zona anterior
                    if (zonaAntes !== undefined) {
                        deltaZonas[zonaKeyAntes] = {
                            nombre: datosAntes.zonaNombre || `Zona ${zonaAntes}`,
                            codigo: zonaAntes,
                            parroquiaId: datosAntes.parroquiaId,
                            parroquiaNombre: datosAntes.parroquiaNombre,
                            parroquiaIdSvg: datosAntes.parroquiaIdSvg || '',
                            totalVotos: -calcularTotalVotos(datosAntes),
                            sufragantes: -(datosAntes.totalSufragantes || 0),
                            actas: -1,
                            actasRevisadas: datosAntes.revisado === true ? -1 : 0,
                            actasNoRevisadas: datosAntes.revisado === true ? 0 : -1
                        };
                    }
                    // Sumar a la zona nueva
                    if (zonaNuevos !== undefined) {
                        deltaZonas[zonaKeyNuevos] = {
                            nombre: datosNuevos.zonaNombre || `Zona ${zonaNuevos}`,
                            codigo: zonaNuevos,
                            parroquiaId: datosNuevos.parroquiaId,
                            parroquiaNombre: datosNuevos.parroquiaNombre,
                            parroquiaIdSvg: datosNuevos.parroquiaIdSvg || '',
                            totalVotos: calcularTotalVotos(datosNuevos),
                            sufragantes: datosNuevos.totalSufragantes || 0,
                            actas: 1,
                            actasRevisadas: datosNuevos.revisado === true ? 1 : 0,
                            actasNoRevisadas: datosNuevos.revisado === true ? 0 : 1
                        };
                    }
                } else if (zonaNuevos !== undefined) {
                    // Misma zona, solo calcular diferencias
                    deltaZonas[zonaKeyNuevos] = {
                        nombre: datosNuevos.zonaNombre || `Zona ${zonaNuevos}`,
                        codigo: zonaNuevos,
                        parroquiaId: datosNuevos.parroquiaId,
                        parroquiaNombre: datosNuevos.parroquiaNombre,
                        parroquiaIdSvg: datosNuevos.parroquiaIdSvg || '',
                        totalVotos: calcularTotalVotos(datosNuevos) - calcularTotalVotos(datosAntes),
                        sufragantes: deltaSufragantes,
                        actas: 0,
                        actasRevisadas: revisadoNuevos && !revisadoAntes ? 1 : (!revisadoNuevos && revisadoAntes ? -1 : 0),
                        actasNoRevisadas: !revisadoNuevos && revisadoAntes ? 1 : (revisadoNuevos && !revisadoAntes ? -1 : 0)
                    };
                }
            }

            // Aplicar cambios a las estadísticas
            const nuevasEstadisticas = {
                totalActas: estadisticas.totalActas + deltaActas,
                totalActasRevisadas: (estadisticas.totalActasRevisadas || 0) + deltaActasRevisadas,
                totalActasNoRevisadas: (estadisticas.totalActasNoRevisadas || 0) + deltaActasNoRevisadas,
                totalSufragantes: estadisticas.totalSufragantes + deltaSufragantes,
                totalVotosBlancos: estadisticas.totalVotosBlancos + deltaVotosBlancos,
                totalVotosNulos: estadisticas.totalVotosNulos + deltaVotosNulos,
                fechaUltimaActualizacion: FieldValue.serverTimestamp(),
                version: (estadisticas.version || 0) + 1
            };

            // Actualizar votos por candidato
            const votosPorCandidato = { ...estadisticas.votosPorCandidato };
            Object.entries(deltaCandidatos).forEach(([candidatoId, delta]) => {
                if (!votosPorCandidato[candidatoId]) {
                    votosPorCandidato[candidatoId] = {
                        nombre: obtenerNombreCandidato(candidatoId, datosNuevos || datosAntes),
                        votos: 0
                    };
                }
                votosPorCandidato[candidatoId].votos += delta;
            });
            nuevasEstadisticas.votosPorCandidato = votosPorCandidato;

            // Actualizar estadísticas por parroquia
            const votosPorParroquia = { ...estadisticas.votosPorParroquia };
            Object.entries(deltaParroquias).forEach(([parroquiaId, delta]) => {
                if (!votosPorParroquia[parroquiaId]) {
                    votosPorParroquia[parroquiaId] = {
                        nombre: delta.nombre,
                        parroquiaIdSvg: delta.parroquiaIdSvg || '',
                        totalVotos: 0,
                        sufragantes: 0,
                        actas: 0,
                        actasRevisadas: 0,
                        actasNoRevisadas: 0
                    };
                }
                // Actualizar valores (conservar parroquiaIdSvg existente si delta no lo tiene)
                if (delta.parroquiaIdSvg) {
                    votosPorParroquia[parroquiaId].parroquiaIdSvg = delta.parroquiaIdSvg;
                }
                votosPorParroquia[parroquiaId].totalVotos += delta.totalVotos;
                votosPorParroquia[parroquiaId].sufragantes += delta.sufragantes;
                votosPorParroquia[parroquiaId].actas += delta.actas;
                votosPorParroquia[parroquiaId].actasRevisadas += delta.actasRevisadas || 0;
                votosPorParroquia[parroquiaId].actasNoRevisadas += delta.actasNoRevisadas || 0;

                // Calcular porcentaje de revisión por parroquia
                const totalActasParroquia = votosPorParroquia[parroquiaId].actas;
                votosPorParroquia[parroquiaId].porcentajeRevision = totalActasParroquia > 0 ?
                    Math.round((votosPorParroquia[parroquiaId].actasRevisadas / totalActasParroquia) * 100) : 0;
            });
            nuevasEstadisticas.votosPorParroquia = votosPorParroquia;

            // Actualizar estadísticas por circunscripción
            const votosPorCircunscripcion = { ...estadisticas.votosPorCircunscripcion };
            Object.entries(deltaCircunscripciones).forEach(([circunscripcionId, delta]) => {
                if (!votosPorCircunscripcion[circunscripcionId]) {
                    votosPorCircunscripcion[circunscripcionId] = {
                        totalVotos: 0,
                        sufragantes: 0,
                        actas: 0,
                        actasRevisadas: 0,
                        actasNoRevisadas: 0
                    };
                }
                votosPorCircunscripcion[circunscripcionId].totalVotos += delta.totalVotos;
                votosPorCircunscripcion[circunscripcionId].sufragantes += delta.sufragantes;
                votosPorCircunscripcion[circunscripcionId].actas += delta.actas;
                votosPorCircunscripcion[circunscripcionId].actasRevisadas += delta.actasRevisadas || 0;
                votosPorCircunscripcion[circunscripcionId].actasNoRevisadas += delta.actasNoRevisadas || 0;
            });
            nuevasEstadisticas.votosPorCircunscripcion = votosPorCircunscripcion;

            // Actualizar estadísticas por zona
            const votosPorZona = { ...estadisticas.votosPorZona };
            Object.entries(deltaZonas).forEach(([zonaKey, delta]) => {
                if (!votosPorZona[zonaKey]) {
                    votosPorZona[zonaKey] = {
                        nombre: delta.nombre,
                        codigo: delta.codigo,
                        parroquiaId: delta.parroquiaId,
                        parroquiaNombre: delta.parroquiaNombre,
                        parroquiaIdSvg: delta.parroquiaIdSvg || '',
                        totalVotos: 0,
                        sufragantes: 0,
                        actas: 0,
                        actasRevisadas: 0,
                        actasNoRevisadas: 0
                    };
                }
                // Actualizar valores
                if (delta.parroquiaIdSvg) {
                    votosPorZona[zonaKey].parroquiaIdSvg = delta.parroquiaIdSvg;
                }
                votosPorZona[zonaKey].totalVotos += delta.totalVotos;
                votosPorZona[zonaKey].sufragantes += delta.sufragantes;
                votosPorZona[zonaKey].actas += delta.actas;
                votosPorZona[zonaKey].actasRevisadas += delta.actasRevisadas || 0;
                votosPorZona[zonaKey].actasNoRevisadas += delta.actasNoRevisadas || 0;

                // Calcular porcentaje de revisión por zona
                const totalActasZona = votosPorZona[zonaKey].actas;
                votosPorZona[zonaKey].porcentajeRevision = totalActasZona > 0 ?
                    Math.round((votosPorZona[zonaKey].actasRevisadas / totalActasZona) * 100) : 0;
            });
            nuevasEstadisticas.votosPorZona = votosPorZona;

            // Calcular total de votos válidos
            nuevasEstadisticas.totalVotosValidos = Object.values(votosPorCandidato)
                .reduce((total, candidato) => total + candidato.votos, 0);

            transaction.update(estadisticasRef, nuevasEstadisticas);
        });

        console.log(`Estadísticas actualizadas para el voto: ${context.params.votoId}`);
    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
        throw error;
    }
});

// Funciones auxiliares
function calcularTotalVotos(voto) {
    let total = (voto.votosBlancos || 0) + (voto.votosNulos || 0);
    if (voto.votos && Array.isArray(voto.votos)) {
        total += voto.votos.reduce((sum, v) => sum + v.numeroVotos, 0);
    }
    return total;
}

function obtenerNombreCandidato(candidatoId, datosVoto) {
    if (datosVoto && datosVoto.votos) {
        const candidato = datosVoto.votos.find(v => v.candidatoId.toString() === candidatoId.toString());
        return candidato ? candidato.candidatoNombre : `Candidato ${candidatoId}`;
    }
    return `Candidato ${candidatoId}`;
}