/**
 * Mock OTP Service for VerifySphere
 * 
 * This is a frontend-only mock service that simulates OTP verification.
 * In production, replace this with actual API calls to your backend.
 * 
 * The generated OTP is logged to the console for testing purposes.
 */

interface OtpData {
  otp: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
}

interface RateLimitData {
  lastSent: number;
  count: number;
  resetAt: number;
}

const otpStore = new Map<string, OtpData>();
const rateLimitStore = new Map<string, RateLimitData>();

const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_RESENDS = 3;

const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtp = async (email: string): Promise<{ success: boolean; cooldown?: number; message?: string }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const rateLimit = rateLimitStore.get(normalizedEmail);

  // Check rate limit
  if (rateLimit) {
    if (now < rateLimit.resetAt && rateLimit.count >= MAX_RESENDS) {
      const remainingTime = Math.ceil((rateLimit.resetAt - now) / 1000 / 60);
      return {
        success: false,
        message: `Too many attempts. Please try again in ${remainingTime} minutes.`
      };
    }

    // Reset if window expired
    if (now >= rateLimit.resetAt) {
      rateLimitStore.delete(normalizedEmail);
    }
  }

  const otp = generateOtp();
  const expiresAt = now + OTP_EXPIRY;

  otpStore.set(normalizedEmail, {
    otp,
    expiresAt,
    attempts: 0,
    createdAt: now
  });

  // Update rate limit
  const currentLimit = rateLimitStore.get(normalizedEmail);
  if (currentLimit && now < currentLimit.resetAt) {
    rateLimitStore.set(normalizedEmail, {
      ...currentLimit,
      count: currentLimit.count + 1,
      lastSent: now
    });
  } else {
    rateLimitStore.set(normalizedEmail, {
      lastSent: now,
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW
    });
  }

  console.log(`[VerifySphere Mock OTP Service] OTP for ${normalizedEmail}: ${otp}`);
  console.log(`[VerifySphere Mock OTP Service] OTP expires at: ${new Date(expiresAt).toLocaleString()}`);

  return { success: true };
};

export const verifyOtp = async (email: string, otp: string): Promise<{ success: boolean; token?: string; error?: string; message?: string }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  const normalizedEmail = email.toLowerCase().trim();
  const stored = otpStore.get(normalizedEmail);

  if (!stored) {
    return {
      success: false,
      error: 'NO_OTP',
      message: 'No OTP found. Please request a new one.'
    };
  }

  const now = Date.now();

  if (now > stored.expiresAt) {
    otpStore.delete(normalizedEmail);
    return {
      success: false,
      error: 'EXPIRED',
      message: 'OTP has expired. Please request a new one.'
    };
  }

  if (stored.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    return {
      success: false,
      error: 'MAX_ATTEMPTS',
      message: 'Too many failed attempts. Please request a new OTP.'
    };
  }

  if (stored.otp !== otp) {
    stored.attempts++;
    const remaining = MAX_ATTEMPTS - stored.attempts;
    return {
      success: false,
      error: 'INVALID',
      message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
    };
  }

  // Success
  otpStore.delete(normalizedEmail);
  const token = `mock_jwt_${Date.now()}_${normalizedEmail}`;
  
  return {
    success: true,
    token,
    message: 'Verification successful!'
  };
};

export const resendOtp = async (email: string): Promise<{ success: boolean; cooldown?: number; message?: string }> => {
  const normalizedEmail = email.toLowerCase().trim();
  const rateLimit = rateLimitStore.get(normalizedEmail);
  const now = Date.now();

  if (rateLimit && now - rateLimit.lastSent < RESEND_COOLDOWN) {
    const remaining = Math.ceil((RESEND_COOLDOWN - (now - rateLimit.lastSent)) / 1000);
    return {
      success: false,
      cooldown: remaining,
      message: `Please wait ${remaining} seconds before requesting a new code.`
    };
  }

  return sendOtp(email);
};

export const getOtpExpiry = (email: string): number | null => {
  const normalizedEmail = email.toLowerCase().trim();
  const record = otpStore.get(normalizedEmail);
  return record ? record.expiresAt : null;
};

export const getResendCooldown = (email: string): number => {
  const normalizedEmail = email.toLowerCase().trim();
  const record = rateLimitStore.get(normalizedEmail);
  if (!record) return 0;
  
  const now = Date.now();
  if (now - record.lastSent < RESEND_COOLDOWN) {
    return Math.ceil((RESEND_COOLDOWN - (now - record.lastSent)) / 1000);
  }
  return 0;
};

export const getResendCount = (email: string): number => {
  const normalizedEmail = email.toLowerCase().trim();
  const record = rateLimitStore.get(normalizedEmail);
  if (!record) return 0;
  
  const now = Date.now();
  if (now >= record.resetAt) {
    return 0; // Reset after window expires
  }
  return record.count;
};
