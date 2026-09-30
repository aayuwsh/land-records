import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `toast-${++toastId}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}

export function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  const colors: Record<Toast['type'], string> = {
    success: '#3d7068',
    error: '#b54545',
    info: '#4a6fa5',
    warning: '#c47830',
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] space-y-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-[#f7f6f2] border px-4 py-3 fade-in-up cursor-pointer flex items-start gap-3"
          style={{ borderLeft: `3px solid ${colors[t.type]}` }}
          onClick={() => onRemove(t.id)}
        >
          <span className="text-[10px] mono-data uppercase tracking-[0.15em] mt-0.5" style={{ color: colors[t.type] }}>
            {t.type}
          </span>
          <span className="text-sm text-[#1c1c1c] flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
