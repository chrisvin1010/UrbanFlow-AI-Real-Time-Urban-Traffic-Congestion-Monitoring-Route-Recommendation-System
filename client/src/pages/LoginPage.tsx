import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Layers, Lock, Mail, Shield, User, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister, onSuccess }) => {
  const { login } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      success('Authentication Successful', 'Welcome to UrbanFlow AI Traffic Operations');
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setFormError(msg);
      toastError('Login Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setEmail('admin@urbanflow.ai');
      setPassword('Admin@123456');
    } else {
      setEmail('demo@urbanflow.ai');
      setPassword('User@123456');
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-cyan-400 text-navy-950 shadow-glow-cyan mb-4">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            UrbanFlow <span className="text-cyan-400">AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Real-Time Urban Traffic Congestion Monitoring & Smart Route Recommendation
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-navy-700/80 bg-navy-850/90 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-100">Sign in to Operations Console</h2>
              <p className="text-xs text-slate-400 mt-1">Enter your credentials to access live telemetry</p>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="operator@urbanflow.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>

            {/* Quick Demo Fill Buttons for Project Review */}
            <div className="mt-6 pt-5 border-t border-navy-750">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
                Evaluation Quick Fill
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin')}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition-all"
                >
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Admin User</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('user')}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-navy-800 hover:bg-navy-750 border border-navy-700 text-slate-300 text-xs font-medium transition-all"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Standard User</span>
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-400">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 ml-1"
              >
                Create Account <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
