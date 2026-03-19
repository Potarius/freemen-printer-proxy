/**
 * Step 4: Zone/Domain Selection
 */

import { Globe, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { clsx } from 'clsx';
import { CloudflareZone } from '../../../types';

interface ZoneStepProps {
  zones: CloudflareZone[];
  selectedZone: CloudflareZone | null;
  onSelect: (zone: CloudflareZone) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function ZoneStep({ zones, selectedZone, onSelect, onRefresh, isLoading }: ZoneStepProps) {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-freemen-500/20 flex items-center justify-center mx-auto mb-4">
          <Globe className="w-8 h-8 text-freemen-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Select Domain</h2>
        <p className="text-surface-400">Choose the domain for your printer proxy tunnel</p>
      </div>

      <div className="flex justify-end mb-4">
        <Button variant="ghost" size="sm" onClick={onRefresh} isLoading={isLoading}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="space-y-3 max-w-xl mx-auto">
        {zones.length === 0 && !isLoading ? (
          <div className="text-center py-12 text-surface-400">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No domains found in your Cloudflare account</p>
          </div>
        ) : (
          zones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => onSelect(zone)}
              className={clsx(
                'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-freemen-500/50',
                selectedZone?.id === zone.id
                  ? 'bg-freemen-500/15 border-freemen-500'
                  : 'bg-surface-900/50 border-surface-700 hover:border-surface-500'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    selectedZone?.id === zone.id ? 'bg-freemen-500/20' : 'bg-surface-800'
                  )}>
                    <Globe className={clsx(
                      'w-5 h-5',
                      selectedZone?.id === zone.id ? 'text-freemen-400' : 'text-surface-400'
                    )} />
                  </div>
                  <div>
                    <p className={clsx(
                      'font-semibold',
                      selectedZone?.id === zone.id ? 'text-white' : 'text-surface-200'
                    )}>
                      {zone.name}
                    </p>
                    <p className="text-xs text-surface-500">ID: {zone.id.slice(0, 12)}...</p>
                  </div>
                </div>
                <Badge variant={zone.status === 'active' ? 'success' : 'warning'} dot>
                  {zone.status}
                </Badge>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
