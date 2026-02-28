import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useTaskStore from '../stores/taskStore';
import { HiX, HiPlus, HiTrash } from 'react-icons/hi';

const categories = ['coding', 'study', 'project', 'placement', 'personal', 'health', 'other'];
const priorities = ['low', 'medium', 'high', 'urgent'];
const statuses = ['todo', 'in-progress', 'completed', 'cancelled'];

export default function TaskModal({ task, onClose, onSaved, defaultValues = {} }) {
  const { createTask, updateTask } = useTaskStore();
  const isEditing = !!task;

  const [form, setForm] = useState({
    title: '', description: '', category: 'other', priority: 'medium', status: 'todo',
    dueDate: defaultValues.dueDate || '', dueTime: '', tags: '', subtasks: [], estimatedMinutes: '',
    notes: '', isRecurring: false, recurrence: ''
  });
  const [newSubtask, setNewSubtask] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        category: task.category || 'other',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        dueTime: task.dueTime || '',
        tags: task.tags?.join(', ') || '',
        subtasks: task.subtasks || [],
        estimatedMinutes: task.estimatedMinutes || '',
        notes: task.notes || '',
        isRecurring: task.isRecurring || false,
        recurrence: task.recurrence || ''
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setForm(prev => ({ ...prev, subtasks: [...prev.subtasks, { title: newSubtask.trim(), completed: false }] }));
    setNewSubtask('');
  };

  const removeSubtask = (index) => {
    setForm(prev => ({ ...prev, subtasks: prev.subtasks.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);

    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      estimatedMinutes: form.estimatedMinutes ? parseInt(form.estimatedMinutes) : null,
      dueDate: form.dueDate || null,
      recurrence: form.isRecurring ? form.recurrence : null
    };

    const result = isEditing
      ? await updateTask(task._id, payload)
      : await createTask(payload);

    setSaving(false);
    if (result.success) {
      toast.success(isEditing ? 'Task updated!' : 'Task created! 🎯');
      onSaved();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-dark-700 sticky top-0 bg-dark-800 z-10">
          <h2 className="text-xl font-bold text-white">{isEditing ? 'Edit Task' : 'Create New Task'}</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white p-1"><HiX size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Title *</label>
            <input name="title" value={form.title} onChange={handleChange} className="input-field" placeholder="What needs to be done?" required />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="input-field h-24 resize-none" placeholder="Add details..." />
          </div>

          {/* Category + Priority + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className="input-field">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="input-field">
                {priorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="input-field">
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Due Date</label>
              <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Due Time</label>
              <input type="time" name="dueTime" value={form.dueTime} onChange={handleChange} className="input-field" />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Tags (comma separated)</label>
            <input name="tags" value={form.tags} onChange={handleChange} className="input-field" placeholder="react, frontend, bug" />
          </div>

          {/* Estimated time */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Estimated Time (minutes)</label>
            <input type="number" name="estimatedMinutes" value={form.estimatedMinutes} onChange={handleChange} className="input-field" placeholder="e.g. 60" min="0" />
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-dark-300">
              <input type="checkbox" name="isRecurring" checked={form.isRecurring} onChange={handleChange} className="rounded bg-dark-700 border-dark-500 text-primary-500 focus:ring-primary-500" />
              Recurring Task
            </label>
            {form.isRecurring && (
              <select name="recurrence" value={form.recurrence} onChange={handleChange} className="input-field w-auto">
                <option value="">Select</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Subtasks</label>
            <div className="flex gap-2 mb-2">
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                className="input-field flex-1"
                placeholder="Add subtask..."
              />
              <button type="button" onClick={addSubtask} className="btn-secondary px-3"><HiPlus size={18} /></button>
            </div>
            {form.subtasks.length > 0 && (
              <div className="space-y-2">
                {form.subtasks.map((st, i) => (
                  <div key={i} className="flex items-center gap-2 bg-dark-700 rounded-lg px-3 py-2">
                    <span className="flex-1 text-sm text-dark-300">{st.title}</span>
                    <button type="button" onClick={() => removeSubtask(i)} className="text-dark-500 hover:text-red-400"><HiTrash size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} className="input-field h-20 resize-none" placeholder="Additional notes..." />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-700">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
