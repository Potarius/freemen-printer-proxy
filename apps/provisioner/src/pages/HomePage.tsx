/**
 * Home Page
 * Dashboard with quick actions and recent activity
 */

import { useNavigate } from 'react-router-dom';
import { Zap, Server, Globe, ArrowRight, Printer } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-freemen-500 to-freemen-700 mb-6">
          <Printer className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Freemen Provisioner
        </h1>
        <p className="text-lg text-surface-400 max-w-xl mx-auto">
          Provision and configure your Freemen Printer Proxy devices with Cloudflare Tunnel in minutes.
        </p>
      </div>

      {/* Quick Action */}
      <div className="card-hover cursor-pointer mb-8 group" onClick={() => navigate('/wizard')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-freemen-600/20 flex items-center justify-center">
              <Zap className="w-7 h-7 text-freemen-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Start Provisioning</h2>
              <p className="text-surface-400">Configure a new device with Cloudflare Tunnel</p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-surface-500 group-hover:text-freemen-400 group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <FeatureCard
          icon={Server}
          title="Multi-Platform"
          description="Support for Raspberry Pi, Ubuntu, and other Linux systems"
        />
        <FeatureCard
          icon={Globe}
          title="Cloudflare Tunnel"
          description="Secure remote access without port forwarding"
        />
        <FeatureCard
          icon={Zap}
          title="Quick Setup"
          description="Automated configuration in under 5 minutes"
        />
      </div>

      {/* Info Section */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">How it works</h3>
        <ol className="space-y-3 text-surface-300">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-freemen-600/20 text-freemen-400 text-sm font-medium flex items-center justify-center">1</span>
            <span>Connect with your Cloudflare API token</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-freemen-600/20 text-freemen-400 text-sm font-medium flex items-center justify-center">2</span>
            <span>Select your domain and configure the hostname</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-freemen-600/20 text-freemen-400 text-sm font-medium flex items-center justify-center">3</span>
            <span>Create a Cloudflare Tunnel automatically</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-freemen-600/20 text-freemen-400 text-sm font-medium flex items-center justify-center">4</span>
            <span>Download the configuration package for your device</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="card">
      <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-surface-400" />
      </div>
      <h3 className="font-medium text-white mb-1">{title}</h3>
      <p className="text-sm text-surface-400">{description}</p>
    </div>
  );
}
