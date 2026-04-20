-- 1. Profiles Table (Extends Auth.Users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'partner' CHECK (role IN ('admin', 'partner', 'institution')),
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'EMAIL_VERIFIED', 'PROFILE_COMPLETED', 'PENDING_DOCS', 'UNDER_REVIEW', 'ACTIVE', 'REJECTED')),
  first_name TEXT,
  last_name TEXT,
  whatsapp TEXT,
  phone TEXT,
  country TEXT,
  city TEXT,
  agency TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  experience TEXT,
  markets TEXT[],
  students_per_year TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  region TEXT,
  referral_code TEXT,
  mailing_address TEXT,
  organization_address TEXT,
  tax_id TEXT,
  website TEXT,
  balance NUMERIC DEFAULT 0,
  referred_by_institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was created before
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by_institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mailing_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS markets TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS students_per_year TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agency TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;

-- 2. Institutions Table
CREATE TABLE IF NOT EXISTS institutions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT,
  website TEXT,
  contact_first_name TEXT,
  contact_last_name TEXT,
  type TEXT NOT NULL DEFAULT 'Public',
  status TEXT NOT NULL DEFAULT 'Active',
  logo_url TEXT,
  description TEXT,
  contact_email TEXT UNIQUE,
  balance NUMERIC DEFAULT 0,
  timezone TEXT DEFAULT 'UTC',
  school_commission_rate NUMERIC DEFAULT 0,
  recruiter_commission_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was created before
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS contact_first_name TEXT;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS contact_last_name TEXT;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS contact_email TEXT UNIQUE;

-- 3. Programs Table
CREATE TABLE IF NOT EXISTS programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  duration TEXT,
  intake TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  vacancies INTEGER DEFAULT 0,
  tuition_fee NUMERIC,
  currency TEXT DEFAULT 'EUR',
  description TEXT,
  specialization TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE programs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS visa_suitability TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS min_age INTEGER;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS max_age INTEGER;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS language_certificate_required BOOLEAN DEFAULT FALSE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS min_language_score NUMERIC;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS experience_required BOOLEAN DEFAULT FALSE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS enrollment_deadline DATE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS commission NUMERIC DEFAULT 0;

-- 4. Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  avatar_url TEXT,
  dob TEXT,
  passportNumber TEXT,
  passportExpiry TEXT,
  visaStatus TEXT,
  desiredField TEXT,
  preferredSpecialization TEXT,
  languageLevels TEXT,
  startDate TEXT,
  destination TEXT,
  educationLevel TEXT,
  whatsapp TEXT,
  main_number TEXT,
  firstname TEXT,
  middlename TEXT,
  lastname TEXT,
  citizenship TEXT,
  budget NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE students ADD COLUMN IF NOT EXISTS firstname TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS middlename TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS lastname TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS citizenship TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS main_number TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS dob TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS passportNumber TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS passportExpiry TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS visaStatus TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS desiredField TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS preferredSpecialization TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS languageLevels TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS startDate TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS destination TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS educationLevel TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS budget NUMERIC;

-- 4.1 Student Documents Table
CREATE TABLE IF NOT EXISTS student_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Submitted',
  payment_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_link TEXT;

-- RLS POLICIES

-- Sync role to auth.users metadata
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    coalesce(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;
CREATE TRIGGER on_profile_update
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_update();

-- Initial sync for existing users
-- This will run when the schema is applied
DO $$
BEGIN
  UPDATE auth.users u
  SET raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', p.role)
  FROM public.profiles p
  WHERE u.id = p.id;
END $$;

-- Function to check user existence safely
CREATE OR REPLACE FUNCTION public.check_user_status(email_input TEXT)
RETURNS TABLE (status TEXT, user_role TEXT) AS $$
BEGIN
  -- Check profiles first
  IF EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(email) = LOWER(email_input)) THEN
    RETURN QUERY SELECT 'existing'::TEXT, role FROM public.profiles WHERE LOWER(email) = LOWER(email_input) LIMIT 1;
    RETURN;
  END IF;

  -- Check institutions
  IF EXISTS (SELECT 1 FROM public.institutions WHERE LOWER(contact_email) = LOWER(email_input)) THEN
    RETURN QUERY SELECT 'new_institution'::TEXT, 'institution'::TEXT;
    RETURN;
  END IF;

  -- Check auth.users as a last resort (if profile creation failed)
  IF EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(email_input)) THEN
    RETURN QUERY SELECT 'existing'::TEXT, (raw_user_meta_data->>'role')::TEXT FROM auth.users WHERE LOWER(email) = LOWER(email_input) LIMIT 1;
    RETURN;
  END IF;

  -- Default
  RETURN QUERY SELECT 'not_found'::TEXT, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's profile safely (handles both profiles and institutions)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS JSONB AS $$
DECLARE
  profile_data JSONB;
  inst_data JSONB;
BEGIN
  -- 1. Try to find in profiles (Recruiters/Admins)
  SELECT jsonb_build_object(
    'id', p.id,
    'email', p.email,
    'role', p.role,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'phone', p.phone,
    'whatsapp', p.whatsapp,
    'country', p.country,
    'city', p.city,
    'agency', p.agency,
    'bio', p.bio,
    'is_verified', p.is_verified,
    'balance', p.balance,
    'status', p.status,
    'onboarding_completed', p.onboarding_completed,
    'region', p.region,
    'referred_by_institution_id', p.referred_by_institution_id
  ) INTO profile_data
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF profile_data IS NOT NULL THEN
    -- If it's an institution role, try to attach institution_id from institutions table
    IF (profile_data->>'role') = 'institution' THEN
      profile_data = profile_data || jsonb_build_object(
        'institution_id', (SELECT id FROM public.institutions WHERE LOWER(contact_email) = LOWER(profile_data->>'email') LIMIT 1)
      );
    END IF;
    RETURN profile_data;
  END IF;

  -- 2. Try to find in institutions (Schools)
  -- We match by email since institution IDs in auth.users and institutions table might differ 
  -- if they were pre-created by admin
  SELECT jsonb_build_object(
    'id', auth.uid(), -- Use auth UID as the primary ID for the session
    'institution_id', i.id,
    'email', i.contact_email,
    'role', 'institution',
    'first_name', i.name, -- Use name as first_name for UI compatibility
    'last_name', '',
    'name', i.name,
    'status', 'APPROVED',
    'onboarding_completed', true,
    'timezone', i.timezone
  ) INTO inst_data
  FROM public.institutions i
  WHERE LOWER(i.contact_email) = LOWER(auth.jwt() -> 'app_metadata' ->> 'email')
     OR LOWER(i.contact_email) = LOWER(auth.jwt() ->> 'email');

  RETURN inst_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Correct path for Supabase user_metadata
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_institution()
RETURNS BOOLEAN AS $$
BEGIN
  -- Correct path for Supabase user_metadata
  RETURN (auth.jwt() -> 'user_metadata' ->> 'role') = 'institution';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can read their own profile, admins can read all, others can see admin profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
DROP POLICY IF EXISTS "Users can view admin profiles" ON profiles;
CREATE POLICY "Users can view admin profiles" ON profiles FOR SELECT USING (role = 'admin');
DROP POLICY IF EXISTS "Users can view profiles related to their applications" ON profiles;
CREATE POLICY "Users can view profiles related to their applications" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM applications
    JOIN programs ON applications.program_id = programs.id
    JOIN institutions ON programs.institution_id = institutions.id
    WHERE 
      (applications.recruiter_id = profiles.id AND LOWER(institutions.contact_email) = LOWER(auth.jwt() ->> 'email'))
      OR
      (LOWER(institutions.contact_email) = LOWER(profiles.email) AND applications.recruiter_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Institutions can view their referrals" ON profiles;
CREATE POLICY "Institutions can view their referrals" ON profiles 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM institutions 
    WHERE id = profiles.referred_by_institution_id 
    AND LOWER(contact_email) = LOWER(auth.jwt() ->> 'email')
  )
);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Institutions: Everyone can read active institutions
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active institutions" ON institutions;
CREATE POLICY "Public read active institutions" ON institutions FOR SELECT USING (status = 'Active');
DROP POLICY IF EXISTS "Institutions view own record" ON institutions;
CREATE POLICY "Institutions view own record" ON institutions FOR SELECT USING (LOWER(contact_email) = LOWER(auth.jwt() ->> 'email'));
DROP POLICY IF EXISTS "Admins manage institutions" ON institutions;
CREATE POLICY "Admins manage institutions" ON institutions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Programs: Everyone can read active programs
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active programs" ON programs;
CREATE POLICY "Public read active programs" ON programs FOR SELECT USING (status = 'Active');
DROP POLICY IF EXISTS "Institutions manage own programs" ON programs;
CREATE POLICY "Institutions manage own programs" ON programs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM institutions
    WHERE institutions.id = programs.institution_id
    AND LOWER(institutions.contact_email) = LOWER(auth.jwt() ->> 'email')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM institutions
    WHERE institutions.id = programs.institution_id
    AND LOWER(institutions.contact_email) = LOWER(auth.jwt() ->> 'email')
  )
);
DROP POLICY IF EXISTS "Admins manage programs" ON programs;
CREATE POLICY "Admins manage programs" ON programs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Students: Recruiters can manage their own students, admins can see all
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Recruiters manage own students" ON students;
CREATE POLICY "Recruiters manage own students" ON students FOR ALL USING (recruiter_id = auth.uid());
DROP POLICY IF EXISTS "Admins view all students" ON students;
CREATE POLICY "Admins view all students" ON students FOR SELECT USING (public.is_admin());

-- Applications: Recruiters manage own, institutions see their apps, admins see all
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Recruiters manage own apps" ON applications;
CREATE POLICY "Recruiters manage own apps" ON applications FOR ALL USING (recruiter_id = auth.uid());
DROP POLICY IF EXISTS "Institutions view own program applications" ON applications;
CREATE POLICY "Institutions view own program applications" ON applications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM programs
    JOIN institutions ON institutions.id = programs.institution_id
    WHERE programs.id = applications.program_id
    AND LOWER(institutions.contact_email) = LOWER(auth.jwt() ->> 'email')
  )
);
DROP POLICY IF EXISTS "Institutions update own program applications" ON applications;
CREATE POLICY "Institutions update own program applications" ON applications FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM programs
    JOIN institutions ON institutions.id = programs.institution_id
    WHERE programs.id = applications.program_id
    AND LOWER(institutions.contact_email) = LOWER(auth.jwt() ->> 'email')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM programs
    JOIN institutions ON institutions.id = programs.institution_id
    WHERE programs.id = applications.program_id
    AND LOWER(institutions.contact_email) = LOWER(auth.jwt() ->> 'email')
  )
);
DROP POLICY IF EXISTS "Admins view all apps" ON applications;
CREATE POLICY "Admins view all apps" ON applications FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins update all apps" ON applications;
CREATE POLICY "Admins update all apps" ON applications FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Student Documents: Recruiters manage own, admins see all
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Recruiters manage own student documents" ON student_documents;
CREATE POLICY "Recruiters manage own student documents" ON student_documents 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM students 
    WHERE students.id = student_documents.student_id 
    AND students.recruiter_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Admins view all student documents" ON student_documents;
CREATE POLICY "Admins view all student documents" ON student_documents 
FOR SELECT USING (public.is_admin());

-- Function to update profile data (for prototype)
CREATE OR REPLACE FUNCTION public.update_profile_prototype(user_id UUID, profile_data JSONB)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET 
    first_name = COALESCE(profile_data->>'first_name', first_name),
    last_name = COALESCE(profile_data->>'last_name', last_name),
    whatsapp = COALESCE(profile_data->>'whatsapp', whatsapp),
    phone = COALESCE(profile_data->>'phone', phone),
    country = COALESCE(profile_data->>'country', country),
    city = COALESCE(profile_data->>'city', city),
    agency = COALESCE(profile_data->>'agency', agency),
    experience = COALESCE(profile_data->>'experience', experience),
    students_per_year = COALESCE(profile_data->>'students_per_year', students_per_year),
    referral_code = COALESCE(profile_data->>'referral_code', referral_code),
    balance = COALESCE((profile_data->>'balance')::NUMERIC, balance),
    status = COALESCE(profile_data->>'status', status),
    bio = COALESCE(profile_data->>'bio', bio),
    onboarding_completed = COALESCE((profile_data->>'onboarding_completed')::BOOLEAN, onboarding_completed),
    region = COALESCE(profile_data->>'region', region),
    mailing_address = COALESCE(profile_data->>'mailing_address', mailing_address),
    organization_address = COALESCE(profile_data->>'organization_address', organization_address),
    tax_id = COALESCE(profile_data->>'tax_id', tax_id),
    website = COALESCE(profile_data->>'website', website),
    referred_by_institution_id = COALESCE((profile_data->>'referred_by_institution_id')::UUID, referred_by_institution_id),
    markets = CASE 
                WHEN profile_data ? 'markets' THEN ARRAY(SELECT jsonb_array_elements_text(profile_data->'markets'))
                ELSE markets 
              END
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fallback function to create profile if trigger failed
CREATE OR REPLACE FUNCTION public.create_profile_if_missing(user_id UUID, user_email TEXT, user_metadata JSONB)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    role, 
    first_name, 
    last_name, 
    whatsapp, 
    phone,
    country, 
    city,
    agency,
    bio,
    referred_by_institution_id
  )
  VALUES (
    user_id, 
    user_email, 
    COALESCE(user_metadata->>'role', 'partner'),
    user_metadata->>'first_name',
    user_metadata->>'last_name',
    user_metadata->>'whatsapp',
    user_metadata->>'phone',
    user_metadata->>'country',
    user_metadata->>'city',
    user_metadata->>'agency',
    user_metadata->>'bio',
    (user_metadata->>'referred_by_institution_id')::UUID
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profile creation on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    role, 
    first_name, 
    last_name, 
    whatsapp, 
    phone,
    country, 
    city,
    agency,
    bio,
    referred_by_institution_id
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'partner'),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'agency',
    new.raw_user_meta_data->>'bio',
    (new.raw_user_meta_data->>'referred_by_institution_id')::UUID
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = COALESCE(EXCLUDED.role, profiles.role),
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    whatsapp = COALESCE(EXCLUDED.whatsapp, profiles.whatsapp),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    country = COALESCE(EXCLUDED.country, profiles.country),
    city = COALESCE(EXCLUDED.city, profiles.city),
    agency = COALESCE(EXCLUDED.agency, profiles.agency),
    bio = COALESCE(EXCLUDED.bio, profiles.bio),
    referred_by_institution_id = COALESCE(EXCLUDED.referred_by_institution_id, profiles.referred_by_institution_id),
    updated_at = NOW();
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error or handle gracefully
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Help Center Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tickets
DROP POLICY IF EXISTS "Users can manage own tickets" ON tickets;
CREATE POLICY "Users can manage own tickets" ON tickets 
FOR ALL USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Admins can see all tickets
DROP POLICY IF EXISTS "Admins can see all tickets" ON tickets;
CREATE POLICY "Admins can see all tickets" ON tickets 
FOR SELECT USING (public.is_admin());

-- Admins can update all tickets (e.g. to close them)
DROP POLICY IF EXISTS "Admins can update all tickets" ON tickets;
CREATE POLICY "Admins can update all tickets" ON tickets 
FOR UPDATE USING (public.is_admin());

-- 7. Ticket Messages Table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Ticket Messages
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their own tickets
DROP POLICY IF EXISTS "Users can view messages in their own tickets" ON ticket_messages;
CREATE POLICY "Users can view messages in their own tickets" ON ticket_messages 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = ticket_messages.ticket_id
    AND (tickets.user_id = auth.uid() OR public.is_admin())
  )
);

-- Users can insert messages in their own tickets
DROP POLICY IF EXISTS "Users can insert messages in their own tickets" ON ticket_messages;
CREATE POLICY "Users can insert messages in their own tickets" ON ticket_messages 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = ticket_messages.ticket_id
    AND (tickets.user_id = auth.uid() OR public.is_admin())
  )
);

-- 8. Chats Table
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add admin_id column if not exists
ALTER TABLE chats ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 8. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Chats
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters can view own chats" ON chats;
CREATE POLICY "Recruiters can view own chats" ON chats 
FOR SELECT USING (recruiter_id = auth.uid() OR admin_id = auth.uid());

DROP POLICY IF EXISTS "Institutions can view own chats" ON chats;
CREATE POLICY "Institutions can view own chats" ON chats 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM institutions
    WHERE institutions.id = chats.institution_id
    AND institutions.contact_email = (auth.jwt() ->> 'email')
  ) OR admin_id = auth.uid()
);

DROP POLICY IF EXISTS "Admins can view all chats" ON chats;
CREATE POLICY "Admins can view all chats" ON chats 
FOR SELECT USING (public.is_admin() OR admin_id = auth.uid());

DROP POLICY IF EXISTS "Recruiters can insert chats" ON chats;
CREATE POLICY "Recruiters can insert chats" ON chats 
FOR INSERT WITH CHECK (recruiter_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Institutions can insert chats" ON chats;
CREATE POLICY "Institutions can insert chats" ON chats 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM institutions
    WHERE institutions.id = institution_id
    AND LOWER(institutions.contact_email) = LOWER(auth.jwt() ->> 'email')
  )
);

DROP POLICY IF EXISTS "Users can update chats" ON chats;
CREATE POLICY "Users can update chats" ON chats 
FOR UPDATE USING (
  recruiter_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM institutions
    WHERE institutions.id = chats.institution_id
    AND institutions.contact_email = (auth.jwt() ->> 'email')
  ) OR
  public.is_admin() OR
  admin_id = auth.uid()
);

-- RLS for Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
CREATE POLICY "Users can view messages in their chats" ON messages 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = messages.chat_id
    AND (
      chats.recruiter_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM institutions
        WHERE institutions.id = chats.institution_id
        AND institutions.contact_email = (auth.jwt() ->> 'email')
      ) OR
      public.is_admin() OR
      chats.admin_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can insert messages in their chats" ON messages;
CREATE POLICY "Users can insert messages in their chats" ON messages 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = messages.chat_id
    AND (
      chats.recruiter_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM institutions
        WHERE institutions.id = chats.institution_id
        AND institutions.contact_email = (auth.jwt() ->> 'email')
      ) OR
      public.is_admin() OR
      chats.admin_id = auth.uid()
    )
  )
);

-- 9. Storage Buckets Setup
-- Create the logos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create the student-documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-documents', 'student-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for logos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'logos' AND auth.role() = 'authenticated'
);

-- Storage Policies for student-documents
DROP POLICY IF EXISTS "Users can view own student documents" ON storage.objects;
CREATE POLICY "Users can view own student documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'student-documents' AND (
    auth.uid() = owner OR 
    public.is_admin()
  )
);

DROP POLICY IF EXISTS "Users can upload own student documents" ON storage.objects;
CREATE POLICY "Users can upload own student documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'student-documents' AND auth.role() = 'authenticated'
);

-- 10. Balance History Table
CREATE TABLE IF NOT EXISTS balance_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Balance History
ALTER TABLE balance_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own balance history" ON balance_history;
CREATE POLICY "Users can view own balance history" ON balance_history 
FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can insert balance history" ON balance_history;
CREATE POLICY "Admins can insert balance history" ON balance_history 
FOR INSERT WITH CHECK (public.is_admin());

-- Function to get recruiter stats
CREATE OR REPLACE FUNCTION public.get_recruiter_stats(target_recruiter_id UUID)
RETURNS JSONB AS $$
DECLARE
  total_students INTEGER;
  total_applications INTEGER;
  successful_applications INTEGER;
  success_rate INTEGER;
BEGIN
  -- Count total students
  SELECT COUNT(*) INTO total_students FROM public.students WHERE recruiter_id = target_recruiter_id;
  
  -- Count total applications
  SELECT COUNT(*) INTO total_applications FROM public.applications WHERE recruiter_id = target_recruiter_id;
  
  -- Count successful applications
  SELECT COUNT(*) INTO successful_applications FROM public.applications 
  WHERE recruiter_id = target_recruiter_id AND (status = 'Accepted' OR status = 'Success');
  
  IF total_applications > 0 THEN
    success_rate := ROUND((successful_applications::NUMERIC / total_applications::NUMERIC) * 100);
  ELSE
    success_rate := 0;
  END IF;
  
  RETURN jsonb_build_object(
    'total_students', total_students,
    'success_rate', success_rate
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Refund Requests
CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for refund_requests
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters manage own refund requests" ON refund_requests;
CREATE POLICY "Recruiters manage own refund requests" ON refund_requests 
FOR ALL USING (recruiter_id = auth.uid()) 
WITH CHECK (recruiter_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage all refund requests" ON refund_requests;
CREATE POLICY "Admins manage all refund requests" ON refund_requests 
FOR ALL USING (public.is_admin()) 
WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_refund_requests_app_id ON refund_requests(application_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_recruiter_id ON refund_requests(recruiter_id);


