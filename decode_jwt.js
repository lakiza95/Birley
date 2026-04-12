const key = process.env.VITE_SUPABASE_ANON_KEY;
if (key) {
  const payload = key.split('.')[1];
  const decoded = Buffer.from(payload, 'base64').toString('utf8');
  console.log(decoded);
}
