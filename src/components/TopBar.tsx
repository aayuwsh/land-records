import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { Menu, Bell, LogOut, ChevronRight, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/documents': 'Documents',
  '/documents/upload': 'Upload Documents',
  '/processing': 'Processing Pipeline',
  '/records': 'Land Records',
  '/verification': 'Verification Center',
  '/maps': 'GIS Maps',
  '/search': 'Search Records',
  '/analytics': 'Analytics',
  '/reports': 'Reports',
  '/users': 'User Management',
  '/audit': 'Audit Trail',
  '/settings': 'System Settings',
};

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    setNotifications((data || []) as Notification[]);
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const breadcrumbs = (() => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    const crumbs: { label: string; to: string }[] = [];
    let acc = '';
    for (const part of parts) {
      acc += '/' + part;
      const label = ROUTE_LABELS[acc] || part.charAt(0).toUpperCase() + part.slice(1);
      crumbs.push({ label, to: acc });
    }
    return crumbs;
  })();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  }

  return (
    <header
      className={`sticky top-0 z-20 transition-all duration-500 editorial-ease ${
        scrolled
          ? 'bg-[#f7f6f2]/80 backdrop-blur-md border-b border-[#e5e4de]'
          : 'bg-[#f7f6f2] border-b border-[#e5e4de]'
      }`}
    >
      <div className="flex items-center justify-between px-4 lg:px-6 h-14">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={onMenuClick} className="lg:hidden text-[#1c1c1c]">
            <Menu size={18} />
          </button>
          <nav className="hidden sm:flex items-center gap-1 text-xs">
            {breadcrumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={12} className="text-[#b4b4b4]" />}
                <NavLink
                  to={c.to}
                  className={`editorial-ease ${
                    i === breadcrumbs.length - 1
                      ? 'text-[#1c1c1c] font-medium'
                      : 'text-[#b4b4b4] hover:text-[#1c1c1c]'
                  }`}
                >
                  {c.label}
                </NavLink>
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <div className="flex items-center border border-[#e5e4de] bg-white/50 px-3 py-1.5">
              <Search size={13} className="text-[#b4b4b4]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search records..."
                className="ml-2 bg-transparent text-sm outline-none w-40 placeholder:text-[#b4b4b4] placeholder:text-xs"
              />
            </div>
          </form>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-1.5 text-[#6b7280] hover:text-[#1c1c1c] editorial-ease"
            >
              <Bell size={16} strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#b54545] text-[#f7f6f2] text-[8px] flex items-center justify-center font-mono">
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[#f7f6f2] border border-[#e5e4de] shadow-lg fade-in-up z-50 max-h-96 overflow-y-auto">
                <div className="px-4 py-3 border-b border-[#e5e4de]">
                  <p className="text-[10px] mono-data tracking-[0.2em] uppercase text-[#b4b4b4]">Notifications</p>
                </div>
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-[#b4b4b4] text-center">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="px-4 py-3 border-b border-[#e5e4de] last:border-0">
                      <div className="flex items-start gap-2">
                        <span
                          className="w-1.5 h-1.5 mt-1.5 flex-shrink-0"
                          style={{
                            backgroundColor:
                              n.severity === 'error' ? '#b54545' :
                              n.severity === 'warning' ? '#c47830' :
                              n.severity === 'success' ? '#3d7068' : '#4a6fa5',
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#1c1c1c] font-medium">{n.title}</p>
                          <p className="text-xs text-[#6b7280] mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {profile && (
            <button
              onClick={() => {
                signOut();
                navigate('/login');
              }}
              className="p-1.5 text-[#6b7280] hover:text-[#b54545] editorial-ease"
              title="Sign out"
            >
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
      <DemoDataBanner />
    </header>
  );
}

function DemoDataBanner() {
  return (
    <div className="bg-[#1c1c1c] text-[#f7f6f2] px-4 lg:px-6 py-1 flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-[#3d7068] pulse-dot" />
      <span className="text-[9px] mono-data tracking-[0.25em] uppercase">
        Demo Data — Synthetic records for prototype demonstration
      </span>
    </div>
  );
}
