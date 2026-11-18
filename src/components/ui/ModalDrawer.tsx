import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from './primitives';

export function ModalDialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#101F35]/50 backdrop-blur-[1px] p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'w-full bg-white border border-slate-200 sm:rounded-xl rounded-t-2xl max-h-[92vh] flex flex-col shadow-xl overflow-hidden',
          maxWidth
        )}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#172B4D] truncate">{title}</h2>
            {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#172B4D] hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function SideSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  widthClass = 'max-w-3xl',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  widthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#101F35]/45 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          'relative z-10 w-full bg-white h-full border-l border-slate-200 flex flex-col shadow-2xl',
          widthClass
        )}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 shrink-0 bg-white">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#172B4D] truncate">{title}</h2>
            {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#172B4D] hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
