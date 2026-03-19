/**
 * Premium Card Component
 */

import { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, selected, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-surface-900/50 border rounded-2xl p-6 backdrop-blur-sm transition-all duration-300',
        hover && 'cursor-pointer hover:bg-surface-800/60 hover:border-surface-600 hover:shadow-xl hover:shadow-black/20',
        selected
          ? 'border-freemen-500/50 bg-freemen-500/10 ring-2 ring-freemen-500/20'
          : 'border-surface-800',
        className
      )}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  badge?: ReactNode;
}

export function CardHeader({ icon, title, description, badge }: CardHeaderProps) {
  return (
    <div className="flex items-start gap-4 mb-4">
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-freemen-500/20 to-freemen-600/20 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white truncate">{title}</h3>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-surface-400 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

export interface SelectableCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function SelectableCard({
  icon,
  title,
  description,
  selected,
  disabled,
  onClick,
}: SelectableCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'w-full text-left p-5 rounded-xl border-2 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-freemen-500/50 focus:ring-offset-2 focus:ring-offset-surface-950',
        disabled && 'opacity-50 cursor-not-allowed',
        selected
          ? 'bg-freemen-500/15 border-freemen-500 shadow-lg shadow-freemen-500/10'
          : 'bg-surface-900/50 border-surface-700 hover:border-surface-500 hover:bg-surface-800/50'
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={clsx(
            'w-14 h-14 rounded-xl flex items-center justify-center transition-colors',
            selected
              ? 'bg-freemen-500/20 text-freemen-400'
              : 'bg-surface-800 text-surface-400'
          )}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h4 className={clsx(
            'font-semibold transition-colors',
            selected ? 'text-white' : 'text-surface-200'
          )}>
            {title}
          </h4>
          <p className="text-sm text-surface-400 mt-0.5">{description}</p>
        </div>
        <div
          className={clsx(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
            selected
              ? 'border-freemen-500 bg-freemen-500'
              : 'border-surface-600'
          )}
        >
          {selected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
              <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}
