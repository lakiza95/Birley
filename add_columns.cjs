const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  
  // Add columns to messages table
  try {
    await client.query(`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS file_url TEXT,
      ADD COLUMN IF NOT EXISTS file_name TEXT,
      ADD COLUMN IF NOT EXISTS file_type TEXT;
      
      ALTER TABLE ticket_messages
      ADD COLUMN IF NOT EXISTS file_url TEXT,
      ADD COLUMN IF NOT EXISTS file_name TEXT,
      ADD COLUMN IF NOT EXISTS file_type TEXT;
    `);
    console.log("Columns added successfully!");
  } catch (err) {
    console.error("Error adding columns:", err);
  } finally {
    await client.end();
  }
}

run();
