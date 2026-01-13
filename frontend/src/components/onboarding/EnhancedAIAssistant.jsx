import { useState, useEffect, useRef } from 'react';
import aiAssistantService from '../../services/aiAssistantService';

export default function EnhancedAIAssistant({ 
  currentPhase, 
  employee, 
  employeeFormCompleted, 
  onActionClick 
}) {
  const [chatHistory, setChatHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize chat with welcome message and suggestions
  useEffect(() => {
    initializeChat();
  }, [currentPhase, employee]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  const initializeChat = async () => {
    const welcomeMessage = getWelcomeMessage();
    setChatHistory([{ 
      sender: 'assistant', 
      text: welcomeMessage.text,
      timestamp: new Date(),
      type: 'welcome'
    }]);

    // Load contextual suggestions
    await loadSuggestions();
  };

  const getWelcomeMessage = () => {
    const name = employee?.first_name || 'there';
    const phaseNames = {
      1: 'Pre-Boarding',
      2: 'Day 1 Initiation',
      3: 'Parallel Tracks',
      4: 'Induction Training', 
      5: 'HR Activation',
      6: 'Monitoring & Support'
    };

    const currentPhaseName = phaseNames[currentPhase] || 'Onboarding';

    return {
      text: `Hi ${name}! 👋 I'm your AI Onboarding Assistant. You're currently in Phase ${currentPhase}: ${currentPhaseName}. 

I can help you with:
• Document requirements and verification
• IT setup and equipment status  
• Employee form completion
• Training modules and schedules
• General onboarding questions

What would you like to know?`,
      suggestions: [
        "What do I need to do next?",
        "Help with employee form",
        "IT setup status",
        "Document requirements"
      ]
    };
  };

  const loadSuggestions = async () => {
    try {
      const context = {
        currentPhase,
        employeeStatus: employee?.status,
        employeeFormCompleted,
        itSetupStatus: employee?.it_setup_status
      };

      const result = await aiAssistantService.getSuggestions(context);
      setSuggestions(result.suggestions || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestions(aiAssistantService.getContextualSuggestions({
        currentPhase,
        employeeFormCompleted
      }));
    }
  };

  const handleSendMessage = async (messageText = null) => {
    const message = messageText || currentMessage.trim();
    if (!message) return;

    // Add user message to chat
    const userMessage = {
      sender: 'user',
      text: message,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Prepare context for AI
      const context = {
        currentPhase,
        employeeStatus: employee?.status,
        employeeFormCompleted,
        itSetupStatus: employee?.it_setup_status,
        employeeName: employee?.first_name,
        isImmediateJoiner: employee?.is_immediate_joiner
      };

      // Send message with typing simulation
      const response = await aiAssistantService.sendMessageWithTyping(
        message, 
        context,
        setIsTyping
      );

      // Add assistant response to chat
      const assistantMessage = {
        sender: 'assistant',
        text: aiAssistantService.formatResponse(response),
        timestamp: new Date(),
        data: response.data,
        suggestions: response.suggestions || []
      };

      setChatHistory(prev => [...prev, assistantMessage]);

      // Update suggestions based on response
      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }

      // Handle any action triggers
      handleActionTriggers(response);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message with helpful fallback
      const errorMessage = {
        sender: 'assistant',
        text: "I'm having trouble connecting right now, but I can still help! Try asking about specific topics like 'documents needed', 'IT setup', or 'employee form'.",
        timestamp: new Date(),
        type: 'error'
      };

      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleActionTriggers = (response) => {
    if (!response.data || !onActionClick) return;

    // Trigger specific actions based on AI response
    if (response.data.action === 'open_employee_form') {
      setTimeout(() => onActionClick('employee_form'), 1000);
    } else if (response.data.action === 'show_it_resources') {
      setTimeout(() => onActionClick('it_resources'), 1000);
    } else if (response.data.action === 'view_timeline') {
      setTimeout(() => onActionClick('timeline'), 1000);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageIcon = (message) => {
    if (message.sender === 'user') return '👤';
    if (message.type === 'welcome') return '👋';
    if (message.type === 'error') return '⚠️';
    return '🤖';
  };

  const getPhaseProgress = () => {
    const progress = (currentPhase / 6) * 100;
    return Math.min(progress, 100);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50' : 'h-96'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🤖</span>
            <div>
              <h3 className="font-semibold text-sm">AI Onboarding Assistant</h3>
              <div className="flex items-center space-x-2 text-xs opacity-90">
                <span>Phase {currentPhase}/6</span>
                <div className="w-16 bg-white/20 rounded-full h-1">
                  <div 
                    className="bg-white h-1 rounded-full transition-all duration-500"
                    style={{ width: `${getPhaseProgress()}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {isTyping && (
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white/80 hover:text-white text-lg"
            >
              {isExpanded ? '🗗' : '🗖'}
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className={`overflow-y-auto bg-gray-50 ${isExpanded ? 'flex-1' : 'h-64'}`}>
        <div className="p-3 space-y-3">
          {chatHistory.map((message, index) => (
            <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
                message.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : message.type === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
              }`}>
                <div className="flex items-start space-x-2">
                  <span className="text-sm">{getMessageIcon(message)}</span>
                  <div className="flex-1">
                    <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                    <div className={`text-xs mt-1 opacity-70 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">🤖</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Quick Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-2 border-t bg-white">
          <div className="flex flex-wrap gap-1">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t bg-white">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your onboarding..."
            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!currentMessage.trim() || isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </div>

      {/* Expanded Mode Overlay */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}