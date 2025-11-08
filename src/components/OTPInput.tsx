import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({ length = 6, onComplete, disabled = false, error = false }) => {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (index: number, value: string) => {
    if (disabled) return;

    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);

    // Move to next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (newValues.every(v => v !== '')) {
      onComplete(newValues.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter' && values.every(v => v !== '')) {
      onComplete(values.join(''));
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Only accept 6-digit numbers
    if (/^\d{6}$/.test(pastedData)) {
      const newValues = pastedData.split('');
      setValues(newValues);
      inputRefs.current[length - 1]?.focus();
      onComplete(pastedData);
    }
  };

  return (
    <div className="flex gap-2 justify-center" role="group" aria-label="One-time password input">
      {values.map((value, index) => (
        <input
          key={index}
          ref={el => inputRefs.current[index] = el}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value}
          onChange={e => handleChange(index, e.target.value)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          disabled={disabled}
          className={`w-12 h-14 text-center text-2xl font-semibold border-2 rounded-lg transition-all
            ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
            focus:outline-none focus:ring-2 focus:ring-blue-200`}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={error}
        />
      ))}
    </div>
  );
};
