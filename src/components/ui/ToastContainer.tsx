import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { cn } from './primitives';

export function ToastContainer() {
  const toasts = useFinanceStore((s) => s.toasts);
  const dismissToast = useFinanceStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 lg:bottom-5 right-4 z-[60] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'success'
            ? CheckCircle2
            : toast.type === 'error'
            ? XCircle
            : toast.type === 'warning'
            ? AlertTriangle
            : Info;

        const toneClass =
          toast.type === 'success'
            ? 'border-emerald-200 bg-white text-[#172B4D]'
            : toast.type === 'error'
            ? 'border-red-200 bg-white text-[#172B4D]'
            : toast.type === 'warning'
            ? 'border-amber-200 bg-white text-[#172B4D]'
            : 'border-blue-200 bg-white text-[#172B4D]';

        const iconColor =
          toast.type === 'success'
            ? 'text-[#16A34A]'
            : toast.type === 'error'
            ? 'text-[#DC2626]'
            : toast.type === 'warning'
            ? 'text-[#D97706]'
            : 'text-[#2563EB]';

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto border rounded-xl p-3.5 shadow-lg flex items-start gap-3',
              toneClass
            )}
          >
            <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', iconColor)} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#172B4D]">{toast.title}</p>
              <p className="text-xs text-[#64748B] mt-0.5 leading-snug">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
