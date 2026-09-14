import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Package, 
  Truck, 
  Zap, 
  IndianRupee, 
  Sparkles, 
  ArrowRight, 
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock
} from 'lucide-react';
import { AppNotification, NavTab } from '../types';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onNavigateTab?: (tab: NavTab) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onClearAll,
  onNavigateTab
}) => {
  const [filter, setFilter] = useState<'all' | 'order' | 'inventory' | 'scheme' | 'payment'>('all');

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'inventory':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'scheme':
        return <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />;
      case 'payment':
        return <IndianRupee className="w-4 h-4 text-purple-600" />;
      case 'system':
      default:
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getNotificationBg = (type: AppNotification['type']) => {
    switch (type) {
      case 'order':
        return 'bg-blue-50 border-blue-100 text-blue-900';
      case 'inventory':
        return 'bg-amber-50 border-amber-100 text-amber-900';
      case 'scheme':
        return 'bg-emerald-50 border-emerald-100 text-emerald-900';
      case 'payment':
        return 'bg-purple-50 border-purple-100 text-purple-900';
      case 'system':
      default:
        return 'bg-indigo-50 border-indigo-100 text-indigo-900';
    }
  };

  const handleItemClick = (item: AppNotification) => {
    if (!item.isRead) {
      onMarkAsRead(item.id);
    }
    if (item.actionTab && onNavigateTab) {
      onNavigateTab(item.actionTab);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden flex justify-end"
      role="dialog"
      aria-modal="true"
    >
      {/* Dark backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 ease-out border-l border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner relative">
              <Bell className="w-5 h-5 text-amber-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-blue-900 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Notifications &amp; Alerts
                </h2>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px]">
                    {unreadCount} New
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-semibold text-[10px]">
                    All Read
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-200 mt-0.5">
                Aryan Agency Order &amp; Stock Live Updates
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                title="Mark all as read"
                className="px-2.5 py-1 text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-blue-100 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark read</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications panel"
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 px-3 py-2 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0 text-xs">
          {[
            { id: 'all', label: `All (${notifications.length})` },
            { id: 'order', label: 'Orders' },
            { id: 'inventory', label: 'Stock Alerts' },
            { id: 'scheme', label: 'Offers' },
            { id: 'payment', label: 'Payments' }
          ].map(tab => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-700">No notifications in this tab</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                You are all caught up with your FMCG orders, deliveries, and stock updates.
              </p>
            </div>
          ) : (
            filteredNotifications.map(item => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                  item.isRead 
                    ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs' 
                    : 'bg-blue-50/40 border-blue-200/90 shadow-xs hover:bg-blue-50/70'
                }`}
              >
                {/* Header row of card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${getNotificationBg(item.type)}`}>
                      {getNotificationIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <h4 className={`text-xs font-bold truncate ${item.isRead ? 'text-slate-800' : 'text-blue-950 font-black'}`}>
                          {item.title}
                        </h4>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Unread" />
                        )}
                      </div>
                      <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed line-clamp-3">
                        {item.message}
                      </p>
                    </div>
                  </div>

                  {/* Dismiss button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss(item.id);
                    }}
                    title="Dismiss"
                    className="opacity-40 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Footer row of card */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.timestamp}</span>
                  </span>

                  {item.actionTab && (
                    <span className="text-blue-600 font-bold flex items-center space-x-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <button
            type="button"
            onClick={onClearAll}
            disabled={notifications.length === 0}
            className="text-slate-500 hover:text-rose-600 font-semibold flex items-center space-x-1 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>

          <span className="text-[11px] text-slate-400 font-medium">
            Aryan Agency B2B FMCG Hub
          </span>
        </div>

      </div>
    </div>
  );
};
