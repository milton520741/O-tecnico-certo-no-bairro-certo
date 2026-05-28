# Script para aumentar Rate Limits no Supabase via API
# Você precisa gerar um Personal Access Token em: https://app.supabase.com/account/tokens

$projectRef = "ohfsifdothuvbbpufako"
$supabaseUrl = "https://ohfsifdothuvbbpufako.supabase.co"

Write-Host "Para aumentar os rate limits, você precisa de um Access Token pessoal do Supabase"
Write-Host "Acesse: https://app.supabase.com/account/tokens"
Write-Host ""
Write-Host "1. Clique em 'Create Token'"
Write-Host "2. Nome: 'Rate Limit Config'"
Write-Host "3. Copie o token gerado"
Write-Host ""

$accessToken = Read-Host "Cole seu Supabase Personal Access Token aqui"

if (-not $accessToken) {
    Write-Host "Erro: Token não fornecido!"
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

# Configurar rate limits ao máximo
$rateLimitsConfig = @{
    "rate_limit_header_count" = 1000000
    "rate_limit_header_period_seconds" = 3600
    "email_rate_limit_tokens_per_second" = 10000
    "sms_rate_limit_tokens_per_second" = 10000
    "verify_rate_limit_tokens_per_second" = 10000
} | ConvertTo-Json

Write-Host "Enviando configuração de rate limits ao máximo..."

try {
    $response = Invoke-WebRequest -Uri "https://api.supabase.com/v1/projects/$projectRef/auth/config" `
        -Method PUT `
        -Headers $headers `
        -Body $rateLimitsConfig `
        -ErrorAction Stop
    
    Write-Host "✅ Rate limits atualizados com sucesso!" -ForegroundColor Green
    Write-Host $response.Content
}
catch {
    Write-Host "❌ Erro ao atualizar rate limits:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
