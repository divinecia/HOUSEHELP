// Authentication Utility Functions
import { createServerClient } from './supabase';
import { generateToken, verifyToken, hashPassword, comparePassword } from './auth';
import { AuthUser, LoginCredentials, RegisterData } from './types';

/**
 * Register a new user (worker or household)
 */
export async function registerUser(data: RegisterData): Promise<{
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}> {
  try {
    const supabase = createServerClient();

    // Hash the password
    const hashedPassword = await hashPassword(data.password);

    // Determine table based on user type
    const table = data.user_type === 'worker' ? 'workers' : 'households';
    const nameField = data.user_type === 'worker' ? 'full_name' : 'name';

    // Create user record
    const { data: userData, error } = await supabase
      .from(table)
      .insert([
        {
          [nameField]: data.full_name || data.name,
          email: data.email,
          phone: data.phone,
          password_hash: hashedPassword,
          status: 'verifying',
          verification_status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create account',
      };
    }

    // Create auth user object
    const authUser: AuthUser = {
      id: userData.id,
      email: userData.email,
      user_type: data.user_type,
      name: userData[nameField],
      phone: userData.phone,
    };

    // Generate JWT token
    const token = await generateToken(authUser);

    return {
      success: true,
      user: authUser,
      token,
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.message || 'Failed to register user',
    };
  }
}

/**
 * Login a user (worker, household, or admin)
 */
export async function loginUser(credentials: LoginCredentials): Promise<{
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}> {
  try {
    const supabase = createServerClient();

    // Determine table based on user type
    let table: string;
    let nameField: string;

    if (credentials.user_type === 'admin') {
      table = 'admins';
      nameField = 'name';
    } else if (credentials.user_type === 'worker') {
      table = 'workers';
      nameField = 'full_name';
    } else {
      table = 'households';
      nameField = 'name';
    }

    // Fetch user by email
    const { data: userData, error } = await supabase
      .from(table)
      .select('*')
      .eq('email', credentials.email)
      .single();

    if (error || !userData) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      credentials.password,
      userData.password_hash
    );

    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Check if account is active
    if (userData.status === 'suspended') {
      return {
        success: false,
        error: 'Your account has been suspended. Please contact support.',
      };
    }

    // Create auth user object
    const authUser: AuthUser = {
      id: userData.id,
      email: userData.email,
      user_type: credentials.user_type,
      name: userData[nameField],
      phone: userData.phone,
    };

    // Generate JWT token
    const token = await generateToken(authUser);

    return {
      success: true,
      user: authUser,
      token,
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message || 'Failed to login',
    };
  }
}

/**
 * Verify user from JWT token
 */
export async function verifyUser(token: string): Promise<{
  success: boolean;
  user?: AuthUser;
  error?: string;
}> {
  try {
    const payload = await verifyToken(token);

    if (!payload) {
      return {
        success: false,
        error: 'Invalid or expired token',
      };
    }

    const supabase = createServerClient();

    // Determine table based on user type
    let table: string;
    let nameField: string;

    if (payload.userType === 'admin') {
      table = 'admins';
      nameField = 'name';
    } else if (payload.userType === 'worker') {
      table = 'workers';
      nameField = 'full_name';
    } else {
      table = 'households';
      nameField = 'name';
    }

    // Fetch user data
    const { data: userData, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (error || !userData) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Check if account is active
    if (userData.status === 'suspended') {
      return {
        success: false,
        error: 'Account suspended',
      };
    }

    const authUser: AuthUser = {
      id: userData.id,
      email: userData.email,
      user_type: payload.userType,
      name: userData[nameField],
      phone: userData.phone,
    };

    return {
      success: true,
      user: authUser,
    };
  } catch (error: any) {
    console.error('Verification error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify user',
    };
  }
}

/**
 * Update user password
 */
export async function updatePassword(
  userId: string,
  userType: 'worker' | 'household' | 'admin',
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Determine table
    const table = userType === 'worker' ? 'workers' : userType === 'household' ? 'households' : 'admins';

    // Update password
    const { error } = await supabase
      .from(table)
      .update({ password_hash: hashedPassword })
      .eq('id', userId);

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to update password',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Password update error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update password',
    };
  }
}

/**
 * Check if email exists
 */
export async function emailExists(
  email: string,
  userType: 'worker' | 'household' | 'admin'
): Promise<boolean> {
  try {
    const supabase = createServerClient();
    const table = userType === 'worker' ? 'workers' : userType === 'household' ? 'households' : 'admins';

    const { data, error } = await supabase
      .from(table)
      .select('id')
      .eq('email', email)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Check if phone exists
 */
export async function phoneExists(
  phone: string,
  userType: 'worker' | 'household'
): Promise<boolean> {
  try {
    const supabase = createServerClient();
    const table = userType === 'worker' ? 'workers' : 'households';

    const { data, error } = await supabase
      .from(table)
      .select('id')
      .eq('phone', phone)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(
  userId: string,
  userType: 'worker' | 'household' | 'admin'
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const supabase = createServerClient();
    const table = userType === 'worker' ? 'workers' : userType === 'household' ? 'households' : 'admins';

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    return {
      success: true,
      user: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch user',
    };
  }
}

/**
 * Extract user from request headers
 */
export async function extractUserFromHeaders(headers: Headers): Promise<{
  userId?: string;
  userType?: 'worker' | 'household' | 'admin';
  token?: string;
}> {
  const authHeader = headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {};
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);

  if (!payload) {
    return {};
  }

  return {
    userId: payload.userId,
    userType: payload.userType,
    token,
  };
}