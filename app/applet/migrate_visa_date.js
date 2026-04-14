const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to DB');
    
    await client.query(`
      ALTER TABLE applications 
      ADD COLUMN IF NOT EXISTS visa_approved_at TIMESTAMP WITH TIME ZONE;
    `);
    console.log('Added visa_approved_at to applications table');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();