import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { TicketStatus, Role, Ticket, CategoryType } from '../types';
import {
  LogOut, CheckCircle, Clock, AlertCircle, XCircle, PauseCircle,
  Monitor, Cpu, RefreshCw, Search, Ticket as TicketIcon,
  User, MapPin, Building2, Calendar, Globe, X,
  ChevronDown, ChevronUp, Trash2, ShieldCheck, Hash,
  SlidersHorizontal, Download, Eye, AlertTriangle, Tag, Loader2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getProvinces, getDepartments, getIssueTypes } from '../api/client';
import { IssueType } from '../types';

interface Province { id: number; name: string; }
interface Department { id: number; provinceId: number; name: string; }

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TicketStatus, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  [TicketStatus.OPEN]:        { label: 'مفتوحة',       icon: <AlertCircle size={11} />, bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  [TicketStatus.IN_PROGRESS]: { label: 'قيد المعالجة', icon: <Clock size={11} />,        bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  [TicketStatus.SOLVED]:      { label: 'تم الحل',      icon: <CheckCircle size={11} />,  bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  [TicketStatus.POSTPONED]:   { label: 'مؤجلة',        icon: <PauseCircle size={11} />,  bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  [TicketStatus.CLOSED]:      { label: 'مغلقة',        icon: <XCircle size={11} />,      bg: 'bg-gray-100',   text: 'text-gray-600',    border: 'border-gray-200' },
};

const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const c = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {c.icon}{c.label}
    </span>
  );
};

// ── Delete Modal ──────────────────────────────────────────────────────────────
const DeleteModal: React.FC<{ ticket: Ticket; onConfirm: () => void; onCancel: () => void; loading: boolean }> = ({ ticket, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={onCancel}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <AlertTriangle size={24} className="text-red-600" />
      </div>
      <h3 className="text-base font-bold text-gray-900 text-center mb-1">تأكيد الحذف</h3>
      <p className="text-sm text-gray-500 text-center mb-4">التذكرة رقم <span className="font-bold">#{ticket.id}</span> — "{ticket.title}"</p>
      <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
        <p className="text-xs text-red-700 text-center font-medium">هذا الإجراء لا يمكن التراجع عنه</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">إلغاء</button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-1.5 transition-colors">
          {loading ? <><RefreshCw size={13} className="animate-spin" /> حذف...</> : <><Trash2 size={13} /> حذف</>}
        </button>
      </div>
    </div>
  </div>
);

// ── Expandable Row ────────────────────────────────────────────────────────────
const TicketRow: React.FC<{
  ticket: Ticket; isSuperAdmin: boolean;
  onView: () => void; onDelete: () => void;
}> = ({ ticket, isSuperAdmin, onView, onDelete }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <td className="py-3 px-3"><span className="text-xs font-mono text-gray-400">#{ticket.id}</span></td>
        <td className="py-3 px-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${ticket.categoryType === CategoryType.HARDWARE ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
              {ticket.categoryType === CategoryType.HARDWARE ? <Monitor size={13} /> : <Cpu size={13} />}
            </div>
            <p className="font-medium text-gray-800 text-sm line-clamp-1">{ticket.title}</p>
          </div>
        </td>
        <td className="py-3 px-3"><StatusBadge status={ticket.status} /></td>
        <td className="py-3 px-3 text-left">{open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}</td>
      </tr>
      {open && (
        <tr className="bg-blue-50/30 border-b border-blue-100">
          <td colSpan={4} className="px-4 py-3">
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-gray-600"><User size={11} className="text-gray-400" /><span className="font-medium">المرسل:</span> {ticket.userName}</div>
                {isSuperAdmin && <div className="flex items-center gap-1 text-gray-600"><MapPin size={11} className="text-gray-400" /><span className="font-medium">المحافظة:</span> {ticket.provinceName}</div>}
                <div className="flex items-center gap-1 text-gray-600"><Building2 size={11} className="text-gray-400" /><span className="font-medium">الدائرة:</span> {ticket.departmentName}</div>
                <div className="flex items-center gap-1 text-gray-600"><Calendar size={11} className="text-gray-400" />{new Date(ticket.createdAt).toLocaleDateString('ar-SY')}</div>
                <div className="flex items-center gap-1 text-gray-600 col-span-2"><Globe size={11} className="text-gray-400" /><span className="font-mono">{ticket.ipAddress || 'غير متوفر'}</span></div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{ticket.description}</p>
              {ticket.imageUrl && (
                <img src={ticket.imageUrl} alt="صورة"
                  className="w-full max-h-40 object-contain rounded-lg border border-gray-200 bg-white cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); window.open(ticket.imageUrl!, '_blank'); }} />
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={(e) => { e.stopPropagation(); onView(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors">
                  <Eye size={13} /> عرض وتغيير الحالة
                </button>
                {isSuperAdmin && (
                  <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 transition-colors">
                    <Trash2 size={13} /> حذف
                  </button>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const { user, tickets, updateStatus, deleteTicket, logout, refreshTickets, loading, loggingOut } = useApp();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [provinceFilter, setProvinceFilter] = useState<number | 'ALL'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<number | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);

  const isSuperAdmin = user?.role === Role.SUPERADMIN;

  useEffect(() => {
    Promise.all([getProvinces(), getIssueTypes()])
      .then(([p, t]) => { setProvinces(p); setIssueTypes(t); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (provinceFilter === 'ALL') { setDepartments([]); setDepartmentFilter('ALL'); return; }
    getDepartments(provinceFilter as number).then(setDepartments).catch(() => {});
    setDepartmentFilter('ALL');
  }, [provinceFilter]);

  if (!user) return null;

  // ── Logout overlay ──────────────────────────────────────────────────────────
  if (loggingOut) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">جاري تسجيل الخروج...</p>
        </div>
      </div>
    );
  }

  const filteredTickets = tickets.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (![t.title, t.userName, t.description, String(t.id)].some((v) => v.toLowerCase().includes(q))) return false;
    }
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (isSuperAdmin && provinceFilter !== 'ALL' && t.provinceId !== provinceFilter) return false;
    if (departmentFilter !== 'ALL' && t.departmentId !== departmentFilter) return false;
    if (categoryFilter !== 'ALL' && t.categoryType !== categoryFilter) return false;
    if (dateFrom && new Date(t.createdAt) < new Date(dateFrom)) return false;
    if (dateTo) { const to = new Date(dateTo); to.setHours(23, 59, 59); if (new Date(t.createdAt) > to) return false; }
    return true;
  });

  const activeFilterCount = [statusFilter !== 'ALL', provinceFilter !== 'ALL', departmentFilter !== 'ALL', categoryFilter !== 'ALL', !!dateFrom, !!dateTo].filter(Boolean).length;
  const resetFilters = () => { setSearchQuery(''); setStatusFilter('ALL'); setProvinceFilter('ALL'); setDepartmentFilter('ALL'); setCategoryFilter('ALL'); setDateFrom(''); setDateTo(''); };

  // ── Stats cards — use TicketStatus enum directly as filter key ──────────────
  const statCards = [
    { label: 'الكل',          key: null,                      value: tickets.length,                                                          color: 'text-gray-700',    bg: 'bg-gray-100',   icon: <TicketIcon size={15} /> },
    { label: 'مفتوحة',        key: TicketStatus.OPEN,         value: tickets.filter((t) => t.status === TicketStatus.OPEN).length,         color: 'text-blue-700',    bg: 'bg-blue-50',    icon: <AlertCircle size={15} /> },
    { label: 'قيد المعالجة',  key: TicketStatus.IN_PROGRESS,  value: tickets.filter((t) => t.status === TicketStatus.IN_PROGRESS).length,  color: 'text-amber-700',   bg: 'bg-amber-50',   icon: <Clock size={15} /> },
    { label: 'تم الحل',       key: TicketStatus.SOLVED,       value: tickets.filter((t) => t.status === TicketStatus.SOLVED).length,       color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <CheckCircle size={15} /> },
    { label: 'مؤجلة',         key: TicketStatus.POSTPONED,    value: tickets.filter((t) => t.status === TicketStatus.POSTPONED).length,    color: 'text-purple-700',  bg: 'bg-purple-50',  icon: <PauseCircle size={15} /> },
    { label: 'مغلقة',         key: TicketStatus.CLOSED,       value: tickets.filter((t) => t.status === TicketStatus.CLOSED).length,       color: 'text-gray-500',    bg: 'bg-gray-100',   icon: <XCircle size={15} /> },
  ];

  const handleRefresh = async () => { setIsRefreshing(true); await refreshTickets(); setIsRefreshing(false); toast.info('تم التحديث'); };

  const handleStatusChange = async (id: number, newStatus: TicketStatus) => {
    const ok = await updateStatus(id, newStatus);
    if (ok && selectedTicket?.id === id) setSelectedTicket((p) => p ? { ...p, status: newStatus } : null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const ok = await deleteTicket(deleteTarget.id);
    if (ok) { setDeleteTarget(null); if (selectedTicket?.id === deleteTarget.id) setSelectedTicket(null); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="h-1" style={{ background: 'linear-gradient(90deg,#1e3a8a 0%,#2563eb 50%,#1e3a8a 100%)' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)' }}>
                <ShieldCheck className="w-5 h-5 text-white" strokeWidth={1.8} />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">{isSuperAdmin ? 'لوحة المالك' : 'لوحة المدير'}</h1>
                {!isSuperAdmin && <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={11} />{user.provinceName}</p>}
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
                  style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)' }}>{user.fullName.charAt(0)}</div>
                <span className="text-sm font-medium text-gray-700">{user.fullName}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${isSuperAdmin ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                  {isSuperAdmin ? 'مالك' : 'مدير'}
                </span>
              </div>
              <button onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                <LogOut size={15} /><span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* Stats — clicking filters correctly using enum key */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
          {statCards.map((s) => (
            <div key={s.label}
              className={`bg-white rounded-xl border p-3 flex items-center gap-2 shadow-sm cursor-pointer transition-colors ${statusFilter === (s.key ?? 'ALL') ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'}`}
              onClick={() => setStatusFilter(s.key ?? 'ALL')}>
              <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${s.bg} ${s.color}`}>{s.icon}</div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 truncate">{s.label}</p>
                <p className={`text-lg font-bold leading-tight ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="بحث بالرقم، العنوان، المرسل..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">فلاتر</span>
              {activeFilterCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${showFilters ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>{activeFilterCount}</span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="flex items-center gap-1 px-3 py-2.5 rounded-lg text-sm text-red-600 border border-red-100 bg-red-50 hover:bg-red-100">
                <X size={13} /> مسح
              </button>
            )}
          </div>

          {showFilters && (
            <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">الحالة</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'ALL')}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="ALL">الكل</option>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">النوع</label>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as CategoryType | 'ALL')}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="ALL">الكل</option>
                    <option value={CategoryType.HARDWARE}>عتاد</option>
                    <option value={CategoryType.SOFTWARE}>برمجيات</option>
                  </select>
                </div>
                {isSuperAdmin && provinces.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">المحافظة</label>
                    <select value={provinceFilter} onChange={(e) => setProvinceFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="ALL">الكل</option>
                      {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
                {departments.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">الدائرة</label>
                    <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="ALL">الكل</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">من تاريخ</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">إلى تاريخ</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500 mb-3">
          <span className="font-semibold text-gray-800">{filteredTickets.length}</span> تذكرة
          {activeFilterCount > 0 && <span className="text-blue-600"> (من {tickets.length})</span>}
        </p>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredTickets.length === 0 ? (
            <div className="py-14 text-center">
              <TicketIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">لا توجد نتائج</p>
              {activeFilterCount > 0 && <button onClick={resetFilters} className="mt-2 text-xs text-blue-600 hover:underline">مسح الفلاتر</button>}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500">#</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500">العنوان</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500">الحالة</th>
                  <th className="py-2.5 px-3 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map((ticket) => (
                  <TicketRow key={ticket.id} ticket={ticket} isSuperAdmin={isSuperAdmin}
                    onView={() => setSelectedTicket(ticket)} onDelete={() => setDeleteTarget(ticket)} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  {selectedTicket.categoryType === CategoryType.HARDWARE ? <Monitor size={18} className="text-white" /> : <Cpu size={18} className="text-white" />}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">{selectedTicket.title}</h2>
                  <p className="text-blue-200 text-xs">#{selectedTicket.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSuperAdmin && (
                  <button onClick={() => { setDeleteTarget(selectedTicket); setSelectedTicket(null); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-100 bg-red-500/30 hover:bg-red-500/50 border border-red-400/30 transition-colors">
                    <Trash2 size={12} /> حذف
                  </button>
                )}
                <button onClick={() => setSelectedTicket(null)} className="text-white/70 hover:text-white p-1.5 rounded-lg transition-colors">
                  <X size={19} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { icon: <User size={13} />, label: 'المرسل', value: selectedTicket.userName },
                  { icon: <MapPin size={13} />, label: 'المحافظة', value: selectedTicket.provinceName },
                  { icon: <Building2 size={13} />, label: 'الدائرة', value: selectedTicket.departmentName },
                  { icon: <Calendar size={13} />, label: 'التاريخ', value: new Date(selectedTicket.createdAt).toLocaleString('ar-SY') },
                  { icon: <Globe size={13} />, label: 'IP', value: selectedTicket.ipAddress || 'غير متوفر', mono: true },
                  { icon: <Tag size={13} />, label: 'التصنيف', value: `${selectedTicket.categoryType === CategoryType.HARDWARE ? 'عتاد' : 'برمجيات'} / ${selectedTicket.categorySubType}` },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">{item.icon}{item.label}</div>
                    <p className={`text-sm font-semibold text-gray-800 ${item.mono ? 'font-mono' : ''}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-blue-500 inline-block" /> وصف المشكلة
                </h3>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {selectedTicket.imageUrl && (
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-purple-500 inline-block" /> صورة مرفقة
                  </h3>
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <img src={selectedTicket.imageUrl} alt="صورة"
                      className="w-full max-h-64 object-contain bg-gray-100 cursor-zoom-in"
                      onClick={() => window.open(selectedTicket.imageUrl!, '_blank')} />
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-emerald-500 inline-block" /> تحديث الحالة
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_CONFIG).map(([k, cfg]) => {
                    const status = k as TicketStatus;
                    const isActive = selectedTicket.status === status;
                    return (
                      <button key={status} onClick={() => handleStatusChange(selectedTicket.id, status)}
                        disabled={loading || isActive}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${isActive ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-offset-1 ring-blue-400 cursor-default` : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'} disabled:opacity-60`}>
                        {cfg.icon}{cfg.label}{isActive && <span className="opacity-60">(الحالي)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteModal ticket={deleteTarget} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} loading={loading} />
      )}
    </div>
  );
};

export default AdminDashboard;
