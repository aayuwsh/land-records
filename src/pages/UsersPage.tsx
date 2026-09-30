import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import { ROLE_LABELS } from '@/context/AuthContext';
import { Users as UsersIcon, Shield, Activity } from 'lucide-react';

export function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
    setUsers((data || []) as Profile[]);
    setLoading(false);
  }

  const roleColors: Record<string, string> = {
    admin: '#b54545',
    operator: '#4a6fa5',
    verification_officer: '#3d7068',
    gis_officer: '#c47830',
    senior_officer: '#6b7280',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in">
      <div>
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase mb-2">
          User & Role Management
        </p>
        <h1 className="font-serif text-4xl font-light text-[#1c1c1c]">Users</h1>
      </div>

      {/* Role legend */}
      <div className="border border-[#e5e4de] p-4">
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
          <Shield size={12} /> Role-Based Access Control
        </p>
        <div className="grid sm:grid-cols-5 gap-3">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <div key={role} className="border border-[#e5e4de] p-3">
              <span className="w-2 h-2 inline-block mr-2" style={{ backgroundColor: roleColors[role] }} />
              <span className="text-xs text-[#1c1c1c]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="border border-[#e5e4de] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e4de] bg-[#f7f6f2]/50">
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Name</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Email</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Role</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Department</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Status</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e4de]">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-[#b4b4b4]">Loading users...</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-white/30 editorial-ease">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#3d7068] flex items-center justify-center text-[#f7f6f2] font-serif text-sm">
                        {user.full_name.charAt(0)}
                      </div>
                      <span className="text-sm text-[#1c1c1c]">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs mono-data text-[#6b7280]">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] mono-data tracking-[0.1em] uppercase" style={{ color: roleColors[user.role] }}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#6b7280]">{user.department || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] mono-data tracking-[0.1em] uppercase" style={{
                      color: user.is_active ? '#3d7068' : '#b54545'
                    }}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[10px] mono-data text-[#b4b4b4]">
                    {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border border-[#e5e4de] p-4 bg-[#f7f6f2]/50">
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">
          Prototype — User creation and role assignment available in production build with admin authorization.
        </p>
      </div>
    </div>
  );
}
