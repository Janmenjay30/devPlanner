import { useState, useRef, useEffect, useCallback } from 'react';
import { HiSparkles, HiX, HiPaperAirplane, HiRefresh, HiCheckCircle, HiExclamationCircle, HiTrash, HiClipboardList, HiMicrophone, HiStop } from 'react-icons/hi';
import { aiAPI } from '../api';
import toast from 'react-hot-toast';

// Voice recognition hook
const useVoiceInput = (onResult) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('');
        const isFinal = event.results[event.results.length - 1].isFinal;
        onResult(transcript, isFinal);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'aborted') {
          toast.error(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onResult]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Start listening error:', err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, isSupported, startListening, stopListening };
};

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [aiHistory, setAiHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Voice input
  const handleVoiceResult = useCallback((transcript, isFinal) => {
    setMessage(transcript);
    if (isFinal && inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const { isListening, isSupported: voiceSupported, startListening, stopListening } = useVoiceInput(handleVoiceResult);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');

    // Add user message to chat
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data } = await aiAPI.chat(userMessage, aiHistory);
      
      // Add AI response to chat
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: data.message,
        action: data.action,
        data: data.data,
        success: data.success
      }]);

      // Update AI conversation history for context
      setAiHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text: userMessage }] },
        { role: 'model', parts: [{ text: JSON.stringify(data) }] }
      ]);

      if (data.action && data.action !== 'CHAT' && data.success) {
        toast.success('Action completed successfully!');
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to process your request';
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: errMsg,
        success: false 
      }]);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    setAiHistory([]);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE_TASK':
      case 'CREATE_MULTIPLE_TASKS':
        return <HiClipboardList className="text-green-400" />;
      case 'COMPLETE_TASK':
        return <HiCheckCircle className="text-blue-400" />;
      case 'DELETE_TASK':
        return <HiTrash className="text-red-400" />;
      default:
        return <HiSparkles className="text-purple-400" />;
    }
  };

  const renderActionResult = (msg) => {
    if (!msg.action || msg.action === 'CHAT') return null;

    return (
      <div className="mt-2 p-2 rounded-lg bg-dark-700/50 border border-dark-600 text-xs">
        <div className="flex items-center gap-1.5 mb-1">
          {getActionIcon(msg.action)}
          <span className="text-dark-300 font-medium">
            {msg.action.replace(/_/g, ' ')}
          </span>
          {msg.success ? (
            <span className="ml-auto text-green-400 flex items-center gap-0.5">
              <HiCheckCircle size={12} /> Done
            </span>
          ) : (
            <span className="ml-auto text-red-400 flex items-center gap-0.5">
              <HiExclamationCircle size={12} /> Failed
            </span>
          )}
        </div>

        {/* Show created tasks */}
        {msg.data?.task && (
          <div className="text-dark-300 mt-1">
            <span className="text-dark-400">Task:</span> {msg.data.task.title}
            {msg.data.task.priority && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium
                ${msg.data.task.priority === 'high' ? 'bg-red-500/20 text-red-400' : 
                  msg.data.task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                  'bg-green-500/20 text-green-400'}`}>
                {msg.data.task.priority}
              </span>
            )}
          </div>
        )}

        {/* Show multiple tasks */}
        {msg.data?.tasks && Array.isArray(msg.data.tasks) && (
          <div className="text-dark-300 mt-1 space-y-0.5">
            {msg.data.tasks.map((t, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-dark-500">•</span> {t.title || t}
              </div>
            ))}
          </div>
        )}

        {/* Show task list */}
        {msg.action === 'LIST_TASKS' && msg.data?.tasks && (
          <div className="text-dark-300 mt-1 space-y-0.5 max-h-32 overflow-y-auto">
            {msg.data.tasks.length === 0 ? (
              <span className="text-dark-500">No tasks found</span>
            ) : msg.data.tasks.map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  t.status === 'completed' ? 'bg-green-400' : 
                  t.status === 'in-progress' ? 'bg-yellow-400' : 'bg-dark-500'
                }`} />
                <span className="truncate">{t.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* Show stats */}
        {msg.action === 'GET_STATS' && msg.data?.stats && (
          <div className="text-dark-300 mt-1 grid grid-cols-2 gap-1">
            {Object.entries(msg.data.stats).map(([key, value]) => (
              <div key={key}>
                <span className="text-dark-500">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                <span className="text-dark-200">{typeof value === 'object' ? JSON.stringify(value) : value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const suggestions = [
    "Create a task to finish portfolio website by Friday",
    "Show my pending tasks",
    "Add 3 tasks for my React project",
    "Mark my latest task as complete",
    "What's my productivity this week?",
    "Delete all completed tasks"
  ];

  return (
    <>
      {/* Floating AI Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center 
          justify-center transition-all duration-300 hover:scale-110 group
          ${isOpen 
            ? 'bg-dark-700 text-dark-300 hover:text-white rotate-0' 
            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500'
          }`}
      >
        {isOpen ? (
          <HiX size={24} />
        ) : (
          <>
            <HiSparkles size={24} />
            <span className="absolute -top-8 right-0 bg-dark-700 text-dark-200 text-xs px-2 py-1 rounded 
              opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              AI Assistant
            </span>
          </>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] h-[560px] bg-dark-800 rounded-2xl 
          shadow-2xl border border-dark-700 flex flex-col overflow-hidden animate-fade-in">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700 
            bg-gradient-to-r from-purple-600/10 to-blue-600/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 
                flex items-center justify-center">
                <HiSparkles className="text-white" size={16} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">DevPlanner AI</h3>
                <p className="text-dark-400 text-[10px]">Powered by Gemini</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="text-dark-400 hover:text-dark-200 transition-colors p-1.5 rounded-lg 
                hover:bg-dark-700"
              title="Clear chat"
            >
              <HiRefresh size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-dark-600">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 
                  flex items-center justify-center mb-4">
                  <HiSparkles className="text-purple-400" size={28} />
                </div>
                <h4 className="text-white font-medium mb-1">Hey! I'm your AI Assistant</h4>
                <p className="text-dark-400 text-sm mb-4">
                  I can create tasks, manage your plans, and more. Just ask!
                </p>
                <div className="w-full space-y-2">
                  <p className="text-dark-500 text-xs font-medium uppercase tracking-wider">Try saying:</p>
                  {suggestions.slice(0, 4).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setMessage(s); inputRef.current?.focus(); }}
                      className="w-full text-left text-xs text-dark-300 hover:text-white px-3 py-2 
                        rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors border 
                        border-dark-700 hover:border-dark-600"
                    >
                      "{s}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.role === 'user' 
                    ? 'bg-purple-600/20 border border-purple-500/20 text-dark-100' 
                    : 'bg-dark-700 border border-dark-600 text-dark-200'
                  } rounded-2xl px-3.5 py-2.5 text-sm`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <HiSparkles size={12} className="text-purple-400" />
                        <span className="text-[10px] text-purple-400 font-medium">AI</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    {msg.role === 'assistant' && renderActionResult(msg)}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-dark-700 border border-dark-600 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <HiSparkles size={12} className="text-purple-400" />
                    <span className="text-[10px] text-purple-400 font-medium">AI</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-dark-700 bg-dark-800">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? '🎤 Listening...' : 'Ask me anything...'}
                rows={1}
                className={`flex-1 bg-dark-700 border rounded-xl px-3.5 py-2.5 text-sm 
                  text-white placeholder-dark-500 focus:outline-none focus:border-purple-500/50 
                  resize-none max-h-24 scrollbar-thin ${isListening ? 'border-red-500/50 bg-red-500/5' : 'border-dark-600'}`}
                style={{ minHeight: '40px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
                }}
              />
              {/* Voice Input Button */}
              {voiceSupported && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0
                    ${isListening 
                      ? 'bg-red-500 text-white animate-pulse hover:bg-red-600' 
                      : 'bg-dark-700 text-dark-400 hover:text-white hover:bg-dark-600 border border-dark-600'
                    }`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  {isListening ? <HiStop size={16} /> : <HiMicrophone size={16} />}
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 
                  text-white flex items-center justify-center hover:from-purple-500 hover:to-blue-500 
                  transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <HiPaperAirplane size={16} className="rotate-90" />
              </button>
            </div>
            <p className="text-[10px] text-dark-600 mt-1.5 text-center">
              AI can make mistakes. Verify important actions.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;
