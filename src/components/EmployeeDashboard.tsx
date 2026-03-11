import React, { useEffect, useMemo, useState } from 'react';
import { LogOut, Plus, Clock, Monitor, PenTool, X, Send, Image, FileText, Loader2, RefreshCw, Ticket } from 'lucide-react';
import { toast } from 'react-toastify';

import { useApp } from '../context/AppContext';
import { CategoryType, IssueSubtype, IssueType, TicketStatus } from '../types';
import { fetchPublicIp, getIssueSubtypes, getIssueTypes } from '../api/client';

const EmployeeDashboard: React.FC = () => {
  const { user, tickets, createTicket, logout, loading, refreshTickets } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [issueSubtypes, setIssueSubtypes] = useState<IssueSubtype[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [issueTypeId, setIssueTypeId] = useState<number | null>(null);
  const [issueSubtypeId, setIssueSubtypeId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadIssueTypes = async () => {
      try {
        const types = await getIssueTypes();
        setIssueTypes(types);
        if (types[0]) {
          setIssueTypeId(types[0].id);
        }
      } catch (error) {
        console.error('Failed to load issue types', error);
        toast.error('فشل في تحميل أنواع المشاكل');
      }
    };

    loadIssueTypes();
  }, []);

  useEffect(() => {
    if (!issueTypeId) return;

    const loadSubtypes = async () => {
      try {
        const subtypes = await getIssueSubtypes(issueTypeId);
        setIssueSubtypes(subtypes);
        setIssueSubtypeId(subtypes[0]?.id ?? null);
      } catch (error) {
        console.error('Failed to load issue subtypes', error);
      }
    };

    loadSubtypes();
  }, [issueTypeId]);

  const selectedIssueType = useMemo(
    () => issueTypes.find((type) => type.id === issueTypeId) || null,
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
    if (!issueTypeId) {
      toast.warning('يرجى اختيار نوع المشكلة');
      return;
    }

    const ipAddress = await fetchPublicIp();
    const success = await createTicket({
      title,
      description,
      imageUrl: imageUrl || null,
      issueTypeId,
      issueSubtypeId,
      ipAddress,
    });

    if (success) {
      setShowForm(false);
      setTitle('');
      setDescription('');
      setImageUrl('');
    }
  };

  const getStatusInfo = (status: TicketStatus) => {
    const statusMap = {
      [TicketStatus.OPEN]: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        label: 'مفتوحة',
        icon: '🔵'
      },
      [TicketStatus.IN_PROGRESS]: { 
        color: 'bg-amber-100 text-amber-800 border-amber-200', 
        label: 'قيد المعالجة',
        icon: '🟡'
      },
      [TicketStatus.SOLVED]: { 
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
        label: 'تم الحل',
        icon: '🟢'
      },
      [TicketStatus.POSTPONED]: { 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        label: 'مؤجلة',
        icon: '🟣'
      },
      [TicketStatus.CLOSED]: { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        label: 'مغلقة',
        icon: '⚫'
      },
    };
    return statusMap[status] || statusMap[TicketStatus.OPEN];
  };

  const switchIssueType = (code: CategoryType) => {
    const nextType = issueTypes.find((item) => item.code === code);
    setIssueTypeId(nextType?.id ?? null);
  };

  // Stats
  const openCount = tickets.filter(t => t.status === TicketStatus.OPEN).length;
  const inProgressCount = tickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length;
  const solvedCount = tickets.filter(t => t.status === TicketStatus.SOLVED).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">لوحة الموظف</h1>
                <p className="text-xs text-gray-500">{user.provinceName} - {user.departmentName}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.fullName.charAt(0)}
              </div>
              <span className="text-gray-700 font-medium">{user.fullName}</span>
            </div>
            <button 
              onClick={logout} 
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-all"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">مفتوحة</p>
                <p className="text-2xl font-bold text-blue-600">{openCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">قيد المعالجة</p>
                <p className="text-2xl font-bold text-amber-600">{inProgressCount}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">تم حلها</p>
                <p className="text-2xl font-bold text-emerald-600">{solvedCount}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">تذاكري</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <Plus size={20} />
              إنشاء تذكرة
            </button>
          </div>
        </div>

        {/* Create Ticket Form */}
        {showForm && (
          <div className="mb-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="text-white" size={24} />
                <h3 className="text-lg font-bold text-white">تذكرة جديدة</h3>
              </div>
              <button 
                onClick={() => setShowForm(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Issue Type Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-3">نوع المشكلة</label>
                  <div className="flex gap-3">
                    <label
                      className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        (selectedIssueType?.code || CategoryType.HARDWARE) === CategoryType.HARDWARE 
                          ? 'border-orange-500 bg-orange-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="catType"
                        checked={(selectedIssueType?.code || CategoryType.HARDWARE) === CategoryType.HARDWARE}
                        onChange={() => switchIssueType(CategoryType.HARDWARE)}
                        className="sr-only"
                      />
                      <Monitor size={24} className={`${(selectedIssueType?.code || CategoryType.HARDWARE) === CategoryType.HARDWARE ? 'text-orange-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${(selectedIssueType?.code || CategoryType.HARDWARE) === CategoryType.HARDWARE ? 'text-orange-700' : 'text-gray-600'}`}>عتاد (Hardware)</span>
                    </label>
                    <label
                      className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedIssueType?.code === CategoryType.SOFTWARE 
                          ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="catType"
                        checked={selectedIssueType?.code === CategoryType.SOFTWARE}
                        onChange={() => switchIssueType(CategoryType.SOFTWARE)}
                        className="sr-only"
                      />
                      <PenTool size={24} className={`${selectedIssueType?.code === CategoryType.SOFTWARE ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${selectedIssueType?.code === CategoryType.SOFTWARE ? 'text-indigo-700' : 'text-gray-600'}`}>برمجيات (Software)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-3">التصنيف الفرعي</label>
                  <select
                    value={issueSubtypeId ?? ''}
                    onChange={(e) => setIssueSubtypeId(Number(e.target.value))}
                    className="w-full rounded-xl border-2 border-gray-200 p-3.5 focus:border-blue-500 focus:ring-0 transition-colors bg-white"
                  >
                    {issueSubtypes.map((subtype) => (
                      <option key={subtype.id} value={subtype.id}>
                        {subtype.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">عنوان المشكلة</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 p-3.5 focus:border-blue-500 focus:ring-0 transition-colors"
                  placeholder="اكتب عنوان مختصر وواضح للمشكلة..."
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">وصف تفصيلي</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border-2 border-gray-200 p-3.5 focus:border-blue-500 focus:ring-0 transition-colors resize-none"
                  placeholder="اشرح المشكلة بالتفصيل... متى بدأت؟ ما هي الأعراض؟ هل جربت أي حلول؟"
                  required
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Image size={18} />
                  رابط صورة (اختياري)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 p-3.5 focus:border-blue-500 focus:ring-0 transition-colors"
                  placeholder="https://example.com/screenshot.png"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading || !issueTypeId}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      إرسال التذكرة
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tickets List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {tickets.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد تذاكر</h3>
              <p className="text-gray-400">قم بإنشاء تذكرة جديدة للإبلاغ عن مشكلة</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {tickets.map((ticket) => {
                const statusInfo = getStatusInfo(ticket.status);
                return (
                  <li key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <div className="px-6 py-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${
                              ticket.categoryType === CategoryType.HARDWARE 
                                ? 'bg-orange-100 text-orange-600' 
                                : 'bg-indigo-100 text-indigo-600'
                            }`}
                          >
                            {ticket.categoryType === CategoryType.HARDWARE ? <Monitor size={22} /> : <PenTool size={22} />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-1">{ticket.title}</h4>
                            <p className="text-sm text-gray-500">
                              {ticket.categoryType === CategoryType.HARDWARE ? 'عتاد' : 'برمجيات'} • {ticket.categorySubType}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${statusInfo.color}`}>
                            {statusInfo.icon} {statusInfo.label}
                          </span>
                          <div className="flex items-center text-sm text-gray-400">
                            <Clock size={14} className="ml-1" />
                            <time>{new Date(ticket.createdAt).toLocaleDateString('ar-EG')}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;