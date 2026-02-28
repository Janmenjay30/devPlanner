import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useTaskStore from '../stores/taskStore';
import { taskAPI } from '../api';
import TaskModal from '../components/TaskModal';
import {
  HiPlus, HiSearch, HiFilter, HiTrash, HiPencil, HiCheckCircle,
  HiClock, HiDotsVertical, HiChevronDown, HiX
} from 'react-icons/hi';

const categories = ['', 'coding', 'study', 'project', 'placement', 'personal', 'health', 'other'];
const priorities = ['', 'low', 'medium', 'high', 'urgent'];
const statuses = ['', 'todo', 'in-progress', 'completed', 'cancelled'];
const dateFilters = ['', 'today', 'week', 'overdue'];

const categoryColors = {
  coding: 'badge-coding', study: 'badge-study', project: 'badge-project',
  placement: 'badge-placement', personal: 'badge-personal', health: 'badge-health', other: 'badge-other'
};

const priorityColors = {
  low: 'text-blue-400', medium: 'text-yellow-400', high: 'text-orange-400', urgent: 'text-red-400'
};

const statusIcons = {
  'todo': '⭕', 'in-progress': '🔄', 'completed': '✅', 'cancelled': '❌'
};

export default function Tasks() {
  const { tasks, loading, filters, fetchTasks, setFilters, deleteTask, updateTask } = useTaskStore();
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ search });
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowModal(true);
    setOpenMenu(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this task?')) {
      const result = await deleteTask(id);
      if (result.success) toast.success('Task deleted');
    }
    setOpenMenu(null);
  };

  const handleDeleteAllCompleted = async () => {
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    if (completedCount === 0) return toast('No completed tasks to delete', { icon: 'ℹ️' });
    if (window.confirm(`Delete all ${completedCount} completed task(s)?`)) {
      try {
        const { data } = await taskAPI.deleteAllCompleted();
        toast.success(data.message);
        fetchTasks();
      } catch {
        toast.error('Failed to delete completed tasks');
      }
    }
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    const result = await updateTask(task._id, { status: newStatus });
    if (result.success) {
      toast.success(newStatus === 'completed' ? 'Task completed! 🎉' : 'Task reopened');
    }
  };

  const clearFilters = () => {
    setFilters({ status: '', category: '', priority: '', dueDate: '', search: '' });
    setSearch('');
  };

  const hasActiveFilters = filters.status || filters.category || filters.priority || filters.dueDate || filters.search;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-dark-400 text-sm">{tasks.length} task{tasks.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          {tasks.some(t => t.status === 'completed') && (
            <button onClick={handleDeleteAllCompleted} className="btn-ghost text-red-400 hover:bg-red-500/10 inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-red-500/20">
              <HiTrash size={16} /> Clear Completed
            </button>
          )}
          <button onClick={handleCreateTask} className="btn-primary inline-flex items-center gap-2">
            <HiPlus size={18} /> New Task
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="input-field pl-10"
            />
          </form>
          <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary inline-flex items-center gap-2 ${showFilters ? 'border-primary-500 text-primary-400' : ''}`}>
            <HiFilter size={18} /> Filters <HiChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-ghost text-sm inline-flex items-center gap-1">
              <HiX size={16} /> Clear
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-dark-700">
            <select value={filters.status} onChange={(e) => setFilters({ status: e.target.value })} className="input-field text-sm">
              <option value="">All Statuses</option>
              {statuses.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filters.category} onChange={(e) => setFilters({ category: e.target.value })} className="input-field text-sm">
              <option value="">All Categories</option>
              {categories.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filters.priority} onChange={(e) => setFilters({ priority: e.target.value })} className="input-field text-sm">
              <option value="">All Priorities</option>
              {priorities.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filters.dueDate} onChange={(e) => setFilters({ dueDate: e.target.value })} className="input-field text-sm">
              <option value="">Any Date</option>
              {dateFilters.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-dark-400 text-lg">No tasks found</p>
          <p className="text-dark-500 text-sm mt-1">Create your first task to get started!</p>
          <button onClick={handleCreateTask} className="btn-primary mt-4 inline-flex items-center gap-2">
            <HiPlus size={18} /> Create Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task._id}
              className={`card-hover group flex items-start gap-4 p-4 ${task.status === 'completed' ? 'opacity-70' : ''}`}
            >
              {/* Completion toggle */}
              <button
                onClick={() => handleToggleComplete(task)}
                className={`mt-1 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  task.status === 'completed'
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-dark-500 hover:border-primary-500'
                }`}
              >
                {task.status === 'completed' && <HiCheckCircle size={16} />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-dark-500' : 'text-white'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-dark-400 mt-1 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                  {/* Menu */}
                  <div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === task._id ? null : task._id)}
                      className="text-dark-500 hover:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <HiDotsVertical size={18} />
                    </button>
                    {openMenu === task._id && (
                      <div className="absolute right-0 top-8 w-36 bg-dark-700 border border-dark-600 rounded-lg shadow-xl z-10 py-1">
                        <button onClick={() => handleEdit(task)} className="w-full px-4 py-2 text-left text-sm text-dark-200 hover:bg-dark-600 flex items-center gap-2">
                          <HiPencil size={14} /> Edit
                        </button>
                        <button onClick={() => handleDelete(task._id)} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-dark-600 flex items-center gap-2">
                          <HiTrash size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className={`badge ${categoryColors[task.category] || 'badge-other'}`}>{task.category}</span>
                  <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>{task.priority}</span>
                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-dark-400">
                      <HiClock size={12} />
                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {task.subtasks?.length > 0 && (
                    <span className="text-xs text-dark-500">
                      {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                    </span>
                  )}
                  {task.tags?.length > 0 && task.tags.map(tag => (
                    <span key={tag} className="text-xs text-dark-500 bg-dark-700 px-2 py-0.5 rounded">#{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={editingTask}
          onClose={() => { setShowModal(false); setEditingTask(null); }}
          onSaved={() => { setShowModal(false); setEditingTask(null); fetchTasks(); }}
        />
      )}
    </div>
  );
}
