-- Migration: Secure Withdrawals & Performance Views
-- Description: Adds RPC for secure balance deduction and views for optimized queries.

-- 1. Secure RPC for Withdrawals
-- This function ensures that the balance is checked and deducted atomically,
-- preventing race conditions or client-side manipulation of the balance.
CREATE OR REPLACE FUNCTION request_withdrawal(
    p_amount NUMERIC,
    p_method TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with the privileges of the creator (bypasses RLS for the atomic update)
AS $$
DECLARE
    v_user_id UUID;
    v_current_balance NUMERIC;
    v_withdrawal_id UUID;
BEGIN
    -- Get the ID of the currently authenticated user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Lock the profile row to prevent concurrent updates
    SELECT balance INTO v_current_balance
    FROM profiles
    WHERE id = v_user_id
    FOR UPDATE;

    IF v_current_balance IS NULL THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;

    -- Deduct balance
    UPDATE profiles
    SET balance = balance - p_amount
    WHERE id = v_user_id;

    -- Create withdrawal record
    INSERT INTO withdrawals (user_id, amount, method, status)
    VALUES (v_user_id, p_amount, p_method, 'pending')
    RETURNING id INTO v_withdrawal_id;

    RETURN json_build_object(
        'success', true,
        'withdrawal_id', v_withdrawal_id,
        'new_balance', v_current_balance - p_amount
    );
END;
$$;

-- 2. View for Institutions with Stats (Solves N+1 Problem)
-- This view aggregates student counts, application counts, and overdue SLA counts
-- so the frontend can fetch everything in a single query.
CREATE OR REPLACE VIEW vw_institutions_with_stats AS
SELECT 
    i.*,
    COALESCE(s.student_count, 0) AS student_count,
    COALESCE(a.application_count, 0) AS application_count,
    COALESCE(o.overdue_count, 0) AS overdue_count
FROM institutions i
LEFT JOIN (
    -- Count distinct students who applied to programs at this institution
    SELECT p.institution_id, COUNT(DISTINCT app.student_id) as student_count
    FROM applications app
    JOIN programs p ON p.id = app.program_id
    GROUP BY p.institution_id
) s ON s.institution_id = i.id
LEFT JOIN (
    -- Count total applications to programs at this institution
    SELECT p.institution_id, COUNT(*) as application_count
    FROM applications app
    JOIN programs p ON p.id = app.program_id
    GROUP BY p.institution_id
) a ON a.institution_id = i.id
LEFT JOIN (
    -- Count overdue applications to programs at this institution
    SELECT p.institution_id, COUNT(*) as overdue_count
    FROM applications app
    JOIN programs p ON p.id = app.program_id
    WHERE app.status = 'Submitted' 
      AND app.created_at < NOW() - INTERVAL '5 days'
    GROUP BY p.institution_id
) o ON o.institution_id = i.id;

-- Grant access to the view
GRANT SELECT ON vw_institutions_with_stats TO authenticated;
GRANT SELECT ON vw_institutions_with_stats TO anon;
