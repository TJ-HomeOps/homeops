import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Server, AlertTriangle,
  FileText, BookOpen, Activity, Settings, ChevronLeft, ChevronRight,
  Cloud, HardDrive, Network, ListChecks, ChevronDown
} from 'lucide-react';

const navSections = [
  { label: 'Operations Center', path: '/', icon: LayoutDashboard },
  {
    label: 'Infrastructure', icon: Server, section: true, children: [
      { label: 'Providers', path: '/providers', icon: Cloud },
      { label: 'Nodes', path: '/nodes', icon: HardDrive },
      { label: 'Assets', path: '/assets', icon: Server },
      { label: 'Topology', path: '/topology', icon: Network, comingSoon: true },
      { label: 'Tasks', path: '/tasks', icon: ListChecks, comingSoon: true },
    ]
  },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Cases', path: '/cases', icon: AlertTriangle },
  { label: 'Documentation', path: '/documentation', icon: FileText },
  { label: 'Runbooks', path: '/runbooks', icon: BookOpen },
  { label: 'Monitoring', path: '/monitoring', icon: Activity },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const [infraExpanded, setInfraExpanded] = useState(true);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const isInfraActive = ['/providers', '/nodes', '/assets', '/topology', '/tasks'].some(p =>
    location.pathname === p || location.pathname.startsWith(p + '/')
  );

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
        {navSections.map((item) => {
          if (item.section) {
            const Icon = item.icon;
            const expanded = collapsed ? false : (infraExpanded || isInfraActive);
            return (
              <div key={item.label}>
                <button
                  onClick={() => !collapsed && setInfraExpanded(!infraExpanded)}
                  className={`group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors ${
                    isInfraActive
                      ? 'text-ops-cyan'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {!collapsed && (
                    <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-0' : '-rotate-90'}`} />
                  )}
                </button>
                {expanded && !collapsed && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-2">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = isActive(child.path);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`group flex items-center gap-2 px-2 py-1.5 rounded text-[12px] font-medium transition-colors relative ${
                            childActive
                              ? 'bg-accent text-ops-cyan'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                          } ${child.comingSoon ? 'opacity-50 cursor-default' : ''}`}
                        >
                          {childActive && (
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-[2px] h-3.5 bg-ops-cyan rounded-r" />
                          )}
                          <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="flex-1">{child.label}</span>
                          {child.comingSoon && <span className="text-[9px] text-muted-foreground/60">soon</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors relative ${
                active
                  ? 'bg-accent text-ops-cyan'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {active && (
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