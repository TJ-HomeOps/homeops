import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import PriorityBadge from '@/components/shared/PriorityBadge';
import EmptyState from '@/components/shared/EmptyState';
import CaseForm from '@/components/cases/CaseForm';
import { logActivity } from '@/lib/activityLogger';
import { generateCaseNumber } from '@/lib/caseNumbers';
import moment from 'moment';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const priorities = ['Low', 'Normal', 'High', 'Critical'];
const statuses = ['Open', 'In Progress', 'Waiting', 'Closed'];

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [assets, setAssets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setFormOpen(true);
      setSearchParams({});
    }
  }, [searchParams]);

  const loadData = async () => {
    const [c, a, p] = await Promise.all([
      base44.entities.Case.list('-created_date'),
      base44.entities.Asset.list(),
      base44.entities.Project.list()
    ]);
    setCases(c);
    setAssets(a);
    setProjects(p);
    setLoading(false);
  };

  const handleCreate = async (data) => {
    const caseNumber = await generateCaseNumber();
    const caseData = { ...data, case_number: caseNumber };
    const created = await base44.entities.Case.create(caseData);
    await logActivity('Created Case', 'Case', created.id, `${caseNumber}: ${data.title}`);
    setFormOpen(false);
    loadData();
  };

  const assetMap = Object.fromEntries(assets.map(a => [a.id, a]));
  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));

  const filtered = cases.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
        !(c.case_number || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Cases</h1>
          <p className="text-xs text-muted-foreground">{cases.length} total cases</p>
        </div>
        <Button onClick={() => setFormOpen(true)} size="sm" className="bg-ops-cyan text-navy-900 hover:bg-ops-cyan/90 h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New Case
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases..."
            className="pl-8 h-8 text-xs bg-card border-border"
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-8 w-32 text-xs bg-card border-border">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent className="bg-navy-800 border-border">
            <SelectItem value="all" className="text-xs">All Priority</SelectItem>
            {priorities.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-32 text-xs bg-card border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-navy-800 border-border">
            <SelectItem value="all" className="text-xs">All Status</SelectItem>
            {statuses.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No cases found"
          description="Create a case to track infrastructure issues."
          action={
            <Button onClick={() => setFormOpen(true)} size="sm" variant="outline" className="text-xs h-8 border-border">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Case
            </Button>
          }
        />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-20">Priority</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">Case #</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Asset</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Project</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">Status</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Assigned</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-24">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-3 py-2"><PriorityBadge priority={c.priority} /></td>
                  <td className="px-3 py-2 font-mono text-muted-foreground text-[11px]">{c.case_number}</td>
                  <td className="px-3 py-2">
                    <Link to={`/cases/${c.id}`} className="text-foreground hover:text-primary font-medium">{c.title}</Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {c.asset && assetMap[c.asset] ? assetMap[c.asset].name : '—'}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {c.project && projectMap[c.project] ? projectMap[c.project].name : '—'}
                  </td>
                  <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-2 text-muted-foreground">{c.assigned_to || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground text-[11px]">{moment(c.updated_date || c.created_date).fromNow()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-navy-800 border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">New Case</DialogTitle>
          </DialogHeader>
          <CaseForm assets={assets} projects={projects} onSubmit={handleCreate} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}