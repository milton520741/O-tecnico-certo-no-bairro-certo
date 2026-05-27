#!/usr/bin/env node

// Execute SQL directly to Supabase using REST API
const fs = require('fs');
const https = require('https');

// Read SQL file
const sqlCode = fs.readFileSync('./supabase/COMPLETE_SETUP.sql', 'utf8');

// Your Supabase credentials (from environment or .env)
const projectUrl = 'https://ohfsifdothuvbbpufako.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set in environment');
  console.error('Get it from: https://supabase.com/dashboard/project/ohfsifdothuvbbpufako/settings/api');
  process.exit(1);
}

// Split SQL into individual statements and execute
const statements = sqlCode
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`📋 Found ${statements.length} SQL statements to execute`);

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'ohfsifdothuvbbpufako.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, status: res.statusCode });
        } else {
          reject({
            statusCode: res.statusCode,
            message: responseData
          });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  let executed = 0;
  let failed = 0;

  for (const statement of statements) {
    try {
      await executeSQL(statement);
      executed++;
      process.stdout.write('.');
    } catch (error) {
      failed++;
      process.stdout.write('E');
      if (failed <= 3) {
        console.error(`\n⚠️ Error: ${error.message || JSON.stringify(error).slice(0, 100)}`);
      }
    }
  }

  console.log(`\n\n✅ Executed: ${executed}`);
  console.log(`❌ Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
