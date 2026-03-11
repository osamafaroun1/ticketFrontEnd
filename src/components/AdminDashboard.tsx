import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TicketStatus, Role, Ticket, CategoryType } from '../types';
import { 
  LogOut, CheckCircle, Clock, AlertCircle, XCircle, PauseCircle, 
  Monitor, PenTool, RefreshCw, Filter, Search, Ticket as TicketIcon,
  ChevronLeft, User, MapPin, Building, Calendar, Globe, X
} from 'lucide-react';
import { toast } from 'react-toastify';

const AdminDashboard: React.FC = () => {
  const { user, tickets, updateStatus, logout, refreshTickets, loading } = useApp();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');

  if (!user) return null;

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ticket.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group by status
  const groupedTickets = {
    [TicketStatus.OPEN]: filteredTickets.filter(t => t.status === TicketStatus.OPEN),
    [TicketStatus.IN_PROGRESS]: filteredTickets.filter(t => t.status === TicketStatus.IN_PROGRESS),
    [TicketStatus.SOLVED]: filteredTickets.filter(t => t.status === TicketStatus.SOLVED),
    [TicketStatus.POSTPONED]: filteredTickets.filter(t => t.status === TicketStatus.POSTPONED),
    [TicketStatus.CLOSED]: filteredTickets.filter(t => t.status === TicketStatus.CLOSED),
  };

  const stats = [
    { 
      key: TicketStatus.OPEN,
      label: 'مفتوحة', 
      count: groupedTickets[TicketStatus.OPEN].length, 
      gradient: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      icon: <AlertCircle size={24} /> 
    },
    { 
      key: TicketStatus.IN_PROGRESS,
      label: 'قيد المعالجة', 
      count: groupedTickets[TicketStatus.IN_PROGRESS].length, 
      gradient: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50',
      icon: <Clock size={24} /> 
    },
    { 
      key: TicketStatus.SOLVED,
      label: 'تم الحل', 
      count: groupedTickets[TicketStatus.SOLVED].length, 
      gradient: 'from-emerald-500 to-green-600',
      bgLight: 'bg-emerald-50',
      icon: <CheckCircle size={24} /> 
    },
    { 
      key: TicketStatus.POSTPONED,
      label: 'مؤجلة', 
      count: groupedTickets[TicketStatus.POSTPONED].length, 
      gradient: 'from-purple-500 to-violet-600',
      bgLight: 'bg-purple-50',
      icon: <PauseCircle size={24} /> 
    },
    { 
      key: TicketStatus.CLOSED,
      label: 'مغلقة', 
      count: groupedTickets[TicketStatus.CLOSED].length, 
      gradient: 'from-gray-500 to-gray-600',
      bgLight: 'bg-gray-100',
      icon: <XCircle size={24} /> 
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTickets();
    setIsRefreshing(false);
    toast.info('تم تحديث البيانات');
  };

  const handleStatusChange = async (id: number, newStatus: TicketStatus) => {
    const success = await updateStatus(id, newStatus);
    if (success && selectedTicket && selectedTicket.id === id) {
      setSelectedTicket({...selectedTicket, status: newStatus});
    }
  };

  const getStatusStyle = (status: TicketStatus) => {
    const styles = {
      [TicketStatus.OPEN]: 'bg-blue-100 text-blue-800 border-blue-200',
      [TicketStatus.IN_PROGRESS]: 'bg-amber-100 text-amber-800 border-amber-200',
      [TicketStatus.SOLVED]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      [TicketStatus.POSTPONED]: 'bg-purple-100 text-purple-800 border-purple-200',
      [TicketStatus.CLOSED]: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return styles[status];
  };

  const getStatusLabel = (status: TicketStatus) => {
    const labels = {
      [TicketStatus.OPEN]: 'مفتوحة',
      [TicketStatus.IN_PROGRESS]: 'قيد المعالجة',
      [TicketStatus.SOLVED]: 'تم الحل',
      [TicketStatus.POSTPONED]: 'مؤجلة',
      [TicketStatus.CLOSED]: 'مغلقة',
    };
    return labels[status];
  };

  const TicketCard: React.FC<{ ticket: Ticket }> = ({ ticket }) => (
    <div 
      className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
      onClick={() => setSelectedTicket(ticket)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${ticket.categoryType === CategoryType.HARDWARE ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
            {ticket.categoryType === CategoryType.HARDWARE ? <Monitor size={18} /> : <PenTool size={18} />}
          </div>
          <div>
            <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1">{ticket.title}</h4>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <User size={12} /> {ticket.userName}
            </p>
          </div>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getStatusStyle(ticket.status)}`}>
          {getStatusLabel(ticket.status)}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{ticket.description}</p>
      
      <div className="flex justify-between items-center text-xs text-gray-400 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1">
          <MapPin size={12} />
          <span>{ticket.provinceName}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          <span>{new Date(ticket.createdAt).toLocaleDateString('ar-EG')}</span>
        </div>
      </div>
      
      {/* Hover indicator */}
      <div className="flex items-center justify-center mt-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs">عرض التفاصيل</span>
        <ChevronLeft size={14} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <TicketIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {user.role === Role.SUPERADMIN ? 'لوحة تحكم المالك' : 'لوحة تحكم المدير'}
                </h1>
                {user.role === Role.ADMIN && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin size={14} /> {user.provinceName}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">تحديث</span>
              </button>
              
              <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user.fullName.charAt(0)}
                </div>
                <span className="text-gray-700 font-medium">{user.fullName}</span>
              </div>
              
              <button 
                onClick={logout} 
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-all"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {stats.map((stat) => (
            <div 
              key={stat.key} 
              className={`bg-gradient-to-br ${stat.gradient} rounded-2xl shadow-lg p-5 text-white cursor-pointer hover:shadow-xl hover:scale-105 transition-all`}
              onClick={() => setStatusFilter(statusFilter === stat.key ? 'ALL' : stat.key)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.count}</p>
                </div>
                <div className="opacity-50">
                  {stat.icon}
                </div>
              </div>
              {statusFilter === stat.key && (
                <div className="mt-2 text-xs bg-white/20 rounded-full px-2 py-1 inline-block">
                  تصفية نشطة
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="بحث في التذاكر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'ALL')}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">جميع الحالات</option>
                {Object.values(TicketStatus).map(status => (
                  <option key={status} value={status}>{getStatusLabel(status)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Open & In Progress Column */}
          <div className="space-y-6">
            {/* Open Tickets */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-blue-100">
              <h3 className="font-bold text-blue-700 mb-4 flex items-center gap-2 pb-3 border-b border-blue-100">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <AlertCircle size={18} />
                </div>
                مفتوحة
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full mr-auto">
                  {groupedTickets[TicketStatus.OPEN].length}
                </span>
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {groupedTickets[TicketStatus.OPEN].map(t => <TicketCard key={t.id} ticket={t} />)}
                {groupedTickets[TicketStatus.OPEN].length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-8">لا توجد تذاكر مفتوحة</p>
                )}
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-amber-100">
              <h3 className="font-bold text-amber-700 mb-4 flex items-center gap-2 pb-3 border-b border-amber-100">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock size={18} />
                </div>
                قيد المعالجة
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full mr-auto">
                  {groupedTickets[TicketStatus.IN_PROGRESS].length}
                </span>
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {groupedTickets[TicketStatus.IN_PROGRESS].map(t => <TicketCard key={t.id} ticket={t} />)}
                {groupedTickets[TicketStatus.IN_PROGRESS].length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-8">لا توجد تذاكر قيد المعالجة</p>
                )}
              </div>
            </div>
          </div>

          {/* Solved Column */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-emerald-100">
            <h3 className="font-bold text-emerald-700 mb-4 flex items-center gap-2 pb-3 border-b border-emerald-100">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle size={18} />
              </div>
              تم الحل
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full mr-auto">
                {groupedTickets[TicketStatus.SOLVED].length}
              </span>
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {groupedTickets[TicketStatus.SOLVED].map(t => <TicketCard key={t.id} ticket={t} />)}
              {groupedTickets[TicketStatus.SOLVED].length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">لا توجد تذاكر محلولة</p>
              )}
            </div>
          </div>

          {/* Postponed & Closed Column */}
          <div className="space-y-6">
            {/* Postponed */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-purple-100">
              <h3 className="font-bold text-purple-700 mb-4 flex items-center gap-2 pb-3 border-b border-purple-100">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <PauseCircle size={18} />
                </div>
                مؤجلة
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full mr-auto">
                  {groupedTickets[TicketStatus.POSTPONED].length}
                </span>
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {groupedTickets[TicketStatus.POSTPONED].map(t => <TicketCard key={t.id} ticket={t} />)}
                {groupedTickets[TicketStatus.POSTPONED].length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">لا توجد تذاكر مؤجلة</p>
                )}
              </div>
            </div>

            {/* Closed */}
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-200">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 pb-3 border-b border-gray-200">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <XCircle size={18} />
                </div>
                مغلقة
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full mr-auto">
                  {groupedTickets[TicketStatus.CLOSED].length}
                </span>
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {groupedTickets[TicketStatus.CLOSED].map(t => <TicketCard key={t.id} ticket={t} />)}
                {groupedTickets[TicketStatus.CLOSED].length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">لا توجد تذاكر مغلقة</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTicket(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${selectedTicket.categoryType === CategoryType.HARDWARE ? 'bg-white/20' : 'bg-white/20'}`}>
                    {selectedTicket.categoryType === CategoryType.HARDWARE ? <Monitor size={24} className="text-white" /> : <PenTool size={24} className="text-white" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedTicket.title}</h2>
                    <p className="text-blue-100 text-sm mt-1">تذكرة #{selectedTicket.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTicket(null)} 
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <User size={16} />
                    المرسل
                  </div>
                  <p className="font-semibold text-gray-800">{selectedTicket.userName}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <MapPin size={16} />
                    المحافظة
                  </div>
                  <p className="font-semibold text-gray-800">{selectedTicket.provinceName}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Building size={16} />
                    الدائرة
                  </div>
                  <p className="font-semibold text-gray-800">{selectedTicket.departmentName}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Calendar size={16} />
                    التاريخ
                  </div>
                  <p className="font-semibold text-gray-800">{new Date(selectedTicket.createdAt).toLocaleString('ar-EG')}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Globe size={16} />
                    عنوان IP
                  </div>
                  <p className="font-semibold text-gray-800 font-mono">{selectedTicket.ipAddress || 'غير متوفر'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    {selectedTicket.categoryType === CategoryType.HARDWARE ? <Monitor size={16} /> : <PenTool size={16} />}
                    التصنيف
                  </div>
                  <p className="font-semibold text-gray-800">
                    {selectedTicket.categoryType === CategoryType.HARDWARE ? 'عتاد' : 'برمجيات'} / {selectedTicket.categorySubType}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                  وصف المشكلة
                </h3>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Status Change */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 bg-green-500 rounded-full"></div>
                  تغيير الحالة
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.values(TicketStatus).map((status) => {
                    const isActive = selectedTicket.status === status;
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedTicket.id, status)}
                        disabled={loading}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                          isActive 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg ring-2 ring-blue-300' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
                        } disabled:opacity-50`}
                      >
                        {status === TicketStatus.OPEN && <AlertCircle size={16} />}
                        {status === TicketStatus.IN_PROGRESS && <Clock size={16} />}
                        {status === TicketStatus.SOLVED && <CheckCircle size={16} />}
                        {status === TicketStatus.POSTPONED && <PauseCircle size={16} />}
                        {status === TicketStatus.CLOSED && <XCircle size={16} />}
                        {getStatusLabel(status)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;