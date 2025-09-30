#!/bin/bash

# Database Verification Script for HouseHelp
# This script checks if your Supabase database has all required tables

echo "🔍 HouseHelp Database Verification"
echo "=================================="

# Load environment variables safely
if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL not found in environment"
    echo "   Please create a .env.local file with your Supabase credentials"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE not found in environment"
    echo "   Please add your Supabase service role key to .env.local"
    exit 1
fi

echo "✅ Environment variables found"
echo "📊 Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Required tables list
REQUIRED_TABLES=(
    "households"
    "workers" 
    "admins"
    "service_categories"
    "services"
    "bookings"
    "jobs"
    "payments"
    "payouts"
    "household_subscriptions"
    "training_modules"
    "worker_training_assignments"
    "worker_ratings_reviews"
    "messages"
    "notifications"
    "reports"
    "otp_codes"
    "verification_tokens"
    "sessions"
    "audit_logs"
    "worker_availability"
    "worker_services"
    "favorites"
)

# Check each table
echo "🔍 Checking required tables..."
MISSING_TABLES=()
EXISTING_TABLES=()

for table in "${REQUIRED_TABLES[@]}"; do
    response=$(curl -s \
        -H "apikey: $SUPABASE_SERVICE_ROLE" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE" \
        "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/$table?limit=0")
    
    if echo "$response" | grep -q "error\|404\|relation.*does not exist"; then
        echo "❌ $table - MISSING"
        MISSING_TABLES+=("$table")
    else
        echo "✅ $table - EXISTS"
        EXISTING_TABLES+=("$table")
    fi
done

echo ""
echo "📊 Summary:"
echo "  ✅ Existing tables: ${#EXISTING_TABLES[@]}"
echo "  ❌ Missing tables: ${#MISSING_TABLES[@]}"

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    echo ""
    echo "❌ Missing tables that need to be created:"
    for table in "${MISSING_TABLES[@]}"; do
        echo "   - $table"
    done
    echo ""
    echo "🛠️  To fix this:"
    echo "1. Run the migration scripts in supabase/migrations/"
    echo "2. Or copy the SQL content to your Supabase SQL Editor"
    echo "3. Execute: supabase/migrations/20250129_initial_schema.sql"
    echo "4. Then execute: supabase/migrations/20250130_add_missing_fields.sql"
    echo ""
else
    echo ""
    echo "🎉 All required tables exist!"
    echo ""
    
    # Check for sample data
    echo "📊 Checking sample data..."
    
    # Check service categories
    categories_response=$(curl -s \
        -H "apikey: $SUPABASE_SERVICE_ROLE" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE" \
        "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/service_categories?select=count")
    
    if echo "$categories_response" | grep -q '"count"'; then
        echo "✅ Service categories have data"
    else
        echo "⚠️  Service categories table is empty"
    fi
    
    # Check services
    services_response=$(curl -s \
        -H "apikey: $SUPABASE_SERVICE_ROLE" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE" \
        "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/services?select=count")
    
    if echo "$services_response" | grep -q '"count"'; then
        echo "✅ Services have data"
    else
        echo "⚠️  Services table is empty"
    fi
fi

echo ""
echo "🔧 Next steps:"
if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    echo "1. Run the database migrations to create missing tables"
    echo "2. Set up proper environment variables"
    echo "3. Test the application"
else
    echo "1. Test your application authentication"
    echo "2. Verify API endpoints are working"
    echo "3. Check RLS policies are properly configured"
fi

echo ""
echo "📖 For more information, see:"
echo "   - ./scripts/run-migration.sh"
echo "   - supabase/migrations/ directory"
echo "   - Supabase dashboard: https://app.supabase.com"