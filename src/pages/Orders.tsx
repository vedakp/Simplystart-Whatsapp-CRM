import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Loader2, ArrowRight, MessageSquare, Check, X } from 'lucide-react';
import { cn } from '../utils';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create state
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Update state
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('Pending');
  const [sendUpdateMsg, setSendUpdateMsg] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // New order form data
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    itemName: '',
    price: '',
  });

  const fetchOrders = async () => {
    try {
      const [orderRes, contactRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/contacts')
      ]);
      const data = await orderRes.json();
      const contactData = await contactRes.json();
      setOrders(data.reverse()); // Latest first
      setContacts(contactData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Check auto-open create modal
    const s = location.state as any;
    if (s?.createOrderPhone) {
      setShowCreate(true);
      setNewOrder(prev => ({
        ...prev,
        customerName: s.createOrderName || '',
        customerPhone: s.createOrderPhone || '',
      }));
      // Clear state so it doesn't reopen on refresh
      navigate('.', { replace: true, state: {} });
    }
  }, [location]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    const payload = {
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone,
      items: [{ name: newOrder.itemName, quantity: 1, price: Number(newOrder.price) }],
      totalAmount: Number(newOrder.price)
    };

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await fetchOrders();
      setShowCreate(false);
      setNewOrder({ customerName: '', customerPhone: '', itemName: '', price: '' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    
    setIsUpdating(true);
    try {
      await fetch(`/api/orders/${editingOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, sendUpdate: sendUpdateMsg })
      });
      await fetchOrders();
      setEditingOrder(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Pending': return 'bg-amber-900/20 text-amber-500 border-amber-500/20';
      case 'Processing': return 'bg-blue-900/20 text-blue-500 border-blue-500/20';
      case 'Shipped': return 'bg-primary-900/20 text-primary-500 border-primary-500/20';
      case 'Delivered': return 'bg-purple-900/20 text-purple-500 border-purple-500/20';
      case 'Cancelled': return 'bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-700';
      default: return 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10';
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-end border-b border-slate-200 dark:border-white/5 pb-6">
        <div>
          <h2 className="font-bold tracking-tight text-2xl text-slate-900 dark:text-white">Order Registry</h2>
          <p className="text-xs text-slate-500 mt-1">Manage customer lifecycles and automated updates.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-[10px] rounded-full hover:bg-slate-800 dark:hover:bg-slate-200 uppercase tracking-widest transition-colors flex items-center"
        >
          <Plus className="w-3.5 h-3.5 mr-2" />
          Create New Order
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl">
          No orders yet.
        </div>
      ) : (
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-white/5">
                  <th className="pb-4 font-bold pl-2">Order ID</th>
                  <th className="pb-4 font-bold">Customer / Phone</th>
                  <th className="pb-4 font-bold">Amount</th>
                  <th className="pb-4 font-bold">Status</th>
                  <th className="pb-4 font-bold text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/[0.05]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-5 font-mono text-xs text-slate-700 dark:text-slate-300 pl-2">{order.id}</td>
                    <td className="py-5">
                      <div className="font-medium text-slate-900 dark:text-white">{order.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{order.customerPhone}</div>
                      <div className="text-[10px] text-slate-600 mt-1">{order.items.length} item(s)</div>
                    </td>
                    <td className="py-5 text-primary-400 font-medium">${order.totalAmount.toFixed(2)}</td>
                    <td className="py-5">
                      <span className={cn("px-2 py-1 border rounded text-[10px] uppercase font-bold", getStatusColor(order.status))}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-5 text-right pr-2">
                       <button
                        onClick={() => {
                          setEditingOrder(order);
                          setNewStatus(order.status);
                          setSendUpdateMsg(true);
                        }}
                        className="text-slate-900 dark:text-white border border-slate-300 dark:border-white/20 rounded-full px-4 py-1.5 text-[10px] hover:bg-slate-200 dark:bg-white/10 transition-colors uppercase tracking-widest font-semibold"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Order Modal / Overlay */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-50 dark:bg-[#0a0b0d]/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#07080a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
              <h3 className="font-bold tracking-tight text-lg text-slate-900 dark:text-white">New Order</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-900 dark:text-white transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5 relative">
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Customer Name</label>
                  <input required type="text" list="contacts-list" value={newOrder.customerName} onChange={e => {
                    const matchedContact = contacts.find(c => c.name === e.target.value);
                    setNewOrder({...newOrder, customerName: e.target.value, customerPhone: matchedContact ? matchedContact.phone : newOrder.customerPhone});
                  }} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors" />
                  <datalist id="contacts-list">
                    {contacts.map(c => <option key={c.id} value={c.name}>{c.phone}</option>)}
                  </datalist>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Phone Number</label>
                  <input required type="text" placeholder="+1234567890" value={newOrder.customerPhone} onChange={e => setNewOrder({...newOrder, customerPhone: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:border-primary-500/50 transition-colors" />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Item Name</label>
                  <input required type="text" value={newOrder.itemName} onChange={e => setNewOrder({...newOrder, itemName: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors" />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Price ($)</label>
                  <input required type="number" step="0.01" min="0" value={newOrder.price} onChange={e => setNewOrder({...newOrder, price: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:border-primary-500/50 transition-colors" />
                </div>
              </div>
              
              <div className="bg-primary-900/10 border border-primary-500/20 p-4 rounded-lg flex items-start mt-6">
                <MessageSquare className="w-4 h-4 text-primary-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-[11px] text-primary-400">A confirmation message will be sent automatically via WhatsApp upon creation.</p>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-white/5 mt-6 space-x-3">
                <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isCreating} className="px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-full transition-colors flex items-center">
                  {isCreating ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
                  Create & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-slate-50 dark:bg-[#0a0b0d]/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#07080a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
              <h3 className="font-bold tracking-tight text-lg text-slate-900 dark:text-white">Update Order <span className="text-slate-500 text-base font-mono">{editingOrder.id}</span></h3>
              <button onClick={() => setEditingOrder(null)} className="text-slate-500 hover:text-slate-900 dark:text-white transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleUpdateStatus} className="p-6 space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">New Status</label>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary-500/50 transition-colors"
                >
                  <option value="Pending" className="text-white dark:text-slate-900">Pending</option>
                  <option value="Processing" className="text-white dark:text-slate-900">Processing</option>
                  <option value="Shipped" className="text-white dark:text-slate-900">Shipped</option>
                  <option value="Delivered" className="text-white dark:text-slate-900">Delivered</option>
                  <option value="Cancelled" className="text-white dark:text-slate-900">Cancelled</option>
                </select>
              </div>

              <label className="flex items-center space-x-4 p-4 border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] rounded-xl cursor-pointer hover:bg-white/[0.04] transition-colors">
                <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0", sendUpdateMsg ? "bg-primary-500 border-primary-500" : "border-slate-300 dark:border-white/20 bg-transparent")}>
                  {sendUpdateMsg && <Check className="w-3.5 h-3.5 text-white dark:text-slate-900" />}
                </div>
                <input 
                  type="checkbox" 
                  checked={sendUpdateMsg} 
                  onChange={(e) => setSendUpdateMsg(e.target.checked)} 
                  className="sr-only" 
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Send WhatsApp Update</p>
                  <p className="text-xs text-slate-500 mt-0.5">Notify {editingOrder.customerName} about the status change.</p>
                </div>
              </label>

              {/* Order Logs Preview */}
              <div className="mt-6 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-xl p-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Activity Log</p>
                <div className="space-y-3 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                  {editingOrder.logs.slice().reverse().map((log: any, i: number) => (
                    <div key={i} className="text-xs text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-white/10 pl-3">
                      <span className="text-slate-500 block mb-1 font-mono text-[10px]">{new Date(log.date).toLocaleString()}</span>
                      {log.message}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-white/5 space-x-3">
                <button type="button" onClick={() => setEditingOrder(null)} className="px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={isUpdating} className="px-5 py-2.5 text-[10px] font-bold tracking-widest uppercase bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-full transition-colors flex items-center">
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
