-- Update existing student statuses
UPDATE students SET status = 'Preparation' WHERE status IN ('Pending', 'In Progress');
UPDATE students SET status = 'Applied' WHERE status = 'Action Required';
UPDATE students SET status = 'Enrolled' WHERE status IN ('Active', 'Success');

-- Update existing application statuses
UPDATE applications SET status = 'Reviewing' WHERE status = 'Under Review';
UPDATE applications SET status = 'Approved' WHERE status = 'Accepted';

-- Create function to sync student status based on application progress
CREATE OR REPLACE FUNCTION public.update_student_status_from_app()
RETURNS TRIGGER AS $$
DECLARE
  current_student_status TEXT;
BEGIN
  -- Get current student status
  SELECT status INTO current_student_status FROM public.students WHERE id = NEW.student_id;
  
  -- Logic to advance student status based on application status
  IF NEW.status = 'Approved' AND current_student_status IN ('Preparation', 'Applied') THEN
    UPDATE public.students SET status = 'Payment' WHERE id = NEW.student_id;
  ELSIF NEW.status IN ('Submitted', 'Reviewing', 'Action Required') AND current_student_status = 'Preparation' THEN
    UPDATE public.students SET status = 'Applied' WHERE id = NEW.student_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS sync_student_status ON public.applications;

-- Create trigger
CREATE TRIGGER sync_student_status
AFTER INSERT OR UPDATE OF status ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.update_student_status_from_app();
