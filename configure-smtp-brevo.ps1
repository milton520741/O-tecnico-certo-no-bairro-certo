# Configure Brevo SMTP in Supabase via API
# Run this in PowerShell as Administrator

# Supabase API Configuration
$token = "sbp_179a1bfafa725b6f237a4289437b3111f21b7ab9"
$projectRef = "ohfsifdothuvbbpufako"

# Brevo SMTP Configuration
$smtpHost = "smtp-relay.brevo.com"
$smtpPort = 587
$smtpUsername = "acd1eb001@smtp-brevo.com"
$smtpPassword = "xsmtpsib-75699d9de4aed7eb74ae2963e494661b7ef827923d619e1d678d5ac479ccef85-0GR4HRzAMw3fBtWC"
$fromEmail = "evoluingroupoilandgas@gmail.com"

# Prepare headers
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

# Prepare body for SMTP configuration
$body = @{
    "smtp_host" = $smtpHost
    "smtp_port" = $smtpPort
    "smtp_user" = $smtpUsername
    "smtp_pass" = $smtpPassword
    "smtp_from_email" = $fromEmail
    "smtp_from_name" = "EvoluinF"
    "smtp_sender_name" = "EvoluinF - Evolução Infinita"
    "enable_custom_smtp" = $true
} | ConvertTo-Json -Depth 10

Write-Host "🔧 Configurando SMTP do Brevo no Supabase..." -ForegroundColor Cyan
Write-Host "📧 SMTP Host: $smtpHost" -ForegroundColor Gray
Write-Host "🔑 User: $smtpUsername" -ForegroundColor Gray
Write-Host ""

try {
    # Try endpoint 1: /auth/config
    Write-Host "Tentando Endpoint 1: /auth/config..." -ForegroundColor Yellow
    $uri = "https://api.supabase.com/v1/projects/$projectRef/auth/config"
    
    $response = Invoke-WebRequest -Uri $uri `
        -Method PATCH `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ SMTP configurado com sucesso!" -ForegroundColor Green
    Write-Host "Resposta: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
    Write-Host "1. Vai para: https://supabase.com/dashboard/project/$projectRef" -ForegroundColor White
    Write-Host "2. Verifica Authentication > Email" -ForegroundColor White
    Write-Host "3. Testa o envio de um email de confirmação" -ForegroundColor White
}
catch {
    Write-Host "❌ Erro no Endpoint 1" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
    Write-Host ""
    
    # Try endpoint 2: /config with different structure
    try {
        Write-Host "Tentando Endpoint 2: /config..." -ForegroundColor Yellow
        $uri = "https://api.supabase.com/v1/projects/$projectRef/config"
        
        $body2 = @{
            "auth_smtp_host" = $smtpHost
            "auth_smtp_port" = $smtpPort
            "auth_smtp_user" = $smtpUsername
            "auth_smtp_pass" = $smtpPassword
            "auth_smtp_from" = $fromEmail
            "auth_smtp_enabled" = $true
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri $uri `
            -Method PATCH `
            -Headers $headers `
            -Body $body2 `
            -ErrorAction Stop
        
        Write-Host "✅ SMTP configurado com sucesso!" -ForegroundColor Green
        Write-Host "Resposta: $($response.StatusCode)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Erro no Endpoint 2 também" -ForegroundColor Red
        Write-Host "⚠️ Resolve manual:" -ForegroundColor Yellow
        Write-Host "1. Vai para https://supabase.com/dashboard/project/$projectRef" -ForegroundColor White
        Write-Host "2. Authentication > Email Settings" -ForegroundColor White
        Write-Host "3. Habilita Custom SMTP" -ForegroundColor White
        Write-Host "4. Preenche os dados acima" -ForegroundColor White
        Write-Host ""
        Write-Host "Dados para copiar/colar:" -ForegroundColor Cyan
        Write-Host "Host: $smtpHost"
        Write-Host "Port: $smtpPort"
        Write-Host "User: $smtpUsername"
        Write-Host "Pass: $smtpPassword"
        Write-Host "From: $fromEmail"
    }
}

Write-Host ""
Write-Host "⏳ Aguarda 2-3 minutos para as mudanças fazerem efeito..." -ForegroundColor Cyan
