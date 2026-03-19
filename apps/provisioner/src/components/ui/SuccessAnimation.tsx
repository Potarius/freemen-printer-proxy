/**
 * Premium Success Animation Component
 * Animated checkmark with celebratory effects
 */

import { clsx } from 'clsx';

interface SuccessAnimationProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  title?: string;
  subtitle?: string;
  showConfetti?: boolean;
}

export function SuccessAnimation({
  size = 'lg',
  className,
  title,
  subtitle,
  showConfetti = true,
}: SuccessAnimationProps) {
  const sizes = {
    sm: { container: 'w-16 h-16', icon: 'w-8 h-8', ring: 'w-20 h-20' },
    md: { container: 'w-20 h-20', icon: 'w-10 h-10', ring: 'w-24 h-24' },
    lg: { container: 'w-24 h-24', icon: 'w-12 h-12', ring: 'w-28 h-28' },
    xl: { container: 'w-32 h-32', icon: 'w-16 h-16', ring: 'w-36 h-36' },
  };

  return (
    <div className={clsx('flex flex-col items-center', className)}>
      {/* Animated container */}
      <div className="relative">
        {/* Outer pulsing ring */}
        <div
          className={clsx(
            'absolute inset-0 rounded-full bg-emerald-500/20 animate-ping',
            sizes[size].ring
          )}
          style={{ 
            animationDuration: '1.5s',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Success circle */}
        <div
          className={clsx(
            'relative rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center animate-scale-in-bounce shadow-2xl',
            sizes[size].container
          )}
          style={{ boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)' }}
        >
          {/* Checkmark SVG */}
          <svg
            className={clsx('text-white', sizes[size].icon)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
              className="animate-success-check"
              style={{
                strokeDasharray: 100,
                strokeDashoffset: 100,
                animation: 'successCheck 0.5s ease-out 0.3s forwards',
              }}
            />
          </svg>
        </div>

        {/* Confetti particles */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899'][i % 4],
                  left: '50%',
                  top: '50%',
                  animation: `confetti-${i % 4} 0.6s ease-out ${0.1 * i}s forwards`,
                  opacity: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Title and subtitle */}
      {(title || subtitle) && (
        <div className="text-center mt-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          {title && (
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          )}
          {subtitle && (
            <p className="text-surface-400">{subtitle}</p>
          )}
        </div>
      )}

      {/* Confetti keyframes */}
      <style>{`
        @keyframes confetti-0 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-80px, -60px) scale(1); opacity: 0; }
        }
        @keyframes confetti-1 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(80px, -50px) scale(1); opacity: 0; }
        }
        @keyframes confetti-2 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-60px, 70px) scale(1); opacity: 0; }
        }
        @keyframes confetti-3 {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(70px, 60px) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

interface SuccessBannerProps {
  title: string;
  message?: string;
  className?: string;
  onDismiss?: () => void;
}

export function SuccessBanner({ title, message, className, onDismiss }: SuccessBannerProps) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-2xl p-6',
        'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10',
        'border border-emerald-500/20',
        'animate-fade-in-up',
        className
      )}
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
          {message && <p className="text-emerald-300/80">{message}</p>}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-2 text-surface-400 hover:text-white transition-colors rounded-lg hover:bg-surface-800/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
