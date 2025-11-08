import * as React from "react"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  disabled?: boolean
}

export function OTPInput({ value, onChange, maxLength = 6, disabled = false }: OTPInputProps) {
  return (
    <InputOTP
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      disabled={disabled}
      render={({ slots }) => (
        <InputOTPGroup>
          {slots.map((_, index) => (
            <InputOTPSlot 
              key={index} 
              index={index} 
              className="rounded-md border-2 w-10 h-10 text-center text-lg"
            />
          ))}
        </InputOTPGroup>
      )}
    />
  )
}