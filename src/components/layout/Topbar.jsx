import React, { useState } from 'react';
import { Search, Bell, Plus, LogOut, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function Topbar({ user }) {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const quickActions = [
    { label: 'New Asset', path: '/assets?action=new' },
    { label: 'New Case', path: '/cases?action=new' },
    { label: 'New Project', path: '/projects?action=new' },
    { label: 'New Documentation', path: '/documentation?action=new' },
    { label: 'New Runbook', path: '/runbooks?action=new' },
  ];

  return (
    <>
      <header className="h-12 border-b border-border bg-navy-900 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent/50 border border-border text-muted-foreground hover:text-foreground text-xs transition-colors min-w-[200px]"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="ml-auto text-[10px] font-mono bg-navy-900 px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-ops-cyan text-navy-900 text-xs font-medium hover:bg-ops-cyan/90 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quick Action</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-navy-800 border-border">
              {quickActions.map((action) => (
                <DropdownMenuItem
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="text-xs text-foreground hover:bg-accent cursor-pointer"
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors relative">
            <Bell className="w-4 h-4" />
          </button>

          {/* User */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                <div className="w-6 h-6 rounded-full bg-ops-cyan/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-ops-cyan" />
                </div>
                <span className="text-xs hidden sm:inline">{user?.full_name || 'Admin'}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-navy-800 border-border">
              <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                {user?.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={() => base44.auth.logout('/')}
                className="text-xs text-foreground hover:bg-accent cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="bg-navy-800 border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">Search HomeOps</DialogTitle>
          </DialogHeader>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assets, cases, projects..."
            className="bg-navy-900 border-border text-sm"
            autoFocus
          />
          <div className="text-xs text-muted-foreground text-center py-4">
            Type to search across all entities
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}