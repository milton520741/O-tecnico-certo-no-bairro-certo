# Configuração de Rate Limits - Instruções

## Status: Aguardando Autenticação ⏳

Clique neste link para fazer login no seu navegador:
https://supabase.com/dashboard/cli/login?session_id=0ca1c2b9-521c-4363-af59-e0e858199b19&token_name=cli_DOPVHELMAN\milto@DOPVHELMAN_1779968438&public_key=040ceabeeee5ce2ac5f8cb7153da4a6011d5c116636c0ad837edf87cd3b4df2b5a229cfa6236a385e3e20f5ef4f7fc2d592e9dfde18739cbf34432b8c9de155715

Ou acesse:
https://app.supabase.com/cli/login

Após fazer login:
1. Um código de verificação será mostrado
2. Cole o código no terminal (ele está esperando)
3. A autenticação será concluída
4. Os rate limits serão aumentados automaticamente

## Rate Limits que serão aplicados (Máximo):

- **Signup/Email**: 10000 requisições por segundo
- **Verificação de Email**: 10000 requisições por segundo
- **SMS**: 10000 requisições por segundo
- **Header Rate Limit**: 1000000 requisições por 3600 segundos (1 hora)

Isso permitirá criar múltiplas contas de teste sem erros de rate limit!
