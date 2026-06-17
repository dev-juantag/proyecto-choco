# Sistema Integral de Gestión Poblacional

Este repositorio contiene la plataforma web empresarial desarrollada para gestionar, identificar, monitorear y realizar seguimiento a la población, actividades ejecutadas e indicadores de impacto del proyecto ambiental en la región del Atrato.

## 🌍 Contexto del Proyecto

El sistema es el núcleo oficial de seguimiento operativo, técnico y administrativo del proyecto:
**"Disminuir la degradación de los ecosistemas del río Atrato mediante la implementación de estrategias de restauración ecológica, rehabilitación de cauces, monitoreo ambiental y fortalecimiento de la gobernanza territorial."**

La solución está construida bajo los más altos estándares empresariales, utilizando una arquitectura escalable, modular, mantenible y segura, orientada completamente al trabajo en campo bajo el modelo *Online First + Offline Capable (PWA)*.

## 🚀 Características Principales

- **Gestión Poblacional y Familiar**: Identificación completa con captura de datos sociodemográficos, niveles de vulnerabilidad, condiciones de la vivienda y saneamiento básico.
- **Georreferenciación**: Captura de coordenadas en tiempo real utilizando GPS integrado en el dispositivo y visualización de mapas interactivos a través de OpenStreetMap.
- **Soporte Offline**: Capacidad de registrar encuestas y atenciones sin conexión a internet mediante IndexedDB, con sincronización automática en segundo plano al recuperar la conexión.
- **Historia Clínica y Atenciones**: Registro clínico unificado por paciente, con formularios dinámicos y específicos para diversas especialidades (Medicina, Psicología, Enfermería, etc.).
- **Gestión de Equipos y Roles**: Sistema basado en Roles (RBAC) para Super Administradores, Administradores, Profesionales y Auxiliares.
- **Panel de Mando (Dashboard)**: Visualización en tiempo real de indicadores clave (KPIs), métricas de atenciones, coberturas y seguimientos familiares.

## 🛠 Stack Tecnológico

**Frontend**:
- [Next.js 15](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) (Validaciones)
- Mapas: OpenStreetMap + Leaflet
- PWA / Offline: Service Workers, `dexie.js` / IndexedDB

**Backend & Datos**:
- API Routes (Next.js)
- [Prisma ORM](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- Autenticación mediante JWT

## 📦 Configuración e Instalación Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/dev-juantag/proyecto-choco.git
   cd proyecto-choco
   ```

2. **Instalar las dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Copia el archivo `.env.example` (si existe) o crea un `.env` en la raíz con lo siguiente:
   ```env
   DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/choco_db"
   JWT_SECRET="tu_secreto_super_seguro"
   ```

4. **Sincronizar base de datos (Prisma):**
   ```bash
   npx prisma migrate dev
   ```

5. **Levantar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   El sistema estará disponible en `http://localhost:3000`.

## 🛡 Sistema de Permisos y Roles
- **SUPERADMIN**: Control total del sistema, auditoría, creación de usuarios y reportes globales.
- **ADMIN**: Gestión de su equipo territorial, edición y supervisión.
- **AUXILIAR**: Encargado del trabajo de campo, levantamiento de fichas (Wizard), captura fotográfica y georreferenciación.
- **PROFESIONAL**: Especialistas en salud/psicología. Realizan atenciones clínicas, consultas de historiales, seguimientos familiares y remisiones.

---

Desarrollado con ♥ para el fortalecimiento territorial y ambiental.
