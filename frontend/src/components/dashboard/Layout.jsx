import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  HiHome,
  HiCollection,
  HiViewBoards,
  HiCalendar,
  HiCog,
  HiLogout,
  HiMenuAlt2,
  HiX,
  HiBell,
  HiSearch,
  HiPlus,
} from 'react-icons/hi';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Avatar, Dropdown, DropdownItem, DropdownDivider } from '../common';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HiHome },
  { name: 'Projects', href: '/projects', icon: HiCollection },
  { name: 'My Tasks', href: '/tasks', icon: HiViewBoards },
  { name: 'Meetings', href: '/meetings', icon: HiCalendar },
];

export const Layout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 transform transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-dark-700">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 100 100">
                <rect x="25" y="30" width="50" height="10" rx="2" fill="currentColor"/>
                <rect x="25" y="45" width="35" height="10" rx="2" fill="currentColor"/>
                <rect x="25" y="60" width="45" height="10" rx="2" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">ProjectFlow</span>
            <button
              className="ml-auto lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setSidebarOpen(false)}
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Settings */}
          <div className="px-3 py-4 border-t border-gray-100 dark:border-dark-700">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
                )
              }
            >
              <HiCog className="h-5 w-5" />
              Settings
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 transition-colors">
          <div className="flex items-center gap-4 px-4 py-3">
            <button
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <HiMenuAlt2 className="h-6 w-6" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects, tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      navigate(`/tasks?search=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Create button */}
              <button
                onClick={() => navigate('/projects/new')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <HiPlus className="h-4 w-4" />
                <span>Create</span>
              </button>

              {/* Notifications */}
              <Dropdown
                align="right"
                trigger={
                  <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                    <HiBell className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                }
              >
                <div className="w-80 max-h-96 overflow-y-auto bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-100 dark:border-dark-700">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-dark-700">
                      {notifications.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-700 cursor-pointer ${!notification.is_read ? 'bg-primary-50/50 dark:bg-primary-900/20' : ''}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No notifications yet
                    </div>
                  )}
                </div>
              </Dropdown>

              {/* User menu */}
              <Dropdown
                align="right"
                trigger={
                  <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
                    <Avatar user={user} size="sm" />
                    <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user?.first_name}
                    </span>
                  </button>
                }
              >
                {({ close }) => (
                  <>
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                    <DropdownItem
                      icon={HiCog}
                      onClick={() => {
                        close();
                        navigate('/settings');
                      }}
                    >
                      Settings
                    </DropdownItem>
                    <DropdownDivider />
                    <DropdownItem
                      icon={HiLogout}
                      onClick={handleLogout}
                      danger
                    >
                      Sign out
                    </DropdownItem>
                  </>
                )}
              </Dropdown>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
