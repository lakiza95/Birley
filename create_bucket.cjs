const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: data1, error: error1 } = await supabase.storage.createBucket('chat-attachments', {
    public: true
  });
  console.log('Chat attachments bucket:', data1, error1);

  const { data: data2, error: error2 } = await supabase.storage.createBucket('student-documents', {
    public: true
  });
  console.log('Student documents bucket:', data2, error2);
}

main();
