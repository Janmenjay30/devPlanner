import { create } from 'zustand';
import { taskAPI } from '../api';

const useTaskStore = create((set, get) => ({
  tasks: [],
  currentTask: null,
  loading: false,
  total: 0,
  filters: {
    status: '',
    category: '',
    priority: '',
    dueDate: '',
    search: '',
    sort: '-createdAt'
  },

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
  },

  fetchTasks: async (customFilters = {}) => {
    set({ loading: true });
    try {
      const filters = { ...get().filters, ...customFilters };
      const params = {};
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params[key] = val;
      });
      const { data } = await taskAPI.getAll(params);
      set({ tasks: data.tasks, total: data.total, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Fetch tasks error:', error);
    }
  },

  createTask: async (taskData) => {
    try {
      const { data } = await taskAPI.create(taskData);
      set((state) => ({ tasks: [data, ...state.tasks] }));
      return { success: true, task: data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to create task' };
    }
  },

  updateTask: async (id, taskData) => {
    try {
      const { data } = await taskAPI.update(id, taskData);
      set((state) => ({
        tasks: state.tasks.map(t => t._id === id ? data : t)
      }));
      return { success: true, task: data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to update task' };
    }
  },

  toggleSubtask: async (taskId, subtaskId) => {
    try {
      const { data } = await taskAPI.toggleSubtask(taskId, subtaskId);
      set((state) => ({
        tasks: state.tasks.map(t => t._id === taskId ? data : t)
      }));
    } catch (error) {
      console.error('Toggle subtask error:', error);
    }
  },

  deleteTask: async (id) => {
    try {
      await taskAPI.delete(id);
      set((state) => ({ tasks: state.tasks.filter(t => t._id !== id) }));
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  },

  completeTask: async (id) => {
    return get().updateTask(id, { status: 'completed' });
  }
}));

export default useTaskStore;
