import React, { useState, useEffect } from 'react';
import { formatTimeRemaining, isSafeUrl } from '../lib/validation';

interface ShareResultProps {
  content: string;
  contentType: 'text' | 'url';
  expiresAt: number;
  onReset: () => void;
}

export const ShareResult: React.FC<ShareResultProps> = ({
  content,
  contentType,
  expiresAt,
  onReset,
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
        await navigator.clipboard.writeText(content);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = content;
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
      console.error('Failed to copy content:', err);
    }
  };

  const isExpired = secondsRemaining <= 0;
  const isUrl = contentType === 'url' && isSafeUrl(content);

  return (
    <div className="paper-card rounded-2xl p-6 sm:p-7 transition-all animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#6B6864] uppercase tracking-wider">
          {isUrl ? 'Shared link' : 'Shared text'}
        </span>
        <span className="text-xs text-[#9C9890]">
          {isExpired ? (
            <span className="text-red-600 font-semibold">Expired</span>
          ) : (
            `Expires in ${formatTimeRemaining(secondsRemaining)}`
          )}
        </span>
      </div>

      {/* Content Display Area */}
      {isUrl ? (
        <div className="my-4 p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E0D5]">
          <p className="text-xs text-[#6B6864] mb-1 font-medium">Link destination:</p>
          <a
            href={content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm sm:text-base font-medium text-[#2563EB] hover:underline break-all block"
          >
            {content}
          </a>
        </div>
      ) : (
        <div className="my-4">
          <pre className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E0D5] text-sm font-mono text-[#222120] whitespace-pre-wrap break-words max-h-80 overflow-y-auto selection:bg-[#E8E1D5]">
            {content}
          </pre>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
        {isUrl && (
          <a
            href={content}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-5 rounded-xl font-semibold text-sm text-center text-[#FAF8F5] bg-[#222120] hover:bg-[#343330] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Open Link</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        <button
          type="button"
          onClick={handleCopy}
          className={`${
            isUrl ? 'sm:w-36' : 'w-full'
          } py-3 px-5 rounded-xl font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
            copied
              ? 'bg-[#14532D] text-[#F0FDF4]'
              : isUrl
              ? 'bg-[#FAF8F5] text-[#222120] border border-[#E6E0D5] hover:bg-[#EFE9DD]'
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
              Copy
            </>
          )}
        </button>
      </div>

      {/* Done / Reset Button */}
      <div className="mt-6 pt-5 border-t border-[#EFE9DD] text-center">
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-[#6B6864] hover:text-[#222120] cursor-pointer"
        >
          ← Share or receive another
        </button>
      </div>
    </div>
  );
};
