/**
 * Step 8: Provisioning in Progress
 */

import { Loader2, CheckCircle, AlertCircle, Cloud, Globe, FileCode } from 'lucide-react';
import { clsx } from 'clsx';

type ProvisionStatus = 'pending' | 'running' | 'success' | 'error';

interface ProvisionTask {
  id: string;
  label: string;
  status: ProvisionStatus;
  message?: string;
}

interface ProvisionStepProps {
  tasks: ProvisionTask[];
  currentTask: string | null;
  error?: string;
}

export function ProvisionStep({ tasks, currentTask, error }: ProvisionStepProps) {
  const completedCount = tasks.filter(t => t.status === 'success').length;
  const progress = (completedCount / tasks.length) * 100;

  return (
    <div className="animate-fade-in max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-freemen-500/20 to-freemen-600/20 flex items-center justify-center mx-auto mb-6 relative">
          {error ? (
            <AlertCircle className="w-10 h-10 text-red-400" />
          ) : (
            <>
              <Cloud className="w-10 h-10 text-freemen-400" />
              {currentTask && (
                <div className="absolute inset-0 rounded-3xl border-2 border-freemen-500/50 animate-pulse" />
              )}
            </>
          )}
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {error ? 'Provisioning Failed' : currentTask ? 'Provisioning...' : 'Ready to Provision'}
        </h2>
        <p className="text-surface-400">
          {error ? 'An error occurred during provisioning' : 'Setting up your Cloudflare Tunnel and configuration'}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-surface-400">Progress</span>
          <span className="text-surface-300 font-medium">{completedCount} / {tasks.length}</span>
        </div>
        <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-500',
              error ? 'bg-red-500' : 'bg-gradient-to-r from-freemen-600 to-freemen-400'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} isCurrent={task.id === currentTask} />
        ))}
      </div>
    </div>
  );
}

function TaskItem({ task }: { task: ProvisionTask; isCurrent: boolean }) {
  const getIcon = () => {
    switch (task.status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-freemen-400 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-surface-600" />;
    }
  };

  const getTaskIcon = () => {
    if (task.id.includes('tunnel')) return <Cloud className="w-4 h-4" />;
    if (task.id.includes('dns')) return <Globe className="w-4 h-4" />;
    return <FileCode className="w-4 h-4" />;
  };

  return (
    <div
      className={clsx(
        'flex items-center gap-4 p-4 rounded-xl border transition-all duration-300',
        task.status === 'success' && 'bg-green-500/5 border-green-500/20',
        task.status === 'error' && 'bg-red-500/5 border-red-500/20',
        task.status === 'running' && 'bg-freemen-500/10 border-freemen-500/30 shadow-lg shadow-freemen-500/5',
        task.status === 'pending' && 'bg-surface-900/30 border-surface-800 opacity-60'
      )}
    >
      <div className={clsx(
        'w-10 h-10 rounded-lg flex items-center justify-center',
        task.status === 'success' && 'bg-green-500/20 text-green-400',
        task.status === 'error' && 'bg-red-500/20 text-red-400',
        task.status === 'running' && 'bg-freemen-500/20 text-freemen-400',
        task.status === 'pending' && 'bg-surface-800 text-surface-500'
      )}>
        {getTaskIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={clsx(
          'font-medium',
          task.status === 'pending' ? 'text-surface-400' : 'text-white'
        )}>
          {task.label}
        </p>
        {task.message && (
          <p className="text-xs text-surface-500 mt-0.5 truncate">{task.message}</p>
        )}
      </div>
      {getIcon()}
    </div>
  );
}

// Default tasks for provisioning
export const defaultProvisionTasks: ProvisionTask[] = [
  { id: 'tunnel-create', label: 'Creating Cloudflare Tunnel', status: 'pending' },
  { id: 'tunnel-config', label: 'Configuring tunnel ingress', status: 'pending' },
  { id: 'dns-record', label: 'Creating DNS record', status: 'pending' },
  { id: 'config-generate', label: 'Generating configuration files', status: 'pending' },
  { id: 'package-create', label: 'Creating deployment package', status: 'pending' },
];
