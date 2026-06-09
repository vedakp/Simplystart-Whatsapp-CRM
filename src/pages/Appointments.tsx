import React, { useState, useEffect } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, User, Phone, AlignLeft, Edit2, Trash2, X, MessageSquare } from 'lucide-react';
import { cn } from '../utils';
import { format, addMonths, subMonths, startOfMonth, startOfWeek, endOfMonth, endOfWeek, isSameMonth, isSameDay, addDays, subDays, addWeeks, subWeeks, startOfDay, isWithinInterval, parseISO } from 'date-fns';

type Appointment = {
  id: string;
  title: string;
  contactName: string;
  contactPhone: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  status: string;
  notes: string;
};

type ViewMode = 'Month' | 'Week' | 'Day';

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [syncingContacts, setSyncingContacts] = useState(false);
  const [contactSearchOpen, setContactSearchOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredContacts = contacts.filter(c => 
    (c.name || '').toLowerCase().includes(contactSearch.toLowerCase()) || 
    (c.phone || '').includes(contactSearch)
  );

  const [formData, setFormData] = useState<Partial<Appointment>>({
    title: '',
    contactName: '',
    contactPhone: '',
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
    status: 'Scheduled',
    notes: ''
  });

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      setAppointments(data);
    } catch (e) {
      console.error(e);
    } finally {
      if (loading) setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      setContacts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchContacts();
  }, []);

  const handleSyncContacts = async () => {
    setSyncingContacts(true);
    try {
      await fetch('/api/contacts/sync', { method: 'POST' });
      await fetchContacts();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingContacts(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/appointments/${editingId}` : '/api/appointments';
    const method = editingId ? 'PUT' : 'POST';

    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setIsModalOpen(false);
      setEditingId(null);
      fetchAppointments();
    } catch (e) {}
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this appointment?")) return;
    try {
      await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
      fetchAppointments();
    } catch (e) {}
  };

  const openForm = (appt?: Appointment) => {
    if (appt) {
      setEditingId(appt.id);
      setFormData(appt);
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        contactName: '',
        contactPhone: '',
        startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
        status: 'Scheduled',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const nextDate = () => {
    if (viewMode === 'Month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'Week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prevDate = () => {
    if (viewMode === 'Month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'Week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayAppointments = appointments.filter(a => isSameDay(parseISO(a.startTime), cloneDay));
        days.push(
          <div key={day.toString()} className={cn("min-h-[100px] border border-slate-200 dark:border-white/5 p-2 bg-white dark:bg-black/20", !isSameMonth(day, monthStart) && "text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-black/10")} >
            <span className={cn("text-xs font-bold", isSameDay(day, new Date()) ? "text-primary-500" : "text-slate-700 dark:text-slate-300")}>{format(day, 'd')}</span>
            <div className="mt-2 space-y-1">
              {dayAppointments.map(appt => (
                <div key={appt.id} onClick={() => openForm(appt)} className="cursor-pointer px-2 py-1 text-[10px] bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded truncate font-medium">
                  {format(parseISO(appt.startTime), 'HH:mm')} - {appt.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div key={day.toString()} className="grid grid-cols-7">{days}</div>);
      days = [];
    }

    return (
      <div className="flex flex-col flex-1 bg-white dark:bg-[#07080a] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden mt-6">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/40">
          {daysOfWeek.map(d => <div key={d} className="p-3 text-center text-xs font-bold text-slate-500 uppercase">{d}</div>)}
        </div>
        <div>{rows}</div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const endDate = endOfWeek(currentDate);
    const days = [];
    let day = startDate;

    while (day <= endDate) {
      const cloneDay = day;
      const dayAppointments = appointments.filter(a => isSameDay(parseISO(a.startTime), cloneDay));
      days.push(
        <div key={day.toString()} className="flex-1 min-w-[120px] border-r border-slate-200 dark:border-white/5 last:border-0 p-4">
          <div className="text-center mb-4">
             <div className="text-xs uppercase font-bold text-slate-500 mb-1">{format(day, 'EEE')}</div>
             <div className={cn("text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center mx-auto", isSameDay(day, new Date()) ? "bg-primary-500 text-white" : "text-slate-900 dark:text-white")}>{format(day, 'd')}</div>
          </div>
          <div className="space-y-3">
             {dayAppointments.map(appt => (
                <div key={appt.id} className="p-3 border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-black/20 shadow-sm relative group">
                  <div className="text-xs font-bold text-primary-500">{format(parseISO(appt.startTime), 'HH:mm')}</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">{appt.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{appt.contactName}</div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                    <button onClick={() => openForm(appt)} className="p-1.5 text-slate-500 hover:text-primary-500 bg-white dark:bg-black rounded-full border border-slate-200 dark:border-white/10 shadow"><Edit2 className="w-3 h-3"/></button>
                    <button onClick={() => handleDelete(appt.id)} className="p-1.5 text-slate-500 hover:text-red-500 bg-white dark:bg-black rounded-full border border-slate-200 dark:border-white/10 shadow"><Trash2 className="w-3 h-3"/></button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }

    return (
       <div className="flex overflow-x-auto bg-white dark:bg-[#07080a] border border-slate-200 dark:border-white/5 rounded-2xl min-h-[500px] mt-6">
         {days}
       </div>
    );
  };

  const renderDayView = () => {
    const dayAppointments = appointments.filter(a => isSameDay(parseISO(a.startTime), currentDate));
    dayAppointments.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    return (
      <div className="mt-6 bg-white dark:bg-[#07080a] border border-slate-200 dark:border-white/5 rounded-2xl p-6">
         <h3 className="font-bold tracking-tight text-xl text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-white/5 pb-4">Schedule for {format(currentDate, 'MMMM d, yyyy')}</h3>
         
         {dayAppointments.length === 0 ? (
           <p className="text-slate-500 dark:text-slate-400 py-10 text-center">No appointments scheduled for this day.</p>
         ) : (
           <div className="space-y-4">
             {dayAppointments.map(appt => (
                <div key={appt.id} className="flex items-start p-4 border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-black/20 hover:border-primary-500/30 transition-colors group">
                   <div className="w-24 shrink-0 border-r border-slate-200 dark:border-white/10 pr-4 mr-4 text-center">
                     <div className="font-bold text-slate-900 dark:text-white">{format(parseISO(appt.startTime), 'HH:mm')}</div>
                     <div className="text-xs text-slate-500 mt-1">to {format(parseISO(appt.endTime), 'HH:mm')}</div>
                   </div>
                   <div className="flex-1">
                     <h4 className="font-bold text-lg text-slate-900 dark:text-white">{appt.title}</h4>
                     <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                       <span className="flex items-center"><User className="w-3.5 h-3.5 mr-1.5"/>{appt.contactName}</span>
                       <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1.5"/>{appt.contactPhone}</span>
                     </div>
                     {appt.notes && <p className="text-sm mt-3 text-slate-500 flex items-start"><AlignLeft className="w-3.5 h-3.5 mr-1.5 mt-0.5 shrink-0"/>{appt.notes}</p>}
                   </div>
                   <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                      <button onClick={() => openForm(appt)} className="p-2 bg-white dark:bg-black text-slate-600 dark:text-slate-400 hover:text-primary-500 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(appt.id)} className="p-2 bg-white dark:bg-black text-slate-600 dark:text-slate-400 hover:text-red-500 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm"><Trash2 className="w-4 h-4"/></button>
                   </div>
                </div>
             ))}
           </div>
         )}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col h-screen overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-bold tracking-tight text-3xl text-slate-900 dark:text-white flex items-center">
             <Calendar className="w-8 h-8 mr-3 text-primary-500" />
             Appointments
          </h2>
          <p className="text-slate-500 mt-2">Manage your calendar and daily meetings.</p>
        </div>
        <button 
          onClick={() => openForm()}
          className="flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-full font-semibold transition-colors shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Appointment
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-[#07080a] border border-slate-200 dark:border-white/5 p-4 rounded-xl">
         <div className="flex items-center space-x-4">
           <button onClick={prevDate} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors">
              <ChevronLeft className="w-5 h-5"/>
           </button>
           <h3 className="text-lg font-bold min-w-[150px] text-center text-slate-900 dark:text-white">
             {viewMode === 'Month' ? format(currentDate, 'MMMM yyyy') : 
              viewMode === 'Week' ? `Week of ${format(startOfWeek(currentDate), 'MMM d')}` :
              format(currentDate, 'MMMM d, yyyy')}
           </h3>
           <button onClick={nextDate} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors">
              <ChevronRight className="w-5 h-5"/>
           </button>
           <button onClick={() => setCurrentDate(new Date())} className="text-sm font-bold text-primary-500 hover:text-primary-600 uppercase tracking-widest px-2">Today</button>
         </div>

         <div className="flex p-1 bg-slate-100 dark:bg-black/40 rounded-lg">
           {(['Day', 'Week', 'Month'] as ViewMode[]).map(mode => (
             <button
               key={mode}
               onClick={() => setViewMode(mode)}
               className={cn(
                 "px-4 py-1.5 rounded-md text-sm font-bold transition-colors",
                 viewMode === mode ? "bg-white dark:bg-[#1a1b1e] text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
               )}
             >
               {mode}
             </button>
           ))}
         </div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {viewMode === 'Month' && renderMonthView()}
          {viewMode === 'Week' && renderWeekView()}
          {viewMode === 'Day' && renderDayView()}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 dark:bg-[#0a0b0d]/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#0a0b0d] rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
                <h3 className="font-bold tracking-tight text-xl text-slate-900 dark:text-white">{editingId ? 'Edit Appointment' : 'New Appointment'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-6 overflow-y-auto flex-1">
               <form id="appt-form" onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Title</label>
                    <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500/50" placeholder="e.g. Client Consultation" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 relative">
                    <div className="col-span-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Customer</label>
                        <button
                          type="button"
                          onClick={handleSyncContacts}
                          disabled={syncingContacts}
                          className="text-[10px] flex items-center text-primary-500 hover:text-primary-600 disabled:opacity-50 transition-colors bg-primary-500/10 hover:bg-primary-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest"
                        >
                          {syncingContacts ? "Syncing..." : "Sync Contacts"}
                        </button>
                      </div>
                      <div className="relative mb-3">
                        <input 
                          type="text"
                          placeholder="Search customer by name or number..."
                          value={contactSearch}
                          onChange={e => {
                             setContactSearch(e.target.value);
                             setContactSearchOpen(true);
                          }}
                          onFocus={() => setContactSearchOpen(true)}
                          onBlur={() => setTimeout(() => setContactSearchOpen(false), 200)}
                          className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
                        />
                        {contactSearchOpen && filteredContacts.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#0a0b0d] border border-slate-200 dark:border-white/10 rounded-lg shadow-lg">
                            {filteredContacts.map(c => (
                              <div 
                                key={c.id} 
                                className="px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 text-sm"
                                onClick={() => {
                                  setFormData({ ...formData, contactName: c.name, contactPhone: c.phone });
                                  setContactSearch(c.name);
                                  setContactSearchOpen(false);
                                }}
                              >
                                <div className="font-medium text-slate-900 dark:text-white">{c.name}</div>
                                <div className="text-xs text-slate-500 font-mono">{c.phone}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contact Name</label>
                      <input required type="text" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">WhatsApp Phone +</label>
                      <input required type="text" value={formData.contactPhone} disabled={!!contacts.find(c => c.phone === formData.contactPhone)} onChange={e => setFormData({...formData, contactPhone: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500/50 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed" placeholder="1234567890" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Start Time</label>
                      <input required type="datetime-local" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500/50" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">End Time</label>
                      <input required type="datetime-local" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Notes</label>
                    <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500/50 resize-none" placeholder="Any details..." />
                  </div>
                  {formData.contactPhone && !editingId && (
                    <div className="bg-primary-500/10 border border-primary-500/20 p-3 rounded-lg flex items-start">
                      <MessageSquare className="w-4 h-4 text-primary-500 mt-0.5 mr-2 shrink-0"/>
                      <p className="text-xs text-primary-600 dark:text-primary-400">A confirmation will be sent via WhatsApp to {formData.contactPhone} once created.</p>
                    </div>
                  )}
               </form>
             </div>
             <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#07080a] flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest">Cancel</button>
                <button type="submit" form="appt-form" className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-bold transition-colors uppercase tracking-widest text-sm text-shadow shadow-lg shadow-primary-500/20">
                  {editingId ? 'Save Changes' : 'Create Appointment'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
