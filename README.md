# 🏋️ Pose-Fit: Real-Time AI Fitness & Posture Tracking Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/js)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**Pose-Fit** is an end-to-end, AI-powered workout tracking and real-time posture analysis platform. Utilizing computer vision models (BlazePose / MediaPipe keypoint detection via TensorFlow.js) alongside an intelligent vision engine, Pose-Fit provides real-time biomechanical feedback, automated repetition counting, form verification, and comprehensive member/trainer dashboards.

---

## ✨ Key Features

- 🎥 **Real-Time AI Posture Detection**: Webcam-based skeleton overlay analyzing body joint angles (elbows, knees, spine alignment) in real-time.
- ⚡ **Phase-Lock Repetition Counter**: Intelligent rep counting for exercises including Squats, Push-ups, Bicep Curls, and Tricep Extensions.
- 🗣️ **Real-Time Form Feedback & Coaching**: Live corrective alerts (e.g., *"Push back up!"*, *"Lower slowly!"*, *"Hold position!"*).
- 📊 **Multi-Role Dashboards**:
  - **Member Portal**: Track personal workout history, view posture analytics, manage subscriptions, and inspect live leaderboard standings.
  - **Trainer Portal**: Monitor client progress, assign customized workout routines, and review biomechanical performance metrics.
  - **Admin Portal**: System-wide user management, subscription tracking, automated expiry alerts, and platform analytics.
- 🐍 **Dedicated Python AI Service**: Microservice support (`ai_service/app.py`) for deep learning spatial sequence predictions and extended model inference.
- 📄 **Export & Reporting**: PDF and Excel export for workout sessions and analytics data.

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Shadcn UI components
- **Animations**: Framer Motion
- **Vision Engine**: `@tensorflow/tfjs`, `@tensorflow-models/pose-detection` (BlazePose runtime)
- **Icons**: Lucide React

### **Backend & Database**
- **Server**: Express.js + Node.js (TypeScript)
- **Database**: PostgreSQL (Neon Database connection)
- **ORM**: Drizzle ORM + Drizzle Kit
- **Session & Auth**: Passport.js with session authentication

### **AI Microservice**
- **Python Service**: Python 3.9+ (`ai_service/app.py`)
- **Keypoint Processing**: NumPy spatial coordinate normalization

---

## 📂 Project Structure

```
Pose-Fit/
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable UI components & Layout Shell
│   │   ├── hooks/              # Custom React hooks (Auth, Workouts, Mobile)
│   │   ├── lib/                # Utility functions, Export tools, Query client
│   │   └── pages/              # Application pages (AI Detector, Dashboards, Auth)
│   └── index.html
├── server/                     # Express.js backend server
│   ├── auth.ts                 # Passport.js authentication strategy
│   ├── db.ts                   # Database connection instance
│   ├── index.ts                # Server entrypoint
│   ├── routes.ts               # REST API endpoints & route handlers
│   └── storage.ts              # Database abstraction layer
├── shared/                     # Shared TypeScript schemas & types
│   └── schema.ts               # Drizzle database schemas & Zod validations
├── ai_service/                 # Python AI Microservice
│   ├── app.py                  # Python AI API runner
│   └── requirements.txt        # Python dependencies
├── .env.example                # Environment variables template
├── package.json                # Node.js dependencies & scripts
├── tsconfig.json               # TypeScript configuration
└── README.md                   # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites

Make sure you have the following installed on your system:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: 3.9+ (optional for extended AI microservice)
- **PostgreSQL**: Local instance or cloud database (e.g., Neon DB)

### 1. Clone the Repository

```bash
git clone https://github.com/AbdullahSaeed1314/Pose-Fit.git
cd Pose-Fit
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure your database connection string:

```bash
cp .env.example .env
```

Update your `.env` file:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/posefit_db
PORT=5000
```

### 4. Database Setup

Push the Drizzle schema to your PostgreSQL database:

```bash
npm run db:push
```

### 5. Start Development Server

Run the development server (starts both Express backend & Vite frontend):

```bash
npm run dev
```

The application will be accessible at: `http://localhost:5000`

---

## 🤖 Running the Python AI Microservice (Optional)

To start the auxiliary Python AI service:

```bash
cd ai_service
pip install -r requirements.txt
python app.py
```

---

## 📜 Available Scripts

- `npm run dev`: Start full-stack development server with live reload.
- `npm run build`: Bundle client & server for production output.
- `npm run start`: Start production server built output.
- `npm run check`: Run TypeScript type-checking (`tsc`).
- `npm run db:push`: Push database migrations using Drizzle Kit.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

Made with ❤️ by [Abdullah Saeed](https://github.com/AbdullahSaeed1314)
