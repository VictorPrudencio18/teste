# Deploy para Vercel
deploy-vercel.md

## Passos para Deploy no Vercel:

### 1. Preparar o projeto
```bash
npm run build
```

### 2. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 3. Login no Vercel
```bash
vercel login
```

### 4. Deploy
```bash
vercel
```

### 5. Configurar variáveis de ambiente no Vercel:
- VITE_GEMINI_API_KEY
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID

### 6. Deploy automático
```bash
vercel --prod
```

## Alternativa via GitHub:
1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente no dashboard
3. Deploy automático a cada push!