# Frisol v2 - Arquitectura

## Diagrama de Componentes

```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js App Router)"]
        Pages["Paginas React<br/>Cliente, Diagnostico, Evidencia,<br/>VozDolor, Causas, Impacto,<br/>Dependencias, Cierre"]
        Dashboard["Dashboard"]
        Admin["Admin Users"]
    end

    subgraph API["API Routes (Next.js)"]
        AuthAPI["/api/auth/*<br/>login, logout, me"]
        ProjectAPI["/api/projects/*<br/>CRUD, sub-recursos"]
        UserAPI["/api/users/*<br/>CRUD usuarios"]
        TribeAPI["/api/tribes/*<br/>listar tribus"]
    end

    subgraph Services["Lib / Services"]
        AuthLib["auth.ts<br/>JWT sign/verify<br/>bcrypt hash/compare"]
        PrismaLib["prisma.ts<br/>Prisma Client singleton"]
        PDFGen["PDF Generator<br/>Puppeteer + Chromium"]
    end

    subgraph Infra["Infraestructura"]
        MySQL[("MySQL 8.4<br/>10 tablas")]
        FileSystem["File System<br/>/uploads"]
        Liquibase["Liquibase<br/>Migraciones DB"]
    end

    Pages --> API
    Dashboard --> API
    Admin --> UserAPI
    API --> AuthLib
    API --> PrismaLib
    API --> PDFGen
    PrismaLib --> MySQL
    PDFGen --> FileSystem
    Liquibase --> MySQL

    style Frontend fill:#e0f2fe,stroke:#0284c7
    style API fill:#fef3c7,stroke:#f59e0b
    style Services fill:#f0fdf4,stroke:#16a34a
    style Infra fill:#fef2f2,stroke:#dc2626
```

## Patron de Capas

| Capa | Ubicacion | Responsabilidad |
|------|-----------|-----------------|
| **Presentation** | `src/app/` | Paginas React, UI, navegacion client-side |
| **API Routes** | `src/app/api/` | Validacion de request, autenticacion, orquestacion |
| **Lib** | `src/lib/` | Logica compartida (auth, prisma client) |
| **Data Access** | Prisma Client | Queries tipadas, relaciones, transacciones |
| **Database** | MySQL 8.4 | Persistencia, indices, constraints FK |

El proyecto NO usa un patron Controller/Service/Repository tradicional. La logica de negocio vive directamente en los API Routes, que importan `prisma` y `auth` de `src/lib/`. Esto es tipico de Next.js App Router donde cada route handler es autocontenido.

## Modulos y Dependencias

```mermaid
graph LR
    subgraph Auth["Auth Module"]
        Login["login/page.tsx"]
        AuthRoute["/api/auth/*"]
    end

    subgraph Projects["Projects Module"]
        ProjectPages["8 paginas del flujo"]
        ProjectRoutes["/api/projects/*"]
        SubResources["symptoms, causas, kpis,<br/>urgencias, attachments,<br/>estado, progress, pdf, history"]
    end

    subgraph Admin["Admin Module"]
        AdminPage["admin/users/page.tsx"]
        AdminRoutes["/api/users/*"]
    end

    subgraph Shared["Shared"]
        AuthLib["lib/auth.ts"]
        PrismaLib["lib/prisma.ts"]
    end

    Auth --> AuthLib
    Projects --> AuthLib
    Projects --> PrismaLib
    Admin --> AuthLib
    Admin --> PrismaLib
```

| Modulo | Imports | Exports |
|--------|---------|---------|
| Auth | jsonwebtoken, bcryptjs, next/cookies | getCurrentUser, signToken, verifyToken, setAuthCookie |
| Projects | prisma, auth, puppeteer | 14 API routes + 8 paginas |
| Admin | prisma, auth | 2 API routes + 1 pagina |
| Shared (lib) | prisma, jsonwebtoken | auth.ts, prisma.ts |

## Flujo de Datos Principal (Crear Proyecto + Completar Flujo)

```mermaid
flowchart TD
    A[CSM hace click en Nuevo Proyecto] --> B[POST /api/projects]
    B --> C[Verifica JWT + rol CSM]
    C --> D[Crea Project con estado en_progreso]
    D --> E[Registra StateHistory: en_progreso]
    E --> F[Redirige a /projects/:id/cliente]
    F --> G[CSM completa 8 paginas del flujo]
    G --> H[Auto-guardado PATCH /api/projects/:id]
    H --> I{Todas las secciones verdes?}
    I -->|No| G
    I -->|Si| J[CSM marca Terminado]
    J --> K[PATCH /api/projects/:id/estado terminado]
    K --> L[Registra StateHistory: terminado]
    L --> M[PO revisa en Cierre]
    M --> N{PO decide}
    N -->|Cerrar| O[PATCH /api/projects/:id/estado cerrado]
    N -->|Rechazar| P[PATCH /api/projects/:id/estado en_progreso + motivo]
    N -->|Cancelar| Q[PATCH /api/projects/:id/estado cancelado + motivo]
    O --> R[Registra StateHistory: cerrado]
    P --> S[Vuelve a CSM para correcciones]
    Q --> T[Proyecto cancelado]
    S --> G
```

## Patron de Auto-guardado

Las 8 paginas del flujo usan un patron de auto-guardado con debounce de 500ms:

```mermaid
sequenceDiagram
    participant User
    participant Page as Pagina React
    participant API as API Route
    participant DB as MySQL

    User->>Page: Escribe en textarea
    Page->>Page: setState + setTimeout 500ms
    Note over Page: Si el usuario sigue escribiendo,<br/>reset del timeout
    User->>Page: Deja de escribir (500ms pasa)
    Page->>API: PATCH /api/projects/:id { campo: valor }
    API->>DB: UPDATE Project SET campo = valor
    DB-->>API: OK
    API-->>Page: 200 OK
    Page->>Page: Muestra check "Guardado"
```

## Patron de Proteccion de Rutas

```mermaid
flowchart TD
    A[Request a cualquier ruta] --> B[middleware.ts]
    B --> C{Tiene cookie JWT?}
    C -->|No| D[Redirect /login]
    C -->|Si| E{JWT valido?}
    E -->|No| D
    E -->|Si| F{Ruta es /admin/*?}
    F -->|Si| G{Rol es admin?}
    G -->|No| H[Redirect /dashboard]
    G -->|Si| I[Permitir acceso]
    F -->|No| I
```

Middleware protege todas las rutas excepto `/login` y `/api/auth/*`. Rutas `/admin/*` requieren rol `admin`.