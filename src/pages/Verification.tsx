import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { verifyOTP, resendOTP } from "@/lib/authService"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { OTPInput } from "@/components/OTPInput"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function VerificationPage() {
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)
  const [showResendModal, setShowResendModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  
  const email = location.state?.email || ""
  const maskedEmail = email.replace(/(.{3}).*(@.*)/, "$1***$2")

  useEffect(() => {
    // Animate progress bar on mount
    const timer = setTimeout(() => setProgress(100), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter a complete 6-digit code")
      return
    }

    setLoading(true)
    setError("")

    try {
      const data = await verifyOTP(email, otp)

      if (!data.success) {
        throw new Error(data.error || "Verification failed")
      }

      toast({
        title: "Success!",
        description: "Your email has been verified.",
      })

      // Redirect to dashboard or home page
      navigate("/")

    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Almost there!</CardTitle>
          <CardDescription>
            We sent a verification code to {maskedEmail}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={progress} className="h-1" />
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <OTPInput
              value={otp}
              onChange={setOtp}
              disabled={loading}
            />

            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={otp.length !== 6 || loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Verifying..." : "Continue"}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoBack}
              disabled={loading}
            >
              Go Back
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                className="text-sm"
                onClick={() => setShowResendModal(true)}
                disabled={timeLeft > 0}
              >
                Didn't receive the code?
                {timeLeft > 0 && ` (${formatTime(timeLeft)})`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showResendModal} onOpenChange={setShowResendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resend Verification Code</DialogTitle>
          </DialogHeader>
          <ResendOTPContent
            email={email}
            onSuccess={() => {
              setShowResendModal(false)
              setTimeLeft(300) // Reset timer
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ResendOTPContent({ email, onSuccess }: { email: string, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleResend = async () => {
    setLoading(true)
    try {
      const data = await resendOTP(email)

      if (!data.success) {
        throw new Error(data.error || "Failed to resend code")
      }

      toast({
        title: "Code Sent!",
        description: "A new verification code has been sent to your email.",
      })
      
      onSuccess()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to resend code",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        We'll send a new verification code to {email}
      </p>
      <Button
        className="w-full"
        onClick={handleResend}
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Sending..." : "Send New Code"}
      </Button>
    </div>
  )
}