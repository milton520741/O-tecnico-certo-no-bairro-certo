# Script para aumentar Rate Limits no Supabase

$projectRef = "ohfsifdothuvbbpufako"

Write-Host "Colando Access Token..." -ForegroundColor Cyan

# Ler token do clipboard ou do input
$token = Read-Host "Cole o Access Token gerado"

if (-not $token) {
    Write-Host "Erro: Token nao fornecido!"
    exit 1
}

Write-Host "Autenticando com Supabase..." -ForegroundColor Cyan
$env:SUPABASE_ACCESS_TOKEN = $token

# Listar projetos para verificar autenticacao
Write-Host "Verificando projetos..." -ForegroundColor Cyan
supabase projects list

Write-Host ""
Write-Host "Vinculando projeto..." -ForegroundColor Cyan
supabase projects link --project-ref $projectRef

Write-Host ""
Write-Host "Aumentando Rate Limits ao maximo..." -ForegroundColor Cyan

# Aumentar rate limits via API REST do Supabase
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Configuracao de rate limits
$config = @{
    "rate_limit_mail_max_emails" = 10000
    "rate_limit_mail_rate_interval" = 1
} | ConvertTo-Json

Write-Host "Enviando configuracao de rate limits..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "https://api.supabase.com/v1/projects/$projectRef/config" `
        -Method PATCH `
        -Headers $headers `
        -Body $config `
        -ErrorAction Stop
    
    Write-Host "Rate limits atualizados com sucesso!" -ForegroundColor Green
}
catch {
    Write-Host "Resposta da API:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "Processo concluido!" -ForegroundColor Green
