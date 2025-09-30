#!/bin/bash

# Script to run database migrations
# Usage: ./scripts/run-migration.sh

echo "🚀 Running HouseHelp Database Migrations..."
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if Supabase URL is set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set"
    echo "Please set it in your .env.local file"
    exit 1
fi

# Check if service role key is set
if [ -z "$SUPABASE_SERVICE_ROLE" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE is not set"
    echo "Please set it in your .env.local file"
    exit 1
fi

echo "📊 Database URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Run the migration
MIGRATION_FILE="supabase/migrations/20250130_add_missing_fields.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📝 Running migration: $MIGRATION_FILE"
echo ""

# Extract database connection string from Supabase URL
# Format: https://[project-ref].supabase.co
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')

# Construct PostgreSQL connection string
# Note: You'll need to get your database password from Supabase dashboard
echo "⚠️  MANUAL STEP REQUIRED:"
echo ""
echo "To run this migration, you have two options:"
echo ""
echo "Option 1: Using Supabase CLI (Recommended)"
echo "  1. Install Supabase CLI: npm install -g supabase"
echo "  2. Login: supabase login"
echo "  3. Link project: supabase link --project-ref $PROJECT_REF"
echo "  4. Run migration: supabase db push"
echo ""
echo "Option 2: Using Supabase Dashboard"
echo "  1. Go to: https://app.supabase.com/project/$PROJECT_REF/sql"
echo "  2. Copy the contents of: $MIGRATION_FILE"
echo "  3. Paste and run in the SQL Editor"
echo ""
echo "Option 3: Using psql (if you have database password)"
echo "  psql 'postgresql://postgres:[PASSWORD]@db.$PROJECT_REF.supabase.co:5432/postgres' -f $MIGRATION_FILE"
echo ""

# Display migration preview
echo "📄 Migration Preview (first 20 lines):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
head -n 20 "$MIGRATION_FILE"
echo "..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Migration file is ready!"
echo "Please follow one of the options above to apply it to your database."
