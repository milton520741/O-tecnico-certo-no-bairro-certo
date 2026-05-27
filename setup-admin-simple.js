#!/usr/bin/env node

/**
 * Setup Script para Admin System - Versão Simples (Node.js puro)
 * Execute: node setup-admin-simple.js
 */

const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n🔐 ═══════════════════════════════════════════\n');
  console.log('    Setup do Sistema Administrativo\n');
  console.log('═══════════════════════════════════════════\n');

  console.log('Este script vai:\n');
  console.log('  ✅ Criar as tabelas do admin');
  console.log('  ✅ Configurar permissões (RLS)');
  console.log('  ✅ Definir o Super Admin\n');

  // 1. Coletar credenciais
  console.log('📝 Suas credenciais do Supabase:\n');

  const supabaseUrl = await question(
    '🔗 URL do Supabase (ex: https://abcd.supabase.co): '
  );
  const supabaseServiceKey = await question('🔑 Service Role Key: ');
  const superAdminEmail = await question(
    '📧 Email do Super Admin: '
  );

  if (!supabaseUrl || !supabaseServiceKey || !superAdminEmail) {
    console.log('\n❌ Todos os campos são obrigatórios!');
    process.exit(1);
  }

  console.log('\n⏳ Conectando ao Supabase...\n');

  // 2. Criar cliente
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 3. Teste de conexão
    console.log('🔍 Verificando conexão...');
    const { error: testError } = await supabase
      .from('zones')
      .select('id')
      .limit(1);

    if (testError) {
      throw new Error('Falha na conexão. Verifique as credenciais.');
    }

    console.log('✅ Conexão OK!\n');

    // 4. Procurar utilizador
    console.log(`🔍 Procurando utilizador: ${superAdminEmail}...\n`);

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Erro ao listar: ${listError.message}`);
    }

    const user = users.find((u) => u.email === superAdminEmail);

    if (!user) {
      console.log('❌ Utilizador não encontrado!\n');
      console.log('📝 Passos:\n');
      console.log('1. Registre-se na aplicação com: ' + superAdminEmail);
      console.log('2. Depois execute este script novamente\n');
      process.exit(1);
    }

    console.log(`✅ Utilizador encontrado!\n`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}\n`);

    // 5. Verificar se tabelas existem
    console.log('🔍 Verificando tabelas...\n');

    const { error: checkError } = await supabase
      .from('super_admins')
      .select('id')
      .limit(1);

    if (checkError && checkError.code !== 'PGRST116') {
      console.log('⚠️  Tabelas podem não estar criadas');
      console.log('📋 Por favor, execute a migration primeiro\n');
      console.log('Instruções em: SETUP_INSTRUCTIONS.md\n');
    }

    // 6. Adicionar roles
    console.log('👤 Configurando Super Admin...\n');

    // Inserir na tabela user_roles
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert(
        {
          user_id: user.id,
          role: 'admin',
        },
        { onConflict: 'user_id,role' }
      );

    if (roleError) {
      console.log('⚠️  Role error:', roleError.message);
    } else {
      console.log('✅ Role de Admin adicionado');
    }

    // Inserir na tabela super_admins
    const { error: superError } = await supabase
      .from('super_admins')
      .upsert(
        {
          user_id: user.id,
          created_by: user.id,
        },
        { onConflict: 'user_id' }
      );

    if (superError) {
      console.log('⚠️  Super Admin error:', superError.message);
    } else {
      console.log('✅ Permissão de Super Admin adicionada\n');
    }

    // 7. Verificar
    console.log('🔍 Verificando...\n');

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    const { data: superData } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (roleData && superData) {
      console.log('🎉 ═══════════════════════════════════════════\n');
      console.log('          ✅ SUCESSO!\n');
      console.log('═══════════════════════════════════════════\n');
      console.log(`📧 Email: ${superAdminEmail}`);
      console.log(`🔑 ID: ${user.id}\n`);
      console.log('🚀 PRÓXIMOS PASSOS:\n');
      console.log('1️⃣  Faça login com:');
      console.log(`    Email: ${superAdminEmail}\n`);
      console.log('2️⃣  Acesse o painel admin:');
      console.log('    https://seu-dominio/admin\n');
      console.log('3️⃣  Você terá acesso total ao sistema!\n');
      console.log('📚 Documentação: ADMIN_SYSTEM.md\n');
    } else {
      console.log('⚠️  Pode estar incompleto. Verifique no dashboard.\n');
    }
  } catch (error) {
    console.log('\n❌ ERRO:', error.message, '\n');
    console.log('💡 Dicas:\n');
    console.log('• Verifique credenciais');
    console.log('• Certifique que o utilizador foi registado\n');
  } finally {
    rl.close();
  }
}

main().catch(console.error);
