import { useState, useEffect, useCallback, useMemo } from 'react';
import { taskAPI, habitAPI } from '../api';
import { HiChevronLeft, HiChevronRight, HiCalendar, HiViewGrid, HiClock } from 'react-icons/hi';

const categoryColors = {
  coding: '#3b82f6', study: '#22c55e', project: '#a855f7',
  placement: '#eab308', personal: '#ec4899', health: '#14b8a6', other: '#6b7280'
};

const priorityBorders = {
  urgent: 'border-l-red-500', high: 'border-l-orange-500',
  medium: 'border-l-yellow-500', low: 'border-l-blue-500'
};

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month | week
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [taskRes, habitRes] = await Promise.all([
        taskAPI.getAll({ limit: 500 }),
        habitAPI.getAll().catch(() => ({ data: [] }))
      ]);
      setTasks(taskRes.data.tasks || taskRes.data || []);
      setHabits(habitRes.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const lastDayPrevMonth = new Date(year, month, 0).getDate();

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const navigate = (direction) => {
    const d = new Date(currentDate);
    if (view === 'month') {
      d.setMonth(d.getMonth() + direction);
    } else {
      d.setDate(d.getDate() + direction * 7);
    }
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  // Build task map: date string -> tasks[]
  const taskMap = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      if (t.dueDate) {
        const dateStr = new Date(t.dueDate).toISOString().split('T')[0];
        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(t);
      }
    });
    return map;
  }, [tasks]);

  // Build habit completion map
  const habitMap = useMemo(() => {
    const map = {};
    habits.forEach(h => {
      h.completions?.forEach(c => {
        if (!map[c.date]) map[c.date] = [];
        map[c.date].push({ ...h, completionDate: c.date });
      });
    });
    return map;
  }, [habits]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Get week dates
  const getWeekDates = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  // Build month grid
  const buildMonthGrid = () => {
    const cells = [];

    // Previous month trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = lastDayPrevMonth - i;
      const d = new Date(year, month - 1, day);
      cells.push({ date: d, day, isCurrentMonth: false });
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      cells.push({ date: d, day, isCurrentMonth: true });
    }

    // Next month leading days
    const remainingCells = 42 - cells.length;
    for (let day = 1; day <= remainingCells; day++) {
      const d = new Date(year, month + 1, day);
      cells.push({ date: d, day, isCurrentMonth: false });
    }

    return cells;
  };

  const cells = buildMonthGrid();
  const weekDates = getWeekDates();

  const renderDayTasks = (dateStr, compact = true) => {
    const dayTasks = taskMap[dateStr] || [];
    const dayHabits = habitMap[dateStr] || [];

    if (compact) {
      const items = [...dayTasks.slice(0, 3)];
      const moreCount = dayTasks.length - 3 + dayHabits.length;

      return (
        <div className="space-y-0.5 mt-1">
          {items.map(t => (
            <div key={t._id} className={`text-[10px] px-1 py-0.5 rounded truncate border-l-2 ${priorityBorders[t.priority] || 'border-l-dark-500'}`}
              style={{ backgroundColor: (categoryColors[t.category] || '#6b7280') + '20', color: categoryColors[t.category] || '#9ca3af' }}>
              {t.title}
            </div>
          ))}
          {dayHabits.length > 0 && compact && (
            <div className="flex gap-0.5">
              {dayHabits.slice(0, 4).map((h, i) => (
                <span key={i} className="text-[10px]">{h.icon}</span>
              ))}
            </div>
          )}
          {moreCount > 0 && items.length >= 3 && (
            <span className="text-[10px] text-dark-500">+{moreCount} more</span>
          )}
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HiCalendar className="text-primary-400" /> Calendar
          </h1>
          <p className="text-dark-400 mt-1">Visualize your tasks and habits</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-dark-700 rounded-lg p-0.5">
            <button onClick={() => setView('month')} className={`px-3 py-1.5 rounded-md text-sm transition-all ${view === 'month' ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-white'}`}>
              <HiViewGrid size={16} className="inline mr-1" /> Month
            </button>
            <button onClick={() => setView('week')} className={`px-3 py-1.5 rounded-md text-sm transition-all ${view === 'week' ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-white'}`}>
              <HiClock size={16} className="inline mr-1" /> Week
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="card flex items-center justify-between py-3 px-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-all">
          <HiChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">{monthName}</h2>
          <button onClick={goToday} className="text-xs text-primary-400 hover:text-primary-300 bg-primary-500/10 px-2 py-1 rounded">Today</button>
        </div>
        <button onClick={() => navigate(1)} className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-all">
          <HiChevronRight size={20} />
        </button>
      </div>

      {/* Month View */}
      {view === 'month' && (
        <div className="card p-2 sm:p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs text-dark-500 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              const dateStr = cell.date.toISOString().split('T')[0];
              const isToday = dateStr === todayStr;
              const isSelected = selectedDate === dateStr;
              const hasTasks = (taskMap[dateStr]?.length || 0) > 0;
              const hasHabits = (habitMap[dateStr]?.length || 0) > 0;

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`min-h-[80px] sm:min-h-[100px] p-1.5 rounded-lg cursor-pointer transition-all border
                    ${cell.isCurrentMonth ? 'bg-dark-800' : 'bg-dark-800/30'}
                    ${isToday ? 'border-primary-500/50' : isSelected ? 'border-primary-500/30' : 'border-transparent'}
                    ${cell.isCurrentMonth ? 'hover:border-dark-600' : ''}
                  `}
                >
                  <div className={`text-xs font-medium mb-0.5 ${
                    isToday ? 'text-primary-400' : cell.isCurrentMonth ? 'text-dark-300' : 'text-dark-600'
                  }`}>
                    {isToday ? (
                      <span className="bg-primary-600 text-white w-5 h-5 rounded-full inline-flex items-center justify-center text-[11px]">{cell.day}</span>
                    ) : cell.day}
                  </div>
                  {cell.isCurrentMonth && (hasTasks || hasHabits) && renderDayTasks(dateStr)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="card p-2 sm:p-4">
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, i) => {
              const dateStr = date.toISOString().split('T')[0];
              const isToday = dateStr === todayStr;
              const dayTasks = taskMap[dateStr] || [];
              const dayHabits = habitMap[dateStr] || [];

              return (
                <div key={i} className={`rounded-xl border p-3 min-h-[300px] ${isToday ? 'border-primary-500/50 bg-primary-500/5' : 'border-dark-700'}`}>
                  <div className="text-center mb-3">
                    <p className="text-xs text-dark-500">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <p className={`text-lg font-bold ${isToday ? 'text-primary-400' : 'text-white'}`}>{date.getDate()}</p>
                  </div>

                  <div className="space-y-1.5">
                    {dayTasks.map(t => (
                      <div key={t._id} className={`text-xs p-2 rounded-lg border-l-2 ${priorityBorders[t.priority] || 'border-l-dark-500'}`}
                        style={{ backgroundColor: (categoryColors[t.category] || '#6b7280') + '15' }}>
                        <p className="text-dark-200 font-medium truncate">{t.title}</p>
                        {t.dueTime && <p className="text-dark-500 text-[10px] mt-0.5">{t.dueTime}</p>}
                        <span className="text-[10px] capitalize" style={{ color: categoryColors[t.category] }}>{t.category}</span>
                      </div>
                    ))}
                    {dayHabits.map((h, j) => (
                      <div key={j} className="text-xs p-1.5 rounded-lg bg-green-500/10 flex items-center gap-1">
                        <span>{h.icon}</span>
                        <span className="text-green-400 truncate">{h.title}</span>
                      </div>
                    ))}
                    {dayTasks.length === 0 && dayHabits.length === 0 && (
                      <p className="text-[10px] text-dark-600 text-center mt-8">No items</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Date Detail */}
      {selectedDate && (
        <div className="card">
          <h3 className="text-white font-semibold mb-3">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          <div className="space-y-2">
            {(taskMap[selectedDate] || []).map(t => (
              <div key={t._id} className={`flex items-center gap-3 p-3 rounded-lg bg-dark-700/50 border-l-2 ${priorityBorders[t.priority]}`}>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${t.status === 'completed' ? 'text-green-400 line-through' : 'text-dark-200'}`}>{t.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge" style={{ backgroundColor: (categoryColors[t.category] || '#6b7280') + '20', color: categoryColors[t.category] }}>{t.category}</span>
                    <span className="text-xs text-dark-500">{t.priority}</span>
                    {t.dueTime && <span className="text-xs text-dark-500">{t.dueTime}</span>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  t.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  t.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-dark-600 text-dark-400'
                }`}>{t.status}</span>
              </div>
            ))}
            {(habitMap[selectedDate] || []).map((h, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10">
                <span className="text-xl">{h.icon}</span>
                <p className="text-sm text-green-400">{h.title} <span className="text-dark-500">— completed</span></p>
              </div>
            ))}
            {!(taskMap[selectedDate]?.length) && !(habitMap[selectedDate]?.length) && (
              <p className="text-dark-500 text-sm text-center py-4">Nothing scheduled for this day</p>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="card py-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-dark-500 font-medium">Categories:</span>
          {Object.entries(categoryColors).map(([cat, color]) => (
            <span key={cat} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-dark-400 capitalize">{cat}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
