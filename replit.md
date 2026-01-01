# PoseToFit - AI-Powered Fitness Application

## Overview

PoseToFit is a fitness tracking web application that uses TensorFlow.js pose detection to analyze user movements during workouts. The platform supports two user roles: members who perform workouts and trainers who create workout programs. The application features real-time webcam-based pose tracking, workout session recording, and performance analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (dark mode fitness theme with purple/teal accent colors)
- **Fonts**: Outfit (display) and Plus Jakarta Sans (body text)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for validation
- **Build Process**: Custom build script using esbuild for server bundling and Vite for client

### Authentication
- **Strategy**: Session-based authentication using Passport.js with Local Strategy
- **Password Hashing**: scrypt with random salt
- **Session Storage**: Express-session (MemoryStore in development)
- **Role-based Access**: Three roles - member, trainer, admin with route-level protection

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit for schema management (`drizzle-kit push`)

### Key Data Models
- **Users**: id, username, password, role (member/trainer/admin), name
- **Workouts**: id, title, description, trainerId, difficulty, exercises (JSONB)
- **Sessions**: id, userId, workoutId, score, duration, completedAt

### Pose Detection Integration
- **Library**: TensorFlow.js with MoveNet model
- **Backend**: WebGL for GPU acceleration
- **Components**: Webcam capture with real-time skeleton overlay drawing
- **Use Case**: Tracks user movements during workout sessions for form analysis

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components (shadcn/ui)
    pages/        # Route pages
    hooks/        # Custom React hooks
    lib/          # Utilities
server/           # Express backend
  auth.ts         # Authentication setup
  db.ts           # Database connection
  routes.ts       # API endpoints
  storage.ts      # Data access layer
shared/           # Shared code between client/server
  schema.ts       # Drizzle schema definitions
  routes.ts       # API route definitions with Zod schemas
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database queries and schema management

### AI/ML Services
- **TensorFlow.js**: Client-side pose detection using MoveNet model
- **WebGL Backend**: GPU-accelerated inference in browser

### Authentication
- **Passport.js**: Authentication middleware with Local Strategy
- **express-session**: Session management

### UI Libraries
- **Radix UI**: Headless UI primitives for accessible components
- **Recharts**: Data visualization for analytics dashboards
- **Lucide React**: Icon library
- **react-webcam**: Webcam capture component

### Development Tools
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **TypeScript**: Type safety across the stack