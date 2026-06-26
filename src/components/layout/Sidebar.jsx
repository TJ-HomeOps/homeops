import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Server, AlertTriangle,
  FileText, BookOpen, Activity, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';

const navItems = [
  { label: 'Operations Center', path: '/', icon: LayoutDashboard },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Assets', path: '/assets', icon: Server },
  { label: 'Cases', path: '/cases', icon: AlertTriangle },
  { label: 'Documentation', path: '/documentation', icon: FileText },
  { label: 'Runbooks', path: '/runbooks', icon: BookOpen },
  { label: 'Monitoring', path: '/monitoring', icon: Activity },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col border-r border-border bg-navy-900 transition-all duration-300 ${
        collapsed ? 'w-14' : 'w-52'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center h-12 px-3 border-b border-border shrink-0">
        <div className="w-7 h-7 rounded bg-ops-cyan flex items-center justify-center shrink-0">
          <Server className="w-4 h-4 text-navy-900" />
        </div>
        {!collapsed && (
          <span className="ml-2.5 text-sm font-semibold text-foreground tracking-tight">
            HomeOps
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-1.5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors relative ${
                isActive
                  ? 'bg-accent text-ops-cyan'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-ops-cyan rounded-r" />
              )}
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}