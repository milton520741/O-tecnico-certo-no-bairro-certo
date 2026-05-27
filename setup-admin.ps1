# Setup Admin System - PowerShell Script
# Para Evolution Connect

param(
    [string]$SupabaseUrl = "",
    [string]$ServiceRoleKey = "",
    [string]$SuperAdminEmail = "Miltonfernandoalfredo@gmail.com"
)

# Cores
$colors = @{
    "Green" = [System.ConsoleColor]::Green
    "Red" = [System.ConsoleColor]::Red
    "Yellow" = [System.ConsoleColor]::Yellow
    "Cyan" = [System.ConsoleColor]::Cyan
    "White" = [System.ConsoleColor]::White
}

function Write-Color([string]$Message, [string]$Color = "White") {
    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Write-Title([string]$Title) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
    Write-Color "  $Title" "Cyan"
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

# Início
Clear-Host
Write-Title "🔐 Setup do Sistema Administrativo"

Write-Color "Este script vai:" "White"
Write-Color "✅ Aplicar a migration do admin" "Green"
Write-Color "✅ Configurar o Super Admin" "Green"
Write-Color "✅ Testar a conexão`n" "Green"

# 1. Coletar credenciais se não fornecidas
if (-not $SupabaseUrl) {
    Write-Color "📝 Credenciais do Supabase:" "Yellow"
    Write-Host ""
    $SupabaseUrl = Read-Host "🔗 Supabase URL (ex: https://ohfsifdothuvbbpufako.supabase.co)"
}

if (-not $ServiceRoleKey) {
    $ServiceRoleKey = Read-Host "🔑 Service Role Key"
}

$SuperAdminEmail = Read-Host "📧 Email do Super Admin (padrão: $SuperAdminEmail)" 
if (-not $SuperAdminEmail) {
    $SuperAdminEmail = "Miltonfernandoalfredo@gmail.com"
}

Write-Host ""
Write-Color "⏳ Processando..." "Yellow"

# 2. Validar entrada
if (-not $SupabaseUrl -or -not $ServiceRoleKey) {
    Write-Color "❌ Credenciais obrigatórias não fornecidas!" "Red"
    exit 1
}

# Garantir que URL tem https
if (-not $SupabaseUrl.StartsWith("https")) {
    $SupabaseUrl = "https://$SupabaseUrl"
}

Write-Host ""
Write-Color "🔍 Testando conexão..." "Cyan"

# 3. Testar conexão usando curl/Invoke-WebRequest
try {
    $headers = @{
        "Authorization" = "Bearer $ServiceRoleKey"
        "Content-Type" = "application/json"
    }
    
    $testResponse = Invoke-WebRequest -Uri "$SupabaseUrl/rest/v1/zones?select=id&limit=1" `
        -Headers $headers `
        -Method GET `
        -ErrorAction Stop
    
    Write-Color "✅ Conexão bem-sucedida!" "Green"
} catch {
    Write-Color "❌ Falha na conexão!" "Red"
    Write-Color "Erro: $($_.Exception.Message)" "Red"
    exit 1
}

Write-Host ""
Write-Color "🔍 Procurando utilizador: $SuperAdminEmail..." "Cyan"

# 4. Procurar utilizador via API
try {
    $authHeaders = @{
        "Authorization" = "Bearer $ServiceRoleKey"
        "Content-Type" = "application/json"
    }
    
    $usersResponse = Invoke-WebRequest -Uri "$SupabaseUrl/auth/v1/admin/users" `
        -Headers $authHeaders `
        -Method GET `
        -ErrorAction Stop | ConvertFrom-Json
    
    $user = $usersResponse | Where-Object { $_.email -eq $SuperAdminEmail }
    
    if (-not $user) {
        Write-Color "❌ Utilizador não encontrado!" "Red"
        Write-Host ""
        Write-Color "📝 Passos:" "Yellow"
        Write-Color "1. Registre-se na aplicação com: $SuperAdminEmail" "White"
        Write-Color "2. Depois execute este script novamente" "White"
        Write-Host ""
        exit 1
    }
    
    $userId = $user.id
    Write-Color "✅ Utilizador encontrado!" "Green"
    Write-Color "   Email: $($user.email)" "White"
    Write-Color "   ID: $userId" "White"
    
} catch {
    Write-Color "❌ Erro ao listar utilizadores!" "Red"
    Write-Color "Erro: $($_.Exception.Message)" "Red"
    exit 1
}

Write-Host ""
Write-Color "👤 Configurando Super Admin..." "Cyan"

# 5. Adicionar role de admin
try {
    $roleData = @{
        user_id = $userId
        role = "admin"
    } | ConvertTo-Json
    
    $headers = @{
        "Authorization" = "Bearer $ServiceRoleKey"
        "Content-Type" = "application/json"
        "Prefer" = "resolution=merge-duplicates"
    }
    
    Invoke-WebRequest -Uri "$SupabaseUrl/rest/v1/user_roles" `
        -Headers $headers `
        -Method POST `
        -Body $roleData `
        -ErrorAction Stop | Out-Null
    
    Write-Color "✅ Role de Admin adicionado" "Green"
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Color "⚠️  Admin já existe" "Yellow"
    } else {
        Write-Color "⚠️  Aviso ao adicionar role: $($_.Exception.Message)" "Yellow"
    }
}

# 6. Adicionar como super admin
try {
    $superData = @{
        user_id = $userId
        created_by = $userId
    } | ConvertTo-Json
    
    $headers = @{
        "Authorization" = "Bearer $ServiceRoleKey"
        "Content-Type" = "application/json"
        "Prefer" = "resolution=merge-duplicates"
    }
    
    Invoke-WebRequest -Uri "$SupabaseUrl/rest/v1/super_admins" `
        -Headers $headers `
        -Method POST `
        -Body $superData `
        -ErrorAction Stop | Out-Null
    
    Write-Color "✅ Permissão de Super Admin adicionada" "Green"
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Color "⚠️  Super Admin já existe" "Yellow"
    } else {
        Write-Color "⚠️  Aviso ao adicionar super admin: $($_.Exception.Message)" "Yellow"
    }
}

Write-Host ""
Write-Color "🔍 Verificando configuração..." "Cyan"

# 7. Verificar
try {
    $headers = @{
        "Authorization" = "Bearer $ServiceRoleKey"
        "Content-Type" = "application/json"
    }
    
    $roleCheck = Invoke-WebRequest -Uri "$SupabaseUrl/rest/v1/user_roles?user_id=eq.$userId&role=eq.admin" `
        -Headers $headers `
        -Method GET `
        -ErrorAction Stop | ConvertFrom-Json
    
    $superCheck = Invoke-WebRequest -Uri "$SupabaseUrl/rest/v1/super_admins?user_id=eq.$userId" `
        -Headers $headers `
        -Method GET `
        -ErrorAction Stop | ConvertFrom-Json
    
    if ($roleCheck -and $superCheck) {
        Write-Title "🎉 SUCESSO!"
        Write-Color "✅ Sistema administrativo configurado!" "Green"
        Write-Host ""
        Write-Color "📧 Email: $SuperAdminEmail" "White"
        Write-Color "🔑 ID: $userId" "White"
        Write-Host ""
        Write-Title "🚀 PRÓXIMOS PASSOS"
        
        Write-Color "1️⃣  Faça login com:" "Cyan"
        Write-Color "   Email: $SuperAdminEmail" "White"
        Write-Color "   Senha: (a que você criou)" "White"
        Write-Host ""
        
        Write-Color "2️⃣  Acesse o painel admin:" "Cyan"
        Write-Color "   https://seu-dominio/admin" "White"
        Write-Host ""
        
        Write-Color "3️⃣  Você terá acesso total ao sistema!" "Cyan"
        Write-Host ""
        Write-Color "📚 Documentação: ADMIN_SYSTEM.md" "Yellow"
        Write-Host ""
    } else {
        Write-Color "⚠️  Pode estar incompleto. Verifique no dashboard." "Yellow"
    }
    
} catch {
    Write-Color "⚠️  Erro ao verificar: $($_.Exception.Message)" "Yellow"
}

Write-Host ""
Write-Color "════════════════════════════════════════════" "Green"
Write-Color "✅ Setup concluído!" "Green"
Write-Color "════════════════════════════════════════════" "Green"
Write-Host ""
