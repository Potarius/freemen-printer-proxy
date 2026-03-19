/**
 * Pi Setup - Introduction Step
 */

import { Cpu, Wifi, HardDrive, Terminal, Shield, Zap } from 'lucide-react';
import { Button } from '../../ui/Button';

interface PiIntroStepProps {
  onNext: () => void;
}

export function PiIntroStep({ onNext }: PiIntroStepProps) {
  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500/20 to-red-500/20 flex items-center justify-center mx-auto mb-6">
          <Cpu className="w-10 h-10 text-pink-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">
          Raspberry Pi Headless Setup
        </h1>
        <p className="text-lg text-surface-400 max-w-xl mx-auto">
          Configure your Raspberry Pi for Freemen Printer Proxy without 
          connecting a monitor or keyboard.
        </p>
      </div>

      {/* What we'll do */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-4">
          What we'll configure
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureCard
            icon={<HardDrive className="w-5 h-5" />}
            title="MicroSD Card"
            description="Flash Raspberry Pi OS Lite 64-bit"
          />
          <FeatureCard
            icon={<Terminal className="w-5 h-5" />}
            title="SSH Access"
            description="Enable remote terminal access"
          />
          <FeatureCard
            icon={<Wifi className="w-5 h-5" />}
            title="WiFi Network"
            description="Connect automatically on boot"
          />
          <FeatureCard
            icon={<Shield className="w-5 h-5" />}
            title="Secure User"
            description="Create your own admin account"
          />
        </div>
      </div>

      {/* Requirements */}
      <div className="p-6 rounded-2xl bg-surface-900/50 border border-surface-800 mb-10">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          What you'll need
        </h2>
        <ul className="space-y-3">
          <RequirementItem text="Raspberry Pi 4 or 5 (recommended)" />
          <RequirementItem text="MicroSD card (16GB+ recommended)" />
          <RequirementItem text="Raspberry Pi Imager installed on this computer" />
          <RequirementItem text="Your WiFi network name and password" />
          <RequirementItem text="5-10 minutes of your time" />
        </ul>
      </div>

      {/* Time estimate */}
      <div className="text-center mb-8">
        <p className="text-sm text-surface-500">
          Estimated time: <span className="text-white font-medium">5-10 minutes</span>
        </p>
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <Button size="lg" onClick={onNext} rightIcon={<Zap className="w-4 h-4" />}>
          Start Setup
        </Button>
      </div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-surface-900/30 border border-surface-800 flex items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-freemen-500/10 flex items-center justify-center text-freemen-400 flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-sm text-surface-400">{description}</p>
      </div>
    </div>
  );
}

function RequirementItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-surface-300">
      <div className="w-1.5 h-1.5 rounded-full bg-freemen-500" />
      {text}
    </li>
  );
}
