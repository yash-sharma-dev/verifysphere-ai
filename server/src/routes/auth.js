import express from 'express';
import { generateOTP, verifyOTP, sendOTPEmail } from '../services/otpService.js';
import { OTPStore } from '../services/otpStore.js';

const router = express.Router();
const otpStore = new OTPStore();

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }

    // Check if user is rate limited
    if (otpStore.isRateLimited(email)) {
      const cooldown = otpStore.getCooldownTime(email);
      return res.status(429).json({
        success: false,
        error: `Too many requests. Please try again in ${cooldown} seconds`,
        code: 'RATE_LIMITED',
        cooldown
      });
    }

    const otp = generateOTP();
    await otpStore.storeOTP(email, otp);
    
    // Send email
    try {
      await sendOTPEmail(email, otp);
    } catch (err) {
      console.error('Failed to send email:', err);
      // For development, log the OTP
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP',
      code: 'SEND_FAILED'
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required',
        code: 'MISSING_FIELDS'
      });
    }

    const verificationResult = await otpStore.verifyOTP(email, otp);
    
    if (verificationResult.success) {
      // In production, generate and set JWT cookie here
      res.json({
        success: true,
        message: 'OTP verified successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: verificationResult.error,
        code: verificationResult.code
      });
    }
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP',
      code: 'VERIFY_FAILED'
    });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }

    // Check cooldown
    if (otpStore.isInCooldown(email)) {
      const cooldown = otpStore.getCooldownTime(email);
      return res.status(429).json({
        success: false,
        error: `Please wait ${cooldown} seconds before requesting a new code`,
        code: 'IN_COOLDOWN',
        cooldown
      });
    }

    const otp = generateOTP();
    await otpStore.storeOTP(email, otp);
    
    // Send email
    try {
      await sendOTPEmail(email, otp);
    } catch (err) {
      console.error('Failed to send email:', err);
      // For development, log the OTP
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }

    res.json({
      success: true,
      message: 'New OTP sent successfully'
    });
  } catch (err) {
    console.error('Error resending OTP:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to resend OTP',
      code: 'RESEND_FAILED'
    });
  }
});

export default router;