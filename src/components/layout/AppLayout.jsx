import React, { useState, useEffect, createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { base44 } from '@/api/base44Client';

const SidebarContext = createContext();
export const useSidebar = () => useContext(SidebarContext);

export default function AppLayout() {
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <SidebarContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed }}>
      <div className="min-h-screen bg-background">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <div className={`flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'ml-14' : 'ml-52'}`}>
          <Topbar user={user} />
          <main className="flex-1 p-4 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}