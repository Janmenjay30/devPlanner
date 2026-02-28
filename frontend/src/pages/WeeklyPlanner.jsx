import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { plannerAPI, taskAPI } from '../api';
import TaskModal from '../components/TaskModal';
import { HiChevronLeft, HiChevronRight, HiPlus, HiCheckCircle, HiTrash } from 'react-icons/hi';

const categories = ['coding', 'study', 'project', 'placement', 'personal', 'health', 'other'];
const categoryColors = {
  coding: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  study: 'bg-green-500/20 text-green-400 border-green-500/30',
  project: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  placement: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  personal: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  health: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(weekStart) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function WeeklyPlanner() {
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [plan, setPlan] = useState(null);
  const [weekTasks, setWeekTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState('');
  const [goalCategory, setGoalCategory] = useState('other');
  const [saving, setSaving] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const weekDays = getWeekDays(weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  useEffect(() => {
    fetchWeekData();
  }, [weekStart]);

  const fetchWeekData = async () => {
    setLoading(true);
    try {
      const dateStr = weekStart.toISOString().split('T')[0];
      const endStr = weekEnd.toISOString().split('T')[0];
      const [planRes, tasksRes] = await Promise.all([
        plannerAPI.getWeeklyPlan(dateStr),
        taskAPI.getAll({ dueDate: 'week' })
      ]);
      setPlan(planRes.data);
      setWeekTasks(tasksRes.data.tasks || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const savePlan = async (updates) => {
    setSaving(true);
    try {
      const dateStr = weekStart.toISOString().split('T')[0];
      const { data } = await plannerAPI.updateWeeklyPlan(dateStr, { ...plan, ...updates });
      setPlan(data);
      toast.success('Plan saved');
    } catch (err) {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const addGoal = () => {
    if (!newGoal.trim()) {
      toast.error('Type a goal first, then click +');
      return;
    }
    const goals = [...(plan?.goals || []), { text: newGoal.trim(), completed: false, category: goalCategory }];
    savePlan({ goals });
    setNewGoal('');
  };

  const toggleGoal = (index) => {
    const goals = plan.goals.map((g, i) => i === index ? { ...g, completed: !g.completed } : g);
    savePlan({ goals });
  };

  const removeGoal = (index) => {
    const goals = plan.goals.filter((_, i) => i !== index);
    savePlan({ goals });
  };

  const changeWeek = (offset) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + offset * 7);
    setWeekStart(d);
  };

  const isCurrentWeek = getWeekStart().getTime() === weekStart.getTime();
  const completedGoals = plan?.goals?.filter(g => g.completed).length || 0;
  const totalGoals = plan?.goals?.length || 0;
  const completedTasks = weekTasks.filter(t => t.status === 'completed').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Weekly Planner</h1>
          <p className="text-dark-400 text-sm mt-1">Set goals, track your week</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => changeWeek(-1)} className="btn-ghost p-2"><HiChevronLeft size={20} /></button>
          <div className="text-center min-w-[200px]">
            <p className="text-white font-semibold text-sm">
              {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
              {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            {isCurrentWeek && <span className="text-xs text-primary-400">This Week</span>}
          </div>
          <button onClick={() => changeWeek(1)} className="btn-ghost p-2"><HiChevronRight size={20} /></button>
          {!isCurrentWeek && (
            <button onClick={() => setWeekStart(getWeekStart())} className="btn-secondary text-sm">This Week</button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Week Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-bold text-primary-400">{totalGoals}</p>
              <p className="text-xs text-dark-400 mt-1">Weekly Goals</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-green-400">{completedGoals}</p>
              <p className="text-xs text-dark-400 mt-1">Goals Done</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-cyan-400">{weekTasks.length}</p>
              <p className="text-xs text-dark-400 mt-1">Tasks This Week</p>
            </div>
            <div className="card text-center cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all" onClick={() => setShowTaskModal(true)}>
              <p className="text-3xl font-bold text-purple-400"><HiPlus className="inline" /> New</p>
              <p className="text-xs text-dark-400 mt-1">Create Task</p>
            </div>
          </div>

          {/* Day columns */}
          <div className="card overflow-x-auto">
            <h2 className="text-lg font-semibold text-white mb-4">Week at a Glance</h2>
            <div className="grid grid-cols-7 gap-2 min-w-[700px]">
              {weekDays.map((day, idx) => {
                const dayStr = day.toISOString().split('T')[0];
                const todayStr = new Date().toISOString().split('T')[0];
                const isToday = dayStr === todayStr;
                const dayTasks = weekTasks.filter(t => t.dueDate && t.dueDate.split('T')[0] === dayStr);
                const done = dayTasks.filter(t => t.status === 'completed').length;

                return (
                  <div key={idx} className={`p-3 rounded-xl text-center ${isToday ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-dark-700/50'}`}>
                    <p className={`text-xs font-medium ${isToday ? 'text-primary-400' : 'text-dark-400'}`}>
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-white' : 'text-dark-300'}`}>
                      {day.getDate()}
                    </p>
                    <div className="mt-2">
                      <span className="text-xs text-dark-500">{done}/{dayTasks.length}</span>
                      {dayTasks.length > 0 && (
                        <div className="w-full bg-dark-600 rounded-full h-1 mt-1">
                          <div className="bg-primary-500 rounded-full h-1" style={{ width: `${dayTasks.length > 0 ? (done / dayTasks.length) * 100 : 0}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Goals */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Weekly Goals</h2>
                {totalGoals > 0 && (
                  <span className="text-sm text-dark-400">{completedGoals}/{totalGoals}</span>
                )}
              </div>

              {totalGoals > 0 && (
                <div className="w-full bg-dark-700 rounded-full h-2 mb-4">
                  <div className="bg-gradient-to-r from-primary-500 to-cyan-500 rounded-full h-2 transition-all" style={{ width: `${(completedGoals / totalGoals) * 100}%` }} />
                </div>
              )}

              <div className="flex gap-2 mb-4">
                <input value={newGoal} onChange={(e) => setNewGoal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                  className="input-field flex-1" placeholder="Add weekly goal..." />
                <select value={goalCategory} onChange={(e) => setGoalCategory(e.target.value)} className="input-field w-28 text-sm">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={addGoal} className="btn-primary px-3"><HiPlus size={18} /></button>
              </div>

              {plan?.goals?.length > 0 ? (
                <div className="space-y-2">
                  {plan.goals.map((goal, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${goal.completed ? 'bg-green-500/5 border-green-500/20' : 'bg-dark-700/50 border-dark-600'}`}>
                      <button onClick={() => toggleGoal(i)}
                        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${goal.completed ? 'bg-green-500 border-green-500 text-white' : 'border-dark-500 hover:border-primary-500'}`}>
                        {goal.completed && <HiCheckCircle size={12} />}
                      </button>
                      <span className={`flex-1 text-sm ${goal.completed ? 'line-through text-dark-500' : 'text-dark-200'}`}>
                        {goal.text}
                      </span>
                      <span className={`badge text-[10px] ${categoryColors[goal.category]?.split(' ').slice(0, 2).join(' ') || ''}`}>
                        {goal.category}
                      </span>
                      <button onClick={() => removeGoal(i)} className="text-dark-500 hover:text-red-400">
                        <HiTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-500 text-center py-6">No goals set for this week</p>
              )}
            </div>

            {/* Summary & Lessons */}
            <div className="space-y-4">
              <div className="card">
                <h3 className="text-sm font-semibold text-white mb-3">Weekly Summary</h3>
                <textarea
                  value={plan?.summary || ''}
                  onChange={(e) => setPlan(prev => ({ ...prev, summary: e.target.value }))}
                  onBlur={() => savePlan({ summary: plan?.summary })}
                  className="input-field h-28 resize-none text-sm"
                  placeholder="What did you accomplish this week?"
                />
              </div>

              <div className="card">
                <h3 className="text-sm font-semibold text-white mb-3">Lessons Learned</h3>
                <textarea
                  value={plan?.lessonsLearned || ''}
                  onChange={(e) => setPlan(prev => ({ ...prev, lessonsLearned: e.target.value }))}
                  onBlur={() => savePlan({ lessonsLearned: plan?.lessonsLearned })}
                  className="input-field h-28 resize-none text-sm"
                  placeholder="Key takeaways, what to improve next week..."
                />
              </div>

              <div className="card">
                <h3 className="text-sm font-semibold text-white mb-3">Overall Rating</h3>
                <input
                  type="range" min="0" max="10" step="1"
                  value={plan?.overallRating ?? 5}
                  onChange={(e) => savePlan({ overallRating: parseInt(e.target.value) })}
                  className="w-full accent-primary-500"
                />
                <div className="flex justify-between text-xs text-dark-500 mt-1">
                  <span>0</span>
                  <span className="text-lg text-primary-400 font-bold">{plan?.overallRating ?? '-'}/10</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Task Creation Modal */}
      {showTaskModal && (
        <TaskModal
          task={null}
          defaultValues={{ dueDate: weekStart.toISOString().split('T')[0] }}
          onClose={() => setShowTaskModal(false)}
          onSaved={() => {
            setShowTaskModal(false);
            fetchWeekData();
          }}
        />
      )}
    </div>
  );
}
