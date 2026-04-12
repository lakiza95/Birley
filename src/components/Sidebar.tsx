import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Inbox, 
  CreditCard, 
  School, 
  LogOut,
  Building2,
  LifeBuoy,
  ShieldCheck
} from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../supabase';
import { getRoleTheme } from '../utils/theme';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserProfile;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user }) => {
  const getNavItems = () => {
    const commonItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'inbox', label: 'Inbox', icon: Inbox },
    ];

    if (user.role === 'admin') {
      return [
        ...commonItems,
        { id: 'institutions', label: 'Institutions', icon: Building2 },
        { id: 'verification', label: 'Verification', icon: ShieldCheck },
        { id: 'applications', label: 'Applications', icon: FileText },
        { id: 'payouts', label: 'Payouts', icon: CreditCard },
      ];
    }

    // Default: Partner
    const partnerItems = [
      ...commonItems,
      { id: 'students', label: 'My Students', icon: Users },
      { id: 'applications', label: 'Applications', icon: FileText },
      { id: 'payouts', label: 'Payouts', icon: CreditCard },
      { id: 'catalog', label: 'School Catalog', icon: School },
    ];

    if (user.role === 'partner' && user.status !== 'ACTIVE') {
      partnerItems.splice(1, 0, { id: 'verification', label: 'Verification', icon: ShieldCheck });
    }

    // Non-admin items
    const items = user.role === 'institution' ? [
      ...commonItems,
      { id: 'programs', label: 'Our Programs', icon: School },
      { id: 'applications', label: 'Received Apps', icon: FileText },
      { id: 'referrals', label: 'Referral Program', icon: Users },
      { id: 'payouts', label: 'Financials', icon: CreditCard },
    ] : partnerItems;

    return items;
  };

  const navItems = getNavItems();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const clean = (val: any) => (val === 'undefined' || val === 'null' || !val) ? '' : val;
  const firstName = clean(user.firstName || user.first_name);
  const lastName = clean(user.lastName || user.last_name);
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}` || user.email[0].toUpperCase();

  return (
    <aside className="w-64 bg-brand text-white flex flex-col h-screen fixed left-0 top-0 z-20">
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-brand rounded-sm transform rotate-45"></div>
        </div>
        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">Birley</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item: any) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-white/10 text-white font-medium shadow-sm' 
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-white' : 'text-white/70'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <button
          onClick={() => setActiveTab('help-center')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeTab === 'help-center' 
              ? 'bg-white/10 text-white font-medium shadow-sm' 
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <LifeBuoy size={20} className={activeTab === 'help-center' ? 'text-white' : 'text-white/70'} />
          <span>Help Center</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
