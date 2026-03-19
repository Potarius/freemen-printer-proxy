/**
 * Ubuntu Deploy - Mode Selection Step
 */

import { Rocket, RefreshCw, Settings, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import type { DeploymentMode } from '../../../types';
import { DEPLOYMENT_MODE_INFO } from '../../../services/ubuntu-deployment-service';

interface DeployModeStepProps {
  selectedMode: DeploymentMode | null;
  onSelectMode: (mode: DeploymentMode) => void;
  onNext: () => void;
}

export function DeployModeStep({ selectedMode, onSelectMode, onNext }: DeployModeStepProps) {
  const modes: { mode: DeploymentMode; icon: React.ReactNode; color: string }[] = [
    {
      mode: 'fresh',
      icon: <Rocket className="w-8 h-8" />,
      color: 'from-green-500/20 to-emerald-500/20',
    },
    {
      mode: 'update',
      icon: <RefreshCw className="w-8 h-8" />,
      color: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      mode: 'reprovision',
      icon: <Settings className="w-8 h-8" />,
      color: 'from-purple-500/20 to-pink-500/20',
    },
  ];

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold text-white mb-3">
          What would you like to do?
        </h2>
        <p className="text-surface-400">
          Select the type of deployment for your Ubuntu/Linux machine
        </p>
      </div>

      {/* Mode cards */}
      <div className="space-y-4 mb-10">
        {modes.map(({ mode, icon, color }) => {
          const info = DEPLOYMENT_MODE_INFO[mode];
          const isSelected = selectedMode === mode;

          return (
            <button
              key={mode}
              onClick={() => onSelectMode(mode)}
              className={`w-full p-6 rounded-2xl border-2 transition-all text-left flex items-start gap-5 ${
                isSelected
                  ? 'bg-freemen-500/10 border-freemen-500'
                  : 'bg-surface-900/30 border-surface-800 hover:border-surface-700 hover:bg-surface-900/50'
              }`}
            >
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'text-freemen-400' : 'text-surface-400'
              }`}>
                {icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{info.icon}</span>
                  <h3 className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-surface-200'}`}>
                    {info.title}
                  </h3>
                </div>
                <p className="text-surface-400">{info.description}</p>
                
                {/* Mode-specific details */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {mode === 'fresh' && (
                    <>
                      <Badge>Installs Docker</Badge>
                      <Badge>Clones Repo</Badge>
                      <Badge>Full Setup</Badge>
                    </>
                  )}
                  {mode === 'update' && (
                    <>
                      <Badge>Pulls Latest</Badge>
                      <Badge>Rebuilds</Badge>
                      <Badge>Keeps Config</Badge>
                    </>
                  )}
                  {mode === 'reprovision' && (
                    <>
                      <Badge>Updates Config</Badge>
                      <Badge>Restarts Service</Badge>
                      <Badge>Quick</Badge>
                    </>
                  )}
                </div>
              </div>
              
              {/* Selection indicator */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected
                  ? 'border-freemen-500 bg-freemen-500'
                  : 'border-surface-600'
              }`}>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Info box */}
      <div className="p-4 rounded-xl bg-surface-900/30 border border-surface-800 mb-8">
        <h4 className="font-medium text-surface-300 mb-2">💡 Not sure which to choose?</h4>
        <ul className="text-sm text-surface-400 space-y-1">
          <li>• <strong>Fresh Install</strong> — First time setup on a new machine</li>
          <li>• <strong>Update</strong> — Keep your installation up to date with latest features</li>
          <li>• <strong>Reprovision</strong> — Change settings like API key, tunnel token, or printer</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!selectedMode}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-1 text-xs rounded-full bg-surface-800 text-surface-400">
      {children}
    </span>
  );
}
