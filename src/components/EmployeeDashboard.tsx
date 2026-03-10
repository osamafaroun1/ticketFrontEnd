import React, { useEffect, useMemo, useState } from 'react';
import { LogOut, Plus, Clock, Monitor, PenTool } from 'lucide-react';

import { useApp } from '../context/AppContext';
import { CategoryType, IssueSubtype, IssueType, TicketStatus } from '../types';
import { fetchPublicIp, getIssueSubtypes, getIssueTypes } from '../api/client';

const EmployeeDashboard: React.FC = () => {
  const { user, tickets, createTicket, logout, loading } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [issueSubtypes, setIssueSubtypes] = useState<IssueSubtype[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [issueTypeId, setIssueTypeId] = useState<number | null>(null);
  const [issueSubtypeId, setIssueSubtypeId] = useState<number | null>(null);

  useEffect(() => {
    const loadIssueTypes = async () => {
      const types = await getIssueTypes();
      setIssueTypes(types);
      if (types[0]) {
        setIssueTypeId(types[0].id);
      }
    };

    loadIssueTypes().catch((error) => {
      console.error('Failed to load issue types', error);
    });
  }, []);

  useEffect(() => {
    if (!issueTypeId) return;

    const loadSubtypes = async () => {
      const subtypes = await getIssueSubtypes(issueTypeId);
      setIssueSubtypes(subtypes);
      setIssueSubtypeId(subtypes[0]?.id ?? null);
    };

    loadSubtypes().catch((error) => {
      console.error('Failed to load issue subtypes', error);
    });
  }, [issueTypeId]);

  const selectedIssueType = useMemo(
    () => issueTypes.find((type) => type.id === issueTypeId) || null,
    [issueTypeId, issueTypes]
  );

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTypeId) return;

    const ipAddress = await fetchPublicIp();
    await createTicket({
      title,
      description,
      imageUrl: imageUrl || null,
      issueTypeId,
      issueSubtypeId,
      ipAddress,
    });

    setShowForm(false);
    setTitle('');
    setDescription('');
    setImageUrl('');
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return 'bg-blue-100 text-blue-800';
      case TicketStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case TicketStatus.SOLVED:
        return 'bg-green-100 text-green-800';
      case TicketStatus.POSTPONED:
        return 'bg-purple-100 text-purple-800';
      case TicketStatus.CLOSED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const switchIssueType = (code: CategoryType) => {
    const nextType = issueTypes.find((item) => item.code === code);
    setIssueTypeId(nextType?.id ?? null);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 space-x-reverse">
            <h1 className="text-2xl font-bold text-gray-900">نظام التذاكر - الموظف</h1>
            <span className="rounded bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              {user.provinceName} - {user.departmentName}
            </span>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <span className="text-gray-600">مرحباً, {user.fullName}</span>
            <button onClick={logout} className="flex items-center text-red-600 hover:text-red-800">
              <LogOut size={18} className="ml-1" /> خروج
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">تذاكري</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700"
          >
            <Plus size={20} className="ml-2" /> إنشاء تذكرة جديدة
          </button>
        </div>

        {showForm && (
          <div className="mb-8 rounded-lg border-t-4 border-blue-500 bg-white p-6 shadow-md">
            <h3 className="mb-4 text-lg font-bold text-gray-800">تفاصيل المشكلة</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium text-gray-700">نوع العطل</label>
                  <div className="flex space-x-4 space-x-reverse">
                    <label
                      className={`flex cursor-pointer items-center rounded-lg border p-3 ${(selectedIssueType?.code || CategoryType.HARDWARE) === CategoryType.HARDWARE ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <input
                        type="radio"
                        name="catType"
                        checked={(selectedIssueType?.code || CategoryType.HARDWARE) === CategoryType.HARDWARE}
                        onChange={() => switchIssueType(CategoryType.HARDWARE)}
                        className="ml-2"
                      />
                      <Monitor size={18} className="ml-1 text-gray-600" />
                      <span>عتاد</span>
                    </label>
                    <label
                      className={`flex cursor-pointer items-center rounded-lg border p-3 ${(selectedIssueType?.code || CategoryType.HARDWARE) === CategoryType.SOFTWARE ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <input
                        type="radio"
                        name="catType"
                        checked={(selectedIssueType?.code || CategoryType.HARDWARE) === CategoryType.SOFTWARE}
                        onChange={() => switchIssueType(CategoryType.SOFTWARE)}
                        className="ml-2"
                      />
                      <PenTool size={18} className="ml-1 text-gray-600" />
                      <span>برمجيات</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-medium text-gray-700">التصنيف الفرعي</label>
                  <select
                    value={issueSubtypeId ?? ''}
                    onChange={(e) => setIssueSubtypeId(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {issueSubtypes.map((subtype) => (
                      <option key={subtype.id} value={subtype.id}>
                        {subtype.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block font-medium text-gray-700">عنوان المشكلة</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="وصف مختصر للمشكلة..."
                  required
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-gray-700">وصف تفصيلي</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="يرجى شرح المشكلة بالتفصيل..."
                  required
                />
              </div>

              <div>
                <label className="mb-2 block font-medium text-gray-700">رابط صورة المشكلة (اختياري)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://example.com/ticket-image.jpg"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="ml-3 px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading || !issueTypeId}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {loading ? 'جاري الإرسال...' : 'إرسال التذكرة'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-hidden bg-white shadow sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {tickets.length === 0 ? (
              <li className="p-6 text-center text-gray-500">لا توجد تذاكر حالياً</li>
            ) : (
              tickets.map((ticket) => (
                <li key={ticket.id}>
                  <div className="px-4 py-4 transition duration-150 ease-in-out hover:bg-gray-50 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${ticket.categoryType === CategoryType.HARDWARE ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}
                        >
                          {ticket.categoryType === CategoryType.HARDWARE ? <Monitor size={20} /> : <PenTool size={20} />}
                        </div>
                        <div className="mr-4">
                          <p className="truncate text-sm font-medium text-blue-600">{ticket.title}</p>
                          <p className="text-sm text-gray-500">
                            {ticket.categoryType === CategoryType.HARDWARE ? 'عتاد' : 'برمجيات'} - {ticket.categorySubType}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <Clock size={14} className="ml-1" />
                          <time>{new Date(ticket.createdAt).toLocaleDateString('ar-EG')}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
