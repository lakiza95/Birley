-- 1. Update students table with new fields from StudentDetail
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS dob TEXT,
ADD COLUMN IF NOT EXISTS passportNumber TEXT,
ADD COLUMN IF NOT EXISTS passportExpiry TEXT,
ADD COLUMN IF NOT EXISTS visaStatus TEXT,
ADD COLUMN IF NOT EXISTS desiredField TEXT,
ADD COLUMN IF NOT EXISTS languageLevels TEXT,
ADD COLUMN IF NOT EXISTS startDate TEXT,
ADD COLUMN IF NOT EXISTS destination TEXT,
ADD COLUMN IF NOT EXISTS educationLevel TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS budget NUMERIC,
ADD COLUMN IF NOT EXISTS preferredSpecialization TEXT;

-- 2. Create withdrawals table for payouts
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure the foreign key exists if the table was already created
DO $$ 
BEGIN 
  -- Drop the old constraint if it points to auth.users
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'withdrawals_user_id_fkey' 
    AND table_name = 'withdrawals'
  ) THEN
    ALTER TABLE withdrawals DROP CONSTRAINT withdrawals_user_id_fkey;
  END IF;
  
  -- Add the new constraint pointing to public.profiles
  ALTER TABLE withdrawals ADD CONSTRAINT withdrawals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
END $$;

-- Enable RLS for withdrawals
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Policies for withdrawals
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON withdrawals;
CREATE POLICY "Users can view their own withdrawals"
  ON withdrawals FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own withdrawals" ON withdrawals;
CREATE POLICY "Users can insert their own withdrawals"
  ON withdrawals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
CREATE POLICY "Admins can view all withdrawals"
  ON withdrawals FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update withdrawals" ON withdrawals;
CREATE POLICY "Admins can update withdrawals"
  ON withdrawals FOR UPDATE
  USING (public.is_admin());

-- 3. Ensure applications table exists and has necessary fields
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Pending',
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for applications if not already enabled
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Basic policies for applications
-- Removed "Recruiters can view their students' applications" because applications already has recruiter_id
-- and it causes infinite recursion with the students policy that queries applications.

DROP POLICY IF EXISTS "Admins and Institutions can view applications" ON applications;
CREATE POLICY "Admins and Institutions can view applications"
  ON applications FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'institution')
  );

-- 4. Update institutions table with contact_email
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS contact_email TEXT UNIQUE;

-- 5. Auto-confirm institution users in auth.users
-- This function will be called when a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_auto_confirm_institution()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the new user's email exists in our institutions table
  IF EXISTS (SELECT 1 FROM public.institutions WHERE contact_email = NEW.email) THEN
    -- Set email_confirmed_at directly on the NEW record
    NEW.email_confirmed_at := NOW();
    NEW.confirmed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate it on auth.users
-- Note: In Supabase, you can add triggers to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auto_confirm_institution();

-- 6. Update programs table with description and specialization
ALTER TABLE programs 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS level TEXT,
ADD COLUMN IF NOT EXISTS intake TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS tuition_fee NUMERIC,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS vacancies INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- 8. Add RLS policies for institutions to manage their own data
DROP POLICY IF EXISTS "Institutions view own record" ON institutions;
CREATE POLICY "Institutions view own record" ON institutions FOR SELECT USING (contact_email = (auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Institutions manage own programs" ON programs;
CREATE POLICY "Institutions manage own programs" ON programs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM institutions
    WHERE institutions.id = programs.institution_id
    AND institutions.contact_email = (auth.jwt() ->> 'email')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM institutions
    WHERE institutions.id = programs.institution_id
    AND institutions.contact_email = (auth.jwt() ->> 'email')
  )
);

DROP POLICY IF EXISTS "Institutions view own program applications" ON applications;
CREATE POLICY "Institutions view own program applications" ON applications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM programs
    JOIN institutions ON institutions.id = programs.institution_id
    WHERE programs.id = applications.program_id
    AND institutions.contact_email = (auth.jwt() ->> 'email')
  )
);

DROP POLICY IF EXISTS "Institutions update own program applications" ON applications;
CREATE POLICY "Institutions update own program applications" ON applications FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM programs
    JOIN institutions ON institutions.id = programs.institution_id
    WHERE programs.id = applications.program_id
    AND institutions.contact_email = (auth.jwt() ->> 'email')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM programs
    JOIN institutions ON institutions.id = programs.institution_id
    WHERE programs.id = applications.program_id
    AND institutions.contact_email = (auth.jwt() ->> 'email')
  )
);

-- 9. Support Tickets System
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure the foreign key exists if the table was already created
DO $$ 
BEGIN 
  -- Drop the old constraint if it points to auth.users
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tickets_user_id_fkey' 
    AND table_name = 'tickets'
  ) THEN
    ALTER TABLE tickets DROP CONSTRAINT tickets_user_id_fkey;
  END IF;
  
  -- Add the new constraint pointing to public.profiles
  ALTER TABLE tickets ADD CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
END $$;

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
CREATE POLICY "Users can view their own tickets" ON tickets 
FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own tickets
DROP POLICY IF EXISTS "Users can insert their own tickets" ON tickets;
CREATE POLICY "Users can insert their own tickets" ON tickets 
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can view all tickets
DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
CREATE POLICY "Admins can view all tickets" ON tickets 
FOR SELECT USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Admins can update all tickets
DROP POLICY IF EXISTS "Admins can update all tickets" ON tickets;
CREATE POLICY "Admins can update all tickets" ON tickets 
FOR UPDATE USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Ticket Messages
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure the foreign key exists if the table was already created
DO $$ 
BEGIN 
  -- Drop the old constraint if it points to auth.users
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ticket_messages_sender_id_fkey' 
    AND table_name = 'ticket_messages'
  ) THEN
    ALTER TABLE ticket_messages DROP CONSTRAINT ticket_messages_sender_id_fkey;
  END IF;
  
  -- Add the new constraint pointing to public.profiles
  ALTER TABLE ticket_messages ADD CONSTRAINT ticket_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
END $$;

ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their own tickets
DROP POLICY IF EXISTS "Users can view messages in their own tickets" ON ticket_messages;
CREATE POLICY "Users can view messages in their own tickets" ON ticket_messages 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = ticket_messages.ticket_id
    AND (tickets.user_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  )
);

-- Users can insert messages in their own tickets
DROP POLICY IF EXISTS "Users can insert messages in their own tickets" ON ticket_messages;
CREATE POLICY "Users can insert messages in their own tickets" ON ticket_messages 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = ticket_messages.ticket_id
    AND (tickets.user_id = auth.uid() OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  )
);
