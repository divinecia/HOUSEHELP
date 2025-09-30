import { NextRequest } from "next/server";
import { verifyDatabaseTables, checkDatabaseConnectivity } from '@/lib/database-verifier';

export async function GET(req: NextRequest) {
  try {
    // First check if we can connect to the database
    const connectivity = await checkDatabaseConnectivity();
    
    if (!connectivity.connected) {
      return Response.json({
        success: false,
        error: "Database connection failed",
        details: connectivity.error,
        recommendations: [
          "Check your NEXT_PUBLIC_SUPABASE_URL environment variable",
          "Check your SUPABASE_SERVICE_ROLE environment variable", 
          "Verify your Supabase project is active",
          "Check your network connection"
        ]
      }, { status: 500 });
    }

    // Run the full database verification
    const report = await verifyDatabaseTables();
    
    return Response.json({
      success: true,
      database_connected: true,
      verification_report: report,
      summary: {
        total_tables_required: report.total_tables,
        existing_tables: report.existing_tables,
        missing_tables: report.missing_tables,
        completion_percentage: Math.round((report.existing_tables / report.total_tables) * 100)
      }
    });

  } catch (error: any) {
    console.error('Database verification error:', error);
    
    return Response.json({
      success: false,
      error: "Verification failed",
      details: error.message,
      recommendations: [
        "Check your environment variables",
        "Verify Supabase project configuration",
        "Check the error logs for more details"
      ]
    }, { status: 500 });
  }
}