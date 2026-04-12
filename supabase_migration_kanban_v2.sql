-- Update existing student statuses to new schema
UPDATE students SET status = 'New Student' WHERE status IN ('Preparation', 'Pending', 'In Progress');
UPDATE students SET status = 'Application started' WHERE status = 'Applied';
UPDATE students SET status = 'Waiting payment' WHERE status = 'Payment';
UPDATE students SET status = 'Ready for visa' WHERE status = 'Visa';
UPDATE students SET status = 'Done' WHERE status IN ('Enrolled', 'Success', 'Active');

-- Update existing application statuses to new schema
UPDATE applications SET status = 'New application' WHERE status = 'Submitted';
UPDATE applications SET status = 'In review' WHERE status IN ('Reviewing', 'Under Review');
UPDATE applications SET status = 'Approved' WHERE status = 'Accepted';

-- Create function to calculate the highest status of a student based on their applications
CREATE OR REPLACE FUNCTION public.calculate_student_highest_status(p_student_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_highest_status TEXT;
    v_current_student_status TEXT;
BEGIN
    -- Get current student status to preserve manual statuses if they are higher
    SELECT status INTO v_current_student_status FROM public.students WHERE id = p_student_id;

    -- Priority mapping for applications (higher number = higher priority)
    -- Done: 100
    -- Ready for visa: 90
    -- Payment received: 80
    -- Waiting payment: 70
    -- Approved: 60
    -- Action Required: 50
    -- In review: 40
    -- New application: 30
    -- Refund: 20
    -- Rejected: 10

    SELECT
        CASE
            WHEN MAX(
                CASE status
                    WHEN 'Done' THEN 100
                    WHEN 'Ready for visa' THEN 90
                    WHEN 'Payment received' THEN 80
                    WHEN 'Waiting payment' THEN 70
                    WHEN 'Approved' THEN 60
                    WHEN 'Action Required' THEN 50
                    WHEN 'In review' THEN 40
                    WHEN 'New application' THEN 30
                    WHEN 'Refund' THEN 20
                    WHEN 'Rejected' THEN 10
                    ELSE 0
                END
            ) = 100 THEN 'Done'
            WHEN MAX(
                CASE status WHEN 'Ready for visa' THEN 90 WHEN 'Payment received' THEN 80 WHEN 'Waiting payment' THEN 70 WHEN 'Approved' THEN 60 WHEN 'Action Required' THEN 50 WHEN 'In review' THEN 40 WHEN 'New application' THEN 30 WHEN 'Refund' THEN 20 WHEN 'Rejected' THEN 10 ELSE 0 END
            ) = 90 THEN 'Ready for visa'
            WHEN MAX(
                CASE status WHEN 'Payment received' THEN 80 WHEN 'Waiting payment' THEN 70 WHEN 'Approved' THEN 60 WHEN 'Action Required' THEN 50 WHEN 'In review' THEN 40 WHEN 'New application' THEN 30 WHEN 'Refund' THEN 20 WHEN 'Rejected' THEN 10 ELSE 0 END
            ) = 80 THEN 'Payment received'
            WHEN MAX(
                CASE status WHEN 'Waiting payment' THEN 70 WHEN 'Approved' THEN 60 WHEN 'Action Required' THEN 50 WHEN 'In review' THEN 40 WHEN 'New application' THEN 30 WHEN 'Refund' THEN 20 WHEN 'Rejected' THEN 10 ELSE 0 END
            ) = 70 THEN 'Waiting payment'
            WHEN MAX(
                CASE status WHEN 'Approved' THEN 60 WHEN 'Action Required' THEN 50 WHEN 'In review' THEN 40 WHEN 'New application' THEN 30 WHEN 'Refund' THEN 20 WHEN 'Rejected' THEN 10 ELSE 0 END
            ) = 60 THEN 'Application accepted'
            WHEN MAX(
                CASE status WHEN 'Action Required' THEN 50 WHEN 'In review' THEN 40 WHEN 'New application' THEN 30 WHEN 'Refund' THEN 20 WHEN 'Rejected' THEN 10 ELSE 0 END
            ) = 50 THEN 'Action Required'
            WHEN MAX(
                CASE status WHEN 'In review' THEN 40 WHEN 'New application' THEN 30 WHEN 'Refund' THEN 20 WHEN 'Rejected' THEN 10 ELSE 0 END
            ) = 40 THEN 'Application started'
            WHEN MAX(
                CASE status WHEN 'New application' THEN 30 WHEN 'Refund' THEN 20 WHEN 'Rejected' THEN 10 ELSE 0 END
            ) = 30 THEN 'Application started'
            WHEN MAX(
                CASE status WHEN 'Refund' THEN 20 WHEN 'Rejected' THEN 10 ELSE 0 END
            ) = 20 THEN 'Refund'
            WHEN MAX(
                CASE status WHEN 'Rejected' THEN 10 ELSE 0 END
            ) = 10 THEN 'Ready to apply' -- All rejected
            ELSE 'Ready to apply' -- No active apps
        END INTO v_highest_status
    FROM public.applications
    WHERE student_id = p_student_id;

    -- If the student is already manually moved to 'Waiting visa' by recruiter, and the highest app status is 'Ready for visa', keep 'Waiting visa'
    IF v_current_student_status = 'Waiting visa' AND v_highest_status IN ('Ready for visa', 'Payment received', 'Waiting payment', 'Application accepted', 'Action Required', 'Application started') THEN
        RETURN 'Waiting visa';
    END IF;

    -- If the student is already manually moved to 'Done' by recruiter, keep 'Done' unless an app is explicitly refunded
    IF v_current_student_status = 'Done' AND v_highest_status != 'Refund' THEN
        RETURN 'Done';
    END IF;

    RETURN COALESCE(v_highest_status, 'Ready to apply');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to sync student status based on application progress
CREATE OR REPLACE FUNCTION public.update_student_status_from_app()
RETURNS TRIGGER AS $$
DECLARE
  v_new_student_status TEXT;
BEGIN
  v_new_student_status := public.calculate_student_highest_status(NEW.student_id);
  
  UPDATE public.students 
  SET status = v_new_student_status 
  WHERE id = NEW.student_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS sync_student_status ON public.applications;

-- Create trigger
CREATE TRIGGER sync_student_status
AFTER INSERT OR UPDATE OF status ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.update_student_status_from_app();
