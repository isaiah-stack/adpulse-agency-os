import { useState } from 'react';
import { TrendingUp, Lock, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

const inputCls =
  'w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-[#0F172A]';
const primaryBtn =
  'w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-medium transition cursor-pointer';

function AuthShell({ children, footer }) {
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
        {children}
        {footer && <p className="mt-4 text-center text-[11px] text-[#64748B]">{footer}</p>}
      </div>
    </div>
  );
}

function Notice({ tone, children }) {
  const alert = tone === 'alert';
  const Icon = alert ? AlertTriangle : CheckCircle2;
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
        alert ? 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]' : 'border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]'
      }`}
    >
      <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={1.75} />
      <span>{children}</span>
    </div>
  );
}

export default function LoginScreen() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setInfo('');
  };

  const handleSignIn = async (e) => {
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

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin
    });
    setSubmitting(false);
    if (authError) setError(authError.message || 'Could not send the reset email.');
    // Same message whether or not the account exists, so emails can't be probed.
    else setInfo('If an account exists for that email, a reset link is on its way.');
  };

  const emailField = (
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
  );

  if (mode === 'forgot') {
    return (
      <AuthShell footer="The link signs you in and asks you to choose a new password.">
        <form onSubmit={handleForgot} className="card-surface rounded-xl p-6 space-y-4">
          <div>
            <h1 className="text-base font-semibold text-[#0F172A]">Reset your password</h1>
            <p className="text-xs text-[#64748B] mt-1">We will email you a secure reset link.</p>
          </div>
          {emailField}
          {error && <Notice tone="alert">{error}</Notice>}
          {info && <Notice tone="healthy">{info}</Notice>}
          <button type="submit" disabled={submitting} className={primaryBtn}>
            {submitting ? 'Sending' : 'Send reset link'}
          </button>
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-[#475569] hover:text-[#0F172A] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            Back to sign in
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell footer="Access is provisioned per workspace by your agency.">
      <form onSubmit={handleSignIn} className="card-surface rounded-xl p-6 space-y-4">
        <div>
          <h1 className="text-base font-semibold text-[#0F172A]">Sign in</h1>
          <p className="text-xs text-[#64748B] mt-1">Use the credentials issued by your account manager.</p>
        </div>

        {emailField}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="block text-xs font-medium text-[#334155]">
              Password
            </label>
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="text-[11px] text-[#475569] hover:text-[#0F172A] underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
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

        {error && <Notice tone="alert">{error}</Notice>}

        <button type="submit" disabled={submitting} className={primaryBtn}>
          <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
          {submitting ? 'Signing in' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}

/** Shown after an invite or password-reset link: the user is signed in and picks a password. */
export function SetPasswordScreen({ variant = 'recovery', email, onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('The passwords do not match.');
    setSubmitting(true);
    const { error: authError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (authError) setError(authError.message || 'Could not update the password.');
    else onDone();
  };

  return (
    <AuthShell footer={email ? `Signed in as ${email}` : undefined}>
      <form onSubmit={handleSubmit} className="card-surface rounded-xl p-6 space-y-4">
        <div>
          <h1 className="text-base font-semibold text-[#0F172A]">
            {variant === 'invite' ? 'Welcome. Choose a password' : 'Choose a new password'}
          </h1>
          <p className="text-xs text-[#64748B] mt-1">At least 8 characters.</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="new-password" className="block text-xs font-medium text-[#334155]">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="block text-xs font-medium text-[#334155]">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
          />
        </div>
        {error && <Notice tone="alert">{error}</Notice>}
        <button type="submit" disabled={submitting} className={primaryBtn}>
          <Lock className="w-3.5 h-3.5" strokeWidth={1.75} />
          {submitting ? 'Saving' : 'Save password'}
        </button>
      </form>
    </AuthShell>
  );
}
