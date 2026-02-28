import { useState, useEffect } from 'react';
import { habitAPI } from '../api';
import toast from 'react-hot-toast';
import { HiPlus, HiX, HiCheck, HiFire, HiTrendingUp, HiCalendar, HiDotsVertical, HiTrash, HiPencil } from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const ICONS = ['🎯', '💻', '📚', '🏋️', '🧘', '💧', '🏃', '✍️', '🎸', '🌱', '💤', '🍎', '📖', '🧠', '⚡'];
const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#22c55e'];

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  // Form state
  const [form, setForm] = useState({
    title: '', description: '', icon: '🎯', color: '#6366f1',
    frequency: 'daily', customDays: [], targetPerDay: 1
  });

  const fetchData = async () => {
    try {
      const [habitsRes, statsRes] = await Promise.all([
        habitAPI.getAll(),
        habitAPI.getStats()
      ]);
      setHabits(habitsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingHabit) {
        await habitAPI.update(editingHabit._id, form);
        toast.success('Habit updated!');
      } else {
        await habitAPI.create(form);
        toast.success('Habit created! 🎯');
      }
      setShowModal(false);
      setEditingHabit(null);
      setForm({ title: '', description: '', icon: '🎯', color: '#6366f1', frequency: 'daily', customDays: [], targetPerDay: 1 });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const toggleHabit = async (habitId, date) => {
    try {
      await habitAPI.toggle(habitId, date);
      fetchData();
    } catch (err) {
      toast.error('Failed to toggle');
    }
  };

  const deleteHabit = async (id) => {
    try {
      await habitAPI.delete(id);
      toast.success('Habit archived');
      setMenuOpen(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const openEdit = (habit) => {
    setEditingHabit(habit);
    setForm({
      title: habit.title, description: habit.description, icon: habit.icon,
      color: habit.color, frequency: habit.frequency, customDays: habit.customDays,
      targetPerDay: habit.targetPerDay
    });
    setShowModal(true);
    setMenuOpen(null);
  };

  // Generate last 7 dates
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: i === 0
      });
    }
    return days;
  };

  const days = getLast7Days();
  const todayStr = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Habit Tracker</h1>
          <p className="text-dark-400 mt-1">Build consistency, track your streaks</p>
        </div>
        <button onClick={() => { setEditingHabit(null); setForm({ title: '', description: '', icon: '🎯', color: '#6366f1', frequency: 'daily', customDays: [], targetPerDay: 1 }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <HiPlus size={18} /> New Habit
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-primary-500/20 to-blue-500/20">
            <div className="flex items-center gap-3">
              <HiCalendar className="text-primary-400" size={24} />
              <div>
                <p className="text-2xl font-bold text-white">{stats.completedToday}/{stats.dueToday}</p>
                <p className="text-xs text-dark-400">Done Today</p>
              </div>
            </div>
          </div>
          <div className="card bg-gradient-to-br from-orange-500/20 to-red-500/20">
            <div className="flex items-center gap-3">
              <HiFire className="text-orange-400" size={24} />
              <div>
                <p className="text-2xl font-bold text-white">{stats.avgStreak}</p>
                <p className="text-xs text-dark-400">Avg Streak</p>
              </div>
            </div>
          </div>
          <div className="card bg-gradient-to-br from-green-500/20 to-emerald-500/20">
            <div className="flex items-center gap-3">
              <HiTrendingUp className="text-green-400" size={24} />
              <div>
                <p className="text-2xl font-bold text-white">{stats.bestStreak}</p>
                <p className="text-xs text-dark-400">Best Streak</p>
              </div>
            </div>
          </div>
          <div className="card bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <div className="flex items-center gap-3">
              <HiCheck className="text-purple-400" size={24} />
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalHabits}</p>
                <p className="text-xs text-dark-400">Active Habits</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Chart */}
      {stats?.last7Days && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">This Week's Completion</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.last7Days}>
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(val, name) => [val, name === 'done' ? 'Completed' : 'Due']}
              />
              <Bar dataKey="due" fill="#334155" radius={[4, 4, 0, 0]} />
              <Bar dataKey="done" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Habit Grid */}
      {habits.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🎯</p>
          <h3 className="text-lg font-medium text-white mb-1">No habits yet</h3>
          <p className="text-dark-400 text-sm mb-4">Create your first habit and start building streaks!</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Create Habit</button>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map(habit => {
            const completedDates = habit.completions.map(c => c.date);
            const isDoneToday = completedDates.includes(todayStr);

            return (
              <div key={habit._id} className="card hover:border-dark-600 transition-all">
                <div className="flex items-start gap-4">
                  {/* Icon + Info */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => toggleHabit(habit._id, todayStr)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all
                        ${isDoneToday
                          ? 'bg-green-500/20 ring-2 ring-green-500 scale-110'
                          : 'bg-dark-700 hover:bg-dark-600'
                        }`}
                      title={isDoneToday ? 'Undo today' : 'Mark as done'}
                    >
                      {isDoneToday ? <HiCheck className="text-green-400" size={24} /> : habit.icon}
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${isDoneToday ? 'text-green-400' : 'text-white'}`}>{habit.title}</h3>
                      <span className="text-xs text-dark-500 capitalize">{habit.frequency}</span>
                    </div>
                    {habit.description && <p className="text-xs text-dark-400 mb-2">{habit.description}</p>}
                    
                    {/* Streak */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-orange-400">
                        <HiFire size={14} /> {habit.currentStreak} day streak
                      </span>
                      <span className="text-dark-500">Best: {habit.longestStreak}</span>
                      <span className="text-dark-500">Total: {habit.totalCompletions}</span>
                    </div>
                  </div>

                  {/* Last 7 days dots */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    {days.map(day => {
                      const done = completedDates.includes(day.date);
                      return (
                        <button
                          key={day.date}
                          onClick={() => toggleHabit(habit._id, day.date)}
                          className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center text-[10px] transition-all
                            ${done
                              ? 'text-white'
                              : 'bg-dark-700 text-dark-500 hover:bg-dark-600'
                            } ${day.isToday ? 'ring-1 ring-primary-500/50' : ''}`}
                          style={done ? { backgroundColor: habit.color + '33', color: habit.color } : {}}
                          title={day.date}
                        >
                          <span className="font-medium">{day.dayNum}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Menu */}
                  <div className="relative">
                    <button onClick={() => setMenuOpen(menuOpen === habit._id ? null : habit._id)} className="p-1 text-dark-500 hover:text-dark-300">
                      <HiDotsVertical size={16} />
                    </button>
                    {menuOpen === habit._id && (
                      <div className="absolute right-0 top-8 w-36 bg-dark-700 border border-dark-600 rounded-lg shadow-xl z-10">
                        <button onClick={() => openEdit(habit)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-dark-300 hover:bg-dark-600 rounded-t-lg">
                          <HiPencil size={14} /> Edit
                        </button>
                        <button onClick={() => deleteHabit(habit._id)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-dark-600 rounded-b-lg">
                          <HiTrash size={14} /> Archive
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md bg-dark-800 rounded-2xl border border-dark-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-dark-700">
              <h2 className="text-lg font-semibold text-white">{editingHabit ? 'Edit Habit' : 'New Habit'}</h2>
              <button onClick={() => setShowModal(false)} className="text-dark-400 hover:text-white"><HiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-sm text-dark-300 mb-1 block">Title</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Solve 1 LeetCode problem" className="input-field" required />
              </div>
              <div>
                <label className="text-sm text-dark-300 mb-1 block">Description (optional)</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Why this habit matters..." className="input-field" />
              </div>

              {/* Icon picker */}
              <div>
                <label className="text-sm text-dark-300 mb-2 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setForm({...form, icon})}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all
                        ${form.icon === icon ? 'bg-primary-600/30 ring-2 ring-primary-500' : 'bg-dark-700 hover:bg-dark-600'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="text-sm text-dark-300 mb-2 block">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({...form, color: c})}
                      className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white scale-110' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="text-sm text-dark-300 mb-2 block">Frequency</label>
                <div className="flex gap-2 flex-wrap">
                  {['daily', 'weekdays', 'weekends', 'custom'].map(freq => (
                    <button key={freq} type="button" onClick={() => setForm({...form, frequency: freq})}
                      className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all
                        ${form.frequency === freq ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-400 hover:bg-dark-600'}`}>
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {form.frequency === 'custom' && (
                <div>
                  <label className="text-sm text-dark-300 mb-2 block">Select Days</label>
                  <div className="flex gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                      <button key={i} type="button"
                        onClick={() => {
                          const days = form.customDays.includes(i) ? form.customDays.filter(x => x !== i) : [...form.customDays, i];
                          setForm({...form, customDays: days});
                        }}
                        className={`w-10 h-10 rounded-lg text-xs font-medium transition-all
                          ${form.customDays.includes(i) ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-400'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="w-full btn-primary">
                {editingHabit ? 'Update Habit' : 'Create Habit'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
