# Frisol v2 - API Endpoints

## Tabla Resumen

### Auth

| Metodo | Ruta | Descripcion | Auth | Rol |
|--------|------|-------------|------|-----|
| POST | /api/auth/login | Iniciar sesion | No | - |
| POST | /api/auth/logout | Cerrar sesion | Si | - |
| GET | /api/auth/me | Usuario actual (JWT) | Si | - |

### Projects

| Metodo | Ruta | Descripcion | Auth | Rol |
|--------|------|-------------|------|-----|
| GET | /api/projects | Listar proyectos | Si | todos |
| POST | /api/projects | Crear proyecto | Si | csm |
| GET | /api/projects/:id | Obtener proyecto | Si | todos |
| PATCH | /api/projects/:id | Actualizar campos | Si | csm (propio, en_progreso) |
| DELETE | /api/projects/:id | Soft delete | Si | csm (propio), po, admin |

### Sub-recursos del Proyecto

| Metodo | Ruta | Descripcion | Auth | Rol |
|--------|------|-------------|------|-----|
| GET | /api/projects/:id/symptoms | Listar sintomas | Si | todos |
| POST | /api/projects/:id/symptoms | Crear sintoma | Si | csm (en_progreso) |
| PATCH | /api/projects/:id/symptoms/:symptomId | Actualizar sintoma | Si | csm (en_progreso) |
| DELETE | /api/projects/:id/symptoms/:symptomId | Eliminar sintoma | Si | csm (en_progreso) |
| GET | /api/projects/:id/causas | Listar causas | Si | todos |
| POST | /api/projects/:id/causas | Crear causa | Si | csm (en_progreso) |
| PATCH | /api/projects/:id/causas/:causaId | Actualizar causa | Si | csm (en_progreso) |
| DELETE | /api/projects/:id/causas/:causaId | Eliminar causa | Si | csm (en_progreso) |
| GET | /api/projects/:id/kpis | Listar KPIs | Si | todos |
| POST | /api/projects/:id/kpis | Crear KPI | Si | csm (en_progreso) |
| PATCH | /api/projects/:id/kpis/:kpiId | Actualizar KPI | Si | csm (en_progreso) |
| DELETE | /api/projects/:id/kpis/:kpiId | Eliminar KPI | Si | csm (en_progreso) |
| GET | /api/projects/:id/urgencias | Listar urgencias | Si | todos |
| POST | /api/projects/:id/urgencias | Crear urgencia | Si | csm (en_progreso) |
| PATCH | /api/projects/:id/urgencias/:urgenciaId | Actualizar urgencia | Si | csm (en_progreso) |
| DELETE | /api/projects/:id/urgencias/:urgenciaId | Eliminar urgencia | Si | csm (en_progreso) |
| GET | /api/projects/:id/attachments | Listar adjuntos | Si | todos |
| POST | /api/projects/:id/attachments | Subir adjunto | Si | csm (en_progreso) |
| DELETE | /api/projects/:id/attachments/:attachmentId | Eliminar adjunto | Si | csm (en_progreso) |

### Estado y Utilidades

| Metodo | Ruta | Descripcion | Auth | Rol |
|--------|------|-------------|------|-----|
| PATCH | /api/projects/:id/estado | Cambiar estado | Si | csm/po/admin |
| GET | /api/projects/:id/progress | Progreso por seccion | Si | todos |
| GET | /api/projects/:id/history | Historial de estados | Si | todos |
| GET | /api/projects/:id/pdf | Exportar PDF | Si | todos |
| PUT | /api/projects/:id/update | Actualizar (legacy) | Si | csm |

### Admin

| Metodo | Ruta | Descripcion | Auth | Rol |
|--------|------|-------------|------|-----|
| GET | /api/users | Listar usuarios | Si | admin |
| POST | /api/users | Crear usuario | Si | admin |
| PATCH | /api/users/:id | Actualizar usuario | Si | admin |
| GET | /api/tribes | Listar tribus | Si | todos |

## Diagramas de Secuencia

### POST /api/auth/login

```mermaid
sequenceDiagram
    actor User
    participant API as /api/auth/login
    participant Auth as lib/auth.ts
    participant DB as MySQL

    User->>API: POST { email, password }
    API->>DB: findUnique User WHERE email
    DB-->>API: User record
    API->>API: Verificar User existe y active
    API->>Auth: comparePassword(password, hash)
    Auth-->>API: true/false
    API->>Auth: signToken({ id, email, name, role })
    Auth-->>API: JWT token
    API->>Auth: setAuthCookie(token)
    Auth-->>API: Cookie set httpOnly
    API-->>User: 200 { user }
```

Body de ejemplo:
```json
{
  "email": "csm@frisol.com",
  "password": "password123"
}
```

### POST /api/projects (Crear Proyecto)

```mermaid
sequenceDiagram
    actor CSM
    participant API as /api/projects
    participant Auth as lib/auth.ts
    participant DB as MySQL

    CSM->>API: POST (sin body)
    API->>Auth: getCurrentUser()
    Auth-->>API: { id, email, name, role }
    API->>API: Verificar rol === 'csm'
    API->>DB: findUnique User WHERE id
    DB-->>API: User (con tribeId)
    API->>DB: create Project { csmId, tribeId }
    Note over DB: Crea StateHistory: en_progreso
    DB-->>API: Project creado
    API-->>CSM: 201 Project
```

### PATCH /api/projects/:id (Actualizar Campos)

```mermaid
sequenceDiagram
    actor User
    participant API as /api/projects/:id
    participant Auth as lib/auth.ts
    participant DB as MySQL

    User->>API: PATCH { nombreCliente, evidencia, ... }
    API->>Auth: getCurrentUser()
    Auth-->>API: { id, role }
    API->>DB: findUnique Project WHERE id
    DB-->>API: Project
    API->>API: Validar estado === 'en_progreso'
    API->>API: Validar rol === 'csm' o 'po'
    API->>API: Filtrar solo campos permitidos
    API->>DB: update Project SET campos
    DB-->>API: Project actualizado
    API-->>User: 200 Project

    alt Estado != en_progreso
        API-->>User: 403 "Proyecto no editable"
    end
    alt Rol no autorizado
        API-->>User: 403 "Sin acceso"
    end
```

Campos permitidos: `nombreCliente`, `nombreProyecto`, `crmId`, `fechaInicio`, `interlocutores`, `tribeId`, `evidencia`, `vozDolor`, `impactoNegocio`, `dependencias`, `importancia`, `pedido`

### PATCH /api/projects/:id/estado (Cambiar Estado)

```mermaid
sequenceDiagram
    actor User
    participant API as /api/projects/:id/estado
    participant Auth as lib/auth.ts
    participant DB as MySQL

    User->>API: PATCH { estado, motivo? }
    API->>Auth: getCurrentUser()
    Auth-->>API: { id, role }
    API->>DB: findUnique Project WHERE id
    DB-->>API: Project (con estado actual)

    alt estado === 'terminado'
        API->>API: Verificar rol === 'csm' y csmId === user.id
        API->>DB: update { estado: 'terminado', terminadoById, terminadoAt }
        DB->>DB: insert StateHistory { 'terminado', userId }
    end

    alt estado === 'cerrado'
        API->>API: Verificar rol === 'po' y estado actual === 'terminado'
        API->>DB: update { estado: 'cerrado', cerradoById, cerradoAt }
        DB->>DB: insert StateHistory { 'cerrado', userId }
    end

    alt estado === 'cancelado'
        API->>API: Verificar rol === 'po' y estado actual === 'terminado'
        API->>DB: update { estado: 'cancelado', canceladoById, canceladoAt, rechazoMotivo }
        DB->>DB: insert StateHistory { 'cancelado', userId, motivo }
    end

    alt estado === 'en_progreso' (rechazo)
        API->>API: Verificar rol === 'po' y estado actual === 'terminado'
        API->>DB: update { estado: 'en_progreso', terminadoById: null, rechazoMotivo }
        DB->>DB: insert StateHistory { 'rechazado', userId, motivo }
    end

    alt estado === 'en_progreso' (reabrir)
        API->>API: Verificar rol === 'admin' y estado === 'cancelado'/'cerrado'
        API->>DB: update { estado: 'en_progreso', limpiar auditoria }
        DB->>DB: insert StateHistory { 'reabierto', userId, motivo }
    end

    API-->>User: 200 Project actualizado
```

Body de ejemplo (rechazar):
```json
{
  "estado": "en_progreso",
  "motivo": "Faltan KPIs del modulo X. Los valores actuales no estan definidos."
}
```

### GET /api/projects/:id/progress (Progreso)

```mermaid
sequenceDiagram
    actor User
    participant API as /api/projects/:id/progress
    participant DB as MySQL

    User->>API: GET
    API->>DB: findUnique Project { include: symptoms, causas, kpis, urgencias }
    DB-->>API: Project con relaciones

    API->>API: Calcular color por seccion:
    Note over API: cliente: verde si nombreCliente+nombreProyecto+crmId
    Note over API: diagnostico: verde si >=1 symptom completo
    Note over API: evidencia: verde si evidencia tiene texto
    Note over API: vozDolor: verde si vozDolor tiene texto
    Note over API: causas: verde si >=1 causa con rootCause
    Note over API: impacto: verde si impactoNegocio+kpi completo
    Note over API: dependencias: verde si dependencias tiene texto

    API-->>User: 200 { cliente: "green", diagnostico: "yellow", ... }
```

Respuesta de ejemplo:
```json
{
  "cliente": "green",
  "diagnostico": "yellow",
  "evidencia": "green",
  "vozDolor": "red",
  "causas": "green",
  "impacto": "yellow",
  "dependencias": "red"
}
```

### GET /api/projects/:id/pdf (Exportar PDF)

```mermaid
sequenceDiagram
    actor User
    participant API as /api/projects/:id/pdf
    participant DB as MySQL
    participant Puppeteer as Chromium

    User->>API: GET
    API->>DB: findUnique Project { todas las relaciones }
    DB-->>API: Project completo

    API->>API: Generar HTML con 8 secciones
    API->>API: Incluir tabla de StateHistory
    API->>API: Incluir badge de urgencia maxima
    API->>Puppeteer: launch() + setContent(html)
    Puppeteer->>Puppeteer: Renderizar HTML
    Puppeteer->>Puppeteer: Generar PDF (A4)
    Puppeteer-->>API: Buffer PDF
    API->>Puppeteer: close()
    API-->>User: 200 PDF (Content-Type: application/pdf)
```

### POST /api/projects/:id/attachments (Subir Archivo)

```mermaid
sequenceDiagram
    actor User
    participant API as /api/projects/:id/attachments
    participant Auth as lib/auth.ts
    participant FS as File System

    User->>API: POST FormData { file, title }
    API->>Auth: getCurrentUser()
    Auth-->>API: { id, role }
    API->>API: Verificar estado === 'en_progreso'
    API->>API: Leer FormData (file + title)
    API->>API: Generar storedName (UUID + extension)
    API->>FS: writeFile(uploads/storedName)
    FS-->>API: OK
    API->>API: Guardar Attachment en DB
    API-->>User: 201 Attachment
```

### GET /api/projects/:id/history (Historial)

```mermaid
sequenceDiagram
    actor User
    participant API as /api/projects/:id/history
    participant DB as MySQL

    User->>API: GET
    API->>DB: findMany StateHistory WHERE projectId ORDER BY createdAt ASC
    Note over DB: include: { user: { name, role } }
    DB-->>API: Array de StateHistory con usuario
    API-->>User: 200 [{ id, estado, user, motivo, createdAt }, ...]
```
