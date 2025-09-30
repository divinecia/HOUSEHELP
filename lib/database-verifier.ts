import { createServerClient } from '@/lib/supabase';

interface TableInfo {
  table_name: string;
  exists: boolean;
  record_count?: number;
  columns?: string[];
  error?: string;
}

interface DatabaseReport {
  total_tables: number;
  existing_tables: number;
  missing_tables: number;
  tables: TableInfo[];
  recommendations: string[];
}

const REQUIRED_TABLES = [
  'households',
  'workers', 
  'admins',
  'service_categories',
  'services',
  'bookings',
  'jobs',
  'payments',
  'payouts',
  'household_subscriptions',
  'training_modules',
  'worker_training_assignments',
  'worker_ratings_reviews',
  'messages',
  'notifications',
  'reports',
  'otp_codes',
  'verification_tokens',
  'sessions',
  'audit_logs',
  'worker_availability',
  'worker_services',
  'favorites'
];

const EXPECTED_TABLE_STRUCTURES = {
  households: ['id', 'name', 'email', 'phone', 'password_hash', 'status', 'verification_status'],
  workers: ['id', 'full_name', 'email', 'phone', 'password_hash', 'status', 'verification_status', 'rating'],
  admins: ['id', 'email', 'password_hash', 'name', 'role'],
  service_categories: ['id', 'name', 'description'],
  services: ['id', 'name', 'description', 'category_id', 'price', 'duration'],
  bookings: ['id', 'household_id', 'worker_id', 'service', 'status', 'scheduled_at'],
  jobs: ['id', 'household_id', 'worker_id', 'service', 'status', 'scheduled_at'],
  payments: ['id', 'household_id', 'worker_id', 'amount', 'status', 'method'],
  messages: ['id', 'sender_id', 'recipient_id', 'content', 'is_read'],
  notifications: ['id', 'title', 'message', 'severity', 'is_read']
};

export async function verifyDatabaseTables(): Promise<DatabaseReport> {
  const supabase = createServerClient();
  const tableResults: TableInfo[] = [];
  const recommendations: string[] = [];

  console.log('🔍 Starting database verification...');

  for (const tableName of REQUIRED_TABLES) {
    try {
      // Check if table exists by trying to query it
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(0);

      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          tableResults.push({
            table_name: tableName,
            exists: false,
            error: 'Table does not exist'
          });
        } else {
          tableResults.push({
            table_name: tableName,
            exists: false,
            error: error.message
          });
        }
      } else {
        // Table exists, get more details
        tableResults.push({
          table_name: tableName,
          exists: true,
          record_count: count || 0
        });
      }
    } catch (err: any) {
      tableResults.push({
        table_name: tableName,
        exists: false,
        error: err.message || 'Unknown error'
      });
    }
  }

  // Generate statistics
  const existingTables = tableResults.filter(t => t.exists);
  const missingTables = tableResults.filter(t => !t.exists);

  // Generate recommendations
  if (missingTables.length > 0) {
    recommendations.push(`❌ ${missingTables.length} tables are missing from your database`);
    recommendations.push('🛠️ Run the migration scripts in supabase/migrations/ to create missing tables');
    recommendations.push('📖 Execute: supabase/migrations/20250129_initial_schema.sql first');
    recommendations.push('📖 Then execute: supabase/migrations/20250130_add_missing_fields.sql');
  }

  if (existingTables.some(t => t.record_count === 0)) {
    recommendations.push('⚠️ Some tables exist but have no data');
    recommendations.push('💡 Consider running the sample data inserts from the migration files');
  }

  if (missingTables.length === 0) {
    recommendations.push('🎉 All required tables exist!');
    recommendations.push('✅ Your database structure matches the project requirements');
  }

  // Check for critical missing tables
  const criticalTables = ['households', 'workers', 'admins'];
  const missingCritical = missingTables.filter(t => criticalTables.includes(t.table_name));
  
  if (missingCritical.length > 0) {
    recommendations.push('🚨 CRITICAL: Core user tables are missing');
    recommendations.push('⚡ Authentication will not work without these tables');
  }

  return {
    total_tables: REQUIRED_TABLES.length,
    existing_tables: existingTables.length,
    missing_tables: missingTables.length,
    tables: tableResults,
    recommendations
  };
}

export async function checkDatabaseConnectivity(): Promise<{ connected: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    
    // Try a simple query to test connectivity
    const { error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (error) {
      return { connected: false, error: error.message };
    }

    return { connected: true };
  } catch (err: any) {
    return { connected: false, error: err.message || 'Unknown connection error' };
  }
}

export async function getTableDetails(tableName: string): Promise<{
  exists: boolean;
  columns?: Array<{ column_name: string; data_type: string; is_nullable: boolean }>;
  record_count?: number;
  error?: string;
}> {
  try {
    const supabase = createServerClient();

    // Check if table exists and get record count
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(0);

    if (error) {
      return { exists: false, error: error.message };
    }

    return {
      exists: true,
      record_count: count || 0
    };
  } catch (err: any) {
    return { exists: false, error: err.message || 'Unknown error' };
  }
}