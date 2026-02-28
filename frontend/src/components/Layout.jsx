import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { HiHome, HiClipboardList, HiCalendar, HiViewGrid, HiBell, HiUser, HiLogout, HiMenu, HiX, HiRefresh, HiColorSwatch } from 'react-icons/hi';
import useAuthStore from '../stores/authStore';
import AIChat from './AIChat';

const navItems = [
  { path: '/', icon: HiHome, label: 'Dashboard' },
  { path: '/tasks', icon: HiClipboardList, label: 'Tasks' },
  { path: '/habits', icon: HiRefresh, label: 'Habits' },
  { path: '/calendar', icon: HiColorSwatch, label: 'Calendar' },
  { path: '/daily', icon: HiCalendar, label: 'Daily Plan' },
  { path: '/weekly', icon: HiViewGrid, label: 'Weekly Plan' },
  { path: '/notifications', icon: HiBell, label: 'Notifications' },
  { path: '/profile', icon: HiUser, label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-800 border-r border-dark-700 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                D
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">DevPlanner</h1>
                <p className="text-xs text-dark-400">Productivity Hub</p>
              </div>
            </div>
            <button className="lg:hidden text-dark-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <HiX size={20} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                      : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700'
                  }`
                }
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-dark-700">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-200 truncate">{user?.name}</p>
                <p className="text-xs text-dark-500 truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-dark-500 hover:text-red-400 transition-colors" title="Logout">
                <HiLogout size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-dark-800/80 backdrop-blur-lg border-b border-dark-700 flex items-center justify-between px-6 shrink-0">
          <button className="lg:hidden text-dark-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <HiMenu size={24} />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm text-dark-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NavLink to="/notifications" className="relative text-dark-400 hover:text-white transition-colors">
              <HiBell size={22} />
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>

      {/* AI Assistant */}
      <AIChat />
    </div>
  );
}
