# 📱 Proyecto Electoral Android - Documentación Completa

## 📋 Resumen del Proyecto

**Objetivo:** Aplicación móvil para control electoral que funcione offline, permita capturar fotos de actas y seleccionar candidatos, con sincronización posterior cuando haya internet.

**Timeline:** 2 años para desarrollo completo
**Plataforma objetivo:** Android nativo (Android Studio + Kotlin)
**Backend:** Firebase (Firestore + Storage + Authentication)

---

## 🎯 Estado Actual - App Web Firebase (Completada)

### ✅ Funcionalidades Implementadas

1. **Autenticación Google**
   - Login/logout con Firebase Auth
   - Manejo de errores de almacenamiento del navegador
   - Guardado de datos de perfil (foto, nombre, email)

2. **Chat Familiar Tiempo Real**
   - Mensajes con texto e imágenes
   - Visualización de todos los mensajes familiares (sin filtro por usuario)
   - Fotos de perfil en cada mensaje (30px circular)
   - Timestamps en formato español

3. **Subida de Imágenes**
   - Validación de tipo y tamaño (máx 5MB)
   - Preview antes de enviar
   - Subida a Firebase Storage con URLs únicas
   - Thumbnails de 75px para optimización
   - Click para ver imagen completa

4. **Base de Datos**
   - Estructura en Firestore: colección "mensajes"
   - Campos: text, imageUrl, timestamp, userId, userName, userEmail, userPhoto
   - Listener en tiempo real con onSnapshot()
   - Ordenamiento por timestamp descendente

### 🏗️ Arquitectura Web Actual

```
firebase-nuevo-proyecto/
├── src/
│   ├── App.jsx (componente principal)
│   ├── firebase-config.js (configuración Firebase)
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── public/
├── package.json (React 19.1.1, Firebase 12.4.0, Vite 7.1.7)
├── vite.config.js
├── firebase.json (hosting config)
└── .gitignore
```

### 🔧 Funciones Clave Implementadas

#### Autenticación
```javascript
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};
```

#### Subida de Imágenes
```javascript
const uploadImage = async (file, userId) => {
  const timestamp = Date.now();
  const fileName = `images/${userId}/${timestamp}_${file.name}`;
  const storageRef = ref(storage, fileName);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
};
```

#### Guardado de Mensajes
```javascript
const saveMessage = async () => {
  let imageUrl = null;
  if (selectedImage) {
    imageUrl = await uploadImage(selectedImage, user.uid);
  }
  
  const userData = {
    text: message,
    imageUrl: imageUrl,
    timestamp: new Date(),
    userId: user.uid,
    userName: user.displayName || user.email?.split('@')[0] || 'Usuario sin nombre',
    userEmail: user.email || 'Email no disponible',
    userPhoto: user.photoURL || null
  };
  
  await addDoc(collection(db, "mensajes"), userData);
};
```

---

## 🎯 Objetivo Final - App Electoral Android

### 📱 Características Requeridas

1. **Funcionalidad Offline Completa**
   - Captura de fotos sin internet
   - Almacenamiento local de datos electorales
   - Selección de candidatos
   - Cola de sincronización automática

2. **Captura de Evidencias**
   - Múltiples fotos por registro (1-5 fotos)
   - Calidad optimizada para evidencia electoral
   - Metadatos de ubicación y timestamp

3. **Selección de Candidatos**
   - Radio buttons para 5 candidatos predefinidos:
     - César
     - Daniela
     - María
     - Tania
     - Diana

4. **Sincronización Inteligente**
   - Detectar conexión a internet
   - Subir datos pendientes automáticamente
   - Manejo de errores y reintentos
   - Indicadores de estado de sincronización

---

## 🛠️ Stack Tecnológico Android

### **Lenguajes y Frameworks**
- **Kotlin** (lenguaje principal)
- **Android SDK** (API level 24+ / Android 7.0+)
- **Jetpack Compose** (UI moderna) o **XML layouts** (tradicional)

### **Arquitectura**
- **MVVM** (Model-View-ViewModel)
- **Repository Pattern** (abstracción de datos)
- **Dependency Injection** con Hilt

### **Base de Datos Local**
- **Room Database** (SQLite wrapper)
- **SharedPreferences** (configuraciones)
- **Internal Storage** (archivos de imágenes)

### **Cámara y Multimedia**
- **CameraX** (captura de fotos moderna)
- **Glide/Coil** (carga de imágenes)
- **ExifInterface** (metadatos de fotos)

### **Red y Sincronización**
- **Retrofit** (API calls a Firebase)
- **WorkManager** (tareas en background)
- **Firebase SDK** (mismo backend)

### **Testing**
- **JUnit** (unit tests)
- **Espresso** (UI tests)
- **Mockito** (mocking)

---

## 📊 Modelo de Datos Android

### **Entidades Room**

```kotlin
// Tabla principal de votos
@Entity(tableName = "votos")
data class Voto(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val candidato: String, // César, Daniela, María, Tania, Diana
    val timestamp: Long = System.currentTimeMillis(),
    val ubicacion: String? = null,
    val observaciones: String = "",
    val sincronizado: Boolean = false,
    val fechaCreacion: Long = System.currentTimeMillis(),
    val usuarioId: String
)

// Tabla de fotos asociadas a votos
@Entity(
    tableName = "fotos_voto",
    foreignKeys = [ForeignKey(
        entity = Voto::class,
        parentColumns = ["id"],
        childColumns = ["votoId"],
        onDelete = ForeignKey.CASCADE
    )]
)
data class FotoVoto(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val votoId: String,
    val rutaLocal: String, // /storage/emulated/0/Android/data/.../files/fotos/
    val nombreArchivo: String,
    val urlFirebase: String? = null, // null hasta sincronizar
    val sincronizada: Boolean = false,
    val timestamp: Long = System.currentTimeMillis()
)

// Configuración de usuario
@Entity(tableName = "configuracion")
data class ConfiguracionUsuario(
    @PrimaryKey val id: String = "config_usuario",
    val nombreUsuario: String,
    val email: String,
    val fotoPerfilUrl: String? = null,
    val ultimaSincronizacion: Long? = null,
    val tokenFirebase: String? = null
)
```

### **DAOs (Data Access Objects)**

```kotlin
@Dao
interface VotoDao {
    @Query("SELECT * FROM votos ORDER BY timestamp DESC")
    suspend fun obtenerTodosLosVotos(): List<Voto>
    
    @Query("SELECT * FROM votos WHERE sincronizado = 0")
    suspend fun obtenerVotosNoSincronizados(): List<Voto>
    
    @Insert
    suspend fun insertarVoto(voto: Voto): Long
    
    @Update
    suspend fun actualizarVoto(voto: Voto)
    
    @Query("UPDATE votos SET sincronizado = 1 WHERE id = :votoId")
    suspend fun marcarComoSincronizado(votoId: String)
}

@Dao
interface FotoVotoDao {
    @Query("SELECT * FROM fotos_voto WHERE votoId = :votoId")
    suspend fun obtenerFotosPorVoto(votoId: String): List<FotoVoto>
    
    @Query("SELECT * FROM fotos_voto WHERE sincronizada = 0")
    suspend fun obtenerFotosNoSincronizadas(): List<FotoVoto>
    
    @Insert
    suspend fun insertarFoto(foto: FotoVoto)
    
    @Query("UPDATE fotos_voto SET urlFirebase = :url, sincronizada = 1 WHERE id = :fotoId")
    suspend fun marcarFotoComoSincronizada(fotoId: String, url: String)
}
```

---

## 🏗️ Arquitectura de la App Android

### **Estructura de Módulos**

```
app/
├── src/main/
│   ├── java/com/electoral/app/
│   │   ├── data/
│   │   │   ├── database/
│   │   │   │   ├── ElectoralDatabase.kt
│   │   │   │   ├── entities/ (Voto.kt, FotoVoto.kt, etc.)
│   │   │   │   └── daos/ (VotoDao.kt, FotoVotoDao.kt, etc.)
│   │   │   ├── repository/
│   │   │   │   ├── VotoRepository.kt
│   │   │   │   └── SincronizacionRepository.kt
│   │   │   ├── network/
│   │   │   │   ├── FirebaseService.kt
│   │   │   │   └── ApiModels.kt
│   │   │   └── local/
│   │   │       └── PreferenciasManager.kt
│   │   ├── domain/
│   │   │   ├── models/ (modelos de dominio)
│   │   │   └── usecases/ (casos de uso)
│   │   ├── presentation/
│   │   │   ├── ui/
│   │   │   │   ├── login/
│   │   │   │   ├── camera/
│   │   │   │   ├── candidatos/
│   │   │   │   └── historial/
│   │   │   └── viewmodels/
│   │   ├── di/ (Dependency Injection)
│   │   ├── utils/
│   │   └── workers/ (WorkManager tasks)
│   ├── res/
│   │   ├── layout/ (XML layouts si no usas Compose)
│   │   ├── drawable/
│   │   ├── values/
│   │   └── xml/ (network security config, etc.)
│   └── AndroidManifest.xml
├── build.gradle (módulo app)
└── proguard-rules.pro
```

### **Flujo Principal de la App**

1. **SplashActivity** → Verificar autenticación
2. **LoginActivity** → Autenticación Firebase (una vez)
3. **MainActivity** → Hub principal con 4 secciones:
   - 📷 **Nuevo Registro** (cámara + candidatos)
   - 📋 **Historial** (votos guardados)
   - 🔄 **Sincronización** (estado y manual sync)
   - ⚙️ **Configuración** (perfil, ajustes)

---

## 🔄 Sistema de Sincronización

### **WorkManager para Sync Automática**

```kotlin
class SincronizacionWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        return try {
            // 1. Verificar conexión
            if (!isNetworkAvailable()) return Result.retry()
            
            // 2. Subir fotos pendientes
            sincronizarFotos()
            
            // 3. Subir votos pendientes
            sincronizarVotos()
            
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
    
    private suspend fun sincronizarFotos() {
        val fotosNoSincronizadas = fotoDao.obtenerFotosNoSincronizadas()
        fotosNoSincronizadas.forEach { foto ->
            val url = firebaseStorage.subirFoto(File(foto.rutaLocal))
            fotoDao.marcarFotoComoSincronizada(foto.id, url)
        }
    }
    
    private suspend fun sincronizarVotos() {
        val votosNoSincronizados = votoDao.obtenerVotosNoSincronizados()
        votosNoSincronizados.forEach { voto ->
            firebaseFirestore.guardarVoto(voto)
            votoDao.marcarComoSincronizado(voto.id)
        }
    }
}
```

### **Configuración Automática**

```kotlin
// Programar sync automática cada 15 minutos cuando hay red
val syncRequest = PeriodicWorkRequestBuilder<SincronizacionWorker>(15, TimeUnit.MINUTES)
    .setConstraints(
        Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
    )
    .build()

WorkManager.getInstance(context).enqueue(syncRequest)
```

---

## 📱 Interfaz de Usuario

### **Pantallas Principales**

#### 1. **Pantalla de Nuevo Registro**
```
[Header: Electoral App 2025]
┌─────────────────────────────────┐
│ 📷 CAPTURAR EVIDENCIAS         │
├─────────────────────────────────┤
│ Fotos: [1] [2] [3] [4] [5]     │
│ (miniaturas de fotos capturadas)│
├─────────────────────────────────┤
│ SELECCIONAR CANDIDATO:          │
│ ○ César                         │
│ ○ Daniela                       │
│ ○ María                         │
│ ○ Tania                         │
│ ○ Diana                         │
├─────────────────────────────────┤
│ Observaciones:                  │
│ [___________________________]  │
├─────────────────────────────────┤
│ [📍] Ubicación automática       │
├─────────────────────────────────┤
│          [GUARDAR VOTO]         │
└─────────────────────────────────┘
```

#### 2. **Pantalla de Historial**
```
[Header: Historial de Registros]
┌─────────────────────────────────┐
│ 📋 VOTOS REGISTRADOS (25)       │
├─────────────────────────────────┤
│ 📅 21/10/2025 15:30            │
│ 👤 Candidato: María             │
│ 📷 Fotos: 3 | 🔄 Sincronizado   │
├─────────────────────────────────┤
│ 📅 21/10/2025 14:15            │
│ 👤 Candidato: César             │
│ 📷 Fotos: 2 | ⏳ Pendiente      │
├─────────────────────────────────┤
│ 📅 21/10/2025 13:45            │
│ 👤 Candidato: Daniela           │
│ 📷 Fotos: 4 | ❌ Error sync     │
└─────────────────────────────────┘
```

#### 3. **Pantalla de Sincronización**
```
[Header: Estado de Sincronización]
┌─────────────────────────────────┐
│ 🌐 CONEXIÓN: ✅ WiFi           │
├─────────────────────────────────┤
│ 📊 ESTADÍSTICAS:                │
│ • Total votos: 25               │
│ • Sincronizados: 20             │
│ • Pendientes: 5                 │
│ • Con errores: 0                │
├─────────────────────────────────┤
│ 📷 FOTOS:                       │
│ • Total: 67                     │
│ • Subidas: 58                   │
│ • Pendientes: 9                 │
├─────────────────────────────────┤
│ 🕒 Última sync: Hace 5 min      │
├─────────────────────────────────┤
│      [SINCRONIZAR AHORA]        │
└─────────────────────────────────┘
```

---

## 📋 Plan de Desarrollo (2 Años)

### **Año 1: Fundamentos y Core**

#### **Q1 (Ene-Mar 2025): Setup y Aprendizaje**
- **Mes 1:** Instalación Android Studio, configuración entorno
- **Mes 2:** Kotlin fundamentals + Android basics
- **Mes 3:** Proyecto base + navegación entre pantallas

**Entregables Q1:**
- [ ] Proyecto Android creado
- [ ] Navegación básica funcionando
- [ ] Pantallas mockup implementadas

#### **Q2 (Abr-Jun 2025): Database y Storage**
- **Mes 4:** Room Database setup + entities
- **Mes 5:** DAOs + Repository pattern
- **Mes 6:** Local file storage para fotos

**Entregables Q2:**
- [ ] Base de datos local completa
- [ ] CRUD de votos funcionando
- [ ] Sistema de archivos configurado

#### **Q3 (Jul-Sep 2025): Cámara y UI**
- **Mes 7:** CameraX implementation
- **Mes 8:** Captura múltiple de fotos
- **Mes 9:** UI/UX pulido + validaciones

**Entregables Q3:**
- [ ] Cámara completamente funcional
- [ ] UI principal terminada
- [ ] Validaciones de datos implementadas

#### **Q4 (Oct-Dic 2025): Lógica de Negocio**
- **Mes 10:** Selección candidatos + guardado offline
- **Mes 11:** Pantalla historial + búsquedas
- **Mes 12:** Testing básico + corrección bugs

**Entregables Q4:**
- [ ] App funcionando 100% offline
- [ ] Todas las pantallas operativas
- [ ] Testing unitario básico

### **Año 2: Sincronización y Producción**

#### **Q1 (Ene-Mar 2026): Firebase Integration**
- **Mes 13:** Firebase SDK + authentication
- **Mes 14:** Firestore integration + WorkManager
- **Mes 15:** Firebase Storage para fotos

**Entregables Q1:**
- [ ] Autenticación funcionando
- [ ] Sincronización básica implementada
- [ ] Subida de fotos a Firebase

#### **Q2 (Abr-Jun 2026): Sincronización Avanzada**
- **Mes 16:** Manejo de conflictos + retry logic
- **Mes 17:** Network detection + background sync
- **Mes 18:** Progress indicators + error handling

**Entregables Q2:**
- [ ] Sincronización robusta y confiable
- [ ] Manejo de errores completo
- [ ] UX de sincronización pulida

#### **Q3 (Jul-Sep 2026): Testing y Optimización**
- **Mes 19:** Testing exhaustivo + UI tests
- **Mes 20:** Optimización performance + memoria
- **Mes 21:** Security hardening + obfuscation

**Entregables Q3:**
- [ ] Suite de tests completa
- [ ] App optimizada para producción
- [ ] Seguridad implementada

#### **Q4 (Oct-Dic 2026): Release y Deployment**
- **Mes 22:** Play Store preparation + assets
- **Mes 23:** Beta testing + feedback
- **Mes 24:** Release final + documentación

**Entregables Q4:**
- [ ] App publicada en Play Store
- [ ] Beta testing completado
- [ ] Documentación de usuario final

---

## 🔧 Configuración de Desarrollo

### **Requisitos del Sistema**
- **OS:** Windows 10/11 64-bit
- **RAM:** Mínimo 8GB (recomendado 16GB)
- **Almacenamiento:** 50GB libres para Android Studio + SDKs
- **Procesador:** Intel i5 o equivalente AMD

### **Software Necesario**
1. **Android Studio** (versión más reciente)
2. **Java JDK 11** o superior
3. **Git** para control de versiones
4. **Device físico** o **emulador** Android para testing

### **Configuración Inicial**
```bash
# 1. Descargar Android Studio
https://developer.android.com/studio

# 2. Instalar SDKs necesarios:
# - Android API 24 (7.0) como mínimo
# - Android API 34 (14.0) como target
# - Build tools más recientes
# - Google Play Services

# 3. Crear proyecto
File → New → New Project
Template: "Empty Activity"
Name: "ElectoralApp"
Package: "com.electoral.app"
Language: Kotlin
Minimum SDK: API 24
```

### **Dependencies iniciales (build.gradle)**
```kotlin
dependencies {
    implementation "androidx.core:core-ktx:1.12.0"
    implementation "androidx.lifecycle:lifecycle-runtime-ktx:2.7.0"
    implementation "androidx.activity:activity-compose:1.8.2"
    
    // Room Database
    implementation "androidx.room:room-runtime:2.6.1"
    implementation "androidx.room:room-ktx:2.6.1"
    kapt "androidx.room:room-compiler:2.6.1"
    
    // CameraX
    implementation "androidx.camera:camera-core:1.3.1"
    implementation "androidx.camera:camera-camera2:1.3.1"
    implementation "androidx.camera:camera-lifecycle:1.3.1"
    implementation "androidx.camera:camera-view:1.3.1"
    
    // Firebase
    implementation "com.google.firebase:firebase-auth-ktx:22.3.0"
    implementation "com.google.firebase:firebase-firestore-ktx:24.10.0"
    implementation "com.google.firebase:firebase-storage-ktx:20.3.0"
    
    // WorkManager
    implementation "androidx.work:work-runtime-ktx:2.9.0"
    
    // Dependency Injection
    implementation "com.google.dagger:hilt-android:2.48.1"
    kapt "com.google.dagger:hilt-compiler:2.48.1"
    
    // Testing
    testImplementation "junit:junit:4.13.2"
    androidTestImplementation "androidx.test.ext:junit:1.1.5"
    androidTestImplementation "androidx.test.espresso:espresso-core:3.5.1"
}
```

---

## 🔒 Consideraciones de Seguridad

### **Datos Locales**
- **Encriptación SQLite** con SQLCipher
- **Keystore Android** para claves sensibles
- **Biometric authentication** opcional

### **Comunicación con Firebase**
- **Certificate pinning** para APIs
- **Token refresh** automático
- **Timeout configurations** apropiados

### **Validaciones**
- **Input sanitization** en todos los campos
- **File type validation** para fotos
- **Size limits** para prevenir DoS

---

## 📚 Recursos de Aprendizaje

### **Cursos Recomendados**
1. **Kotlin Fundamentals:** developer.android.com/courses
2. **Android Basics with Compose:** developer.android.com/courses
3. **Room Database:** developer.android.com/training/data-storage/room
4. **CameraX:** developer.android.com/training/camerax

### **Documentación Oficial**
- **Android Developer Guide:** developer.android.com/guide
- **Firebase Android:** firebase.google.com/docs/android/setup
- **Kotlin Language:** kotlinlang.org/docs

### **Herramientas Útiles**
- **Android Device Monitor:** Para debugging
- **Layout Inspector:** Para análisis de UI
- **Profiler:** Para performance monitoring
- **Logcat:** Para logs y debugging

---

## 🎯 Hitos y Métricas de Éxito

### **Hitos Técnicos**
- [ ] **M1:** App funciona 100% offline (Mes 12)
- [ ] **M2:** Sincronización básica implementada (Mes 15)
- [ ] **M3:** Testing completo aprobado (Mes 21)
- [ ] **M4:** App en Play Store (Mes 24)

### **Métricas de Calidad**
- **Performance:** < 3 segundos para captura de foto
- **Storage:** < 100MB por 1000 registros con fotos
- **Battery:** < 5% consumo por hora de uso activo
- **Reliability:** > 99% éxito en guardado offline

### **Criterios de Aceptación Final**
1. ✅ Funciona sin internet durante días completos
2. ✅ Sincroniza automáticamente al detectar conexión
3. ✅ Maneja > 1000 registros sin degradación
4. ✅ Fotos de calidad suficiente para evidencia legal
5. ✅ UI intuitiva para usuarios no técnicos

---

## 🚀 Siguiente Paso

**Acción inmediata:** Descargar e instalar Android Studio desde developer.android.com/studio

**Primera sesión de código:** Crear proyecto base y implementar navegación básica entre pantallas (MainActivity → CameraActivity → HistorialActivity)

---

*Documentación creada: 21 de octubre, 2025*  
*Proyecto: Control Electoral Android*  
*Timeline: 2 años (2025-2026)*  
*Estado: Planificación inicial completada ✅*