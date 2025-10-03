/**
 * Standardized error handling utilities
 */

export interface AppError {
  message: string;
  code?: string;
  status?: number;
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof Error) {
    // Handle fetch errors
    if (error.message.includes('Failed to fetch')) {
      return {
        message: 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR',
      };
    }

    return {
      message: error.message,
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN_ERROR',
  };
}

export function formatErrorMessage(error: unknown): string {
  const appError = handleApiError(error);
  return appError.message;
}

export async function handleResponse(response: Response): Promise<any> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const data = await response.json();
      if (data.error) {
        errorMessage = data.error;
      } else if (data.message) {
        errorMessage = data.message;
      }
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}