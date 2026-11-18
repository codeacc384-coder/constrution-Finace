import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileWarning,
  Info,
  Lock,
  XCircle,
} from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary:
        'bg-[#2563EB] text-white hover:bg-[#1D4ED8] border border-transparent shadow-xs',
      secondary:
        'bg-[#101F35] text-white hover:bg-[#1A2E4C] border border-transparent shadow-xs',
      outline:
        'bg-white text-[#172B4D] border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
      ghost:
        'bg-transparent text-[#64748B] hover:text-[#172B4D] hover:bg-slate-100 border border-transparent',
      danger:
        'bg-[#DC2626] text-white hover:bg-[#B91C1C] border border-transparent',
      success:
        'bg-[#16A34A] text-white hover:bg-[#15803D] border border-transparent',
    };

    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'h-9 px-3 text-xs font-medium rounded-md',
      md: 'h-10 px-4 text-sm font-medium rounded-lg',
      lg: 'h-11 px-5 text-sm font-semibold rounded-lg',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export function SurfaceCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200/90 rounded-xl',
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172B4D] text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[#64748B] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export type SemanticTone = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';

export function inferStatusTone(status: string): SemanticTone {
  const s = status.toLowerCase();
  if (
    s.includes('paid') && !s.includes('unpaid') && !s.includes('partially') ||
    s.includes('approved') && !s.includes('pending') && !s.includes('unapproved') ||
    s.includes('matched') && !s.includes('unmatched') ||
    s.includes('success') ||
    s.includes('confirmed') ||
    s.includes('filed') ||
    s.includes('verified') && !s.includes('unverified') ||
    s.includes('active') ||
    s.includes('locked') ||
    s.includes('completed')
  ) {
    return 'success';
  }
  if (
    s.includes('fail') ||
    s.includes('reject') ||
    s.includes('overdue') ||
    s.includes('disput') ||
    s.includes('exceeded') ||
    s.includes('high') ||
    s.includes('error') ||
    s.includes('negative') ||
    s.includes('duplicate')
  ) {
    return 'danger';
  }
  if (
    s.includes('pending') ||
    s.includes('awaiting') ||
    s.includes('review') ||
    s.includes('warning') ||
    s.includes('partial') ||
    s.includes('exception') ||
    s.includes('verification required') ||
    s.includes('discrepancy') ||
    s.includes('unmatched') ||
    s.includes('unverified') ||
    s.includes('on hold') ||
    s.includes('clarification') ||
    s.includes('escalated')
  ) {
    return 'warning';
  }
  if (
    s.includes('processing') ||
    s.includes('ready') ||
    s.includes('disbursed') ||
    s.includes('submitted') ||
    s.includes('revised')
  ) {
    return 'info';
  }
  if (s.includes('locked') || s.includes('frozen')) {
    return 'purple';
  }
  return 'neutral';
}

export function StatusTag({
  status,
  tone,
  className,
}: {
  status: string;
  tone?: SemanticTone;
  className?: string;
}) {
  const resolved = tone || inferStatusTone(status);

  const styles: Record<SemanticTone, string> = {
    success: 'bg-emerald-50 text-[#15803D] border-emerald-200/80',
    warning: 'bg-amber-50 text-[#B45309] border-amber-200/80',
    danger: 'bg-red-50 text-[#B91C1C] border-red-200/80',
    info: 'bg-blue-50 text-[#1D4ED8] border-blue-200/80',
    purple: 'bg-violet-50 text-[#6D28D9] border-violet-200/80',
    neutral: 'bg-slate-100 text-[#475569] border-slate-200',
  };

  const Icon =
    resolved === 'success'
      ? status.toLowerCase().includes('locked')
        ? Lock
        : CheckCircle2
      : resolved === 'danger'
      ? XCircle
      : resolved === 'warning'
      ? AlertCircle
      : resolved === 'purple'
      ? FileWarning
      : resolved === 'info'
      ? Clock
      : Info;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border whitespace-nowrap shrink-0',
        styles[resolved],
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}

export function KpiStatCard({
  label,
  value,
  subtext,
  tone = 'neutral',
  onClick,
}: {
  label: string;
  value: string;
  subtext?: string;
  tone?: SemanticTone;
  onClick?: () => void;
}) {
  const accentText: Record<SemanticTone, string> = {
    neutral: 'text-[#172B4D]',
    success: 'text-[#16A34A]',
    warning: 'text-[#D97706]',
    danger: 'text-[#DC2626]',
    info: 'text-[#2563EB]',
    purple: 'text-[#7C3AED]',
  };

  const content = (
    <div className="p-4 flex flex-col justify-between h-full">
      <span className="text-xs font-medium text-[#64748B] truncate">{label}</span>
      <div className={cn('mt-2 text-xl font-bold tracking-tight font-mono-num tabular-nums', accentText[tone])}>
        {value}
      </div>
      {subtext && (
        <span className="mt-1.5 text-xs text-[#64748B] truncate">{subtext}</span>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left bg-white border border-slate-200/90 rounded-xl hover:border-[#2563EB]/50 hover:bg-slate-50/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
      >
        {content}
      </button>
    );
  }

  return <SurfaceCard>{content}</SurfaceCard>;
}

export function InputField({
  label,
  className,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
}) {
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-medium text-[#172B4D] mb-1.5">
          {label}
        </span>
      )}
      <input
        className={cn(
          'w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg text-[#172B4D] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB] transition-colors',
          error && 'border-[#DC2626] focus:ring-[#DC2626]/20 focus:border-[#DC2626]',
          className
        )}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-[#DC2626]">{error}</span>}
    </label>
  );
}

export function SelectField({
  label,
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
}) {
  return (
    <label className="block">
      {label && (
        <span className="block text-xs font-medium text-[#172B4D] mb-1.5">
          {label}
        </span>
      )}
      <select
        className={cn(
          'w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/25 focus:border-[#2563EB] transition-colors',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Info,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#64748B] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-[#172B4D]">{title}</h3>
      <p className="mt-1 text-xs text-[#64748B] max-w-md">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 border border-slate-200/70 rounded-lg">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer',
              active
                ? 'bg-white text-[#172B4D] shadow-xs'
                : 'text-[#64748B] hover:text-[#172B4D]'
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span className="ml-1.5 font-mono-num tabular-nums text-[11px] text-[#64748B]">
                ({tab.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
