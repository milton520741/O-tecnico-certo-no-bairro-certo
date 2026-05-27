#!/usr/bin/env node

/**
 * Setup Script para Admin System
 * Execute: node setup-admin.js ou npx ts-node setup-admin.ts
 */

import * as readline from 'readline';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n🔐 Setup do Sistema Administrativo\n');
  console.log('Este script vai:');
  console.log('✅ Criar as tabelas do admin');
  console.log('✅ Configurar permissões (RLS)');
  console.log('✅ Definir o Super Admin\n');

  // 1. Coletar credenciais
  console.log('📝 Primeiro, vamos coletar suas credenciais do Supabase:\n');

  const supabaseUrl = await question('🔗 Supabase URL (ex: https://abcd.supabase.co): ');
  const supabaseServiceKey = await question('🔑 Service Role Key: ');
  const superAdminEmail = await question(
    '📧 Email do Super Admin (ex: Miltonfernandoalfredo@gmail.com): '
  );

  if (!supabaseUrl || !supabaseServiceKey || !superAdminEmail) {
    console.log('\n❌ Todos os campos são obrigatórios!');
    process.exit(1);
  }

  console.log('\n⏳ Conectando ao Supabase...\n');

  // 2. Criar cliente Supabase
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 3. Verificar conexão
    console.log('🔍 Verificando conexão...');
    const { data: testData, error: testError } = await supabase
      .from('zones')
      .select('count')
      .limit(1);

    if (testError) {
      throw new Error('Falha na conexão ao Supabase. Verifique as credenciais.');
    }

    console.log('✅ Conexão bem-sucedida!\n');

    // 4. Carregar e executar migration
    console.log('📥 Carregando migration do admin system...');

    const migrationPath = path.join(
      process.cwd(),
      'supabase/migrations/20260527_admin_system.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration não encontrada em: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('🚀 Executando migration...');

    // Executar a migration via RPC ou SQL direto
    const { error: migrationError } = await supabase.rpc('exec', {
      sql: migrationSQL,
    });

    // Se RPC não funcionar, tentar dividir o SQL em statements
    if (migrationError) {
      console.log('⚠️  RPC não disponível, dividindo SQL...');

      const statements = migrationSQL
        .split(';')
        .filter((s) => s.trim().length > 0);

      let executedCount = 0;
      for (const statement of statements) {
        if (statement.trim().startsWith('--')) {
          continue; // Pular comentários
        }

        try {
          const { error: execError } = await supabase.rpc('exec', {
            sql: statement + ';',
          });

          if (!execError) {
            executedCount++;
            process.stdout.write('.');
          }
        } catch (err) {
          // Continuar mesmo se alguns falharem
        }
      }

      console.log(`\n✅ ${executedCount} statements executados`);
    } else {
      console.log('✅ Migration executada com sucesso!\n');
    }

    // 5. Procurar pelo utilizador
    console.log(`\n🔍 Procurando utilizador: ${superAdminEmail}...\n`);

    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      throw new Error(`Erro ao listar utilizadores: ${usersError.message}`);
    }

    const user = users.users.find((u) => u.email === superAdminEmail);

    if (!user) {
      console.log('❌ Utilizador não encontrado!');
      console.log(`\n📝 Por favor, registre-se primeiro via aplicação com: ${superAdminEmail}\n`);
      console.log('Depois execute este script novamente.');
      process.exit(1);
    }

    console.log(`✅ Utilizador encontrado! ID: ${user.id}\n`);

    // 6. Adicionar como admin
    console.log('👤 Configurando como Super Admin...\n');

    // Adicionar à tabela de user_roles
    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: user.id,
      role: 'admin',
    });

    if (roleError && !roleError.message.includes('duplicate')) {
      throw new Error(`Erro ao adicionar role: ${roleError.message}`);
    }

    console.log('✅ Role de Admin adicionado');

    // Adicionar à tabela de super_admins
    const { error: superError } = await supabase.from('super_admins').insert({
      user_id: user.id,
      created_by: user.id,
    });

    if (superError && !superError.message.includes('duplicate')) {
      throw new Error(`Erro ao adicionar super admin: ${superError.message}`);
    }

    console.log('✅ Permissão de Super Admin adicionada\n');

    // 7. Verificação final
    console.log('🔍 Verificando configuração...\n');

    const { data: verifyRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const { data: verifySuper } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (verifyRole && verifySuper) {
      console.log('✅ Configuração verificada!\n');
      console.log('🎉 SUCESSO!\n');
      console.log('═══════════════════════════════════════');
      console.log('✅ Sistema administrativo configurado!');
      console.log('═══════════════════════════════════════\n');
      console.log(`📧 Super Admin: ${superAdminEmail}`);
      console.log(`🔑 User ID: ${user.id}\n`);
      console.log('🚀 Próximos passos:\n');
      console.log('1. Faça login na aplicação com:');
      console.log(`   Email: ${superAdminEmail}`);
      console.log(`   Senha: (a que você criou)\n`);
      console.log('2. Acesse o painel admin em:');
      console.log('   https://seu-dominio/admin\n');
      console.log('3. Você terá acesso total ao sistema\n');
      console.log('📚 Para mais info, veja: ADMIN_SYSTEM.md');
    } else {
      console.log('⚠️  Aviso: Configuração pode estar incompleta');
      console.log('Verifique no dashboard do Supabase se os dados foram criados');
    }
  } catch (error) {
    console.log('\n❌ ERRO:', error instanceof Error ? error.message : String(error));
    console.log('\n💡 Dicas:');
    console.log('- Verifique se as credenciais estão corretas');
    console.log('- Certifique-se de que o utilizador foi registado');
    console.log('- Se usar SQL Editor no dashboard, copie o conteúdo de:');
    console.log('  supabase/migrations/20260527_admin_system.sql\n');
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
