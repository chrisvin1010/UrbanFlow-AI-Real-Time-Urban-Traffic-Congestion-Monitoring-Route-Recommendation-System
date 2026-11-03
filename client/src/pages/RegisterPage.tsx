import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, CardContent } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Layers, Lock, Mail, User, ArrowLeft } from 'lucide-react';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin, onSuccess }) => {
  const { register } = useAuth();
  const { success, error: toastError } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name || !email || !password) {
      setFormError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must contain at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password, role);
      success('Account Created', 'Registration successful! Welcome to UrbanFlow AI.');
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create account. Please check your details.';
      setFormError(msg);
      toastError('Registration Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-cyan-400 text-navy-950 shadow-glow-cyan mb-4">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            UrbanFlow <span className="text-cyan-400">AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            Create an Operator or Commuter Account
          </p>
        </div>

        <Card className="border-navy-700/80 bg-navy-850/90 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-100">Create New Account</h2>
              <p className="text-xs text-slate-400 mt-1">Join the intelligent traffic management platform</p>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="e.g. Elena Rostova"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="elena@city.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label="Password (min 6 characters)"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
              />

              <Select
                label="Account Role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                options={[
                  { value: 'user', label: 'Commuter / Driver (Standard User)' },
                  { value: 'admin', label: 'Traffic Operations Manager (Admin)' },
                ]}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Register Account
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400 pt-5 border-t border-navy-750">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 ml-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back to Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
