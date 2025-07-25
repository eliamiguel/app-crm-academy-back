import "dotenv/config"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import { errorHandler } from "./middleware/errorHandler"
import { authenticateToken, AuthRequest } from "./middleware/auth"
// import notificationScheduler from "./services/notificationScheduler"

// Import routes
import authRoutes from "./routes/auth"
import userRoutes from "./routes/users"
import studentRoutes from "./routes/students"
import paymentRoutes from "./routes/payments"
import appointmentRoutes from "./routes/appointments"
import progressRoutes from "./routes/progress"
import workoutPlanRoutes from "./routes/workoutPlans"
import notificationRoutes from "./routes/notifications"
import dashboardRoutes from "./routes/dashboard"
import uploadRouter from "./routes/upload"
import path from "path";
import fs from "fs"
const app = express()
const PORT = process.env.PORT || 8000

const uploadPath = path.resolve(process.cwd(), "uploads")

// Criar diretórios se não existirem
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true })
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { 
    policy: "cross-origin" // Permite servir arquivos para diferentes origens
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"], // Permite imagens de várias fontes
      mediaSrc: ["'self'", "data:", "https:", "blob:"], // Permite mídia
    }
  }
}))
const allowedOrigins = [
  'https://v0-academy-and-trainer-crm.vercel.app',
  'http://localhost:3000',
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))


// Rate limiting


// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    uploadPath: uploadPath,
    uploadPathExists: fs.existsSync(uploadPath)
  })
})

// Test endpoint para verificar autenticação
app.get("/api/test-auth", (req, res) => {
  res.json({
    message: "Endpoint público funcionando",
    timestamp: new Date().toISOString()
  })
})

// Test endpoint protegido
app.get("/api/test-auth-protected", authenticateToken, (req: AuthRequest, res) => {
  res.json({
    message: "Endpoint protegido funcionando",
    user: req.user,
    timestamp: new Date().toISOString()
  })
})


if (fs.existsSync(uploadPath)) {
  app.use("/uploads", express.static(uploadPath))
}
// API routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/students", studentRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/appointments", appointmentRoutes)
app.use("/api/progress", progressRoutes)
app.use("/api/workout-plans", workoutPlanRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/upload",  uploadRouter);


app.use("/uploads/*", (req, res, next) => {
  console.log(`📁 Arquivo solicitado: ${req.originalUrl}`)
  next()
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Error handling middleware
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}`)
  console.log(`🔑 JWT_SECRET configurado: ${process.env.JWT_SECRET ? "Sim" : "Não"}`)
  
  // Iniciar scheduler de notificações
  // notificationScheduler.start()
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(' SIGTERM received, shutting down gracefully...')
  // notificationScheduler.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log(' SIGINT received, shutting down gracefully...')
  // notificationScheduler.stop()
  process.exit(0)
})

export default app
