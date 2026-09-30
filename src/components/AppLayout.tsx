import { useState, useEffect, ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { ToastContainer, useToast } from '@/components/Toast';
import { ToastContext } from '@/context/ToastContext';

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <div className="flex min-h-screen bg-[#f7f6f2]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 lg:p-6">
            {children}
          </main>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </ToastContext.Provider>
  );
}
