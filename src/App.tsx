import React, { useState } from 'react';
import { Header } from './components/Header';
import { SendView } from './components/SendView';
import { CodeDisplay } from './components/CodeDisplay';
import { ReceiveView } from './components/ReceiveView';
import { ShareResult } from './components/ShareResult';
import { Toast, ToastMessage } from './components/Toast';
import { createShare, retrieveShare, LabDropApiError } from './lib/api';

type AppView = 'send' | 'code' | 'receive' | 'result';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('send');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Send state
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<number | null>(null);

  // Retrieve state
  const [receiveError, setReceiveError] = useState<string | null>(null);
  const [retrievedContent, setRetrievedContent] = useState<string | null>(null);
  const [retrievedType, setRetrievedType] = useState<'text' | 'url'>('text');
  const [retrievedExpiresAt, setRetrievedExpiresAt] = useState<number | null>(null);

  const showToast = (type: 'info' | 'success' | 'error', text: string) => {
    setToast({ id: Math.random().toString(), type, text });
  };

  const handleGenerateCode = async (content: string, contentType: 'text' | 'url') => {
    setIsLoading(true);
    try {
      const response = await createShare(content, contentType);
      setGeneratedCode(response.code);
      setCodeExpiresAt(response.expiresAt);
      setCurrentView('code');
    } catch (err) {
      if (err instanceof LabDropApiError) {
        showToast('error', err.message);
      } else {
        showToast('error', 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetrieveCode = async (code: string) => {
    setIsLoading(true);
    setReceiveError(null);
    try {
      const response = await retrieveShare(code);
      setRetrievedContent(response.content);
      setRetrievedType(response.contentType);
      setRetrievedExpiresAt(response.expiresAt);
      setCurrentView('result');
    } catch (err) {
      if (err instanceof LabDropApiError) {
        if (err.code === 'SHARE_NOT_FOUND') {
          setReceiveError("We couldn't find that code. It may be wrong or expired.");
        } else if (err.code === 'RATE_LIMITED') {
          setReceiveError('Too many attempts. Please wait a moment and try again.');
        } else {
          setReceiveError(err.message);
        }
      } else {
        setReceiveError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setGeneratedCode(null);
    setCodeExpiresAt(null);
    setRetrievedContent(null);
    setReceiveError(null);
    setCurrentView('send');
  };

  // Derive tab state for Header
  const activeTab = currentView === 'receive' || currentView === 'result' ? 'receive' : 'send';

  const handleTabChange = (tab: 'send' | 'receive') => {
    setReceiveError(null);
    if (tab === 'send') {
      if (currentView !== 'send' && currentView !== 'code') {
        setCurrentView('send');
      }
    } else {
      if (currentView !== 'receive' && currentView !== 'result') {
        setCurrentView('receive');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 sm:px-6">
      <div className="w-full max-w-md mx-auto pt-4 sm:pt-8">
        <Header activeTab={activeTab} onTabChange={handleTabChange} />

        <main className="mt-4 sm:mt-6">
          {currentView === 'send' && (
            <SendView
              onGenerateCode={handleGenerateCode}
              isLoading={isLoading}
              onSwitchToReceive={() => {
                setReceiveError(null);
                setCurrentView('receive');
              }}
            />
          )}

          {currentView === 'code' && generatedCode && codeExpiresAt && (
            <CodeDisplay
              code={generatedCode}
              expiresAt={codeExpiresAt}
              onDone={handleReset}
            />
          )}

          {currentView === 'receive' && (
            <ReceiveView
              onRetrieve={handleRetrieveCode}
              isLoading={isLoading}
              onSwitchToSend={() => setCurrentView('send')}
              error={receiveError}
            />
          )}

          {currentView === 'result' && retrievedContent && retrievedExpiresAt && (
            <ShareResult
              content={retrievedContent}
              contentType={retrievedType}
              expiresAt={retrievedExpiresAt}
              onReset={handleReset}
            />
          )}
        </main>
      </div>

      {/* Minimal Footer */}
      <footer className="w-full max-w-md mx-auto py-8 text-center border-t border-[#EFE9DD]/80 mt-10">
        <p className="text-xs font-medium text-[#6B6864]">
          Kittiyo? · Temporary sharing
        </p>
        <p className="text-[11px] text-[#9C9890] mt-1">
          No accounts. No history. Shares expire after 10 minutes.
        </p>
      </footer>

      {/* Toast notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
