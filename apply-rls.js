// Script para aplicar RLS Policies ao Supabase via Node.js
// Uso: node apply-rls.js

import fs from 'fs';
import https from 'https';

// Credenciais (extraídas do browser)
const SUPABASE_URL = 'https://ohfsifdothuvbbpufako.supabase.co';
const SERVICE_ROLE_SECRET = process.env.SERVICE_ROLE_SECRET || '';
const PROJECT_REF = 'ohfsifdothuvbbpufako';

// Ler o SQL RLS
const sqlPath = './supabase/20260529_subscriptions_rls_FIXED.sql';
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

console.log('📋 Aplicando RLS Policies...\n');

if (!SERVICE_ROLE_SECRET) {
  console.warn('⚠️  SERVICE_ROLE_SECRET não configurado!');
  console.warn('   Para fazer isso funcionar, execute:');
  console.warn('   set SERVICE_ROLE_SECRET=your_secret_key');
  console.warn('   node apply-rls.js\n');
  process.exit(1);
}

// Fazer chamada à API do Supabase
const options = {
  hostname: `${PROJECT_REF}.supabase.co`,
  port: 443,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_ROLE_SECRET}`,
    'apikey': SERVICE_ROLE_SECRET
  }
};

const data = JSON.stringify({
  sql: sqlContent
});

console.log('🔄 Enviando SQL para Supabase...');
console.log(`   Endpoint: ${options.hostname}${options.path}`);
console.log(`   Método: ${options.method}`);
console.log(`   SQL Linhas: ${sqlContent.split('\n').length}\n`);

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ RLS Policies aplicadas com sucesso!\n');
      console.log('Resultado:', responseData);
    } else {
      console.log('❌ Erro ao aplicar RLS Policies\n');
      console.log('Resposta:', responseData);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro na requisição:', e.message);
});

req.write(data);
req.end();
