# 🗳️ Sistema de Conteo de Votos Firebase

Aplicación web orientada al seguimiento, revisión y visualización de resultados electorales, construida con React, Firebase y React Bootstrap.

## 🚀 Características principales

- **Autenticación con Google**: acceso seguro para usuarios autorizados.
- **Dashboard electoral**: visualización de resultados generales y por candidato.
- **Conteo de votos**: seguimiento de votos por mesa, parroquia y circunscripción.
- **Revisión de actas**: validación de actas y estados de revisión.
- **Mapa interactivo**: filtros por zona para analizar resultados en una vista geográfica.
- **Diseño responsive**: interfaz funcional en escritorio y dispositivos móviles.

## 🛠️ Tecnologías

- **Frontend**: React 19.1.1 + Vite 7.1.7
- **UI**: React Bootstrap + Bootstrap 5
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Hosting**: Firebase Hosting

## 📁 Estructura del proyecto

```
src/
├── components/                # Componentes React reutilizables
│   ├── Dashboard.jsx         # Panel principal de resultados electorales
│   ├── PortoviejoMap.jsx     # Mapa interactivo con filtros por zona
│   ├── ActasPorZona.jsx      # Vista de actas agrupadas por zona
│   ├── Header.jsx            # Encabezado con navegación
│   ├── LoginForm.jsx         # Formulario de acceso
│   ├── NavigationBar.jsx     # Barra de navegación
│   ├── ErrorBoundary.jsx     # Manejo de errores
│   ├── LoadingSpinner.jsx    # Indicador de carga
│   └── index.js              # Barrel exports
├── hooks/                     # Lógica reutilizable para estadísticas y votos
│   ├── useDashboard.js       # Gestión de votos y detalle de actas
│   ├── useEstadisticasOptimizadas.js
│   ├── useEstadisticasPorZona.js
│   ├── useEstadisticasSelects.js
│   └── index.js
├── App.jsx                   # Componente principal
├── App.css                   # Estilos base
├── firebase-config.js        # Configuración de Firebase
└── main.jsx                  # Punto de entrada
```

## 📊 Funcionalidades del sistema

### Autenticación
- Login con Google
- Persistencia de sesión
- Logout con limpieza de datos

### Conteo y seguimiento de votos
- Visualización de votos por candidato
- Total de votos válidos y generales
- Seguimiento por parroquia y circunscripción
- Revisión y edición de actas registradas
- Control de actas validadas y sin validar

### Dashboard electoral
- Resultados en tiempo real desde Firebase
- Estadísticas dinámicas por zona
- Indicadores de avance de revisión
- Detalle de actas con votos por candidato

## 🎨 Diseño

- **Bootstrap 5**: framework CSS moderno
- **React Bootstrap**: componentes React nativos
- **Diseño limpio**: interfaz intuitiva y profesional
- **Consistencia visual**: colores y tipografía coherentes

## 🔧 Comandos disponibles

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de producción
npm run preview
```

## 🏗️ Configuración de Firebase

1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Authentication con Google
3. Crear una base de datos Firestore
4. Habilitar Storage si se requieren imágenes de actas
5. Configurar las variables en `firebase-config.js`

## 🚀 Próximas mejoras

- [ ] Implementar exportación de resultados en PDF/Excel
- [ ] Agregar más métricas de participación y escrutinio
- [ ] Mejorar la auditoría de cambios en actas
- [ ] Implementar notificaciones de revisión pendiente
- [ ] Agregar pruebas automatizadas

## 📝 Notas de desarrollo

Este proyecto está enfocado en la administración y seguimiento electoral:
- Hooks personalizados para reutilización de lógica
- Manejo robusto de estados y errores
- Arquitectura escalable y mantenible
- Optimización de rendimiento para consultas de estadísticas
- Vistas orientadas al conteo, control y revisión de votos

## 🤝 Contribuir

1. Crear una rama para la mejora (`git checkout -b feature/mejora-electoral`)
2. Realizar los cambios
3. Commit (`git commit -m 'Agregar mejora electoral'`)
4. Push a la rama
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.