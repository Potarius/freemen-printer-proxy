/**
 * Premium Home Page
 * Dashboard with quick actions and guided flows
 */

import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Server, 
  Globe, 
  ArrowRight, 
  Printer,
  Cpu,
  Monitor,
  Sparkles,
  Shield,
  Clock,
} from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-900 via-surface-900 to-surface-800 border border-surface-800/50 p-8 md:p-12">
        {/* Background pattern */}
        <div className="absolute inset-0 pattern-dots opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-freemen-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-freemen-600/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-freemen-500 to-freemen-600 flex items-center justify-center shadow-2xl shadow-freemen-500/30 animate-float">
                <Printer className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Freemen Provisioner
            </h1>
            <p className="text-lg text-surface-400 max-w-lg leading-relaxed">
              Configure your Freemen Printer Proxy devices with Cloudflare Tunnel integration — secure, fast, and simple.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
              <span className="badge badge-success badge-pill">
                <Shield className="w-3 h-3" />
                Secure
              </span>
              <span className="badge badge-info badge-pill">
                <Clock className="w-3 h-3" />
                5 min setup
              </span>
              <span className="badge badge-neutral badge-pill">
                <Globe className="w-3 h-3" />
                Remote access
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-500 mb-4 px-1">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            icon={<Zap className="w-6 h-6" />}
            title="New Provision"
            description="Configure a device with Cloudflare Tunnel"
            color="freemen"
            onClick={() => navigate('/wizard')}
            primary
          />
          <QuickActionCard
            icon={<Cpu className="w-6 h-6" />}
            title="Raspberry Pi"
            description="Headless setup for Raspberry Pi"
            color="pink"
            onClick={() => navigate('/pi-setup')}
          />
          <QuickActionCard
            icon={<Monitor className="w-6 h-6" />}
            title="Ubuntu Deploy"
            description="Deploy to Ubuntu/Linux servers"
            color="orange"
            onClick={() => navigate('/ubuntu-deploy')}
          />
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-500 mb-4 px-1">
          Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            icon={Server}
            title="Multi-Platform"
            description="Raspberry Pi, Ubuntu, and other Linux systems"
            gradient="from-purple-500/20 to-indigo-500/20"
          />
          <FeatureCard
            icon={Globe}
            title="Cloudflare Tunnel"
            description="Secure remote access without port forwarding"
            gradient="from-orange-500/20 to-amber-500/20"
          />
          <FeatureCard
            icon={Shield}
            title="Enterprise Security"
            description="Zero-trust architecture with encrypted tunnels"
            gradient="from-emerald-500/20 to-teal-500/20"
          />
        </div>
      </div>

      {/* How it works */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-freemen-500/20 to-freemen-600/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-freemen-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">How it works</h3>
            <p className="text-sm text-surface-500">Four simple steps to get started</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: 1, title: 'Connect', desc: 'Enter your Cloudflare API token' },
            { step: 2, title: 'Configure', desc: 'Select domain and hostname' },
            { step: 3, title: 'Create', desc: 'Auto-generate Cloudflare Tunnel' },
            { step: 4, title: 'Deploy', desc: 'Download config for your device' },
          ].map((item, index) => (
            <div key={item.step} className="relative">
              {index < 3 && (
                <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-surface-700/50 to-transparent z-0" />
              )}
              <div className="relative z-10 flex flex-col items-center text-center p-4 rounded-xl hover:bg-surface-800/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-freemen-500/20 to-freemen-600/20 border border-freemen-500/20 flex items-center justify-center mb-3">
                  <span className="text-lg font-bold text-freemen-400">{item.step}</span>
                </div>
                <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                <p className="text-xs text-surface-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'freemen' | 'pink' | 'orange' | 'purple';
  onClick: () => void;
  primary?: boolean;
}

function QuickActionCard({ icon, title, description, color, onClick, primary }: QuickActionCardProps) {
  const colorStyles = {
    freemen: 'from-freemen-500/20 to-freemen-600/20 border-freemen-500/20 hover:border-freemen-500/40',
    pink: 'from-pink-500/20 to-rose-500/20 border-pink-500/20 hover:border-pink-500/40',
    orange: 'from-orange-500/20 to-amber-500/20 border-orange-500/20 hover:border-orange-500/40',
    purple: 'from-purple-500/20 to-indigo-500/20 border-purple-500/20 hover:border-purple-500/40',
  };

  const iconColors = {
    freemen: 'text-freemen-400 bg-freemen-500/20',
    pink: 'text-pink-400 bg-pink-500/20',
    orange: 'text-orange-400 bg-orange-500/20',
    purple: 'text-purple-400 bg-purple-500/20',
  };

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden text-left p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 ${
        primary 
          ? `bg-gradient-to-br ${colorStyles[color]} shadow-lg` 
          : `bg-surface-900/50 border-surface-800/50 hover:bg-surface-800/50`
      }`}
    >
      {primary && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      )}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColors[color]}`}>
            {icon}
          </div>
          <ArrowRight className="w-5 h-5 text-surface-600 group-hover:text-surface-400 group-hover:translate-x-1 transition-all" />
        </div>
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-surface-500">{description}</p>
      </div>
    </button>
  );
}

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}

function FeatureCard({ icon: Icon, title, description, gradient }: FeatureCardProps) {
  return (
    <div className="card group hover:border-surface-700/50 transition-all duration-300">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5 text-white/80" />
      </div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-surface-500 leading-relaxed">{description}</p>
    </div>
  );
}
