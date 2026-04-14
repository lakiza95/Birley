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
  const theme = getRoleTheme(user.role);
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
    <aside 
      className="w-64 flex flex-col h-screen fixed left-0 top-0 z-20 transition-colors duration-500"
      style={{ backgroundColor: theme.primaryDark }}
    >
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
          <div className="w-5 h-5 bg-white rounded-lg transform rotate-45 shadow-sm"></div>
        </div>
        <span className="text-2xl font-black tracking-tighter text-white">Birley</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item: any) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-white text-gray-900 font-bold shadow-xl shadow-black/10' 
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon 
                size={20} 
                className={`transition-colors duration-300 ${
                  isActive ? '' : 'group-hover:text-white'
                }`} 
                style={{ color: isActive ? theme.primary : undefined }}
              />
              <span className="text-sm tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/10">
        <button
          onClick={() => setActiveTab('help-center')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
            activeTab === 'help-center' 
              ? 'bg-white text-gray-900 font-bold shadow-xl shadow-black/10' 
              : 'text-white/60 hover:bg-white/10 hover:text-white'
          }`}
        >
          <LifeBuoy 
            size={20} 
            className={`transition-colors duration-300 ${
              activeTab === 'help-center' ? '' : 'group-hover:text-white'
            }`}
            style={{ color: activeTab === 'help-center' ? theme.primary : undefined }}
          />
          <span className="text-sm tracking-tight">Help Center</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
