import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        (async () => {
          await loadProfile(newSession.user.id);
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Profile load error:', error);
    }
    setProfile(data as Profile | null);
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  operator: 'Digitization Operator',
  verification_officer: 'Verification Officer',
  gis_officer: 'GIS Officer',
  senior_officer: 'Senior Officer',
  super_admin: 'Super Admin',
  central_authority: 'Central Authority',
  state_administrator: 'State Administrator',
  district_administrator: 'District Administrator',
  tehsil_officer: 'Tehsil Officer',
  revenue_officer: 'Revenue Officer',
  registrar: 'Registrar',
  survey_officer: 'Survey Officer',
  land_record_officer: 'Land Record Officer',
  data_entry_operator: 'Data Entry Operator',
  auditor: 'Auditor',
  citizen: 'Citizen',
};

export const DEMO_ACCOUNTS = [
  { email: 'admin@landrecord.gov.in', role: 'admin' as UserRole, name: 'Arjun Sharma', dept: 'IT Department' },
  { email: 'registrar@landrecord.gov.in', role: 'registrar' as UserRole, name: 'Suresh Prasad', dept: 'Registration Department' },
  { email: 'operator@landrecord.gov.in', role: 'operator' as UserRole, name: 'Priya Gupta', dept: 'Revenue Department' },
  { email: 'dataentry@landrecord.gov.in', role: 'data_entry_operator' as UserRole, name: 'Kavita Reddy', dept: 'Revenue Department' },
  { email: 'verifier@landrecord.gov.in', role: 'verification_officer' as UserRole, name: 'Rajesh Kumar', dept: 'Revenue Department' },
  { email: 'gis@landrecord.gov.in', role: 'gis_officer' as UserRole, name: 'Anita Verma', dept: 'Survey & GIS Department' },
  { email: 'survey@landrecord.gov.in', role: 'survey_officer' as UserRole, name: 'Deepak Nair', dept: 'Survey & GIS Department' },
  { email: 'senior@landrecord.gov.in', role: 'senior_officer' as UserRole, name: 'Vikram Singh', dept: 'Revenue Department' },
  { email: 'districtadmin@landrecord.gov.in', role: 'district_administrator' as UserRole, name: 'Priya Desai', dept: 'District Administration' },
  { email: 'auditor@landrecord.gov.in', role: 'auditor' as UserRole, name: 'Meena Iyer', dept: 'Audit Department' },
  { email: 'citizen@landrecord.gov.in', role: 'citizen' as UserRole, name: 'Rahul Verma', dept: 'Public Access' },
];
