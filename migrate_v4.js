import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to DB');
    
    const sql = fs.readFileSync(path.join(process.cwd(), 'supabase_migration_v4_business_logic.sql'), 'utf8');
    await client.query(sql);
    console.log('Executed migration v4');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
