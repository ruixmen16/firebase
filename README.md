# 🗳️ Sistema Electoral Firebase

Una aplicación web moderna para votación y chat en tiempo real, construida con React, Firebase y React Bootstrap.

## 🚀 Características

- **Autenticación con Google**: Login seguro usando Firebase Auth
- **Chat en Tiempo Real**: Mensajería con soporte para imágenes
- **Sistema de Votación**: Dashboard electoral con resultados en vivo
- **Diseño Responsive**: Interface optimizada para todos los dispositivos
- **Arquitectura Escalable**: Separación clara de responsabilidades

## 🛠️ Tecnologías

- **Frontend**: React 19.1.1 + Vite 7.1.7
- **UI**: React Bootstrap + Bootstrap 5
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Hosting**: Firebase Hosting

## 📁 Estructura del Proyecto

```
src/
├── components/           # Componentes React reutilizables
│   ├── ChatComponent.jsx    # Componente de chat
│   ├── Dashboard.jsx        # Dashboard electoral
│   ├── Header.jsx           # Encabezado con navegación
│   ├── LoginForm.jsx        # Formulario de login
│   ├── NavigationBar.jsx    # Barra de navegación
│   ├── TabNavigation.jsx    # Navegación por pestañas
│   ├── ErrorBoundary.jsx    # Manejo de errores
│   ├── LoadingSpinner.jsx   # Indicador de carga
│   └── index.js             # Barrel exports
├── hooks/                # Custom hooks para lógica de negocio
│   ├── useAuth.js           # Hook de autenticación
│   ├── useChat.js           # Hook para funcionalidad de chat
│   ├── useDashboard.js      # Hook para dashboard electoral
│   └── index.js             # Barrel exports
├── App.jsx              # Componente principal
├── App.css              # Estilos base
├── firebase-config.js   # Configuración de Firebase
└── main.jsx            # Punto de entrada
```

## 🎯 Mejores Prácticas Implementadas

### ✅ Arquitectura y Organización
- **Separación de responsabilidades**: Componentes, hooks y configuración separados
- **Custom hooks**: Lógica de negocio extraída en hooks reutilizables
- **Barrel exports**: Imports limpios usando archivos index.js
- **Estructura de carpetas clara**: Organización lógica del código

### ✅ Rendimiento
- **React.memo**: Optimización de renderizado en componentes puros
- **Custom hooks**: Evitar re-renders innecesarios
- **Lazy loading**: Componentes cargados según necesidad

### ✅ Experiencia de Usuario
- **Error boundaries**: Manejo elegante de errores
- **Loading states**: Indicadores de carga consistentes
- **Responsive design**: Funciona en todos los dispositivos
- **Feedback visual**: Estados de carga y confirmaciones

### ✅ Mantenibilidad
- **Código modular**: Fácil de mantener y extender
- **Tipado implícito**: Código más robusto
- **Comentarios descriptivos**: Código autodocumentado
- **Convenciones consistentes**: Nomenclatura y estructura uniforme

## 🔧 Comandos Disponibles

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de producción
npm run preview

# Desplegar a Firebase
npm run deploy
```

## 🏗️ Configuración de Firebase

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Authentication (Google provider)
3. Crear base de datos Firestore
4. Habilitar Storage (opcional, para imágenes)
5. Configurar las variables en `firebase-config.js`

## 📊 Funcionalidades

### Autenticación
- Login con Google
- Persistencia de sesión
- Logout con limpieza de datos

### Chat
- Mensajes en tiempo real
- Soporte para imágenes
- Información del usuario (foto, nombre)
- Límite de caracteres
- Ordenamiento cronológico

### Dashboard Electoral
- Votación en tiempo real
- Estadísticas dinámicas
- Prevención de voto doble
- Visualización con gráficos
- Resultados porcentuales

## 🎨 Diseño

- **Bootstrap 5**: Framework CSS moderno
- **React Bootstrap**: Componentes React nativos
- **Diseño limpio**: Interface intuitiva y profesional
- **Consistencia visual**: Colores y tipografía coherente

## 🚀 Próximas Mejoras

- [ ] Implementar TypeScript
- [ ] Agregar tests unitarios
- [ ] Optimizar imágenes automáticamente
- [ ] Implementar notificaciones push
- [ ] Agregar más estadísticas al dashboard
- [ ] Implementar modo offline

## 📝 Notas de Desarrollo

Este proyecto sigue las mejores prácticas de React y Firebase:
- Hooks personalizados para reutilización de lógica
- Manejo robusto de estados y errores
- Arquitectura escalable y mantenible
- Optimización de rendimiento con React.memo
- Error boundaries para experiencia de usuario consistente

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.