/**
 * Premium Skeleton Loading Component
 * Provides elegant loading states for content
 */

import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseStyles = 'skeleton';
  
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  const style: React.CSSProperties = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  if (lines > 1) {
    return (
      <div className={clsx('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx(baseStyles, variantStyles[variant])}
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : style.width,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={clsx(baseStyles, variantStyles[variant], className)}
      style={style}
    />
  );
}

interface SkeletonCardProps {
  className?: string;
  hasIcon?: boolean;
  hasTitle?: boolean;
  hasDescription?: boolean;
  hasAction?: boolean;
}

export function SkeletonCard({
  className,
  hasIcon = true,
  hasTitle = true,
  hasDescription = true,
  hasAction = false,
}: SkeletonCardProps) {
  return (
    <div className={clsx('card animate-pulse', className)}>
      <div className="flex items-start gap-4">
        {hasIcon && (
          <Skeleton variant="rounded" width={48} height={48} />
        )}
        <div className="flex-1 space-y-3">
          {hasTitle && <Skeleton width="60%" height={20} />}
          {hasDescription && <Skeleton lines={2} />}
        </div>
        {hasAction && (
          <Skeleton variant="rounded" width={80} height={36} />
        )}
      </div>
    </div>
  );
}

interface SkeletonListProps {
  count?: number;
  className?: string;
}

export function SkeletonList({ count = 3, className }: SkeletonListProps) {
  return (
    <div className={clsx('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 rounded-xl bg-surface-900/30"
        >
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height={16} />
            <Skeleton width="60%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}
