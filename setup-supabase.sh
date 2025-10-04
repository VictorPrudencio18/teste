#!/bin/bash

# Script de configuração do Supabase para ConcursoGenius
# Este script ajuda na configuração inicial do Supabase

set -e

echo "🚀 ConcursoGenius - Configuração do Supabase"
echo "==========================================="
echo

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env a partir do .env.example..."
    cp .env.example .env
    echo "✅ Arquivo .env criado!"
    echo
fi

echo "📋 Para configurar o Supabase, você precisa:"
echo "1. Criar uma conta gratuita em: https://app.supabase.com/"
echo "2. Criar um novo projeto"
echo "3. Ir em Settings > API para obter suas credenciais"
echo "4. Executar o schema SQL no SQL Editor do Supabase"
echo

echo "🔑 Credenciais necessárias:"
echo "- VITE_SUPABASE_URL: URL do seu projeto (ex: https://abcdefg.supabase.co)"
echo "- VITE_SUPABASE_ANON_KEY: Chave anônima do projeto"
echo

# Perguntar se o usuário quer abrir os links
read -p "❓ Deseja abrir o Supabase no navegador? (y/n): " open_browser
if [ "$open_browser" = "y" ] || [ "$open_browser" = "Y" ]; then
    if command -v xdg-open > /dev/null; then
        xdg-open "https://app.supabase.com/" 2>/dev/null || true
    elif command -v open > /dev/null; then
        open "https://app.supabase.com/" 2>/dev/null || true
    else
        echo "Por favor, abra manualmente: https://app.supabase.com/"
    fi
fi

echo
echo "📄 Próximos passos:"
echo "1. Edite o arquivo .env e adicione suas credenciais do Supabase"
echo "2. Execute o schema SQL localizado em supabase/schema.sql no SQL Editor do Supabase"
echo "3. Configure a autenticação no painel do Supabase (opcional: Google OAuth)"
echo "4. Execute 'npm run dev' para testar a aplicação"
echo

echo "📚 Documentação:"
echo "- Supabase: https://supabase.com/docs"
echo "- Autenticação: https://supabase.com/docs/guides/auth"
echo "- SQL Editor: https://supabase.com/docs/guides/database/overview#the-sql-editor"
echo

echo "✨ Configuração do Supabase concluída!"
echo "Lembre-se de editar o arquivo .env com suas credenciais."