# Sistema de Autenticação com Supabase - ConcursoGenius

Este documento descreve o sistema completo de autenticação implementado no ConcursoGenius usando Supabase.

## 🚀 Funcionalidades Implementadas

### Autenticação Básica
- ✅ Registro de usuários com email/senha
- ✅ Login com email/senha  
- ✅ Logout seguro
- ✅ Validação de formulários
- ✅ Tratamento de erros em português

### Autenticação Social
- ✅ Login com Google (OAuth)
- 🔄 Pronto para outros provedores (GitHub, Discord, etc.)

### Recuperação de Senha
- ✅ Envio de email para recuperação
- ✅ Interface amigável para solicitar reset
- ✅ Confirmação visual de envio

### Gerenciamento de Perfil
- ✅ Visualização e edição de dados pessoais
- ✅ Configuração de preferências de estudo
- ✅ Sincronização automática com auth.users

### Sincronização de Dados
- ✅ Backup automático do estado da aplicação na nuvem
- ✅ Sincronização entre dispositivos
- ✅ Resolução de conflitos (prioridade por timestamp)
- ✅ Fallback para armazenamento local

### Analytics de Estudo
- ✅ Registro de sessões de estudo
- ✅ Tracking de performance
- ✅ Histórico de atividades

## 🏗 Estrutura do Banco de Dados

### Tabelas Principais

#### `auth.users` (Supabase nativo)
- Gerencia autenticação
- Armazena email, senha (hash), metadata

#### `public.user_profiles`
- Perfil estendido do usuário
- Preferências de estudo
- Dados complementares

#### `public.user_app_state`
- Estado completo da aplicação por usuário
- Sincronização entre dispositivos
- Backup de dados

#### `public.study_sessions`
- Registro de sessões de estudo
- Analytics e performance
- Histórico de atividades

### Políticas RLS (Row Level Security)
Todas as tabelas implementam RLS garantindo que:
- Usuários só acessam seus próprios dados
- Inserções são validadas por auth.uid()
- Atualizações respeitam ownership

## 🔧 Configuração

### 1. Criação do Projeto Supabase
```bash
# 1. Acesse https://app.supabase.com/
# 2. Crie um novo projeto
# 3. Aguarde o setup (1-2 minutos)
```

### 2. Configuração do Schema
```sql
-- Execute o arquivo supabase/schema.sql no SQL Editor
-- Isso criará todas as tabelas, políticas e triggers
```

### 3. Variáveis de Ambiente
```bash
# Copie suas credenciais do Supabase Dashboard
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 4. Configuração OAuth (Opcional)
Para habilitar login com Google:
1. Acesse Authentication > Settings no Supabase
2. Configure Google OAuth com suas credenciais
3. Adicione URLs de redirecionamento

## 📁 Estrutura dos Arquivos

### Serviços
- `services/authService.ts` - Funções de autenticação
- `services/supabaseClient.ts` - Cliente Supabase configurado
- `services/cloudSyncService.ts` - Sincronização de dados

### Componentes de UI
- `components/auth/AuthModal.tsx` - Modal principal de auth
- `components/auth/LoginScreen.tsx` - Tela de login
- `components/auth/RegisterScreen.tsx` - Tela de registro
- `components/auth/ForgotPasswordScreen.tsx` - Recuperação de senha
- `components/auth/SocialLogin.tsx` - Botões de login social
- `components/auth/UserProfileManager.tsx` - Gerenciamento de perfil

### Banco de Dados
- `supabase/schema.sql` - Schema completo do banco

### Scripts
- `setup-supabase.sh` - Script de configuração automática

## 🔒 Segurança

### Autenticação
- Senhas com mínimo de 6 caracteres
- Hash automático pelo Supabase
- JWT tokens para sessões
- Refresh tokens automáticos

### Autorização
- Row Level Security (RLS) habilitado
- Políticas baseadas em auth.uid()
- Validação de ownership em todas as operações

### Dados Sensíveis
- Chaves API em variáveis de ambiente
- Comunicação HTTPS obrigatória
- Sanitização de inputs

## 🚀 Como Usar

### 1. Primeiro Acesso
```typescript
// O usuário clica em "Entrar" na interface
// Modal de autenticação é exibido
// Opções: Login, Registro, Login Social
```

### 2. Registro
```typescript
// Usuário preenche email/senha
// Validação client-side
// Criação da conta via Supabase
// Perfil criado automaticamente (trigger)
```

### 3. Login
```typescript
// Autenticação via email/senha ou OAuth
// Estado sincronizado automaticamente
// Conflitos resolvidos por timestamp
```

### 4. Uso da Aplicação
```typescript
// Estado salvo automaticamente na nuvem
// Sessões de estudo registradas
// Sincronização em tempo real
```

## 🔄 Fluxo de Sincronização

### Login
1. Usuário autentica
2. Estado local carregado
3. Estado da nuvem carregado  
4. Comparação de timestamps
5. Merge inteligente de dados
6. Atualização da interface

### Durante Uso
1. Mudanças auto-salvas localmente
2. Debounce para evitar spam
3. Sync periódico com nuvem
4. Resolução de conflitos

### Logout
1. Estado final salvo na nuvem
2. Limpeza de dados locais sensíveis
3. Invalidação de tokens

## 🐛 Tratamento de Erros

### Erros de Rede
- Fallback para armazenamento local
- Retry automático quando volta online
- Notificações de status de conexão

### Erros de Autenticação
- Mensagens em português
- Validação de formulários
- Feedback visual imediato

### Conflitos de Dados
- Prioridade por timestamp
- Backup de versões conflitantes
- Log de decisões de merge

## 📊 Monitoramento

### Métricas Disponíveis
- Usuários ativos
- Sessões de estudo
- Performance por matéria
- Tempo de uso da aplicação

### Dashboards
- Analytics no Supabase Dashboard
- Métricas de auth e database
- Logs de erros e performance

## 🔮 Próximas Funcionalidades

### Planejadas
- [ ] Login com GitHub/Discord
- [ ] 2FA (Two-Factor Authentication)
- [ ] Compartilhamento de planos de estudo
- [ ] Gamificação com ranking
- [ ] Notificações push
- [ ] Modo offline avançado

### Em Consideração
- [ ] Single Sign-On (SSO)
- [ ] API para integrações
- [ ] Webhooks para eventos
- [ ] Backup/export de dados

## 📞 Suporte

Para problemas relacionados ao sistema de autenticação:

1. Verifique as variáveis de ambiente
2. Confirme o schema no Supabase
3. Teste a conectividade
4. Consulte os logs do navegador
5. Verifique o dashboard do Supabase

## 📚 Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de Autenticação](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [OAuth com Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

*Sistema implementado com ❤️ para o ConcursoGenius*