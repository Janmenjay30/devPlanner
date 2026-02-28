import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsAPI } from '../api';
import useAuthStore from '../stores/authStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { HiTrendingUp, HiClipboardCheck, HiClock, HiExclamation, HiFire, HiArrowRight, HiCheckCircle } from 'react-icons/hi';

const categoryColors = {
  coding: 'bg-blue-500/20 text-blue-400',
  study: 'bg-green-500/20 text-green-400',
  project: 'bg-purple-500/20 text-purple-400',
  placement: 'bg-yellow-500/20 text-yellow-400',
  personal: 'bg-pink-500/20 text-pink-400',
  health: 'bg-emerald-500/20 text-emerald-400',
  other: 'bg-gray-500/20 text-gray-400',
};

const priorityIcons = {
  low: '🔵',
  medium: '🟡',
  high: '🟠',
  urgent: '🔴'
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [productivity, setProductivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, prodRes] = await Promise.all([
          statsAPI.getDashboard(),
          statsAPI.getProductivity(14)
        ]);
        setStats(statsRes.data);
        setProductivity(prodRes.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-dark-400 mt-1">Here's your productivity overview</p>
        </div>
        <Link to="/tasks" className="btn-primary inline-flex items-center gap-2 self-start">
          View All Tasks <HiArrowRight />
        </Link>
      </div>

      {/* Streak & Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={<HiFire className="text-orange-400" size={24} />} label="Day Streak" value={stats?.overview?.streak || 0} color="from-orange-500/20 to-red-500/20" />
        <StatCard icon={<HiClipboardCheck className="text-primary-400" size={24} />} label="Total Done" value={stats?.overview?.completedTotal || 0} color="from-primary-500/20 to-blue-500/20" />
        <StatCard icon={<HiClock className="text-yellow-400" size={24} />} label="In Progress" value={stats?.overview?.inProgressTasks || 0} color="from-yellow-500/20 to-amber-500/20" />
        <StatCard icon={<HiExclamation className="text-red-400" size={24} />} label="Overdue" value={stats?.overview?.overdueTasks || 0} color="from-red-500/20 to-rose-500/20" />
        <StatCard icon={<HiTrendingUp className="text-green-400" size={24} />} label="Total Tasks" value={stats?.overview?.totalTasks || 0} color="from-green-500/20 to-emerald-500/20" />
      </div>

      {/* Today / This Week / This Month */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProgressCard title="Today" data={stats?.today} color="primary" />
        <ProgressCard title="This Week" data={stats?.week} color="cyan" />
        <ProgressCard title="This Month" data={stats?.month} color="purple" />
      </div>

      {/* Productivity Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Productivity (Last 14 Days)</h3>
        {productivity.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={productivity}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="_id" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => val?.slice(5)} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Area type="monotone" dataKey="completed" stroke="#6366f1" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-dark-500 text-center py-12">Complete tasks to see your productivity chart</p>
        )}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Category Breakdown</h3>
          {stats?.categoryStats?.length > 0 ? (
            <div className="space-y-3">
              {stats.categoryStats.map((cat) => {
                const pct = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
                return (
                  <div key={cat._id}>
                    <div className="flex justify-between mb-1">
                      <span className={`badge ${categoryColors[cat._id] || categoryColors.other}`}>
                        {cat._id || 'other'}
                      </span>
                      <span className="text-xs text-dark-400">{cat.completed}/{cat.total} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-dark-700 rounded-full h-2">
                      <div className="bg-primary-500 rounded-full h-2 transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-dark-500 text-center py-8">No category data yet</p>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Upcoming Tasks</h3>
            <Link to="/tasks" className="text-primary-400 text-sm hover:text-primary-300">View all</Link>
          </div>
          {stats?.upcomingTasks?.length > 0 ? (
            <div className="space-y-2">
              {stats.upcomingTasks.map((task) => (
                <div key={task._id} className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg">
                  <span className="text-sm">{priorityIcons[task.priority]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-dark-200 truncate">{task.title}</p>
                    <p className="text-xs text-dark-500">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
                    </p>
                  </div>
                  <span className={`badge ${categoryColors[task.category] || categoryColors.other}`}>
                    {task.category}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dark-500 text-center py-8">No upcoming tasks</p>
          )}
        </div>
      </div>

      {/* Recently Completed */}
      {stats?.recentCompleted?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Recently Completed</h3>
          <div className="flex flex-wrap gap-3">
            {stats.recentCompleted.map((task) => (
              <div key={task._id} className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-2 rounded-lg text-sm border border-green-500/20">
                <HiCheckCircle size={16} />
                {task.title}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`card bg-gradient-to-br ${color} border-dark-700/50`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-dark-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ProgressCard({ title, data, color }) {
  const total = data?.total || 0;
  const completed = data?.completed || 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const colorClasses = {
    primary: 'text-primary-400 bg-primary-500',
    cyan: 'text-cyan-400 bg-cyan-500',
    purple: 'text-purple-400 bg-purple-500'
  };

  return (
    <div className="card">
      <h3 className={`text-sm font-medium ${colorClasses[color]?.split(' ')[0]} mb-3`}>{title}</h3>
      <div className="flex items-end justify-between mb-3">
        <span className="text-3xl font-bold text-white">{pct}%</span>
        <span className="text-sm text-dark-400">{completed}/{total} tasks</span>
      </div>
      <div className="w-full bg-dark-700 rounded-full h-2.5">
        <div className={`${colorClasses[color]?.split(' ')[1]} rounded-full h-2.5 transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      {data?.remaining > 0 && (
        <p className="text-xs text-dark-500 mt-2">{data.remaining} remaining</p>
      )}
    </div>
  );
}
