import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import AdminCommandCenter from './AdminCommandCenter';
import ClientPortal from './components/ClientPortal';
import LoginScreen from './components/LoginScreen';

function CenteredMessage({ children, onSignOut }) {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
      <div className="card-surface rounded-xl p-6 w-full max-w-md text-center space-y-4">
        <p className="text-sm text-[#334155]">{children}</p>
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-[#334155] cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}

/** Thin role router: local mode -> admin; otherwise session + profile decide the surface. */
export default function App() {
  if (!isSupabaseConfigured) return <AdminCommandCenter />;
  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const [session, setSession] = useState(undefined); // undefined = resolving
  // Profile lookup result, tagged with the user it belongs to so stale results are ignored.
  const [profileResult, setProfileResult] = useState({ userId: null, profile: null });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from('profiles')
      .select('id, email, full_name, role, workspace_id')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Profile lookup failed:', error);
        if (!cancelled) setProfileResult({ userId, profile: data ?? null });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const profileLoaded = profileResult.userId === userId;
  const profile = profileLoaded ? profileResult.profile : null;

  const signOut = () => supabase.auth.signOut();

  if (session === undefined) return <CenteredMessage>Checking session</CenteredMessage>;
  if (!session) return <LoginScreen />;
  if (!profileLoaded) {
    return <CenteredMessage>Loading your profile</CenteredMessage>;
  }
  if (!profile) {
    return (
      <CenteredMessage onSignOut={signOut}>
        No profile is provisioned for this account. Ask an administrator to apply supabase/schema.sql and
        assign your role.
      </CenteredMessage>
    );
  }

  if (profile.role === 'admin') {
    return <AdminCommandCenter key={profile.id} remote profile={profile} onSignOut={signOut} />;
  }
  return <ClientPortal key={profile.id} workspaceId={profile.workspace_id} onSignOut={signOut} />;
}
