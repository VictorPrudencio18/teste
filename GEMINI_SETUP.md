## 🚀 Como Configurar o Google Gemini AI (GRATUITO)

### 📋 Passos para configuração:

1. **Acesse o Google AI Studio:**
   - Vá para: https://aistudio.google.com/app/apikey
   - Faça login com sua conta Google

2. **Crie uma API Key gratuita:**
   - Clique em "Create API key"
   - Selecione um projeto ou crie um novo
   - Copie a chave gerada (algo como: `AIzaSyABC123def456GHI789jkl012MNO345pqr`)

3. **Configure no projeto:**
   - Crie um arquivo `.env` na raiz do projeto
   - Adicione: `API_KEY=sua_chave_aqui`
   - Exemplo: `API_KEY=AIzaSyABC123def456GHI789jkl012MNO345pqr`

4. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

### 🆓 Limites gratuitos do Gemini:
- ✅ **1.500 requests por dia**
- ✅ **1 milhão de tokens por minuto**
- ✅ **15 requests por minuto**
- ✅ **Completamente gratuito**

### 🔒 Segurança:
- ⚠️ **NUNCA** compartilhe sua API key publicamente
- 📁 O arquivo `.env` está no `.gitignore` (não vai para o GitHub)
- 🔐 Use apenas em ambiente de desenvolvimento local

### 🛠️ Modelos disponíveis:
- `gemini-2.5-flash-lite` (atual - mais rápido)
- `gemini-1.5-pro` (mais poderoso)
- `gemini-1.5-flash` (balanceado)

### 📞 Precisa da API Key?
Se você tiver dificuldades, me envie sua chave e eu configuro para você!