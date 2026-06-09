import React, { useEffect, useState } from 'react';
import { Users, ShoppingCart, MessageSquare, Activity } from 'lucide-react';
import { cn } from '../utils';

export default function Dashboard() {
  const [stats, setStats] = useState({
    contacts: 0,
    campaigns: 0,
    orders: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [cRes, campRes, oRes] = await Promise.all([
          fetch('/api/contacts'),
          fetch('/api/campaigns'),
          fetch('/api/orders')
        ]);
        const contacts = await cRes.json();
        const campaigns = await campRes.json();
        const orders = await oRes.json();
        
        setStats({
          contacts: contacts.length,
          campaigns: campaigns.length,
          orders: orders.length
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: 'Total Contacts', value: stats.contacts, icon: Users, color: 'text-primary-500', bg: 'bg-primary-500/10' },
    { title: 'Campaigns', value: stats.campaigns, icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { title: 'Total Orders', value: stats.orders, icon: ShoppingCart, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { title: 'System Status', value: 'Healthy', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="p-6 bg-white dark:bg-white/[0.02] rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between h-40">
            <div>
              <div className="flex justify-between items-start">
                <h4 className="text-[10px] uppercase tracking-widest text-primary-500 font-bold">{card.title}</h4>
                <div className={cn("p-2 rounded-lg", card.bg)}>
                  <card.icon className={cn("w-5 h-5", card.color)} />
                </div>
              </div>
              <p className="font-bold tracking-tight text-2xl text-slate-900 dark:text-white mt-2">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white dark:bg-white/[0.02] rounded-2xl border border-slate-200 dark:border-white/5 p-12 text-center text-slate-600 dark:text-slate-400">
        <div className="max-w-md mx-auto space-y-4">
          <MessageSquare className="w-12 h-12 text-slate-200 dark:text-white/20 mx-auto" />
          <h2 className="font-bold tracking-tight text-xl text-slate-900 dark:text-white">Welcome to Simplystart Whastapp Auto</h2>
          <p className="text-sm tracking-wide leading-relaxed">
            Control your automated WhatsApp campaigns, manage customer orders, and sync your contacts all from this sophisticated console.
          </p>
        </div>
      </div>
    </div>
  );
}
