import pkg from 'pg';
const { Client } = pkg;

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to DB');
    
    await client.query(`
      ALTER TABLE institutions 
      ADD COLUMN IF NOT EXISTS payment_model TEXT DEFAULT 'full_upfront',
      ADD COLUMN IF NOT EXISTS first_payment_percent INTEGER DEFAULT 100,
      ADD COLUMN IF NOT EXISTS second_payment_deadline_days INTEGER DEFAULT 5;
    `);
    console.log('Updated institutions table with payment fields');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
