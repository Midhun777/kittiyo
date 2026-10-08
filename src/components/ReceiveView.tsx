import React, { useState, useRef, useEffect } from 'react';
import { isValidCode } from '../lib/validation';

interface ReceiveViewProps {
  onRetrieve: (code: string) => Promise<void>;
  isLoading: boolean;
  onSwitchToSend: () => void;
  error?: string | null;
}

export const ReceiveView: React.FC<ReceiveViewProps> = ({
  onRetrieve,
  isLoading,
  onSwitchToSend,
  error,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Auto-focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    setLocalError(null);

    // Only allow digits
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
      return;
    }

    // Handle single digit input
    const nextDigits = [...digits];
    nextDigits[index] = cleaned.slice(-1);
    setDigits(nextDigits);

    // Auto-advance to next input
    if (index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Move focus back on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setLocalError(null);
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const nextDigits = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      nextDigits[i] = pasted[i];
    }
    setDigits(nextDigits);

    // Focus last filled or next empty
    const focusIndex = Math.min(pasted.length, 3);
    inputRefs.current[focusIndex]?.focus();

    // If fully filled 4 digits on paste, we can automatically submit or wait for enter
    if (pasted.length === 4) {
      onRetrieve(pasted);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLocalError(null);

    const fullCode = digits.join('');
    if (!isValidCode(fullCode)) {
      setLocalError('Enter a 4-digit code.');
      return;
    }

    onRetrieve(fullCode);
  };

  const displayError = localError || error;

  return (
    <div className="paper-card rounded-2xl p-6 sm:p-7 transition-all">
      <form onSubmit={handleSubmit} className="flex flex-col items-center">
        <p className="text-xs font-semibold text-[#6B6864] uppercase tracking-wider mb-6 text-center">
          Enter your code
        </p>

        {/* 4 Digit Inputs */}
        <div className="flex gap-2.5 sm:gap-3.5 justify-center mb-6" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              disabled={isLoading}
              aria-label={`Digit ${idx + 1}`}
              className="paper-input w-13 h-16 sm:w-16 sm:h-20 text-3xl sm:text-4xl text-center font-mono font-bold text-[#222120] rounded-xl focus:outline-none"
            />
          ))}
        </div>

        {displayError && (
          <div className="mb-5 text-center text-xs font-medium text-red-600 bg-red-50 py-2 px-3.5 rounded-lg border border-red-200">
            {displayError}
          </div>
        )}

        {/* Submit Open Button */}
        <button
          type="submit"
          disabled={isLoading || digits.join('').length < 4}
          className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm sm:text-base text-[#FAF8F5] bg-[#222120] hover:bg-[#343330] active:scale-[0.99] transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Opening...
            </>
          ) : (
            'Open'
          )}
        </button>
      </form>

      {/* Switch to Send link */}
      <div className="mt-6 pt-5 border-t border-[#EFE9DD] text-center">
        <p className="text-xs text-[#6B6864]">
          Want to send something?{' '}
          <button
            type="button"
            onClick={onSwitchToSend}
            className="font-semibold text-[#222120] underline hover:text-[#000000] cursor-pointer ml-1"
          >
            Send
          </button>
        </p>
      </div>
    </div>
  );
};
