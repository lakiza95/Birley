import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { UserProfile } from '../types';
import { getRoleTheme } from '../utils/theme';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserProfile;
  onRefreshProfile?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, onRefreshProfile }) => {
  const theme = getRoleTheme(user.role);

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-color', theme.primary);
    document.documentElement.style.setProperty('--brand-color-light', theme.primaryLight);
  }, [theme]);

  return (
    <div className="min-h-screen flex font-sans text-gray-900 transition-colors duration-300" style={{ backgroundColor: theme.bg }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      
      <div className="flex-1 min-w-0 ml-64 flex flex-col">
        <Header user={user} setActiveTab={setActiveTab} onRefreshProfile={onRefreshProfile} />
        
        <main className="p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
