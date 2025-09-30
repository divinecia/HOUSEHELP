-- HouseHelp Database Initial Schema
-- Migration: 20250129_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- HOUSEHOLDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT,
    alternative_contact TEXT,
    address TEXT,
    district TEXT,
    sector TEXT,
    landmark TEXT,
    gps_location TEXT,
    property_type TEXT CHECK (property_type IN ('House', 'Apartment', 'Villa', 'Other')),
    number_of_rooms INTEGER,
    has_garden BOOLEAN DEFAULT false,
    has_parking BOOLEAN DEFAULT false,
    special_features TEXT,
    profile_photo_url TEXT,
    family_size INTEGER,
    has_children BOOLEAN DEFAULT false,
    has_pets BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'verifying' CHECK (status IN ('verifying', 'active', 'suspended', 'inactive')),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    national_id TEXT,
    address TEXT,
    district TEXT,
    sector TEXT,
    gps_location TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    profile_photo_url TEXT,
    bio TEXT,
    skills TEXT[],
    experience TEXT,
    languages TEXT[],
    availability TEXT,
    status TEXT DEFAULT 'verifying' CHECK (status IN ('verifying', 'active', 'suspended', 'inactive')),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    rating DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SERVICE CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SERVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES service_categories(id),
    price DECIMAL(10,2),
    duration TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id),
    worker_id UUID REFERENCES workers(id),
    service TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    household_name TEXT,
    worker_name TEXT,
    service_price DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JOBS TABLE (ALIAS FOR BOOKINGS)
-- ============================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id),
    worker_id UUID REFERENCES workers(id),
    service TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'active', 'completed', 'cancelled')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    household_name TEXT,
    worker_name TEXT,
    service_price DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id),
    worker_id UUID REFERENCES workers(id),
    booking_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    payout DECIMAL(10,2),
    method TEXT CHECK (method IN ('mobile_money', 'card', 'bank_transfer', 'cash')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    transaction_id TEXT,
    payment_reference TEXT,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ============================================
-- PAYOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(id),
    amount DECIMAL(10,2) NOT NULL,
    method TEXT CHECK (method IN ('mobile_money', 'bank_transfer')),
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'processing', 'completed', 'failed')),
    account_details TEXT,
    failure_reason TEXT,
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ============================================
-- HOUSEHOLD SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS household_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id),
    plan TEXT NOT NULL CHECK (plan IN ('basic', 'premium', 'enterprise')),
    plan_id UUID,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    expiry_date TIMESTAMPTZ,
    usage TEXT,
    benefits TEXT,
    price DECIMAL(10,2),
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    auto_renew BOOLEAN DEFAULT true,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRAINING MODULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS training_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    duration TEXT,
    content TEXT,
    video_url TEXT,
    quiz_questions JSONB,
    passing_score INTEGER DEFAULT 70,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKER TRAINING ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS worker_training_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(id),
    module_id UUID REFERENCES training_modules(id),
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'failed')),
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    score INTEGER,
    attempts INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKER RATINGS AND REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS worker_ratings_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id),
    worker_id UUID REFERENCES workers(id),
    booking_id UUID,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    sender TEXT,
    content TEXT NOT NULL,
    preview TEXT,
    is_read BOOLEAN DEFAULT false,
    conversation_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id),
    worker_id UUID REFERENCES workers(id),
    title TEXT NOT NULL,
    message TEXT,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    action_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id),
    worker_id UUID REFERENCES workers(id),
    type TEXT NOT NULL CHECK (type IN ('behavior', 'system', 'payment', 'other')),
    subject TEXT,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'closed')),
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OTP CODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_type TEXT NOT NULL CHECK (user_type IN ('worker', 'household', 'admin')),
    identifier TEXT NOT NULL, -- email or phone
    code TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('registration', 'password_reset', 'phone_verification', 'email_verification')),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VERIFICATION TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('worker', 'household', 'admin')),
    token TEXT NOT NULL UNIQUE,
    purpose TEXT NOT NULL CHECK (purpose IN ('email_verification', 'password_reset')),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('worker', 'household', 'admin')),
    token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_type TEXT CHECK (user_type IN ('worker', 'household', 'admin')),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKER AVAILABILITY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS worker_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKER SERVICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS worker_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    price DECIMAL(10,2),
    experience_years INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(worker_id, service_id)
);

-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(household_id, worker_id)
);

-- ============================================
-- CREATE INDEXES
-- ============================================

-- Households indexes
CREATE INDEX IF NOT EXISTS idx_households_email ON households(email);
CREATE INDEX IF NOT EXISTS idx_households_district ON households(district);
CREATE INDEX IF NOT EXISTS idx_households_status ON households(status);

-- Workers indexes
CREATE INDEX IF NOT EXISTS idx_workers_email ON workers(email);
CREATE INDEX IF NOT EXISTS idx_workers_national_id ON workers(national_id);
CREATE INDEX IF NOT EXISTS idx_workers_district ON workers(district);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);

-- Admins indexes
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_household ON bookings(household_id);
CREATE INDEX IF NOT EXISTS idx_bookings_worker ON bookings(worker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled ON bookings(scheduled_at);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_household ON jobs(household_id);
CREATE INDEX IF NOT EXISTS idx_jobs_worker ON jobs(worker_id);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled ON jobs(scheduled_at);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_household ON payments(household_id);
CREATE INDEX IF NOT EXISTS idx_payments_worker ON payments(worker_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Payouts indexes
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_worker ON payouts(worker_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_household ON notifications(household_id);
CREATE INDEX IF NOT EXISTS idx_notifications_worker ON notifications(worker_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- OTP codes indexes
CREATE INDEX IF NOT EXISTS idx_otp_identifier ON otp_codes(identifier);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_used ON otp_codes(used);

-- Verification tokens indexes
CREATE INDEX IF NOT EXISTS idx_verification_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_user ON verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_expires ON verification_tokens(expires_at);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- Worker availability indexes
CREATE INDEX IF NOT EXISTS idx_worker_availability_worker ON worker_availability(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_availability_day ON worker_availability(day_of_week);

-- Worker services indexes
CREATE INDEX IF NOT EXISTS idx_worker_services_worker ON worker_services(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_services_service ON worker_services(service_id);

-- Favorites indexes
CREATE INDEX IF NOT EXISTS idx_favorites_household ON favorites(household_id);
CREATE INDEX IF NOT EXISTS idx_favorites_worker ON favorites(worker_id);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Insert sample service categories
INSERT INTO service_categories (name, description) VALUES
    ('House Cleaning', 'Professional house cleaning services'),
    ('Childcare', 'Childcare and babysitting services'),
    ('Cooking', 'Meal preparation and cooking services'),
    ('Laundry & Ironing', 'Laundry and ironing services'),
    ('Gardening', 'Garden maintenance and landscaping'),
    ('Elderly Care', 'Care services for elderly people'),
    ('General Housework', 'General household maintenance tasks')
ON CONFLICT DO NOTHING;

-- Insert sample services
INSERT INTO services (name, description, price, duration) VALUES
    ('House Cleaning', 'Complete house cleaning service', 15000, '3 hours'),
    ('Childcare', 'Professional childcare service', 10000, '4 hours'),
    ('Cooking', 'Meal preparation service', 12000, '2 hours'),
    ('Laundry & Ironing', 'Laundry and ironing service', 8000, '2 hours'),
    ('Gardening', 'Garden maintenance service', 20000, '4 hours'),
    ('Elderly Care', 'Professional elderly care service', 25000, '8 hours')
ON CONFLICT DO NOTHING;

-- Insert sample training modules
INSERT INTO training_modules (title, description, duration) VALUES
    ('Safety & Security', 'Basic safety and security protocols', '2 hours'),
    ('Customer Service', 'Professional customer service training', '3 hours'),
    ('Cleaning Standards', 'Professional cleaning standards and techniques', '4 hours'),
    ('Childcare Basics', 'Basic childcare and safety training', '6 hours'),
    ('First Aid', 'Basic first aid and emergency response', '4 hours')
ON CONFLICT DO NOTHING;

-- ============================================
-- ADD TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_workers_updated_at ON workers;
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_households_updated_at ON households;
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Initial schema migration completed successfully!';
    RAISE NOTICE 'Created tables: households, workers, admins, service_categories, services';
    RAISE NOTICE 'Created tables: bookings, jobs, payments, payouts, household_subscriptions';
    RAISE NOTICE 'Created tables: training_modules, worker_training_assignments, worker_ratings_reviews';
    RAISE NOTICE 'Created tables: messages, notifications, reports';
    RAISE NOTICE 'Created tables: otp_codes, verification_tokens, sessions, audit_logs';
    RAISE NOTICE 'Created tables: worker_availability, worker_services, favorites';
    RAISE NOTICE 'Created indexes for all tables';
    RAISE NOTICE 'Inserted sample data for service categories, services, and training modules';
    RAISE NOTICE 'IMPORTANT: Remember to set up RLS policies and update default passwords!';
END $$;
