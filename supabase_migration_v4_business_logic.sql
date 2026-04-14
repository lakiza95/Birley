-- Migration: Business Logic Improvements (Ledger, Audit Trail, Notifications)
-- 1. Transactions (Ledger)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('commission', 'withdrawal', 'payment_received', 'adjustment')),
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Application Status History (Audit Trail)
CREATE TABLE IF NOT EXISTS application_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add email notification settings to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;

-- 4. Trigger for Application Status History
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO application_status_history (application_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
        
        -- Create a notification for the recruiter
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (NEW.recruiter_id, 'Application Status Updated', 'Application status changed to ' || NEW.status, 'application_update', NULL);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_application_status_change ON applications;
CREATE TRIGGER trigger_application_status_change
AFTER UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION log_application_status_change();

-- 5. RPC for Webhook (Payment Processing)
CREATE OR REPLACE FUNCTION process_payment_webhook(
    p_application_id UUID,
    p_recruiter_amount NUMERIC,
    p_institution_amount NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
    v_recruiter_id UUID;
    v_institution_id UUID;
    v_program_id UUID;
    v_inst_profile_id UUID;
BEGIN
    -- Get application details
    SELECT recruiter_id, program_id INTO v_recruiter_id, v_program_id
    FROM applications WHERE id = p_application_id;
    
    -- Get institution id from program
    SELECT institution_id INTO v_institution_id
    FROM programs WHERE id = v_program_id;

    -- Update Recruiter Balance & Create Transaction
    IF p_recruiter_amount > 0 THEN
        UPDATE profiles SET balance = COALESCE(balance, 0) + p_recruiter_amount WHERE id = v_recruiter_id;
        INSERT INTO transactions (user_id, amount, type, description, reference_id)
        VALUES (v_recruiter_id, p_recruiter_amount, 'commission', 'Commission for application', p_application_id);
        
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (v_recruiter_id, 'Commission Received', 'You received $' || p_recruiter_amount || ' commission.', 'finance');
    END IF;

    -- Update Institution Balance & Create Transaction
    IF p_institution_amount > 0 THEN
        -- Find the first profile associated with this institution
        SELECT id INTO v_inst_profile_id FROM profiles WHERE institution_id = v_institution_id AND role = 'institution' LIMIT 1;
        
        IF v_inst_profile_id IS NOT NULL THEN
            UPDATE profiles SET balance = COALESCE(balance, 0) + p_institution_amount WHERE id = v_inst_profile_id;
            
            INSERT INTO transactions (user_id, amount, type, description, reference_id)
            VALUES (v_inst_profile_id, p_institution_amount, 'payment_received', 'Payment received for application', p_application_id);
            
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (v_inst_profile_id, 'Payment Received', 'You received $' || p_institution_amount || ' for an application.', 'finance');
        END IF;
    END IF;

    -- Update application status
    UPDATE applications SET status = 'Paid' WHERE id = p_application_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS and add policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON transactions FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view history for their applications" ON application_status_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM applications WHERE id = application_id AND (recruiter_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')))
);

CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
