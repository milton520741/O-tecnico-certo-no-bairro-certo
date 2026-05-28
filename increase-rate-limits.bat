@echo off
REM Script para aumentar Rate Limits no Supabase usando API REST

setlocal enabledelayedexpansion

set "TOKEN=sbp_179a1bfafa725b6f237a4289437b3111f21b7ab9"
set "PROJECT_REF=ohfsifdothuvbbpufako"

echo.
echo === Aumentando Rate Limits no Supabase ===
echo.

echo Enviando requisicao para aumentar rate limits...
echo.

REM Usar curl para fazer o PATCH
curl -X PATCH "https://api.supabase.com/v1/projects/%PROJECT_REF%/config" ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"rate_limit_mail_max_emails\": 10000, \"rate_limit_mail_rate_interval\": 1}" ^
  -s -w "\nStatus: %%{http_code}\n"

echo.
echo Alternativa: Configure manualmente no dashboard
echo URL: https://app.supabase.com/project/%PROJECT_REF%/settings/auth
echo.

pause
