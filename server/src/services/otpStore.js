class OTPStore {
  constructor() {
    this.otps = new Map();
    this.attempts = new Map();
    this.resendCounts = new Map();
    this.lastResendTime = new Map();
    
    this.OTP_TTL = parseInt(process.env.OTP_TTL_SECONDS || '300'); // 5 minutes
    this.MAX_ATTEMPTS = 5;
    this.MAX_RESENDS = 3;
    this.RESEND_COOLDOWN = parseInt(process.env.RESEND_COOLDOWN_SECONDS || '60'); // 1 minute
  }

  async storeOTP(email, otp) {
    const expiryTime = Date.now() + (this.OTP_TTL * 1000);
    this.otps.set(email, { otp, expiryTime });
    this.attempts.set(email, 0);
    
    // Track resend
    const resendCount = this.resendCounts.get(email) || 0;
    this.resendCounts.set(email, resendCount + 1);
    this.lastResendTime.set(email, Date.now());
    
    // Schedule cleanup
    setTimeout(() => {
      this.otps.delete(email);
      this.attempts.delete(email);
    }, this.OTP_TTL * 1000);
  }

  async verifyOTP(email, inputOTP) {
    const otpData = this.otps.get(email);
    
    if (!otpData) {
      return {
        success: false,
        error: 'OTP not found or expired',
        code: 'OTP_NOT_FOUND'
      };
    }

    // Check expiry
    if (Date.now() > otpData.expiryTime) {
      this.otps.delete(email);
      return {
        success: false,
        error: 'OTP has expired',
        code: 'OTP_EXPIRED'
      };
    }

    // Check attempts
    const attempts = (this.attempts.get(email) || 0) + 1;
    this.attempts.set(email, attempts);

    if (attempts > this.MAX_ATTEMPTS) {
      return {
        success: false,
        error: 'Too many attempts',
        code: 'MAX_ATTEMPTS_EXCEEDED'
      };
    }

    // Verify OTP
    if (otpData.otp === inputOTP) {
      // Clear OTP data on successful verification
      this.otps.delete(email);
      this.attempts.delete(email);
      return {
        success: true
      };
    }

    return {
      success: false,
      error: 'Invalid OTP',
      code: 'INVALID_OTP'
    };
  }

  isRateLimited(email) {
    const resendCount = this.resendCounts.get(email) || 0;
    return resendCount >= this.MAX_RESENDS;
  }

  isInCooldown(email) {
    const lastResend = this.lastResendTime.get(email);
    if (!lastResend) return false;
    
    const timeSinceLastResend = (Date.now() - lastResend) / 1000;
    return timeSinceLastResend < this.RESEND_COOLDOWN;
  }

  getCooldownTime(email) {
    const lastResend = this.lastResendTime.get(email);
    if (!lastResend) return 0;
    
    const timeSinceLastResend = (Date.now() - lastResend) / 1000;
    return Math.max(0, Math.ceil(this.RESEND_COOLDOWN - timeSinceLastResend));
  }
}

export { OTPStore };