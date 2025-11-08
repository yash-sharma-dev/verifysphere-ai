const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
  cooldown?: number;
}

export const sendOTP = async (email: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: 'Failed to send OTP',
      code: 'NETWORK_ERROR',
    };
  }
};

export const verifyOTP = async (email: string, otp: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: 'Failed to verify OTP',
      code: 'NETWORK_ERROR',
    };
  }
};

export const resendOTP = async (email: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: 'Failed to resend OTP',
      code: 'NETWORK_ERROR',
    };
  }
};