import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { TicketStatus, Role, Ticket, CategoryType } from '../types';
import {
  LogOut, CheckCircle, Clock, AlertCircle, XCircle, PauseCircle,
  Monitor, Cpu, RefreshCw, Search, Ticket as TicketIcon,
  User, MapPin, Building2, Calendar, Globe, X, Filter,
  ChevronDown, ChevronUp, Trash2, ShieldCheck, Hash,
  SlidersHorizontal, Download, Eye, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getProvinces, getDepartments, getIssueTypes } from '../api/client';
import { IssueType } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Province { id: number; name: string; }
interface Department { id: number; provinceId: number; name: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TicketStatus, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  [TicketStatus.OPEN]:        { label: 'مفتوحة',       icon: <AlertCircle size={12} />, bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  [TicketStatus.IN_PROGRESS]: { label: 'قيد المعالجة', icon: <Clock size={12} />,        bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  [TicketStatus.SOLVED]:      { label: 'تم الحل',      icon: <CheckCircle size={12} />,  bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  [TicketStatus.POSTPONED]:   { label: 'مؤجلة',        icon: <PauseCircle size={12} />,  bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  [TicketStatus.CLOSED]:      { label: 'مغلقة',        icon: <XCircle size={12} />,      bg: 'bg-gray-100',   text: 'text-gray-600',    border: 'border-gray-200' },
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: 'مفتوحة',
  [TicketStatus.IN_PROGRESS]: 'قيد المعالجة',
  [TicketStatus.SOLVED]: 'تم الحل',
  [TicketStatus.POSTPONED]: 'مؤجلة',
  [TicketStatus.CLOSED]: 'مغلقة',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteConfirmModal: React.FC<{
  ticket: Ticket;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ ticket, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={onCancel}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
      <div className="p-6">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} className="text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">تأكيد حذف التذكرة</h3>
        <p className="text-sm text-gray-500 text-center mb-1">
          هل أنت متأكد من حذف التذكرة رقم <span className="font-bold text-gray-800">#{ticket.id}</span>؟
        </p>
        <p className="text-xs text-gray-400 text-center mb-5 line-clamp-1">"{ticket.title}"</p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
          <p className="text-xs text-red-700 text-center font-medium">
            هذا الإجراء لا يمكن التراجع عنه. سيتم حذف التذكرة وسجل حالاتها نهائياً.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><RefreshCw size={14} className="animate-spin" /> جاري الحذف...</> : <><Trash2 size={14} /> حذف نهائي</>}
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const { user, tickets, updateStatus, deleteTicket, logout, refreshTickets, loading } = useApp();

  // UI state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [provinceFilter, setProvinceFilter] = useState<number | 'ALL'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<number | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | 'ALL'>('ALL');
  const [issueTypeFilter, setIssueTypeFilter] = useState<number | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Meta data for filters
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);

  const isSuperAdmin = user?.role === Role.SUPERADMIN;

  // Load filter meta data
  useEffect(() => {
    const load = async () => {
      try {
        const [prov, types] = await Promise.all([getProvinces(), getIssueTypes()]);
        setProvinces(prov);
        setIssueTypes(types);
      } catch {
        // non-critical
      }
    };
    load();
  }, []);

  // Load departments when province filter changes
  useEffect(() => {
    if (provinceFilter === 'ALL') { setDepartments([]); setDepartmentFilter('ALL'); return; }
    getDepartments(provinceFilter as number)
      .then(setDepartments)
      .catch(() => {});
    setDepartmentFilter('ALL');
  }, [provinceFilter]);

  if (!user) return null;

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = t.title.toLowerCase().includes(q)
          || t.userName.toLowerCase().includes(q)
          || t.description.toLowerCase().includes(q)
          || String(t.id).includes(q);
        if (!matches) return false;
      }
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (isSuperAdmin && provinceFilter !== 'ALL' && t.provinceId !== provinceFilter) return false;
      if (departmentFilter !== 'ALL' && t.departmentId !== departmentFilter) return false;
      if (categoryFilter !== 'ALL' && t.categoryType !== categoryFilter) return false;
      if (issueTypeFilter !== 'ALL' && t.issueTypeId !== issueTypeFilter) return false;
      if (dateFrom && new Date(t.createdAt) < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo); to.setHours(23, 59, 59);
        if (new Date(t.createdAt) > to) return false;
      }
      return true;
    });
  }, [tickets, searchQuery, statusFilter, provinceFilter, departmentFilter, categoryFilter, issueTypeFilter, dateFrom, dateTo, isSuperAdmin]);

  const activeFilterCount = [
    statusFilter !== 'ALL', provinceFilter !== 'ALL', departmentFilter !== 'ALL',
    categoryFilter !== 'ALL', issueTypeFilter !== 'ALL', !!dateFrom, !!dateTo,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchQuery(''); setStatusFilter('ALL'); setProvinceFilter('ALL');
    setDepartmentFilter('ALL'); setCategoryFilter('ALL'); setIssueTypeFilter('ALL');
    setDateFrom(''); setDateTo('');
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const statCounts = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === TicketStatus.OPEN).length,
    inProgress: tickets.filter((t) => t.status === TicketStatus.IN_PROGRESS).length,
    solved: tickets.filter((t) => t.status === TicketStatus.SOLVED).length,
    postponed: tickets.filter((t) => t.status === TicketStatus.POSTPONED).length,
    closed: tickets.filter((t) => t.status === TicketStatus.CLOSED).length,
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTickets();
    setIsRefreshing(false);
    toast.info('تم تحديث البيانات');
  };

  const handleStatusChange = async (id: number, newStatus: TicketStatus) => {
    const ok = await updateStatus(id, newStatus);
    if (ok && selectedTicket?.id === id) {
      setSelectedTicket((prev) => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const ok = await deleteTicket(deleteTarget.id);
    if (ok) {
      setDeleteTarget(null);
      if (selectedTicket?.id === deleteTarget.id) setSelectedTicket(null);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 50%, #1e3a8a 100%)' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}>
                <ShieldCheck className="w-5 h-5 text-white" strokeWidth={1.8} />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">
                  {isSuperAdmin ? 'لوحة تحكم المالك — SUPERADMIN' : 'لوحة تحكم المدير'}
                </h1>
                {!isSuperAdmin && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={11} /> {user.provinceName}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">تحديث</span>
              </button>
              <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
                  {user.fullName.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700">{user.fullName}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${isSuperAdmin ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                  {isSuperAdmin ? 'مالك' : 'مدير'}
                </span>
              </div>
              <button onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                <LogOut size={15} />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'الإجمالي', value: statCounts.total,      color: 'text-gray-700',    bg: 'bg-gray-100',    icon: <TicketIcon size={16} /> },
            { label: 'مفتوحة',   value: statCounts.open,        color: 'text-blue-700',    bg: 'bg-blue-50',     icon: <AlertCircle size={16} /> },
            { label: 'معالجة',   value: statCounts.inProgress,  color: 'text-amber-700',   bg: 'bg-amber-50',    icon: <Clock size={16} /> },
            { label: 'محلولة',   value: statCounts.solved,      color: 'text-emerald-700', bg: 'bg-emerald-50',  icon: <CheckCircle size={16} /> },
            { label: 'مؤجلة',   value: statCounts.postponed,   color: 'text-purple-700',  bg: 'bg-purple-50',   icon: <PauseCircle size={16} /> },
            { label: 'مغلقة',   value: statCounts.closed,      color: 'text-gray-500',    bg: 'bg-gray-100',    icon: <XCircle size={16} /> },
          ].map((s) => (
            <div key={s.label}
              onClick={() => setStatusFilter(s.label === 'الإجمالي' ? 'ALL' : (Object.entries(STATUS_LABELS).find(([, v]) => v === s.label)?.[0] as TicketStatus) ?? 'ALL')}
              className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-2 shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg} ${s.color}`}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 truncate">{s.label}</p>
                <p className={`text-xl font-bold leading-tight ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + Filter Toggle ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4 overflow-hidden">
          {/* Search bar */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="بحث برقم التذكرة، العنوان، المرسل، الوصف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline">فلاتر متقدمة</span>
              {activeFilterCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${showFilters ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters}
                className="flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm text-red-600 border border-red-100 bg-red-50 hover:bg-red-100 transition-colors">
                <X size={14} /> مسح
              </button>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">الحالة</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'ALL')}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="ALL">جميع الحالات</option>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">نوع المشكلة</label>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as CategoryType | 'ALL')}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="ALL">الكل</option>
                    <option value={CategoryType.HARDWARE}>عتاد — Hardware</option>
                    <option value={CategoryType.SOFTWARE}>برمجيات — Software</option>
                  </select>
                </div>

                {/* Issue Type */}
                {issueTypes.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">التصنيف</label>
                    <select value={issueTypeFilter} onChange={(e) => setIssueTypeFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="ALL">الكل</option>
                      {issueTypes.map((t) => <option key={t.id} value={t.id}>{t.nameAr}</option>)}
                    </select>
                  </div>
                )}

                {/* Province (SUPERADMIN only) */}
                {isSuperAdmin && provinces.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">المحافظة</label>
                    <select value={provinceFilter} onChange={(e) => setProvinceFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="ALL">جميع المحافظات</option>
                      {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Department */}
                {(departments.length > 0 || !isSuperAdmin) && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">الدائرة</label>
                    <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isSuperAdmin && provinceFilter === 'ALL'}>
                      <option value="ALL">جميع الدوائر</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Date From */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">من تاريخ</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">إلى تاريخ</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Results info ── */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">
            عرض <span className="font-semibold text-gray-800">{filteredTickets.length}</span> تذكرة
            {activeFilterCount > 0 && <span className="text-blue-600"> (مفلترة من {tickets.length})</span>}
          </p>
        </div>

        {/* ── Tickets Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredTickets.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TicketIcon className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">لا توجد نتائج</h3>
              <p className="text-xs text-gray-400">جرّب تعديل معايير البحث أو الفلاتر</p>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="mt-3 text-xs text-blue-600 hover:underline">مسح جميع الفلاتر</button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">#</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">عنوان التذكرة</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 hidden md:table-cell">المرسل</th>
                    {isSuperAdmin && <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 hidden lg:table-cell">المحافظة</th>}
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 hidden sm:table-cell">التصنيف</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">الحالة</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 hidden md:table-cell">التاريخ</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono text-gray-400">#{ticket.id}</span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${ticket.categoryType === CategoryType.HARDWARE ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            {ticket.categoryType === CategoryType.HARDWARE ? <Monitor size={14} /> : <Cpu size={14} />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate">{ticket.title}</p>
                            <p className="text-xs text-gray-400 truncate hidden sm:block">{ticket.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <User size={13} className="text-gray-400" />
                          {ticket.userName}
                        </div>
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <MapPin size={11} className="text-gray-400" />{ticket.provinceName}
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {ticket.categoryType === CategoryType.HARDWARE ? 'عتاد' : 'برمجيات'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-xs text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye size={15} />
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => setDeleteTarget(ticket)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="حذف التذكرة"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ══ Ticket Detail Modal ══════════════════════════════════════════════════ */}
      {selectedTicket && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100"
              style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/15 flex-shrink-0`}>
                  {selectedTicket.categoryType === CategoryType.HARDWARE
                    ? <Monitor size={20} className="text-white" />
                    : <Cpu size={20} className="text-white" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">{selectedTicket.title}</h2>
                  <p className="text-blue-200 text-xs mt-0.5">تذكرة #{selectedTicket.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSuperAdmin && (
                  <button
                    onClick={() => { setDeleteTarget(selectedTicket); setSelectedTicket(null); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-100 bg-red-500/30 hover:bg-red-500/50 border border-red-400/30 transition-colors"
                  >
                    <Trash2 size={13} /> حذف التذكرة
                  </button>
                )}
                <button onClick={() => setSelectedTicket(null)}
                  className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                {[
                  { icon: <User size={14} />, label: 'المرسل', value: selectedTicket.userName },
                  { icon: <MapPin size={14} />, label: 'المحافظة', value: selectedTicket.provinceName },
                  { icon: <Building2 size={14} />, label: 'الدائرة', value: selectedTicket.departmentName },
                  { icon: <Calendar size={14} />, label: 'تاريخ الإنشاء', value: new Date(selectedTicket.createdAt).toLocaleString('ar-SY') },
                  { icon: <Globe size={14} />, label: 'عنوان IP', value: selectedTicket.ipAddress || 'غير متوفر', mono: true },
                  { icon: selectedTicket.categoryType === CategoryType.HARDWARE ? <Monitor size={14} /> : <Cpu size={14} />, label: 'التصنيف', value: `${selectedTicket.categoryType === CategoryType.HARDWARE ? 'عتاد' : 'برمجيات'} / ${selectedTicket.categorySubType}` },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                      {item.icon} {item.label}
                    </div>
                    <p className={`text-sm font-semibold text-gray-800 ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="mb-5">
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-blue-500 inline-block" />
                  وصف المشكلة
                </h3>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Image preview */}
              {selectedTicket.imageUrl && (
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-purple-500 inline-block" />
                    صورة توضيحية
                  </h3>
                  <a href={selectedTicket.imageUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-blue-600 hover:underline bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    <Download size={13} /> عرض الصورة المرفقة
                  </a>
                </div>
              )}

              {/* Status Change */}
              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-emerald-500 inline-block" />
                  تحديث حالة التذكرة
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_CONFIG).map(([statusKey, cfg]) => {
                    const status = statusKey as TicketStatus;
                    const isActive = selectedTicket.status === status;
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedTicket.id, status)}
                        disabled={loading || isActive}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                          isActive
                            ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-offset-1 ring-blue-400 cursor-default`
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        } disabled:opacity-60`}
                      >
                        {cfg.icon}
                        {cfg.label}
                        {isActive && <span className="text-xs opacity-70">(الحالي)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Delete Confirm Modal ═════════════════════════════════════════════════ */}
      {deleteTarget && (
        <DeleteConfirmModal
          ticket={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={loading}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
