import React, { useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'error';
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const bgStyles = {
    info: 'bg-[#222120] text-[#FAF8F5] border-[#383734]',
    success: 'bg-[#14532D] text-[#F0FDF4] border-[#166534]',
    error: 'bg-[#7F1D1D] text-[#FEF2F2] border-[#991B1B]',
  }[toast.type];

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-200 transform ease-out"
    >
      <div
        className={`px-4 py-2.5 rounded-xl border shadow-lg text-sm font-medium flex items-center gap-2 max-w-sm ${bgStyles}`}
      >
        <span>{toast.text}</span>
        <button
          onClick={onClose}
          type="button"
          aria-label="Dismiss message"
          className="ml-2 text-xs opacity-70 hover:opacity-100 transition-opacity p-0.5 rounded cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
