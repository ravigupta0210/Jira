import { useState } from 'react';
import { HiUser, HiLockClosed, HiBell, HiColorSwatch, HiSun, HiMoon, HiDesktopComputer } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/api';
import { Button, Input, Avatar } from '../components/common';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'profile', name: 'Profile', icon: HiUser },
  { id: 'password', name: 'Password', icon: HiLockClosed },
  { id: 'notifications', name: 'Notifications', icon: HiBell },
  { id: 'appearance', name: 'Appearance', icon: HiColorSwatch },
];

const ProfileSettings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.updateProfile(formData);
      updateUser(response.data.data.user);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-6">
        <Avatar user={user} size="xl" />
        <div>
          <Button variant="secondary" size="sm">Change photo</Button>
          <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
        />
        <Input
          label="Last name"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        />
      </div>

      <Input
        label="Email address"
        type="email"
        value={user?.email || ''}
        disabled
        className="bg-gray-50"
      />

      <Button type="submit" loading={loading}>Save Changes</Button>
    </form>
  );
};

const PasswordSettings = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success('Password changed successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <Input
        label="Current password"
        type="password"
        value={formData.currentPassword}
        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
      />
      <Input
        label="New password"
        type="password"
        value={formData.newPassword}
        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
      />
      <Input
        label="Confirm new password"
        type="password"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
      />
      <Button type="submit" loading={loading}>Change Password</Button>
    </form>
  );
};

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    ticketUpdates: true,
    meetingReminders: true,
    weeklyDigest: false,
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification settings updated');
  };

  const options = [
    { key: 'emailNotifications', label: 'Email notifications', description: 'Receive email notifications for important updates' },
    { key: 'ticketUpdates', label: 'Ticket updates', description: 'Get notified when tickets are updated or assigned' },
    { key: 'meetingReminders', label: 'Meeting reminders', description: 'Receive reminders before scheduled meetings' },
    { key: 'weeklyDigest', label: 'Weekly digest', description: 'Receive a weekly summary of your projects' },
  ];

  return (
    <div className="space-y-4">
      {options.map((option) => (
        <div key={option.key} className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-dark-700">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{option.label}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
          </div>
          <button
            onClick={() => toggleSetting(option.key)}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              settings[option.key] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-600'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                settings[option.key] ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      ))}
    </div>
  );
};

const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: 'light', label: 'Light', icon: HiSun },
    { value: 'dark', label: 'Dark', icon: HiMoon },
    { value: 'system', label: 'System', icon: HiDesktopComputer },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Theme</h4>
        <div className="grid grid-cols-3 gap-4">
          {themeOptions.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setTheme(t.value);
                toast.success(`Theme set to ${t.label}`);
              }}
              className={clsx(
                'p-4 border rounded-xl text-center capitalize transition-all flex flex-col items-center gap-2',
                theme === t.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 dark:bg-gray-800'
              )}
            >
              <t.icon className="h-6 w-6" />
              <span className="dark:text-gray-200">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-dark-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <tab.icon className="h-5 w-5" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'password' && <PasswordSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
