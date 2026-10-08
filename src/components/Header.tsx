import React from 'react';

interface HeaderProps {
  activeTab: 'send' | 'receive';
  onTabChange: (tab: 'send' | 'receive') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  return (
    <header className="text-center pt-8 pb-4">
      {/* Brand Icon + Name */}
      <div className="inline-flex items-center gap-2.5 mb-2 group cursor-pointer" onClick={() => onTabChange('send')}>
        <div className="w-9 h-9 rounded-xl bg-[#222120] text-[#FAF8F5] flex items-center justify-center shadow-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* Phone */}
            <rect x="2" y="5" width="6" height="14" rx="1.5" />
            {/* Arrow */}
            <path d="M10 12h4m-2-2 2 2-2 2" stroke="#60A5FA" />
            {/* Monitor */}
            <rect x="16" y="6" width="6" height="10" rx="1" />
            <path d="M19 16v2m-2 0h4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#222120] flex items-center gap-1.5">
          <span>Kittiyo?</span>
          <span className="text-[11px] font-normal text-[#9C9890] px-1.5 py-0.5 rounded-md bg-[#EFE9DD] border border-[#E2DBD0]">കിട്ടിയോ?</span>
        </h1>
      </div>

      <p className="text-sm font-medium text-[#6B6864]">
        Send it. Get a code.
      </p>
      <p className="text-xs text-[#9C9890] mt-0.5">
        Temporary text & link sharing between devices.
      </p>

      {/* Mode Switcher Tabs */}
      <div className="mt-5 inline-flex p-1 rounded-xl bg-[#EFE9DD] border border-[#E2DBD0]">
        <button
          type="button"
          onClick={() => onTabChange('send')}
          className={`px-5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'send'
              ? 'bg-[#FFFFFF] text-[#222120] shadow-sm'
              : 'text-[#6B6864] hover:text-[#222120]'
          }`}
        >
          Send
        </button>
        <button
          type="button"
          onClick={() => onTabChange('receive')}
          className={`px-5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'receive'
              ? 'bg-[#FFFFFF] text-[#222120] shadow-sm'
              : 'text-[#6B6864] hover:text-[#222120]'
          }`}
        >
          Receive
        </button>
      </div>
    </header>
  );
};
