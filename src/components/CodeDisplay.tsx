import React, { useState, useEffect } from 'react';
import { formatTimeRemaining } from '../lib/validation';

interface CodeDisplayProps {
  code: string;
  expiresAt: number;
  onDone: () => void;
}

export const CodeDisplay: React.FC<CodeDisplayProps> = ({
  code,
  expiresAt,
  onDone,
}) => {
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    return Math.max(0, expiresAt - Math.floor(Date.now() / 1000));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, expiresAt - Math.floor(Date.now() / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        // Fallback for older browsers / non-HTTPS local setups
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const isExpired = secondsRemaining <= 0;

  return (
    <div className="paper-card rounded-2xl p-7 sm:p-8 text-center transition-all animate-in fade-in duration-200">
      <p className="text-xs font-semibold text-[#6B6864] uppercase tracking-wider mb-2">
        Your code
      </p>

      {/* Prominent Code Display */}
      <div className="relative inline-block my-3">
        <div className="text-6xl sm:text-7xl font-mono font-bold tracking-widest text-[#222120] select-all px-6 py-2 bg-[#FAF8F5] rounded-2xl border border-[#E6E0D5]">
          {code}
        </div>
      </div>

      {/* Expiration Countdown */}
      <div className="mt-2 mb-6">
        {isExpired ? (
          <span className="text-xs font-semibold text-red-600">
            This code has expired.
          </span>
        ) : (
          <span className="text-xs font-medium text-[#6B6864] flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
            Expires in {formatTimeRemaining(secondsRemaining)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
        <button
          type="button"
          onClick={handleCopy}
          className={`w-full py-3 px-5 rounded-xl font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
            copied
              ? 'bg-[#14532D] text-[#F0FDF4]'
              : 'bg-[#222120] text-[#FAF8F5] hover:bg-[#343330] active:scale-[0.99]'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied ✓
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              Copy Code
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onDone}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#6B6864] hover:text-[#222120] hover:bg-[#F4EFE6] transition-all cursor-pointer"
        >
          Done
        </button>
      </div>

      {/* Lab PC Instructions */}
      <div className="mt-7 pt-5 border-t border-[#EFE9DD]">
        <p className="text-xs text-[#6B6864] leading-relaxed">
          Open <strong className="text-[#222120]">Kittiyo?</strong> on your PC<br />
          and enter this code.
        </p>
      </div>
    </div>
  );
};
