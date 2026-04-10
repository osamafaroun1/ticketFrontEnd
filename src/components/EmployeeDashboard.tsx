import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LogOut, Plus, Clock, Monitor, Cpu, X, Send, FileText, Loader2,
  RefreshCw, Ticket, AlertCircle, CheckCircle, PauseCircle, XCircle,
  MapPin, ShieldCheck, Hash, UploadCloud, ChevronDown, ChevronUp,
  Calendar, Tag,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useApp } from '../context/AppContext';
import { CategoryType, IssueSubtype, IssueType, TicketStatus, Ticket as TicketType } from '../types';
import { getIssueSubtypes, getIssueTypes, fileToBase64 } from '../api/client';

// ── Real IP ───────────────────────────────────────────────────────────────────
async function getRealIp(): Promise<string | null> {
  const rtcIp = await new Promise<string | null>((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      pc.createOffer().then((o) => pc.setLocalDescription(o));
      pc.onicecandidate = (e) => {
        if (!e.candidate) { pc.close(); resolve(null); return; }
        const m = e.candidate.candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (m && !m[1].startsWith('0.')) { pc.close(); resolve(m[1]); }
      };
      setTimeout(() => { pc.close(); resolve(null); }, 1000);
    } catch { resolve(null); }
  });
  if (rtcIp) return rtcIp;
  try {
    const r = await fetch('https://api.ipify.org?format=json');
    const d = await r.json() as { ip?: string };
    return d.ip || null;
  } catch { return null; }
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TicketStatus, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  [TicketStatus.OPEN]:        { label: 'مفتوحة',       icon: <AlertCircle size={12} />, bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  [TicketStatus.IN_PROGRESS]: { label: 'قيد المعالجة', icon: <Clock size={12} />,        bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  [TicketStatus.SOLVED]:      { label: 'تم الحل',      icon: <CheckCircle size={12} />,  bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  [TicketStatus.POSTPONED]:   { label: 'مؤجلة',        icon: <PauseCircle size={12} />,  bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  [TicketStatus.CLOSED]:      { label: 'مغلقة',        icon: <XCircle size={12} />,      bg: 'bg-gray-100',   text: 'text-gray-600',    border: 'border-gray-200' },
};

const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const c = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {c.icon}{c.label}
    </span>
  );
};

// ── Image Upload (base64) ─────────────────────────────────────────────────────
const ImageUploadField: React.FC<{
  onBase64: (b64: string | null) => void;
  preview: string | null;
  converting: boolean;
}> = ({ onBase64, preview, converting }) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('الصورة يجب أن تكون أقل من 2MB'); return; }
    try {
      const b64 = await fileToBase64(file);
      onBase64(b64);
    } catch { toast.error('فشل في قراءة الصورة'); }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('الصورة يجب أن تكون أقل من 2MB'); return; }
    try { onBase64(await fileToBase64(file)); } catch { toast.error('فشل في قراءة الصورة'); }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
        <UploadCloud size={14} /> صورة توضيحية <span className="text-gray-400 font-normal">(اختياري · حتى 2MB)</span>
      </label>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <img src={preview} alt="معاينة" className="w-full max-h-48 object-contain bg-gray-100" />
          <button type="button"
            onClick={() => { onBase64(null); if (ref.current) ref.current.value = ''; }}
            className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow transition-colors">
            <X size={13} />
          </button>
          {converting && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                <Loader2 size={16} className="animate-spin" /> جاري المعالجة...
              </span>
            </div>
          )}
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all"
          onClick={() => ref.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <UploadCloud size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">اضغط لاختيار صورة أو اسحبها هنا</p>
          <p className="text-xs text-gray-300 mt-1">PNG · JPG · WebP · حتى 2MB</p>
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" className="sr-only" onChange={handleChange} />
    </div>
  );
};

// ── Expandable Row ────────────────────────────────────────────────────────────
const TicketRow: React.FC<{ ticket: TicketType }> = ({ ticket }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <td className="py-3 px-4"><span className="text-xs font-mono text-gray-400">#{ticket.id}</span></td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${ticket.categoryType === CategoryType.HARDWARE ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
              {ticket.categoryType === CategoryType.HARDWARE ? <Monitor size={14} /> : <Cpu size={14} />}
            </div>
            <p className="font-medium text-gray-800 text-sm line-clamp-1">{ticket.title}</p>
          </div>
        </td>
        <td className="py-3 px-4"><StatusBadge status={ticket.status} /></td>
        <td className="py-3 px-4 text-left">{open ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}</td>
      </tr>
      {open && (
        <tr className="bg-blue-50/30">
          <td colSpan={4} className="px-4 py-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Tag size={12} />
                {ticket.categoryType === CategoryType.HARDWARE ? 'عتاد' : 'برمجيات'} · {ticket.categorySubType}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar size={12} />
                {new Date(ticket.createdAt).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{ticket.description}</p>
              {ticket.imageUrl && (
                <img src={ticket.imageUrl} alt="صورة" className="w-full max-h-40 object-contain rounded-lg border border-gray-200 bg-white cursor-pointer"
                  onClick={() => window.open(ticket.imageUrl!, '_blank')} />
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const EmployeeDashboard: React.FC = () => {
  const { user, tickets, createTicket, logout, loading, loggingOut, refreshTickets } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [issueSubtypes, setIssueSubtypes] = useState<IssueSubtype[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issueTypeId, setIssueTypeId] = useState<number | null>(null);
  const [issueSubtypeId, setIssueSubtypeId] = useState<number | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    getIssueTypes()
      .then((t) => { setIssueTypes(t); if (t[0]) setIssueTypeId(t[0].id); })
      .catch(() => toast.error('فشل في تحميل أنواع المشاكل'));
  }, []);

  useEffect(() => {
    if (!issueTypeId) return;
    getIssueSubtypes(issueTypeId)
      .then((s) => { setIssueSubtypes(s); setIssueSubtypeId(s[0]?.id ?? null); })
      .catch(() => {});
  }, [issueTypeId]);

  const selectedIssueType = useMemo(() => issueTypes.find((t) => t.id === issueTypeId) ?? null, [issueTypeId, issueTypes]);
  if (!user) return null;

  const handleRefresh = async () => { setIsRefreshing(true); await refreshTickets(); setIsRefreshing(false); toast.info('تم التحديث'); };

  const resetForm = () => { setTitle(''); setDescription(''); setImageBase64(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTypeId) { toast.warning('يرجى اختيار نوع المشكلة'); return; }
    const ipAddress = await getRealIp();
    const ok = await createTicket({ title, description, imageUrl: imageBase64, issueTypeId, issueSubtypeId, ipAddress });
    if (ok) resetForm();
  };

  const switchIssueType = (code: CategoryType) => setIssueTypeId(issueTypes.find((i) => i.code === code)?.id ?? null);

  const counts = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === TicketStatus.OPEN).length,
    inProgress: tickets.filter((t) => t.status === TicketStatus.IN_PROGRESS).length,
    solved: tickets.filter((t) => t.status === TicketStatus.SOLVED).length,
  };

  // ── Logout overlay ────────────────────────────────────────────────────────
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
                <h1 className="text-base font-bold text-gray-900">نظام إدارة التذاكر</h1>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin size={11} />{user.provinceName} — {user.departmentName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)' }}>{user.fullName.charAt(0)}</div>
                <span className="text-sm font-medium text-gray-700">{user.fullName}</span>
              </div>
              <button onClick={handleRefresh} disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">تحديث</span>
              </button>
              <button onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                <LogOut size={15} /><span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'الإجمالي',     value: counts.total,     icon: <Ticket size={16} />,      color: 'text-gray-700',    bg: 'bg-gray-100' },
            { label: 'مفتوحة',       value: counts.open,       icon: <AlertCircle size={16} />, color: 'text-blue-600',    bg: 'bg-blue-50' },
            { label: 'قيد المعالجة', value: counts.inProgress, icon: <Clock size={16} />,       color: 'text-amber-600',   bg: 'bg-amber-50' },
            { label: 'تم حلها',      value: counts.solved,     icon: <CheckCircle size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-3 py-3 flex items-center gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg} ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Ticket size={16} className="text-blue-600" /> تذاكري
          </h2>
          <button onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)' }}>
            {showForm ? <><X size={15} /> إغلاق</> : <><Plus size={15} /> تذكرة جديدة</>}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)' }}>
              <div className="flex items-center gap-2 text-white">
                <FileText size={17} /><span className="font-semibold text-sm">تقديم تذكرة دعم فني</span>
              </div>
              <button onClick={resetForm} className="text-white/70 hover:text-white"><X size={19} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">نوع المشكلة</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { code: CategoryType.HARDWARE, label: 'عتاد', sub: 'Hardware', icon: <Monitor size={18} />, aB: 'border-orange-400 bg-orange-50', aT: 'text-orange-600' },
                    { code: CategoryType.SOFTWARE, label: 'برمجيات', sub: 'Software', icon: <Cpu size={18} />, aB: 'border-blue-500 bg-blue-50', aT: 'text-blue-600' },
                  ].map((o) => {
                    const active = selectedIssueType?.code === o.code;
                    return (
                      <label key={o.code} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${active ? o.aB : 'border-gray-200 bg-white'}`}>
                        <input type="radio" name="catType" checked={active} onChange={() => switchIssueType(o.code)} className="sr-only" />
                        <span className={active ? o.aT : 'text-gray-400'}>{o.icon}</span>
                        <div>
                          <p className={`text-sm font-semibold ${active ? o.aT : 'text-gray-700'}`}>{o.label}</p>
                          <p className="text-xs text-gray-400">{o.sub}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {issueSubtypes.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">التصنيف الفرعي</label>
                  <select value={issueSubtypeId ?? ''} onChange={(e) => setIssueSubtypeId(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {issueSubtypes.map((s) => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">عنوان المشكلة <span className="text-red-500">*</span></label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="عنوان مختصر وواضح" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">وصف تفصيلي <span className="text-red-500">*</span></label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="اشرح المشكلة بالتفصيل..." />
              </div>

              <ImageUploadField onBase64={setImageBase64} preview={imageBase64} converting={false} />

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={resetForm}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">إلغاء</button>
                <button type="submit" disabled={loading || !issueTypeId}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)' }}>
                  {loading ? <><Loader2 size={14} className="animate-spin" /> إرسال...</> : <><Send size={14} /> إرسال</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tickets Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {tickets.length === 0 ? (
            <div className="py-14 text-center">
              <Ticket className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">لا توجد تذاكر — أنشئ تذكرة جديدة</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500"><Hash size={11} className="inline ml-1" />رقم</th>
                  <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500">العنوان</th>
                  <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500">الحالة</th>
                  <th className="py-2.5 px-4 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((t) => <TicketRow key={t.id} ticket={t} />)}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
