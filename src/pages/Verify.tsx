import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Mail, Clock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { OtpInput } from '@/components/OTPInput';
import { sendOtp, verifyOtp, getOtpExpiry } from '@/mocks/otpService';
import { toast } from 'sonner';

const VerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/resend');
      return;
    }

    // Send OTP on mount
    sendOtp(email).then((result) => {
      if (result.success) {
        toast.success("Verification code sent!", {
          description: "Check your email (and browser console) for the code.",
        });
      }
    });

    // Countdown timer
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  const maskEmail = (email: string) => {
    const [name, domain] = email.split('@');
    if (name.length <= 2) return email;
    return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
  };

  const handleComplete = async (otpValue: string) => {
    setOtp(otpValue);
    setError('');
    setLoading(true);

    try {
      const result = await verifyOtp(email, otpValue);
      
      if (result.success) {
        // Store token
        localStorage.setItem('fakecheck_token', result.token!);
        localStorage.setItem('fakecheck_email', email);
        toast.success("Verification successful!", {
          description: "Redirecting to dashboard...",
        });
        // Redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setError(result.message || 'Verification failed');
        setOtp('');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / 300) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-border">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground text-center">
              Verify Your Email
            </h1>
            <p className="text-muted-foreground text-center mt-2">
              We've sent a verification code to
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">
                {showEmail ? email : maskEmail(email)}
              </span>
              <button
                onClick={() => setShowEmail(!showEmail)}
                className="text-primary hover:text-primary/80"
                aria-label={showEmail ? "Hide email" : "Show email"}
              >
                {showEmail ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Code expires in
              </span>
              <span className="text-sm font-medium text-foreground">
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3 text-center">
              Enter 6-digit code
            </label>
            <OtpInput
              onComplete={handleComplete}
              disabled={loading || timeLeft === 0}
              error={!!error}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3" role="alert" aria-live="polite">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Expired Message */}
          {timeLeft === 0 && (
            <div className="mb-6 p-4 bg-yellow-500/10 dark:bg-yellow-500/20 border border-yellow-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">Code expired</p>
                <p className="mt-1">Please request a new verification code.</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center mb-6">
              <div className="inline-block w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground mt-2">Verifying...</p>
            </div>
          )}

          {/* Resend Link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={() => navigate(`/resend?email=${encodeURIComponent(email)}`)}
              className="text-primary hover:text-primary/80 font-medium text-sm inline-flex items-center gap-1"
            >
              Resend verification code
            </button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Check your spam folder if you don't see the email
        </p>
      </div>
    </div>
  );
};

export default VerifyPage;
