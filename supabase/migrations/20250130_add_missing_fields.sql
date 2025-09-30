-- HouseHelp Database Security & RLS Policies
-- Migration: 20250130_add_missing_fields.sql

-- ============================================
-- RLS (Row Level Security) Setup
-- ============================================

-- Enable RLS on sensitive tables
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR WORKERS
-- ============================================

-- Workers can read their own data
DROP POLICY IF EXISTS workers_read_own ON workers;
CREATE POLICY workers_read_own ON workers
    FOR SELECT
    USING (id = current_setting('app.current_user_id', true)::uuid);

-- Workers can update their own data
DROP POLICY IF EXISTS workers_update_own ON workers;
CREATE POLICY workers_update_own ON workers
    FOR UPDATE
    USING (id = current_setting('app.current_user_id', true)::uuid);

-- Public can read active workers (for browsing)
DROP POLICY IF EXISTS workers_public_read ON workers;
CREATE POLICY workers_public_read ON workers
    FOR SELECT
    USING (status = 'active' AND verification_status = 'verified');

-- ============================================
-- RLS POLICIES FOR HOUSEHOLDS
-- ============================================

-- Households can read their own data
DROP POLICY IF EXISTS households_read_own ON households;
CREATE POLICY households_read_own ON households
    FOR SELECT
    USING (id = current_setting('app.current_user_id', true)::uuid);

-- Households can update their own data
DROP POLICY IF EXISTS households_update_own ON households;
CREATE POLICY households_update_own ON households
    FOR UPDATE
    USING (id = current_setting('app.current_user_id', true)::uuid);

-- ============================================
-- RLS POLICIES FOR BOOKINGS
-- ============================================

-- Households can read their own bookings
DROP POLICY IF EXISTS bookings_household_read ON bookings;
CREATE POLICY bookings_household_read ON bookings
    FOR SELECT
    USING (household_id = current_setting('app.current_user_id', true)::uuid);

-- Workers can read their assigned bookings
DROP POLICY IF EXISTS bookings_worker_read ON bookings;
CREATE POLICY bookings_worker_read ON bookings
    FOR SELECT
    USING (worker_id = current_setting('app.current_user_id', true)::uuid);

-- Households can create bookings
DROP POLICY IF EXISTS bookings_household_create ON bookings;
CREATE POLICY bookings_household_create ON bookings
    FOR INSERT
    WITH CHECK (household_id = current_setting('app.current_user_id', true)::uuid);

-- ============================================
-- RLS POLICIES FOR JOBS
-- ============================================

-- Similar policies for jobs table
DROP POLICY IF EXISTS jobs_household_read ON jobs;
CREATE POLICY jobs_household_read ON jobs
    FOR SELECT
    USING (household_id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS jobs_worker_read ON jobs;
CREATE POLICY jobs_worker_read ON jobs
    FOR SELECT
    USING (worker_id = current_setting('app.current_user_id', true)::uuid);

-- ============================================
-- RLS POLICIES FOR MESSAGES
-- ============================================

-- Users can read messages they sent or received
DROP POLICY IF EXISTS messages_user_access ON messages;
CREATE POLICY messages_user_access ON messages
    FOR SELECT
    USING (
        sender_id = current_setting('app.current_user_id', true)::uuid OR 
        recipient_id = current_setting('app.current_user_id', true)::uuid
    );

-- Users can send messages
DROP POLICY IF EXISTS messages_user_send ON messages;
CREATE POLICY messages_user_send ON messages
    FOR INSERT
    WITH CHECK (sender_id = current_setting('app.current_user_id', true)::uuid);

-- ============================================
-- RLS POLICIES FOR PAYMENTS
-- ============================================

-- Households can read their payments
DROP POLICY IF EXISTS payments_household_read ON payments;
CREATE POLICY payments_household_read ON payments
    FOR SELECT
    USING (household_id = current_setting('app.current_user_id', true)::uuid);

-- Workers can read their payments
DROP POLICY IF EXISTS payments_worker_read ON payments;
CREATE POLICY payments_worker_read ON payments
    FOR SELECT
    USING (worker_id = current_setting('app.current_user_id', true)::uuid);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to set current user context
CREATE OR REPLACE FUNCTION set_current_user(user_id uuid, user_type text)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id::text, true);
    PERFORM set_config('app.current_user_type', user_type, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user context
CREATE OR REPLACE FUNCTION get_current_user()
RETURNS TABLE(user_id uuid, user_type text) AS $$
BEGIN
    RETURN QUERY SELECT 
        current_setting('app.current_user_id', true)::uuid,
        current_setting('app.current_user_type', true);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DATABASE FUNCTIONS FOR API
-- ============================================

-- Function to list all tables (for API)
CREATE OR REPLACE FUNCTION list_tables()
RETURNS TABLE(
    table_name text,
    table_schema text,
    table_type text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::text,
        t.table_schema::text,
        t.table_type::text
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table column information
CREATE OR REPLACE FUNCTION get_table_info(table_name_param text)
RETURNS TABLE(
    column_name text,
    data_type text,
    is_nullable text,
    column_default text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::text,
        c.data_type::text,
        c.is_nullable::text,
        c.column_default::text
    FROM information_schema.columns c
    WHERE c.table_name = table_name_param
    AND c.table_schema = 'public'
    ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count records in a table
CREATE OR REPLACE FUNCTION count_table_records(table_name_param text)
RETURNS integer AS $$
DECLARE
    record_count integer;
BEGIN
    EXECUTE format('SELECT COUNT(*) FROM %I', table_name_param) INTO record_count;
    RETURN record_count;
EXCEPTION WHEN OTHERS THEN
    RETURN -1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INSERT DEFAULT ADMIN USER
-- ============================================

INSERT INTO admins (email, password_hash, name, role)
VALUES (
    COALESCE(current_setting('env.ADMIN_EMAIL', true), 'admin@househelp.rw'),
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password" - CHANGE THIS!
    'System Admin',
    'super_admin'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- ADD SAMPLE WORKER AND HOUSEHOLD FOR TESTING
-- ============================================

-- Sample household for testing (password: "password123")
INSERT INTO households (name, email, phone, password_hash, district, sector, address, status, verification_status)
VALUES (
    'Test Household',
    'household@test.com',
    '+250788123456',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Kigali',
    'Nyarugenge',
    'KG 1 Ave, Kigali',
    'active',
    'verified'
)
ON CONFLICT (email) DO NOTHING;

-- Sample worker for testing (password: "password123")
INSERT INTO workers (full_name, email, phone, password_hash, district, sector, address, status, verification_status, skills, languages)
VALUES (
    'Test Worker',
    'worker@test.com',
    '+250788654321',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Kigali',
    'Gasabo',
    'KG 2 Ave, Kigali',
    'active',
    'verified',
    ARRAY['House Cleaning', 'Cooking'],
    ARRAY['Kinyarwanda', 'English']
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- UPDATE EXISTING TABLES WITH MISSING CONSTRAINTS
-- ============================================

-- Add unique constraint on national_id for workers
ALTER TABLE workers ADD CONSTRAINT workers_national_id_unique UNIQUE (national_id);

-- Add check constraint for phone number format
ALTER TABLE workers ADD CONSTRAINT workers_phone_format CHECK (phone ~ '^\+250[0-9]{9}$' OR phone ~ '^07[0-9]{8}$');
ALTER TABLE households ADD CONSTRAINT households_phone_format CHECK (phone ~ '^\+250[0-9]{9}$' OR phone ~ '^07[0-9]{8}$');

-- Add check constraint for rating bounds
ALTER TABLE workers ADD CONSTRAINT workers_rating_bounds CHECK (rating >= 0.0 AND rating <= 5.0);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for active workers with their services
CREATE OR REPLACE VIEW active_workers_with_services AS
SELECT 
    w.id,
    w.full_name,
    w.email,
    w.phone,
    w.district,
    w.sector,
    w.rating,
    w.skills,
    w.languages,
    w.profile_photo_url,
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'service_id', ws.service_id,
                'service_name', s.name,
                'price', ws.price,
                'experience_years', ws.experience_years
            )
        ) FROM worker_services ws
        JOIN services s ON ws.service_id = s.id
        WHERE ws.worker_id = w.id),
        '[]'::json
    ) as services
FROM workers w
WHERE w.status = 'active' AND w.verification_status = 'verified';

-- View for household dashboard summary
CREATE OR REPLACE VIEW household_dashboard_data AS
SELECT 
    h.id as household_id,
    h.name,
    h.email,
    (SELECT COUNT(*) FROM bookings b WHERE b.household_id = h.id AND b.status = 'pending') as pending_bookings,
    (SELECT COUNT(*) FROM bookings b WHERE b.household_id = h.id AND b.status = 'confirmed') as confirmed_bookings,
    (SELECT COUNT(*) FROM messages m WHERE m.recipient_id = h.id AND m.is_read = false) as unread_messages,
    (SELECT COUNT(*) FROM notifications n WHERE n.household_id = h.id AND n.is_read = false) as unread_notifications
FROM households h
WHERE h.status = 'active';

-- View for worker dashboard summary
CREATE OR REPLACE VIEW worker_dashboard_data AS
SELECT 
    w.id as worker_id,
    w.full_name,
    w.email,
    w.rating,
    (SELECT COUNT(*) FROM jobs j WHERE j.worker_id = w.id AND j.status = 'assigned') as assigned_jobs,
    (SELECT COUNT(*) FROM jobs j WHERE j.worker_id = w.id AND j.status = 'active') as active_jobs,
    (SELECT COUNT(*) FROM messages m WHERE m.recipient_id = w.id AND m.is_read = false) as unread_messages,
    (SELECT COUNT(*) FROM notifications n WHERE n.worker_id = w.id AND n.is_read = false) as unread_notifications,
    (SELECT SUM(p.payout) FROM payments p WHERE p.worker_id = w.id AND p.status = 'completed' AND p.created_at >= date_trunc('month', CURRENT_DATE)) as monthly_earnings
FROM workers w
WHERE w.status = 'active';

-- ============================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- ============================================

-- Procedure to assign a worker to a job
CREATE OR REPLACE FUNCTION assign_worker_to_job(
    job_id_param uuid,
    worker_id_param uuid
)
RETURNS boolean AS $$
DECLARE
    job_exists boolean;
    worker_available boolean;
BEGIN
    -- Check if job exists and is pending
    SELECT EXISTS(
        SELECT 1 FROM jobs 
        WHERE id = job_id_param AND status = 'pending'
    ) INTO job_exists;
    
    IF NOT job_exists THEN
        RETURN false;
    END IF;
    
    -- Check if worker is active and verified
    SELECT EXISTS(
        SELECT 1 FROM workers 
        WHERE id = worker_id_param AND status = 'active' AND verification_status = 'verified'
    ) INTO worker_available;
    
    IF NOT worker_available THEN
        RETURN false;
    END IF;
    
    -- Assign the worker
    UPDATE jobs 
    SET worker_id = worker_id_param, status = 'assigned'
    WHERE id = job_id_param;
    
    -- Create notification for worker
    INSERT INTO notifications (worker_id, title, message, severity)
    VALUES (
        worker_id_param,
        'New Job Assignment',
        'You have been assigned a new job. Please check your dashboard for details.',
        'info'
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Procedure to complete a job and process payment
CREATE OR REPLACE FUNCTION complete_job_and_pay(
    job_id_param uuid,
    rating_param integer DEFAULT NULL,
    comment_param text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    job_record record;
    payment_amount decimal(10,2);
    platform_fee decimal(10,2);
    worker_payout decimal(10,2);
BEGIN
    -- Get job details
    SELECT * FROM jobs WHERE id = job_id_param AND status = 'active' INTO job_record;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Calculate payment amounts (assume 10% platform fee)
    payment_amount := job_record.service_price;
    platform_fee := payment_amount * 0.10;
    worker_payout := payment_amount - platform_fee;
    
    -- Mark job as completed
    UPDATE jobs 
    SET status = 'completed', completed_at = NOW()
    WHERE id = job_id_param;
    
    -- Create payment record
    INSERT INTO payments (
        household_id, worker_id, booking_id, amount, 
        platform_fee, payout, status, method
    ) VALUES (
        job_record.household_id, job_record.worker_id, job_id_param,
        payment_amount, platform_fee, worker_payout, 'completed', 'mobile_money'
    );
    
    -- Add rating if provided
    IF rating_param IS NOT NULL THEN
        INSERT INTO worker_ratings_reviews (
            household_id, worker_id, booking_id, rating, comment
        ) VALUES (
            job_record.household_id, job_record.worker_id, job_id_param,
            rating_param, comment_param
        );
        
        -- Update worker's average rating
        UPDATE workers SET rating = (
            SELECT AVG(rating) FROM worker_ratings_reviews 
            WHERE worker_id = job_record.worker_id
        ) WHERE id = job_record.worker_id;
    END IF;
    
    -- Create notifications
    INSERT INTO notifications (household_id, title, message, severity)
    VALUES (
        job_record.household_id,
        'Job Completed',
        'Your job has been completed successfully. Payment has been processed.',
        'success'
    );
    
    INSERT INTO notifications (worker_id, title, message, severity)
    VALUES (
        job_record.worker_id,
        'Job Payment Processed',
        'Payment for your completed job has been processed.',
        'success'
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Security and additional features migration completed successfully!';
    RAISE NOTICE 'Enabled RLS on all sensitive tables';
    RAISE NOTICE 'Created RLS policies for users to access their own data';
    RAISE NOTICE 'Added helper functions for user context management';
    RAISE NOTICE 'Created database functions for API endpoints';
    RAISE NOTICE 'Added default admin user (email: admin@househelp.rw, password: password)';
    RAISE NOTICE 'Added sample test users for development';
    RAISE NOTICE 'Created views for dashboard data';
    RAISE NOTICE 'Added stored procedures for common operations';
    RAISE NOTICE 'SECURITY: Remember to change default passwords and review RLS policies!';
END $$;