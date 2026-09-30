import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Upload, Cog, FileCheck2,
  Map, Search, BarChart3, FileBarChart, Users, ScrollText,
  Settings, LandPlot, Stamp
} from 'lucide-react';
import { useAuth, ROLE_LABELS } from '@/context/AuthContext';
import type { UserRole } from '@/types';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/documents', label: 'Documents', icon: FileText, roles: ['admin', 'operator', 'data_entry_operator', 'verification_officer', 'senior_officer', 'registrar', 'land_record_officer'] },
  { to: '/documents/upload', label: 'Upload', icon: Upload, roles: ['admin', 'operator', 'data_entry_operator'] },
  { to: '/registrar-approval', label: 'Registrar Approval', icon: Stamp, roles: ['admin', 'registrar', 'senior_officer'] },
  { to: '/processing', label: 'Processing', icon: Cog, roles: ['admin', 'operator', 'senior_officer'] },
  { to: '/records', label: 'Land Records', icon: LandPlot },
  { to: '/verification', label: 'Verification', icon: FileCheck2, roles: ['admin', 'verification_officer', 'senior_officer', 'land_record_officer'] },
  { to: '/maps', label: 'GIS Maps', icon: Map, roles: ['admin', 'gis_officer', 'survey_officer', 'senior_officer', 'verification_officer', 'citizen'] },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'senior_officer', 'district_administrator', 'state_administrator', 'auditor'] },
  { to: '/reports', label: 'Reports', icon: FileBarChart, roles: ['admin', 'senior_officer', 'district_administrator', 'auditor'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['admin', 'super_admin'] },
  { to: '/audit', label: 'Audit Trail', icon: ScrollText, roles: ['admin', 'senior_officer', 'auditor'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'super_admin'] },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useAuth();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || (profile && item.roles.includes(profile.role)));

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#f7f6f2] border-r border-[#e5e4de] z-40 flex flex-col transition-transform duration-300 editorial-ease ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[#e5e4de] flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <div className="w-6 h-0.5 bg-[#3d7068]" />
            <div className="w-8 h-0.5 bg-[#1c1c1c]" />
          </div>
          <div>
            <h1 className="font-serif text-base font-light tracking-tight text-[#1c1c1c] leading-none">
              BHULEKH
            </h1>
            <p className="text-[8px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mt-0.5">
              Land Record System
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          <p className="px-5 mb-2 text-[9px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase">
            Navigation
          </p>
          <ul className="space-y-0.5 px-2">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to ||
                (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 text-sm editorial-ease border-l-2 ${
                      isActive
                        ? 'border-[#3d7068] text-[#1c1c1c] bg-[#eaf2f0]/50'
                        : 'border-transparent text-[#6b7280] hover:text-[#1c1c1c] hover:border-[#e5e4de]'
                    }`}
                  >
                    <Icon size={15} strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info */}
        {profile && (
          <div className="border-t border-[#e5e4de] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#3d7068] flex items-center justify-center text-[#f7f6f2] font-serif text-sm">
                {profile.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1c1c1c] truncate">{profile.full_name}</p>
                <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">
                  {ROLE_LABELS[profile.role]}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
