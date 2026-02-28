import { useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import { authAPI } from '../api';
import { HiUser, HiMail, HiPencil, HiKey, HiBell, HiSave } from 'react-icons/hi';

export default function Profile() {
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification preferences
  const [prefs, setPrefs] = useState({
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    pushNotifications: user?.preferences?.pushNotifications ?? true,
    dailyDigestTime: user?.preferences?.dailyDigestTime || '08:00',
    weeklyReportDay: user?.preferences?.weeklyReportDay || 'sunday'
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    const result = await updateProfile({ name, bio });
    setSaving(false);
    if (result.success) toast.success('Profile updated!');
    else toast.error(result.message);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
    setSaving(false);
  };

  const handleSavePrefs = async () => {
    setSaving(true);
    const result = await updateProfile({ preferences: prefs });
    setSaving(false);
    if (result.success) toast.success('Preferences saved!');
    else toast.error(result.message);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: HiUser },
    { id: 'password', label: 'Security', icon: HiKey },
    { id: 'notifications', label: 'Notifications', icon: HiBell }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-dark-400 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Header Card */}
      <div className="card flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-dark-400 text-sm">{user?.email}</p>
          <p className="text-dark-500 text-xs mt-1">{user?.bio}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 p-1 rounded-xl border border-dark-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="card space-y-5">
          <h3 className="text-lg font-semibold text-white">Edit Profile</h3>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Name</label>
            <div className="relative">
              <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={18} />
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-field pl-10" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Email</label>
            <div className="relative">
              <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={18} />
              <input value={user?.email} disabled className="input-field pl-10 opacity-60 cursor-not-allowed" />
            </div>
            <p className="text-xs text-dark-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Bio</label>
            <div className="relative">
              <HiPencil className="absolute left-3 top-3 text-dark-500" size={18} />
              <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                className="input-field pl-10 h-20 resize-none" placeholder="Tell us about yourself..." />
            </div>
          </div>

          <button onClick={handleSaveProfile} disabled={saving} className="btn-primary inline-flex items-center gap-2">
            <HiSave size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-5">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="input-field" required minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field" required />
            </div>
            <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2">
              <HiKey size={16} /> {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card space-y-6">
          <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-dark-700 rounded-xl cursor-pointer">
              <div>
                <p className="text-sm font-medium text-dark-200">Email Notifications</p>
                <p className="text-xs text-dark-500">Receive daily digest and weekly reports via email</p>
              </div>
              <input type="checkbox" checked={prefs.emailNotifications}
                onChange={(e) => setPrefs(p => ({ ...p, emailNotifications: e.target.checked }))}
                className="w-5 h-5 rounded bg-dark-600 border-dark-500 text-primary-500 focus:ring-primary-500" />
            </label>

            <label className="flex items-center justify-between p-4 bg-dark-700 rounded-xl cursor-pointer">
              <div>
                <p className="text-sm font-medium text-dark-200">Push Notifications</p>
                <p className="text-xs text-dark-500">Get browser push notifications for reminders</p>
              </div>
              <input type="checkbox" checked={prefs.pushNotifications}
                onChange={(e) => setPrefs(p => ({ ...p, pushNotifications: e.target.checked }))}
                className="w-5 h-5 rounded bg-dark-600 border-dark-500 text-primary-500 focus:ring-primary-500" />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Daily Digest Time</label>
                <input type="time" value={prefs.dailyDigestTime}
                  onChange={(e) => setPrefs(p => ({ ...p, dailyDigestTime: e.target.value }))}
                  className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Weekly Report Day</label>
                <select value={prefs.weeklyReportDay}
                  onChange={(e) => setPrefs(p => ({ ...p, weeklyReportDay: e.target.value }))}
                  className="input-field">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(d => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button onClick={handleSavePrefs} disabled={saving} className="btn-primary inline-flex items-center gap-2">
            <HiSave size={16} /> {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      )}
    </div>
  );
}
