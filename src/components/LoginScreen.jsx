import { useState } from 'react';
import { TrendingUp, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    if (authError) setError(authError.message || 'Sign-in failed.');
    setSubmitting(false);
  };

  const inputCls =
    'w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-[#0F172A]';

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-md bg-[#0F172A] flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div className="leading-none">
            <div className="text-[16px] font-bold tracking-tight text-[#0F172A]">AdPulse</div>
            <div className="text-[9px] font-semibold tracking-[0.16em] text-[#64748B] mt-0.5 uppercase">
              Agency OS
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card-surface rounded-xl p-6 space-y-4">
          <div>
            <h1 className="text-base font-semibold text-[#0F172A]">Sign in</h1>
            <p className="text-xs text-[#64748B] mt-1">
              Use the credentials issued by your account manager.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-xs font-medium text-[#334155]">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="name@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-xs font-medium text-[#334155]">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs text-[#991B1B]">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={1.75} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-medium transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
            {submitting ? 'Signing in' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-[#64748B]">
          Access is provisioned per workspace. Contact your agency to reset credentials.
        </p>
      </div>
    </div>
  );
}
