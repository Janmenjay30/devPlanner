import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { token } = useAuthStore();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Connect to socket server
    const socket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    // Real-time notification toast
    socket.on('notification:new', (notification) => {
      toast(notification.message || 'New notification', {
        icon: '🔔',
        duration: 4000
      });
    });

    // Task events with toast feedback
    socket.on('task:created', (task) => {
      toast.success(`Task "${task.title}" created`, { icon: '✅', duration: 2000 });
    });

    socket.on('task:completed', (task) => {
      toast.success(`Task "${task.title}" completed!`, { icon: '🎉', duration: 3000 });
    });

    socket.on('habit:toggled', (habit) => {
      toast(`Habit "${habit.title}" updated`, { icon: '🔄', duration: 2000 });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token]);

  // Subscribe to a specific event
  const subscribe = useCallback((event, callback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(event, callback);

    return () => {
      socketRef.current?.off(event, callback);
    };
  }, []);

  // Emit an event
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const value = {
    socket: socketRef.current,
    isConnected,
    subscribe,
    emit
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
