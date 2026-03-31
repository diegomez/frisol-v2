# Frisol v2 - Documentacion

Framework 4D - Sistema de gestion de proyectos comerciales a desarrollo. Plataforma Next.js 14 que guia a los equipos (CSM, PO, Admin) a traves de un flujo estructurado de 8 pasos para diagnosticar, documentar y cerrar proyectos de clientes.

## Indice

| Documento | Contenido |
|-----------|-----------|
| [Arquitectura](./architecture.md) | Diagrama de componentes, patron de capas, flujo de datos |
| [Modelo de Datos](./data-model.md) | Diagrama E-R, descripcion de 10 tablas |
| [API Endpoints](./api-endpoints.md) | 23 endpoints con diagramas de secuencia |
| [Reglas de Negocio](./business-rules.md) | Reglas, flujo de estados, errores HTTP |

## Resumen Rapido

- **23 endpoints REST** (auth, projects, sub-recursos, admin)
- **10 tablas** en MySQL (Tribe, User, Project, Symptom, Causa, Kpi, Urgencia, Attachment, StateHistory)
- **4 roles**: admin, csm (Customer Success Manager), po (Product Owner), dev
- **4 estados de proyecto**: en_progreso, terminado, cerrado, cancelado
- **8 paginas de flujo**: Cliente, Diagnostico, Evidencia, Voz del Dolor, Causas, Impacto, Dependencias, Cierre
- **Autenticacion JWT** con cookies httpOnly
- **PDF export** con Chromium/Puppeteer integrado
- **Liquibase** para migraciones de base de datos
- **Docker Compose** para orquestacion (app + MySQL)

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| Backend | Next.js API Routes, Node.js 20 |
| ORM | Prisma 6 |
| Base de datos | MySQL 8.4 |
| Autenticacion | JWT (jsonwebtoken + bcryptjs) |
| PDF | Puppeteer (Chromium headless) |
| Migraciones | Liquibase 5 |
| Infraestructura | Docker Compose |

## Estructura del Proyecto

```
frisol-v2/
├── prisma/
│   ├── schema.prisma          # Definicion del modelo de datos
│   └── seed.ts                # Datos iniciales (users, tribes)
├── src/
│   ├── app/
│   │   ├── api/               # 23 endpoints REST
│   │   │   ├── auth/          # login, logout, me
│   │   │   ├── projects/      # CRUD + sub-recursos
│   │   │   ├── tribes/        # listar tribus
│   │   │   └── users/         # CRUD usuarios (admin)
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── projects/[id]/     # 8 paginas del flujo 4D
│   │   ├── admin/users/       # Gestion de usuarios
│   │   └── login/             # Pagina de login
│   ├── lib/
│   │   ├── auth.ts            # JWT sign/verify/cookies
│   │   └── prisma.ts          # Cliente Prisma singleton
│   └── middleware.ts          # Proteccion de rutas
├── liquibase/                 # Migraciones de DB
├── docs/                      # Esta documentacion
└── docker-compose.yml
```
