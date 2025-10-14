# 🚀 Backend - Sistema de Anúncios

Backend Node.js + Express + MongoDB para sincronização na nuvem do app de anúncios.

## 🌐 Deploy no Render

### URL de Deploy: 
**🔗 https://sua-url-do-render.onrender.com**

### Configuração no Render:
- **Build Command:** `npm install`  
- **Start Command:** `npm start`  

## 📋 Funcionalidades

### 🔐 API REST Completa
- **GET /api/advertisements** - Buscar anúncios do usuário
- **POST /api/advertisements** - Criar novo anúncio
- **PUT /api/advertisements/:id** - Atualizar anúncio
- **DELETE /api/advertisements/:id** - Deletar anúncio (soft delete)
- **POST /api/advertisements/sync** - Sincronização em lote
- **GET /api/advertisements/stats** - Estatísticas por usuário

### 🔄 Sincronização Inteligente
- **Multi-dispositivo**: Mesmo usuário em vários dispositivos
- **Resolução de conflitos**: Versão mais recente prevalece
- **Sincronização incremental**: Só baixa mudanças desde último sync
- **Tolerante a falhas**: App funciona offline

### 🛡️ Segurança e Performance
- **Rate limiting**: 1000 requests por IP/15min
- **CORS configurado**: Expo/React Native compatível
- **Helmet**: Headers de segurança
- **Validation**: Dados validados antes de salvar
- **Índices MongoDB**: Consultas otimizadas

## 🚀 Como Executar

### 1. Configurar Variáveis
```bash
# Edite o arquivo .env com suas configurações
MONGODB_URI=mongodb+srv://Tiago:ExCHBgBX5wLZUWUS@cluster0.51trz.mongodb.net/anuncios-app?retryWrites=true&w=majority
PORT=3000
JWT_SECRET=seu_jwt_secret_muito_seguro_aqui_2024
NODE_ENV=development
```

### 2. Instalar e Executar
```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Executar em produção  
npm start
```

### 3. Testar API
```bash
# Health check
curl http://localhost:3000/api/health

# Documentação
curl http://localhost:3000/
```

## 🔌 Endpoints da API

### Health Check
```
GET /api/health
```
**Resposta:**
```json
{
  "status": "OK",
  "timestamp": "2024-10-14T10:30:00Z",
  "uptime": 3600,
  "mongodb": "connected"
}
```

### Buscar Anúncios
```
GET /api/advertisements?userId=USER_ID&deviceId=DEVICE_ID&lastSync=2024-10-14T10:00:00Z
```
**Resposta:**
```json
{
  "success": true,
  "data": [...anúncios...],
  "count": 5,
  "syncTime": "2024-10-14T10:30:00Z"
}
```

### Criar Anúncio
```
POST /api/advertisements
Content-Type: application/json

{
  "id": "unique_id",
  "title": "Título do anúncio",
  "description": "Descrição detalhada",
  "price": "R$ 100,00",
  "category": "Eletrônicos",
  "contact": "11999999999",
  "images": ["url1", "url2"],
  "userId": "user_123",
  "deviceId": "device_123"
}
```

### Sincronização em Lote
```
POST /api/advertisements/sync
Content-Type: application/json

{
  "userId": "user_123",
  "deviceId": "device_123", 
  "advertisements": [...anúncios locais...],
  "lastSync": "2024-10-14T10:00:00Z"
}
```
**Resposta:**
```json
{
  "success": true,
  "results": {
    "created": 3,
    "updated": 2,
    "errors": []
  },
  "serverChanges": [...mudanças do servidor...],
  "syncTime": "2024-10-14T10:30:00Z"
}
```

## 🗄️ Estrutura do Banco de Dados

### Collection: advertisements
```javascript
{
  _id: ObjectId,
  id: String (único por usuário),
  title: String (obrigatório, max 200),
  description: String (obrigatório, max 2000),
  price: String (obrigatório),
  category: String (enum),
  contact: String (obrigatório),
  images: [String] (URLs),
  userId: String (obrigatório, indexado),
  deviceId: String (obrigatório, indexado),
  createdAt: Date,
  updatedAt: Date,
  syncedAt: Date,
  isDeleted: Boolean (soft delete)
}
```

### Collection: devices
```javascript
{
  _id: ObjectId,
  deviceId: String (único),
  userId: String (indexado),
  deviceName: String,
  platform: String (ios/android/web),
  lastSync: Date,
  isActive: Boolean
}
```

## 🔧 Arquitetura

### Fluxo de Sincronização
```
App (Local) ←→ API REST ←→ MongoDB Atlas
     ↓              ↓           ↓
AsyncStorage → Express.js → Cloud Database
```

### Resolução de Conflitos
1. **Timestamp**: Versão com `updatedAt` mais recente vence
2. **Criação**: IDs únicos evitam duplicatas
3. **Deletar**: Soft delete mantém histórico
4. **Merge**: App combina dados locais + nuvem

### Multi-dispositivo
- Cada dispositivo tem ID único
- Mesmo usuário pode ter múltiplos dispositivos
- Sincronização bidirecional automática
- Conflitos resolvidos por timestamp

## 🛠️ Desenvolvimento

### Estrutura de Arquivos
```
backend/
├── server.js          # Servidor principal
├── package.json       # Dependências
├── .env              # Variáveis ambiente
├── models/           # Modelos MongoDB
│   ├── Advertisement.js
│   └── Device.js
└── routes/           # Rotas da API
    └── advertisements.js
```

### Scripts Disponíveis
```bash
npm start      # Produção
npm run dev    # Desenvolvimento (nodemon)
```

### Variáveis de Ambiente
```
MONGODB_URI    # String conexão MongoDB
PORT           # Porta do servidor (padrão: 3000)
JWT_SECRET     # Secret para tokens (futuro)
NODE_ENV       # development/production
```

## 📊 Monitoramento

### Logs Automáticos
- Todas as requisições HTTP
- Erros de conexão MongoDB
- Operações de CRUD

### Métricas Disponíveis
- Uptime do servidor
- Status conexão MongoDB
- Número total de anúncios
- Estatísticas por usuário

## 🔒 Segurança

### Medidas Implementadas
- **Rate Limiting**: Previne spam/DDoS
- **CORS**: Controla origem das requisições  
- **Helmet**: Headers de segurança HTTP
- **Validation**: Sanitização de dados entrada
- **Soft Delete**: Histórico preservado

### TODO: Futuras Melhorias
- [ ] Autenticação JWT
- [ ] Criptografia de dados sensíveis
- [ ] Logs de auditoria
- [ ] Backup automático
- [ ] Monitoramento avançado

## 🌐 Deploy

### Opções Recomendadas
1. **Heroku**: Deploy fácil, grátis para começar
2. **Vercel**: Serverless, boa para APIs REST
3. **Railway**: Alternativa moderna ao Heroku
4. **AWS/Google Cloud**: Produção empresarial

### Variáveis para Deploy
```bash
# Alterar no .env para produção
MONGODB_URI=sua_string_producao
NODE_ENV=production
PORT=443 ou 80
```

## 📱 Integração com App

O app React Native automaticamente:
- ✅ Detecta conectividade
- ✅ Sincroniza em background  
- ✅ Funciona offline
- ✅ Resolve conflitos
- ✅ Mostra status de sync

### URL da API no App
Alterar em `services/CloudSyncService.ts`:
```typescript
const API_BASE_URL = 'https://sua-api.herokuapp.com/api';
```

---

## 🎉 Pronto para Produção!

Backend completo e funcional para sincronização na nuvem. O app pode ser usado offline e sincroniza automaticamente quando online.
