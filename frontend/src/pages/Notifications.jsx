import { useState, useEffect } from 'react';
import { notificationAPI } from '../api';
import { HiBell, HiCheck, HiCheckCircle, HiClock, HiExclamation, HiInformationCircle, HiStar, HiTrash } from 'react-icons/hi';

const typeConfig = {
  'reminder': { icon: HiClock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  'daily-digest': { icon: HiBell, color: 'text-primary-400', bg: 'bg-primary-500/10' },
  'weekly-report': { icon: HiStar, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  'achievement': { icon: HiCheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
  'overdue': { icon: HiExclamation, color: 'text-red-400', bg: 'bg-red-500/10' },
  'info': { icon: HiInformationCircle, color: 'text-dark-400', bg: 'bg-dark-700' }
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationAPI.getAll({ unreadOnly: filter === 'unread' });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const cleanup = async () => {
    try {
      await notificationAPI.cleanup();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-dark-400 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary text-sm inline-flex items-center gap-1">
              <HiCheck size={16} /> Mark all read
            </button>
          )}
          <button onClick={cleanup} className="btn-ghost text-sm inline-flex items-center gap-1">
            <HiTrash size={16} /> Cleanup
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-400 hover:text-dark-200'}`}>
          All
        </button>
        <button onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'unread' ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-400 hover:text-dark-200'}`}>
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-16">
          <HiBell size={48} className="mx-auto text-dark-600 mb-3" />
          <p className="text-dark-400 text-lg">No notifications</p>
          <p className="text-dark-500 text-sm mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const config = typeConfig[notif.type] || typeConfig.info;
            const Icon = config.icon;

            return (
              <div
                key={notif._id}
                onClick={() => !notif.read && markRead(notif._id)}
                className={`card-hover flex items-start gap-4 p-4 cursor-pointer ${!notif.read ? 'border-l-2 border-l-primary-500' : 'opacity-70'}`}
              >
                <div className={`shrink-0 w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                  <Icon size={20} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-medium text-sm ${!notif.read ? 'text-white' : 'text-dark-400'}`}>{notif.title}</h3>
                    <span className="text-xs text-dark-500 shrink-0">{timeAgo(notif.createdAt)}</span>
                  </div>
                  <p className="text-sm text-dark-400 mt-1">{notif.message}</p>
                </div>
                {!notif.read && <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
