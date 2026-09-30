import { createContext, useContext, useCallback } from 'react';

interface ToastContextValue {
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within ToastContext.Provider');
  return ctx;
}

export function useToast() {
  return useToastContext();
}

export function useToastActions() {
  const { showToast } = useToastContext();
  return {
    success: useCallback((msg: string) => showToast(msg, 'success'), [showToast]),
    error: useCallback((msg: string) => showToast(msg, 'error'), [showToast]),
    info: useCallback((msg: string) => showToast(msg, 'info'), [showToast]),
    warning: useCallback((msg: string) => showToast(msg, 'warning'), [showToast]),
  };
}
