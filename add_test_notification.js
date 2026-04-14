import { Client } from 'pg';

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to DB');
    
    // Get a user ID to associate the notification with
    const res = await client.query('SELECT id FROM profiles LIMIT 1');
    if (res.rows.length === 0) {
      console.log('No users found to add notification to');
      return;
    }
    const userId = res.rows[0].id;
    console.log('Using user ID:', userId);

    await client.query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES ($1, 'Test Notification', 'This is a test notification to verify the bell icon.', 'info')
    `, [userId]);
    
    console.log('Added test notification');
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
