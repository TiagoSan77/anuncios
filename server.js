require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por IP
  message: {
    error: 'Muitas requisições, tente novamente em 15 minutos'
  }
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: [
    'http://localhost:19006', 
    'exp://127.0.0.1:19000',
    'exp://192.168.0.12:8082', // Expo na rede local
    'http://192.168.0.12:8082'  // React Native na rede local
  ],
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Conectado ao MongoDB Atlas');
})
.catch((error) => {
  console.error('❌ Erro ao conectar ao MongoDB:', error);
  process.exit(1);
});

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas
app.use('/api/advertisements', require('./routes/advertisements'));

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API do Sistema de Anúncios',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      advertisements: '/api/advertisements',
      sync: '/api/advertisements/sync',
      stats: '/api/advertisements/stats'
    }
  });
});

// Middleware de erro 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Encerrando servidor...');
  await mongoose.connection.close();
  console.log('✅ Conexão com MongoDB fechada.');
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 URL Local: http://localhost:${PORT}`);
  console.log(`� URL Rede: http://192.168.0.12:${PORT}`);
  console.log(`�🔍 Health Check: http://192.168.0.12:${PORT}/api/health`);
  console.log(`📋 API Docs: http://192.168.0.12:${PORT}/`);
});
