import React, { useEffect, useMemo, useState } from 'react';
import {
  LogOut, Plus, Clock, Monitor, Cpu, X, Send, Image,
  FileText, Loader2, RefreshCw, Ticket, AlertCircle,
  CheckCircle, PauseCircle, XCircle, ChevronDown, ChevronUp,
  User, MapPin, Building2, Calendar, ShieldCheck, Hash
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import { CategoryType, IssueSubtype, IssueType, TicketStatus } from '../types';
import { fetchPublicIp, getIssueSubtypes, getIssueTypes } from '../api/client';

// ─── Status helpers ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TicketStatus, { label: string; icon: React.ReactNode; bg: string; text: string; border: string; dot: string }> = {
  [TicketStatus.OPEN]: {
    label: 'مفتوحة',
    icon: <AlertCircle size={13} />,
    bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500',
  },
  [TicketStatus.IN_PROGRESS]: {
    label: 'قيد المعالجة',
    icon: <Clock size={13} />,
    bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500',
  },
  [TicketStatus.SOLVED]: {
    label: 'تم الحل',
    icon: <CheckCircle size={13} />,
    bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500',
  },
  [TicketStatus.POSTPONED]: {
    label: 'مؤجلة',
    icon: <PauseCircle size={13} />,
    bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500',
  },
  [TicketStatus.CLOSED]: {
    label: 'مغلقة',
    icon: <XCircle size={13} />,
    bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400',
  },
};

const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
const EmployeeDashboard: React.FC = () => {
  const { user, tickets, createTicket, logout, loading, refreshTickets } = useApp();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [issueSubtypes, setIssueSubtypes] = useState<IssueSubtype[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [issueTypeId, setIssueTypeId] = useState<number | null>(null);
  const [issueSubtypeId, setIssueSubtypeId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load issue types on mount
  useEffect(() => {
    const load = async () => {
      try {
        const types = await getIssueTypes();
        setIssueTypes(types);
        if (types[0]) setIssueTypeId(types[0].id);
      } catch {
        toast.error('فشل في تحميل أنواع المشاكل');
      }
    };
    load();
  }, []);

  // Load subtypes when type changes
  useEffect(() => {
    if (!issueTypeId) return;
    const load = async () => {
      try {
        const subs = await getIssueSubtypes(issueTypeId);
        setIssueSubtypes(subs);
        setIssueSubtypeId(subs[0]?.id ?? null);
      } catch {
        toast.error('فشل في تحميل التصنيفات الفرعية');
      }
    };
    load();
  }, [issueTypeId]);

  const selectedIssueType = useMemo(
    () => issueTypes.find((t) => t.id === issueTypeId) ?? null,
    [issueTypeId, issueTypes]
  );

  if (!user) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTickets();
    setIsRefreshing(false);
    toast.info('تم تحديث القائمة');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTypeId) { toast.warning('يرجى اختيار نوع المشكلة'); return; }
    const ipAddress = await fetchPublicIp();
    const ok = await createTicket({
      title, description,
      imageUrl: imageUrl || null,
      issueTypeId, issueSubtypeId,
      ipAddress,
    });
    if (ok) {
      setShowForm(false);
      setTitle(''); setDescription(''); setImageUrl('');
    }
  };

  const switchIssueType = (code: CategoryType) => {
    const t = issueTypes.find((i) => i.code === code);
    setIssueTypeId(t?.id ?? null);
  };

  // Stats
  const counts = {
    open: tickets.filter((t) => t.status === TicketStatus.OPEN).length,
    inProgress: tickets.filter((t) => t.status === TicketStatus.IN_PROGRESS).length,
    solved: tickets.filter((t) => t.status === TicketStatus.SOLVED).length,
    total: tickets.length,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        {/* Gov stripe */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 50%, #1e3a8a 100%)' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            {/* Left: Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm"
                style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}>
                <ShieldCheck className="w-5 h-5 text-white" strokeWidth={1.8} />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">نظام إدارة التذاكر</h1>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin size={11} />
                  {user.provinceName} — {user.departmentName}
                </p>
              </div>
            </div>

            {/* Right: User + actions */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}>
                  {user.fullName.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700">{user.fullName}</span>
                <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">موظف</span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">تحديث</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'إجمالي التذاكر', value: counts.total, icon: <Ticket size={18} />, color: 'text-gray-700', bg: 'bg-gray-100' },
            { label: 'مفتوحة', value: counts.open, icon: <AlertCircle size={18} />, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'قيد المعالجة', value: counts.inProgress, icon: <Clock size={18} />, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'تم حلها', value: counts.solved, icon: <CheckCircle size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-4 py-4 flex items-center gap-3 shadow-sm">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.bg} ${s.color}`}>
                {s.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Actions Bar ── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Ticket size={18} className="text-blue-600" />
            تذاكري
          </h2>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}
          >
            {showForm ? <><X size={16} /> إغلاق</> : <><Plus size={16} /> تذكرة جديدة</>}
          </button>
        </div>

        {/* ── Create Ticket Form ── */}
        {showForm && (
          <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Form header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}>
              <div className="flex items-center gap-2 text-white">
                <FileText size={18} />
                <span className="font-semibold">تقديم تذكرة دعم فني جديدة</span>
              </div>
              <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">

              {/* Category selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">نوع المشكلة</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { code: CategoryType.HARDWARE, label: 'عتاد — Hardware', sub: 'أجهزة، طابعات، شبكات', icon: <Monitor size={20} />, activeColor: 'border-orange-400 bg-orange-50', textColor: 'text-orange-600' },
                    { code: CategoryType.SOFTWARE, label: 'برمجيات — Software', sub: 'أنظمة، تطبيقات، بيانات', icon: <Cpu size={20} />, activeColor: 'border-blue-500 bg-blue-50', textColor: 'text-blue-600' },
                  ].map((opt) => {
                    const isActive = selectedIssueType?.code === opt.code;
                    return (
                      <label key={opt.code}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${isActive ? opt.activeColor : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <input type="radio" name="catType" checked={isActive}
                          onChange={() => switchIssueType(opt.code)} className="sr-only" />
                        <span className={isActive ? opt.textColor : 'text-gray-400'}>{opt.icon}</span>
                        <div>
                          <p className={`text-sm font-semibold ${isActive ? opt.textColor : 'text-gray-700'}`}>{opt.label}</p>
                          <p className="text-xs text-gray-400">{opt.sub}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Subtype */}
              {issueSubtypes.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">التصنيف الفرعي</label>
                  <select
                    value={issueSubtypeId ?? ''}
                    onChange={(e) => setIssueSubtypeId(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {issueSubtypes.map((s) => (
                      <option key={s.id} value={s.id}>{s.nameAr}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">عنوان المشكلة <span className="text-red-500">*</span></label>
                  <input
                    type="text" value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="عنوان مختصر وواضح للمشكلة"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">وصف تفصيلي <span className="text-red-500">*</span></label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="اشرح المشكلة بالتفصيل: متى بدأت؟ ما الأعراض؟ هل جربت حلولاً سابقة؟"
                    required
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Image size={14} /> رابط صورة توضيحية <span className="text-gray-400 font-normal">(اختياري)</span>
                  </label>
                  <input
                    type="url" value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/screenshot.png"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading || !issueTypeId}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}
                >
                  {loading ? <><Loader2 size={15} className="animate-spin" /> جاري الإرسال...</> : <><Send size={15} /> إرسال التذكرة</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Tickets Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {tickets.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">لا توجد تذاكر</h3>
              <p className="text-xs text-gray-400">قم بإنشاء تذكرة جديدة للإبلاغ عن مشكلة تقنية</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <Hash size={12} className="inline ml-1" />رقم
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">عنوان التذكرة</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">التصنيف</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">الحالة</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      <Calendar size={12} className="inline ml-1" />التاريخ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono text-gray-400">#{ticket.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${ticket.categoryType === CategoryType.HARDWARE ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            {ticket.categoryType === CategoryType.HARDWARE ? <Monitor size={14} /> : <Cpu size={14} />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 leading-tight">{ticket.title}</p>
                            <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{ticket.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {ticket.categoryType === CategoryType.HARDWARE ? 'عتاد' : 'برمجيات'} · {ticket.categorySubType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-xs text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
