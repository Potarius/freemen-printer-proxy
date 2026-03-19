/**
 * Step 1: Welcome / Introduction
 */

import { Printer, Shield, Zap, Globe } from 'lucide-react';
import { Button } from '../../ui/Button';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center text-center animate-fade-in">
      {/* Hero */}
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-freemen-500 to-freemen-700 flex items-center justify-center mb-8 shadow-2xl shadow-freemen-500/30">
        <Printer className="w-12 h-12 text-white" />
      </div>
      
      <h1 className="text-4xl font-bold text-white mb-4">
        Welcome to Freemen Provisioner
      </h1>
      
      <p className="text-lg text-surface-400 max-w-lg mb-12">
        Set up your Freemen Printer Proxy device with secure Cloudflare Tunnel access in just a few minutes.
      </p>

      {/* Features */}
      <div className="grid grid-cols-3 gap-6 mb-12 w-full max-w-2xl">
        <FeatureItem
          icon={<Shield className="w-6 h-6" />}
          title="Secure"
          description="End-to-end encrypted tunnel"
        />
        <FeatureItem
          icon={<Zap className="w-6 h-6" />}
          title="Fast Setup"
          description="Ready in under 5 minutes"
        />
        <FeatureItem
          icon={<Globe className="w-6 h-6" />}
          title="Remote Access"
          description="Access from anywhere"
        />
      </div>

      {/* CTA */}
      <Button size="lg" onClick={onNext} rightIcon={<span>→</span>}>
        Get Started
      </Button>

      <p className="text-sm text-surface-500 mt-6">
        You'll need a Cloudflare account and API token to continue
      </p>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-5 rounded-2xl bg-surface-900/50 border border-surface-800">
      <div className="w-12 h-12 rounded-xl bg-freemen-500/10 text-freemen-400 flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-surface-400">{description}</p>
    </div>
  );
}
