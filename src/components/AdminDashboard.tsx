import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TicketStatus, Role, Ticket } from '../types';
import { LogOut, CheckCircle, Clock, AlertCircle, XCircle, PauseCircle, Monitor, PenTool } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user, tickets, updateStatus, logout } = useApp();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  if (!user) return null;

  // Filter tickets by status
  const openTickets = tickets.filter(t => t.status === TicketStatus.OPEN);
  const progressTickets = tickets.filter(t => t.status === TicketStatus.IN_PROGRESS);
  const solvedTickets = tickets.filter(t => t.status === TicketStatus.SOLVED);
  const postponedTickets = tickets.filter(t => t.status === TicketStatus.POSTPONED);
  const closedTickets = tickets.filter(t => t.status === TicketStatus.CLOSED);

  const stats = [
    { label: 'مفتوحة', count: openTickets.length, color: 'bg-blue-500', icon: <AlertCircle className="text-white" /> },
    { label: 'قيد المعالجة', count: progressTickets.length, color: 'bg-yellow-500', icon: <Clock className="text-white" /> },
    { label: 'تم الحل', count: solvedTickets.length, color: 'bg-green-500', icon: <CheckCircle className="text-white" /> },
    { label: 'مؤجلة', count: postponedTickets.length, color: 'bg-purple-500', icon: <PauseCircle className="text-white" /> },
    { label: 'مغلقة', count: closedTickets.length, color: 'bg-gray-500', icon: <XCircle className="text-white" /> },
  ];

  const handleStatusChange = async (id: number, newStatus: TicketStatus) => {
    await updateStatus(id, newStatus);
    if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket({...selectedTicket, status: newStatus});
    }
  };

  const TicketCard: React.FC<{ ticket: Ticket }> = ({ ticket }) => (
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3 space-x-reverse">
            <div className={`p-2 rounded-full ${ticket.categoryType === 'HARDWARE' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {ticket.categoryType === 'HARDWARE' ? <Monitor size={18} /> : <PenTool size={18} />}
            </div>
            <div>
                <h4 className="font-bold text-gray-800">{ticket.title}</h4>
                <p className="text-xs text-gray-500">{ticket.userName} - {ticket.provinceName}</p>
            </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
            ticket.status === TicketStatus.OPEN ? 'bg-blue-100 text-blue-800' :
            ticket.status === TicketStatus.IN_PROGRESS ? 'bg-yellow-100 text-yellow-800' :
            ticket.status === TicketStatus.SOLVED ? 'bg-green-100 text-green-800' :
            ticket.status === TicketStatus.POSTPONED ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
        }`}>
            {ticket.status}
        </span>
      </div>
      <div className="mt-2 text-sm text-gray-600 line-clamp-2">
        {ticket.description}
      </div>
      <div className="mt-3 flex justify-between items-center text-xs text-gray-400">
        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
        <span>IP: {ticket.ipAddress || 'N/A'}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    {user.role === Role.SUPERADMIN ? 'لوحة تحكم المالك' : 'لوحة تحكم المدير'}
                </h1>
                {user.role === Role.ADMIN && (
                    <span className="text-sm text-gray-500">محافظة: {user.provinceName}</span>
                )}
            </div>
            <button onClick={logout} className="text-red-600 hover:text-red-800 flex items-center">
                <LogOut className="ml-2" /> خروج
            </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {stats.map((stat) => (
                <div key={stat.label} className={`${stat.color} rounded-lg shadow-lg p-4 text-white flex items-center justify-between`}>
                    <div>
                        <p className="text-sm opacity-80">{stat.label}</p>
                        <p className="text-3xl font-bold">{stat.count}</p>
                    </div>
                    <div className="text-white opacity-50">
                        {stat.icon}
                    </div>
                </div>
            ))}
        </div>

        {/* Kanban / Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Open Tickets */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-700 mb-4 flex items-center"><AlertCircle size={18} className="ml-2"/> تذاكر مفتوحة (Open)</h3>
                <div className="space-y-3">
                    {openTickets.map(t => <TicketCard key={t.id} ticket={t} />)}
                    {openTickets.length === 0 && <p className="text-gray-400 text-sm text-center">لا توجد تذاكر مفتوحة</p>}
                </div>
            </div>

             {/* In Progress */}
             <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-yellow-700 mb-4 flex items-center"><Clock size={18} className="ml-2"/> قيد المعالجة (In Progress)</h3>
                <div className="space-y-3">
                    {progressTickets.map(t => <TicketCard key={t.id} ticket={t} />)}
                    {progressTickets.length === 0 && <p className="text-gray-400 text-sm text-center">لا توجد تذاكر قيد المعالجة</p>}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
             {/* Solved */}
             <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-green-700 mb-4 flex items-center"><CheckCircle size={18} className="ml-2"/> تم الحل (Solved)</h3>
                <div className="space-y-3">
                    {solvedTickets.map(t => <TicketCard key={t.id} ticket={t} />)}
                </div>
            </div>

            {/* Postponed */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-purple-700 mb-4 flex items-center"><PauseCircle size={18} className="ml-2"/> مؤجلة (Postponed)</h3>
                <div className="space-y-3">
                    {postponedTickets.map(t => <TicketCard key={t.id} ticket={t} />)}
                </div>
            </div>

            {/* Closed */}
             <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center"><XCircle size={18} className="ml-2"/> مغلقة (Closed)</h3>
                <div className="space-y-3">
                    {closedTickets.map(t => <TicketCard key={t.id} ticket={t} />)}
                </div>
            </div>
        </div>
      </main>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">{selectedTicket.title}</h2>
                        <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                        <div><span className="font-semibold">المرسل:</span> {selectedTicket.userName}</div>
                        <div><span className="font-semibold">المحافظة:</span> {selectedTicket.provinceName}</div>
                        <div><span className="font-semibold">الدائرة:</span> {selectedTicket.departmentName}</div>
                        <div><span className="font-semibold">التاريخ:</span> {new Date(selectedTicket.createdAt).toLocaleString()}</div>
                        <div><span className="font-semibold">IP:</span> {selectedTicket.ipAddress}</div>
                        <div><span className="font-semibold">التصنيف:</span> {selectedTicket.categoryType} / {selectedTicket.categorySubType}</div>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-800 mb-2">الوصف:</h3>
                        <p className="bg-gray-50 p-3 rounded text-gray-700">{selectedTicket.description}</p>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-gray-800 mb-3">تغيير الحالة:</h3>
                        <div className="flex flex-wrap gap-2">
                            {Object.values(TicketStatus).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(selectedTicket.id, status as TicketStatus)}
                                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                                        selectedTicket.status === status 
                                        ? 'bg-blue-600 text-white ring-2 ring-blue-300' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
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
