import React, { useState, useId } from 'react';
import { detectContentType, formatBytes } from '../lib/validation';

interface SendViewProps {
  onGenerateCode: (content: string, contentType: 'text' | 'url') => Promise<void>;
  isLoading: boolean;
  onSwitchToReceive: () => void;
}

export const SendView: React.FC<SendViewProps> = ({
  onGenerateCode,
  isLoading,
  onSwitchToReceive,
}) => {
  const [content, setContent] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const textareaId = useId();

  const detectedType = detectContentType(content);
  const byteCount = new TextEncoder().encode(content).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = content.trim();
    if (!trimmed) {
      setValidationError('Paste something first.');
      return;
    }

    await onGenerateCode(trimmed, detectedType);
  };

  return (
    <div className="paper-card rounded-2xl p-6 sm:p-7 transition-all">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-[#6B6864] uppercase tracking-wider mb-2"
          >
            Paste your text or link
          </label>
          <div className="relative">
            <textarea
              id={textareaId}
              rows={5}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Paste text or a link here..."
              disabled={isLoading}
              className="paper-input w-full p-3.5 sm:p-4 text-sm sm:text-base font-mono rounded-xl resize-none text-[#222120] placeholder-[#A8A39A] focus:outline-none"
              autoFocus
            />

            {/* Type detector badge on bottom right of textarea */}
            {content.trim() && (
              <div className="absolute right-3 bottom-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#EFE9DD] text-[11px] font-semibold text-[#4A4742]">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    detectedType === 'url' ? 'bg-[#2563EB]' : 'bg-[#16A34A]'
                  }`}
                />
                {detectedType === 'url' ? 'LINK' : 'TEXT'}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-[#9C9890]">
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1 ${detectedType === 'text' && content.trim() ? 'text-[#222120] font-medium' : ''}`}>
                <span className={`w-2 h-2 rounded-full border ${detectedType === 'text' && content.trim() ? 'bg-[#222120] border-[#222120]' : 'border-[#9C9890]'}`} />
                Text
              </span>
              <span className={`flex items-center gap-1 ${detectedType === 'url' && content.trim() ? 'text-[#2563EB] font-medium' : ''}`}>
                <span className={`w-2 h-2 rounded-full border ${detectedType === 'url' && content.trim() ? 'bg-[#2563EB] border-[#2563EB]' : 'border-[#9C9890]'}`} />
                Link
              </span>
            </div>

            <span>
              {byteCount > 0 ? formatBytes(byteCount) : 'No size limit'}
            </span>
          </div>

          {validationError && (
            <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
              <span>⚠</span> {validationError}
            </p>
          )}
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3.5 px-6 rounded-xl font-semibold text-sm sm:text-base text-[#FAF8F5] bg-[#222120] hover:bg-[#343330] active:scale-[0.99] transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating your code...
            </>
          ) : (
            'Generate Code'
          )}
        </button>

        {/* Subtle lab notebook note */}
        <p className="text-center text-[11px] text-[#9C9890] italic mt-1">
          Made for that &ldquo;I need this on the lab PC&rdquo; moment.
        </p>
      </form>

      {/* Switch to receive link */}
      <div className="mt-6 pt-5 border-t border-[#EFE9DD] text-center">
        <p className="text-xs text-[#6B6864]">
          Already have a code?{' '}
          <button
            type="button"
            onClick={onSwitchToReceive}
            className="font-semibold text-[#222120] underline hover:text-[#000000] cursor-pointer ml-1"
          >
            Receive
          </button>
        </p>
      </div>
    </div>
  );
};
