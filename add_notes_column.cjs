const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  
  try {
    await client.query(`
      ALTER TABLE applications 
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);
    console.log("Column 'notes' added successfully!");
  } catch (err) {
    console.error("Error adding column:", err);
  } finally {
    await client.end();
  }
}

run();
