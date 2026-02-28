import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { plannerAPI } from '../api';
import TaskModal from '../components/TaskModal';
import { HiChevronLeft, HiChevronRight, HiPlus, HiTrash, HiCheckCircle } from 'react-icons/hi';

const moods = [
  { value: 'great', emoji: '🤩', label: 'Great' },
  { value: 'good', emoji: '😊', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'bad', emoji: '😞', label: 'Bad' },
  { value: 'terrible', emoji: '😫', label: 'Terrible' }
];

export default function DailyPlanner() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    fetchPlan();
  }, [date]);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const { data } = await plannerAPI.getDailyPlan(date);
      setPlan(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const savePlan = async (updates) => {
    setSaving(true);
    try {
      const { data } = await plannerAPI.updateDailyPlan(date, { ...plan, ...updates });
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
    const goals = [...(plan?.goals || []), { text: newGoal.trim(), completed: false }];
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

  const changeDate = (offset) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().split('T')[0]);
  };

  const isToday = date === new Date().toISOString().split('T')[0];
  const dateObj = new Date(date + 'T00:00:00');
  const completedGoals = plan?.goals?.filter(g => g.completed).length || 0;
  const totalGoals = plan?.goals?.length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Daily Planner</h1>
          <p className="text-dark-400 text-sm mt-1">Plan your day, reflect on progress</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => changeDate(-1)} className="btn-ghost p-2"><HiChevronLeft size={20} /></button>
          <div className="text-center">
            <p className="text-white font-semibold">
              {dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            {isToday && <span className="text-xs text-primary-400">Today</span>}
          </div>
          <button onClick={() => changeDate(1)} className="btn-ghost p-2"><HiChevronRight size={20} /></button>
          {!isToday && (
            <button onClick={() => setDate(new Date().toISOString().split('T')[0])} className="btn-secondary text-sm">
              Today
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Goals Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Daily Goals</h2>
                {totalGoals > 0 && (
                  <span className="text-sm text-dark-400">
                    {completedGoals}/{totalGoals} completed
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {totalGoals > 0 && (
                <div className="w-full bg-dark-700 rounded-full h-2 mb-4">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-purple-500 rounded-full h-2 transition-all duration-500"
                    style={{ width: `${(completedGoals / totalGoals) * 100}%` }}
                  />
                </div>
              )}

              {/* Add Goal */}
              <div className="flex gap-2 mb-4">
                <input
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                  className="input-field flex-1"
                  placeholder="Add a goal for today..."
                />
                <button onClick={addGoal} className="btn-primary px-3"><HiPlus size={18} /></button>
              </div>

              {/* Goals List */}
              {plan?.goals?.length > 0 ? (
                <div className="space-y-2">
                  {plan.goals.map((goal, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${goal.completed ? 'bg-green-500/10 border border-green-500/20' : 'bg-dark-700'}`}>
                      <button onClick={() => toggleGoal(i)}
                        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${goal.completed ? 'bg-green-500 border-green-500 text-white' : 'border-dark-500 hover:border-primary-500'}`}>
                        {goal.completed && <HiCheckCircle size={14} />}
                      </button>
                      <span className={`flex-1 text-sm ${goal.completed ? 'line-through text-dark-500' : 'text-dark-200'}`}>
                        {goal.text}
                      </span>
                      <button onClick={() => removeGoal(i)} className="text-dark-500 hover:text-red-400 opacity-0 group-hover:opacity-100">
                        <HiTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-500 text-center py-8">No goals set for this day</p>
              )}
            </div>

            {/* Tasks for this day */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Tasks Due Today</h2>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="btn-primary text-sm flex items-center gap-1"
                >
                  <HiPlus size={16} /> New Task
                </button>
              </div>
              {plan?.tasks?.length > 0 ? (
                <div className="space-y-2">
                  {plan.tasks.map((task) => (
                    <div key={task._id} className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg">
                      <span className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' : task.status === 'in-progress' ? 'bg-yellow-500' : 'bg-dark-500'}`} />
                      <span className={`flex-1 text-sm ${task.status === 'completed' ? 'line-through text-dark-500' : 'text-dark-200'}`}>
                        {task.title}
                      </span>
                      <span className={`badge badge-${task.category || 'other'}`}>{task.category}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-500 text-center py-6">No tasks due on this date</p>
              )}
            </div>
          </div>

          {/* Sidebar - Mood & Reflection */}
          <div className="space-y-4">
            {/* Mood */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-3">How's your day?</h3>
              <div className="flex justify-between">
                {moods.map(m => (
                  <button
                    key={m.value}
                    onClick={() => savePlan({ mood: m.value })}
                    className={`text-2xl p-2 rounded-lg transition-all ${plan?.mood === m.value ? 'bg-primary-500/20 ring-2 ring-primary-500 scale-110' : 'hover:bg-dark-700'}`}
                    title={m.label}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Productivity Score */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-3">Productivity Score</h3>
              <input
                type="range" min="0" max="10" step="1"
                value={plan?.productivityScore ?? 5}
                onChange={(e) => savePlan({ productivityScore: parseInt(e.target.value) })}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-dark-500 mt-1">
                <span>0</span>
                <span className="text-lg text-primary-400 font-bold">{plan?.productivityScore ?? '-'}</span>
                <span>10</span>
              </div>
            </div>

            {/* Reflection */}
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-3">Daily Reflection</h3>
              <textarea
                value={plan?.reflection || ''}
                onChange={(e) => setPlan(prev => ({ ...prev, reflection: e.target.value }))}
                onBlur={() => savePlan({ reflection: plan?.reflection })}
                className="input-field h-32 resize-none text-sm"
                placeholder="What went well? What could improve? Key learnings..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showTaskModal && (
        <TaskModal
          task={null}
          defaultValues={{ dueDate: date }}
          onClose={() => setShowTaskModal(false)}
          onSaved={() => {
            setShowTaskModal(false);
            fetchPlan();
          }}
        />
      )}
    </div>
  );
}
