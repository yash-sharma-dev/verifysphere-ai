import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { resendOtp } from '@/mocks/otpService';
import { toast } from 'sonner';

const ResendPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);
    setSuccess(false);

    resendOtp(email).then(result => {
      if (result.success) {
        setSuccess(true);
        toast.success("Code sent!", {
          description: "We sent a new code to your email — check spam",
        });
        // Redirect to verify page after 2 seconds
        setTimeout(() => {
          navigate(`/verify?email=${encodeURIComponent(email)}`);
        }, 2000);
      } else {
        setError(result.message || 'Failed to send code');
        if (result.cooldown) {
          setCooldown(result.cooldown);
        }
      }
    }).catch(() => {
      setError('Something went wrong. Please try again.');
    }).finally(() => {
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-border">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground text-center">
              Resend Verification Code
            </h1>
            <p className="text-muted-foreground text-center mt-2">
              Enter your email to receive a new code
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 dark:bg-green-500/20 border border-green-500/20 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800 dark:text-green-200">
                <p className="font-medium">Code sent successfully!</p>
                <p className="mt-1">Redirecting to verification page...</p>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading || success}
                className="w-full px-4 py-3 border-2 border-input bg-background text-foreground rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-all disabled:opacity-50"
                placeholder="your.email@example.com"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3" role="alert" aria-live="polite">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleResend}
              disabled={loading || success || cooldown > 0}
              className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : cooldown > 0 ? (
                `Wait ${cooldown}s`
              ) : success ? (
                'Redirecting...'
              ) : (
                'Resend OTP'
              )}
            </button>
          </div>

          {/* Back Link */}
          {initialEmail && (
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate(`/verify?email=${encodeURIComponent(initialEmail)}`)}
                className="text-primary hover:text-primary/80 font-medium text-sm inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to verification
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResendPage;
